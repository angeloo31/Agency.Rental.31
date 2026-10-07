import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { differenceInHours } from 'date-fns';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import ExtraOption from '../models/ExtraOption.js';
import { requireAuth, requireAdmin, requirePermission } from '../middleware/auth.js';
import { logAction } from '../utils/auditLogger.js';

const router = express.Router();



/**
 * Calculates the rental cost and add-on cost entirely on the server using the
 * vehicle record pulled from MongoDB. Any client-supplied price is never read.
 *
 * @param {object} vehicle   - Mongoose Vehicle document
 * @param {Date}   start     - Pickup datetime
 * @param {Date}   end       - Return datetime
 * @param {Array}  addOns    - Array of addon label strings, e.g. ['GPS', 'Helmet']
 * @param {string} rentalType - 'hour', 'halfDay', 'day'
 * @returns {Promise<{ rentalCost: number, addOnsCost: number, totalPrice: number, durationCount: number, rentalType: string }>}
 */
async function computeServerPrice(vehicle, start, end, addOns, rentalType, withDriver) {
  let durationCount;
  let rentalCost;

  // Fallback for rentalType if not specified or invalid
  let type = rentalType;
  if (!['hour', 'halfDay', 'day'].includes(type)) {
    type = vehicle.category === 'JetSki' ? 'hour' : 'day';
  }

  const hoursDiff = differenceInHours(end, start);

  if (type === 'hour') {
    const hours = Math.max(1, hoursDiff);
    durationCount = hours;
    rentalCost = hours * (vehicle.pricePerHour || 0);
  } else if (type === 'halfDay') {
    const halfDays = Math.max(1, Math.ceil(hoursDiff / 12));
    durationCount = halfDays;
    // Use pricePerHalfDay, or fallback to pricePerHour * 6, or pricePerDay / 2
    rentalCost = halfDays * (vehicle.pricePerHalfDay || (vehicle.pricePerHour ? vehicle.pricePerHour * 6 : 0) || (vehicle.pricePerDay ? vehicle.pricePerDay / 2 : 0));
  } else {
    // day
    const days = Math.max(1, Math.ceil(hoursDiff / 24));
    durationCount = days;
    rentalCost = days * (vehicle.pricePerDay || 0);
  }

  // Apply discount to rental cost if applicable
  if (vehicle.discount && vehicle.discount.percentage > 0) {
    const discountAmount = rentalCost * (vehicle.discount.percentage / 100);
    rentalCost = Math.max(0, rentalCost - discountAmount);
  }

  // Add-ons are priced per rental unit for daily/half-daily vehicles, flat for JetSkis/hourly rentals
  const isDailyOrHalfDaily = type === 'day' || type === 'halfDay';
  const addonMultiplier = (vehicle.category !== 'JetSki' && isDailyOrHalfDaily) ? durationCount : 1;

  let addOnsCost = 0;
  if (Array.isArray(addOns) && addOns.length > 0) {
    const activeOptions = await ExtraOption.find({ name: { $in: addOns }, isActive: true });
    
    for (const option of activeOptions) {
      const price = option.price || 0;
      if (option.priceType === 'per_day') {
        addOnsCost += price * addonMultiplier;
      } else {
        addOnsCost += price;
      }
    }
  }

  let driverCost = 0;
  if (withDriver && vehicle.driverOption && vehicle.driverOption.available) {
    const pricePerDay = vehicle.driverOption.pricePerDay || 0;
    if (type === 'day') {
      driverCost = pricePerDay * durationCount;
    } else if (type === 'halfDay') {
      driverCost = (pricePerDay / 2) * durationCount;
    } else {
      driverCost = (pricePerDay / 24) * durationCount;
    }
  }

  return {
    rentalCost,
    addOnsCost,
    driverCost,
    totalPrice: rentalCost + addOnsCost + driverCost,
    durationCount,
    rentalType: type
  };
}

