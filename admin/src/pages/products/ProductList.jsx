import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Tag, CheckCircle, XCircle } from 'lucide-react';

const BADGE_COLORS = {
  'New In': 'bg-green-100 text-green-700',
  'Sale': 'bg-orange-100 text-orange-700',
  '40% OFF': 'bg-red-100 text-red-700',
  '60% OFF': 'bg-red-200 text-red-800',
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Products" />
      <main className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>
          <Link
            to="/products/new"
            className="flex items-center gap-2 bg-[#111] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600">{filtered.length} products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Image', 'Product', 'Category', 'Price', 'Badge', 'Stock', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading products...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No products found</td></tr>
                ) : filtered.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-gray-100 border">
                        {(product.images?.[0] || product.imageUrl) ? (
                          <img
                            src={product.images?.[0] || product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag size={16} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900 max-w-[200px] truncate">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{product.sizes?.join(', ') || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{product.category}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-gray-900">£{product.price}</p>
                      {product.salePrice && (
                        <p className="text-xs text-green-600 font-semibold">Sale: £{product.salePrice}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {product.badge ? (
                        <span className={`badge-pill ${BADGE_COLORS[product.badge] || 'bg-gray-100 text-gray-600'}`}>
                          {product.badge}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {product.inStock ? (
                        <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                          <CheckCircle size={14} /> In Stock
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 font-semibold text-xs">
                          <XCircle size={14} /> Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/products/${product._id}/edit`}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={deleting === product._id}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
