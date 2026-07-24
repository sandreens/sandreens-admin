import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, ImageOff } from 'lucide-react';

const RETURN_STATUS_COLORS = {
  'Requested': 'bg-yellow-100 text-yellow-700',
  'Approved':  'bg-green-100 text-green-700',
  'Rejected':  'bg-red-100 text-red-700',
  'Pending':   'bg-yellow-100 text-yellow-700',
  'None':      'bg-gray-100 text-gray-500',
};

export default function ReturnList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Requested');
  const [viewImage, setViewImage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    api.get('/orders')
      .then(res => {
        // Load return requests or refund requests
        const withReturns = res.data.filter(o => 
          (o.returnStatus && o.returnStatus !== 'None') ||
          (o.refundRequest && o.refundRequest.isRequested)
        );
        setOrders(withReturns);
      })
      .catch(() => toast.error('Failed to load return requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      // Call new approve-refund endpoint (Stripe Refund is not performed per user instructions)
      const res = await api.put(`/orders/${id}/approve-refund`, { refundStatus: status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, ...res.data } : o));
      toast.success(`Refund request ${status.toLowerCase()} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const getActiveStatus = (order) => {
    if (order.refundRequest && order.refundRequest.isRequested) {
      return order.refundRequest.status;
    }
    return order.returnStatus;
  };

  const filtered = filterStatus
    ? orders.filter(o => {
        const status = getActiveStatus(o);
        // Handle mapping of "Requested" to "Pending"
        if (filterStatus === 'Requested') {
          return status === 'Requested' || status === 'Pending';
        }
        return status === filterStatus;
      })
    : orders;

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Returns & Refunds" />
      <main className="p-6">
        {/* Toolbar */}
        <div className="flex gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white font-medium"
          >
            <option value="">All Return Requests</option>
            <option value="Requested">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading return requests...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
            No return requests found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => {
              const activeStatus = getActiveStatus(order);
              return (
                <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex flex-wrap justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 font-mono">#{order._id.slice(-6).toUpperCase()}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${RETURN_STATUS_COLORS[activeStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {activeStatus}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Requested: {order.refundRequest?.requestedAt || order.returnRequestedAt ? new Date(order.refundRequest?.requestedAt || order.returnRequestedAt).toLocaleDateString('en-GB') : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-start">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reason</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{order.refundRequest?.reason || order.returnReason || '—'}</p>

                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-3 mb-1">Comment</h4>
                      <p className="text-sm text-gray-700 leading-relaxed italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        "{order.refundRequest?.comment || order.returnReason || 'No details provided.'}"
                      </p>

                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-3 mb-1">Order Total</h4>
                      <p className="text-sm font-bold text-gray-900">£{order.totalPrice?.toFixed(2)}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-semibold text-gray-700">Photo Proofs</h4>
                      {order.refundRequest?.images && order.refundRequest.images.length > 0 ? (
                        <div className="flex gap-2 flex-wrap max-w-[200px]">
                          {order.refundRequest.images.map((img, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={img}
                              alt="refund proof"
                              onClick={() => setViewImage(img)}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ))}
                        </div>
                      ) : order.returnImage ? (
                        <img
                          src={order.returnImage}
                          alt="return proof"
                          onClick={() => setViewImage(order.returnImage)}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-300">
                          <ImageOff size={22} />
                        </div>
                      )}
                    </div>
                  </div>

                  {(activeStatus === 'Requested' || activeStatus === 'Pending') && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleUpdate(order._id, 'Approved')}
                        disabled={updatingId === order._id}
                        className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Approve Refund
                      </button>
                      <button
                        onClick={() => handleUpdate(order._id, 'Rejected')}
                        disabled={updatingId === order._id}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Image lightbox */}
      {viewImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setViewImage(null)}
        >
          <button className="absolute top-5 right-5 text-white" onClick={() => setViewImage(null)}>
            <X size={28} />
          </button>
          <img src={viewImage} alt="return proof full" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}