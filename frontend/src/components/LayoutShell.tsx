'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { 
  Car, Phone, Mail, MapPin, 
  ArrowUp, ChevronRight, Compass, ChevronDown
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import { ChatbotWidget } from '@/components/ChatbotWidget';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Mobile Accordion state for compact footer
  const [expandedSection, setExpandedSection] = useState<'nav' | 'fleet' | 'contact' | null>(null);

  const toggleSection = (sec: 'nav' | 'fleet' | 'contact') => {
    setExpandedSection(prev => (prev === sec ? null : sec));
  };

  if (isAdmin) {
    return <>{children}</>;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footer = settings?.footer;
  const footerBgImg = footer?.backgroundImage || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1920&auto=format&fit=crop';
  const isFooterAnimated = footer?.animateBackground !== false;

  // Ticker: use CMS value split by " • ", else fallback array
  const rawTicker = footer?.tickerText?.fr || footer?.tickerText?.en || '';
  const tickerItems = rawTicker
    ? rawTicker.split('•').map(s => s.trim()).filter(Boolean)
    : [
        '⚡ PAIEMENT SUR PLACE 100%',
        '🏎️ FLOTTE DE PRESTIGE 2026',
        '🛡️ ZÉRO CAUTION EN LIGNE',
        '📍 AGENCES ALGER & ORAN',
        '📞 ASSISTANCE VIP 24/7',
      ];

  // Tagline from CMS
  const tagline = footer?.tagline?.fr
    || 'Le spécialiste de la location de voitures, motos et jet-skis de prestige en Algérie. Zéro caution en ligne et paiement sur place.';

  // Social links from CMS
  const socialLinks = footer?.socialLinks;

  // Custom links from CMS (in addition to built-in nav)
  const customLinks = footer?.customLinks || [];

  const builtInLinks = [
    { name: t('home', 'Accueil'), href: '/' },
    { name: t('fleet', 'Flotte'), href: '/fleet' },
    { name: t('aboutUs', 'À Propos'), href: '/about' },
    { name: t('pickupLocations', 'Nos Agences'), href: '/about' },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>

      {/* Ultra-Luxurious Animated & Mobile-Optimized Compact Footer */}
      <footer className="relative isolate overflow-hidden bg-slate-950 text-slate-300 border-t border-slate-800/80 shadow-2xl">

        {/* Infinite Animated Marquee/Ticker Bar */}
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-blue-900/60 border-b border-blue-500/20 py-2 sm:py-2.5 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-marquee gap-6 sm:gap-8 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-blue-200">
            {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-2.5 sm:gap-3 shrink-0">
                <span>{item}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              </span>
            ))}
          </div>
        </div>

        {/* Animated Background Image */}
        {footerBgImg && (
          <div className="absolute inset-0 -z-20 overflow-hidden">
            <img
              src={footerBgImg}
              alt="Footer Background"
              className={`w-full h-full object-cover opacity-20 ${isFooterAnimated ? 'animate-subtle-zoom' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/80 backdrop-blur-[2px]" />
          </div>
        )}

        {/* Ambient Animated Light Orbs */}
        {isFooterAnimated && (
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[110px] animate-float-blob" />
            <div className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[130px] animate-float-blob-alt" />
          </div>
        )}

        {/* Cyber Grid Overlay */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-6 sm:pb-10">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 pb-8 sm:pb-10 border-b border-slate-800/80">

            {/* Column 1: Brand & Bio */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-3">
                  {settings?.storeLogo ? (
                    <img src={settings.storeLogo} alt={settings?.storeName || 'LuxeRent'} className="h-8 sm:h-9 object-contain" />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] bg-gradient-to-tr from-blue-600 to-indigo-600">
                      <Car className="w-5 h-5" />
                    </div>
                  )}
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {settings?.storeName || 'WahranRent'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold md:hidden">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>24/7 VIP</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium leading-relaxed hidden sm:block max-w-md">{tagline}</p>

              {/* Social Links from CMS */}
              <div className="flex items-center gap-2 pt-1">
                {socialLinks?.whatsapp && (
                  <a
                    href={socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-emerald-600 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shadow-md"
                    title="WhatsApp"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                )}
                {socialLinks?.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-pink-600 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shadow-md"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {socialLinks?.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-blue-700 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shadow-md"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Navigation (Collapsible Accordion on Mobile) */}
            <div className="border-t border-slate-800/60 md:border-t-0 pt-3 md:pt-0">
              <button
                onClick={() => toggleSection('nav')}
                className="w-full flex justify-between items-center md:cursor-default py-1 md:py-0 text-left cursor-pointer"
              >
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400" />
                  Navigation
                </h3>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform md:hidden ${expandedSection === 'nav' ? 'rotate-180 text-blue-400' : ''}`} />
              </button>

              <ul className={`space-y-2 text-xs font-semibold mt-3 md:block ${expandedSection === 'nav' ? 'block' : 'hidden'}`}>
                {builtInLinks.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white py-0.5 transition-colors flex items-center gap-2 group"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 opacity-50 group-hover:opacity-100" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
                {/* CMS Custom Links */}
                {customLinks.map((cl, idx) => {
                  const label = cl.label?.fr || cl.label?.en || '';
                  if (!label || !cl.url) return null;
                  return (
                    <li key={`custom-${idx}`}>
                      <a
                        href={cl.url}
                        target={cl.url.startsWith('http') ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white py-0.5 transition-colors flex items-center gap-2 group"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 opacity-50 group-hover:opacity-100" />
                        <span>{label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Column 3: Fleet Categories (Collapsible Accordion on Mobile) */}
            <div className="border-t border-slate-800/60 md:border-t-0 pt-3 md:pt-0">
              <button
                onClick={() => toggleSection('fleet')}
                className="w-full flex justify-between items-center md:cursor-default py-1 md:py-0 text-left cursor-pointer"
              >
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-400" />
                  Notre Flotte
                </h3>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform md:hidden ${expandedSection === 'fleet' ? 'rotate-180 text-indigo-400' : ''}`} />
              </button>

              <ul className={`space-y-2 text-xs font-semibold mt-3 md:block ${expandedSection === 'fleet' ? 'block' : 'hidden'}`}>
                <li>
                  <Link href="/fleet?category=Car" className="text-slate-400 hover:text-white py-0.5 transition-colors flex items-center gap-2 group">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 opacity-50 group-hover:opacity-100" />
                    <span>🏎️ Voitures de Prestige</span>
                  </Link>
                </li>
                <li>
                  <Link href="/fleet?category=Motorcycle" className="text-slate-400 hover:text-white py-0.5 transition-colors flex items-center gap-2 group">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 opacity-50 group-hover:opacity-100" />
                    <span>🏍️ Motos Superbike</span>
                  </Link>
                </li>
                <li>
                  <Link href="/fleet?category=JetSki" className="text-slate-400 hover:text-white py-0.5 transition-colors flex items-center gap-2 group">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 opacity-50 group-hover:opacity-100" />
                    <span>🌊 Jet Skis Exclusive</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact (Collapsible Accordion on Mobile) */}
            <div className="border-t border-slate-800/60 md:border-t-0 pt-3 md:pt-0">
              <button
                onClick={() => toggleSection('contact')}
                className="w-full flex justify-between items-center md:cursor-default py-1 md:py-0 text-left cursor-pointer"
              >
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  {t('contactUs', 'Contact')}
                </h3>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform md:hidden ${expandedSection === 'contact' ? 'rotate-180 text-sky-400' : ''}`} />
              </button>

              <div className={`space-y-2.5 text-xs font-medium text-slate-400 mt-3 md:block ${expandedSection === 'contact' ? 'block' : 'hidden'}`}>
                {settings?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{settings.address}</span>
                  </div>
                )}
                {settings?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="hover:text-white font-bold text-slate-300">
                      {settings.phone}
                    </a>
                  </div>
                )}
                {settings?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <a href={`mailto:${settings.email}`} className="hover:text-white break-all">
                      {settings.email}
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <p className="text-[11px] sm:text-xs">&copy; {new Date().getFullYear()} {settings?.storeName || 'WahranRent'}.</p>
            <button
              onClick={scrollToTop}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl border border-slate-800 text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Haut</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </footer>
      <ChatbotWidget />
    </>
  );
}
