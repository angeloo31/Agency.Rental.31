'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ColorSettings {
  primary: string;
  secondary: string;
}

interface TextTranslation {
  fr: string;
  en: string;
  ar: string;
}

interface HeroSettings {
  title: TextTranslation;
  subtitle: TextTranslation;
  backgroundImage: string;
}

interface AboutStory {
  subtitle?: TextTranslation;
  title: TextTranslation;
  text1: TextTranslation;
  text2: TextTranslation;
  backgroundImage?: string;
  animateBackground?: boolean;
}

export interface FooterSettings {
  backgroundImage?: string;
  animateBackground?: boolean;
  tagline?: { fr: string; en: string; ar: string };
  tickerText?: { fr: string; en: string; ar: string };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  customLinks?: Array<{
    label: { fr: string; en: string; ar: string };
    url: string;
  }>;
}

interface Location {
  name: string;
  type: 'Airport' | 'City' | 'Marina';
  categories: string[];
  address: string;
  phone: string;
  email: string;
  city: string;
  coordinates: string;
  googleMapLink: string;
  hours: string;
  coverImage?: string;
  gradient: string;
}

export type CurrencyCode = 'DA' | 'EUR' | 'USD';

export interface CurrencySettings {
  primary: CurrencyCode;
  enabled: CurrencyCode[];
  exchangeRates: {
    EUR: number;
    USD: number;
  };
}

export interface SiteSettings {
  storeName: string;
  storeLogo: string;
  phone: string;
  email: string;
  address: string;
  generalConditions?: string;
  defaultRequirements?: { fr: string; en: string; ar: string };
  defaultConditions?: { fr: string; en: string; ar: string };
  mainColors: ColorSettings;
  hero: HeroSettings;
  aboutStory: AboutStory;
  footer?: FooterSettings;
  showDateSearch: boolean;
  showSearchWidget: boolean;
  currencies?: CurrencySettings;
  faqs?: Array<{ q: string; a: string }>;
  locations: Location[];
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (curr: CurrencyCode) => void;
  formatPrice: (amountInDA: number, options?: { showSecondary?: boolean }) => string;
}

