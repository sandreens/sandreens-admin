import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, ChevronDown, Eye, X } from 'lucide-react';
const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_OPTIONS = ['Unpaid', 'Paid', 'Refunded'];

const STATUS_LABELS = {
  'Pending':    'Order Placed',
  'Processing': 'Order Confirmed',
  'Shipped':    'Ready Parcel',
  'Delivered':  'Delivered',
  'Cancelled':  'Cancelled',
};

const STATUS_COLORS = {
  'Pending':    'bg-yellow-100 text-yellow-700',
  'Processing': 'bg-blue-100 text-blue-700',
  'Shipped':    'bg-indigo-100 text-indigo-700',
  'Delivered':  'bg-green-100 text-green-700',
  'Cancelled':  'bg-red-100 text-red-700',
};

const PAY_COLORS = {
  'Paid':    'bg-green-100 text-green-700',
  'Unpaid':  'bg-gray-100 text-gray-600',
  'Refunded':'bg-orange-100 text-orange-700',
};

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewOrder, setViewOrder] = useState(null); // detail modal er jonno

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, orderStatus) => {
    try {
      const res = await api.put(`/orders/${id}/status`, { orderStatus });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: res.data.orderStatus, courierStatus: res.data.courierStatus } : o));
      toast.success('Status updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const updatePayment = async (id, paymentStatus) => {
    try {
      const res = await api.put(`/orders/${id}/pay`, { paymentStatus });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, paymentStatus: res.data.paymentStatus } : o));
      toast.success('Payment updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleSendToCourier = async (id) => {
    try {
      const res = await api.put(`/orders/${id}/send-to-courier`);
      setOrders(prev => prev.map(o => o._id === id ? {
        ...o,
        courierStatus: res.data.courierStatus,
        orderStatus: res.data.orderStatus,
        trackingNumber: res.data.trackingNumber,
        royalMailOrderId: res.data.royalMailOrderId
      } : o));
      toast.success('Order dispatched to Royal Mail!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Courier dispatch failed');
    }
  };

  const filtered = orders.filter(o =>
    (o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
     o.phone?.includes(search) ||
     o._id.includes(search)) &&
    (filterStatus ? o.orderStatus === filterStatus : true)
  );

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Orders" />
      <main className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, ID..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white font-medium">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-600">{filtered.length} orders</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Payment', 'Order Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading orders...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">No orders found</td></tr>
                ) : filtered.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">
                        {order.shippingAddress?.addressLine1 || order.shippingAddress?.address}, {order.shippingAddress?.city}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{order.orderItems?.length}</td>
                    <td className="px-4 py-3 font-bold">£{order.totalPrice?.toFixed(2)}</td>

                    {/* Payment Status Dropdown */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={order.paymentStatus}
                          onChange={e => updatePayment(order._id, e.target.value)}
                          className={`appearance-none pr-6 pl-2 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer focus:outline-none ${PAY_COLORS[order.paymentStatus]}`}
                        >
                          {PAYMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Order Status Dropdown */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={order.orderStatus}
                          onChange={e => updateStatus(order._id, e.target.value)}
                          className={`appearance-none pr-6 pl-2 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[order.orderStatus]}`}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </td>

                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black cursor-pointer"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>

                      {order.courierStatus === 'Pending' && (
                        <button
                          onClick={() => handleSendToCourier(order._id)}
                          className="px-2 py-1 bg-black hover:bg-black/90 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                          title="Send to Royal Mail Click & Drop"
                        >
                          Send to Courier
                        </button>
                      )}
                      {order.courierStatus === 'Dispatched' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">
                          Dispatched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      {/* ── ORDER DETAIL MODAL ── */}
        {viewOrder && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setViewOrder(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">Order Details</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">#{viewOrder._id.slice(-6).toUpperCase()}</p>
                </div>
                <button onClick={() => setViewOrder(null)} className="text-gray-400 hover:text-black cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer + Delivery */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer</h4>
                    <p className="text-sm font-semibold text-gray-900">{viewOrder.customerName}</p>
                    <p className="text-sm text-gray-600">{viewOrder.phone}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {viewOrder.shippingAddress?.addressLine1 || viewOrder.shippingAddress?.address}<br />
                      {viewOrder.shippingAddress?.addressLine2 && <>{viewOrder.shippingAddress.addressLine2}<br /></>}
                      {viewOrder.shippingAddress?.city}{viewOrder.shippingAddress?.postcode && <>, {viewOrder.shippingAddress.postcode}</>}<br />
                      {viewOrder.shippingAddress?.countryCode || 'GBR'}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Items ({viewOrder.orderItems?.length})
                  </h4>
                  <div className="space-y-3">
                    {viewOrder.orderItems?.map((item, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {item.size && <>Size: {item.size} · </>}Qty: {item.qty}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">£{(item.price * item.qty).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment summary */}
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  {viewOrder.couponCode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Promo code <span className="font-mono font-bold text-[#008037]">{viewOrder.couponCode}</span>
                      </span>
                      <span className="text-[#008037] font-bold">− £{(viewOrder.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>Total Paid</span>
                    <span>£{viewOrder.totalPrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 pt-2">
                    <span>Payment method: {viewOrder.paymentMethod}</span>
                    <span>{new Date(viewOrder.createdAt).toLocaleString('en-GB')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
