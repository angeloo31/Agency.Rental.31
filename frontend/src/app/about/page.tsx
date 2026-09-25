'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useBooking } from '@/context/BookingContext';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Phone, Mail, Clock, Send, CheckCircle2, 
  Map, Star, ShieldCheck, Compass, Info, Sparkles,
  Plane, Building2, Waves, ArrowRight, Car, Bike, Ship, Navigation, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AboutPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { setBookingData } = useBooking();

  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocs, setLoadingLocs] = useState(true);

  // Agency Location Filter & Booking State
  const [selectedType, setSelectedType] = useState<string>('All');

  const handleSelectLocation = (locName: string) => {
    setBookingData((prev: any) => ({ ...prev, pickupLocation: locName }));
    router.push('/fleet');
  };

  const getLocationImage = (loc: any) => {
    if (loc.coverImage && loc.coverImage.trim() !== '') {
      return loc.coverImage;
    }
    const locName = loc.name?.toLowerCase() || '';
    const type = loc.type?.toLowerCase() || '';
    
    if (locName.includes('alger') && (type.includes('airport') || locName.includes('aéroport'))) {
      return 'https://images.unsplash.com/photo-1542296332-2e4473faf563?q=80&w=800&auto=format&fit=crop';
    }
    if (locName.includes('oran') && (type.includes('airport') || locName.includes('aéroport'))) {
      return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop';
    }
    if (type === 'marina' || locName.includes('marina') || locName.includes('sidi fredj') || locName.includes('beach') || locName.includes('andalouses')) {
      return 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=800&auto=format&fit=crop';
    }
    if (type === 'city' || locName.includes('centre')) {
      return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop';
  };

  const getLocationBadge = (type: string, locLocale: string) => {
    if (type === 'Airport') {
      return { icon: Plane, label: locLocale === 'ar' ? 'مطار VIP' : locLocale === 'fr' ? 'Hub Aéroport' : 'Airport VIP Hub', color: 'bg-blue-600 text-white' };
    }
    if (type === 'Marina') {
      return { icon: Waves, label: locLocale === 'ar' ? 'مرسى وبحر' : locLocale === 'fr' ? 'Base Nautique' : 'Marina Base', color: 'bg-cyan-600 text-white' };
    }
    return { icon: Building2, label: locLocale === 'ar' ? 'وسط المدينة' : locLocale === 'fr' ? 'Agence Centrale' : 'City Center', color: 'bg-indigo-600 text-white' };
  };

  const filteredLocations = selectedType === 'All' 
    ? locations 
    : locations.filter(loc => loc.type === selectedType);

  // Hero Banner Background Slideshow State
  const [activeSlide, setActiveSlide] = useState(0);

  const defaultHeroPictures = [
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1920&auto=format&fit=crop'
  ];

  const heroSlides = settings?.aboutStory?.backgroundImage 
    ? [settings.aboutStory.backgroundImage, ...defaultHeroPictures.slice(1)]
    : defaultHeroPictures;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSettings(data);
            if (data.locations) {
              setLocations(data.locations);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoadingLocs(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(locale === 'fr' ? 'Échec de l\'envoi du message. Veuillez réessayer.' : 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative isolate overflow-hidden bg-slate-50 min-h-screen">
      
      {/* Dynamic Animated Dark Hero Section with Picture Slideshow & Levitating Fleet Showcase */}
      <div className="relative bg-slate-950 text-white pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden shadow-2xl isolate border-b border-slate-800/80">
        
        {/* Animated Background Picture Carousel Layer */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          {heroSlides.map((slideUrl, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === activeSlide ? 'opacity-35 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img 
                src={slideUrl} 
                alt={`Slide ${idx + 1}`} 
                className={`w-full h-full object-cover ${settings?.aboutStory?.animateBackground !== false ? 'animate-subtle-zoom' : ''}`}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/85 to-slate-950 z-20 pointer-events-none" />
        </div>

        {/* Multi-layered Animated Ambient Light Orbs */}
        {settings?.aboutStory?.animateBackground !== false && (
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/25 rounded-full blur-[100px] animate-float-blob" />
            <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/25 rounded-full blur-[120px] animate-float-blob-alt" />
            <div className="absolute -top-20 right-1/3 w-80 h-80 bg-sky-500/20 rounded-full blur-[90px] animate-pulse-slow" />
          </div>
        )}

        {/* Animated Cyber Mesh Grid Overlay */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Main Banner Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
          
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-extrabold mb-6 tracking-widest uppercase shadow-lg shadow-blue-500/10 backdrop-blur-md hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-4 h-4 text-blue-400 animate-spin-slow" /> {t('aboutUs')}
          </div>

          {/* Shimmering Dynamic Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-none drop-shadow-2xl">
            <span className="animate-shimmer-text bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              {t('aboutTitle')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-md sm:text-lg md:text-xl text-slate-300/90 mb-10 max-w-3xl mx-auto font-light leading-relaxed tracking-wide drop-shadow">
            {settings?.aboutStory?.subtitle?.[locale] || settings?.aboutStory?.subtitle?.fr || settings?.aboutStory?.subtitle?.en || t('aboutSubtitleText')}
          </p>

          {/* Levitating Animated Vehicle Picture Showcase Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10">
            {[
              {
                title: locale === 'ar' ? 'سيارات فاخرة' : locale === 'fr' ? 'Voitures de Prestige' : 'Prestige Cars',
                image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800&auto=format&fit=crop',
                badge: '🏎️ Elite Fleet',
                animationClass: 'animate-float-blob'
              },
              {
                title: locale === 'ar' ? 'دراجات نارية' : locale === 'fr' ? 'Motos Sportives' : 'Superbikes',
                image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop',
                badge: '🏍️ Sport Fleet',
                animationClass: 'animate-float-blob-alt'
              },
              {
                title: locale === 'ar' ? 'جي سكي' : locale === 'fr' ? 'Jet Skis Exclusive' : 'Marine Fleet',
                image: 'https://images.unsplash.com/photo-1563299796-b729d0af54a5?q=80&w=800&auto=format&fit=crop',
                badge: '🌊 Marine Fleet',
                animationClass: 'animate-pulse-slow'
              }
            ].map((card, idx) => (
              <div
                key={idx}
                className={`relative group overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md shadow-2xl transition-all duration-500 hover:scale-[1.04] hover:border-blue-400/50 hover:shadow-blue-500/20 ${card.animationClass}`}
              >
                <div className="h-44 sm:h-52 w-full overflow-hidden relative">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow">
                    {card.badge}
                  </span>
                </div>
                <div className="p-4 text-center bg-slate-950/85 backdrop-blur-md border-t border-white/10">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Slide Control Indicators */}
          <div className="mt-10 flex justify-center items-center gap-2">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  idx === activeSlide ? 'w-8 bg-blue-500 shadow-lg shadow-blue-500/50' : 'w-2.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Story & Vision Section with Background Picture & Motion Animation */}
        {(() => {
          const bgImg = settings?.aboutStory?.backgroundImage;
          const isAnimated = settings?.aboutStory?.animateBackground !== false;
          const hasBg = Boolean(bgImg);

          return (
            <div className={`relative isolate overflow-hidden rounded-[2.5rem] p-8 sm:p-12 lg:p-16 mb-24 transition-all duration-500 shadow-2xl ${hasBg ? 'text-white border border-white/10 bg-slate-950' : 'bg-white border border-slate-200/80'}`}>
              
              {/* Background Image Layer & Animation */}
              {hasBg && (
                <div className="absolute inset-0 -z-10 overflow-hidden">
                  <img 
                    src={bgImg} 
                    alt="Notre Histoire Background" 
                    className={`w-full h-full object-cover opacity-35 ${isAnimated ? 'animate-subtle-zoom' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-950/90 backdrop-blur-[2px]" />
                </div>
              )}

              {/* Ambient Animated Glow when background animation is enabled */}
              {!hasBg && isAnimated && (
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                  <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-blob" />
                  <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-blob-alt" />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="animate-fade-in-up delay-75">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6 uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" /> {t('ourStoryTag', 'Notre Histoire')}
                  </div>
                  <h2 className={`text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight ${hasBg ? 'text-white drop-shadow-md' : 'text-slate-900'}`}>
                    {settings?.aboutStory?.title?.[locale] || settings?.aboutStory?.title?.fr || settings?.aboutStory?.title?.en || t('aboutStoryTitle')}
                  </h2>
                  <p className={`text-base md:text-lg leading-relaxed mb-6 font-medium ${hasBg ? 'text-slate-200' : 'text-slate-600'}`}>
                    {settings?.aboutStory?.text1?.[locale] || settings?.aboutStory?.text1?.fr || settings?.aboutStory?.text1?.en || t('aboutStoryText1')}
                  </p>
                  <p className={`text-base md:text-lg leading-relaxed font-medium ${hasBg ? 'text-slate-300' : 'text-slate-600'}`}>
                    {settings?.aboutStory?.text2?.[locale] || settings?.aboutStory?.text2?.fr || settings?.aboutStory?.text2?.en || t('aboutStoryText2')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-up delay-150">
                  {[
                    { 
                      icon: ShieldCheck, 
                      title: t('completeTrustTitle'), 
                      desc: t('completeTrustDesc') 
                    },
                    { 
                      icon: Star, 
                      title: t('premiumQualityTitle'), 
                      desc: t('premiumQualityDesc') 
                    },
                    { 
                      icon: Compass, 
                      title: t('totalFlexibilityTitle'), 
                      desc: t('totalFlexibilityDesc') 
                    },
                    { 
                      icon: Clock, 
                      title: t('flexibleHoursTitle'), 
                      desc: t('flexibleHoursDesc') 
                    }
                  ].map((value, idx) => {
                    const Icon = value.icon;
                    return (
                      <div 
                        key={idx} 
                        className={`p-6 rounded-2xl transition-all duration-300 group hover:scale-[1.03] ${
                          hasBg 
                            ? 'bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 hover:border-white/30 text-white shadow-lg' 
                            : 'bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xl hover:border-blue-500/20'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                          hasBg
                            ? 'bg-white/15 text-blue-300 group-hover:bg-blue-600 group-hover:text-white'
                            : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className={`text-md font-extrabold mb-2 ${hasBg ? 'text-white' : 'text-slate-900'}`}>{value.title}</h3>
                        <p className={`text-xs font-medium leading-relaxed ${hasBg ? 'text-slate-300' : 'text-slate-500'}`}>{value.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Pickup Locations Section (Redesigned & High-End) */}
        <div className="mb-24 animate-fade-in-up delay-300">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-extrabold mb-4 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-blue-600" /> {t('pickupLocations', 'Nos Agences')}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
              {t('ourLocations')}
            </h2>
            <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed">
              {t('ourLocationsSubtitle')}
            </p>

            {/* Interactive Type Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {[
                { id: 'All', label: locale === 'ar' ? 'الكل' : locale === 'fr' ? 'Toutes les Agences' : 'All Agencies' },
                { id: 'Airport', label: locale === 'ar' ? 'المطارات' : locale === 'fr' ? 'Aéroports' : 'Airports', icon: Plane },
                { id: 'City', label: locale === 'ar' ? 'وسط المدينة' : locale === 'fr' ? 'Centre-Ville' : 'City Agencies', icon: Building2 },
                { id: 'Marina', label: locale === 'ar' ? 'الموانئ والشواطئ' : locale === 'fr' ? 'Marinas & Plages' : 'Marinas & Coastal', icon: Waves }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedType(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingLocs ? (
              <div className="col-span-full text-center py-16 text-slate-400 font-bold animate-pulse flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading agency locations...</span>
              </div>
            ) : filteredLocations.length > 0 ? (
              filteredLocations.map((loc, idx) => {
                const coverImage = getLocationImage(loc);
                const badgeInfo = getLocationBadge(loc.type, locale);
                const BadgeIcon = badgeInfo.icon;

                return (
                  <div 
                    key={idx}
                    className="bg-white rounded-[2.2rem] overflow-hidden border border-slate-200/80 shadow-md hover:shadow-[0_25px_50px_-12px_rgba(15,23,42,0.18)] hover:border-blue-500/40 hover:-translate-y-1.5 transition-all duration-500 flex flex-col h-full group"
                  >
                    {/* Cover Image & Header */}
                    <div className="h-52 w-full relative overflow-hidden shrink-0">
                      <img 
                        src={coverImage} 
                        alt={loc.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      
                      {/* Top Type Badge */}
                      <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md ${badgeInfo.color}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badgeInfo.label}
                      </span>

                      {/* City Tag */}
                      <span className="absolute top-4 right-4 px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow">
                        📍 {loc.city || 'Algérie'}
                      </span>

                      {/* Agency Name */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-xl font-black tracking-tight leading-snug drop-shadow-md group-hover:text-blue-300 transition-colors">
                          {loc.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content & Details */}
                    <div className="p-6 flex flex-col justify-between flex-grow gap-6 bg-white">
                      
                      <div className="space-y-4">
                        {/* Address */}
                        {loc.address && (
                          <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">{t('addressLabel')}</span>
                              <span className="text-xs text-slate-700 font-bold leading-relaxed">{loc.address}</span>
                            </div>
                          </div>
                        )}

                        {/* Operating Hours */}
                        {loc.hours && (
                          <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">{t('operatingHours')}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-800 font-black">{loc.hours}</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Open
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Supported Categories Pills */}
                        {loc.categories && loc.categories.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Available Fleet:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {loc.categories.includes('Car') && (
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-extrabold rounded-lg flex items-center gap-1 border border-blue-100">
                                  <Car className="w-3 h-3" /> Cars
                                </span>
                              )}
                              {loc.categories.includes('Motorcycle') && (
                                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[11px] font-extrabold rounded-lg flex items-center gap-1 border border-purple-100">
                                  <Bike className="w-3 h-3" /> Motorcycles
                                </span>
                              )}
                              {loc.categories.includes('JetSki') && (
                                <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-[11px] font-extrabold rounded-lg flex items-center gap-1 border border-cyan-100">
                                  <Ship className="w-3 h-3" /> Jet Skis
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectLocation(loc.name)}
                          className="w-full py-3 bg-slate-900 text-white hover:bg-blue-600 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                        >
                          <span>{t('bookAtThisLocation', 'Réserver à cette Agence')}</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          {loc.address && (
                            <a
                              href={loc.googleMapLink || `https://maps.google.com/maps?q=${encodeURIComponent(loc.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Navigation className="w-3.5 h-3.5 text-blue-600" />
                              <span>{t('mapView')}</span>
                            </a>
                          )}
                          {loc.phone && (
                            <a
                              href={`tel:${loc.phone.replace(/\s+/g, '')}`}
                              className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Call Agency</span>
                            </a>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200/80 text-slate-400 font-bold">
                {t('noLocationsConfigured')}
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────── CONTACT SECTION ─────────────────── */}
        <div className="max-w-6xl mx-auto animate-fade-in-up delay-450">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/30">

            {/* Dark cinematic hero header */}
            <div className="relative bg-slate-950 px-8 md:px-14 pt-14 pb-20 overflow-hidden">
              {/* Ambient orbs */}
              <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-16 right-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-32 bg-sky-500/10 rounded-full blur-[60px] pointer-events-none" />

              {/* Grid overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a5f18_1px,transparent_1px),linear-gradient(to_bottom,#1e3a5f18_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-300 text-xs font-bold uppercase tracking-widest mb-5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  {locale === 'ar' ? 'نحن هنا من أجلك' : locale === 'fr' ? 'Nous sommes là pour vous' : 'We\'re here for you'}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-none">
                  {t('contactUs')}
                </h2>
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-lg">
                  {t('contactUsSubtitle')}
                </p>
              </div>
            </div>

            {/* Main content: info + form side by side */}
            <div className="relative -mt-8 grid grid-cols-1 lg:grid-cols-5 gap-0">

              {/* Left: Contact Info Panel */}
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-blue-950/80 to-slate-900 p-8 md:p-10 flex flex-col justify-between lg:rounded-bl-[2.5rem]">
                <div>
                  <h3 className="text-white font-black text-lg mb-1">
                    {locale === 'ar' ? 'معلومات التواصل' : locale === 'fr' ? 'Nos Coordonnées' : 'Contact Details'}
                  </h3>
                  <p className="text-slate-500 text-xs mb-8">
                    {locale === 'ar' ? 'تواصل معنا مباشرة' : locale === 'fr' ? 'Rejoignez-nous directement' : 'Reach us directly'}
                  </p>

                  <div className="space-y-5">
                    {/* Phone */}
                    {settings?.phone && (
                      <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="flex items-center gap-4 group">
                        <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition-colors">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest mb-0.5">
                            {locale === 'ar' ? 'هاتف' : locale === 'fr' ? 'Téléphone' : 'Phone'}
                          </p>
                          <p className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">{settings.phone}</p>
                        </div>
                      </a>
                    )}
                    {/* Email */}
                    {settings?.email && (
                      <a href={`mailto:${settings.email}`} className="flex items-center gap-4 group">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/30 transition-colors">
                          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest mb-0.5">Email</p>
                          <p className="text-white font-bold text-sm group-hover:text-indigo-400 transition-colors">{settings.email}</p>
                        </div>
                      </a>
                    )}
                    {/* Address */}
                    {settings?.address && (
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest mb-0.5">
                            {locale === 'ar' ? 'العنوان' : locale === 'fr' ? 'Adresse' : 'Address'}
                          </p>
                          <p className="text-white font-bold text-sm">{settings.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* VIP badge */}
                <div className="mt-10 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">⭐</span>
                    <span className="text-white font-extrabold text-sm">
                      {locale === 'ar' ? 'خدمة VIP' : locale === 'fr' ? 'Service VIP' : 'VIP Service'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {locale === 'ar'
                      ? 'نرد على طلباتكم خلال ساعة واحدة في أوقات العمل.'
                      : locale === 'fr'
                      ? 'Nous répondons à vos demandes en moins d\'1h en heures ouvrées.'
                      : 'We respond to your requests within 1 hour during business hours.'}
                  </p>
                </div>
              </div>

              {/* Right: The Form */}
              <div className="lg:col-span-3 bg-white p-8 md:p-12 lg:rounded-br-[2.5rem] lg:rounded-tr-none rounded-b-[2.5rem] lg:rounded-bl-none">
                {sent ? (
                  <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center animate-scale-in">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-pulse">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">✨</div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-3">{t('messageSent')}</h3>
                    <p className="text-slate-500 font-medium text-sm mb-8 max-w-sm">{t('messageSentDesc')}</p>
                    <button
                      onClick={() => setSent(false)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 text-sm"
                    >
                      {t('newMessage')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Full Name */}
                      <div className="group relative">
                        <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                          {t('fullName')}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                          </div>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full h-12 pl-10 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 placeholder:font-normal placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="group relative">
                        <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                          {t('emailAddress')}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                          </div>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full h-12 pl-10 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 placeholder:font-normal placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="group">
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                        {t('subject')}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
                        </div>
                        <select
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full h-12 pl-10 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 cursor-pointer appearance-none"
                        >
                          <option value="" disabled>{t('selectSubject')}</option>
                          <option value="General">{t('generalInquiry')}</option>
                          <option value="Partnership">{t('partnership')}</option>
                          <option value="VIP">{t('vipRequest')}</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="group">
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                        {t('message')}
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t('howCanWeHelp')}
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 resize-none placeholder:font-normal placeholder:text-slate-300 leading-relaxed"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={sending}
                      className="relative w-full h-14 rounded-2xl font-extrabold text-sm tracking-wide overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {/* gradient bg */}
                      <span className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 group-hover:from-slate-900 group-hover:to-slate-800 border border-slate-700/80 group-hover:border-slate-600 transition-all duration-300" />
                      {/* shimmer sweep */}
                      <span className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:translate-x-full" />
                      {/* shadow glow */}
                      <span className="absolute inset-0 rounded-2xl shadow-2xl shadow-slate-950/80 group-hover:shadow-black transition-all duration-300 -z-10" />
                      <span className="relative z-10 text-white flex items-center justify-center gap-2.5">
                        {sending ? (
                          <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            {t('sending')}
                          </>
                        ) : (
                          <>
                            {t('submitMessage')}
                            <Send className="w-4.5 h-4.5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
                          </>
                        )}
                      </span>
                    </button>

                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
