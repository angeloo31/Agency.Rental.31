'use client';

import React, { useState, useEffect } from 'react';

interface BrandLogoProps {
  brand?: string;
  className?: string;
  size?: number;
  showName?: boolean;
}

// Comprehensive dictionary of full-color 3D brand logo emblem URLs from Icons8 & Wikimedia CDNs
const BRAND_LOGOS_DICT: Record<string, { name: string; url: string; fallbackUrl?: string }> = {
  mercedes: {
    name: 'Mercedes-Benz',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/mercedes-benz.png'
  },
  'mercedes-benz': {
    name: 'Mercedes-Benz',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/mercedes-benz.png'
  },
  porsche: {
    name: 'Porsche',
    url: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Porsche_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/porsche.png'
  },
  bmw: {
    name: 'BMW',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/bmw.png'
  },
  audi: {
    name: 'Audi',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/audi.png'
  },
  volkswagen: {
    name: 'Volkswagen',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/volkswagen.png'
  },
  vw: {
    name: 'Volkswagen',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/volkswagen.png'
  },
  renault: {
    name: 'Renault',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Renault_2021.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/renault.png'
  },
  peugeot: {
    name: 'Peugeot',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Peugeot_Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/peugeot.png'
  },
  citroen: {
    name: 'Citroën',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Citroën_2022.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/citroen.png'
  },
  'citroën': {
    name: 'Citroën',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Citroën_2022.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/citroen.png'
  },
  opel: {
    name: 'Opel',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Opel_Blitz_Logo_2023.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/opel.png'
  },
  toyota: {
    name: 'Toyota',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Toyota_EU.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/toyota.png'
  },
  nissan: {
    name: 'Nissan',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/nissan.png'
  },
  hyundai: {
    name: 'Hyundai',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/hyundai.png'
  },
  kia: {
    name: 'Kia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/KIA_logo2021.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/kia'
  },
  'range rover': {
    name: 'Range Rover',
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Land_Rover_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/land-rover.png'
  },
  'land rover': {
    name: 'Land Rover',
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Land_Rover_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/land-rover.png'
  },
  landrover: {
    name: 'Land Rover',
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Land_Rover_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/land-rover.png'
  },
  ford: {
    name: 'Ford',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/ford.png'
  },
  lamborghini: {
    name: 'Lamborghini',
    url: 'https://upload.wikimedia.org/wikipedia/en/d/df/Lamborghini_Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/lamborghini.png'
  },
  ferrari: {
    name: 'Ferrari',
    url: 'https://upload.wikimedia.org/wikipedia/en/3/36/Ferrari-Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/ferrari.png'
  },
  dacia: {
    name: 'Dacia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Dacia_2021_Logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/dacia'
  },
  cupra: {
    name: 'Cupra',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Cupra_Logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/cupra'
  },
  seat: {
    name: 'Seat',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/SEAT_Logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/seat'
  },
  skoda: {
    name: 'Skoda',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Skoda_Auto_logo_2022.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/skoda.png'
  },
  'alfa romeo': {
    name: 'Alfa Romeo',
    url: 'https://upload.wikimedia.org/wikipedia/en/2/24/Alfa_Romeo_Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/alfa-romeo.png'
  },
  maserati: {
    name: 'Maserati',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Maserati_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/maserati.png'
  },
  'aston martin': {
    name: 'Aston Martin',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Aston_Martin_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/aston-martin.png'
  },
  bentley: {
    name: 'Bentley',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Bentley_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/bentley.png'
  },
  'rolls-royce': {
    name: 'Rolls-Royce',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Rolls-Royce_Motor_Cars_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/rolls-royce.png'
  },
  'rolls royce': {
    name: 'Rolls-Royce',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Rolls-Royce_Motor_Cars_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/rolls-royce.png'
  },
  bugatti: {
    name: 'Bugatti',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Bugatti_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/bugatti.png'
  },
  mclaren: {
    name: 'McLaren',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/McLaren_Automotive_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/mclaren.png'
  },
  lexus: {
    name: 'Lexus',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Lexus_division_emblem.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/lexus.png'
  },
  infiniti: {
    name: 'Infiniti',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Infiniti_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/infiniti.png'
  },
  jaguar: {
    name: 'Jaguar',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Jaguar_Cars_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/jaguar.png'
  },
  volvo: {
    name: 'Volvo',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Volvo_Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/volvo.png'
  },
  mini: {
    name: 'Mini',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/MINI_logo_2018.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/mini.png'
  },
  mitsubishi: {
    name: 'Mitsubishi',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Mitsubishi_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/mitsubishi.png'
  },
  subaru: {
    name: 'Subaru',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Subaru_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/subaru.png'
  },
  mazda: {
    name: 'Mazda',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Mazda_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/mazda.png'
  },
  cadillac: {
    name: 'Cadillac',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Cadillac_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/cadillac.png'
  },
  dodge: {
    name: 'Dodge',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Dodge_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/dodge.png'
  },
  fiat: {
    name: 'Fiat',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/FIAT_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/fiat.png'
  },
  jeep: {
    name: 'Jeep',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Jeep_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/jeep.png'
  },
  tesla: {
    name: 'Tesla',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/tesla.png'
  },
  chevrolet: {
    name: 'Chevrolet',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/chevrolet.png'
  },
  yamaha: {
    name: 'Yamaha',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Yamaha_Motor_Logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/yamaha'
  },
  kawasaki: {
    name: 'Kawasaki',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Kawasaki_logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/kawasaki'
  },
  ducati: {
    name: 'Ducati',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Ducati_red_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/ducati.png'
  },
  honda: {
    name: 'Honda',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/honda.png'
  },
  suzuki: {
    name: 'Suzuki',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2016.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/suzuki.png'
  },
  ktm: {
    name: 'KTM',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/KTM-Logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/ktm.png'
  },
  'harley-davidson': {
    name: 'Harley-Davidson',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Harley-Davidson_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/harley-davidson.png'
  },
  'harley davidson': {
    name: 'Harley-Davidson',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Harley-Davidson_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/harley-davidson.png'
  },
  vespa: {
    name: 'Vespa',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Vespa_logo.svg',
    fallbackUrl: 'https://img.icons8.com/color/96/vespa.png'
  },
  sea: {
    name: 'Sea-Doo',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sea-Doo_logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/seadoo'
  },
  'sea-doo': {
    name: 'Sea-Doo',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sea-Doo_logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/seadoo'
  },
  'sea doo': {
    name: 'Sea-Doo',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sea-Doo_logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/seadoo'
  },
  seadoo: {
    name: 'Sea-Doo',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sea-Doo_logo.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/seadoo'
  }
};

