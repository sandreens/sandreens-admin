import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import OrderList from './pages/orders/OrderList';
import UserList from './pages/users/UserList';
import CmsEditor from './pages/cms/CmsEditor';
import TrendingCardManager from './pages/cms/TrendingCardManager';
import CategoryManager from './pages/categories/CategoryManager';
import CouponManager from './pages/coupons/CouponManager';
import Messages from './pages/messages/Messages';
import Settings from './pages/settings/Settings';
import ReturnList from './pages/orders/ReturnList';
function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f8f8f8]">
      <Sidebar />
      <div
        id="admin-main-content"
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: '240px' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontWeight: '600', fontSize: '13px' }
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminLayout><Dashboard /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute>
              <AdminLayout><ProductList /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/products/new" element={
            <ProtectedRoute>
              <AdminLayout><ProductForm /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/products/:id/edit" element={
            <ProtectedRoute>
              <AdminLayout><ProductForm /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute>
              <AdminLayout><OrderList /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <AdminLayout><UserList /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/cms" element={
            <ProtectedRoute>
              <AdminLayout><CmsEditor /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/cms/trending-cards" element={
            <ProtectedRoute>
              <AdminLayout><TrendingCardManager /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/categories" element={
            <ProtectedRoute>
              <AdminLayout><CategoryManager /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/coupons" element={
            <ProtectedRoute>
              <AdminLayout><CouponManager /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <AdminLayout><Messages /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <AdminLayout><Settings /></AdminLayout>
            </ProtectedRoute>
          } />

<Route path="/returns" element={
            <ProtectedRoute>
              <AdminLayout><ReturnList /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
