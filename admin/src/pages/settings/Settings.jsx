import React, { useEffect, useState, useRef } from 'react';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Plus, Save, Upload, X, KeyRound, UserPlus, Ruler } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Active Tab state: 'size' | 'admin' | 'password'
  const [activeTab, setActiveTab] = useState('size');

  // Size matrix state
  const [numberSizes, setNumberSizes] = useState([]);
  const [letterSizes, setLetterSizes] = useState([]);
  const [sizeGuideText, setSizeGuideText] = useState('');
  const [sizeGuideImage, setSizeGuideImage] = useState('');
  const [newNumberSize, setNewNumberSize] = useState('');
  const [newLetterSize, setNewLetterSize] = useState('');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Add Admin state (Super Admin only)
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const fileInputRef = useRef(null);

  // Access Control Check: Only sandreens.26@gmail.com or role === 'superadmin'
  const isSuperAdmin =
    user?.email?.toLowerCase() === 'sandreens.26@gmail.com' ||
    user?.role === 'superadmin';

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        if (res.data) {
          setNumberSizes(res.data.numberSizes || []);
          setLetterSizes(res.data.letterSizes || []);
          setSizeGuideText(res.data.sizeGuideText || '');
          setSizeGuideImage(res.data.sizeGuideImage || '');
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddNumberSize = () => {
    const val = newNumberSize.trim();
    if (!val) return;
    if (numberSizes.includes(val)) {
      toast.error('Size already exists');
      return;
    }
    setNumberSizes([...numberSizes, val]);
    setNewNumberSize('');
  };

  const handleDeleteNumberSize = (size) => {
    setNumberSizes(numberSizes.filter(s => s !== size));
  };

  const handleAddLetterSize = () => {
    const val = newLetterSize.trim();
    if (!val) return;
    if (letterSizes.includes(val)) {
      toast.error('Size already exists');
      return;
    }
    setLetterSizes([...letterSizes, val]);
    setNewLetterSize('');
  };

  const handleDeleteLetterSize = (size) => {
    setLetterSizes(letterSizes.filter(s => s !== size));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/cms/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSizeGuideImage(res.data.url);
      toast.success('Size Guide image uploaded!');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings', {
        numberSizes,
        letterSizes,
        sizeGuideText,
        sizeGuideImage
      });
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Add Admin Handler (Super Admin only)
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      toast.error('Please fill in all Admin details');
      return;
    }
    if (adminPassword.length < 6) {
      toast.error('Admin password must be at least 6 characters long');
      return;
    }

    setAddingAdmin(true);
    try {
      await api.post('/users/add-admin', {
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword.trim()
      });
      toast.success(`Admin "${adminName}" created successfully!`);
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setAddingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#f8f8f8]">
      <Header title="Settings & Management" />
      <main className="p-6 max-w-5xl mx-auto space-y-6">

        {/* ── SIDE-BY-SIDE TOP TAB NAVIGATION BAR (Just like Homepage CMS) ── */}
        <nav className="flex border-b border-gray-200 gap-8 bg-white px-6 pt-4 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-none">
          
          {/* Tab 1: Size Matrix & Guides */}
          <button
            type="button"
            onClick={() => setActiveTab('size')}
            className={`pb-4 text-sm font-bold border-b-2 -mb-[1px] transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'size'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            <Ruler size={16} /> Size Matrix & Guides
          </button>

          {/* Tab 2: Add New Admin (Super Admin Only) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`pb-4 text-sm font-bold border-b-2 -mb-[1px] transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-400 hover:text-purple-600'
              }`}
            >
              <UserPlus size={16} /> Add New Admin
            </button>
          )}

          {/* Tab 3: Change Password */}
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-4 text-sm font-bold border-b-2 -mb-[1px] transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'password'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            <KeyRound size={16} /> Change Password
          </button>
        </nav>

        {/* ── TAB CONTENT 1: SIZE MATRIX & GUIDES ── */}
        {activeTab === 'size' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-lg text-gray-900 mb-1">Size Matrix & Guides</h2>
              <p className="text-sm text-gray-500">Configure size matrices (number and letter formats) and design the global size helper chart shown on the product pages.</p>
            </div>

            {/* Size Management Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Number Sizes */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                <h3 className="font-bold text-gray-900 border-b pb-3 mb-4">Number Sizes (e.g. UK 10, 12, 14)</h3>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newNumberSize}
                    onChange={e => setNewNumberSize(e.target.value)}
                    placeholder="e.g. 10"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                    onKeyDown={e => e.key === 'Enter' && handleAddNumberSize()}
                  />
                  <button
                    type="button"
                    onClick={handleAddNumberSize}
                    className="bg-[#111] hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {numberSizes.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No number sizes added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 overflow-y-auto max-h-64 p-1">
                    {numberSizes.map(size => (
                      <div
                        key={size}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl"
                      >
                        <span className="text-sm font-bold text-gray-800">{size}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteNumberSize(size)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Letter Sizes */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                <h3 className="font-bold text-gray-900 border-b pb-3 mb-4">Letter Sizes (e.g. S, M, L, XL)</h3>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newLetterSize}
                    onChange={e => setNewLetterSize(e.target.value)}
                    placeholder="e.g. XL"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                    onKeyDown={e => e.key === 'Enter' && handleAddLetterSize()}
                  />
                  <button
                    type="button"
                    onClick={handleAddLetterSize}
                    className="bg-[#111] hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {letterSizes.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No letter sizes added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 overflow-y-auto max-h-64 p-1">
                    {letterSizes.map(size => (
                      <div
                        key={size}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl"
                      >
                        <span className="text-sm font-bold text-gray-800">{size}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLetterSize(size)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Panel: Size Guide Setup */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-900 border-b pb-3">Global Size Guide (Text & Image)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Guide Instructions / Text</label>
                  <textarea
                    value={sizeGuideText}
                    onChange={e => setSizeGuideText(e.target.value)}
                    rows={8}
                    placeholder="Write size guidance details, sizing recommendations, etc..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col">
                    <label className="block text-sm font-semibold text-gray-700">Size Chart / Guide Photo</label>
                    <span className="text-[10px] text-gray-400 font-medium pb-1">Recommended: Grid/Chart Image • Max size: 10MB</span>
                  </div>
                  
                  <div
                    onClick={() => !uploading && fileInputRef.current.click()}
                    className={`border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-all relative min-h-[195px] flex flex-col items-center justify-center ${
                      uploading ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {sizeGuideImage ? (
                      <div className="space-y-2">
                        <img
                          src={sizeGuideImage}
                          alt="Size Guide Chart"
                          className="max-h-40 mx-auto rounded-lg object-contain border border-gray-100"
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
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Actions bar */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-[#111] hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-60"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={16} /> Save Settings</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT 2: ADD NEW ADMIN (Super Admin Only) ── */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              Super Admin Exclusive
            </div>

            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">Add New Admin Account</h2>
                <p className="text-xs text-gray-500">Create new admin accounts with dashboard access.</p>
              </div>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="e.g. admin2@sandreens.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingAdmin}
                className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-60"
              >
                {addingAdmin ? 'Creating Admin...' : 'Create Admin Account'}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB CONTENT 3: CHANGE PASSWORD ── */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">Change Password</h2>
                <p className="text-xs text-gray-500">Update your dashboard account login password securely.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="bg-[#111] hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-60"
              >
                {changingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
