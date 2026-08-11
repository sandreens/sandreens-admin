import React, { useEffect, useState, useRef } from 'react';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, GripVertical, X, Upload, Loader } from 'lucide-react';

// ── Drag-and-drop helpers (pure CSS/JS, no external library) ────────────────
function DraggableCard({ card, index, onDragStart, onDragOver, onDrop, onEdit, onDelete }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
      style={{
        background: '#fff',
        border: '1.5px solid #e8e8e8',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'grab',
        transition: 'box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '3/4', background: '#f5f5f5', overflow: 'hidden' }}>
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>No image</div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 8px', color: '#fff', fontSize: 11, fontWeight: 700 }}>
          #{index + 1}
        </div>
        <div style={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.8)', cursor: 'grab' }}>
          <GripVertical size={18} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: '#111', margin: 0, lineHeight: 1.3 }}>{card.title}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(card.categories || []).map(cat => (
            <span key={cat} style={{ background: '#f0f0f0', color: '#444', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{cat}</span>
          ))}
          {(!card.categories || card.categories.length === 0) && (
            <span style={{ color: '#aaa', fontSize: 11 }}>No category</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => onEdit(card)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#111' }}>
            <Pencil size={13} /> Edit
          </button>
          <button onClick={() => onDelete(card._id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#fff0f0', border: 'none', borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#d00' }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card Form Modal ───────────────────────────────────────────────────────────
function CardFormModal({ editCard, categories, onClose, onSaved }) {
  const [title, setTitle] = useState(editCard ? editCard.title : '');
  const [selectedCats, setSelectedCats] = useState(editCard ? editCard.categories || [] : []);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(editCard ? editCard.imageUrl : '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const toggleCat = (name) => {
    setSelectedCats(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  const handleFile = (e) => {
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
      selectedCats.forEach(c => fd.append('categories', c));
      if (imageFile) fd.append('image', imageFile);
      else if (editCard) fd.append('imageUrl', editCard.imageUrl);

      if (editCard) {
        await api.put(`/trending-cards/${editCard._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Card updated!');
      } else {
        await api.post('/trending-cards', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Card added!');
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{editCard ? 'Edit Card' : 'Add New Card'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Image upload */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 2 }}>Card Image *</label>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: '#999' }}>Recommended: 600x800 px (3:4) • Max size: 10MB</p>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: '2px dashed #ddd', borderRadius: 12, padding: 16, cursor: 'pointer', textAlign: 'center',
                background: imagePreview ? 'transparent' : '#fafafa', overflow: 'hidden', position: 'relative',
                aspectRatio: imagePreview ? '3/4' : 'auto', maxHeight: imagePreview ? 260 : 'auto',
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <div style={{ color: '#aaa', padding: '20px 0' }}>
                  <Upload size={28} style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: 13 }}>Click to upload image</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#bbb' }}>JPG, PNG, WebP</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            {imagePreview && (
              <button onClick={() => fileRef.current.click()} style={{ marginTop: 8, fontSize: 12, color: '#008037', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                Change image
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. The Holiday Edit"
              style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Categories multi-select */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>
              Categories <span style={{ fontWeight: 400, color: '#999' }}>(select one or more)</span>
            </label>
            {categories.length === 0 ? (
              <p style={{ fontSize: 12, color: '#aaa' }}>No categories found. Please add some in Category Manager first.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => toggleCat(cat.name)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      background: selectedCats.includes(cat.name) ? '#111' : '#f0f0f0',
                      color: selectedCats.includes(cat.name) ? '#fff' : '#444',
                      border: selectedCats.includes(cat.name) ? '1.5px solid #111' : '1.5px solid transparent',
                    }}
                  >
                    {selectedCats.includes(cat.name) && '✓ '}{cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px 0', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: '#fff', color: '#444' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '11px 0', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Loader size={15} className="animate-spin" /> Saving...</> : (editCard ? 'Update Card' : 'Add Card')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrendingCardManager({ isTabMode = false }) {
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const dragIndex = useRef(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trending-cards');
      setCards(res.data);
    } catch { toast.error('Failed to load cards'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCards();
    api.get('/categories').then(res => {
      setCategories(res.data.filter(c => c.type === 'product' && !c.parentCategory));
    }).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this card?')) return;
    try {
      await api.delete(`/trending-cards/${id}`);
      toast.success('Card deleted');
      fetchCards();
    } catch { toast.error('Delete failed'); }
  };

  const handleDragStart = (index) => { dragIndex.current = index; };
  const handleDragOver  = (index) => {};
  const handleDrop = async (dropIndex) => {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return;
    const reordered = [...cards];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(dropIndex, 0, moved);
    setCards(reordered);
    dragIndex.current = null;
    try {
      await api.put('/trending-cards/reorder', { orderedIds: reordered.map(c => c._id) });
      toast.success('Order saved');
    } catch { toast.error('Reorder failed'); fetchCards(); }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditCard(null);
    fetchCards();
  };

  const canAdd = cards.length < 4;

  if (isTabMode) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="font-bold text-gray-900">Trending Cards</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{cards.length}/4 cards</p>
          </div>
          <button
            onClick={() => { setEditCard(null); setShowForm(true); }}
            disabled={!canAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: canAdd ? '#111' : '#ccc', color: '#fff',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              fontSize: 13, fontWeight: 700, cursor: canAdd ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={16} /> Add Card
          </button>
        </div>

        {/* Card Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14 }}>Loading...</div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14 }}>
            <p style={{ margin: '12px 0 0' }}>No trending cards yet. Click "Add Card" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {cards.map((card, index) => (
              <DraggableCard
                key={card._id}
                card={card}
                index={index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onEdit={(c) => { setEditCard(c); setShowForm(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {showForm && (
          <CardFormModal
            editCard={editCard}
            categories={categories}
            onClose={() => { setShowForm(false); setEditCard(null); }}
            onSaved={handleSaved}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Trending Now Cards" />
      <main style={{ padding: '24px', maxWidth: 900 }}>
        {/* Info bar */}
        <div style={{ background: '#fffbea', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', fontWeight: 600, marginBottom: 24 }}>
          These cards appear in the "Trending Now" section on the homepage. Max 4 cards. Drag to reorder.
        </div>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111' }}>Trending Cards</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{cards.length}/4 cards</p>
          </div>
          <button
            onClick={() => { setEditCard(null); setShowForm(true); }}
            disabled={!canAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: canAdd ? '#111' : '#ccc', color: '#fff',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              fontSize: 13, fontWeight: 700, cursor: canAdd ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={16} /> Add Card
          </button>
        </div>

        {/* Card Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14 }}>Loading...</div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14 }}>
            <p style={{ margin: '12px 0 0' }}>No trending cards yet. Click "Add Card" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {cards.map((card, index) => (
              <DraggableCard
                key={card._id}
                card={card}
                index={index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onEdit={(c) => { setEditCard(c); setShowForm(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <CardFormModal
          editCard={editCard}
          categories={categories}
          onClose={() => { setShowForm(false); setEditCard(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}