export const POPULAR_BRANDS = [
  'Mercedes-Benz', 'Porsche', 'BMW', 'Audi', 
  'Volkswagen', 'Renault', 'Peugeot', 'Citroën', 'Opel', 'Dacia', 
  'Toyota', 'Nissan', 'Hyundai', 'Kia', 
  'Range Rover', 'Ford', 'Lamborghini', 'Ferrari', 
  'Alfa Romeo', 'Maserati', 'Tesla',
  'Yamaha', 'Kawasaki', 'Sea-Doo', 'Ducati', 'KTM', 'Harley-Davidson'
];

export function getBrandData(brandName?: string) {
  if (!brandName) return null;
  const clean = brandName.toLowerCase().trim();

  // 1. Exact match check
  if (BRAND_LOGOS_DICT[clean]) return BRAND_LOGOS_DICT[clean];

  // 2. Substring match (ensure key length >= 4 to avoid short false positives like 'sea' matching 'seat')
  for (const key of Object.keys(BRAND_LOGOS_DICT)) {
    if (clean === key) return BRAND_LOGOS_DICT[key];
    if (key.length >= 4 && (clean.includes(key) || (key.includes(clean) && clean.length >= 4))) {
      return BRAND_LOGOS_DICT[key];
    }
  }

  return null;
}

export default function BrandLogo({ brand, className = '', size = 22, showName = false }: BrandLogoProps) {
  const [useFallbackText, setUseFallbackText] = useState(false);
  const [errCount, setErrCount] = useState(0);

  // Reset image error state whenever brand prop changes
  useEffect(() => {
    setErrCount(0);
    setUseFallbackText(false);
  }, [brand]);

  if (!brand) return null;

  const data = getBrandData(brand);
  const brandSlugName = data ? data.name : brand;
  const urlSlug = brand.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');

  const primaryUrl = data?.url || `https://cdn.simpleicons.org/${urlSlug.replace(/-/g, '')}`;
  const secondaryUrl = data?.fallbackUrl || `https://img.icons8.com/color/96/${urlSlug}.png`;

  const currentImgSrc = errCount === 0 ? primaryUrl : secondaryUrl;

  const handleImageError = () => {
    if (errCount === 0) {
      setErrCount(1);
    } else {
      setUseFallbackText(true);
    }
  };

  return (
    <span className={`inline-flex items-center gap-2 align-middle ${className}`}>
      {!useFallbackText ? (
        <span 
          className="inline-flex items-center justify-center shrink-0 p-1 bg-white/95 border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
          style={{ width: `${size + 10}px`, height: `${size + 10}px` }}
        >
          <img
            src={currentImgSrc}
            alt={brand}
            onError={handleImageError}
            className="object-contain max-w-full max-h-full transition-transform hover:scale-110"
            style={{ width: `${size}px`, height: `${size}px` }}
          />
        </span>
      ) : (
        <span 
          className="inline-flex items-center justify-center font-black uppercase rounded-lg bg-slate-900 text-white text-[10px] px-2 py-1 shrink-0 shadow-sm border border-slate-800"
          style={{ height: `${size + 6}px`, minWidth: `${size + 6}px` }}
          title={brand}
        >
          {brand.substring(0, 2).toUpperCase()}
        </span>
      )}
      {showName && <span className="font-black text-slate-900">{brandSlugName}</span>}
    </span>
  );
}
