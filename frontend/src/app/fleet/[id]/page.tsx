'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { 
  Calendar, MapPin, ArrowRight, CheckCircle2, Shield, 
  CreditCard, Clock, Sparkles, ChevronLeft, ChevronRight, 
  Share2, X, Maximize2, Fuel, Gauge, Car, HelpCircle, 
  Copy, UserCheck, ChevronDown, Award, Sparkle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale, formatCurrency } = useLanguage();
  const { formatPrice } = useSettings();
  const { bookingData, setBookingData, setCurrentStep } = useBooking();

  const getLocalizedField = (fieldEn: string, fieldFr?: string, fieldAr?: string) => {
    if (locale === 'fr') return fieldFr || fieldEn || '';
    if (locale === 'ar') return fieldAr || fieldEn || '';
    return fieldEn || '';
  };

  const [vehicle, setVehicle] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [similarVehicles, setSimilarVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'rules' | 'faq'>('overview');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Driver option toggle state
  const [includeDriver, setIncludeDriver] = useState(false);

  // Form State
  const [pickupLocation, setPickupLocation] = useState(bookingData.pickupLocation || '');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('10:00');

  // Date Constraints
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const maxDateObj = new Date(now);
  maxDateObj.setFullYear(now.getFullYear() + 1);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  // Quick Presets
  const setPreset = (type: 'today' | 'tomorrow' | 'weekend' | 'nextWeek') => {
    const n = new Date();
    
    if (type === 'today') {
      const p = new Date(n);
      const r = new Date(n);
      r.setDate(r.getDate() + 1);
      
      setPickupDate(p.toISOString().split('T')[0]);
      setPickupTime(p.toTimeString().slice(0, 5));
      setReturnDate(r.toISOString().split('T')[0]);
      setReturnTime(p.toTimeString().slice(0, 5));
    } else if (type === 'tomorrow') {
      const p = new Date(n);
      p.setDate(p.getDate() + 1);
      p.setHours(10, 0, 0, 0);
      
      const r = new Date(p);
      r.setDate(r.getDate() + 1);
      
      setPickupDate(p.toISOString().split('T')[0]);
      setPickupTime('10:00');
      setReturnDate(r.toISOString().split('T')[0]);
      setReturnTime('10:00');
    } else if (type === 'weekend') {
      const p = new Date(n);
      p.setDate(p.getDate() + ((5 - p.getDay() + 7) % 7 || 7));
      p.setHours(15, 0, 0, 0);
      
      const r = new Date(p);
      r.setDate(r.getDate() + 2);
      r.setHours(18, 0, 0, 0);

      setPickupDate(p.toISOString().split('T')[0]);
      setPickupTime('15:00');
      setReturnDate(r.toISOString().split('T')[0]);
      setReturnTime('18:00');
    } else if (type === 'nextWeek') {
      const p = new Date(n);
      p.setDate(p.getDate() + 7);
      p.setHours(10, 0, 0, 0);

      const r = new Date(p);
      r.setDate(r.getDate() + 3);
      r.setHours(10, 0, 0, 0);

      setPickupDate(p.toISOString().split('T')[0]);
      setPickupTime('10:00');
      setReturnDate(r.toISOString().split('T')[0]);
      setReturnTime('10:00');
    }
  };

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`/api/vehicles/${params.id}`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setVehicle(data);

          // Fetch similar vehicles in same category
          if (data?.category) {
            const simRes = await fetch(`/api/vehicles?category=${data.category}`);
            if (simRes.ok) {
              const simData = await simRes.json();
              setSimilarVehicles(simData.filter((v: any) => v._id !== data._id).slice(0, 4));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          setSiteSettings(await res.json());
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    if (params.id) {
      fetchVehicle();
      fetchSettings();
    }
  }, [params.id]);

  // Handle keyboard events for Lightbox modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen || !vehicle?.images) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => (prev === 0 ? vehicle.images.length - 1 : prev - 1));
      }
      if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => (prev === vehicle.images.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, vehicle]);

  // Calculation of dynamic total pricing
  const calculation = useMemo(() => {
    if (!vehicle || !pickupDate || !pickupTime || !returnDate || !returnTime) return null;

    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${returnDate}T${returnTime}`);
    if (start >= end) return null;

    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffHours / 24);

    const isJetSki = vehicle.category === 'JetSki';
    const duration = isJetSki ? diffHours : diffDays;
    const unitLabel = isJetSki
      ? (duration > 1 ? t('hoursCountUnit', 'hours') : t('hourCountUnit', 'hour'))
      : (duration > 1 ? t('daysCountUnit', 'days') : t('dayCountUnit', 'day'));

    let baseRate = isJetSki ? (vehicle.pricePerHour || 0) : (vehicle.pricePerDay || 0);
    if (vehicle.discount?.percentage > 0) {
      baseRate = baseRate * (1 - vehicle.discount.percentage / 100);
    }

    let baseSubtotal = baseRate * duration;
    let driverFee = 0;
    if (includeDriver && vehicle.driverOption?.available) {
      driverFee = (vehicle.driverOption.pricePerDay || 0) * (isJetSki ? Math.ceil(duration / 8) : duration);
    }

    const grandTotal = Math.round(baseSubtotal + driverFee);

    return {
      duration,
      unitLabel,
      baseRate,
      baseSubtotal,
      driverFee,
      grandTotal
    };
  }, [vehicle, pickupDate, pickupTime, returnDate, returnTime, includeDriver, t]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('linkCopied', 'Vehicle link copied to clipboard!'));
    }
  };

  const handleBookNow = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupDate || !pickupTime || !returnDate || !returnTime || !pickupLocation) {
      toast.error(locale === 'fr' ? 'Veuillez remplir tous les champs (Lieu, Date et Heure)' : 'Please fill all location and date/time fields');
      return;
    }

    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${returnDate}T${returnTime}`);
    if (start >= end) {
      toast.error(locale === 'fr' ? 'La date de retour doit être après la date de départ' : 'Return date & time must be after pickup date & time');
      return;
    }

    const selectedAddOns = bookingData.addOns || [];
    if (includeDriver && vehicle.driverOption?.available && !selectedAddOns.includes('Chauffeur Service')) {
      selectedAddOns.push('Chauffeur Service');
    }

    setBookingData({
      ...bookingData,
      vehicleId: vehicle._id,
      pickupLocation,
      pickupDate: start.toISOString(),
      returnDate: end.toISOString(),
      addOns: selectedAddOns
    });
    setCurrentStep(1);
    router.push(`/checkout/${vehicle._id}`);
  };

  const getLocationsForCategory = () => {
    if (!siteSettings) return [];
    let locs = siteSettings.locations.filter((loc: any) => loc.categories.includes(vehicle?.category));
    if (vehicle?.category === 'JetSki') {
      locs = locs.filter((loc: any) => loc.type !== 'Airport');
    }
    return locs;
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600 border-t-transparent shadow-md"></div>
          <p className="text-slate-500 font-bold animate-pulse text-sm">Loading vehicle presentation...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-32 max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <Car className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">{locale === 'fr' ? 'Véhicule non trouvé' : 'Vehicle not found'}</h2>
        <p className="text-slate-500 mb-8 text-sm">{locale === 'fr' ? 'Le véhicule demandé n\'existe pas ou n\'est plus disponible.' : 'The requested vehicle does not exist or is no longer available.'}</p>
        <Link href="/fleet" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
          {t('viewAllFleet', 'Explore Fleet')}
        </Link>
      </div>
    );
  }

  const localizedDesc = getLocalizedField(vehicle.description, vehicle.description_fr, vehicle.description_ar);
  const localizedReqs = getLocalizedField(vehicle.requirements, vehicle.requirements_fr, vehicle.requirements_ar);
  const localizedConds = getLocalizedField(vehicle.conditions, vehicle.conditions_fr, vehicle.conditions_ar);

  const defaultFaqs = [
    {
      q: locale === 'fr' ? 'Comment se déroule le paiement ?' : locale === 'ar' ? 'كيف يتم الدفع؟' : 'How does payment work?',
      a: locale === 'fr' ? 'Aucune carte de crédit n\'est requise en ligne. Le paiement s\'effectue intégralement sur place lors de la prise en charge du véhicule.' : locale === 'ar' ? 'لا يلزم وجود بطاقة ائتمان عبر الإنترنت. يتم الدفع بالكامل في الموقع عند استلام المركبة.' : 'Zero credit card required online. You pay 100% on-site upon vehicle pickup.'
    },
    {
      q: locale === 'fr' ? 'Quels documents dois-je fournir ?' : locale === 'ar' ? 'ما هي الوثائق المطلوبة؟' : 'What documents are required?',
      a: locale === 'fr' ? 'Vous devrez présenter un permis de conduire valide (min 1 à 2 ans selon le véhicule) ainsi qu\'une pièce d\'identité / passeport en cours de validité.' : locale === 'ar' ? 'ستحتاج إلى تقديم رخصة قيادة سارية ووثيقة إثبات شخصية أو جواز سفر ساري المفعول.' : 'Valid driving license and passport / national ID upon vehicle key handover.'
    },
    {
      q: locale === 'fr' ? 'Comment fonctionne la caution ?' : locale === 'ar' ? 'كيف تعمل الكفالة / مبلغ الضمان؟' : 'How does the security deposit work?',
      a: locale === 'fr' ? 'Le montant de la caution (optionnelle selon les modèles) est consigné à l\'agence et restitué intégralement lors du retour de la véhicule sans dommage.' : locale === 'ar' ? 'مبلغ الضمان مسترد بالكامل فور إرجاع المركبة بحالة جيدة.' : 'The refundable caution deposit is handled at pickup and fully returned when returning the vehicle.'
    },
    {
      q: locale === 'fr' ? 'Puis-je annuler ou modifier ma réservation ?' : locale === 'ar' ? 'هل يمكنني إلغاء أو تعديل الحجز؟' : 'Can I cancel or modify my reservation?',
      a: locale === 'fr' ? 'Oui, l\'annulation est 100% gratuite à tout moment avant l\'heure de prise en charge sans aucun frais.' : locale === 'ar' ? 'نعم، الإلغاء مجاني تماماً في أي وقت قبل الموعد.' : 'Yes, cancellation is 100% free anytime before your scheduled pickup.'
    }
  ];

  const faqs = (siteSettings?.faqs && siteSettings.faqs.length > 0) ? siteSettings.faqs : defaultFaqs;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* Lightbox Modal */}
      {isLightboxOpen && vehicle.images && (
        <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="flex justify-between items-center z-10">
            <span className="text-white/80 font-bold text-sm bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
              {activeImageIndex + 1} / {vehicle.images.length}
            </span>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img 
              src={vehicle.images[activeImageIndex]} 
              alt={vehicle.model} 
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
            />
            {vehicle.images.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImageIndex(prev => (prev === 0 ? vehicle.images.length - 1 : prev - 1))}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button 
                  onClick={() => setActiveImageIndex(prev => (prev === vehicle.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-3 overflow-x-auto py-2 z-10">
            {vehicle.images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${activeImageIndex === idx ? 'border-blue-500 scale-110 opacity-100' : 'border-transparent opacity-40 hover:opacity-80'}`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Header & Breadcrumb Strip */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-blue-600 transition-colors">{t('home', 'Home')}</Link>
            <span>/</span>
            <Link href="/fleet" className="hover:text-blue-600 transition-colors">{t('fleet', 'Fleet')}</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">{vehicle.make} {vehicle.model}</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              title="Share Vehicle"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('shareVehicle', 'Share')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Main Grid: Left Presentation vs Right Booking Form */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          
          {/* Left Main Column */}
          <div className="flex-1 w-full min-w-0">
            
            {/* Gallery Showcase Box */}
            <div className="relative rounded-[2.5rem] bg-slate-100 border border-slate-200/80 p-2 sm:p-4 shadow-sm group select-none mb-6">
              
              {/* Main Photo */}
              <div className="relative w-full h-[320px] sm:h-[450px] md:h-[500px] flex items-center justify-center overflow-hidden rounded-[2rem] bg-slate-950/5">
                <img 
                  src={vehicle.images?.[activeImageIndex] || 'https://via.placeholder.com/800x450?text=No+Image'} 
                  alt={vehicle.model} 
                  className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                />

                {/* Fullscreen Expand Button */}
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 p-3 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer opacity-90 hover:opacity-100"
                  title="Expand Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Arrow Controls */}
                {vehicle.images && vehicle.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex(prev => (prev === 0 ? vehicle.images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur-md hover:bg-blue-600 text-slate-800 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex(prev => (prev === vehicle.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur-md hover:bg-blue-600 text-slate-800 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Category & Status Pill Bar */}
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pointer-events-none">
                  <span className="bg-slate-900/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                    {vehicle.category === 'Car' ? t('car') : vehicle.category === 'Motorcycle' ? t('motorcycle') : vehicle.category === 'JetSki' ? t('jetski') : vehicle.category}
                  </span>
                  {vehicle.subcategory && (
                    <span className="bg-blue-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                      {vehicle.subcategory === 'Wedding Vehicles' ? '💍 Wedding' : vehicle.subcategory}
                    </span>
                  )}
                  {vehicle.discount?.percentage > 0 && (
                    <span className="bg-rose-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                      -{vehicle.discount.percentage}% {vehicle.discount.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {vehicle.images && vehicle.images.length > 1 && (
                <div className="flex gap-3 mt-3 overflow-x-auto p-1 custom-scrollbar">
                  {vehicle.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 sm:w-24 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${activeImageIndex === idx ? 'border-blue-600 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Header & Title */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    {vehicle.make} <span className="text-blue-600">{vehicle.model}</span>
                  </h1>
                  <p className="text-slate-400 font-extrabold text-sm uppercase tracking-wider mt-1">
                    {vehicle.year} {t('editionLabel', 'Edition')} • {vehicle.category}
                  </p>
                </div>
                
                {/* Guaranteed badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-700 text-xs font-extrabold">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>{t('payOnSiteTitle', 'Pay On Pickup')}</span>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('transmission', 'Transmission')}</span>
                  <span className="text-sm font-extrabold text-slate-900 truncate block">
                    {vehicle.features?.transmission ? t(vehicle.features.transmission.toLowerCase(), vehicle.features.transmission) : 'Standard'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Fuel className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('fuelType', 'Fuel')}</span>
                  <span className="text-sm font-extrabold text-slate-900 truncate block">
                    {vehicle.features?.fuel ? t(vehicle.features.fuel.toLowerCase(), vehicle.features.fuel) : 'Petrol'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('driverOptionLabel', 'Chauffeur')}</span>
                  <span className="text-sm font-extrabold text-slate-900 truncate block">
                    {vehicle.driverOption?.available ? t('driverEnabled', 'Available') : t('driverDisabled', 'Self-Drive')}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('refundable', 'Deposit')}</span>
                  <span className="text-sm font-extrabold text-slate-900 truncate block">
                    {vehicle.securityDeposit ? formatPrice(vehicle.securityDeposit) : t('optional', 'Optional')}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs for Presentation - Fully Responsive Segmented Grid */}
            <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { 
                  id: 'overview', 
                  shortLabel: locale === 'fr' ? 'Aperçu' : locale === 'ar' ? 'نظرة عامة' : 'Overview',
                  fullLabel: t('overviewTab', 'Overview') 
                },
                { 
                  id: 'specs', 
                  shortLabel: locale === 'fr' ? 'Specs' : locale === 'ar' ? 'المواصفات' : 'Specs',
                  fullLabel: t('specifications', 'Specifications') 
                },
                { 
                  id: 'rules', 
                  shortLabel: locale === 'fr' ? 'Règlement' : locale === 'ar' ? 'الشروط' : 'Rules & Caution',
                  fullLabel: locale === 'fr' ? 'Règlement & Caution' : t('rentalRules', 'Rental Rules & Caution') 
                },
                { 
                  id: 'faq', 
                  shortLabel: t('faqTab', 'FAQ'),
                  fullLabel: t('faqTab', 'FAQ') 
                },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-2 sm:px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 text-center cursor-pointer flex items-center justify-center ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-md scale-[1.02]' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="sm:hidden truncate">{tab.shortLabel}</span>
                  <span className="hidden sm:inline truncate">{tab.fullLabel}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-8 mb-14">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  
                  {/* Hero Landing Image Showcase - 100% Full Width Showcase Banner */}
                  {vehicle.landingImage && (
                    <div className="w-full rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm bg-white">
                      <img 
                        src={vehicle.landingImage} 
                        alt="Vehicle Presentation Banner" 
                        className="w-full min-w-full h-auto block" 
                      />
                    </div>
                  )}

                  {/* Localized Description Box */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                    <h3 className="text-xl font-black text-slate-900">{t('aboutThisVehicle', 'About this Vehicle')}</h3>

                    {localizedDesc ? (
                      <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm sm:text-base space-y-3 font-medium">
                        {localizedDesc.split('\n').filter((l: string) => l.trim()).map((paragraph: string, idx: number) => (
                          <p key={idx}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic text-sm">
                        {t(
                          'defaultVehicleDesc',
                          locale === 'fr' 
                            ? `Véhicule d'exception révisé avec soin par nos équipes d'experts ${siteSettings?.storeName || 'LuxeRent'}.` 
                            : locale === 'ar'
                            ? `مركبة ممتازة تمت معاينتها بعناية من طرف فريق خبرائنا في ${siteSettings?.storeName || 'LuxeRent'}.`
                            : `Prestige vehicle carefully inspected by our expert team at ${siteSettings?.storeName || 'LuxeRent'}.`
                        )}
                      </p>
                    )}
                  </div>

                  {/* Trust Highlights */}
                  <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
                    <h4 className="text-lg font-black flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" /> {t('whyRentWithUs', 'Why Rent With Us?')}
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-6 text-sm">
                      <div className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white mb-1">{t('excellentCondition', 'Meticulously Maintained')}</p>
                          <p className="text-slate-400 text-xs leading-relaxed">{t('excellentConditionDesc')}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white mb-1">{t('payOnSiteTitle', 'Zero Online Fee')}</p>
                          <p className="text-slate-400 text-xs leading-relaxed">{t('payOnSiteDetail')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SPECIFICATIONS */}
              {activeTab === 'specs' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-xl font-black text-slate-900 mb-6">{t('specifications', 'Technical Specifications')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(vehicle.features || {}).map(([key, value]) => {
                      if (value === undefined || value === null) return null;
                      const label = t(`${key}Label`, key.replace('_', ' '));
                      let valStr = value.toString();
                      if (typeof value === 'boolean') {
                        valStr = value ? t('yes', 'Yes') : t('no', 'No');
                      } else {
                        valStr = t(value.toString().toLowerCase(), value.toString());
                      }
                      return (
                        <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
                          <span className="text-base font-black text-slate-900">{valStr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: RULES & CAUTION */}
              {activeTab === 'rules' && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  
                  {/* Requirements Card */}
                  <div className="bg-blue-50/60 rounded-3xl p-6 sm:p-8 border border-blue-100">
                    <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" /> {t('rentalRequirements', 'Rental Requirements')}
                    </h4>
                    {vehicle.securityDeposit ? (
                      <div className="p-4 bg-white rounded-2xl border border-blue-100 mb-4 shadow-sm">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">{t('securityDepositLabel', 'Caution Deposit')}</span>
                        <span className="text-2xl font-black text-slate-900 block mb-1">{formatCurrency(vehicle.securityDeposit)}</span>
                        <span className="text-xs text-slate-500 font-medium">{t('cautionRefundableDesc')}</span>
                      </div>
                    ) : null}
                    <ul className="space-y-3 text-sm font-semibold text-slate-700">
                      {localizedReqs ? localizedReqs.split('\n').filter((l:string)=>l.trim()).map((req: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      )) : (
                        <>
                          <li className="flex gap-2.5 items-start">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>{locale === 'fr' ? 'Permis de conduire valide (min 1 à 2 ans)' : 'Valid Driving License (Min 1 to 2 years)'}</span>
                          </li>
                          <li className="flex gap-2.5 items-start">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>{locale === 'fr' ? 'Pièce d\'identité ou Passeport valide' : 'Valid National ID or Passport'}</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Conditions Card */}
                  <div className="bg-amber-50/60 rounded-3xl p-6 sm:p-8 border border-amber-100">
                    <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600" /> {t('conditionsLabel', 'Rental Terms')}
                    </h4>
                    <ul className="space-y-3 text-sm font-semibold text-slate-700">
                      {localizedConds ? localizedConds.split('\n').filter((l:string)=>l.trim()).map((cond: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>{cond}</span>
                        </li>
                      )) : (
                        <>
                          <li className="flex gap-2.5 items-start">
                            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{locale === 'fr' ? 'Restitution avec le même niveau de carburant' : 'Return with same fuel level'}</span>
                          </li>
                          <li className="flex gap-2.5 items-start">
                            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{locale === 'fr' ? 'Véhicule non-fumeur' : 'Strict Non-Smoking vehicle policy'}</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 4: FAQ */}
              {activeTab === 'faq' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4 animate-in fade-in duration-300">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" /> {t('faqTitle', 'Frequently Asked Questions')}
                  </h3>
                  <div className="space-y-3">
                    {faqs.map((faq: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                          className="w-full p-4 sm:p-5 text-left flex justify-between items-center gap-4 bg-slate-50/50 hover:bg-slate-100/60 transition-colors font-extrabold text-slate-900 text-sm sm:text-base cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaqIndex === idx ? 'rotate-180 text-blue-600' : ''}`} />
                        </button>
                        {openFaqIndex === idx && (
                          <div className="p-4 sm:p-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-white">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Similar Vehicles Carousel / Showcase */}
            {similarVehicles.length > 0 && (
              <div className="pt-8 border-t border-slate-200">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('similarVehicles', 'Similar Vehicles')}</h3>
                    <p className="text-xs text-slate-500 font-bold">{t('similarVehiclesDesc', 'Explore other available options in our fleet')}</p>
                  </div>
                  <Link href="/fleet" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                    {t('viewAllFleet', 'View All')} &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similarVehicles.map((simV: any) => (
                    <Link
                      key={simV._id}
                      href={`/fleet/${simV._id}`}
                      className="bg-white p-4 rounded-3xl border border-slate-200/80 hover:border-blue-400 hover:shadow-lg transition-all group flex gap-4 items-center"
                    >
                      <div className="w-28 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0 p-1">
                        <img src={simV.images?.[0]} alt={simV.model} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">{simV.make}</span>
                        <h4 className="font-extrabold text-slate-900 truncate text-base group-hover:text-blue-600 transition-colors">{simV.model}</h4>
                        <span className="text-xs font-black text-slate-700 mt-1 block">
                          {formatCurrency(simV.pricePerDay || simV.pricePerHour)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Sticky Reservation Panel */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sticky top-24">
              
              {/* Daily Rate & Discount header */}
              <div className="pb-6 mb-6 border-b border-slate-100">
                {vehicle.discount?.percentage > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 line-through">
                      {formatPrice(vehicle.pricePerDay || vehicle.pricePerHour)}
                    </span>
                    <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      -{vehicle.discount.percentage}% {vehicle.discount.label}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {formatPrice(
                      vehicle.discount?.percentage > 0
                        ? (vehicle.pricePerDay || vehicle.pricePerHour) * (1 - vehicle.discount.percentage / 100)
                        : (vehicle.pricePerDay || vehicle.pricePerHour)
                    )}
                  </span>
                  <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                    /{vehicle.pricePerDay ? (locale === 'ar' ? 'يوم' : locale === 'fr' ? 'jour' : 'day') : (locale === 'ar' ? 'ساعة' : locale === 'fr' ? 'heure' : 'hour')}
                  </span>
                </div>
              </div>

              <form onSubmit={handleBookNow} className="space-y-5">
                
                {/* Quick Presets */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {t('rentalDates', 'Quick Schedule Presets')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button type="button" onClick={() => setPreset('today')} className="py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-black rounded-xl border border-slate-200/80 transition-colors uppercase tracking-wider">{t('todayPreset', 'Today')}</button>
                    <button type="button" onClick={() => setPreset('tomorrow')} className="py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-black rounded-xl border border-slate-200/80 transition-colors uppercase tracking-wider">{t('tomorrowPreset', 'Tomorrow')}</button>
                    <button type="button" onClick={() => setPreset('weekend')} className="py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-black rounded-xl border border-slate-200/80 transition-colors uppercase tracking-wider">{t('weekendPreset', 'Weekend')}</button>
                  </div>
                </div>

                {/* Pickup Location select */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> {t('pickupLocation', 'Pickup Location')}
                  </label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-extrabold text-slate-800 text-sm cursor-pointer"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                  >
                    <option value="" disabled>{t('selectLocation', 'Select a location')}</option>
                    {getLocationsForCategory().map((loc: any) => (
                      <option key={loc.name} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Pickup Date & Time */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> {t('pickupDate', 'Pickup Date & Time')}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      required 
                      min={todayStr}
                      max={maxDateStr}
                      className="flex-[2] bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                    />
                    <input 
                      type="time" 
                      required 
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Return Date & Time */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> {t('returnDate', 'Return Date & Time')}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      required 
                      min={pickupDate || todayStr}
                      max={maxDateStr}
                      className="flex-[2] bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                    <input 
                      type="time" 
                      required 
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Chauffeur Service Selector (If Available) */}
                {vehicle.driverOption?.available && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" /> {t('driverPrompt', 'Professional Chauffeur')}
                      </span>
                      <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        +{formatPrice(vehicle.driverOption.pricePerDay)}/{t('dayCountUnit', 'day')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIncludeDriver(false)}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${!includeDriver ? 'bg-white border-blue-600 text-blue-700 shadow-sm' : 'bg-transparent border-slate-200 text-slate-500'}`}
                      >
                        {t('selfDrive', 'Self-Drive')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncludeDriver(true)}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${includeDriver ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-transparent border-slate-200 text-slate-500'}`}
                      >
                        {t('withChauffeur', 'With Driver')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Calculation Summary Box */}
                {calculation && (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 animate-in fade-in duration-200 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{t('durationLabel', 'Duration')}</span>
                      <span className="font-bold text-white">{calculation.duration} {calculation.unitLabel}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{t('baseRentalLabel', 'Base rental')}</span>
                      <span className="font-bold text-white">{formatPrice(calculation.baseSubtotal)}</span>
                    </div>
                    {includeDriver && calculation.driverFee > 0 && (
                      <div className="flex justify-between items-center text-blue-400 font-bold">
                        <span>{t('driverPrompt', 'Chauffeur Service')}</span>
                        <span>+{formatPrice(calculation.driverFee)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm font-black">
                      <span className="text-slate-200">{t('estimatedTotal', 'Estimated Total')}</span>
                      <span className="text-xl text-blue-400">{formatPrice(calculation.grandTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Blocked dates warning */}
                {vehicle.unavailabilityDates && vehicle.unavailabilityDates.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                    <p className="text-[11px] font-black text-rose-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {t('unavailableDatesLabel', 'Unavailable Dates:')}
                    </p>
                    <ul className="text-[10px] text-rose-600 space-y-0.5 font-bold">
                      {vehicle.unavailabilityDates.map((date: any, idx: number) => (
                        <li key={idx}>&bull; {new Date(date.start).toLocaleDateString(locale)} {t('toWord', 'to')} {new Date(date.end).toLocaleDateString(locale)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Submit button */}
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-black text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-[0.99] cursor-pointer group"
                >
                  <span>{t('reservePayLater', 'Reserve Now (Pay Later)')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-500">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('secureBooking', 'Zero upfront deposit. Pay on-site.')}</span>
                </div>

              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
