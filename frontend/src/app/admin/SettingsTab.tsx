import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, MapPin, Plus, Trash2, Globe2, Sparkles, Film, Layout } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import toast from 'react-hot-toast';
import ImageCropperModal from '@/components/ImageCropperModal';

const PRESET_BACKGROUNDS = [
  { name: 'Dark Supercar', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1920&auto=format&fit=crop' },
  { name: 'Porsche Night', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920&auto=format&fit=crop' },
  { name: 'Corvette Speed', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1920&auto=format&fit=crop' },
  { name: 'Luxury Garage', url: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=1920&auto=format&fit=crop' },
  { name: 'Sleek Dark', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1920&auto=format&fit=crop' }
];

export default function SettingsTab() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'hero' | 'about' | 'footer' | 'locations' | 'faq' | 'currencies'>('general');
  const [activeCropFile, setActiveCropFile] = useState<File | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (!data.faqs || data.faqs.length === 0) {
          data.faqs = [
            {
              q: "Comment se déroule le paiement ?",
              a: "Aucune carte de crédit n'est requise en ligne. Le paiement s'effectue intégralement sur place lors de la prise en charge du véhicule."
            },
            {
              q: "Quels documents dois-je fournir ?",
              a: "Vous devrez présenter un permis de conduire valide (min 1 à 2 ans selon le véhicule) ainsi qu'une pièce d'identité / passeport en cours de validité."
            },
            {
              q: "Comment fonctionne la caution ?",
              a: "Le montant de la caution (optionnelle selon les modèles) est consigné à l'agence et restitué intégralement lors du retour de la véhicule sans dommage."
            },
            {
              q: "Puis-je annuler ou modifier ma réservation ?",
              a: "Oui, l'annulation est 100% gratuite à tout moment avant l'heure de prise en charge sans aucun frais."
            }
          ];
        }
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success(t('settingsSaved'));
        router.refresh();
      } else {
        toast.error(t('settingsSaveFailed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ...settings,
          hero: { ...settings.hero, backgroundImage: data.url }
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('uploadImageFailed'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ...settings,
          aboutStory: { ...(settings.aboutStory || {}), backgroundImage: data.url }
        });
        toast.success('Notre Histoire background uploaded!');
      }
    } catch (error) {
      console.error('Error uploading about background:', error);
      toast.error(t('uploadImageFailed'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFooterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ...settings,
          footer: { ...(settings.footer || {}), backgroundImage: data.url }
        });
        toast.success('Footer background uploaded!');
      }
    } catch (error) {
      console.error('Error uploading footer background:', error);
      toast.error(t('uploadImageFailed'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActiveCropFile(file);
    e.target.value = '';
  };

  const performLogoUpload = async (croppedFile: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', croppedFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ...settings,
          storeLogo: data.url
        });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(t('uploadImageFailed'));
    } finally {
      setUploadingImage(false);
      setActiveCropFile(null);
    }
  };

  const handleTextChange = (field: 'title' | 'subtitle', value: string) => {
    setSettings({
      ...settings,
      hero: {
        ...settings.hero,
        [field]: {
          fr: value,
          en: value,
          ar: value
        }
      }
    });
  };

  const handleAboutTextChange = (field: 'subtitle' | 'title' | 'text1' | 'text2', value: string) => {
    setSettings({
      ...settings,
      aboutStory: {
        ...(settings.aboutStory || { title: {}, text1: {}, text2: {} }),
        [field]: {
          fr: value,
          en: value,
          ar: value
        }
      }
    });
  };

  const addLocation = () => {
    setSettings({
      ...settings,
      locations: [...settings.locations, { 
        name: '', 
        type: 'Airport', 
        categories: [],
        address: '',
        phone: '',
        email: '',
        city: '',
        coordinates: '',
        googleMapLink: '',
        hours: '08:00 - 22:00',
        coverImage: '',
        gradient: 'from-blue-600 to-indigo-700'
      }]
    });
  };

  const removeLocation = (index: number) => {
    const newLocations = [...settings.locations];
    newLocations.splice(index, 1);
    setSettings({ ...settings, locations: newLocations });
  };

  const updateLocation = (index: number, field: string, value: any) => {
    const newLocations = [...settings.locations];
    newLocations[index][field] = value;
    setSettings({ ...settings, locations: newLocations });
  };

  const toggleCategoryForLocation = (locIndex: number, category: string) => {
    const loc = settings.locations[locIndex];
    let newCategories = [...loc.categories];
    if (newCategories.includes(category)) {
      newCategories = newCategories.filter(c => c !== category);
    } else {
      newCategories.push(category);
    }
    updateLocation(locIndex, 'categories', newCategories);
  };

  if (loading || !settings) {
    return <div className="flex justify-center items-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 border-t-transparent"></div></div>;
  }

  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-indigo-600" /> {t('cmsAndSettings')}
        </h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:bg-slate-300"
        >
          {saving ? t('saving') : <><Save className="w-4 h-4" /> {t('saveChanges')}</>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation Menu */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          <button onClick={() => setActiveSection('general')} className={`p-4 rounded-2xl text-left font-bold transition-all ${activeSection === 'general' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}`}>
            {t('generalSettings')}
          </button>
          <button onClick={() => setActiveSection('hero')} className={`p-4 rounded-2xl text-left font-bold transition-all ${activeSection === 'hero' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}`}>
            {t('heroAndBranding')}
          </button>
          <button onClick={() => setActiveSection('about')} className={`p-4 rounded-2xl text-left font-bold transition-all ${activeSection === 'about' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}`}>
            {t('aboutUsTab')}
          </button>
          <button onClick={() => setActiveSection('footer')} className={`p-4 rounded-2xl text-left font-bold transition-all ${activeSection === 'footer' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}`}>
            Footer & Animation
          </button>
          <button onClick={() => setActiveSection('locations')} className={`p-4 rounded-2xl text-left font-bold transition-all ${activeSection === 'locations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}`}>
            {t('agencyLocationsTab')}
          </button>
          <button onClick={() => setActiveSection('faq')} className={`p-4 rounded-2xl text-left font-bold transition-all ${activeSection === 'faq' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}`}>
            ❓ FAQ (Frequently Asked Questions)
          </button>
          <button onClick={() => setActiveSection('currencies')} className={`p-4 rounded-2xl text-left font-bold transition-all ${activeSection === 'currencies' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}`}>
            💰 Currency & Rates (DA / € / $)
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200/60 shadow-sm min-h-[600px] animate-in fade-in duration-300">
          
          {/* GENERAL SECTION */}
          {activeSection === 'general' && (
            <div>
              <h3 className="text-xl font-black mb-6">{t('generalConfiguration')}</h3>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 mb-6">
                <label className="block text-sm font-extrabold text-slate-800 mb-2">{t('storeName')}</label>
                <input 
                  type="text" 
                  value={settings.storeName || ''} 
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} 
                  placeholder="e.g. LuxeRent"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium" 
                />
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 mb-6">
                <label className="block text-sm font-extrabold text-slate-800 mb-2">{t('globalAgencyPhone')}</label>
                <input 
                  type="text" 
                  value={settings.phone || ''} 
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
                  placeholder="e.g. +213 (0) 550 12 34 56"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium" 
                />
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 mb-6">
                <label className="block text-sm font-extrabold text-slate-800 mb-2">{t('globalAgencyEmail')}</label>
                <input 
                  type="email" 
                  value={settings.email || ''} 
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })} 
                  placeholder="e.g. contact@luxerent.com"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium" 
                />
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 mb-6">
                <label className="block text-sm font-extrabold text-slate-800 mb-2">{t('globalAgencyAddress')}</label>
                <input 
                  type="text" 
                  value={settings.address || ''} 
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })} 
                  placeholder="e.g. Alger, Algérie"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium" 
                />
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 mb-6">
                <label className="block text-sm font-extrabold text-slate-800 mb-2">📜 General Conditions of Rental (Conditions Générales)</label>
                <p className="text-xs text-slate-500 mb-3">Customize the general terms & conditions displayed to clients when making a reservation.</p>
                <textarea 
                  rows={8}
                  value={settings.generalConditions ?? `1. Permis de conduire & Age minimum\nLe conducteur doit être âgé d'au moins 21 ans (selon la catégorie du véhicule) et être titulaire d'un permis de conduire valide depuis au moins 1 à 2 ans.\n\n2. Documents obligatoires à présenter\nLors de la remise des clés à l'agence, vous devez présenter votre permis de conduire original ainsi qu'une pièce d'identité ou un passeport en cours de validité.\n\n3. Caution & Garantie\nUne caution de garantie est consignée à l'agence lors du départ et vous est intégralement restituée au retour du véhicule sans dommage.\n\n4. Annulation gratuite\nL'annulation de la réservation est 100% gratuite à tout moment avant l'heure prévue de prise en charge sans aucun frais.`} 
                  onChange={(e) => setSettings({ ...settings, generalConditions: e.target.value })} 
                  placeholder="Type your general rental terms & conditions here..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium bg-white resize-y text-sm leading-relaxed" 
                />
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 mb-6">
                <label className="block text-sm font-extrabold text-slate-800 mb-2">{t('storeLogo')}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                  {settings.storeLogo ? (
                    <div 
                      className="relative h-20 rounded-lg overflow-hidden mb-4 flex items-center justify-center border border-slate-200"
                      style={{
                        backgroundColor: '#f8fafc',
                        backgroundImage: 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    >
                      <img src={settings.storeLogo} alt="Store Logo" className="h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]" />
                    </div>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  )}
                  <input type="file" onChange={handleLogoUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-indigo-600 font-bold text-sm">
                    {uploadingImage ? t('uploading') : t('clickUploadNewImage')}
                  </span>
                </div>
                {settings.storeLogo && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, storeLogo: '' })}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('removeLogo')}
                  </button>
                )}
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 mb-6">
                <label className="block text-sm font-extrabold text-slate-800 mb-3">
                  {t('brandColors')}
                </label>

                {/* Live Preview */}
                <div className="flex items-center gap-3 mb-5 p-3 bg-white rounded-xl border border-slate-200">
                  <div className="w-10 h-10 rounded-xl shadow-inner" style={{ backgroundColor: settings.mainColors?.primary || '#4f46e5' }} />
                  <div className="w-10 h-10 rounded-xl shadow-inner" style={{ backgroundColor: settings.mainColors?.secondary || '#3b82f6' }} />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    {t('preview')}
                  </span>
                </div>

                {/* Primary Color */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {t('primaryColor')}
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={settings.mainColors?.primary || '#4f46e5'} 
                      onChange={(e) => setSettings({ ...settings, mainColors: { ...settings.mainColors, primary: e.target.value } })} 
                      className="w-14 h-14 rounded cursor-pointer border-0 p-0" 
                    />
                    <input 
                      type="text" 
                      value={settings.mainColors?.primary || '#4f46e5'} 
                      onChange={(e) => setSettings({ ...settings, mainColors: { ...settings.mainColors, primary: e.target.value } })} 
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium uppercase" 
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {t('secondaryColor')}
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={settings.mainColors?.secondary || '#3b82f6'} 
                      onChange={(e) => setSettings({ ...settings, mainColors: { ...settings.mainColors, secondary: e.target.value } })} 
                      className="w-14 h-14 rounded cursor-pointer border-0 p-0" 
                    />
                    <input 
                      type="text" 
                      value={settings.mainColors?.secondary || '#3b82f6'} 
                      onChange={(e) => setSettings({ ...settings, mainColors: { ...settings.mainColors, secondary: e.target.value } })} 
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium uppercase" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                <div className="pr-4">
                  <label className="block text-sm font-extrabold text-slate-800">
                    {t('showSearchWidget')}
                  </label>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {t('showSearchWidgetDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                  <input 
                    type="checkbox" 
                    checked={settings.showSearchWidget !== false} 
                    onChange={(e) => setSettings({ ...settings, showSearchWidget: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* HERO SECTION */}
          {activeSection === 'hero' && (
            <div>
              <h3 className="text-xl font-black mb-6">{t('homePageHero')}</h3>
              
              <div className="mb-6">
                <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">{t('backgroundImage')}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                  {settings.hero.backgroundImage ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden mb-4">
                      <img src={settings.hero.backgroundImage} alt="Hero" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  )}
                  <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-indigo-600 font-bold text-sm">
                    {uploadingImage ? t('uploading') : t('clickUploadNewImage')}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Hero Title</label>
                  <input 
                    type="text" 
                    value={settings.hero?.title?.fr || settings.hero?.title?.en || ''} 
                    onChange={(e) => handleTextChange('title', e.target.value)} 
                    placeholder="e.g. Premium Vehicle Rentals"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Hero Subtitle</label>
                  <textarea 
                    value={settings.hero?.subtitle?.fr || settings.hero?.subtitle?.en || ''} 
                    onChange={(e) => handleTextChange('subtitle', e.target.value)} 
                    rows={3} 
                    placeholder="e.g. Discover our luxury fleet..."
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium resize-none" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABOUT US SECTION */}
          {activeSection === 'about' && (
            <div>
              <h3 className="text-xl font-black mb-2">{t('aboutUsTab')}</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">
                {locale === 'fr' 
                  ? 'Modifiez la photo de fond, les effets d\'animation et le contenu de la section "Notre Histoire".'
                  : locale === 'ar'
                  ? 'قم بتخصيص صورة الخلفية وتأثيرات الحركة والمحتوى لقسم "قصتنا".'
                  : 'Customize the background picture, animation effects, and content for the "Notre Histoire" section on the About Us page.'}
              </p>

              {/* Background & Animation Settings */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <Film className="w-5 h-5 text-indigo-600" /> Background Picture & Motion Animation
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.aboutStory?.animateBackground !== false} 
                      onChange={(e) => setSettings({
                        ...settings,
                        aboutStory: { ...(settings.aboutStory || {}), animateBackground: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ms-3 text-xs font-bold text-slate-700">Animate Background</span>
                  </label>
                </div>

                {/* Upload or Enter URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Background Image File</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-white transition-colors relative bg-white">
                      {settings.aboutStory?.backgroundImage ? (
                        <div className="relative w-full h-28 rounded-lg overflow-hidden mb-2">
                          <img src={settings.aboutStory.backgroundImage} alt="About Background" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      )}
                      <input type="file" onChange={handleAboutImageUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="text-indigo-600 font-bold text-xs">
                        {uploadingImage ? 'Uploading...' : 'Click to Upload Image/GIF'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Image or Animation URL</label>
                    <input 
                      type="text" 
                      placeholder="https://..." 
                      value={settings.aboutStory?.backgroundImage || ''} 
                      onChange={(e) => setSettings({
                        ...settings,
                        aboutStory: { ...(settings.aboutStory || {}), backgroundImage: e.target.value }
                      })} 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-xs bg-white mb-3"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 w-full mb-1">Quick Presets:</span>
                      {PRESET_BACKGROUNDS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSettings({
                            ...settings,
                            aboutStory: { ...(settings.aboutStory || {}), backgroundImage: preset.url }
                          })}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 text-[11px] font-bold rounded-lg transition-all"
                        >
                          {preset.name}
                        </button>
                      ))}
                      {settings.aboutStory?.backgroundImage && (
                        <button
                          type="button"
                          onClick={() => setSettings({
                            ...settings,
                            aboutStory: { ...(settings.aboutStory || {}), backgroundImage: '' }
                          })}
                          className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold rounded-lg hover:bg-red-100 transition-all"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                <div>
                  <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Banner Subtitle (Sous-titre en-tête)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. WahranRent propose une sélection..." 
                    value={settings.aboutStory?.subtitle?.fr || settings.aboutStory?.subtitle?.en || ''} 
                    onChange={(e) => handleAboutTextChange('subtitle', e.target.value)} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium bg-white mb-4" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Title (Titre section)</label>
                  <input 
                    type="text" 
                    value={settings.aboutStory?.title?.fr || settings.aboutStory?.title?.en || ''} 
                    onChange={(e) => handleAboutTextChange('title', e.target.value)} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium bg-white" 
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Paragraph 1</label>
                  <textarea 
                    value={settings.aboutStory?.text1?.fr || settings.aboutStory?.text1?.en || ''} 
                    onChange={(e) => handleAboutTextChange('text1', e.target.value)} 
                    rows={3} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium resize-none bg-white" 
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Paragraph 2</label>
                  <textarea 
                    value={settings.aboutStory?.text2?.fr || settings.aboutStory?.text2?.en || ''} 
                    onChange={(e) => handleAboutTextChange('text2', e.target.value)} 
                    rows={3} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium resize-none bg-white" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* FOOTER SECTION */}
          {activeSection === 'footer' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-black mb-1">Footer & Animation Settings</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Customize every element of the footer — background, ticker text, tagline, social links, and custom navigation links.</p>
              </div>

              {/* Background */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Background Picture & Motion
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.footer?.animateBackground !== false}
                      onChange={(e) => setSettings({ ...settings, footer: { ...(settings.footer || {}), animateBackground: e.target.checked } })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ms-3 text-xs font-bold text-slate-700">Animate Footer</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Footer Image File</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-white transition-colors relative bg-white">
                      {settings.footer?.backgroundImage ? (
                        <div className="relative w-full h-28 rounded-lg overflow-hidden mb-2">
                          <img src={settings.footer.backgroundImage} alt="Footer Background" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      )}
                      <input type="file" onChange={handleFooterImageUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="text-indigo-600 font-bold text-xs">{uploadingImage ? 'Uploading...' : 'Click to Upload Footer Image'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-extrabold text-slate-500 mb-2">Footer Image URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={settings.footer?.backgroundImage || ''}
                      onChange={(e) => setSettings({ ...settings, footer: { ...(settings.footer || {}), backgroundImage: e.target.value } })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-xs bg-white mb-3"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 w-full mb-1">Quick Presets:</span>
                      {PRESET_BACKGROUNDS.map((preset, idx) => (
                        <button key={idx} type="button"
                          onClick={() => setSettings({ ...settings, footer: { ...(settings.footer || {}), backgroundImage: preset.url } })}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 text-[11px] font-bold rounded-lg transition-all"
                        >{preset.name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticker Text */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2">📢 Scrolling Ticker Text</h4>
                <p className="text-xs text-slate-500 mb-4">Separate items with " • " (space-bullet-space). The ticker auto-loops infinitely.</p>
                <input
                  type="text"
                  value={settings.footer?.tickerText?.fr || settings.footer?.tickerText?.en || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    footer: {
                      ...(settings.footer || {}),
                      tickerText: { fr: e.target.value, en: e.target.value, ar: e.target.value }
                    }
                  })}
                  placeholder="⚡ PAIEMENT SUR PLACE 100% • 🏎️ FLOTTE 2026 • ..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm bg-white"
                />
              </div>

              {/* Tagline */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-slate-800 mb-4">📝 Brand Tagline</h4>
                <textarea
                  rows={2}
                  value={settings.footer?.tagline?.fr || settings.footer?.tagline?.en || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    footer: {
                      ...(settings.footer || {}),
                      tagline: { fr: e.target.value, en: e.target.value, ar: e.target.value }
                    }
                  })}
                  placeholder="Short brand tagline shown in footer..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm resize-none bg-white"
                />
              </div>

              {/* Social Links */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-slate-800 mb-4">🔗 Social Media Links</h4>
                <p className="text-xs text-slate-500 mb-4">Leave blank to hide the icon.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['whatsapp', 'instagram', 'facebook', 'tiktok'] as const).map((platform) => (
                    <div key={platform}>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">{platform.charAt(0).toUpperCase() + platform.slice(1)} URL</label>
                      <input
                        type="url"
                        value={settings.footer?.socialLinks?.[platform] || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          footer: {
                            ...(settings.footer || {}),
                            socialLinks: { ...(settings.footer?.socialLinks || {}), [platform]: e.target.value }
                          }
                        })}
                        placeholder={
                          platform === 'whatsapp' ? 'https://wa.me/213550...'
                          : platform === 'instagram' ? 'https://instagram.com/...'
                          : platform === 'facebook' ? 'https://facebook.com/...'
                          : 'https://tiktok.com/@...'
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Navigation Links */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-slate-800">🧭 Custom Footer Navigation Links</h4>
                  <button
                    type="button"
                    onClick={() => setSettings({
                      ...settings,
                      footer: {
                        ...(settings.footer || {}),
                        customLinks: [
                          ...(settings.footer?.customLinks || []),
                          { label: { fr: '', en: '', ar: '' }, url: '' }
                        ]
                      }
                    })}
                    className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-indigo-100"
                  >
                    <Plus className="w-4 h-4" /> Add Link
                  </button>
                </div>
                {(settings.footer?.customLinks || []).length === 0 && (
                  <p className="text-xs text-slate-400 font-medium">No custom links added yet. Click "Add Link" to add extra navigation links to the footer.</p>
                )}
                <div className="space-y-4">
                  {(settings.footer?.customLinks || []).map((cl: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 relative group">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(settings.footer?.customLinks || [])];
                          updated.splice(idx, 1);
                          setSettings({ ...settings, footer: { ...(settings.footer || {}), customLinks: updated } });
                        }}
                        className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="mb-3">
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">URL</label>
                        <input
                          type="text"
                          value={cl.url}
                          onChange={(e) => {
                            const updated = [...(settings.footer?.customLinks || [])];
                            updated[idx] = { ...updated[idx], url: e.target.value };
                            setSettings({ ...settings, footer: { ...(settings.footer || {}), customLinks: updated } });
                          }}
                          placeholder="/about or https://..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Link Label</label>
                        <input
                          type="text"
                          value={cl.label?.fr || cl.label?.en || ''}
                          onChange={(e) => {
                            const updated = [...(settings.footer?.customLinks || [])];
                            updated[idx] = { ...updated[idx], label: { fr: e.target.value, en: e.target.value, ar: e.target.value } };
                            setSettings({ ...settings, footer: { ...(settings.footer || {}), customLinks: updated } });
                          }}
                          placeholder="e.g. Privacy Policy / Politique"
                          className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-xs bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LOCATIONS SECTION */}
          {activeSection === 'locations' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">{t('pickupLocations')}</h3>
                <button onClick={addLocation} className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-indigo-100">
                  <Plus className="w-4 h-4" /> {t('add')}
                </button>
              </div>

              <div className="space-y-4">
                {settings.locations.map((loc: any, idx: number) => (
                  <div key={idx} className="border border-slate-100 bg-slate-50 p-5 rounded-2xl relative group">
                    <button 
                      onClick={() => removeLocation(idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="mb-4 pr-8">
                      <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">{t('locationName')}</label>
                      <input 
                        type="text" 
                        value={loc.name} 
                        onChange={(e) => updateLocation(idx, 'name', e.target.value)} 
                        placeholder={t('locationPlaceholder') || "e.g. Aéroport d'Alger"}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">{t('locationType') || 'Type'}</label>
                        <select 
                          value={loc.type} 
                          onChange={(e) => updateLocation(idx, 'type', e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-semibold text-sm"
                        >
                          <option value="Airport">{t('airport')}</option>
                          <option value="City">{t('cityCenter')}</option>
                          <option value="Marina">{t('marinaBeach')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">{t('vehicleCategories')}</label>
                        <div className="flex flex-wrap gap-2">
                          {['Car', 'Motorcycle', 'JetSki'].map(cat => (
                            <span 
                              key={cat}
                              onClick={() => toggleCategoryForLocation(idx, cat)}
                              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md cursor-pointer border ${
                                loc.categories.includes(cat) 
                                  ? 'bg-slate-900 text-white border-slate-900' 
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">Address</label>
                        <input type="text" value={loc.address || ''} onChange={(e) => updateLocation(idx, 'address', e.target.value)} placeholder="e.g. Aéroport Nice Côte d'Azur" className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">City / Region</label>
                        <input type="text" value={loc.city || ''} onChange={(e) => updateLocation(idx, 'city', e.target.value)} placeholder="e.g. Nice, France" className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">Phone Number</label>
                        <input type="text" value={loc.phone || ''} onChange={(e) => updateLocation(idx, 'phone', e.target.value)} placeholder="+33 (0) 4 93 21 30 00" className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">Email</label>
                        <input type="email" value={loc.email || ''} onChange={(e) => updateLocation(idx, 'email', e.target.value)} placeholder="nice@luxerent.com" className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">Map Label (Coordinates)</label>
                        <input type="text" value={loc.coordinates || ''} onChange={(e) => updateLocation(idx, 'coordinates', e.target.value)} placeholder="Terminal 2" className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">Google Maps Link</label>
                        <input type="url" value={loc.googleMapLink || ''} onChange={(e) => updateLocation(idx, 'googleMapLink', e.target.value)} placeholder="https://maps.google.com/..." className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">Operating Hours</label>
                        <input type="text" value={loc.hours || ''} onChange={(e) => updateLocation(idx, 'hours', e.target.value)} placeholder="08:00 - 22:00" className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">Card Background Gradient</label>
                        <select value={loc.gradient || 'from-blue-600 to-indigo-700'} onChange={(e) => updateLocation(idx, 'gradient', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-semibold text-sm">
                          <option value="from-blue-600 to-indigo-700">Premium Blue (Default)</option>
                          <option value="from-cyan-600 to-blue-700">Ocean Cyan</option>
                          <option value="from-slate-800 to-slate-900">Midnight Black</option>
                          <option value="from-purple-600 to-indigo-700">Royal Purple</option>
                          <option value="from-emerald-600 to-teal-700">Emerald Green</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">Custom Cover Photo (Image URL)</label>
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                          <input 
                            type="text" 
                            value={loc.coverImage || ''} 
                            onChange={(e) => updateLocation(idx, 'coverImage', e.target.value)} 
                            placeholder="https://images.unsplash.com/... (Leave empty for automatic HD cover)" 
                            className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-xs" 
                          />
                          {loc.coverImage && (
                            <button
                              type="button"
                              onClick={() => updateLocation(idx, 'coverImage', '')}
                              className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                            >
                              Reset Image
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ SECTION */}
          {activeSection === 'faq' && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black mb-1">Frequently Asked Questions (FAQ)</h3>
                  <p className="text-xs text-slate-500 font-medium">Manage Q&A items displayed in the vehicle details FAQ section across the site.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...(settings.faqs || [])];
                    updated.push({ q: '', a: '' });
                    setSettings({ ...settings, faqs: updated });
                  }}
                  className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              {(!settings.faqs || settings.faqs.length === 0) && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-700">No custom FAQs added yet</p>
                  <p className="text-xs text-slate-500">The site is currently using standard default FAQs. Click "Add Question" above to create your custom FAQs!</p>
                </div>
              )}

              <div className="space-y-4">
                {(settings.faqs || []).map((faq: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 relative group">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(settings.faqs || [])];
                        updated.splice(idx, 1);
                        setSettings({ ...settings, faqs: updated });
                      }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Question #{idx + 1}</label>
                      <input
                        type="text"
                        value={faq.q || ''}
                        onChange={(e) => {
                          const updated = [...(settings.faqs || [])];
                          updated[idx] = { ...updated[idx], q: e.target.value };
                          setSettings({ ...settings, faqs: updated });
                        }}
                        placeholder="e.g. How does payment work?"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Answer</label>
                      <textarea
                        rows={3}
                        value={faq.a || ''}
                        onChange={(e) => {
                          const updated = [...(settings.faqs || [])];
                          updated[idx] = { ...updated[idx], a: e.target.value };
                          setSettings({ ...settings, faqs: updated });
                        }}
                        placeholder="e.g. Zero credit card required online. You pay 100% on-site upon vehicle pickup."
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm bg-white resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CURRENCIES SECTION */}
          {activeSection === 'currencies' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-xl font-black mb-1">Currency & Exchange Rates Configuration</h3>
                <p className="text-xs text-slate-500 font-medium">Choose which currencies (DA, EUR, USD) are enabled on your site and set custom exchange rates.</p>
              </div>

              {/* Enabled Currencies (Checkboxes) */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">1. Active Display Currencies</h4>
                <p className="text-xs text-slate-500">Select one or multiple currencies. When multiple currencies are checked, visitors can toggle between currencies live on the website.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {[
                    { code: 'DA', label: 'Algerian Dinar (DA)', symbol: 'DA / د.ج' },
                    { code: 'EUR', label: 'Euro (€)', symbol: '€' },
                    { code: 'USD', label: 'US Dollar ($)', symbol: '$' }
                  ].map((curr) => {
                    const isEnabled = (settings.currencies?.enabled || ['DA']).includes(curr.code as any);
                    return (
                      <label key={curr.code} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${isEnabled ? 'bg-indigo-50/60 border-indigo-500 text-indigo-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => {
                            const currentList = settings.currencies?.enabled || ['DA'];
                            let updated: any[] = [];
                            if (e.target.checked) {
                              updated = [...currentList, curr.code];
                            } else {
                              if (currentList.length <= 1) {
                                toast.error('At least one currency must remain enabled!');
                                return;
                              }
                              updated = currentList.filter((c: string) => c !== curr.code);
                            }
                            
                            let newPrimary = settings.currencies?.primary || 'DA';
                            if (!updated.includes(newPrimary)) {
                              newPrimary = updated[0];
                            }

                            setSettings({
                              ...settings,
                              currencies: {
                                ...(settings.currencies || { primary: 'DA', enabled: ['DA'], exchangeRates: { EUR: 240, USD: 220 } }),
                                enabled: updated,
                                primary: newPrimary
                              }
                            });
                          }}
                          className="w-5 h-5 accent-indigo-600 rounded"
                        />
                        <div>
                          <span className="font-bold text-sm block">{curr.label}</span>
                          <span className="text-xs font-semibold text-slate-400">{curr.symbol}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Primary Currency */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">2. Default Primary Currency</h4>
                <p className="text-xs text-slate-500">The default currency used for prices across the site when a visitor loads your website.</p>
                
                <select
                  value={settings.currencies?.primary || 'DA'}
                  onChange={(e) => setSettings({
                    ...settings,
                    currencies: {
                      ...(settings.currencies || { primary: 'DA', enabled: ['DA'], exchangeRates: { EUR: 240, USD: 220 } }),
                      primary: e.target.value as any
                    }
                  })}
                  className="w-full max-w-xs p-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {(settings.currencies?.enabled || ['DA']).map((c: string) => (
                    <option key={c} value={c}>{c === 'DA' ? 'DA - Algerian Dinar' : c === 'EUR' ? 'EUR - Euro (€)' : 'USD - US Dollar ($)'}</option>
                  ))}
                </select>
              </div>

              {/* Exchange Rates */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">3. Custom Exchange Rates (Conversion to DA)</h4>
                <p className="text-xs text-slate-500">Set the exchange rates used to dynamically calculate EUR and USD prices from your base DA rates.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-2">1 EUR (€) equals</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={settings.currencies?.exchangeRates?.EUR || 240}
                        onChange={(e) => setSettings({
                          ...settings,
                          currencies: {
                            ...(settings.currencies || { primary: 'DA', enabled: ['DA'], exchangeRates: { EUR: 240, USD: 220 } }),
                            exchangeRates: {
                              ...(settings.currencies?.exchangeRates || { EUR: 240, USD: 220 }),
                              EUR: Number(e.target.value) || 240
                            }
                          }
                        })}
                        className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                      />
                      <span className="font-extrabold text-sm text-slate-500">DA</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-2">1 USD ($) equals</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={settings.currencies?.exchangeRates?.USD || 220}
                        onChange={(e) => setSettings({
                          ...settings,
                          currencies: {
                            ...(settings.currencies || { primary: 'DA', enabled: ['DA'], exchangeRates: { EUR: 240, USD: 220 } }),
                            exchangeRates: {
                              ...(settings.currencies?.exchangeRates || { EUR: 240, USD: 220 }),
                              USD: Number(e.target.value) || 220
                            }
                          }
                        })}
                        className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                      />
                      <span className="font-extrabold text-sm text-slate-500">DA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {activeCropFile && (
        <ImageCropperModal
          file={activeCropFile}
          onCancel={() => setActiveCropFile(null)}
          onCrop={performLogoUpload}
          aspectRatio="logo"
        />
      )}
    </div>
  );
}
