import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Airport', 'City', 'Marina'], required: true },
  categories: [{ type: String }], // e.g. ['Car', 'Motorcycle'], ['JetSki']
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  city: { type: String, default: "" },
  coordinates: { type: String, default: "" }, // Label for the GPS point e.g., "Aéroport d'Alger Terminal 2"
  googleMapLink: { type: String, default: "" },
  hours: { type: String, default: "08:00 - 22:00" },
  coverImage: { type: String, default: "" },
  gradient: { type: String, default: "from-blue-600 to-indigo-700" }
});

const siteSettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: "LuxeRent" },
  storeLogo: { type: String, default: "" },
  phone: { type: String, default: "+213 (0) 550 12 34 56" },
  email: { type: String, default: "contact@luxerent.com" },
  address: { type: String, default: "Alger, Algérie" },
  mainColors: {
    primary: { type: String, default: "#4f46e5" },
    secondary: { type: String, default: "#3b82f6" }
  },
  hero: {
    title: {
      fr: { type: String, default: "Le frisson de la location premium" },
      en: { type: String, default: "The thrill of premium rental" },
      ar: { type: String, default: "متعة التأجير الفاخر" }
    },
    subtitle: {
      fr: { type: String, default: "Faites votre choix parmi notre flotte exclusive..." },
      en: { type: String, default: "Choose from our exclusive fleet..." },
      ar: { type: String, default: "اختر من أسطولنا الحصري..." }
    },
    backgroundImage: { type: String, default: "" }
  },
  aboutStory: {
    subtitle: {
      fr: { type: String, default: "" },
      en: { type: String, default: "" },
      ar: { type: String, default: "" }
    },
    title: {
      fr: { type: String, default: "Notre Histoire et Vision" },
      en: { type: String, default: "Our Story & Vision" },
      ar: { type: String, default: "قصتنا ورؤيتنا" }
    },
    text1: {
      fr: { type: String, default: "Fondée avec la passion de l'automobile d'exception, notre agence s'est imposée comme la référence de la location de véhicules premium en Algérie. Nous ne proposons pas simplement des voitures, nous offrons des expériences inoubliables." },
      en: { type: String, default: "Founded with a passion for exceptional automobiles, our agency has established itself as the benchmark for premium vehicle rental in Algeria. We don't just offer cars, we offer unforgettable experiences." },
      ar: { type: String, default: "تأسست وكالتنا بشغف بالسيارات الاستثنائية، وأثبتت نفسها كمرجع لتأجير السيارات الفاخرة في الجزائر. نحن لا نقدم مجرد سيارات، بل نقدم تجارب لا تُنسى." }
    },
    text2: {
      fr: { type: String, default: "Notre flotte méticuleusement sélectionnée comprend les derniers modèles des marques les plus prestigieuses. De la supercar rugissante au SUV luxueux, chaque véhicule est maintenu dans un état impeccable pour garantir votre sécurité et votre confort absolu." },
      en: { type: String, default: "Our meticulously selected fleet includes the latest models from the most prestigious brands. From roaring supercars to luxurious SUVs, each vehicle is maintained in impeccable condition to ensure your safety and absolute comfort." },
      ar: { type: String, default: "يضم أسطولنا المختار بعناية أحدث الموديلات من أشهر العلامات التجارية. من السيارات الخارقة الصاخبة إلى سيارات الدفع الرباعي الفاخرة، يتم صيانة كل سيارة في حالة لا تشوبها شائبة لضمان سلامتك وراحتك المطلقة." }
    },
    backgroundImage: { type: String, default: "" },
    animateBackground: { type: Boolean, default: true }
  },
  footer: {
    backgroundImage: { type: String, default: "" },
    animateBackground: { type: Boolean, default: true },
    tagline: {
      fr: { type: String, default: "Le spécialiste de la location de voitures, motos et jet-skis de prestige en Algérie. Zéro caution en ligne et paiement sur place." },
      en: { type: String, default: "Premier luxury car, motorcycle, and jet ski rentals in Algeria. Zero upfront online deposits and transparent on-site payment." },
      ar: { type: String, default: "الرائد في تأجير السيارات والدراجات النارية والجي سكي الفاخرة بالجزائر. بدون دفعات أولية، ودفع كامل عند الاستلام." }
    },
    tickerText: {
      fr: { type: String, default: "⚡ PAIEMENT SUR PLACE 100% • 🏎️ FLOTTE DE PRESTIGE 2026 • 🛡️ ZÉRO CAUTION EN LIGNE • 📍 AGENCES ALGER & ORAN • 📞 ASSISTANCE VIP 24/7" },
      en: { type: String, default: "⚡ 100% ON-SITE PAYMENT • 🏎️ PRESTIGE FLEET 2026 • 🛡️ ZERO ONLINE DEPOSIT • 📍 ALGIERS & ORAN HUBS • 📞 24/7 VIP SUPPORT" },
      ar: { type: String, default: "⚡ دفع كامل عند الاستلام • 🏎️ أسطول التميز 2026 • 🛡️ بدون عربون أونلاين • 📍 مطار الجزائر ووهران • 📞 دعم VIP 24/7" }
    },
    socialLinks: {
      instagram: { type: String, default: "https://instagram.com" },
      facebook: { type: String, default: "https://facebook.com" },
      whatsapp: { type: String, default: "https://wa.me/213550123456" },
      tiktok: { type: String, default: "" }
    },
    customLinks: [
      {
        label: {
          fr: { type: String, default: "" },
          en: { type: String, default: "" },
          ar: { type: String, default: "" }
        },
        url: { type: String, default: "" }
      }
    ]
  },
  showDateSearch: { type: Boolean, default: true },
  generalConditions: { 
    type: String, 
    default: `1. Permis de conduire & Age minimum
Le conducteur doit être âgé d'au moins 21 ans (selon la catégorie du véhicule) et être titulaire d'un permis de conduire valide depuis au moins 1 à 2 ans.

2. Documents obligatoires à présenter
Lors de la remise des clés à l'agence, vous devez présenter votre permis de conduire original ainsi qu'une pièce d'identité ou un passeport en cours de validité.

3. Caution & Garantie
Une caution de garantie est consignée à l'agence lors du départ et vous est intégralement restituée au retour du véhicule sans dommage.

4. Annulation gratuite
L'annulation de la réservation est 100% gratuite à tout moment avant l'heure prévue de prise en charge sans aucun frais.` 
  },
  currencies: {
    primary: { type: String, default: 'DA' },
    enabled: { type: [String], default: ['DA'] },
    exchangeRates: {
      EUR: { type: Number, default: 240 },
      USD: { type: Number, default: 220 }
    }
  },
  faqs: [
    {
      q: { type: String, default: "" },
      a: { type: String, default: "" }
    }
  ],
  locations: [locationSchema]
}, { timestamps: true });

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
