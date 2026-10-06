/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  RefreshCcw, Mail, Settings, Car, Users, Calendar as CalendarIcon, 
  Database, Lock, ShieldAlert, Key, Plus, Edit3, Trash2, 
  X, Check, Layers, Image as ImageIcon, LogOut, CheckCircle2, TrendingUp, TrendingDown, BarChart3, DollarSign, ShieldCheck,
  Search, Filter, RotateCcw, SlidersHorizontal, Sparkles, Activity, Clock, ArrowUpRight, PieChart, Award, CalendarDays
} from 'lucide-react';
import dynamic from 'next/dynamic';

const AdminChart = dynamic(() => import('./AdminChart'), { ssr: false });
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';
import CategoriesTab from './CategoriesTab';
import MessagesTab from './MessagesTab';
import SettingsTab from './SettingsTab';
import ExtraOptionsTab from './ExtraOptionsTab';
import CalendarTab from './CalendarTab';
import ImageCropperModal from '@/components/ImageCropperModal';
import { useSettings } from '@/context/SettingsContext';
import BrandLogo, { POPULAR_BRANDS } from '@/components/BrandLogo';

export default function AdminDashboard() {
  const { t, locale } = useLanguage();
  const { settings } = useSettings();
  const { isAuthenticated, role, token, login, logout } = useAuth();
  const { confirm } = useConfirm();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Dashboard Workspace States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'bookings' | 'fleet' | 'categories' | 'messages' | 'settings' | 'clients' | 'options'>('dashboard');
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Reset Password States
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetUsername, setResetUsername] = useState('admin');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetMaskedEmail, setResetMaskedEmail] = useState('');
  const [resetDevOtp, setResetDevOtp] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // 2FA Challenge States
  const [requires2FA, setRequires2FA] = useState(false);
  const [temp2FAToken, setTemp2FAToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtpCode, setDevOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');

  const handleRequestResetCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetUsername.trim()) {
      setResetError("Veuillez saisir votre nom d'utilisateur ou adresse e-mail.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resetUsername }),
      });

      const data = await res.json();
      if (res.ok) {
        setResetMaskedEmail(data.emailMasked || '');
        setResetDevOtp(data.devOtp || '');
        setResetSuccess(data.message || 'Un code de vérification a été envoyé.');
        setResetStep(2);
        toast.success(data.message || 'Code envoyé par e-mail !');
      } else {
        setResetError(data.error || 'Échec de la demande de réinitialisation.');
      }
    } catch (error) {
      console.error(error);
      setResetError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetCode.trim()) {
      setResetError('Le code de vérification à 6 chiffres est requis.');
      return;
    }

    if (resetNewPassword.length < 4) {
      setResetError('Le nouveau mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: resetUsername,
          otpCode: resetCode,
          newPassword: resetNewPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess(data.message || 'Mot de passe réinitialisé avec succès !');
        toast.success(data.message || 'Mot de passe réinitialisé avec succès !');
        setUsername(resetUsername);
        setPassword(resetNewPassword);
        setTimeout(() => {
          setIsResettingPassword(false);
          setResetStep(1);
          setResetCode('');
          setResetNewPassword('');
          setResetConfirmPassword('');
          setResetSuccess('');
        }, 1500);
      } else {
        setResetError(data.error || 'Échec de la réinitialisation.');
      }
    } catch (error) {
      console.error(error);
      setResetError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setResetLoading(false);
    }
  };

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [vehicleStatus, setVehicleStatus] = useState<'Available' | 'Rented' | 'Maintenance'>('Available');
  const [fleetViewMode, setFleetViewMode] = useState<'grid' | 'table'>('grid');

  // Booking Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    guestName: '', guestEmail: '', guestPhone: '',
    vehicleId: '', pickupDate: '', returnDate: '',
    pickupLocation: '', addOns: [] as string[],
    rentalType: 'day',
    bookingStatus: 'Pending',
  });
  const [savingBooking, setSavingBooking] = useState(false);
  
  // Vehicle Form States
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [category, setCategory] = useState<string>('Car');
  const [subcategory, setSubcategory] = useState<string>('');
  const [pricePerDay, setPricePerDay] = useState<number>(0);
  const [pricePerHalfDay, setPricePerHalfDay] = useState<number>(0);
  const [pricePerHour, setPricePerHour] = useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountLabel, setDiscountLabel] = useState<string>('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLandingImage, setUploadingLandingImage] = useState(false);
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [conditions, setConditions] = useState('');
  const [landingImage, setLandingImage] = useState('');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [requirementsFr, setRequirementsFr] = useState('');
  const [conditionsFr, setConditionsFr] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState<number | ''>('');
  const [driverAvailable, setDriverAvailable] = useState(false);
  const [driverPricePerDay, setDriverPricePerDay] = useState<number>(0);
  const [unavailabilityDates, setUnavailabilityDates] = useState<{start: string, end: string}[]>([]);

  // Fleet Filter States
  const [fleetSearchQuery, setFleetSearchQuery] = useState('');
  const [fleetCategoryFilter, setFleetCategoryFilter] = useState('All');
  const [fleetStatusFilter, setFleetStatusFilter] = useState('All');

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v: any) => {
      if (fleetCategoryFilter !== 'All' && v.category !== fleetCategoryFilter) {
        return false;
      }
      if (fleetStatusFilter !== 'All' && v.status !== fleetStatusFilter) {
        return false;
      }
      if (fleetSearchQuery.trim() !== '') {
        const q = fleetSearchQuery.toLowerCase().trim();
        const textToSearch = `${v.make || ''} ${v.model || ''} ${v.year || ''} ${v.subcategory || ''}`.toLowerCase();
        if (!textToSearch.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, fleetCategoryFilter, fleetStatusFilter, fleetSearchQuery]);

  // Cars API Autocomplete States (carsdataset.com)
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiSuggestions, setApiSuggestions] = useState<any[]>([]);
  const [loadingApiSuggestions, setLoadingApiSuggestions] = useState(false);
  const [showApiDropdown, setShowApiDropdown] = useState(false);

  const searchCarsApi = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setApiSuggestions([]);
      return;
    }
    setLoadingApiSuggestions(true);
    try {
      const res = await fetch(`https://api.carsdataset.com/api/v1/preview/search?brand=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setApiSuggestions(data.results || []);
      } else {
        setApiSuggestions([]);
      }
    } catch (err) {
      console.error('Cars API search error:', err);
      setApiSuggestions([]);
    } finally {
      setLoadingApiSuggestions(false);
    }
  };

  const applyCarsApiSuggestion = (item: any) => {
    if (!item) return;
    setMake(item.brand || '');
    setModel(item.trim ? `${item.model} ${item.trim}` : (item.model || ''));
    if (item.year) setYear(item.year);
    if (item.power_hp) setHorsepower(item.power_hp);
    if (item.transmission_type) {
      const trans = item.transmission_type.toLowerCase();
      setTransmission(trans.includes('manual') ? 'Manual' : 'Automatic');
    }
    if (item.fuel_type) {
      const f = item.fuel_type.toLowerCase();
      if (f.includes('diesel')) setFuel('Diesel');
      else if (f.includes('electric')) setFuel('Electric');
      else if (f.includes('hybrid')) setFuel('Hybrid');
      else setFuel('Petrol');
    }
    setShowApiDropdown(false);
    setApiSearchQuery('');
    toast.success(`Données chargées : ${item.brand} ${item.model} (${item.power_hp || 0} HP) !`);
  };

  // Crop states
  const [activeCropFile, setActiveCropFile] = useState<File | null>(null);
  const [cropTarget, setCropTarget] = useState<'vehicle' | 'landing' | null>(null);

  const triggerCropForVehicle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActiveCropFile(file);
    setCropTarget('vehicle');
    e.target.value = '';
  };

  const triggerCropForLanding = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActiveCropFile(file);
    setCropTarget('landing');
    e.target.value = '';
  };

  const performImageUpload = async (file: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.url) {
          setImagesList(prev => [...prev, data.url]);
          toast.success('Image chargée avec succès !');
        } else {
          toast.error('Échec du téléchargement');
        }
      } else {
        const text = await res.text();
        console.warn('Expected JSON response, got text:', text.substring(0, 100));
        toast.error('Réponse invalide du serveur de téléchargement');
      }
    } catch (error) {
      console.error('Error during image upload:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploadingImage(false);
    }
  };

  const performLandingImageUpload = async (file: File) => {
    setUploadingLandingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.url) {
          setLandingImage(data.url);
          toast.success('Image de présentation chargée !');
        } else {
          toast.error('Échec du téléchargement');
        }
      } else {
        toast.error('Réponse invalide du serveur de téléchargement');
      }
    } catch (error) {
      console.error('Error during landing image upload:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploadingLandingImage(false);
    }
  };
  
  // Features Form States
  const [doors, setDoors] = useState<number>(4);
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic');
  const [fuel, setFuel] = useState<'Petrol' | 'Diesel' | 'Electric' | 'Hybrid'>('Petrol');
  const [cc, setCc] = useState<number>(1000);
  const [horsepower, setHorsepower] = useState<number>(150);

  // Use the AuthContext for login state instead of local storage check here.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          setTemp2FAToken(data.tempToken);
          setMaskedEmail(data.emailMasked);
          setDevOtpCode(data.devOtpCode || '');
          toast.success(data.message || 'Code 2FA envoyé !');
        } else {
          login(data.username, data.role, data.token);
        }
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Network error. Please check your connection.');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');
    if (!otpInput || otpInput.trim().length !== 6) {
      setTwoFactorError('Veuillez saisir un code valide à 6 chiffres.');
      return;
    }

    setVerifying2FA(true);
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: temp2FAToken, code: otpInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || 'Authentification 2FA réussie !');
        login(data.username, data.role, data.token);
        setRequires2FA(false);
        setOtpInput('');
      } else {
        setTwoFactorError(data.error || 'Code 2FA incorrect.');
      }
    } catch {
      setTwoFactorError('Erreur réseau lors de la vérification 2FA.');
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleSignOut = () => {
    logout();
    setUsername('');
    setPassword('');
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        console.warn(`[Bookings] HTTP ${res.status}`);
        return;
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setBookings(data);
      } else {
        const text = await res.text();
        console.warn('Expected JSON for bookings, got:', text.substring(0, 100));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[Vehicles] HTTP ${res.status}:`, errData.error || 'Fetch failed');
        return;
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setVehicles(data);
      } else {
        const text = await res.text();
        console.warn('Expected JSON for vehicles, got:', text.substring(0, 100));
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategoriesData(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (role !== 'Admin') return;
    try {
      const res = await fetch('/api/messages', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const unread = data.filter((m: any) => m.status === 'Unread').length;
          setUnreadCount(unread);
        }
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchBookings(), fetchVehicles(), fetchCategories(), fetchUnreadCount()]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
      if (role === 'Admin') {
        const interval = setInterval(fetchUnreadCount, 15000);
        return () => clearInterval(interval);
      }
    }
  }, [isAuthenticated, token, role]);

  const seedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { 
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || `HTTP Error: ${res.status}`);
        return;
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        toast.success(data.message || 'Seed completed successfully!');
        loadAllData();
      } else {
        const text = await res.text();
        toast.error('Database seeded, but received non-JSON response from server.');
        console.warn('Expected JSON for seed, got:', text.substring(0, 100));
        loadAllData();
      }
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Failed to seed database.');
    } finally {
      setSeeding(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings((prev: any) => 
          prev.map((b: any) => b._id === bookingId ? { ...b, bookingStatus: newStatus } : b)
        );
        toast.success('Status updated successfully');
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error updating status');
    }
  };

  // Open Modal to Add
  const openAddModal = () => {
    setEditingVehicle(null);
    setMake('');
    setModel('');
    setYear(2024);
    setCategory(categoriesData.length > 0 ? categoriesData[0].name : 'Car');
    setSubcategory('');
    setPricePerDay(15000);
    setPricePerHalfDay(8000);
    setPricePerHour(1000);
    setDiscountPercentage(0);
    setDiscountLabel('');
    setImagesList([]); // Start with empty images for real entry
    setDescription('');
    setDescriptionFr('');
    setRequirements('');
    setRequirementsFr('');
    setConditions('');
    setConditionsFr('');
    setSecurityDeposit('');
    setDriverAvailable(false);
    setDriverPricePerDay(0);
    setLandingImage('');
    setUnavailabilityDates([]);
    setVehicleStatus('Available');
    
    // Specs defaults
    setDoors(4);
    setTransmission('Automatic');
    setFuel('Petrol');
    setCc(1600);
    setHorsepower(180);
    
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const openEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setMake(vehicle.make);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setCategory(vehicle.category);
    setSubcategory(vehicle.subcategory || '');
    setPricePerDay(vehicle.pricePerDay || 0);
    setPricePerHalfDay(vehicle.pricePerHalfDay || 0);
    setPricePerHour(vehicle.pricePerHour || 0);
    setDiscountPercentage(vehicle.discount?.percentage || 0);
    setDiscountLabel(vehicle.discount?.label || '');
    setImagesList(vehicle.images || []);
    setDescription(vehicle.description || '');
    setDescriptionFr(vehicle.description_fr || '');
    setRequirements(vehicle.requirements || '');
    setRequirementsFr(vehicle.requirements_fr || '');
    setConditions(vehicle.conditions || '');
    setConditionsFr(vehicle.conditions_fr || '');
    setSecurityDeposit(vehicle.securityDeposit !== undefined ? vehicle.securityDeposit : '');
    setDriverAvailable(vehicle.driverOption?.available || false);
    setDriverPricePerDay(vehicle.driverOption?.pricePerDay || 0);
    setLandingImage(vehicle.landingImage || '');
    setUnavailabilityDates(vehicle.unavailabilityDates || []);
    setVehicleStatus(vehicle.status || 'Available');
    
    // Specs
    setDoors(vehicle.features?.doors || 4);
    setTransmission(vehicle.features?.transmission || 'Automatic');
    setFuel(vehicle.features?.fuel || 'Petrol');
    setCc(vehicle.features?.cc || 1600);
    setHorsepower(vehicle.features?.horsepower || 180);
    
    setIsModalOpen(true);
  };

  // Save Vehicle (POST or PUT)
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (imagesList.length === 0) {
      toast.error('Veuillez ajouter au moins une photo de véhicule (1 à 10 images).');
      return;
    }
    
    const body: any = {
      make,
      model,
      year,
      category,
      subcategory,
      images: imagesList,
      description,
      description_fr: descriptionFr,
      requirements,
      requirements_fr: requirementsFr,
      conditions,
      conditions_fr: conditionsFr,
      securityDeposit: securityDeposit !== '' ? Number(securityDeposit) : undefined,
      driverOption: {
        available: driverAvailable,
        pricePerDay: Number(driverPricePerDay || 0)
      },
      landingImage,
      unavailabilityDates,
      pricePerHour,
      pricePerHalfDay,
      pricePerDay,
      status: vehicleStatus,
      discount: {
        percentage: discountPercentage,
        label: discountLabel
      },
      features: {
        transmission,
        fuel,
      }
    };

    if (category === 'JetSki') {
      body.features.horsepower = horsepower;
    } else {
      body.features.doors = doors;
      body.features.fuel = fuel;
      body.features.transmission = transmission;
      if (category === 'Motorcycle') {
        body.features.cc = cc;
      }
    }

    try {
      let url = '/api/vehicles';
      let method = 'POST';
      
      if (editingVehicle) {
        url = `/api/vehicles/${editingVehicle._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchVehicles();
        setIsModalOpen(false);
        toast.success('Vehicle saved successfully');
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to save vehicle');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error saving vehicle');
    }
  };

  // Delete Vehicle
  const handleDeleteVehicle = async (vehicleId: string) => {
    const isConfirmed = await confirm(t('deleteConfirm') || 'Delete this vehicle?');
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { 
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setVehicles(prev => prev.filter((v: any) => v._id !== vehicleId));
        toast.success('Vehicle deleted successfully');
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting vehicle');
    }
  };

  // ── Booking Creation / Editing ──────────────────────────────────────────────
  const openBookingModal = () => {
    setEditingBooking(null);
    setBookingForm({
      guestName: '', guestEmail: '', guestPhone: '',
      vehicleId: vehicles.length > 0 ? (vehicles[0] as any)._id : '',
      pickupDate: '', returnDate: '',
      pickupLocation: '', addOns: [],
      rentalType: 'day',
      bookingStatus: 'Pending',
    });
    setIsBookingModalOpen(true);
  };

  const openEditBookingModal = (booking: any) => {
    setEditingBooking(booking);
    
    // Format dates to datetime-local string (YYYY-MM-DDTHH:MM)
    const formatDateTimeLocal = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setBookingForm({
      guestName: booking.guestName || '',
      guestEmail: booking.guestEmail || '',
      guestPhone: booking.guestPhone || '',
      vehicleId: booking.vehicleId?._id || booking.vehicleId || '',
      pickupDate: formatDateTimeLocal(booking.pickupDate),
      returnDate: formatDateTimeLocal(booking.returnDate),
      pickupLocation: booking.pickupLocation || '',
      addOns: booking.addOns || [],
      rentalType: booking.rentalType || 'day',
      bookingStatus: booking.bookingStatus || 'Pending',
    });
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBooking(true);
    try {
      const url = editingBooking ? `/api/bookings/${editingBooking._id}` : '/api/bookings';
      const method = editingBooking ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingForm),
      });
      if (res.ok) {
        setIsBookingModalOpen(false);
        await fetchBookings();
        toast.success(editingBooking ? 'Booking updated successfully' : 'Booking created successfully');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || (editingBooking ? t('updateBookingFailed') : t('createBookingFailed')));
      }
    } catch (error) {
      console.error(error);
      toast.error(editingBooking ? t('updateBookingError') : t('createBookingError'));
    } finally {
      setSavingBooking(false);
    }
  };

  // ── Clients Database Aggregation ───────────────────────────────────────────
  const uniqueClients = useMemo(() => {
    const clientsMap: Record<string, {
      name: string;
      email: string;
      phone: string;
      totalBookings: number;
      totalSpent: number;
      lastRentalDate: string;
      status: 'Active' | 'Inactive';
    }> = {};

    bookings.forEach((booking: any) => {
      if (!booking.guestEmail) return;
      const emailKey = booking.guestEmail.trim().toLowerCase();
      
      const currentSpent = (booking.bookingStatus !== 'Cancelled' && booking.totalPrice) ? Number(booking.totalPrice) : 0;
      
      if (!clientsMap[emailKey]) {
        clientsMap[emailKey] = {
          name: booking.guestName || '',
          email: emailKey,
          phone: booking.guestPhone || '',
          totalBookings: 1,
          totalSpent: currentSpent,
          lastRentalDate: booking.pickupDate || '',
          status: (booking.bookingStatus === 'Confirmed' || booking.bookingStatus === 'Pending') ? 'Active' : 'Inactive',
        };
      } else {
        const client = clientsMap[emailKey];
        client.totalBookings += 1;
        client.totalSpent += currentSpent;
        
        if (booking.pickupDate && (!client.lastRentalDate || new Date(booking.pickupDate) > new Date(client.lastRentalDate))) {
          client.lastRentalDate = booking.pickupDate;
          client.name = booking.guestName || client.name;
          client.phone = booking.guestPhone || client.phone;
        }
        
        if (booking.bookingStatus === 'Confirmed' || booking.bookingStatus === 'Pending') {
          client.status = 'Active';
        }
      }
    });

    return Object.values(clientsMap);
  }, [bookings]);

  const exportClientsToCSV = () => {
    const headers = [
      t('fullName') || 'Full Name', 
      t('emailAddress') || 'Email Address', 
      t('phoneNumber') || 'Phone Number', 
      t('totalBookings') || 'Total Bookings', 
      t('totalSpentLabel') || 'Total Spent (DA)', 
      t('lastRentalDateLabel') || 'Last Rental Date',
      t('status') || 'Status'
    ];
    const rows = uniqueClients.map(c => [
      c.name,
      c.email,
      c.phone,
      c.totalBookings,
      c.totalSpent,
      c.lastRentalDate ? new Date(c.lastRentalDate).toLocaleDateString(locale) : 'N/A',
      c.status === 'Active' ? (t('active') || 'Active') : (t('inactive') || 'Inactive')
    ]);
    
    const csvString = [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    const dataByMonth: Record<string, { name: string, revenue: number, bookings: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('fr-FR', { month: 'short' });
      dataByMonth[monthName] = { name: monthName, revenue: 0, bookings: 0 };
    }

    bookings.forEach((booking: any) => {
      if (!booking.pickupDate || booking.bookingStatus === 'Cancelled') return;
      const d = new Date(booking.pickupDate);
      const monthName = d.toLocaleString('fr-FR', { month: 'short' });
      
      if (dataByMonth[monthName]) {
        dataByMonth[monthName].revenue += Number(booking.totalPrice) || 0;
        dataByMonth[monthName].bookings += 1;
      }
    });

    return Object.values(dataByMonth);
  }, [bookings, locale]);

  const [dashboardPeriod, setDashboardPeriod] = useState<'all' | 'month' | 'week'>('all');

  const dashboardStats = useMemo(() => {
    const now = new Date();
    
    const filteredBookings = bookings.filter((b: any) => {
      if (!b.pickupDate) return true;
      if (dashboardPeriod === 'all') return true;
      const bookingDate = new Date(b.pickupDate);
      const diffDays = (now.getTime() - bookingDate.getTime()) / (1000 * 3600 * 24);
      if (dashboardPeriod === 'month') return diffDays <= 30;
      if (dashboardPeriod === 'week') return diffDays <= 7;
      return true;
    });

    const totalBookings = filteredBookings.length;
    const confirmedBookings = filteredBookings.filter((b: any) => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed');
    const pendingCount = filteredBookings.filter((b: any) => b.bookingStatus === 'Pending').length;

    const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + (Number(b.totalPrice) || 0), 0);
    const avgBookingValue = confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 0;
    
    const currentlyRentedVehicles = vehicles.filter((v: any) => v.status === 'Rented' || v.status === 'Loué' || v.isRented).length;
    const totalVehiclesCount = vehicles.length || 1;
    const occupancyRate = Math.round((currentlyRentedVehicles / totalVehiclesCount) * 100);

    const uniqueClients = new Set(filteredBookings.map((b: any) => b.guestEmail || b.clientEmail || b.guestName).filter(Boolean)).size;

    const categoryCounts: Record<string, { count: number; revenue: number }> = {};
    filteredBookings.forEach((b: any) => {
      const cat = b.vehicleCategory || b.category || 'Autre';
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = { count: 0, revenue: 0 };
      }
      categoryCounts[cat].count += 1;
      if (b.bookingStatus !== 'Cancelled') {
        categoryCounts[cat].revenue += Number(b.totalPrice) || 0;
      }
    });

    const categoryStats = Object.entries(categoryCounts).map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      percentage: totalBookings > 0 ? Math.round((data.count / totalBookings) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    const vehicleBookingCounts: Record<string, { title: string; category: string; image?: string; count: number; revenue: number }> = {};
    filteredBookings.forEach((b: any) => {
      const title = b.vehicleTitle || b.vehicleName || 'Véhicule';
      const key = title;
      if (!vehicleBookingCounts[key]) {
        vehicleBookingCounts[key] = {
          title,
          category: b.vehicleCategory || 'Premium',
          image: b.vehicleImage || b.image,
          count: 0,
          revenue: 0
        };
      }
      vehicleBookingCounts[key].count += 1;
      if (b.bookingStatus !== 'Cancelled') {
        vehicleBookingCounts[key].revenue += Number(b.totalPrice) || 0;
      }
    });

    const topVehicles = Object.values(vehicleBookingCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const growthRate = (() => {
      if (chartData.length < 2) return { percentage: 0, isPositive: true };
      const current = chartData[chartData.length - 1]?.revenue || 0;
      const previous = chartData[chartData.length - 2]?.revenue || 0;
      if (previous === 0) return { percentage: current > 0 ? 100 : 0, isPositive: true };
      const pct = Math.round(((current - previous) / previous) * 100);
      return { percentage: pct, isPositive: pct >= 0 };
    })();

    return {
      totalBookings,
      pendingCount,
      totalRevenue,
      avgBookingValue,
      occupancyRate,
      currentlyRentedVehicles,
      totalVehiclesCount,
      uniqueClients,
      categoryStats,
      topVehicles,
      growthRate,
    };
  }, [bookings, vehicles, dashboardPeriod, chartData]);

  // Lockscreen UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-950 overflow-hidden">
        {/* Premium Dark Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-black/50 relative overflow-hidden animate-in zoom-in-95 duration-500">
          
          {requires2FA ? (
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight text-center mb-2">
                Authentification 2FA
              </h2>
              <p className="text-slate-400 font-medium text-center text-xs mb-6 leading-relaxed">
                Un code de vérification à 6 chiffres a été envoyé à l'adresse <strong className="text-indigo-400 font-bold">{maskedEmail || 'associée à votre compte'}</strong>.
              </p>

              {devOtpCode && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-2xl mb-6 text-center text-xs font-bold">
                  <span>Code 2FA généré : </span>
                  <code className="bg-amber-950/80 px-2 py-0.5 rounded text-amber-200 font-mono text-sm tracking-widest">{devOtpCode}</code>
                </div>
              )}

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2 text-center">
                    Saisissez le code à 6 chiffres
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900/80 border border-indigo-500/40 rounded-2xl py-4 text-center font-mono font-black text-2xl tracking-[0.4em] text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700 placeholder:tracking-normal"
                  />
                </div>

                {twoFactorError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl flex items-center justify-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" /> {twoFactorError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying2FA}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-[0.98] text-sm disabled:bg-slate-700"
                >
                  {verifying2FA ? 'Vérification en cours...' : 'Valider le Code 2FA'}
                </button>

                <button
                  type="button"
                  onClick={() => { setRequires2FA(false); setOtpInput(''); setTwoFactorError(''); }}
                  className="w-full text-center text-xs font-bold text-slate-400 hover:text-white transition-colors pt-2 block"
                >
                  ← Annuler et Retourner à la connexion
                </button>
              </form>
            </div>
          ) : isResettingPassword ? (
            <div>
              {resetStep === 1 ? (
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                    <RefreshCcw className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight text-center mb-2">
                    Mot de passe oublié ?
                  </h2>
                  <p className="text-slate-400 font-medium text-center text-xs mb-6 leading-relaxed">
                    Saisissez votre nom d'utilisateur ou adresse e-mail. Nous vous enverrons un code de vérification à 6 chiffres.
                  </p>

                  <form onSubmit={handleRequestResetCode} className="space-y-4">
                    <div className="relative group">
                      <Users className="w-5 h-5 text-slate-500 group-focus-within:text-amber-400 absolute left-4.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input 
                        type="text" required placeholder="Nom d'utilisateur ou E-mail" value={resetUsername} onChange={(e) => setResetUsername(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-3.5 pl-13 pr-4 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-bold text-white text-sm transition-all placeholder:text-slate-600"
                      />
                    </div>

                    {resetError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" /> {resetError}
                      </div>
                    )}

                    <button type="submit" disabled={resetLoading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] text-sm disabled:bg-slate-700">
                      {resetLoading ? 'Envoi en cours...' : 'Envoyer le code de vérification'}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => { setIsResettingPassword(false); setResetError(''); setResetSuccess(''); }}
                      className="w-full text-center text-xs font-bold text-slate-400 hover:text-white transition-colors pt-2 block"
                    >
                      ← Retour à la connexion
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                    <Key className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight text-center mb-2">
                    Nouveau Mot de Passe
                  </h2>
                  <p className="text-slate-400 font-medium text-center text-xs mb-4 leading-relaxed">
                    Un code de vérification à 6 chiffres a été envoyé à <span className="text-amber-300 font-bold">{resetMaskedEmail || resetUsername}</span>.
                  </p>

                  {resetDevOtp && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium p-3 rounded-xl text-center mb-4">
                      💡 Code de vérification : <strong className="font-mono text-white tracking-widest text-sm bg-slate-900 px-2 py-0.5 rounded border border-amber-500/40 ml-1">{resetDevOtp}</strong>
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="relative group">
                      <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-amber-400 absolute left-4.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input 
                        type="text" required placeholder="Code à 6 chiffres (ex: 849204)" maxLength={15} value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-3.5 pl-13 pr-4 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono font-bold text-amber-300 text-sm transition-all placeholder:text-slate-600 tracking-widest"
                      />
                    </div>

                    <div className="relative group">
                      <Key className="w-5 h-5 text-slate-500 group-focus-within:text-amber-400 absolute left-4.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input 
                        type="password" required placeholder="Nouveau mot de passe" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-3.5 pl-13 pr-4 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-bold text-white text-sm transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div className="relative group">
                      <Key className="w-5 h-5 text-slate-500 group-focus-within:text-amber-400 absolute left-4.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input 
                        type="password" required placeholder="Confirmer le nouveau mot de passe" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-3.5 pl-13 pr-4 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-bold text-white text-sm transition-all placeholder:text-slate-600"
                      />
                    </div>

                    {resetError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" /> {resetError}
                      </div>
                    )}

                    {resetSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> {resetSuccess}
                      </div>
                    )}

                    <button type="submit" disabled={resetLoading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] text-sm disabled:bg-slate-700">
                      {resetLoading ? 'Réinitialisation en cours...' : 'Valider la réinitialisation'}
                    </button>

                    <div className="flex items-center justify-between pt-2">
                      <button 
                        type="button" 
                        onClick={() => handleRequestResetCode()}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                      >
                        Renvoyer le code
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setResetStep(1); setResetError(''); setResetSuccess(''); }}
                        className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        ← Changer d'identifiant
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/30">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight text-center mb-3">
                {t('adminPortal')}
              </h2>
              <p className="text-slate-400 font-medium text-center text-sm mb-8 leading-relaxed">
                {t('enterPasscode')}
              </p>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <Users className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 absolute left-4.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input 
                      id="admin-username"
                      name="username"
                      autoComplete="username"
                      suppressHydrationWarning
                      type="text" required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4.5 pl-13 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold text-white transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="relative group">
                    <Key className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 absolute left-4.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input 
                      id="admin-password"
                      name="password"
                      autoComplete="current-password"
                      suppressHydrationWarning
                      type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4.5 pl-13 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold text-white transition-all placeholder:text-slate-600 tracking-widest"
                    />
                  </div>

                  <div className="flex items-center justify-end px-1 pt-1">
                    <button 
                      type="button" 
                      onClick={() => { setIsResettingPassword(true); setLoginError(''); }}
                      className="text-xs font-extrabold text-blue-400 hover:text-blue-300 hover:underline transition-all"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  {loginError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold p-3 rounded-xl flex items-center justify-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> {loginError}
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full bg-white text-slate-950 py-4.5 rounded-2xl font-black hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-white/20 active:scale-[0.98]">
                  Authenticate
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Navigation Menu Items
  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: BarChart3, adminOnly: true },
    { id: 'calendar', label: 'Planning & Calendrier', icon: CalendarDays, adminOnly: true },
    { id: 'bookings', label: t('bookingLogs'), icon: CalendarIcon, adminOnly: true },
    { id: 'clients', label: t('clientsDatabase') || 'Clients Database', icon: Users, adminOnly: true },
    { id: 'fleet', label: t('fleetManager'), icon: Car, adminOnly: false },
    { id: 'categories', label: t('categories'), icon: Layers, adminOnly: true },
    { id: 'options', label: t('extraOptions') || 'Options & Add-ons', icon: Plus, adminOnly: true },
    { id: 'messages', label: t('messages'), icon: Mail, adminOnly: true },
    { id: 'settings', label: t('settings'), icon: Settings, adminOnly: true },
  ];

  // Dashboard Main UI
  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar / Mobile Top Bar - Hybrid Dark Theme */}
      <aside className="w-full md:w-72 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-900 flex flex-col shrink-0 transition-all duration-300 relative z-20 shadow-2xl shadow-slate-900/20">
        <div className="h-16 md:h-24 flex items-center justify-between md:justify-start px-4 sm:px-8 border-b border-white/5 shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mr-3 shadow-lg" style={{ background: `linear-gradient(to bottom right, var(--brand-secondary), var(--brand-primary))` }}>
              <Car className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-black text-white tracking-tight leading-none">{settings?.storeName || 'LuxeRent'}</h1>
              <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest block mt-0.5" style={{ color: 'var(--brand-secondary)' }}>{t('adminPortal')}</span>
            </div>
          </div>

          <button 
            onClick={handleSignOut} 
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>

        <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto py-2.5 md:py-6 px-3 sm:px-4 gap-1.5 scrollbar-hide shrink-0 whitespace-nowrap">
          {navItems.map((item) => {
            if (item.adminOnly && role !== 'Admin') return null;
            const isActive = activeTab === item.id;
            const showMessageBadge = item.id === 'messages' && unreadCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 md:gap-3 px-3.5 sm:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all duration-200 group shrink-0 relative ${
                  isActive 
                    ? 'text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                style={isActive ? { backgroundColor: 'var(--brand-primary)' } : {}}
              >
                <div className="relative flex items-center justify-center">
                  <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {showMessageBadge && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-black text-[9px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 shadow-md animate-pulse border border-slate-950">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>{item.label}</span>
                  {showMessageBadge && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full leading-none shadow-sm ml-2">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block p-4 border-t border-white/5">
          <button 
            onClick={handleSignOut} 
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
          >
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 md:h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="min-h-[4.5rem] md:h-24 py-3 md:py-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex flex-wrap sm:flex-nowrap items-center justify-between px-4 sm:px-8 z-10 shrink-0 gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight capitalize">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
            <p className="text-xs md:text-sm font-semibold text-slate-500 mt-0.5 hidden sm:block">
              Gérez votre flotte premium et les réservations de vos clients.
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">


            <button onClick={loadAllData} className="bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm text-xs sm:text-sm">
              <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" /> <span className="hidden sm:inline">{t('refresh')}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50/50 relative">

      {/* TAB 0: Dashboard (Admin Only) */}
      {activeTab === 'dashboard' && role === 'Admin' && (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-8">
          
          {/* Dashboard Header & Period Filter Bar */}
          <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Tableau de Bord & Statistiques Avancées
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Aperçu analytique global des performances de votre agence
              </p>
            </div>

            {/* Period Selector Tabs */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1 self-start md:self-auto border border-slate-200/50">
              <button
                onClick={() => setDashboardPeriod('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  dashboardPeriod === 'all'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tout l'historique
              </button>
              <button
                onClick={() => setDashboardPeriod('month')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  dashboardPeriod === 'month'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 derniers jours
              </button>
              <button
                onClick={() => setDashboardPeriod('week')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  dashboardPeriod === 'week'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 derniers jours
              </button>
            </div>
          </div>

          {/* 6 Key Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
            
            {/* KPI 1: Chiffre d'Affaires */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-50 rounded-full blur-xl group-hover:bg-emerald-100 transition-colors"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-wider px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 uppercase">
                  Revenu
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-[11px] font-black text-slate-400 tracking-wider uppercase">{t('totalRevenue') || "Revenu Total"}</div>
                <div className="text-2xl font-black text-slate-900 tracking-tighter mt-0.5">
                  {dashboardStats.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-emerald-600">DA</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Réservations Totales */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-50 rounded-full blur-xl group-hover:bg-blue-100 transition-colors"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-wider px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 uppercase">
                  Location
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-[11px] font-black text-slate-400 tracking-wider uppercase">{t('totalBookings') || "Réservations"}</div>
                <div className="text-2xl font-black text-slate-900 tracking-tighter mt-0.5">
                  {dashboardStats.totalBookings}
                </div>
              </div>
            </div>

            {/* KPI 3: Taux d'Occupation */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-50 rounded-full blur-xl group-hover:bg-purple-100 transition-colors"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 border border-purple-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-wider px-2 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 uppercase">
                  Flotte
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-[11px] font-black text-slate-400 tracking-wider uppercase">Taux d'Occupation</div>
                <div className="text-2xl font-black text-slate-900 tracking-tighter mt-0.5 flex items-baseline gap-1">
                  {dashboardStats.occupancyRate}%
                  <span className="text-[10px] text-slate-400 font-semibold">({dashboardStats.currentlyRentedVehicles}/{dashboardStats.totalVehiclesCount})</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Panier Moyen */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-50 rounded-full blur-xl group-hover:bg-amber-100 transition-colors"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-wider px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 uppercase">
                  Moyen
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-[11px] font-black text-slate-400 tracking-wider uppercase">Panier Moyen</div>
                <div className="text-2xl font-black text-slate-900 tracking-tighter mt-0.5">
                  {dashboardStats.avgBookingValue.toLocaleString()} <span className="text-xs font-bold text-amber-600">DA</span>
                </div>
              </div>
            </div>

            {/* KPI 5: En Attente */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-rose-50 rounded-full blur-xl group-hover:bg-rose-100 transition-colors"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-wider px-2 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 uppercase">
                  Urgent
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-[11px] font-black text-slate-400 tracking-wider uppercase">{t('pendingApprovals') || "En Attente"}</div>
                <div className="text-2xl font-black text-rose-600 tracking-tighter mt-0.5">
                  {dashboardStats.pendingCount}
                </div>
              </div>
            </div>

            {/* KPI 6: Clients Uniques */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-50 rounded-full blur-xl group-hover:bg-indigo-100 transition-colors"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-wider px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 uppercase">
                  Clientèle
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-[11px] font-black text-slate-400 tracking-wider uppercase">{t('activeClients') || "Clients Uniques"}</div>
                <div className="text-2xl font-black text-slate-900 tracking-tighter mt-0.5">
                  {dashboardStats.uniqueClients}
                </div>
              </div>
            </div>

          </div>

          {/* Main Visual Dashboard Section: Chart (2/3) + Category Breakdown (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Interactive Multi-Metric Chart Card */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-grid-slate-50 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none"></div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    {t('revenueTrendTitle') || "Évolution Mensuelle des Revenus & Réservations"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Comparative mensuelle des revenus cumulés et du volume de locations
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto border ${
                  dashboardStats.growthRate.isPositive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    : 'bg-rose-50 text-rose-700 border-rose-200/60'
                }`}>
                  {dashboardStats.growthRate.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  )}
                  {dashboardStats.growthRate.isPositive
                    ? `+${dashboardStats.growthRate.percentage}% ce mois`
                    : `${dashboardStats.growthRate.percentage}% ce mois`}
                </div>
              </div>
              <div className="h-[360px] w-full relative z-10 flex-1">
                <AdminChart data={chartData} />
              </div>
            </div>

            {/* Category Revenue Distribution Card */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-indigo-600" />
                      Répartition par Catégorie
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Part des réservations par type de véhicule
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {dashboardStats.categoryStats.length > 0 ? (
                    dashboardStats.categoryStats.map((cat, idx) => {
                      const colors = [
                        'from-indigo-500 to-indigo-600',
                        'from-emerald-500 to-emerald-600',
                        'from-purple-500 to-purple-600',
                        'from-amber-500 to-amber-600',
                        'from-rose-500 to-rose-600',
                      ];
                      const barColor = colors[idx % colors.length];

                      return (
                        <div key={cat.name} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              {cat.name}
                            </span>
                            <span className="font-black text-slate-900">
                              {cat.count} loc. <span className="text-slate-400 font-semibold">({cat.percentage}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                              style={{ width: `${cat.percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold text-right">
                            Revenu: <strong className="text-slate-700">{cat.revenue.toLocaleString()} DA</strong>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-400 font-semibold text-xs">
                      Aucune donnée de catégorie disponible
                    </div>
                  )}
                </div>
              </div>

              {/* Total Fleet Summary Box */}
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Flotte Active</div>
                  <div className="text-base font-black text-slate-900">{dashboardStats.totalVehiclesCount} véhicules répertoriés</div>
                </div>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                  {dashboardStats.occupancyRate}%
                </div>
              </div>
            </div>

          </div>

          {/* Secondary Dashboard Section: Top 5 Rented Vehicles + Quick Actions Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Top 5 Most Rented Vehicles */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Top 5 des Véhicules les plus Loués
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Classement par volume de réservations confirmées
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('fleet')}
                  className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 hover:underline"
                >
                  Voir toute la flotte &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {dashboardStats.topVehicles.length > 0 ? (
                  dashboardStats.topVehicles.map((item, idx) => (
                    <div key={idx} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3.5">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          idx === 1 ? 'bg-slate-200 text-slate-700' :
                          idx === 2 ? 'bg-amber-700/10 text-amber-900' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          #{idx + 1}
                        </span>
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-12 h-10 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="w-12 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <Car className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.title}</h4>
                          <span className="inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-0.5">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-slate-900 text-sm">{item.count} locations</div>
                        <div className="text-xs font-bold text-emerald-600">{item.revenue.toLocaleString()} DA</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 font-semibold text-xs">
                    Aucune donnée de réservation récente pour classer les véhicules
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action & Management Hub */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  Raccourcis Administrateur
                </h3>
                <p className="text-xs font-semibold text-slate-500 mb-6">
                  Actions rapides de gestion et accès direct
                </p>

                <div className="space-y-3">
                  <button
                    onClick={openBookingModal}
                    className="w-full p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-900 font-bold text-xs flex items-center justify-between transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <Plus className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                      Créer une nouvelle réservation
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="w-full p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-900 font-bold text-xs flex items-center justify-between transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                      Planning & Calendrier des véhicules
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={openAddModal}
                    className="w-full p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-between transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      Ajouter un véhicule à la flotte
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-800 font-bold text-xs flex items-center justify-between transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-slate-600 group-hover:rotate-45 transition-transform" />
                      Paramètres généraux du site
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => setActiveTab('clients')}
                    className="w-full p-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-100 text-purple-900 font-bold text-xs flex items-center justify-between transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                      Base de données clients
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Système de gestion en direct &bull; Synchronisé
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 0.5: Planning Calendar (Admin Only) */}
      {activeTab === 'calendar' && role === 'Admin' && (
        <CalendarTab
          bookings={bookings}
          vehicles={vehicles}
          categories={categoriesData}
          onOpenEditBooking={openEditBookingModal}
          onOpenNewBookingWithVehicleAndDate={(vehicleId, dateStr) => {
            setEditingBooking(null);
            setBookingForm({
              guestName: '', guestEmail: '', guestPhone: '',
              vehicleId,
              pickupDate: `${dateStr}T10:00`,
              returnDate: `${dateStr}T18:00`,
              pickupLocation: '', addOns: [],
              rentalType: 'day',
              bookingStatus: 'Pending',
            });
            setIsBookingModalOpen(true);
          }}
          onOpenNewBooking={openBookingModal}
        />
      )}

      {/* TAB 1: Booking logs (Admin Only) */}
      {activeTab === 'bookings' && role === 'Admin' && (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
          <div className="flex justify-end mb-6">
            <button
              onClick={openBookingModal}
              className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20"
            >
              <Plus className="w-5 h-5" /> {t('newReservation') || 'New Reservation'}
            </button>
          </div>
          <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('guestDetails')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('vehicle')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('schedule')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('location')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('total')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('status')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-24 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <span className="text-slate-500 font-bold text-sm tracking-wide">{t('loadingReservations')}</span>
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <CalendarIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <span className="text-slate-500 font-bold block mb-1">{t('noBookingsFound')}</span>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking: any) => (
                      <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{booking.guestName}</div>
                          <div className="text-xs text-slate-500 font-bold mt-1">{booking.guestEmail}</div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{booking.guestPhone}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <BrandLogo brand={booking.vehicleId?.make} size={18} />
                            <span>{booking.vehicleId?.make} {booking.vehicleId?.model}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black tracking-wide uppercase">{booking.vehicleId?.category}</span>
                            {booking.includeCaution && (
                              <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-extrabold">
                                🛡️ Caution ({booking.cautionAmount ? booking.cautionAmount.toLocaleString() : 0} DA)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-medium text-slate-600 leading-relaxed">
                          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> {new Date(booking.pickupDate).toLocaleString(locale, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                          <div className="flex items-center gap-2 mt-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {new Date(booking.returnDate).toLocaleString(locale, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-600">{booking.pickupLocation}</td>
                        <td className="px-8 py-6 font-black text-slate-900 text-right text-lg">
                          {booking.totalPrice ? `${booking.totalPrice.toLocaleString('fr-DZ')} DA` : `0 DA`}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <select
                            value={booking.bookingStatus}
                            onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border outline-none cursor-pointer transition-all shadow-sm ${
                              booking.bookingStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 focus:ring-4 focus:ring-amber-500/20' :
                              booking.bookingStatus === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 focus:ring-4 focus:ring-blue-500/20' :
                              booking.bookingStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 focus:ring-4 focus:ring-emerald-500/20' :
                              'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 focus:ring-4 focus:ring-red-500/20'
                            }`}
                          >
                            <option value="Pending">{t('pending')}</option>
                            <option value="Confirmed">{t('confirmed')}</option>
                            <option value="Completed">{t('completed')}</option>
                            <option value="Cancelled">{t('cancelled')}</option>
                          </select>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button
                            onClick={() => openEditBookingModal(booking)}
                            className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 hover:border-indigo-200"
                            title={t('editBooking')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Fleet CRUD Manager */}
      {activeTab === 'fleet' && (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 font-bold text-xs tracking-wider select-none shrink-0 shadow-inner">
              <button 
                type="button" 
                onClick={() => setFleetViewMode('grid')} 
                className={`px-4 py-2 rounded-lg text-center flex items-center justify-center transition-all ${fleetViewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t('gridView') || 'Grid View'}
              </button>
              <button 
                type="button" 
                onClick={() => setFleetViewMode('table')} 
                className={`px-4 py-2 rounded-lg text-center flex items-center justify-center transition-all ${fleetViewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t('tableView') || 'Table View'}
              </button>
            </div>
            <button 
              onClick={openAddModal}
              className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
            >
              <Plus className="w-5 h-5" /> {t('addVehicle')}
            </button>
          </div>

          {/* Fleet Filter Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par marque ou modèle (ex: Golf, Dacia, Symbol, Tesla)..."
                value={fleetSearchQuery}
                onChange={(e) => setFleetSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {fleetSearchQuery && (
                <button
                  onClick={() => setFleetSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                <Filter className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <select
                  value={fleetCategoryFilter}
                  onChange={(e) => setFleetCategoryFilter(e.target.value)}
                  className="bg-transparent text-slate-800 outline-none font-extrabold cursor-pointer"
                >
                  <option value="All">Toutes Catégories</option>
                  <option value="Car">Voitures</option>
                  <option value="Motorcycle">Motos</option>
                  <option value="JetSki">Jet Skis</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <select
                  value={fleetStatusFilter}
                  onChange={(e) => setFleetStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-800 outline-none font-extrabold cursor-pointer"
                >
                  <option value="All">Tous Statuts</option>
                  <option value="Available">Disponible</option>
                  <option value="Rented">Loué</option>
                  <option value="Maintenance">En Maintenance</option>
                </select>
              </div>

              {/* Reset Filters Button */}
              {(fleetSearchQuery || fleetCategoryFilter !== 'All' || fleetStatusFilter !== 'All') && (
                <button
                  onClick={() => {
                    setFleetSearchQuery('');
                    setFleetCategoryFilter('All');
                    setFleetStatusFilter('All');
                  }}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black transition-all flex items-center gap-1 border border-indigo-200/60"
                  title="Réinitialiser tous les filtres"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Effacer</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-xs font-bold text-slate-500">
              Affichage de <span className="text-indigo-600 font-extrabold">{filteredVehicles.length}</span> sur {vehicles.length} véhicules
            </span>
          </div>

          <div className="pb-12">
            {loading ? (
              <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                <span className="text-slate-500 font-bold">{t('loadingFleet')}</span>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-white border border-dashed rounded-[2rem] p-24 text-center max-w-xl mx-auto shadow-sm">
                <Car className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h3 className="font-black text-2xl text-slate-900 mb-2">{t('emptyFleet')}</h3>
                <p className="text-slate-500 font-medium">{t('noVehiclesAdded')}</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="bg-white border border-dashed rounded-[2rem] p-16 text-center max-w-xl mx-auto shadow-sm">
                <Filter className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="font-black text-xl text-slate-900 mb-2">Aucun véhicule ne correspond</h3>
                <p className="text-slate-500 font-medium text-xs mb-6">Essayez de modifier votre recherche ou d'effacer les filtres.</p>
                <button
                  onClick={() => {
                    setFleetSearchQuery('');
                    setFleetCategoryFilter('All');
                    setFleetStatusFilter('All');
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Réinitialiser les filtres</span>
                </button>
              </div>
            ) : fleetViewMode === 'table' ? (
              <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('vehicle')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('category')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('specifications')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('pricingTiersAndDiscounts')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('status')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('actions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVehicles.map((vehicle: any) => (
                        <tr key={vehicle._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 flex items-center gap-4">
                            <img src={vehicle.images?.[0] || 'https://via.placeholder.com/100x80'} alt="" className="w-16 h-12 rounded-lg object-cover shadow-sm border border-slate-100" />
                            <div>
                              <div className="font-black text-slate-900 flex items-center gap-2">
                                <BrandLogo brand={vehicle.make} size={18} />
                                <span>{vehicle.make} {vehicle.model}</span>
                              </div>
                              <div className="text-xs text-slate-400 font-bold mt-0.5">{vehicle.year} • {vehicle.subcategory || t('standard')}</div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-black text-slate-800 uppercase tracking-wider">{vehicle.category}</td>
                          <td className="px-8 py-6 text-xs font-semibold text-slate-500 leading-relaxed">
                            {vehicle.features?.transmission && <div>{vehicle.features.transmission}</div>}
                            {vehicle.features?.fuel && <div>{vehicle.features.fuel}</div>}
                            {vehicle.features?.doors && <div>{vehicle.features.doors} {t('doorsLabel')}</div>}
                            {vehicle.features?.horsepower && <div>{vehicle.features.horsepower} HP</div>}
                          </td>
                          <td className="px-8 py-6 text-sm">
                            <div className="font-bold text-slate-800">
                              {vehicle.pricePerDay ? `${vehicle.pricePerDay.toLocaleString(locale)} DA / ${t('perDay')}` : ''}
                              {vehicle.pricePerHalfDay ? ` | ${vehicle.pricePerHalfDay.toLocaleString(locale)} DA / 12h` : ''}
                              {vehicle.pricePerHour ? ` | ${vehicle.pricePerHour.toLocaleString(locale)} DA / ${t('perHr')}` : ''}
                            </div>
                            {vehicle.discount?.percentage > 0 && (
                              <div className="text-xs font-black text-red-500 mt-1">-{vehicle.discount.percentage}% {vehicle.discount.label}</div>
                            )}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border shadow-sm ${
                              vehicle.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                              vehicle.status === 'Rented' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                vehicle.status === 'Available' ? 'bg-green-500' :
                                vehicle.status === 'Rented' ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}></span>
                              {t(vehicle.status?.toLowerCase()) || vehicle.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => openEditModal(vehicle)} className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 hover:border-indigo-200" title={t('editVehicle')}><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteVehicle(vehicle._id)} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-all border border-slate-200 hover:border-red-200" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map((vehicle: any) => (
                  <div key={vehicle._id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 group flex flex-col relative">
                    {/* Action Buttons overlay */}
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <button onClick={() => openEditModal(vehicle)} className="w-8 h-8 bg-white/90 backdrop-blur text-slate-700 hover:text-indigo-600 rounded-lg flex items-center justify-center shadow-md hover:scale-105 transition-all" title={t('editVehicle')}><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteVehicle(vehicle._id)} className="w-8 h-8 bg-white/90 backdrop-blur text-slate-700 hover:text-red-600 rounded-lg flex items-center justify-center shadow-md hover:scale-105 transition-all" title={t('delete')}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>

                    {/* Image Section */}
                    <div className="relative h-56 bg-slate-100 overflow-hidden">
                      <img 
                        src={vehicle.images?.[0] || 'https://via.placeholder.com/400x300'} 
                        alt={`${vehicle.make} ${vehicle.model}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm">
                          {vehicle.category}
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-sm text-center ${
                          vehicle.status === 'Available' ? 'bg-green-500 text-white' :
                          vehicle.status === 'Rented' ? 'bg-blue-500 text-white' :
                          'bg-amber-500 text-white'
                        }`}>
                          {t(vehicle.status?.toLowerCase()) || vehicle.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-6 flex flex-col flex-1 relative bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                            <BrandLogo brand={vehicle.make} size={22} />
                            <span>{vehicle.make} {vehicle.model}</span>
                          </h3>
                          <p className="text-sm font-bold text-slate-400 mt-0.5">{vehicle.year} • {vehicle.subcategory || t('standard')}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-6">
                        {vehicle.features?.transmission && <span className="bg-slate-100 px-2 py-1 rounded-md">{vehicle.features.transmission}</span>}
                        {vehicle.features?.fuel && <span className="bg-slate-100 px-2 py-1 rounded-md">{vehicle.features.fuel}</span>}
                        {vehicle.features?.doors && <span className="bg-slate-100 px-2 py-1 rounded-md">{vehicle.features.doors} {t('doorsLabel')}</span>}
                      </div>
                      
                      <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="font-black text-slate-900 text-2xl tracking-tighter">
                          {vehicle.pricePerDay ? (
                            <>{vehicle.pricePerDay.toLocaleString('fr-DZ')}<span className="text-xs text-slate-400 font-bold tracking-normal ml-1">DA/{t('perDay')}</span></>
                          ) : (
                            <>{vehicle.pricePerHour.toLocaleString('fr-DZ')}<span className="text-xs text-slate-400 font-bold tracking-normal ml-1">DA/{t('perHr')}</span></>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Categories Manager (Admin Only) */}
      {activeTab === 'categories' && role === 'Admin' && (
        <CategoriesTab 
          token={token!} 
          categories={categoriesData} 
          refreshCategories={fetchCategories} 
        />
      )}

      {/* TAB 4: Messages (Admin Only) */}
      {activeTab === 'messages' && role === 'Admin' && (
        <MessagesTab onUnreadCountChange={setUnreadCount} />
      )}

      {/* TAB 5: Settings (Admin Only) */}
      {activeTab === 'settings' && role === 'Admin' && (
        <SettingsTab />
      )}

      {/* TAB 7: Extra Options (Admin Only) */}
      {activeTab === 'options' && role === 'Admin' && (
        <ExtraOptionsTab />
      )}

      {/* TAB 6: Clients Database (Admin Only) */}
      {activeTab === 'clients' && role === 'Admin' && (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" /> {t('clientsDatabase')}
            </h3>
            <button
              onClick={exportClientsToCSV}
              className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20 text-sm"
            >
              <Database className="w-4 h-4" /> {t('exportExcel')}
            </button>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('fullName')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('emailAddress')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('phoneNumber')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('totalBookings')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('totalSpentLabel')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('lastRentalDateLabel')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-24 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <span className="text-slate-500 font-bold text-sm tracking-wide">Loading clients...</span>
                      </td>
                    </tr>
                  ) : uniqueClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <span className="text-slate-500 font-bold block mb-1">{t('noClientsFound')}</span>
                      </td>
                    </tr>
                  ) : (
                    uniqueClients.map((client: any) => (
                      <tr key={client.email} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6 font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {client.name}
                        </td>
                        <td className="px-8 py-6 font-bold text-slate-600">
                          {client.email}
                        </td>
                        <td className="px-8 py-6 text-sm font-semibold text-slate-600">
                          {client.phone}
                        </td>
                        <td className="px-8 py-6 text-center font-bold text-slate-800 text-lg">
                          {client.totalBookings}
                        </td>
                        <td className="px-8 py-6 font-black text-slate-900 text-right text-lg">
                          {client.totalSpent ? `${client.totalSpent.toLocaleString('fr-DZ')} DA` : `0 DA`}
                        </td>
                        <td className="px-8 py-6 text-sm font-medium text-slate-600">
                          {client.lastRentalDate ? new Date(client.lastRentalDate).toLocaleDateString(locale, {month:'short', day:'numeric', year:'numeric'}) : 'N/A'}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border shadow-sm ${
                            client.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {client.status === 'Active' ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

            </div> {/* End Scrollable Tab Content */}
      </main> {/* End Main Content Area */}

      {/* CRUD Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 md:p-10 relative animate-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center justify-center absolute right-6 top-6 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-8 pb-4 border-b border-slate-100">
              {editingVehicle ? t('editVehicle') : t('addVehicle')}
            </h3>

            <form onSubmit={handleSaveVehicle} className="space-y-6">
              
              {/* API Auto-fill Search Widget (carsdataset.com) */}
              <div className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-indigo-500/30 text-white shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                      Remplissage Auto via Base Mondiale (carsdataset.com API)
                    </span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold">
                    54 000+ Modèles
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-indigo-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tapez une marque (ex: BMW, Dacia, Porsche, Renault, Tesla)..."
                    value={apiSearchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setApiSearchQuery(val);
                      setShowApiDropdown(true);
                      searchCarsApi(val);
                    }}
                    onFocus={() => {
                      if (apiSearchQuery.trim().length >= 2) {
                        setShowApiDropdown(true);
                        searchCarsApi(apiSearchQuery);
                      }
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-8 py-3 text-xs font-bold text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all"
                  />
                  {apiSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setApiSearchQuery('');
                        setShowApiDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* API Dropdown Results */}
                {showApiDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto p-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                    {loadingApiSuggestions ? (
                      <div className="p-4 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-400 border-t-transparent"></div>
                        <span>Recherche dans la base mondiale carsdataset...</span>
                      </div>
                    ) : apiSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-xs font-bold text-slate-400">
                        {apiSearchQuery.length < 2 ? 'Saisissez au moins 2 caractères...' : 'Aucun modèle correspondant trouvé.'}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider px-3 py-1 border-b border-white/10">
                          Cliquez sur un modèle pour auto-remplir la fiche :
                        </div>
                        {apiSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => applyCarsApiSuggestion(item)}
                            className="p-3 hover:bg-white/10 rounded-xl cursor-pointer transition-colors flex items-center justify-between group border border-transparent hover:border-indigo-400/30"
                          >
                            <div className="flex items-center gap-3">
                              <BrandLogo brand={item.brand} size={20} />
                              <div>
                                <div className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
                                  {item.brand} {item.model} <span className="text-slate-400 text-[11px] font-normal">{item.trim}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-2 mt-0.5">
                                  {item.segment && <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px]">{item.segment}</span>}
                                  {item.fuel_type && <span className="capitalize">{item.fuel_type}</span>}
                                  {item.transmission_type && <span className="capitalize">{item.transmission_type}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {item.power_hp && (
                                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-lg text-[10px] font-black">
                                  ⚡ {item.power_hp} HP
                                </span>
                              )}
                              {item.year && (
                                <span className="block text-[10px] text-slate-400 font-bold mt-0.5">
                                  {item.year}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t('make')}</label>
                    {make && (
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700">
                        <BrandLogo brand={make} size={16} />
                        <span>{make}</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="text" required
                    placeholder="e.g. Mercedes-Benz, Porsche, BMW..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all mb-2.5"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                  />

                  {/* Popular Brand Fast-Select Chips */}
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full px-1 pt-1">Marques Populaires:</span>
                    {POPULAR_BRANDS.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setMake(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all border flex items-center gap-1.5 cursor-pointer ${
                          make.toLowerCase().trim() === b.toLowerCase().trim()
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <BrandLogo brand={b} size={14} />
                        <span>{b}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('model')}</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('year')}</label>
                  <input 
                    type="number" required min={1900} max={2026}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('category')}</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSubcategory(''); // Reset subcategory when category changes
                    }}
                  >
                    {categoriesData.length > 0 ? categoriesData.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    )) : (
                      <>
                        <option value="Car">{t('cars') || 'Car'}</option>
                        <option value="Motorcycle">{t('motorcycles') || 'Motorcycle'}</option>
                        <option value="JetSki">{t('jetskis') || 'Jet Ski'}</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('subcategoryLabel') || 'Subcategory'}</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                  >
                    <option value="">{t('none') || 'None'}</option>
                    {categoriesData.find(c => c.name === category)?.subcategories?.map((sub: string) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('status') || 'Status'}</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                    value={vehicleStatus}
                    onChange={(e) => setVehicleStatus(e.target.value as any)}
                  >
                    <option value="Available">{t('available') || 'Available'}</option>
                    <option value="Rented">{t('rented') || 'Rented'}</option>
                    <option value="Maintenance">{t('maintenance') || 'Maintenance'}</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Discounts Section */}
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/60 space-y-6">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" /> Pricing Tiers & Discounts
                </h4>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Price per Hour (DA)</label>
                    <input 
                      type="number" min={0}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(Number(e.target.value))}
                      placeholder="e.g. 1000 (0 to disable)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Price per Half-Day (12h) (DA)</label>
                    <input 
                      type="number" min={0}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                      value={pricePerHalfDay}
                      onChange={(e) => setPricePerHalfDay(Number(e.target.value))}
                      placeholder="e.g. 8000 (0 to disable)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Price per Day (24h) (DA)</label>
                    <input 
                      type="number" min={0}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(Number(e.target.value))}
                      placeholder="e.g. 15000 (0 to disable)"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Discount Percentage (%)</label>
                    <input 
                      type="number" min={0} max={100}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                      placeholder="e.g. 15 (0 for no discount)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Discount Label</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                      value={discountLabel}
                      onChange={(e) => setDiscountLabel(e.target.value)}
                      placeholder="e.g. Summer Special"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Vehicle description (supports text)"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Requirements</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all min-h-[80px]"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="e.g. Valid Driver's License, 21+ Years Old"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Conditions</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all min-h-[80px]"
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                      placeholder="e.g. No smoking, Return with full tank"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Landing Image (For Description section)
                  </label>
                  
                  {landingImage ? (
                    <div className="w-full h-auto min-h-[160px] rounded-2xl overflow-hidden bg-slate-50 relative border border-slate-200 shadow-inner group">
                      <img src={landingImage} alt="Preview" className="w-full h-auto rounded-xl block" />
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-300">
                        <div className="relative bg-white/90 backdrop-blur-md hover:bg-blue-600 text-slate-850 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all duration-300 cursor-pointer scale-95 group-hover:scale-100">
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={triggerCropForLanding}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            disabled={uploadingLandingImage}
                          />
                          {uploadingLandingImage ? 'Uploading...' : 'Change Image'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setLandingImage('')}
                          className="bg-rose-600/90 backdrop-blur-md hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all duration-300 cursor-pointer scale-95 group-hover:scale-100 z-10"
                          title="Remove Landing Image"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all rounded-2xl relative flex flex-col items-center justify-center gap-3 group cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={triggerCropForLanding}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={uploadingLandingImage}
                      />
                      {uploadingLandingImage ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent shrink-0"></div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider animate-pulse">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                            <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <p className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                            Click or drag to upload landing image
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>



              {/* Caution and Chauffeur Options */}
              <div className="bg-slate-50 border border-slate-205 rounded-2xl p-6 space-y-4">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  🪙 Security deposit & Driver options
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      Security Deposit (Caution / Price) (DA)
                    </label>
                    <input 
                      type="number" min={0}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-slate-900 transition-all"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="e.g. 50000 (Keep empty for optional/none)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Chauffeur Service</label>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-305"
                          checked={driverAvailable}
                          onChange={(e) => setDriverAvailable(e.target.checked)}
                        />
                        <span className="text-xs font-bold text-slate-700">Driver Service Available</span>
                      </label>
                      {driverAvailable && (
                        <div className="pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                            Driver Price per Day (DA)
                          </label>
                          <input 
                            type="number" min={0}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                            value={driverPricePerDay}
                            onChange={(e) => setDriverPricePerDay(Number(e.target.value))}
                            placeholder="e.g. 5000"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Unavailability Dates Management */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-red-500" /> Blocked Dates
                </h4>
                
                {unavailabilityDates.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {unavailabilityDates.map((date, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-sm font-bold text-slate-700">
                          {new Date(date.start).toLocaleDateString()} &rarr; {new Date(date.end).toLocaleDateString()}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setUnavailabilityDates(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
                    <input type="date" id="block-start" className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</label>
                    <input type="date" id="block-end" className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const start = (document.getElementById('block-start') as HTMLInputElement).value;
                      const end = (document.getElementById('block-end') as HTMLInputElement).value;
                      if (start && end) {
                        setUnavailabilityDates(prev => [...prev, { start, end }]);
                        (document.getElementById('block-start') as HTMLInputElement).value = '';
                        (document.getElementById('block-end') as HTMLInputElement).value = '';
                      }
                    }}
                    className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-3 rounded-xl font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Premium Image Direct Upload Zone */}
              {/* Premium Image Direct Upload Zone */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>Photos du véhicule (1 à 10 images)</span>
                  <span className="text-slate-400 font-bold">{imagesList.length}/10</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {imagesList.map((imgUrl, idx) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                      <img src={imgUrl} alt={`Vehicle ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      
                      {/* Top indicator badge */}
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center border border-white/10 shadow-sm">
                        {idx + 1}
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setImagesList(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {imagesList.length < 10 && (
                    <div className="relative aspect-[4/3] bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-100/50 hover:border-blue-500/50 group p-4">
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={triggerCropForVehicle}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        disabled={uploadingImage}
                      />
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        {uploadingImage ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-800 border-t-transparent shrink-0"></div>
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </div>
                      <span className="font-extrabold text-xs text-slate-800 text-center">
                        {uploadingImage ? 'Téléchargement...' : 'Ajouter une photo'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <span>Formats acceptés : PNG, JPG, JPEG, WEBP. Taille max : 5 Mo.</span>
                </div>
              </div>

              {/* Dynamic specs options depending on Category */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Layers className="w-4 h-4 text-blue-600" /> Specifications</h4>
                
                {category === 'Car' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('doors')}</label>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none font-bold" value={doors} onChange={(e) => setDoors(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('transmission')}</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none font-bold" value={transmission} onChange={(e) => setTransmission(e.target.value as any)}>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('fuelType')}</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none font-bold" value={fuel} onChange={(e) => setFuel(e.target.value as any)}>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                )}

                {category === 'Motorcycle' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('cc')}</label>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none font-bold" value={cc} onChange={(e) => setCc(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('transmission')}</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none font-bold" value={transmission} onChange={(e) => setTransmission(e.target.value as any)}>
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                      </select>
                    </div>
                  </div>
                )}

                {category === 'JetSki' && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('horsepower')}</label>
                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none font-bold" value={horsepower} onChange={(e) => setHorsepower(Number(e.target.value))} />
                  </div>
                )}

              </div>

              <div className="flex gap-4 pt-4 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/10 transition-all flex items-center gap-2"
                >
                  <Check className="w-5 h-5" /> {t('save')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300 scrollbar-hide">

            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 p-8 z-10 flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-indigo-600" /> {editingBooking ? t('editReservation') || 'Edit Reservation' : t('newReservation') || 'New Reservation'}
              </h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-8">
              <form onSubmit={handleSaveBooking} className="space-y-6">

                {/* Guest Info */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-600" /> {t('guestInformation')}</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('fullNameLabel')}</label>
                      <input type="text" required value={bookingForm.guestName} onChange={(e) => setBookingForm({...bookingForm, guestName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('phoneLabel')}</label>
                      <input type="tel" required value={bookingForm.guestPhone} onChange={(e) => setBookingForm({...bookingForm, guestPhone: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('emailLabel')}</label>
                    <input type="email" required value={bookingForm.guestEmail} onChange={(e) => setBookingForm({...bookingForm, guestEmail: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all" />
                  </div>
                </div>

                {/* Vehicle & Schedule */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Car className="w-4 h-4 text-indigo-600" /> {t('vehicleAndSchedule')}</h4>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('vehicleLabel')}</label>
                    <select required value={bookingForm.vehicleId} onChange={(e) => setBookingForm({...bookingForm, vehicleId: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all">
                      <option value="">{t('selectVehicle') || 'Select a vehicle'}</option>
                      {vehicles.map((v: any) => (
                        <option key={v._id} value={v._id}>{v.make} {v.model} ({v.year}) — {v.category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('rentalDurationTypeLabel') || 'Rental Duration Type *'}</label>
                      <select required value={bookingForm.rentalType} onChange={(e) => setBookingForm({...bookingForm, rentalType: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all">
                        <option value="hour">{t('hour') || 'Hour'}</option>
                        <option value="halfDay">{t('halfDayLabel') || 'Half Day (12h)'}</option>
                        <option value="day">{t('dayLabel') || 'Day (24h)'}</option>
                      </select>
                    </div>
                    {editingBooking && (
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('status') || 'Status'}</label>
                        <select required value={bookingForm.bookingStatus} onChange={(e) => setBookingForm({...bookingForm, bookingStatus: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all">
                          <option value="Pending">{t('pending') || 'Pending'}</option>
                          <option value="Confirmed">{t('confirmed') || 'Confirmed'}</option>
                          <option value="Completed">{t('completed') || 'Completed'}</option>
                          <option value="Cancelled">{t('cancelled') || 'Cancelled'}</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('pickupDateTime')}</label>
                      <input type="datetime-local" required value={bookingForm.pickupDate} onChange={(e) => setBookingForm({...bookingForm, pickupDate: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('returnDateTime')}</label>
                      <input type="datetime-local" required value={bookingForm.returnDate} onChange={(e) => setBookingForm({...bookingForm, returnDate: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{t('pickupLocationLabel')}</label>
                    <input type="text" required value={bookingForm.pickupLocation} onChange={(e) => setBookingForm({...bookingForm, pickupLocation: e.target.value})}
                      placeholder={t('pickupLocationPlaceholder') || 'e.g. Aéroport d\'Alger'} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-900 transition-all" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-2 justify-end">
                  <button type="button" onClick={() => setIsBookingModalOpen(false)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={savingBooking} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50">
                    <Check className="w-5 h-5" /> {savingBooking ? (editingBooking ? (t('updating') || 'Updating...') : (t('creating') || 'Creating...')) : (editingBooking ? (t('updateBooking') || 'Update Booking') : (t('createBooking') || 'Create Booking'))}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {activeCropFile && (
        <ImageCropperModal 
          file={activeCropFile}
          aspectRatio={cropTarget === 'landing' ? 'landing' : '4:3'}
          onCancel={() => {
            setActiveCropFile(null);
            setCropTarget(null);
          }}
          onCrop={async (croppedFile) => {
            setActiveCropFile(null);
            if (cropTarget === 'vehicle') {
              await performImageUpload(croppedFile);
            } else if (cropTarget === 'landing') {
              await performLandingImageUpload(croppedFile);
            }
            setCropTarget(null);
          }}
        />
      )}
    </div>
  );
}
