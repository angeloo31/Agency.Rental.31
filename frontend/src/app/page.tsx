/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Bike, Ship, Calendar, MapPin, ArrowRight, Sparkles, Plane, Building2, Waves, Star, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Helper to format Date to datetime-local string format
const formatDateTimeLocal = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
};

export default function Home() {
  const { bookingData, setBookingData } = useBooking();
  const { t, locale } = useLanguage();
  const router = useRouter();

  // Search States
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Car');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [location, setLocation] = useState(bookingData.pickupLocation || '');
  const [pickupDate, setPickupDate] = useState(bookingData.pickupDate || '');
  const [returnDate, setReturnDate] = useState(bookingData.returnDate || '');
  const [errorMsg, setErrorMsg] = useState('');
  
  // UI Facilitation States
  const [showLocationGrid, setShowLocationGrid] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);

  // CMS Settings States
  const { settings: siteSettings, formatPrice } = useSettings();

  // Featured Vehicles States
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Quick Book Modal States
  const [quickBookVehicle, setQuickBookVehicle] = useState<any>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [acceptTermsQuick, setAcceptTermsQuick] = useState(false);
  const [isTermsModalOpenQuick, setIsTermsModalOpenQuick] = useState(false);

  // Date Constraints
  const now = new Date();
  const todayStr = formatDateTimeLocal(now);
  const maxDateObj = new Date(now);
  maxDateObj.setFullYear(now.getFullYear() + 1);
  const maxDateStr = formatDateTimeLocal(maxDateObj);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/vehicles');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        setFeaturedVehicles(data);
      } catch (error) {
        console.error('Error fetching featured vehicles:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories/visible');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          if (data.length > 0 && !data.find((c: any) => c.name === 'Car')) {
            setActiveTab(data[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoaded(true);
      }
    };

    fetchFeatured();
    fetchCategories();
  }, []);

  // Click outside to close location grid
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationGrid(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!location) {
      setErrorMsg(t('pickupLocationError') || 'Please select a pickup location');
      return;
    }

    const isDateSearchEnabled = true; // We always allow date input if the widget is visible

    if (isDateSearchEnabled) {
      const start = new Date(pickupDate);
      const end = new Date(returnDate);

      if (start >= end) {
        setErrorMsg(t('returnDateError') || 'Return date & time must be after pickup date & time');
        return;
      }
    }

    setBookingData(prev => ({
      ...prev,
      pickupLocation: location,
      pickupDate: isDateSearchEnabled ? pickupDate : '',
      returnDate: isDateSearchEnabled ? returnDate : '',
    }));

    setIsSearchModalOpen(false);
    router.push(`/fleet?category=${activeTab}`);
  };

  const getLocationsForCategory = () => {
    if (!siteSettings) return [];
    let locs = siteSettings.locations.filter((loc: any) => loc.categories.includes(activeTab));
    if (activeTab === 'JetSki') {
      locs = locs.filter((loc: any) => loc.type !== 'Airport');
    }
    return locs;
  };

  const handleCategorySelect = (tabName: string) => {
    setActiveTab(tabName);
    setLocation('');
    setShowLocationGrid(true); // Smart Focus Flow: open location automatically
  };

  const handleLocationSelect = (locName: string) => {
    setLocation(locName);
    setShowLocationGrid(false);
    // Smart Focus Flow: focus calendar instantly
    setTimeout(() => {
      if (pickupInputRef.current) pickupInputRef.current.focus();
    }, 100);
  };

  const applyQuickDate = (type: 'weekend' | 'nextWeek') => {
    const start = new Date();
    const end = new Date();
    
    if (type === 'weekend') {
      // Find next Friday 14:00
      start.setDate(start.getDate() + ((5 - start.getDay() + 7) % 7));
      if (start.getDay() === new Date().getDay() && new Date().getHours() >= 14) {
        start.setDate(start.getDate() + 7); // If today is Friday past 2PM, next weekend
      }
      start.setHours(14, 0, 0, 0);
      
      // Sunday 18:00
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 2);
      end.setHours(18, 0, 0, 0);
    } else {
      // Next Monday to Friday
      start.setDate(start.getDate() + ((1 - start.getDay() + 7) % 7));
      if (start.getDay() === new Date().getDay()) {
        start.setDate(start.getDate() + 7);
      }
      start.setHours(9, 0, 0, 0);
      
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 4);
      end.setHours(17, 0, 0, 0);
    }

    setPickupDate(formatDateTimeLocal(start));
    setReturnDate(formatDateTimeLocal(end));
    setErrorMsg('');
  };

  const handleQuickReserve = (vehicle: any) => {
    let pDate = pickupDate;
    let rDate = returnDate;
    if (!pDate || !rDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      dayAfter.setHours(10, 0, 0, 0);

      pDate = formatDateTimeLocal(tomorrow);
      rDate = formatDateTimeLocal(dayAfter);
      
      setPickupDate(pDate);
      setReturnDate(rDate);
    }
    
    if (!location) {
      const locs = getLocationsForCategory();
      if (locs.length > 0) setLocation(locs[0].name);
    }

    setQuickBookVehicle(vehicle);
  };

  const submitQuickBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookVehicle) return;

    if (!acceptTermsQuick) {
      setErrorMsg(t('acceptTermsRequired', 'Vous devez accepter les conditions générales de location pour effectuer la réservation.'));
      return;
    }

    setSubmittingBooking(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: quickBookVehicle._id,
          pickupDate,
          returnDate,
          pickupLocation: location || (getLocationsForCategory()[0]?.name || 'Agency'),
          guestName,
          guestPhone,
          guestEmail: 'quickbook@luxerent.com',
          addOns: [],
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Booking failed');
      }

      toast.success(t('bookingSuccess') || 'Booking successful! We will contact you shortly.');
      setQuickBookVehicle(null);
      setGuestName('');
      setGuestPhone('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const heroTexts = siteSettings?.hero || {
    title: { fr: "Le frisson de la location premium", en: "The thrill of premium rental", ar: "متعة التأجير الفاخر" },
    subtitle: { fr: "Faites votre choix parmi notre flotte exclusive...", en: "Choose from our exclusive fleet...", ar: "اختر من أسطولنا الحصري..." },
    backgroundImage: ""
  };
  
  const currentLang = locale as 'fr'|'en'|'ar';

  return (
    <div className="relative isolate overflow-hidden bg-slate-50">
      
      {/* ── Cinematic Hero ── */}
      <div className="relative h-[720px] w-full flex items-center justify-center overflow-hidden">

        {/* Slideshow Background — 3 images crossfade with Ken Burns */}
        <div className="absolute inset-0 -z-10">
          {[
            { src: 'https://res.cloudinary.com/davrl8ifp/image/upload/v1779835679/luxerent/fltajytlsk1nbzplfcte.jpg', delay: '0s' },
            { src: 'https://res.cloudinary.com/davrl8ifp/image/upload/v1779835659/luxerent/lulvlhob7hh4mcgylsfc.jpg', delay: '-6s' },
            { src: 'https://res.cloudinary.com/davrl8ifp/image/upload/v1779835661/luxerent/uizertcpbrscn0jx2bmf.jpg', delay: '-12s' },
          ].map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 animate-hero-slide"
              style={{ animationDelay: slide.delay, animationDuration: '18s' }}
            >
              <img
                src={slide.src}
                alt=""
                className="h-full w-full object-cover object-center animate-ken-burns"
                style={{ animationDelay: slide.delay }}
              />
            </div>
          ))}

          {/* Dark overlay layers */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-slate-50 to-transparent" />
        </div>

        {/* Floating ambient colour blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-float-blob"
            style={{ background: `radial-gradient(circle, var(--brand-secondary) 0%, var(--brand-primary) 60%, transparent 100%)` }}
          />
          <div
            className="absolute -bottom-40 -right-24 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-float-blob-alt"
            style={{ background: `radial-gradient(circle, var(--brand-secondary) 0%, var(--brand-primary) 60%, transparent 100%)` }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full opacity-10 blur-[80px] animate-float-blob"
            style={{ background: 'radial-gradient(ellipse, #818cf8 0%, transparent 70%)', animationDelay: '-4s' }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-[-40px]">
          
          {/* Animated badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white text-xs font-black mb-8 tracking-widest uppercase shadow-lg shadow-blue-900/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{t('heroBadge')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
          </div>

          <h1 className="animate-fade-in-up delay-150 text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-6 leading-[0.95] drop-shadow-xl">
            {(siteSettings?.hero?.title?.[locale] || siteSettings?.hero?.title?.fr || siteSettings?.hero?.title?.en) ? (
              <span>{siteSettings?.hero?.title?.[locale] || siteSettings?.hero?.title?.fr || siteSettings?.hero?.title?.en}</span>
            ) : (
              <>
                {t('heroTitle1')}
                <br />
                <span className="animate-shimmer-text">{t('heroTitle2')}</span>
              </>
            )}
          </h1>
          <p className="animate-fade-in-up delay-300 text-base md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed tracking-wide">
            {(siteSettings?.hero?.subtitle?.[locale] || siteSettings?.hero?.subtitle?.fr || siteSettings?.hero?.subtitle?.en) || t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-450 flex items-center justify-center mb-14">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="group relative px-10 py-4 text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-2xl transition-all duration-300 overflow-hidden"
              style={{ backgroundColor: 'var(--brand-secondary)', boxShadow: '0 25px 50px -12px color-mix(in srgb, var(--brand-secondary) 40%, transparent)' }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('searchFleet')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to right, var(--brand-secondary), var(--brand-primary))` }} />
            </button>
          </div>

          {/* Animated stats ticker */}
          <div className="animate-fade-in-up delay-600 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { value: loadingVehicles ? '...' : `${featuredVehicles.length}+`, label: t('vehiclesStat', 'Vehicles') },
              { value: '5★', label: t('satisfactionStat', 'Client rating') },
              { value: !categoriesLoaded ? '...' : `${categories.length}`, label: t('categoriesStat', 'Categories') },
              { value: '24/7', label: t('supportStat', 'Support') },
            ].map((stat, i) => (
              <div key={i} className="animate-count-up text-center" style={{ animationDelay: `${700 + i * 120}ms` }}>
                <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Search Widget Modal */}
      {isSearchModalOpen && siteSettings?.showSearchWidget !== false && siteSettings?.showDateSearch !== false && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity" onClick={() => setIsSearchModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Card Container */}
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_25px_60px_rgba(15,23,42,0.3)] border border-slate-100 relative">
              
              {/* Close Button inside Card Top Right */}
              <button 
                onClick={() => setIsSearchModalOpen(false)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Segmented Category Tabs */}
              <div className="p-4 sm:p-6 sm:pb-2 pr-14 sm:pr-16">
                <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar">
                  {categories.map((tab) => {
                    const Icon = tab.name.toLowerCase() === 'motorcycle' ? Bike : tab.name.toLowerCase() === 'jetski' ? Ship : Car;
                    const isActive = activeTab === tab.name;
                    return (
                      <button
                        key={tab._id}
                        type="button"
                        onClick={() => handleCategorySelect(tab.name)}
                        className={`flex-1 py-3 sm:py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-950/20 scale-[1.01]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                        style={isActive ? { backgroundColor: 'var(--brand-secondary, #0f172a)' } : {}}
                      >
                        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Form Body */}
              <form onSubmit={handleSearch} className="p-4 sm:p-6 md:p-8 space-y-5 bg-white">
                {errorMsg && (
                  <div className="w-full bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold border border-red-100/50">
                    {errorMsg}
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-end w-full">
                  
                  {/* 1. Location Picker (4 cols) */}
                  <div className="lg:col-span-4 w-full relative" ref={locationRef}>
                    <label className="block text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" /> {t('pickupLocation')}
                    </label>
                    
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowLocationGrid(!showLocationGrid)}
                        className="w-full h-12 sm:h-14 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
                      >
                        <span className={`flex-1 text-left truncate mr-2 ${location ? "text-slate-900 font-bold" : "text-slate-400 font-semibold"}`}>
                          {location || t('selectLocation')}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 transition-transform duration-200 ${showLocationGrid ? 'rotate-180 text-blue-600' : ''}`}>
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </button>

                      {/* Visual Inline Location Grid */}
                      {showLocationGrid && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200/90 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.22)] z-[80] p-2.5 max-h-[250px] overflow-y-auto space-y-1.5 animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                          {getLocationsForCategory().length === 0 ? (
                            <div className="text-center p-3 text-slate-500 text-xs font-bold">No locations configured for {activeTab}.</div>
                          ) : (
                            getLocationsForCategory().map((loc: any) => (
                              <div 
                                key={loc.name}
                                onClick={() => handleLocationSelect(loc.name)}
                                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                                  location === loc.name 
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm' 
                                    : 'border-slate-200/70 bg-white hover:border-blue-400 hover:bg-blue-50/60 text-slate-800'
                                }`}
                              >
                                <div className={`p-2 rounded-lg shrink-0 ${location === loc.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  {loc.type === 'Airport' && <Plane className="w-4 h-4" />}
                                  {loc.type === 'City' && <Building2 className="w-4 h-4" />}
                                  {loc.type === 'Marina' && <Waves className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-black leading-tight truncate">{loc.name}</div>
                                  <div className={`text-[10px] font-extrabold uppercase tracking-wider mt-0.5 ${location === loc.name ? 'text-blue-100' : 'text-slate-400'}`}>{loc.type}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 2. Rental Dates (5 cols) */}
                  <div className="lg:col-span-5 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                      <label className="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" /> {t('rentalDates')}
                      </label>
                      {/* Smart Shortcuts */}
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => applyQuickDate('weekend')} className="text-[10px] uppercase font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                          {t('weekendPreset')}
                        </button>
                        <button type="button" onClick={() => applyQuickDate('nextWeek')} className="text-[10px] uppercase font-extrabold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                          {t('nextWeekPreset') || 'Next Week'}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input 
                        type="datetime-local" 
                        required 
                        ref={pickupInputRef}
                        value={pickupDate}
                        min={todayStr}
                        max={maxDateStr}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full h-12 sm:h-14 rounded-2xl text-xs sm:text-sm border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-semibold text-slate-800" 
                      />
                      <Input 
                        type="datetime-local" 
                        required 
                        value={returnDate}
                        min={pickupDate || todayStr}
                        max={maxDateStr}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full h-12 sm:h-14 rounded-2xl text-xs sm:text-sm border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-semibold text-slate-800" 
                      />
                    </div>
                  </div>

                  {/* 3. Search Button (3 cols) */}
                  <div className="lg:col-span-3 w-full">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-12 sm:h-14 rounded-2xl font-black bg-slate-900 hover:bg-blue-600 px-6 text-white shadow-xl shadow-slate-950/15 hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm uppercase tracking-wider"
                      style={{ backgroundColor: 'var(--brand-secondary, #0f172a)' }}
                    >
                      <span>{t('searchFleet')}</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </Button>
                  </div>

                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Fleet Highlights ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-24">
        {/* The rest of the page remains identical... */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-8 md:mb-12">
          <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider mb-3 border shadow-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 10%, white)', color: 'var(--brand-secondary)', borderColor: 'color-mix(in srgb, var(--brand-secondary) 20%, white)' }}>
              <Star className="w-3.5 h-3.5 fill-blue-700" /> Sélection Premium
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {t('featuredVehicles')}
            </h2>
          </div>
          <Link href="/fleet" className="hidden md:inline-flex items-center gap-2 text-sm font-bold transition-colors" style={{ color: 'var(--brand-secondary)' }}>
            {t('viewAllFleet')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingVehicles ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-3xl h-[400px] border border-slate-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {featuredVehicles.slice(0, 6).map((vehicle: any) => (
              <div 
                key={vehicle._id} 
                onClick={() => router.push(`/fleet/${vehicle._id}`)}
                className="group bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col cursor-pointer w-full"
              >
                <div className="relative aspect-[16/10] sm:aspect-[4/3] max-h-36 sm:max-h-64 overflow-hidden bg-slate-100/80 p-2 sm:p-4 flex items-center justify-center">
                  <img 
                    src={vehicle.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={vehicle.model}
                    className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-700 z-0"
                  />
                  {vehicle.discount?.percentage > 0 && (
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20">
                      <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-red-500 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-md sm:rounded-lg shadow-sm">
                        -{vehicle.discount.percentage}% {vehicle.discount.label}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1.5 bg-white/90 backdrop-blur-sm text-slate-900 text-[8px] sm:text-[10px] font-black uppercase tracking-wider rounded-md sm:rounded-lg shadow-sm">
                      {vehicle.category}
                    </span>
                  </div>
                </div>
                <div className="p-3 sm:p-6 flex-1 flex flex-col">
                  <div className="text-[10px] sm:text-xs font-black mb-1 sm:mb-1.5 uppercase tracking-wider" style={{ color: 'var(--brand-secondary)' }}>{vehicle.make}</div>
                  <h3 className="text-sm sm:text-2xl font-black text-slate-900 mb-2 sm:mb-4 tracking-tight leading-tight line-clamp-1">{vehicle.model} <span className="text-slate-400 font-medium">{vehicle.year}</span></h3>
                  
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-3 mb-3 sm:mb-6">
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white shadow-xs flex items-center justify-center text-slate-400 shrink-0"><Car className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 truncate">{vehicle.features?.transmission || 'Auto'}</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white shadow-xs flex items-center justify-center text-slate-400 shrink-0"><SettingsIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 truncate">{vehicle.features?.horsepower || '150'} HP</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 sm:pt-5">
                    <div>
                      <span className="text-[9px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">{t('from')}</span>
                      {vehicle.discount?.percentage > 0 ? (
                        <div>
                          <span className="text-[9px] sm:text-xs text-slate-400 line-through font-bold block leading-none mb-0.5">
                            {formatPrice(vehicle.pricePerDay || vehicle.pricePerHour)}
                          </span>
                          <span className="text-sm sm:text-2xl font-black text-red-650">
                            {formatPrice((vehicle.pricePerDay || vehicle.pricePerHour) * (1 - vehicle.discount.percentage / 100))}
                            <span className="text-[9px] sm:text-xs font-bold text-slate-400">
                              {' '}/ {vehicle.pricePerDay ? t('day') : t('hour')}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm sm:text-2xl font-black text-slate-900">
                          {formatPrice(vehicle.pricePerDay || vehicle.pricePerHour)}
                          <span className="text-[9px] sm:text-sm font-bold text-slate-400">
                            {' '}/ {vehicle.pricePerDay ? t('day') : t('hour')}
                          </span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/fleet/${vehicle._id}`); }}
                      className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-900 text-white flex items-center justify-center transition-colors shadow-md shadow-slate-900/10 hover:shadow-lg shrink-0"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:-rotate-45 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-12 flex justify-center">
          <Link href="/fleet" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-slate-900 text-sm font-bold text-white transition-all duration-300 shadow-xl shadow-slate-900/10 hover:-translate-y-0.5" style={{ ['--hover-bg' as string]: 'var(--brand-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-secondary)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}>
            {t('viewAllFleet')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Book Modal */}
      {quickBookVehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('quickReservation') || 'Quick Reservation'}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">{quickBookVehicle.make} {quickBookVehicle.model}</p>
              </div>
              <button onClick={() => setQuickBookVehicle(null)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={submitQuickBook} className="p-6 md:p-8 space-y-5">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold mb-4">
                  {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">{t('pickupDate')}</label>
                  <Input 
                    type="datetime-local" 
                    required 
                    value={pickupDate}
                    min={todayStr}
                    max={maxDateStr}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-slate-50" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">{t('returnDate')}</label>
                  <Input 
                    type="datetime-local" 
                    required 
                    value={returnDate}
                    min={pickupDate || todayStr}
                    max={maxDateStr}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-slate-50" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">{t('pickupLocation')}</label>
                <select
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>{t('selectLocation')}</option>
                  {getLocationsForCategory().map((loc: any) => (
                    <option key={loc.name} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              <div>
                <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">{t('yourNameLabel') || 'Your Name'}</label>
                <Input 
                  type="text" 
                  required 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50" 
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">{t('phoneLabel') || 'Phone Number'}</label>
                <Input 
                  type="tel" 
                  required 
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+213 00 00 00 00"
                  className="w-full bg-slate-50" 
                />
              </div>

              {/* Mandatory Conditions Générales Checkbox */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="acceptTermsQuickInput"
                  required
                  checked={acceptTermsQuick}
                  onChange={(e) => setAcceptTermsQuick(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
                <label htmlFor="acceptTermsQuickInput" className="text-xs font-bold text-slate-700 leading-snug cursor-pointer select-none">
                  J'accepte les{' '}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpenQuick(true)}
                    className="text-blue-600 underline font-black hover:text-blue-800 transition-colors"
                  >
                    conditions générales de location
                  </button>
                  {' '}et je m'engage à présenter les documents requis lors de la prise en charge.
                </label>
              </div>

              <Button type="submit" disabled={submittingBooking} className="w-full h-12 mt-4 rounded-xl font-bold text-white shadow-lg transition-all" style={{ backgroundColor: 'var(--brand-secondary)' }}>
                {submittingBooking ? t('processing') : t('confirmReservation')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Conditions Générales Modal for Quick Book */}
      {isTermsModalOpenQuick && (
        <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                {t('termsAndConditionsTitle', 'Conditions Générales de Location')}
              </h3>
              <button
                type="button"
                onClick={() => setIsTermsModalOpenQuick(false)}
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
                {quickBookVehicle?.conditions || siteSettings?.generalConditions}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAcceptTermsQuick(true);
                  setIsTermsModalOpenQuick(false);
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

// Simple Settings icon since lucide-react Settings might conflict with context
function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
