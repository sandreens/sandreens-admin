import React, { useEffect, useState, useRef } from 'react';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Save, AlertTriangle, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import TrendingCardManager from './TrendingCardManager';
import PromoCardManager from './PromoCardManager';

const SECTIONS = [
  {
    key: 'hero',
    label: 'Hero Banner',
    description: 'Main hero image, title, subtitle, and CTA button',
    defaultData: {
      title: 'SUMMER LIVING',
      subtitle: 'The new you need',
      ctaText: "See what's new",
      ctaLink: '/all-things-new',
      desktopImage: '',
      mobileImage: ''
    },
    fields: [
      { name: 'title', label: 'Banner Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'ctaText', label: 'Button Text', type: 'text' },
    ]
  },
  {
    key: 'announcement',
    label: 'Announcement Bar',
    description: 'Top announcement bar text and terms & conditions',
    defaultData: {
      text: '20% off* Fashion & Home use code: JETSET',
      linkText: '*T&Cs apply',
      tcContent: '1. Standard terms and conditions apply.\n2. Valid on selected styles only.\n3. Cannot be combined with other offers.'
    },
    fields: [
      { name: 'text', label: 'Announcement Text', type: 'text' },
      { name: 'linkText', label: 'Link Text', type: 'text' },
      { name: 'tcContent', label: 'Terms & Conditions Content', type: 'textarea' },
    ]
  },
  {
    key: 'hotRightNow',
    label: 'Hot Right Now',
    description: "Yellow trending section category button labels",
    defaultData: {
      title: 'Hot Right Now',
      buttons: [
        { label: 'Dresses', link: '/all-things-new' },
        { label: 'Holiday', link: '/all-things-new' },
        { label: 'Footwear', link: '/all-things-new' },
        { label: 'Lingerie', link: '/all-things-new' },
        { label: 'Plus Size', link: '/all-things-new' },
      ]
    },
    fields: [
      { name: 'title', label: 'Section Title', type: 'text' },
    ]
  },
  {
    key: 'promoCards',
    label: 'Promo Cards (Not to be missed)',
    description: '2-column promotional cards with images and text',
    defaultData: {
      cards: [
        { title: 'Up to 60% off', subtitle: 'Summer Sale', image: '', link: '#', theme: '#f6ede6' },
        { title: 'New arrivals', subtitle: 'Shop now', image: '', link: '#', theme: '#000' }
      ]
    },
    fields: []
  },
  {
    key: 'trendingCards',
    label: 'Trending Cards',
    description: 'Manage featured cards in the Trending Now section',
    defaultData: {},
    fields: []
  },
  {
    key: 'instagramGrid',
    label: 'Instagram Grid (Wear & Share)',
    description: 'Featured Instagram grid images and profile URL',
    defaultData: {
      profileUrl: 'https://instagram.com/sandreens',
      images: ['', '', '', '']
    },
    fields: [
      { name: 'profileUrl', label: 'Instagram Profile URL', type: 'text' },
    ]
  },
  {
    key: 'brandCollab',
    label: 'Brand Collab Banner',
    description: 'Featured brand collaboration banner — put any brand name, image, and text here',
    defaultData: {
      brandText: 'adidas',
      headingLine1: 'Designed by adidas.',
      headingLine2: 'Loved by Sandreens.',
      description: 'The ultimate collaboration is here. Shop our exclusive range of adidas styles, designed to fit and flatter every body. Because sport truly is for everyone.',
      buttonText: 'Shop adidas',
      buttonLink: '/all-things-new?brand=adidas',
      image: ''
    },
    fields: [
      { name: 'brandText', label: 'Brand Name (e.g. "adidas", "Nike", "Puma")', type: 'text' },
      { name: 'headingLine1', label: 'Heading Line 1', type: 'text' },
      { name: 'headingLine2', label: 'Heading Line 2', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'buttonText', label: 'Button Text', type: 'text' },
      { name: 'buttonLink', label: 'Button Link (e.g. /all-things-new?brand=nike)', type: 'text' },
    ]
  },
  {
    key: 'socialLinks',
    label: 'Sandreens Social Links',
    description: 'Manage Facebook, Instagram, TikTok, and YouTube URLs for the Footer',
    defaultData: {
      facebook: 'https://facebook.com/sandreens',
      instagram: 'https://instagram.com/sandreens',
      tiktok: 'https://tiktok.com/@sandreens',
      youtube: 'https://youtube.com/@sandreens'
    },
    fields: [
      { name: 'facebook', label: 'Facebook Page URL (e.g. https://facebook.com/yourpage)', type: 'text' },
      { name: 'instagram', label: 'Instagram Profile URL (e.g. https://instagram.com/yourprofile)', type: 'text' },
      { name: 'tiktok', label: 'TikTok Profile URL (e.g. https://tiktok.com/@yourprofile)', type: 'text' },
      { name: 'youtube', label: 'YouTube Channel URL (e.g. https://youtube.com/@yourchannel)', type: 'text' }
    ]
  },
];

function ImageUploadField({ label, value, onChange, suggestion }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/cms/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(res.data.url);
      toast.success(`${label} uploaded!`);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-col">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        {suggestion && <span className="text-[10px] text-gray-400 font-medium pb-1">{suggestion}</span>}
      </div>
      <div
        onClick={() => !uploading && fileInputRef.current.click()}
        className={`border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-all relative ${
          uploading ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {value ? (
          <div className="space-y-2">
            <img
              src={value}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg object-cover border border-gray-100"
            />
            <span className="text-xs text-gray-500 font-medium block">Click to change image</span>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-500">
              <Upload size={20} />
            </div>
            <span className="text-xs text-gray-500 font-semibold block">
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

const getSelectedCategoriesFromLink = (link) => {
  if (!link || !link.startsWith('/all-things-new')) return [];
  try {
    const urlParams = new URLSearchParams(link.split('?')[1] || '');
    const cats = urlParams.get('category') || '';
    return cats.split(',').map(c => c.trim()).filter(Boolean);
  } catch (e) {
    return [];
  }
};

function SectionEditor({ section, categories }) {
  const [data, setData] = useState(section.defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/cms/${section.key}`)
      .then(res => setData(res.data.data || section.defaultData))
      .catch(() => setData(section.defaultData))
      .finally(() => setLoading(false));
  }, [section.key]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/cms/${section.key}`, { data });
      toast.success(`${section.label} saved!`);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedCats = getSelectedCategoriesFromLink(data.ctaLink || '');

  const toggleCat = (catName) => {
    let newCats;
    if (selectedCats.includes(catName)) {
      newCats = selectedCats.filter(c => c !== catName);
    } else {
      newCats = [...selectedCats, catName];
    }
    
    if (newCats.length === 0) {
      setData({ ...data, ctaLink: '/all-things-new' });
    } else {
      setData({ ...data, ctaLink: `/all-things-new?category=${newCats.join(',')}` });
    }
  };

  if (loading) return <div className="py-4 text-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">{section.label}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
      </div>
      <div className="p-6 space-y-4">
        {/* Standard fields */}
        {section.fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={data[field.name] || ''}
                onChange={e => setData({ ...data, [field.name]: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 resize-y"
              />
            ) : (
              <input
                type={field.type}
                value={data[field.name] || ''}
                onChange={e => setData({ ...data, [field.name]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
              />
            )}
          </div>
        ))}

        {/* Hero Section specific fields (Image uploads and Category selectors) */}
        {section.key === 'hero' && (
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadField
                label="Desktop Banner Image"
                value={data.desktopImage || ''}
                onChange={(url) => setData({ ...data, desktopImage: url })}
                suggestion="Recommended: 1920x800 px (Landscape) • Max size: 10MB"
              />
              <ImageUploadField
                label="Mobile Banner Image"
                value={data.mobileImage || ''}
                onChange={(url) => setData({ ...data, mobileImage: url })}
                suggestion="Recommended: 750x1000 px (Portrait) • Max size: 10MB"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Categories for Button Link
              </label>
              {categories.length === 0 ? (
                <p className="text-xs text-gray-400">Loading categories...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const isSelected = selectedCats.includes(cat.name);
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => toggleCat(cat.name)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isSelected && '✓ '}{cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {data.ctaLink && (
                <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-50 p-2 rounded-lg border border-gray-100">
                  Generated Link: {data.ctaLink}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Brand Collab image */}
        {section.key === 'brandCollab' && (
          <div className="pt-4 border-t border-gray-100">
            <ImageUploadField
              label="Brand Banner Image"
              value={data.image || ''}
              onChange={(url) => setData({ ...data, image: url })}
              suggestion="Recommended: 1000x760 px • Max size: 10MB"
            />
          </div>
        )}

        {/* Hot Right Now buttons array */}
        {section.key === 'hotRightNow' && data.buttons && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trending Buttons</label>
            <div className="space-y-2">
              {data.buttons.map((btn, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={btn.label} placeholder="Button label"
                    onChange={e => {
                      const buttons = [...data.buttons];
                      buttons[i] = { ...buttons[i], label: e.target.value };
                      setData({ ...data, buttons });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  />
                  <input
                    value={btn.link} placeholder="/category-link"
                    onChange={e => {
                      const buttons = [...data.buttons];
                      buttons[i] = { ...buttons[i], link: e.target.value };
                      setData({ ...data, buttons });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo Cards */}
        {section.key === 'promoCards' && data.cards && (
          <div className="space-y-4">
            {data.cards.map((card, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-3">
                <p className="text-sm font-bold text-gray-700">Card {i + 1}</p>
                {['title', 'subtitle', 'image', 'link', 'theme'].map(field => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 capitalize">{field === 'theme' ? 'BG Color (hex)' : field}</label>
                    <input value={card[field] || ''}
                      onChange={e => {
                        const cards = [...data.cards];
                        cards[i] = { ...cards[i], [field]: e.target.value };
                        setData({ ...data, cards });
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Instagram Grid images */}
        {section.key === 'instagramGrid' && data.images && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram Image URLs (4 images)</label>
            <div className="grid grid-cols-2 gap-2">
              {data.images.map((img, i) => (
                <input key={i} value={img}
                  placeholder={`Image ${i + 1} URL`}
                  onChange={e => {
                    const images = [...data.images];
                    images[i] = e.target.value;
                    setData({ ...data, images });
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#111] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-60"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Save size={15} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function CmsEditor() {
  const [activeTab, setActiveTab] = useState(SECTIONS[0].key);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories')
      .then(res => {
        setCategories(res.data.filter(c => c.type === 'product' && !c.parentCategory));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const activeEl = document.getElementById(`tab-btn-${activeTab}`);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  const activeSection = SECTIONS.find(s => s.key === activeTab);
  const currentIndex = SECTIONS.findIndex(s => s.key === activeTab);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveTab(SECTIONS[currentIndex - 1].key);
    }
  };

  const handleNext = () => {
    if (currentIndex < SECTIONS.length - 1) {
      setActiveTab(SECTIONS[currentIndex + 1].key);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 flex flex-col">
      <Header title="Homepage CMS" />
      <div className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center gap-4 w-full">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all shrink-0 border border-transparent hover:border-gray-100"
            title="Previous Section"
          >
            <ChevronLeft size={20} />
          </button>

          <nav className="flex-1 flex border-b border-gray-200 overflow-x-auto scrollbar-none justify-start gap-8 px-2">
            {SECTIONS.map(section => {
              const isActive = section.key === activeTab;
              return (
                <button
                  id={`tab-btn-${section.key}`}
                  key={section.key}
                  onClick={() => setActiveTab(section.key)}
                  className={`text-center pb-4 px-1 text-sm font-bold border-b-2 -mb-[1px] transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleNext}
            disabled={currentIndex === SECTIONS.length - 1}
            className="p-2 rounded-xl text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all shrink-0 border border-transparent hover:border-gray-100"
            title="Next Section"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Warning banner & Editor content */}
        <main className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 font-medium flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-800 shrink-0 mt-0.5" />
            <span>Changes made here will reflect live on the customer website. Edit with care.</span>
          </div>

          {activeTab === 'trendingCards' ? (
            <TrendingCardManager isTabMode={true} />
          ) : activeTab === 'promoCards' ? (
            <PromoCardManager />
          ) : (
            activeSection && (
              <SectionEditor key={activeSection.key} section={activeSection} categories={categories} />
            )
          )}
        </main>
      </div>
    </div>
  );
}
