import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Power, Layers } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

export default function ExtraOptionsTab() {
  const { t } = useLanguage();
  const { token } = useAuth();
  const { confirm } = useConfirm();
  
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  
  // Form States
  const [name, setName] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [price, setPrice] = useState(0);
  const [priceType, setPriceType] = useState('flat_rate');
  const [applicableTo, setApplicableTo] = useState('All');
  const [category, setCategory] = useState('Car');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/extra-options');
      if (res.ok) {
        setOptions(await res.json());
      }
    } catch (err) {
      console.error('Error fetching extra options:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        setVehicles(await res.json());
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setEditingOption(null);
    setName('');
    setNameFr('');
    setPrice(0);
    setPriceType('flat_rate');
    setApplicableTo('All');
    setCategory('Car');
    setVehicleId('');
    setIsModalOpen(true);
  };

  const openEditModal = (opt: any) => {
    setEditingOption(opt);
    setName(opt.name || '');
    setNameFr(opt.name_fr || '');
    setPrice(opt.price);
    setPriceType(opt.priceType || 'flat_rate');
    setApplicableTo(opt.applicableTo);
    setCategory(opt.category || 'Car');
    setVehicleId(opt.vehicleId?._id || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name,
      name_fr: nameFr || name,
      price,
      priceType,
      applicableTo,
      category: applicableTo === 'Category' ? category : undefined,
      vehicleId: applicableTo === 'Vehicle' ? vehicleId : undefined,
    };

    try {
      const url = editingOption ? `/api/extra-options/${editingOption._id}` : '/api/extra-options';
      const method = editingOption ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchOptions();
        toast.success('Option saved successfully');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save extra option.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving extra option.');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm('Are you sure you want to delete this option?');
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/extra-options/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        fetchOptions();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to delete extra option.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/extra-options/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        fetchOptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('extraOptionsTitle')}</h3>
          <p className="text-sm font-bold text-slate-500 mt-1">{t('extraOptionsSubtitle')}</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" /> {t('addNewOption')}
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('optionName')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('price')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('bindingRule')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('status')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500 font-bold">{t('loadingOptions')}</td></tr>
              ) : options.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <span className="text-slate-500 font-bold">{t('noExtraOptionsFound')}</span>
                  </td>
                </tr>
              ) : (
                options.map((opt) => {
                  const optDisplayName = opt.name_fr || opt.name;
                  return (
                    <tr key={opt._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 font-black text-slate-900">{optDisplayName}</td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800">{opt.price} DA</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{opt.priceType === 'per_day' ? t('pricedPerDay') : t('flatRateLabel')}</div>
                      </td>
                      <td className="px-8 py-5">
                        {opt.applicableTo === 'All' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">{t('globalAll')}</span>}
                        {opt.applicableTo === 'Category' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700">{t('categoryRule')}: {opt.category}</span>}
                        {opt.applicableTo === 'Vehicle' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700">{t('vehicleRule')}: {opt.vehicleId ? `${opt.vehicleId.make} ${opt.vehicleId.model}` : 'Unknown'}</span>}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => handleToggleStatus(opt._id, opt.isActive)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${opt.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                          <Power className="w-3.5 h-3.5" /> {opt.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                        </button>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button onClick={() => openEditModal(opt)} className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 hover:border-indigo-200 mr-2">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(opt._id)} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-all border border-slate-200 hover:border-red-200">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">{editingOption ? t('editOption') : t('newExtraOption')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Option Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 outline-none font-bold text-slate-900 transition-all" placeholder="e.g., Child Safety Seat / Siège Enfant" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('priceDa')}</label>
                  <input type="number" min="0" required value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 outline-none font-bold text-slate-900 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('priceType')}</label>
                  <select value={priceType} onChange={e => setPriceType(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 outline-none font-bold text-slate-900 transition-all">
                    <option value="flat_rate">{t('flatRateLabel')}</option>
                    <option value="per_day">{t('pricedPerDay')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('bindingRule')}</label>
                <select value={applicableTo} onChange={e => setApplicableTo(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 outline-none font-bold text-slate-900 transition-all">
                  <option value="All">{t('globalAll')}</option>
                  <option value="Category">{t('categoryRule')}</option>
                  <option value="Vehicle">{t('vehicleRule')}</option>
                </select>
              </div>

              {applicableTo === 'Category' && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('adminSelectCategory')}</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 outline-none font-bold text-slate-900 transition-all">
                    <option value="Car">{t('cars')}</option>
                    <option value="Motorcycle">{t('motorcycles')}</option>
                    <option value="JetSki">{t('jetskis')}</option>
                  </select>
                </div>
              )}

              {applicableTo === 'Vehicle' && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('adminSelectVehicle')}</label>
                  <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 outline-none font-bold text-slate-900 transition-all">
                    <option value="">{t('chooseVehicle')}</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.make} {v.model} ({v.year})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">{t('saveOption')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
