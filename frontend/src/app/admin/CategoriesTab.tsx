import React, { useState } from 'react';
import { Layers, Plus, Trash2, Edit3, Eye, EyeOff, Save, X, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  name_fr?: string;
  name_ar?: string;
  isVisible: boolean;
  subcategories: string[];
  subcategories_fr?: string[];
  subcategories_ar?: string[];
}

interface CategoriesTabProps {
  categories: Category[];
  refreshCategories: () => Promise<void>;
  token: string | null;
}

export default function CategoriesTab({ categories, refreshCategories, token }: CategoriesTabProps) {
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editSubcategories, setEditSubcategories] = useState<string[]>([]);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');

  // Add Form State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');

  const toggleVisibility = async (categoryId: string, currentVisibility: boolean) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isVisible: !currentVisibility })
      });
      if (res.ok) {
        refreshCategories();
      } else {
        toast.error(t('failedToggleVisibility') || 'Failed to toggle visibility');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const isConfirmed = await confirm(t('deleteCategoryConfirm') || 'Delete this category?');
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        refreshCategories();
      } else {
        toast.error(t('failedDeleteCategory') || 'Failed to delete category');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startEditing = (category: Category) => {
    setIsEditing(category._id);
    setEditName(category.name);
    setEditSubcategories([...category.subcategories]);
    setNewSubcategoryInput('');
  };

  const cancelEditing = () => {
    setIsEditing(null);
  };

  const saveEdit = async (categoryId: string) => {
    if (!editName) return toast.error(t('categoryNameRequired') || 'Name is required');
    try {
      setLoading(true);
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: editName, subcategories: editSubcategories })
      });
      if (res.ok) {
        setIsEditing(null);
        refreshCategories();
        toast.success('Category updated successfully');
      } else {
        toast.error(t('failedSaveCategory') || 'Failed to save category');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveNew = async () => {
    if (!newName) return toast.error(t('categoryNameRequired') || 'Name is required');
    try {
      setLoading(true);
      const res = await fetch(`/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newName, isVisible: true, subcategories: [] })
      });
      if (res.ok) {
        setIsAddingNew(false);
        setNewName('');
        refreshCategories();
        toast.success('Category created successfully');
      } else {
        toast.error(t('failedCreateCategory') || 'Failed to create category');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubcategoryInput.trim() && !editSubcategories.includes(newSubcategoryInput.trim())) {
      setEditSubcategories([...editSubcategories, newSubcategoryInput.trim()]);
      setNewSubcategoryInput('');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" /> {t('categories')}
        </h2>
        <button 
          onClick={() => { setIsAddingNew(true); setIsEditing(null); }}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/10"
        >
          <Plus className="w-5 h-5" /> {t('addCategory') || 'Add Category'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Add New Form */}
        {isAddingNew && (
          <div className="bg-white border border-indigo-200 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('newCategoryName')}</label>
              <input 
                type="text" 
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-4 focus:ring-indigo-100 font-bold"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('categoryPlaceholder') || "e.g. SUV, Yacht..."}
              />
            </div>
            <div className="flex gap-2 self-end">
              <button 
                onClick={saveNew}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> {t('save')}
              </button>
              <button 
                onClick={() => setIsAddingNew(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Categories List */}
        {categories.map(category => (
          <div key={category._id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm transition-all hover:shadow-md">
            
            {isEditing === category._id ? (
              // Edit Mode
              <div className="p-6 md:p-8 bg-indigo-50/30 border-l-4 border-indigo-500">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-full max-w-sm">
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('categoryName')}</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:ring-4 focus:ring-indigo-100 font-black text-xl"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => saveEdit(category._id)}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> {t('saveChanges')}
                    </button>
                    <button 
                      onClick={cancelEditing}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-xl font-bold transition-all"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-extrabold text-sm text-slate-800 mb-4">{t('subcategories')}</h4>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {editSubcategories.length === 0 ? (
                      <span className="text-sm text-slate-400 font-semibold italic">{t('noSubcategories')}</span>
                    ) : (
                      editSubcategories.map(sub => (
                        <div key={sub} className="bg-slate-100 border border-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                          {sub}
                          <button 
                            onClick={() => setEditSubcategories(prev => prev.filter(s => s !== sub))}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={addSubcategory} className="flex gap-3 max-w-md">
                    <input 
                      type="text" 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100 font-semibold text-sm"
                      value={newSubcategoryInput}
                      onChange={(e) => setNewSubcategoryInput(e.target.value)}
                      placeholder={t('addSubcategoryPlaceholder') || "Add new subcategory..."}
                    />
                    <button type="submit" className="bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-xl font-bold text-sm">
                      {t('add')}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-2xl font-black text-slate-900">
                      {category.name_fr || category.name}
                    </h3>
                    <button 
                      onClick={() => toggleVisibility(category._id, category.isVisible)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                        category.isVisible 
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title="Toggle Visibility on Public Site"
                    >
                      {category.isVisible ? <><Eye className="w-3.5 h-3.5" /> {t('visible')}</> : <><EyeOff className="w-3.5 h-3.5" /> {t('hidden')}</>}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mr-2">{t('subcategories')}:</span>
                    {category.subcategories.length === 0 ? (
                      <span className="text-sm font-semibold text-slate-500 italic">{t('none')}</span>
                    ) : (
                      category.subcategories.map((sub, idx) => {
                        const subDisp = (category as any).subcategories_fr?.[idx] || sub;
                        return (
                          <span key={sub} className="bg-slate-50 border border-slate-200 text-slate-600 font-bold px-3 py-1 rounded-lg text-xs">
                            {subDisp}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button 
                    onClick={() => startEditing(category)}
                    className="w-10 h-10 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-colors"
                    title="Edit Category"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => deleteCategory(category._id)}
                    className="w-10 h-10 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl flex items-center justify-center transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}
            
          </div>
        ))}
        
        {categories.length === 0 && !isAddingNew && (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-[2rem] p-16 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <span className="text-slate-500 font-bold block mb-1">{t('noCategoriesFound') || 'No categories found.'}</span>
            <button onClick={() => setIsAddingNew(true)} className="text-indigo-600 font-bold hover:underline mt-2">{t('createFirstCategory') || 'Create the first category'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
