import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Pencil, Upload, X } from 'lucide-react';

export default function PromoCardManager() {
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCard, setEditCard] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [highlight, setHighlight] = useState('');
  const [linkType, setLinkType] = useState('category');
  const [categoryLink, setCategoryLink] = useState('');
  const [productLink, setProductLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const fileRef = useRef();

  const defaultSlots = [
    { _id: 'left', position: 'left', title: 'Summer Essentials', subtitle: 'New Season', highlight: 'Up to 50% Off', imageUrl: '/promo_card1.png' },
    { _id: 'right-top', position: 'right-top', title: 'Be Unlimited', subtitle: 'Delivery Pass', highlight: 'Only £10.99/yr', imageUrl: '/promo_card_pay.png' },
    { _id: 'right-bottom', position: 'right-bottom', title: 'Denim Dreams', subtitle: 'Trending Styles', highlight: 'New Arrivals', imageUrl: '/woman_denim.png' }
  ];

  const mergeWithDefaults = (loadedCards) => {
    const positions = ['left', 'right-top', 'right-bottom'];
    return positions.map(pos => {
      const found = loadedCards.find(c => c.position === pos);
      return found || defaultSlots.find(d => d.position === pos);
    });
  };

  const fetchData = async () => {
    try {
      const [cardsRes, catsRes, prodsRes] = await Promise.all([
        api.get('/promo-cards'),
        api.get('/categories'),
        api.get('/products')
      ]);
      const loadedData = cardsRes.data;
      const cardList = Array.isArray(loadedData) ? loadedData : (loadedData?.cards || loadedData?.data || []);
      setCards(mergeWithDefaults(cardList));
      setCategories(catsRes.data.filter(c => c.type === 'product'));
      setProducts(prodsRes.data);
    } catch {
      toast.error('Failed to load CMS data');
      setCards(mergeWithDefaults([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = (card) => {
    setEditCard(card);
    setTitle(card.title || '');
    setSubtitle(card.subtitle || '');
    setHighlight(card.highlight || '');
    setLinkType(card.linkType || 'category');
    setCategoryLink(card.categoryLink || '');
    setProductLink(card.productLink?._id || card.productLink || '');
    setImagePreview(card.imageUrl || '');
    setImageFile(null);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Title is required');
    if (!imagePreview) return toast.error('Image is required');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('subtitle', subtitle.trim());
      fd.append('highlight', highlight.trim());
      fd.append('linkType', linkType);

      if (linkType === 'category') {
        fd.append('categoryLink', categoryLink);
      } else {
        fd.append('productLink', productLink);
      }

      if (imageFile) {
        fd.append('image', imageFile);
      } else {
        fd.append('imageUrl', editCard.imageUrl);
      }

      const res = await api.put(`/promo-cards/${editCard.position}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update local state
      setCards(prev => prev.map(c => c.position === editCard.position ? res.data : c));
      toast.success('Card updated!');
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group cards by position
  const leftCard = cards.find(c => c.position === 'left');
  const rightTopCard = cards.find(c => c.position === 'right-top');
  const rightBottomCard = cards.find(c => c.position === 'right-bottom');

  return (
    <div className="space-y-6">
      
      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-1">Not Be Missed Promo Grid Editor</h3>
        <p className="text-sm text-gray-500">Edit the 3 promotional banners shown in the "Not to be missed" grid. Click "Edit Card" on any slot to change its layout, text, labels, and redirect link.</p>
      </div>

      {/* Visual representation of grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        
        {/* Left Column: Left Slot (Tall) */}
        {leftCard && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[460px]">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Left Slot (Tall Card)</span>
              <button
                onClick={() => openEdit(leftCard)}
                className="text-xs flex items-center gap-1 bg-[#111] hover:bg-black text-white px-3 py-1.5 rounded-xl font-bold transition-all"
              >
                <Pencil size={12} /> Edit Card
              </button>
            </div>
            
            {/* Preview Area */}
            <div className="flex-1 relative flex flex-col justify-end p-6 bg-cover bg-center" style={{ backgroundImage: `url(${leftCard.imageUrl})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-yellow-400 tracking-wider block">{leftCard.subtitle || 'Subtitle'}</span>
                <h4 className="text-2xl font-black text-white uppercase leading-none">{leftCard.title}</h4>
                {leftCard.highlight && <span className="text-sm font-bold text-yellow-500 block">{leftCard.highlight}</span>}
                <span className="text-xs font-semibold text-white/80 block mt-2">
                  Link: {leftCard.linkType === 'product' ? `Product (${leftCard.productLink?.name || 'Linked'})` : `Category (${leftCard.categoryLink || 'All'})`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Stack of Top and Bottom Slots */}
        <div className="flex flex-col gap-6">
          
          {/* Top Slot (Horizontal) */}
          {rightTopCard && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[218px]">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Right Top Slot</span>
                <button
                  onClick={() => openEdit(rightTopCard)}
                  className="text-xs flex items-center gap-1 bg-[#111] hover:bg-black text-white px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  <Pencil size={12} /> Edit Card
                </button>
              </div>

              {/* Preview Area */}
              <div className="flex-1 relative flex flex-col justify-end p-6 bg-cover bg-center" style={{ backgroundImage: `url(${rightTopCard.imageUrl})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 space-y-0.5">
                  <span className="text-[10px] uppercase font-extrabold text-yellow-400 tracking-wider block">{rightTopCard.subtitle || 'Subtitle'}</span>
                  <h4 className="text-lg font-black text-white uppercase">{rightTopCard.title}</h4>
                  {rightTopCard.highlight && <span className="text-xs font-bold text-yellow-500 block">{rightTopCard.highlight}</span>}
                  <span className="text-xs font-semibold text-white/80 block mt-1">
                    Link: {rightTopCard.linkType === 'product' ? `Product (${rightTopCard.productLink?.name || 'Linked'})` : `Category (${rightTopCard.categoryLink || 'All'})`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Slot (Horizontal) */}
          {rightBottomCard && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[218px]">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Right Bottom Slot</span>
                <button
                  onClick={() => openEdit(rightBottomCard)}
                  className="text-xs flex items-center gap-1 bg-[#111] hover:bg-black text-white px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  <Pencil size={12} /> Edit Card
                </button>
              </div>

              {/* Preview Area */}
              <div className="flex-1 relative flex flex-col justify-end p-6 bg-cover bg-center" style={{ backgroundImage: `url(${rightBottomCard.imageUrl})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 space-y-0.5">
                  <span className="text-[10px] uppercase font-extrabold text-yellow-400 tracking-wider block">{rightBottomCard.subtitle || 'Subtitle'}</span>
                  <h4 className="text-lg font-black text-white uppercase">{rightBottomCard.title}</h4>
                  {rightBottomCard.highlight && <span className="text-xs font-bold text-yellow-500 block">{rightBottomCard.highlight}</span>}
                  <span className="text-xs font-semibold text-white/80 block mt-1">
                    Link: {rightBottomCard.linkType === 'product' ? `Product (${rightBottomCard.productLink?.name || 'Linked'})` : `Category (${rightBottomCard.categoryLink || 'All'})`}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit Modal */}
      {modalOpen && editCard && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Edit Slot: {editCard.position === 'left' ? 'Left Tall' : editCard.position === 'right-top' ? 'Right Top' : 'Right Bottom'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              
              {/* Image Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">Banner Image</label>
                <p className="text-[10px] text-gray-400">Recommended: {editCard.position === 'left' ? '600x800 px (3:4)' : '800x400 px (2:1)'} • Max size: 10MB</p>
                <div
                  onClick={() => fileRef.current.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-all flex flex-col items-center justify-center min-h-[160px]"
                >
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="max-h-36 rounded-lg object-contain border" />
                      <span className="text-xs text-gray-500 font-medium block">Click to change image</span>
                    </div>
                  ) : (
                    <div className="py-2 space-y-1">
                      <Upload size={24} className="mx-auto text-gray-400" />
                      <span className="text-xs text-gray-500 font-semibold block">Click to upload image</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. HEADPHONE"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="e.g. IN TREND or FEATURED"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Highlight */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Highlight Text</label>
                <input
                  type="text"
                  value={highlight}
                  onChange={e => setHighlight(e.target.value)}
                  placeholder="e.g. Collections or $999"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Link Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Link Redirect Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                    <input type="radio" name="linkType" value="category" checked={linkType === 'category'} onChange={() => setLinkType('category')} />
                    Category
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                    <input type="radio" name="linkType" value="product" checked={linkType === 'product'} onChange={() => setLinkType('product')} />
                    Product
                  </label>
                </div>
              </div>

              {/* Conditional Redirect Selectors */}
              {linkType === 'category' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Category</label>
                  <select
                    value={categoryLink}
                    onChange={e => setCategoryLink(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-400"
                  >
                    <option value="">Link to all products</option>
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Product</label>
                  <select
                    value={productLink}
                    onChange={e => setProductLink(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-400"
                  >
                    <option value="">No product linked</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} (£{p.price})</option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 bg-[#111] hover:bg-black text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-60"
              >
                {saving ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : (
                  'Save Slot'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
