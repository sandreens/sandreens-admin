import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Save, Ticket, X } from 'lucide-react';

const EMPTY_FORM = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: 0,
  usageLimit: '',
  expiryDate: '',
  isActive: true,
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadCoupons = () => {
    api.get('/coupons')
      .then(res => setCoupons(res.data))
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCoupons(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/coupons/${editing._id}`, form);
        toast.success('Coupon updated');
      } else {
        await api.post('/coupons', form);
        toast.success('Coupon created');
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscount: c.maxDiscount ?? '',
      minOrderAmount: c.minOrderAmount ?? 0,
      usageLimit: c.usageLimit ?? '',
      // date input er jonno YYYY-MM-DD format lagbe
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 10) : '',
      isActive: c.isActive,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch {
      toast.error('Delete failed');
    }
  };

  // Coupon er obostha ber kori
  const getStatus = (c) => {
    if (!c.isActive) return { label: 'Inactive', cls: 'bg-gray-100 text-gray-600' };
    if (c.expiryDate && new Date(c.expiryDate) < new Date()) {
      return { label: 'Expired', cls: 'bg-red-100 text-red-700' };
    }
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit) {
      return { label: 'Limit reached', cls: 'bg-orange-100 text-orange-700' };
    }
    return { label: 'Active', cls: 'bg-green-100 text-green-700' };
  };

  const formatDiscount = (c) =>
    c.discountType === 'percentage' ? `${c.discountValue}% off` : `£${c.discountValue} off`;

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1';

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Promo Codes" />
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LIST ── */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Ticket size={18} /> All Promo Codes
              </h3>
              <span className="text-xs text-gray-400">{coupons.length} codes</span>
            </div>

            {loading ? (
              <p className="text-center text-gray-400 py-10 text-sm">Loading...</p>
            ) : coupons.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No promo codes yet. Create one →</p>
            ) : (
              <div className="space-y-2">
                {coupons.map(c => {
                  const status = getStatus(c);
                  return (
                    <div key={c._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
                            {c.code}
                          </span>
                          <span className="text-sm font-bold text-[#008037]">{formatDiscount(c)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          {c.minOrderAmount > 0 && <>Min £{c.minOrderAmount} · </>}
                          {c.maxDiscount !== null && <>Max £{c.maxDiscount} · </>}
                          Used {c.usedCount}{c.usageLimit !== null ? `/${c.usageLimit}` : ''}
                          {c.expiryDate && <> · Expires {new Date(c.expiryDate).toLocaleDateString('en-GB')}</>}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 self-start">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Promo Code' : 'Create Promo Code'}</h3>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}
                  className="text-gray-400 hover:text-gray-700">
                  <X size={16} />
                </button>
              )}
            </div>

            <div>
              <label className={labelCls}>Code *</label>
              <input
                required
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="JETSET"
                className={`${inputCls} font-mono font-bold uppercase`}
              />
            </div>

            <div>
              <label className={labelCls}>Discount Type *</label>
              <select
                value={form.discountType}
                onChange={e => setForm({ ...form, discountType: e.target.value })}
                className={`${inputCls} bg-white`}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (£)</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>
                {form.discountType === 'percentage' ? 'Discount (%) *' : 'Discount (£) *'}
              </label>
              <input
                required type="number" min="0" step="0.01"
                value={form.discountValue}
                onChange={e => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === 'percentage' ? '20' : '10.00'}
                className={inputCls}
              />
            </div>

            {/* Max discount shudhu percentage er jonno */}
            {form.discountType === 'percentage' && (
              <div>
                <label className={labelCls}>Max Discount (£) — optional</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.maxDiscount}
                  onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                  placeholder="e.g. 30 (cap the discount)"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Minimum Order (£)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.minOrderAmount}
                onChange={e => setForm({ ...form, minOrderAmount: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Usage Limit — optional</label>
              <input
                type="number" min="1"
                value={form.usageLimit}
                onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Expiry Date — optional</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                className={inputCls}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="rounded text-[#111] w-4 h-4"
              />
              <span className="text-xs font-bold text-gray-700">Active</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#111] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-black transition-all disabled:opacity-60 cursor-pointer"
            >
              <Save size={15} />
              {saving ? 'Saving...' : editing ? 'Update Code' : 'Create Code'}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}