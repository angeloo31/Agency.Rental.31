'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Search, Filter, Plus, User, Phone, Mail, Clock, Car, 
  CheckCircle2, AlertCircle, XCircle, Info, Sparkles, RefreshCcw
} from 'lucide-react';

interface Booking {
  _id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  vehicleId?: any;
  vehicleTitle?: string;
  vehicleCategory?: string;
  pickupDate: string;
  returnDate: string;
  totalPrice?: number;
  bookingStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | string;
  pickupLocation?: string;
}

interface Vehicle {
  _id: string;
  title?: string;
  make?: string;
  model?: string;
  category?: string;
  images?: string[];
  image?: string;
  status?: string;
  pricePerDay?: number;
}

interface CalendarTabProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  categories: any[];
  onOpenEditBooking: (booking: Booking) => void;
  onOpenNewBookingWithVehicleAndDate?: (vehicleId: string, dateStr: string) => void;
  onOpenNewBooking: () => void;
}

export default function CalendarTab({
  bookings,
  vehicles,
  categories,
  onOpenEditBooking,
  onOpenNewBookingWithVehicleAndDate,
  onOpenNewBooking,
}: CalendarTabProps) {
  // Calendar Date State (default: current month/year)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'gantt' | 'month'>('gantt');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected Hover/Clicked Booking for Details Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);

  // Handle Gantt Drag & Drop Rescheduling
  const handleBookingDrop = (targetVehicleId: string, targetDateIso: string) => {
    if (!draggedBooking) return;

    const start = new Date(draggedBooking.pickupDate);
    const end = new Date(draggedBooking.returnDate);
    const durationMs = end.getTime() - start.getTime();

    const newStart = new Date(targetDateIso);
    // Keep pickup time of original booking
    newStart.setHours(start.getHours(), start.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + (isNaN(durationMs) ? 86400000 : durationMs));

    const updatedBooking: Booking = {
      ...draggedBooking,
      vehicleId: targetVehicleId,
      pickupDate: newStart.toISOString(),
      returnDate: newEnd.toISOString()
    };

    setDraggedBooking(null);
    onOpenEditBooking(updatedBooking);
  };

  // Computed Year & Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  // Month Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Days in selected Month
  const daysInMonthCount = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const daysArray = useMemo(() => {
    const days = [];
    for (let d = 1; d <= daysInMonthCount; d++) {
      const dateObj = new Date(year, month, d);
      const dayOfWeekStr = dateObj.toLocaleString('fr-FR', { weekday: 'narrow' });
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      
      const now = new Date();
      const isToday = 
        now.getDate() === d && 
        now.getMonth() === month && 
        now.getFullYear() === year;

      days.push({
        dayNumber: d,
        dateObj,
        dayOfWeekStr,
        isWeekend,
        isToday,
        dateIso: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      });
    }
    return days;
  }, [year, month, daysInMonthCount]);

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v: any) => {
      const vehicleTitle = (v.title || `${v.make || ''} ${v.model || ''}`).toLowerCase();
      const matchesSearch = vehicleTitle.includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [vehicles, searchQuery, categoryFilter]);

  // Helper to map booking to vehicle ID
  const getVehicleIdForBooking = (b: Booking) => {
    if (typeof b.vehicleId === 'object' && b.vehicleId?._id) return b.vehicleId._id;
    return b.vehicleId;
  };

  // Helper: check if a booking spans across a specific day
  const isBookingActiveOnDate = (b: Booking, dateObj: Date) => {
    if (!b.pickupDate || !b.returnDate) return false;
    const start = new Date(b.pickupDate);
    const end = new Date(b.returnDate);
    
    // Set hours to zero for clean date comparisons
    const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
    const dayEnd = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);

    return start <= dayEnd && end >= dayStart;
  };

  // Get status color styling
  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed' || s === 'completed' || s === 'confirmée' || s === 'terminée') {
      return {
        bg: 'bg-emerald-500',
        lightBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        text: 'text-white',
        border: 'border-emerald-600',
        label: 'Confirmée'
      };
    }
    if (s === 'pending' || s === 'en attente') {
      return {
        bg: 'bg-amber-500',
        lightBg: 'bg-amber-50 text-amber-800 border-amber-200',
        text: 'text-white',
        border: 'border-amber-600',
        label: 'En attente'
      };
    }
    if (s === 'cancelled' || s === 'annulée') {
      return {
        bg: 'bg-rose-500',
        lightBg: 'bg-rose-50 text-rose-800 border-rose-200',
        text: 'text-white',
        border: 'border-rose-600',
        label: 'Annulée'
      };
    }
    return {
      bg: 'bg-indigo-500',
      lightBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      text: 'text-white',
      border: 'border-indigo-600',
      label: status
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Controls Header */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Title & Month Navigation */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
            <CalendarIcon className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight capitalize">
                {monthName}
              </h2>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-extrabold rounded-lg border border-indigo-100 uppercase transition-all"
              >
                Aujourd'hui
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Planning visuel des disponibilités et réservations
            </p>
          </div>

          {/* Month Prev/Next Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/60 ml-2">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-all"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-all"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center/Right: Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chercher un véhicule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-44 sm:w-52 transition-all"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">Toutes catégories</option>
            {categories.map((cat: any) => (
              <option key={cat._id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'gantt'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vue Gantt
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vue Mois
            </button>
          </div>

          {/* New Booking Button */}
          <button
            onClick={onOpenNewBooking}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Réservation</span>
          </button>

        </div>
      </div>

      {/* Legend & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2 text-xs font-bold text-slate-600">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">Légende :</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Confirmée
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span> En Attente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span> Annulée
          </span>
        </div>
        <div className="text-slate-500">
          Affichage de <strong className="text-slate-900">{filteredVehicles.length}</strong> véhicules &bull; <strong className="text-indigo-600">{bookings.length}</strong> réservations au total
        </div>
      </div>

      {/* VIEW 1: GANTT PLANNING TIMELINE GRID */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden relative">
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[1200px]">
              
              {/* Table Header: Days of the Month */}
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-800">
                  
                  {/* Sticky Vehicle Header Column */}
                  <th className="p-4 w-64 sticky left-0 z-20 bg-slate-950 border-r border-slate-800 font-black text-xs uppercase tracking-wider">
                    Véhicules Flotte ({filteredVehicles.length})
                  </th>

                  {/* Day Columns */}
                  {daysArray.map((day) => (
                    <th
                      key={day.dayNumber}
                      className={`p-2 text-center border-r border-slate-800/60 min-w-[38px] max-w-[42px] ${
                        day.isToday
                          ? 'bg-indigo-600 text-white font-black'
                          : day.isWeekend
                          ? 'bg-slate-800/80 text-slate-300'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold opacity-75">{day.dayOfWeekStr}</div>
                      <div className="text-xs font-black">{day.dayNumber}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body: Vehicles & Booking Timeline Rows */}
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle: any) => {
                    const vehicleTitle = vehicle.title || `${vehicle.make || ''} ${vehicle.model || ''}`;
                    const vehicleImage = vehicle.images?.[0] || vehicle.image || '';

                    // Find all bookings for this vehicle
                    const vehicleBookings = bookings.filter((b) => {
                      const vId = getVehicleIdForBooking(b);
                      return String(vId) === String(vehicle._id);
                    });

                    return (
                      <tr key={vehicle._id} className="hover:bg-slate-50/60 transition-colors group">
                        
                        {/* Vehicle Info Sticky Left Column */}
                        <td className="p-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200/80 shadow-xs">
                          <div className="flex items-center gap-3">
                            {vehicleImage ? (
                              <img
                                src={vehicleImage}
                                alt={vehicleTitle}
                                className="w-10 h-8 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                <Car className="w-4 h-4" />
                              </div>
                            )}

                            <div className="truncate max-w-[170px]">
                              <div className="font-extrabold text-xs text-slate-900 truncate" title={vehicleTitle}>
                                {vehicleTitle}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {vehicle.category || 'Standard'}
                                </span>
                                {vehicle.pricePerDay && (
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {vehicle.pricePerDay.toLocaleString()} DA/j
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Timeline Cells for Days 1 to N */}
                        {daysArray.map((day) => {
                          // Check if any booking is active on this day for this vehicle
                          const activeBooking = vehicleBookings.find((b) =>
                            isBookingActiveOnDate(b, day.dateObj)
                          );

                          if (activeBooking) {
                            const style = getStatusBadgeStyle(activeBooking.bookingStatus);
                            
                            // Check if this day is the start of the booking span in current month view
                            const startDate = new Date(activeBooking.pickupDate);
                            const isStartDay = 
                              startDate.getDate() === day.dayNumber && 
                              startDate.getMonth() === month &&
                              startDate.getFullYear() === year;

                            return (
                              <td
                                key={day.dayNumber}
                                onClick={() => setSelectedBooking(activeBooking)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleBookingDrop(vehicle._id, day.dateIso)}
                                className={`p-0 text-center border-r border-slate-100 cursor-pointer relative ${
                                  day.isToday ? 'bg-indigo-50/30' : ''
                                }`}
                              >
                                <div
                                  draggable
                                  onDragStart={() => setDraggedBooking(activeBooking)}
                                  className={`h-9 m-0.5 rounded-md ${style.bg} ${style.text} flex items-center justify-center px-1 shadow-xs hover:opacity-90 active:scale-95 transition-all relative group/bar cursor-grab active:cursor-grabbing`}
                                  title={`${activeBooking.guestName} (${activeBooking.bookingStatus}) - Glissez pour déplacer, cliquez pour détails`}
                                >
                                  {isStartDay ? (
                                    <span className="text-[10px] font-black truncate px-1 drop-shadow-sm">
                                      {activeBooking.guestName}
                                    </span>
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/70"></span>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          // Empty cell: allowed to click or drop dragged booking
                          return (
                            <td
                              key={day.dayNumber}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleBookingDrop(vehicle._id, day.dateIso)}
                              onClick={() => {
                                if (onOpenNewBookingWithVehicleAndDate) {
                                  onOpenNewBookingWithVehicleAndDate(vehicle._id, day.dateIso);
                                } else {
                                  onOpenNewBooking();
                                }
                              }}
                              className={`p-0 text-center border-r border-slate-100 hover:bg-indigo-50/50 transition-colors cursor-pointer relative group/empty ${
                                day.isToday ? 'bg-indigo-50/20' : day.isWeekend ? 'bg-slate-50/50' : ''
                              }`}
                              title={`Glisser ici pour replacer ou cliquer pour créer une réservation (${vehicleTitle})`}
                            >
                              <div className="h-9 flex items-center justify-center opacity-0 group-hover/empty:opacity-100 transition-opacity">
                                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                              </div>
                            </td>
                          );
                        })}

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={daysArray.length + 1} className="py-12 text-center text-slate-400 font-semibold text-xs">
                      Aucun véhicule ne correspond à votre filtre.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </div>
      )}

      {/* VIEW 2: MONTHLY CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 space-y-4">
          
          {/* Weekday Titles Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div>Sam</div>
            <div>Dim</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((day) => {
              // Get all bookings active on this day
              const dayBookings = bookings.filter((b) => isBookingActiveOnDate(b, day.dateObj));

              return (
                <div
                  key={day.dayNumber}
                  className={`min-h-[110px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    day.isToday
                      ? 'border-indigo-500 bg-indigo-50/30 shadow-sm'
                      : day.isWeekend
                      ? 'border-slate-200/60 bg-slate-50/40'
                      : 'border-slate-200/60 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-black rounded-lg w-6 h-6 flex items-center justify-center ${
                      day.isToday ? 'bg-indigo-600 text-white' : 'text-slate-800'
                    }`}>
                      {day.dayNumber}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {dayBookings.length} loc.
                      </span>
                    )}
                  </div>

                  {/* Day Bookings List */}
                  <div className="space-y-1 overflow-y-auto max-h-[75px] no-scrollbar flex-1">
                    {dayBookings.slice(0, 3).map((b) => {
                      const style = getStatusBadgeStyle(b.bookingStatus);
                      const title = b.vehicleTitle || (typeof b.vehicleId === 'object' ? b.vehicleId?.title : 'Véhicule');
                      
                      return (
                        <div
                          key={b._id}
                          onClick={() => setSelectedBooking(b)}
                          className={`p-1.5 rounded-lg ${style.lightBg} border text-[10px] font-bold truncate cursor-pointer hover:scale-[1.02] transition-transform`}
                        >
                          <div className="truncate font-black">{b.guestName}</div>
                          <div className="truncate text-[9px] opacity-80">{title}</div>
                        </div>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <div className="text-[9px] font-bold text-slate-400 text-center">
                        +{dayBookings.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* QUICK BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase mb-2 ${getStatusBadgeStyle(selectedBooking.bookingStatus).lightBg} border`}>
                  {selectedBooking.bookingStatus}
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Détails de la Réservation
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              
              {/* Guest Info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <User className="w-4 h-4 text-indigo-600" />
                  {selectedBooking.guestName}
                </div>
                {selectedBooking.guestPhone && (
                  <div className="flex items-center gap-2 font-bold text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedBooking.guestPhone}
                  </div>
                )}
                {selectedBooking.guestEmail && (
                  <div className="flex items-center gap-2 font-bold text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedBooking.guestEmail}
                  </div>
                )}
              </div>

              {/* Vehicle & Pricing Info */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/60 space-y-2">
                <div className="flex items-center gap-2 font-black text-indigo-950 text-sm">
                  <Car className="w-4 h-4 text-indigo-600" />
                  {selectedBooking.vehicleTitle || 'Véhicule'}
                </div>
                <div className="flex justify-between items-center text-slate-600 font-bold pt-1 border-t border-indigo-100/60">
                  <span>Montant Total :</span>
                  <span className="text-base font-black text-indigo-600">
                    {(selectedBooking.totalPrice || 0).toLocaleString()} DA
                  </span>
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-slate-600 font-bold">
                  <span className="text-slate-400 uppercase text-[10px]">Prise en charge :</span>
                  <span className="text-slate-900">
                    {selectedBooking.pickupDate ? new Date(selectedBooking.pickupDate).toLocaleString('fr-FR') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-bold pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400 uppercase text-[10px]">Restitution :</span>
                  <span className="text-slate-900">
                    {selectedBooking.returnDate ? new Date(selectedBooking.returnDate).toLocaleString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const b = selectedBooking;
                  setSelectedBooking(null);
                  onOpenEditBooking(b);
                }}
                className="px-5 py-2.5 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              >
                Éditer la Réservation
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
