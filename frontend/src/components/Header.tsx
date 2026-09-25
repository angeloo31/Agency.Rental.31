'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Car, Menu, X, ChevronRight, Home, Shield, Info, MapPin } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export function Header() {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { name: t('home', 'Home'), href: '/', icon: Home },
    { name: t('fleet', 'Our Fleet'), href: '/fleet', icon: Car },
    { name: t('aboutUs', 'About Us'), href: '/about', icon: Info },
    { name: t('pickupLocations', 'Pickup Locations'), href: '/about', icon: MapPin },
  ];

  return (
    <div className="sticky top-3 sm:top-4 z-50 w-full px-3 sm:px-6 lg:px-8 transition-all duration-500">
      <header className="max-w-7xl mx-auto h-16 md:h-20 bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl md:rounded-full px-4 md:px-8 flex items-center justify-between relative">
        
        {/* Brand Logo */}
        <Link 
          href="/" 
          onClick={closeMobileMenu}
          className="flex items-center gap-2.5 sm:gap-3 text-xl sm:text-2xl font-black tracking-tight group flex-row"
        >
          {settings?.storeLogo ? (
            <img 
              src={settings.storeLogo} 
              alt={settings?.storeName || 'LuxeRent'} 
              className="h-8 sm:h-10 object-contain group-hover:-translate-y-0.5 transition-transform duration-300 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" 
            />
          ) : (
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:-translate-y-0.5 transition-all duration-300" 
              style={{ 
                background: `linear-gradient(to top right, var(--brand-primary), var(--brand-secondary))`, 
                boxShadow: '0 10px 15px -3px color-mix(in srgb, var(--brand-secondary) 30%, transparent)' 
              }}
            >
              <Car className="w-5 h-5" />
            </div>
          )}
          <span 
            className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
            style={settings?.mainColors?.primary ? { backgroundImage: `linear-gradient(to right, ${settings.mainColors.primary}, ${settings.mainColors.primary})` } : {}}
          >
            {settings?.storeName || 'LuxeRent'}
          </span>
        </Link>

        {/* Desktop Navigation & Actions */}
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8 flex-row">
          
          <nav className="hidden md:flex items-center gap-2 font-bold text-sm text-slate-600 flex-row">
            {isAdmin ? (
              <Link 
                href="/" 
                className="px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                {t('backToWeb')}
              </Link>
            ) : (
              <>
                <Link 
                  href="/" 
                  className={`px-4 py-2 rounded-full transition-all duration-300 ${pathname === '/' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {t('home')}
                </Link>
                <Link 
                  href="/fleet" 
                  className={`px-4 py-2 rounded-full transition-all duration-300 ${pathname?.startsWith('/fleet') ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {t('fleet')}
                </Link>
                <Link 
                  href="/about" 
                  className={`px-4 py-2 rounded-full transition-all duration-300 ${pathname?.startsWith('/about') ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {t('aboutUs')}
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Hamburger Menu Trigger Button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="md:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-center text-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl rounded-3xl p-4 md:hidden animate-in fade-in zoom-in-95 duration-200 z-50">
            <div className="space-y-1.5">
              {isAdmin ? (
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-md"
                >
                  <span>{t('backToWeb')}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center justify-between p-3.5 rounded-2xl font-black text-sm transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{link.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </Link>
                  );
                })
              )}
            </div>

            {/* Quick Mobile Contact Callout */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between px-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{settings?.storeName || 'LuxeRent'}</span>
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <Shield className="w-3.5 h-3.5" /> 100% Pay On Pickup
              </span>
            </div>
          </div>
        )}

      </header>
    </div>
  );
}
