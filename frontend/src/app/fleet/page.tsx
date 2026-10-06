'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Fuel, Settings, Users, ArrowRight, Activity, Eye, ShieldAlert, Calendar, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { useBooking } from '@/context/BookingContext';
import { useSettings } from '@/context/SettingsContext';
import BrandLogo from '@/components/BrandLogo';

function FleetContent() {
  const { t } = useLanguage();
  const { formatPrice } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category') || 'All';
  const [vehicles, setVehicles] = useState([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(categoryParam);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Filter States
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  
  const { bookingData, setBookingData } = useBooking();
  const [pickupDate, setPickupDate] = useState(bookingData?.pickupDate || '');
  const [returnDate, setReturnDate] = useState(bookingData?.returnDate || '');

  // Keep global booking context in sync with local filter dates
  useEffect(() => {
    setBookingData(prev => ({
      ...prev,
      pickupDate,
      returnDate
    }));
  }, [pickupDate, returnDate, setBookingData]);

  // Automatically adjust default max price limit based on category
  useEffect(() => {
    if (category === 'JetSki') {
      setMaxPrice(30000);
    } else {
      setMaxPrice(100000);
    }
    // Reset specific features filters when category changes
    setSelectedTransmissions([]);
    setSelectedFuels([]);
    setSelectedSubcategories([]);
  }, [category]);

  const toggleTransmission = (t: string) => {
    setSelectedTransmissions(prev => 
      prev.includes(t) ? prev.filter(item => item !== t) : [...prev, t]
    );
  };

  const toggleFuel = (f: string) => {
    setSelectedFuels(prev => 
      prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
    );
  };

  const toggleSubcategory = (s: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    );
  };

  const clearAllFilters = () => {
    setMaxPrice(category === 'JetSki' ? 30000 : 100000);
    setSelectedTransmissions([]);
    setSelectedFuels([]);
    setSelectedSubcategories([]);
    setPickupDate('');
    setReturnDate('');
  };

  const filteredVehicles = vehicles.filter((vehicle: any) => {
    // Only show vehicles that belong to visible categories
    if (categoriesData.length > 0 && !categoriesData.some(c => c.name === vehicle.category)) {
      return false;
    }

    const price = vehicle.pricePerDay || vehicle.pricePerHour || 0;
    if (price > maxPrice) return false;

    if (selectedTransmissions.length > 0 && vehicle.features?.transmission) {
      if (!selectedTransmissions.includes(vehicle.features.transmission)) return false;
    }

    if (selectedFuels.length > 0 && vehicle.features?.fuel) {
      if (!selectedFuels.includes(vehicle.features.fuel)) return false;
    }

    if (selectedSubcategories.length > 0) {
      if (!vehicle.subcategory || !selectedSubcategories.includes(vehicle.subcategory)) return false;
    }

    return true;
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories/visible');
        if (res.ok) {
          const data = await res.json();
          setCategoriesData(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchVehicles(category, pickupDate, returnDate);
  }, [category, pickupDate, returnDate]);

  const fetchVehicles = async (cat: string, pDate: string, rDate: string) => {
    setLoading(true);
    try {
      let url = cat === 'All' ? '/api/vehicles' : `/api/vehicles?category=${cat}`;
      
      // Add date filters to URL if both are provided
      if (pDate && rDate) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}pickupDate=${pDate}&returnDate=${rDate}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setVehicles(data);
      } else {
        const text = await res.text();
        console.warn('Expected JSON response for vehicles list, got:', text.substring(0, 100));
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedSubcategory = (subEn: string) => {
    for (const catObj of categoriesData) {
      if (catObj.subcategories && catObj.subcategories.includes(subEn)) {
        const idx = catObj.subcategories.indexOf(subEn);
        if (catObj.subcategories_fr && catObj.subcategories_fr[idx]) {
          return catObj.subcategories_fr[idx];
        }
      }
    }
    return subEn;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_10%_150px,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent pointer-events-none" />
      
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2.5">
            {t('ourFleet')}
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            {t('fleetSubtitle')}
          </p>
        </div>
        
        {/* Category switcher */}
        <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
          <div className="flex p-1.5 bg-slate-100/80 border border-slate-200/50 rounded-2xl overflow-x-auto w-full lg:w-auto shrink-0 shadow-inner">
            {['All', ...categoriesData.map(c => c.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 whitespace-nowrap ${category === cat ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {cat === 'All' ? t('allVehicles') : cat === 'JetSki' ? t('jetskis') : t(cat.toLowerCase() + 's')}
              </button>
            ))}
          </div>

          {/* Subcategory quick chips */}
          {((category !== 'All' && categoriesData.find(c => c.name === category)?.subcategories?.length > 0) ||
            (category === 'All' && Array.from(new Set(categoriesData.flatMap(c => c.subcategories || []))).length > 0)) && (
            <div className="flex flex-wrap gap-2 justify-start lg:justify-end w-full">
              {(category === 'All'
                ? Array.from(new Set(categoriesData.flatMap(c => c.subcategories || [])))
                : (categoriesData.find(c => c.name === category)?.subcategories || [])
              ).map((sub: string) => {
                const isSelected = selectedSubcategories.includes(sub);
                const subTitle = getLocalizedSubcategory(sub);
                return (
                  <button
                    key={sub}
                    onClick={() => toggleSubcategory(sub)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all duration-200 border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {sub === 'Wedding Vehicles' ? `💍 ${subTitle}` : subTitle}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
        
        {/* Sidebar Filters */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24">
          
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="w-full bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 flex items-center justify-between font-black text-slate-900 text-sm"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>{t('filters')}</span>
                {(selectedTransmissions.length > 0 || selectedFuels.length > 0 || selectedSubcategories.length > 0 || pickupDate || returnDate) && (
                  <span className="bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {selectedTransmissions.length + selectedFuels.length + selectedSubcategories.length + (pickupDate ? 1 : 0)}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isMobileFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className={`bg-white border border-slate-200/80 rounded-[2.2rem] p-6 shadow-[0_15px_40px_rgba(15,23,42,0.03)] lg:max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar flex flex-col ${isMobileFilterOpen ? 'block mb-6' : 'hidden lg:flex'}`}>
            
            {/* Sticky Top Header */}
            <div className="sticky -top-6 -mt-6 pt-6 pb-4 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100 mb-6 flex justify-between items-center shrink-0">
              <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                {t('filters')}
              </h3>
              {(maxPrice < (category === 'JetSki' ? 30000 : 100000) || selectedTransmissions.length > 0 || selectedFuels.length > 0 || selectedSubcategories.length > 0 || pickupDate || returnDate) && (
                <button onClick={clearAllFilters} className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider">
                  {t('clearAll')}
                </button>
              )}
            </div>

            <div className="flex-1 space-y-8">
              {/* Date Filtering */}
              <div>
                <label className="font-black text-slate-800 text-sm flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-blue-600" /> {t('rentalDates')}
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">{t('pickupDate') || 'Pickup'}</label>
                    <Input 
                      type="datetime-local" 
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full text-sm rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">{t('returnDate') || 'Return'}</label>
                    <Input 
                      type="datetime-local" 
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={pickupDate}
                      className="w-full text-sm rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Price Slider */}
              <div>
                <label className="font-extrabold text-sm text-slate-700 block mb-4 flex justify-between">
                  <span>{t('maxPrice')}</span>
                  <span className="text-blue-600 font-black">
                    {maxPrice.toLocaleString('fr-DZ')} DA
                  </span>
                </label>
                <input 
                  type="range" 
                  min={0}
                  max={category === 'JetSki' ? 30000 : 100000}
                  step={category === 'JetSki' ? 1000 : 5000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" 
                />
                <div className="flex justify-between text-xs font-bold text-slate-400 mt-2.5">
                  <span>0 DA</span>
                  <span>
                    {(category === 'JetSki' ? 30000 : 100000).toLocaleString('fr-DZ')} DA/{category === 'JetSki' ? 'heure' : 'jour'}
                  </span>
                </div>
              </div>

              {/* Transmission Checkboxes */}
              {category !== 'JetSki' && (
                <div className="border-t border-slate-100 pt-6">
                  <label className="font-black text-slate-800 text-sm block mb-4">{t('transmission')}</label>
                  <div className="space-y-3.5">
                    {['Automatic', 'Manual'].map(tType => (
                      <label key={tType} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={selectedTransmissions.includes(tType)}
                          onChange={() => toggleTransmission(tType)}
                          className="w-5 h-5 accent-blue-600 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        />
                        <span className="font-bold text-slate-600 group-hover:text-slate-900 transition-colors text-sm">
                          {tType === 'Automatic' ? t('automatic') : t('manual')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Subcategory Checkboxes */}
              {category !== 'All' && categoriesData.find(c => c.name === category)?.subcategories?.length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <label className="font-black text-slate-800 text-sm block mb-4">{t('subcategoryLabel') || 'Subcategory'}</label>
                  <div className="space-y-3.5">
                    {categoriesData.find(c => c.name === category)?.subcategories.map((sub: string) => (
                      <label key={sub} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={selectedSubcategories.includes(sub)}
                          onChange={() => toggleSubcategory(sub)}
                          className="w-5 h-5 accent-blue-600 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        />
                        <span className="font-bold text-slate-600 group-hover:text-slate-900 transition-colors text-sm">
                          {sub}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Fuel Type Checkboxes */}
              <div className="border-t border-slate-100 pt-6">
                <label className="font-black text-slate-800 text-sm block mb-4">{t('fuelType')}</label>
                <div className="space-y-3.5">
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(fType => (
                    <label key={fType} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={selectedFuels.includes(fType)}
                        onChange={() => toggleFuel(fType)}
                        className="w-5 h-5 accent-blue-600 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="font-bold text-slate-600 group-hover:text-slate-900 transition-colors text-sm">
                        {fType === 'Petrol' ? t('petrol') : t(fType.toLowerCase()) || fType}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Footer Action */}
            <div className="sticky -bottom-6 -mb-6 pb-6 pt-4 bg-white/95 backdrop-blur-md z-10 border-t border-slate-100 mt-6 shrink-0">
              {(maxPrice < (category === 'JetSki' ? 30000 : 100000) || selectedTransmissions.length > 0 || selectedFuels.length > 0 || selectedSubcategories.length > 0 || pickupDate || returnDate) ? (
                <button 
                  onClick={clearAllFilters} 
                  className="w-full bg-slate-900 hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-950/10 hover:shadow-blue-600/20 text-sm cursor-pointer"
                >
                  {t('clearFilters')}
                </button>
              ) : (
                <div className="w-full text-center text-xs font-bold text-slate-400 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                  {t('showingAll')}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Grid Catalog Showcase */}
        <div className="flex-1 w-full">
          
          {/* Active Filter Tags */}
          {(maxPrice < (category === 'JetSki' ? 30000 : 100000) || selectedTransmissions.length > 0 || selectedFuels.length > 0 || pickupDate || returnDate) && (
            <div className="flex flex-wrap gap-2.5 items-center mb-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-in fade-in duration-300">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1.5">{t('activeFilters')}</span>
              {maxPrice < (category === 'JetSki' ? 30000 : 100000) && (
                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 font-extrabold px-3 py-1 rounded-full text-xs">
                  Max: {maxPrice.toLocaleString('fr-DZ')} DA/{category === 'JetSki' ? 'heure' : 'jour'}
                  <button onClick={() => setMaxPrice(category === 'JetSki' ? 30000 : 100000)} className="hover:text-red-500 font-black ml-1 text-sm">×</button>
                </div>
              )}
              {selectedTransmissions.map(tType => (
                <div key={tType} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 font-extrabold px-3 py-1 rounded-full text-xs">
                  {tType === 'Automatic' ? t('automatic') : t('manual')}
                  <button onClick={() => toggleTransmission(tType)} className="hover:text-red-500 font-black ml-1 text-sm">×</button>
                </div>
              ))}
              {selectedFuels.map(fType => (
                <div key={fType} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 font-extrabold px-3 py-1 rounded-full text-xs">
                  {fType === 'Petrol' ? t('petrol') : t(fType.toLowerCase()) || fType}
                  <button onClick={() => toggleFuel(fType)} className="hover:text-red-500 font-black ml-1 text-sm">×</button>
                </div>
              ))}
              {(pickupDate || returnDate) && (
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-3 py-1 rounded-full text-xs">
                  <Calendar className="w-3 h-3" />
                  {pickupDate ? new Date(pickupDate).toLocaleDateString() : '?'} - {returnDate ? new Date(returnDate).toLocaleDateString() : '?'}
                  <button onClick={() => { setPickupDate(''); setReturnDate(''); }} className="hover:text-red-500 font-black ml-1 text-sm">×</button>
                </div>
              )}
              <button onClick={clearAllFilters} className="text-xs font-extrabold text-red-500 hover:text-red-600 transition-colors ml-2 uppercase tracking-wider">{t('clearAll')}</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="bg-white border border-slate-200 border-dashed rounded-[2.5rem] p-16 text-center shadow-sm animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{t('noVehiclesMatch')}</h3>
              <p className="text-slate-500 text-lg mb-8 font-medium">{t('resetFiltersDesc')}</p>
              <button 
                onClick={clearAllFilters} 
                className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-slate-950/10 hover:shadow-blue-600/20"
              >
                {t('resetAllFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
              {filteredVehicles.map((vehicle: any) => (
                <div 
                  key={vehicle._id} 
                  onClick={() => router.push(`/fleet/${vehicle._id}`)}
                  className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-[2.2rem] overflow-hidden hover:shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition-all duration-500 group flex flex-col shadow-sm cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden relative bg-slate-100 p-2 flex items-center justify-center">
                    <img 
                      src={vehicle.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                      alt={vehicle.model} 
                      className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-700"
                    />
                    {vehicle.discount?.percentage > 0 && (
                      <div className="absolute top-3 left-3 sm:top-8 sm:left-8 bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-md">
                        -{vehicle.discount.percentage}% {vehicle.discount.label}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 sm:top-8 sm:right-8 flex flex-col items-end gap-1 sm:gap-1.5">
                      <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm border border-slate-100">
                        {vehicle.category}
                      </div>
                      {vehicle.subcategory && (
                        <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-sm border ${
                          vehicle.subcategory === 'Wedding Vehicles'
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'bg-slate-900 text-white border-slate-950'
                        }`}>
                          {vehicle.subcategory === 'Wedding Vehicles' ? `💍 ${getLocalizedSubcategory(vehicle.subcategory)}` : getLocalizedSubcategory(vehicle.subcategory)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3 sm:mb-6">
                        <div>
                          <h3 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                            <BrandLogo brand={vehicle.make} size={18} />
                            <span>{vehicle.make}</span>
                          </h3>
                          <p className="text-slate-500 text-[10px] sm:text-sm font-bold">{vehicle.model} &bull; {vehicle.year}</p>
                        </div>
                        <div className="text-right">
                          {vehicle.discount?.percentage > 0 ? (
                            <>
                              <span className="text-[9px] sm:text-xs text-slate-400 line-through font-bold block leading-none mb-0.5">
                                {formatPrice(vehicle.pricePerDay || vehicle.pricePerHour)}
                              </span>
                              <span className="text-sm sm:text-2xl font-black text-red-500">
                                {formatPrice((vehicle.pricePerDay || vehicle.pricePerHour) * (1 - vehicle.discount.percentage / 100))}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm sm:text-2xl font-black text-blue-600">
                              {formatPrice(vehicle.pricePerDay || vehicle.pricePerHour)}
                            </span>
                          )}
                           <span className="text-[9px] sm:text-xs text-slate-400 font-bold block mt-0.5">
                            /{vehicle.pricePerDay 
                              ? t('dayCountUnit')
                              : t('hourCountUnit')
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* Specifications badges */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3 sm:mb-8">
                        {vehicle.features?.transmission && (
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-150/50 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold text-slate-600">
                            <Settings className="w-3 h-3 sm:w-3.8 sm:h-3.8 text-blue-500" /> 
                            {vehicle.features.transmission === 'Automatic' ? t('automatic') : t('manual')}
                          </div>
                        )}
                        {vehicle.features?.fuel && (
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-150/50 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold text-slate-600">
                            <Fuel className="w-3 h-3 sm:w-3.8 sm:h-3.8 text-blue-500" /> 
                            {vehicle.features.fuel === 'Petrol' ? t('petrol') : t(vehicle.features.fuel.toLowerCase()) || vehicle.features.fuel}
                          </div>
                        )}
                        {vehicle.features?.doors && (
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-150/50 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold text-slate-600">
                            <Users className="w-3 h-3 sm:w-3.8 sm:h-3.8 text-blue-500" /> {vehicle.features.doors} {t('doorsLabel')}
                          </div>
                        )}
                        {vehicle.features?.cc && (
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-150/50 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold text-slate-600">
                            <Activity className="w-3 h-3 sm:w-3.8 sm:h-3.8 text-blue-500" /> {vehicle.features.cc}cc
                          </div>
                        )}
                      </div>
                    </div>

                    <div 
                      className="w-full bg-slate-900 group-hover:bg-blue-600 text-white py-2.5 sm:py-4.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-slate-950/5 group-hover:shadow-blue-600/20"
                    >
                      {t('reserveNow')} <ArrowRight className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 border-t-transparent"></div></div>}>
      <FleetContent />
    </Suspense>
  );
}
