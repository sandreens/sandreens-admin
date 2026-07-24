import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import api from '../services/api';
import {
  Package, ShoppingCart, Users, TrendingUp,
  AlertCircle, CheckCircle, Clock, XCircle
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-semibold text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const orderStatusColor = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Processing': 'bg-blue-100 text-blue-700',
  'Shipped': 'bg-indigo-100 text-indigo-700',
  'Delivered': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, ordersRes, usersRes] = await Promise.all([
          api.get('/products'),
          api.get('/orders'),
          api.get('/users'),
        ]);
        const orders = ordersRes.data;
        const revenue = orders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + o.totalPrice, 0);
        setStats({
          products: productsRes.data.length,
          orders: orders.length,
          users: usersRes.data.length,
          revenue
        });
        setRecentOrders(orders.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Dashboard" />
      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Total Products" value={stats.products} color="bg-[#111]" />
          <StatCard icon={ShoppingCart} label="Total Orders" value={stats.orders} color="bg-blue-500" />
          <StatCard icon={Users} label="Customers" value={stats.users} color="bg-violet-500" />
          <StatCard icon={TrendingUp} label="Revenue (Paid)" value={`£${stats.revenue.toFixed(2)}`} color="bg-[#ffd500] !text-black" sub="From paid orders only" />
        </div>

        {/* Order Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pending', icon: Clock, cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            { label: 'Processing', icon: AlertCircle, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Delivered', icon: CheckCircle, cls: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'Cancelled', icon: XCircle, cls: 'bg-red-50 text-red-700 border-red-200' },
          ].map(({ label, icon: Icon, cls }) => (
            <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border ${cls}`}>
              <Icon size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
                <p className="text-xl font-black">
                  {recentOrders.filter(o => o.orderStatus === label).length}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <a href="/orders" className="text-xs font-semibold text-[#111] underline underline-offset-2">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Customer', 'Items', 'Total', 'Payment', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No orders yet</td></tr>
                ) : recentOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{order.customerName}</td>
                    <td className="px-5 py-4 text-gray-600">{order.orderItems?.length} item(s)</td>
                    <td className="px-5 py-4 font-bold">£{order.totalPrice?.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`badge-pill ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge-pill ${orderStatusColor[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
