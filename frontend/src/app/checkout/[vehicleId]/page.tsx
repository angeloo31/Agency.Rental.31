'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';
import { Check, ChevronRight, CheckCircle2, Navigation2, Camera, Shield, User, ArrowLeft, CreditCard, Sparkles, Phone, Mail, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '@/context/SettingsContext';
import BrandLogo from '@/components/BrandLogo';

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { settings, formatPrice } = useSettings();
  const { bookingData, setBookingData, currentStep, setCurrentStep } = useBooking();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableOptions, setAvailableOptions] = useState<any[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  useEffect(() => {
    if (!bookingData.pickupDate || !bookingData.returnDate) {
      if (params.vehicleId) {
        router.push(`/fleet/${params.vehicleId}`);
      } else {
        router.push('/fleet');
      }
      return;
    }

    if (!params.vehicleId) return;

    const fetchVehicle = async () => {
      try {
        const res = await fetch(`/api/vehicles/${params.vehicleId}`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setVehicle(data);
          
          // Auto-select valid rentalType based on available prices
          if (data) {
            const hasHour = data.pricePerHour > 0;
            const hasHalfDay = data.pricePerHalfDay > 0;
            const hasDay = data.pricePerDay > 0;
            
            if (bookingData.rentalType === 'day' && !hasDay) {
              if (hasHour) {
                setBookingData(prev => ({ ...prev, rentalType: 'hour' }));
              } else if (hasHalfDay) {
                setBookingData(prev => ({ ...prev, rentalType: 'halfDay' }));
              }
            } else if (bookingData.rentalType === 'hour' && !hasHour) {
              if (hasDay) {
                setBookingData(prev => ({ ...prev, rentalType: 'day' }));
              } else if (hasHalfDay) {
                setBookingData(prev => ({ ...prev, rentalType: 'halfDay' }));
              }
            }
          }
        } else {
          const text = await res.text();
          console.warn('Expected JSON response for vehicle, got:', text.substring(0, 100));
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/extra-options');
        if (res.ok) {
          setAvailableOptions(await res.json());
        }
      } catch (err) {
        console.error('Error fetching extra options:', err);
      }
    };

    if (params.vehicleId) {
      fetchVehicle();
      fetchOptions();
    }
  }, [params.vehicleId]);

  const toggleAddon = (addon: string) => {
    const addons = bookingData.addOns.includes(addon)
      ? bookingData.addOns.filter(a => a !== addon)
      : [...bookingData.addOns, addon];
    setBookingData({ ...bookingData, addOns: addons });
  };

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.error(t('acceptTermsRequired', 'Vous devez accepter les conditions générales de location pour confirmer la réservation.'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (res.ok) {
        setCurrentStep(4);
      } else {
        toast.error('Failed to create booking');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (!bookingData.pickupDate || !bookingData.returnDate) return { count: 0, unit: 'days' };
    const start = new Date(bookingData.pickupDate);
    const end = new Date(bookingData.returnDate);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const rType = bookingData.rentalType || 'day';

    if (rType === 'hour') {
      const hours = Math.max(1, Math.round(diffHours));
      return { count: hours, unit: hours === 1 ? t('hourCountUnit') : (t('hours') || t('hourCountUnit')) };
    } else if (rType === 'halfDay') {
      const halfDays = Math.max(1, Math.ceil(diffHours / 12));
      return { count: halfDays, unit: halfDays === 1 ? t('halfDayCountUnit') : (t('halfDays') || t('halfDayCountUnit')) };
    } else {
      const days = Math.max(1, Math.ceil(diffHours / 24));
      return { count: days, unit: days === 1 ? t('dayCountUnit') : (t('days') || t('dayCountUnit')) };
    }
  };

  const getPricingDetails = () => {
    const { count, unit } = calculateDuration();
    const rType = bookingData.rentalType || 'day';
    
    let rate = 0;
    if (rType === 'hour') {
      rate = vehicle?.pricePerHour || 0;
    } else if (rType === 'halfDay') {
      rate = vehicle?.pricePerHalfDay || (vehicle?.pricePerHour ? vehicle.pricePerHour * 6 : 0) || (vehicle?.pricePerDay ? vehicle.pricePerDay / 2 : 0);
    } else {
      rate = vehicle?.pricePerDay || 0;
    }

    const hasDiscount = vehicle?.discount && vehicle.discount.percentage > 0;
    const originalRate = rate;
    const discountedRate = hasDiscount ? rate * (1 - vehicle.discount.percentage / 100) : rate;

    const originalBaseCost = count * originalRate;
    const baseCost = count * discountedRate;
    const isDailyOrHalfDaily = rType === 'day' || rType === 'halfDay';
    const multiplier = (vehicle?.category !== 'JetSki' && isDailyOrHalfDaily) ? count : 1;

    let addonsCost = 0;
    const addonsBreakdown: { name: string; cost: number }[] = [];
    
    availableOptions.forEach(opt => {
      if (bookingData.addOns.includes(opt.name)) {
        let cost = 0;
        if (opt.priceType === 'per_day') {
          cost = opt.price * multiplier;
        } else {
          cost = opt.price;
        }
        addonsCost += cost;
        const optTitle = opt.name_fr || opt.name;
        addonsBreakdown.push({ name: optTitle, cost });
      }
    });

    let driverCost = 0;
    if (bookingData.withDriver && vehicle?.driverOption?.available) {
      const pricePerDay = vehicle.driverOption.pricePerDay || 0;
      if (rType === 'day') {
        driverCost = pricePerDay * count;
      } else if (rType === 'halfDay') {
        driverCost = (pricePerDay / 2) * count;
      } else {
        driverCost = (pricePerDay / 24) * count;
      }
    }

    const totalCost = baseCost + addonsCost + driverCost;
    const originalTotalPrice = originalBaseCost + addonsCost + driverCost;

    return { 
      count, 
      unit, 
      rate: discountedRate, 
      originalRate,
      hasDiscount, 
      discountPercentage: vehicle?.discount?.percentage || 0,
      discountLabel: vehicle?.discount?.label || '',
      baseCost, 
      originalBaseCost,
      addonsCost, 
      addonsBreakdown,
      driverCost,
      totalPrice: totalCost,
      originalTotalPrice
    };
  };

  const pricing = getPricingDetails();
  const fmt = (n: number) => formatPrice(n);
  const cur = '';

  const steps = [
    { num: 1, label: t('summaryStep') || 'Summary' },
    { num: 2, label: t('addonsStep') || 'Add-ons' },
    { num: 3, label: t('detailsStep') || 'Details' },
    { num: 4, label: t('confirmedStep') || 'Confirmed' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
          {t('loading')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Top Header Bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push(`/fleet/${params.vehicleId}`)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToVehicle') || 'Back to vehicle'}
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-black text-slate-900 text-sm tracking-tight">{settings?.storeName || 'LuxeRent'}</span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-slate-500 font-medium text-sm">{t('secureBooking') || 'Secure Booking'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 hidden sm:block">{t('payOnPickup') || 'Pay on pickup'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Stepper */}
        <div className="mb-10 max-w-lg mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-5 w-full h-0.5 bg-slate-200 -z-0">
              <div
                className="h-full transition-all duration-700 ease-in-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`, background: `linear-gradient(to right, var(--brand-secondary), var(--brand-primary))` }}
              />
            </div>
            {steps.map(step => (
              <div key={step.num} className="flex flex-col items-center gap-2.5 z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep > step.num
                    ? 'text-white shadow-lg scale-105'
                    : currentStep === step.num
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-110 ring-4 ring-slate-900/10'
                    : 'bg-white border-2 border-slate-200 text-slate-400 shadow-sm'
                }`} style={currentStep > step.num ? { background: `linear-gradient(to bottom right, var(--brand-secondary), var(--brand-primary))` } : {}}>
                  {currentStep > step.num ? <Check className="w-4.5 h-4.5" /> : step.num}
                </div>
                <span className={`text-[10px] font-black tracking-widest uppercase whitespace-nowrap ${
                  currentStep >= step.num ? 'text-slate-900' : 'text-slate-400'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Column: Steps */}
          <div className={`w-full ${currentStep < 4 ? 'lg:flex-[3]' : 'max-w-2xl mx-auto'}`}>

            {/* Step 1: Summary */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-8 md:p-10 animate-in fade-in duration-400">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 text-white rounded-xl flex items-center justify-center font-black text-sm" style={{ backgroundColor: 'var(--brand-secondary)' }}>1</div>
                  <h2 className="text-2xl font-black text-slate-900">{t('bookingSummary') || 'Booking Summary'}</h2>
                </div>

                {/* Vehicle Card */}
                <div className="flex flex-col sm:flex-row gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                  <div className="w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    <img src={vehicle?.images[0]} alt={vehicle?.model} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="text-[10px] font-black text-blue-600 mb-1.5 tracking-widest uppercase">
                      {vehicle?.category === 'Car' ? t('car') : vehicle?.category === 'Motorcycle' ? t('motorcycle') : vehicle?.category === 'JetSki' ? t('jetski') : vehicle?.category}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-none mb-1 flex items-center gap-2">
                      <BrandLogo brand={vehicle?.make} size={22} />
                      <span>{vehicle?.make}</span>
                    </h3>
                    <p className="text-slate-500 font-semibold mb-3">{vehicle?.model} · {vehicle?.year}</p>
                    <div className="flex flex-col gap-1">
                      {pricing.hasDiscount && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-400 line-through">
                            {fmt(pricing.originalRate)} {cur}
                          </span>
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            -{pricing.discountPercentage}% {pricing.discountLabel}
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900">
                          {fmt(pricing.rate)} {cur}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          /{pricing.unit.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rental Type Selection */}
                {vehicle && (vehicle.pricePerHour > 0 || vehicle.pricePerHalfDay > 0 || vehicle.pricePerDay > 0) && (
                  <div className="mb-6 p-5 bg-slate-50 border border-slate-150 rounded-2xl">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                      {t('rentalDurationType') || 'Rental Duration Type'}
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {vehicle.pricePerHour > 0 && (
                        <button
                          type="button"
                          onClick={() => setBookingData({ ...bookingData, rentalType: 'hour' })}
                          className={`px-4.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                            bookingData.rentalType === 'hour'
                              ? 'bg-slate-900 text-white shadow-md'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {t('hourlyRateLabel') || 'Hourly'} ({fmt(vehicle.pricePerHour)} {cur})
                        </button>
                      )}
                      {vehicle.pricePerHalfDay > 0 && (
                        <button
                          type="button"
                          onClick={() => setBookingData({ ...bookingData, rentalType: 'halfDay' })}
                          className={`px-4.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                            bookingData.rentalType === 'halfDay'
                              ? 'bg-slate-900 text-white shadow-md'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {t('halfDayRateLabel') || 'Half-Day (12h)'} ({fmt(vehicle.pricePerHalfDay)} {cur})
                        </button>
                      )}
                      {vehicle.pricePerDay > 0 && (
                        <button
                          type="button"
                          onClick={() => setBookingData({ ...bookingData, rentalType: 'day' })}
                          className={`px-4.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                            bookingData.rentalType === 'day'
                              ? 'bg-slate-900 text-white shadow-md'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {t('dailyRateLabel') || 'Daily (24h)'} ({fmt(vehicle.pricePerDay)} {cur})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/60">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">
                      {t('pickupLocation')}
                    </div>
                    <div className="font-black text-slate-900 text-base leading-tight mb-2">
                      {new Date(bookingData.pickupDate || '').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-slate-600 font-bold text-sm">
                      {new Date(bookingData.pickupDate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Navigation2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="line-clamp-2">{bookingData.pickupLocation}</span>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/60">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      {t('returnDate')}
                    </div>
                    <div className="font-black text-slate-900 text-base leading-tight mb-2">
                      {new Date(bookingData.returnDate || '').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-slate-600 font-bold text-sm">
                      {new Date(bookingData.returnDate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Navigation2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-2">{bookingData.pickupLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-slate-900/15 hover:shadow-blue-600/25 cursor-pointer"
                  >
                    {t('addonsStep') || 'Options & Extras'} <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Add-ons */}
            {currentStep === 2 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-8 md:p-10 animate-in slide-in-from-right-4 duration-400">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors mb-8 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> {t('backButton') || 'Back'}
                </button>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">2</div>
                  <h2 className="text-2xl font-black text-slate-900">{t('enhanceYourTrip') || 'Enhance Your Trip'}</h2>
                </div>

                {vehicle?.driverOption?.available && (
                  <div className="mb-6 p-1 bg-slate-50 border border-slate-200/80 rounded-3xl">
                    <div className="p-5">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                        🚖 {t('driverOptionLabel') || 'Chauffeur Service Options'}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setBookingData(prev => ({ ...prev, withDriver: false }))}
                          className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                            !bookingData.withDriver
                              ? 'border-slate-950 bg-white font-black text-slate-950 shadow-md'
                              : 'border-transparent bg-slate-100/50 hover:bg-slate-100 font-bold text-slate-500'
                          }`}
                        >
                          <span className="block text-sm mb-0.5">{t('selfDrive')}</span>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t('driverDisabled')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBookingData(prev => ({ ...prev, withDriver: true }))}
                          className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                            bookingData.withDriver
                              ? 'border-blue-600 bg-white font-black text-blue-900 shadow-md ring-4 ring-blue-50'
                              : 'border-transparent bg-slate-100/50 hover:bg-slate-100 font-bold text-slate-500'
                          }`}
                        >
                          <span className="block text-sm mb-0.5">{t('withChauffeur')}</span>
                          <span className="block text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                            +{fmt(vehicle.driverOption.pricePerDay)} {cur}/{t('dayCountUnit')}
                          </span>
                        </button>
                      </div>
                      
                      <p className="mt-3.5 text-[11px] font-medium text-slate-400 leading-snug">
                        ℹ️ {t('driverPriceInfo') || 'hire a local driver to navigate traffic easily'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-10">
                  {availableOptions.filter(opt => {
                    if (!opt.isActive) return false;
                    if (opt.applicableTo === 'All') return true;
                    if (opt.applicableTo === 'Category' && opt.category === vehicle?.category) return true;
                    if (opt.applicableTo === 'Vehicle' && (opt.vehicleId?._id === vehicle?._id || opt.vehicleId === vehicle?._id)) return true;
                    return false;
                  }).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-100">
                      {t('noExtraOptions') || 'No extra options available for this vehicle.'}
                    </div>
                  ) : availableOptions.filter(opt => {
                    if (!opt.isActive) return false;
                    if (opt.applicableTo === 'All') return true;
                    if (opt.applicableTo === 'Category' && opt.category === vehicle?.category) return true;
                    if (opt.applicableTo === 'Vehicle' && (opt.vehicleId?._id === vehicle?._id || opt.vehicleId === vehicle?._id)) return true;
                    return false;
                  }).map(addon => {
                    const isSelected = bookingData.addOns.includes(addon.name);
                    return (
                      <div
                        key={addon._id}
                        onClick={() => toggleAddon(addon.name)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-5 group ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 shadow-xl shadow-slate-900/15'
                            : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isSelected ? 'bg-white/10 text-white' : 'text-blue-600 bg-blue-50'
                        }`}>
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-black text-base leading-tight mb-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {addon.name_fr || addon.name}
                          </h4>
                          <p className={`text-xs font-medium leading-snug truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {addon.priceType === 'per_day' ? t('pricedPerUnit', 'Priced per duration unit') : t('flatRateTrip', 'Flat rate for the trip')}
                          </p>
                        </div>
                        <div className="text-right px-2 shrink-0">
                          <div className={`font-black text-lg ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {addon.price > 0 ? `+${addon.price} ${cur}` : t('freeWord')}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isSelected ? 'bg-blue-500 border-blue-500 scale-110' : 'border-slate-200 group-hover:border-slate-400'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <button onClick={handleNext} className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-slate-900/15 hover:shadow-blue-600/25 cursor-pointer">
                    {t('detailsStep') || 'Your Details'} <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact Details */}
            {currentStep === 3 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-8 md:p-10 animate-in slide-in-from-right-4 duration-400">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors mb-8 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> {t('backButton') || 'Back'}
                </button>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">3</div>
                  <h2 className="text-2xl font-black text-slate-900">{t('yourInformation') || 'Your Information'}</h2>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-5 mb-8">

                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                        {t('fullNameLabel', 'Full Name')}
                      </label>
                      <div className="relative">
                        <User className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text" required
                          placeholder={t('fullNamePlaceholder', 'Your full name')}
                          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 pl-11 pr-4 outline-none focus:ring-0 font-semibold text-slate-900 placeholder:text-slate-300 transition-all duration-200"
                          value={bookingData.guestName}
                          onChange={(e) => setBookingData({ ...bookingData, guestName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                          {t('emailLabel', 'Email Address')}
                        </label>
                        <div className="relative">
                          <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email" required
                            placeholder="name@email.com"
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 pl-11 pr-4 outline-none focus:ring-0 font-semibold text-slate-900 placeholder:text-slate-300 transition-all duration-200"
                            value={bookingData.guestEmail}
                            onChange={(e) => setBookingData({ ...bookingData, guestEmail: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                          {t('phoneLabel', 'Phone Number')}
                        </label>
                        <div className="relative">
                          <Phone className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel" required
                            placeholder="+213 0XX XXX XXXX"
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 pl-11 pr-4 outline-none focus:ring-0 font-semibold text-slate-900 placeholder:text-slate-300 transition-all duration-200"
                            value={bookingData.guestPhone}
                            onChange={(e) => setBookingData({ ...bookingData, guestPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pay on site notice */}
                    <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mt-2">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-black text-emerald-900 text-sm mb-1">
                          {t('payOnPickupNotice') || 'Paiement sur place — Aucun frais maintenant'}
                        </h4>
                        <p className="text-xs font-medium text-emerald-700 leading-relaxed">
                          {t('payOnPickupDesc') || 'Votre réservation est gratuite sans prépaiement en ligne. Vous payez en espèces ou par carte lors de la récupération du véhicule à l\'agence.'}
                        </p>
                      </div>
                    </div>

                    {/* Mandatory Conditions Générales Checkbox */}
                    <div className="bg-slate-50 border-2 border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 mt-4">
                      <input
                        type="checkbox"
                        id="acceptTermsCheckout"
                        required
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-5 h-5 accent-slate-900 rounded cursor-pointer shrink-0 mt-0.5"
                      />
                      <label htmlFor="acceptTermsCheckout" className="text-xs font-bold text-slate-700 leading-relaxed cursor-pointer select-none">
                        J'accepte les{' '}
                        <button
                          type="button"
                          onClick={() => setIsTermsModalOpen(true)}
                          className="text-blue-600 underline font-black hover:text-blue-800 transition-colors"
                        >
                          conditions générales de location
                        </button>
                        {' '}et je m'engage à présenter les documents requis lors de la prise en charge du véhicule.
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      {t('safeDataNotice') || 'Your data is safe and protected'}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-gradient-to-r from-slate-900 to-slate-800 hover:from-blue-600 hover:to-indigo-600 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-xl shadow-slate-900/15 hover:shadow-blue-600/25 cursor-pointer"
                    >
                      {isSubmitting
                        ? t('processing')
                        : t('confirmReservation')}
                      {!isSubmitting && <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-10 md:p-16 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                  <Check className="w-3.5 h-3.5" /> {t('confirmedStep') || 'Booking Confirmed'}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                  {t('youAreAllSet') || "You're all set!"}
                </h2>
                <p className="text-slate-500 font-medium text-lg mb-3 max-w-md mx-auto leading-relaxed">
                  {t('bookingSuccessDesc') || 'Your reservation has been recorded. Our team will contact you to confirm the details.'}
                </p>
                <div className="inline-flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 mb-10">
                  <Navigation2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-700 text-sm">{bookingData.pickupLocation}</span>
                </div>
                <br />
                <button
                  onClick={() => { setCurrentStep(1); router.push('/'); }}
                  className="bg-slate-900 hover:bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl shadow-slate-900/15 hover:shadow-blue-600/25 cursor-pointer"
                >
                  {t('backToHome') || 'Back to Home'}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Dark Receipt Card */}
          {currentStep < 4 && (
            <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-28">
              <div className="bg-slate-900 rounded-3xl p-7 text-white shadow-2xl shadow-slate-900/30 relative overflow-hidden">
                {/* Decorative gradient blob */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-700/30 via-transparent to-transparent pointer-events-none rounded-3xl" />

                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 pb-5 border-b border-slate-800">
                  {t('priceDetails') || 'Price Details'}
                </h3>

                {/* Vehicle thumb */}
                {vehicle && (
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
                    <div className="w-14 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                      <img src={vehicle.images[0]} alt={vehicle.model} className="w-full h-full object-contain opacity-80" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-white leading-none flex items-center gap-2">
                        <BrandLogo brand={vehicle.make} size={16} />
                        <span>{vehicle.make} {vehicle.model}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{vehicle.year} · {vehicle.category === 'Car' ? t('car') : vehicle.category === 'Motorcycle' ? t('motorcycle') : vehicle.category === 'JetSki' ? t('jetski') : vehicle.category}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">{t('rateLabel') || 'Rate'}</span>
                    <span className="font-bold text-slate-200">
                      {pricing.hasDiscount && (
                        <span className="text-slate-550 line-through text-xs mr-2 font-normal">
                          {fmt(pricing.originalRate)} {cur}
                        </span>
                      )}
                      {fmt(pricing.rate)} {cur}/{pricing.unit.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">{t('durationLabel') || 'Duration'}</span>
                    <span className="font-bold text-slate-200">{pricing.count} {pricing.unit}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-800">
                    <span className="text-slate-400 font-medium">{t('baseRental') || 'Base rental'}</span>
                    <span className="font-black text-white">
                      {pricing.hasDiscount && (
                        <span className="text-slate-550 line-through text-xs mr-2 font-normal">
                          {fmt(pricing.originalBaseCost)} {cur}
                        </span>
                      )}
                      {fmt(pricing.baseCost)} {cur}
                    </span>
                  </div>

                  {bookingData.withDriver && pricing.driverCost > 0 && (
                    <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-800">
                      <span className="text-slate-400 font-medium">{t('driverPrompt')}</span>
                      <span className="font-bold text-slate-200">+{fmt(pricing.driverCost)} {cur}</span>
                    </div>
                  )}

                  {vehicle?.securityDeposit > 0 && (
                    <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-800">
                      <span className="text-slate-400 font-medium">{t('securityDepositLabel')}</span>
                      <span className="font-extrabold text-orange-400">{fmt(vehicle.securityDeposit)} {cur}</span>
                    </div>
                  )}

                  {bookingData.addOns.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-slate-800">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {t('addonsStep') || 'Add-ons'}
                      </div>
                      {pricing.addonsBreakdown.map((addon: any) => (
                        <div key={addon.name} className="flex justify-between text-sm">
                          <span className="text-slate-400">{addon.name}</span>
                          <span className="font-bold text-slate-200">{fmt(addon.cost)} {cur}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-slate-800/60 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        {t('estimatedTotal') || 'Estimated Total'}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {t('payableAtPickup') || 'Payable at pickup'}
                      </div>
                    </div>
                    <div className="text-right">
                      {pricing.hasDiscount && (
                        <div className="text-xs text-slate-400 line-through mb-0.5 font-bold">
                          {fmt(pricing.originalTotalPrice)} {cur}
                        </div>
                      )}
                      <span className="text-3xl font-black text-white tracking-tight">{fmt(pricing.totalPrice)}</span>
                      <span className="text-slate-400 font-bold ml-1.5 text-base">{cur}</span>
                    </div>
                  </div>
                </div>

                {/* Trust badge */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white mb-0.5">
                      {t('freeCancellation') || 'Free Cancellation'}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {t('freeCancellationDesc') || 'Cancel anytime. No payment required today.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Conditions Générales Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                {t('termsAndConditionsTitle', 'Conditions Générales de Location')}
              </h3>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-blue-900 font-bold text-xs flex items-center gap-2">
                <span>ℹ️</span>
                <span>Paiement 100% sur place à la prise en charge du véhicule. Aucune carte bancaire requise en ligne.</span>
              </div>

              <div className="whitespace-pre-line font-medium text-xs sm:text-sm text-slate-700 bg-slate-50 p-5 rounded-2xl border border-slate-200 leading-relaxed">
                {vehicle?.conditions || settings?.generalConditions}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAcceptTerms(true);
                  setIsTermsModalOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {t('acceptAndClose', 'J\'ai lu et j\'accepte')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