const defaultSettings: SiteSettings = {
  storeName: "LuxeRent",
  storeLogo: "",
  phone: "+213 (0) 550 12 34 56",
  email: "contact@luxerent.com",
  address: "Alger, Algérie",
  mainColors: { primary: "#4f46e5", secondary: "#3b82f6" },
  hero: {
    title: {
      fr: "Le frisson de la location premium",
      en: "The thrill of premium rental",
      ar: "متعة التأجير الفاخر"
    },
    subtitle: {
      fr: "Faites votre choix parmi notre flotte exclusive de voitures, motos et jet-skis. Payez facilement sur place à la récupération de votre véhicule.",
      en: "Choose from our exclusive fleet of cars, motorcycles and jet-skis. Pay easily on site upon pickup.",
      ar: "اختر من أسطولنا الحصري من السيارات، الدراجات النارية والجات سكي. ادفع بسهولة عند استلام مركبتك."
    },
    backgroundImage: ""
  },
  aboutStory: {
    title: {
      fr: "Notre Histoire et Vision",
      en: "Our Story & Vision",
      ar: "قصتنا ورؤيتنا"
    },
    text1: {
      fr: "Fondée avec la passion de l'automobile d'exception, notre agence s'est imposée comme la référence de la location de véhicules premium en Algérie.",
      en: "Founded with a passion for exceptional automobiles, our agency has established itself as the benchmark for premium vehicle rental in Algeria.",
      ar: "تأسست وكالتنا بشغف بالسيارات الاستثنائية، وأثبتت نفسها كمرجع لتأجير السيارات الفاخرة في الجزائر."
    },
    text2: {
      fr: "Notre flotte méticuleusement sélectionnée comprend les derniers modèles des marques les plus prestigieuses.",
      en: "Our meticulously selected fleet includes the latest models from the most prestigious brands.",
      ar: "يضم أسطولنا المختار بعناية أحدث الموديلات من أشهر العلامات التجارية."
    },
    backgroundImage: "",
    animateBackground: true
  },
  footer: {
    backgroundImage: "",
    animateBackground: true,
    tagline: {
      fr: "Le spécialiste de la location de voitures, motos et jet-skis de prestige en Algérie. Zéro caution en ligne et paiement sur place.",
      en: "Premier luxury car, motorcycle, and jet ski rentals in Algeria. Zero upfront online deposits and transparent on-site payment.",
      ar: "الرائد في تأجير السيارات والدراجات النارية والجي سكي الفاخرة بالجزائر. بدون دفعات أولية، ودفع كامل عند الاستلام."
    },
    tickerText: {
      fr: "⚡ PAIEMENT SUR PLACE 100% • 🏎️ FLOTTE DE PRESTIGE 2026 • 🛡️ ZÉRO CAUTION EN LIGNE • 📍 AGENCES ALGER & ORAN • 📞 ASSISTANCE VIP 24/7",
      en: "⚡ 100% ON-SITE PAYMENT • 🏎️ PRESTIGE FLEET 2026 • 🛡️ ZERO ONLINE DEPOSIT • 📍 ALGIERS & ORAN HUBS • 📞 24/7 VIP SUPPORT",
      ar: "⚡ دفع كامل عند الاستلام • 🏎️ أسطول التميز 2026 • 🛡️ بدون عربون أونلاين • 📍 مطار الجزائر ووهران • 📞 دعم VIP 24/7"
    },
    socialLinks: {
      instagram: "",
      facebook: "",
      whatsapp: "",
      tiktok: ""
    },
    customLinks: []
  },
  showDateSearch: true,
  showSearchWidget: true,
  currencies: {
    primary: 'DA',
    enabled: ['DA'],
    exchangeRates: {
      EUR: 240,
      USD: 220
    }
  },
  locations: []
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({
  children,
  initialSettings
}: {
  children: React.ReactNode;
  initialSettings?: SiteSettings | null;
}) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings || defaultSettings);
  const [loading, setLoading] = useState(!initialSettings);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('DA');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSettings(data);
          if (data.currencies?.primary && !selectedCurrency) {
            setSelectedCurrency(data.currencies.primary);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings on client:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSettings) {
      fetchSettings();
    }
  }, [initialSettings]);

  useEffect(() => {
    if (settings.currencies?.primary && (!settings.currencies.enabled || settings.currencies.enabled.includes(selectedCurrency) === false)) {
      setSelectedCurrency(settings.currencies.primary);
    }
  }, [settings.currencies]);

  // Sync brand colors to CSS custom properties on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings?.mainColors?.primary) {
      root.style.setProperty('--brand-primary', settings.mainColors.primary);
    }
    if (settings?.mainColors?.secondary) {
      root.style.setProperty('--brand-secondary', settings.mainColors.secondary);
    }
  }, [settings?.mainColors?.primary, settings?.mainColors?.secondary]);

  const refreshSettings = async () => {
    setLoading(true);
    await fetchSettings();
  };

  const formatPrice = (amountInDA: number, options?: { showSecondary?: boolean }): string => {
    if (typeof amountInDA !== 'number' || isNaN(amountInDA)) return '0 DA';
    
    const curr = selectedCurrency || settings.currencies?.primary || 'DA';
    const eurRate = settings.currencies?.exchangeRates?.EUR || 240;
    const usdRate = settings.currencies?.exchangeRates?.USD || 220;
    const enabledList = settings.currencies?.enabled || ['DA'];

    const formatSingle = (code: CurrencyCode, amt: number) => {
      if (code === 'EUR') {
        const val = Math.ceil(amt / eurRate);
        return `€${val.toLocaleString()}`;
      }
      if (code === 'USD') {
        const val = Math.ceil(amt / usdRate);
        return `$${val.toLocaleString()}`;
      }
      return `${Math.ceil(amt).toLocaleString()} DA`;
    };

    const primaryFormatted = formatSingle(curr, amountInDA);
    const shouldShowSecondary = options?.showSecondary !== false && enabledList.length > 1;

    if (shouldShowSecondary) {
      const otherCurrencies = enabledList.filter(c => c !== curr);
      const secondaryParts = otherCurrencies.map(c => formatSingle(c, amountInDA)).filter(Boolean);

      if (secondaryParts.length > 0) {
        return `${primaryFormatted} (${secondaryParts.join(' / ')})`;
      }
    }

    return primaryFormatted;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, selectedCurrency, setSelectedCurrency, formatPrice }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
