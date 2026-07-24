import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Image } from 'lucide-react';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'product', image: '', parentCategory: '' });
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories' + (typeFilter ? `?type=${typeFilter}` : ''));
      setCategories(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, [typeFilter]);

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({
      name: cat.name,
      type: cat.type,
      image: cat.image || '',
      parentCategory: cat.parentCategory?._id || cat.parentCategory || ''
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', type: 'product', image: '', parentCategory: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/categories/${editItem._id}`, form);
        toast.success('Updated!');
      } else {
        await api.post('/categories', form);
        toast.success('Created!');
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Categories & Brands" />
      <main className="p-6">
        {/* Toolbar */}
        <div className="flex gap-3 mb-6">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none">
            <option value="">All Types</option>
            <option value="product">Product Categories</option>
            <option value="brand">Brands</option>
          </select>
          <button onClick={openNew}
            className="ml-auto flex items-center gap-2 bg-[#111] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors">
            <Plus size={16} /> Add New
          </button>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-5">{editItem ? 'Edit' : 'Add'} Category / Brand</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dresses or Nike"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, parentCategory: e.target.value === 'brand' ? '' : form.parentCategory })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white">
                    <option value="product">Product Category</option>
                    <option value="brand">Brand</option>
                  </select>
                </div>
                {form.type === 'product' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parent Category (Optional)</label>
                    <select value={form.parentCategory || ''} onChange={e => setForm({ ...form, parentCategory: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white">
                      <option value="">None (Top-level Category)</option>
                      {categories.filter(c => c.type === 'product' && !c.parentCategory && (!editItem || c._id !== editItem._id)).map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image URL (Circular thumbnail)</label>
                  <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                  {form.image && (
                    <img src={form.image} alt="" className="mt-2 w-16 h-16 rounded-full object-cover border" />
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-[#111] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map(cat => (
              <div key={cat._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 mb-3 flex items-center justify-center">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image size={20} className="text-gray-300" />
                  )}
                </div>
                <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
                {cat.parentCategory && (
                  <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                    Subcategory of {cat.parentCategory.name || cat.parentCategory}
                  </p>
                )}
                <span className={`badge-pill mt-1.5 ${cat.type === 'brand' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.type}
                </span>
                <div className="flex gap-1 mt-3">
                  <button onClick={() => openEdit(cat)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat._id, cat.name)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
