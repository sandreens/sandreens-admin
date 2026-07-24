import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, X, ChevronLeft, Save } from 'lucide-react';

const SIZES = ['10','12','14','16','18','20','22','24','26','28','30','32'];
const BADGES = ['', 'New In', 'Sale', '40% OFF', '60% OFF'];
const BRANDS = ['Sandreens', 'MANGO', "Levi's", 'adidas', 'Nike', 'New Balance', 'Yours', 'Boohoo', 'ASOS Curve'];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', description: '', price: '', salePrice: '',
    badge: '', category: '', subcategory: '', brand: '', inStock: true, stock: 0,
    sizes: [], isTrending: false,
    sku: '', dimensions: '', materials: '', careInstructions: ''
  });
  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [availableNumberSizes, setAvailableNumberSizes] = useState([]);
  const [availableLetterSizes, setAvailableLetterSizes] = useState([]);

  useEffect(() => {
    api.get('/categories')
      .then(res => {
        setCategoriesList(res.data.filter(c => c.type === 'product'));
        setBrandsList(res.data.filter(c => c.type === 'brand'));
      })
      .catch(() => toast.error('Failed to load categories'));

    api.get('/settings')
      .then(res => {
        if (res.data) {
          setAvailableNumberSizes(res.data.numberSizes || []);
          setAvailableLetterSizes(res.data.letterSizes || []);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data;
        setForm({
          name: p.name, description: p.description,
          price: p.price, salePrice: p.salePrice || '',
          badge: p.badge || '', category: p.category,
          subcategory: p.subcategory || '',
          brand: p.brand || '', inStock: p.inStock,
          stock: p.stock, sizes: p.sizes || [],
          isTrending: p.isTrending || false,
          sku: p.sku || '',
          dimensions: p.dimensions || '',
          materials: p.materials || '',
          careInstructions: p.careInstructions ? p.careInstructions.join('\n') : ''
        });
        setExistingImages(p.images || (p.imageUrl ? [p.imageUrl] : []));
      }).catch(() => toast.error('Failed to load product'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const mainCategories = categoriesList.filter(c => !c.parentCategory);
  const selectedCatObj = categoriesList.find(c => c.name === form.category);
  const subCategories = selectedCatObj
    ? categoriesList.filter(c => c.parentCategory && (c.parentCategory._id === selectedCatObj._id || c.parentCategory === selectedCatObj._id || c.parentCategory.name === selectedCatObj.name))
    : [];
  const allBrands = brandsList.length > 0 ? brandsList.map(b => b.name) : BRANDS;

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...dropped].slice(0, 8));
  }, []);

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExistingImage = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));

  const toggleSize = (size) => {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'sizes') {
        v.forEach(s => data.append('sizes', s));
      } else if (k === 'careInstructions') {
        const careArr = v.split('\n').map(l => l.trim()).filter(Boolean);
        careArr.forEach(item => data.append('careInstructions', item));
      } else {
        data.append(k, v);
      }
    });
    files.forEach(f => data.append('images', f));
    if (isEdit) {
      if (existingImages.length === 0) {
        data.append('existingImages', '');
      } else {
        existingImages.forEach(img => data.append('existingImages', img));
      }
    }

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created!');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 overflow-auto">
      <Header title={isEdit ? 'Edit Product' : 'Add Product'} />
      <main className="p-6 max-w-4xl mx-auto">
        <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black font-semibold mb-5 transition-colors">
          <ChevronLeft size={16} /> Back to Products
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <h3 className="font-bold text-gray-900 pb-2 border-b">Basic Information</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Title *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Floral Wrap Midi Dress"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
                  <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={4} placeholder="Product description..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base Price (£) *</label>
                    <input required type="number" step="0.01" min="0" value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sale Price (£)</label>
                    <input type="number" step="0.01" min="0" value={form.salePrice}
                      onChange={e => setForm({ ...form, salePrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                </div>
              </div>

              {/* Sizes */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 pb-2 border-b mb-4">Plus-Size Matrix (UK)</h3>
                
                {availableNumberSizes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Number Sizes</h4>
                    <div className="grid grid-cols-6 gap-2">
                      {availableNumberSizes.map(size => (
                        <button
                          key={size} type="button"
                          onClick={() => toggleSize(size)}
                          className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                            form.sizes.includes(size)
                              ? 'bg-[#111] text-white border-[#111]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableLetterSizes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Letter Sizes</h4>
                    <div className="grid grid-cols-6 gap-2">
                      {availableLetterSizes.map(size => (
                        <button
                          key={size} type="button"
                          onClick={() => toggleSize(size)}
                          className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                            form.sizes.includes(size)
                              ? 'bg-[#111] text-white border-[#111]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableNumberSizes.length === 0 && availableLetterSizes.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No sizes configured in settings.</p>
                )}
              </div>

              {/* Specifications & Care */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <h3 className="font-bold text-gray-900 pb-2 border-b">Specifications & Care Instructions</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Code (SKU)</label>
                    <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                      placeholder="e.g. SB-COTTON-092"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dimensions</label>
                    <input value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })}
                      placeholder="e.g. Length: 28in / 71cm"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Materials</label>
                  <input value={form.materials} onChange={e => setForm({ ...form, materials: e.target.value })}
                    placeholder="e.g. 100% Cotton"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Care Instructions (One per line)</label>
                  <textarea value={form.careInstructions} onChange={e => setForm({ ...form, careInstructions: e.target.value })}
                    rows={4} placeholder="e.g.&#10;Machine washable&#10;Do not bleach&#10;Do not tumble dry"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 resize-none" />
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 pb-2 border-b mb-4">Product Images</h3>

                {/* Existing images */}
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {existingImages.map((img, i) => (
                      <div key={i} className="relative w-20 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">Saved</span>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragOver ? 'border-[#111] bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-semibold">Drag & drop images here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse • JPG, PNG, WebP • Max 8 images</p>
                  <p className="text-[10px] text-gray-400 mt-1">Recommended: 1000x1200 px (5:6) • Max size: 5MB per image</p>
                  <input id="file-input" type="file" multiple accept="image/*" className="hidden"
                    onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)].slice(0, 8))} />
                </div>

                {/* Preview new files */}
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {files.map((f, i) => (
                      <div key={i} className="relative w-20 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <h3 className="font-bold text-gray-900 pb-2 border-b">Organisation</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                  <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value, subcategory: '' })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white">
                    <option value="">Select category</option>
                    {mainCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                {subCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subcategory *</label>
                    <select required value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white">
                      <option value="">Select subcategory</option>
                      {subCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand</label>
                  <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white">
                    <option value="">No brand</option>
                    {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Badge</label>
                  <select value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white">
                    {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Qty</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-semibold text-gray-700">In Stock</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, inStock: !form.inStock })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.inStock ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.inStock ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Trending</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Show in homepage Trending section</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isTrending: !form.isTrending })}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.isTrending ? 'bg-[#ffd500]' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isTrending ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#111] text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-60"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={16} /> {isEdit ? 'Update Product' : 'Create Product'}</>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