// ── POST /api/bookings ────────────────────────────────────────────────────────
// Creates a booking. The totalPrice is ALWAYS computed server-side.
// Any 'totalPrice' field sent by the client is stripped before processing.
router.post(
  '/',
  [
    body('guestName').trim().escape(),
    body('guestEmail').isEmail().normalizeEmail(),
    body('guestPhone').trim().escape(),
    body('pickupLocation').trim().escape()
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input data.', details: errors.array() });
    }

    // Destructure fields from the client.
    const {
      vehicleId,
      pickupDate,
      returnDate,
      addOns,
      guestName,
      guestEmail,
      guestPhone,
      pickupLocation,
      rentalType,
      withDriver,
      includeCaution,
      cautionAmount,
    } = req.body;

    // ── Input presence validation ─────────────────────────────────────────
    if (!vehicleId || !pickupDate || !returnDate || !guestName || !guestEmail || !guestPhone || !pickupLocation) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    // ── vehicleId format guard (prevents CastError from reaching Mongoose) ─
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({ error: 'Invalid vehicle ID format.' });
    }

    // ── Date validation ───────────────────────────────────────────────────
    const start = new Date(pickupDate);
    const end   = new Date(returnDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format provided.' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'Return date must be after pickup date.' });
    }

    // ── Pull vehicle from DB — server trusts only its own data ────────────
    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    if (vehicle.status !== 'Available') {
      return res.status(409).json({ error: 'This vehicle is not currently available for rental.' });
    }

    // ── Check Unavailability Dates ────────────────────────────────────────
    if (vehicle.unavailabilityDates && vehicle.unavailabilityDates.length > 0) {
      const isUnavailable = vehicle.unavailabilityDates.some(period => {
        const pStart = new Date(period.start);
        const pEnd = new Date(period.end);
        // Overlap condition: requested start < period end AND requested end > period start
        return start < pEnd && end > pStart;
      });

      if (isUnavailable) {
        return res.status(409).json({ error: 'The vehicle is unavailable during the selected dates.' });
      }
    }

    // ── Server-side price computation (tamper-proof) ──────────────────────
    const { totalPrice, rentalType: calculatedRentalType } = await computeServerPrice(vehicle, start, end, addOns, rentalType, withDriver);

    // ── Write to database ─────────────────────────────────────────────────
    const booking = await Booking.create({
      vehicleId,
      pickupDate:    start,
      returnDate:    end,
      addOns:        Array.isArray(addOns) ? addOns : [],
      rentalType:    calculatedRentalType,
      guestName:     guestName.trim(),
      guestEmail:    guestEmail.trim().toLowerCase(),
      guestPhone:    guestPhone.trim(),
      pickupLocation,
      withDriver:    !!withDriver,
      includeCaution: !!includeCaution,
      cautionAmount:  includeCaution ? (vehicle.securityDeposit || cautionAmount || 0) : 0,
      totalPrice,           // ← server-computed, never from req.body
      paymentStatus:  'Pay On-Site',
      bookingStatus:  'Pending',
    });

    await logAction({
      req,
      action: 'CREATE_BOOKING',
      resource: 'Booking',
      details: `Réservation créée pour ${booking.guestName} (${vehicle.title || vehicle.make || 'Véhicule'}) - Total: ${totalPrice} DA`
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('[Bookings] POST error:', error.message);
    res.status(500).json({ error: 'Booking could not be created.' });
  }
});

// ── GET /api/bookings ────────────────────────────────────────────────────────
router.get('/', requireAuth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const bookings = await Booking.find().populate('vehicleId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('[Bookings] GET error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
});

// ── PATCH /api/bookings/:id/status ───────────────────────────────────────────
// Only allows transitions to valid enum values. Does not accept arbitrary fields.
router.patch('/:id/status', requireAuth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking ID format.' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: status },
      { new: true, runValidators: true }
    ).populate('vehicleId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    await logAction({
      req,
      action: 'UPDATE_BOOKING_STATUS',
      resource: 'Booking',
      details: `Réservation #${booking._id} (${booking.guestName}) modifiée → Statut: ${status}`
    });

    res.json(booking);
  } catch (error) {
    console.error('[Bookings] PATCH error:', error.message);
    res.status(500).json({ error: 'Failed to update booking status.' });
  }
});

// ── PUT /api/bookings/:id ────────────────────────────────────────────────────
// Updates all details of a booking, recalculating price server-side
router.put(
  '/:id', 
  requireAuth, 
  requirePermission('manage_bookings'), 
  [
    body('guestName').trim().escape(),
    body('guestEmail').isEmail().normalizeEmail(),
    body('guestPhone').trim().escape(),
    body('pickupLocation').trim().escape()
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input data.', details: errors.array() });
    }

    const {
      vehicleId,
      pickupDate,
      returnDate,
      addOns,
      guestName,
      guestEmail,
      guestPhone,
      pickupLocation,
      rentalType,
      withDriver,
      bookingStatus,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking ID format.' });
    }

    // Input presence validation
    if (!vehicleId || !pickupDate || !returnDate || !guestName || !guestEmail || !guestPhone || !pickupLocation) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({ error: 'Invalid vehicle ID format.' });
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format provided.' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'Return date must be after pickup date.' });
    }

    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    // Compute price entirely on the server
    const { totalPrice, rentalType: calculatedRentalType } = await computeServerPrice(vehicle, start, end, addOns, rentalType, withDriver);

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        vehicleId,
        pickupDate: start,
        returnDate: end,
        addOns: Array.isArray(addOns) ? addOns : [],
        rentalType: calculatedRentalType,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim().toLowerCase(),
        guestPhone: guestPhone.trim(),
        pickupLocation,
        withDriver: !!withDriver,
        totalPrice,
        bookingStatus: bookingStatus || 'Pending',
      },
      { new: true, runValidators: true }
    ).populate('vehicleId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    res.json(booking);
  } catch (error) {
    console.error('[Bookings] PUT error:', error.message);
    res.status(500).json({ error: 'Booking could not be updated.' });
  }
});

export default router;
