import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Monitor, Tag, LogOut,  X, ChevronRight, MessageCircle, Ticket, Settings as SettingsIcon,
  RotateCcw
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',         label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/products',           label: 'Products',         icon: Package },
  { to: '/orders',             label: 'Orders',           icon: ShoppingCart },
    { to: '/returns',            label: 'Returns',          icon: RotateCcw },

  { to: '/users',              label: 'Customers',        icon: Users },
  { to: '/cms',                label: 'Homepage CMS',     icon: Monitor },
  { to: '/categories',         label: 'Categories',       icon: Tag },
  { to: '/coupons',            label: 'Coupons',          icon: Ticket },
  { to: '/messages',           label: 'Messages',         icon: MessageCircle },
  { to: '/settings',           label: 'Settings',         icon: SettingsIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Sync content area margin with sidebar width
  useEffect(() => {
    const main = document.getElementById('admin-main-content');
    if (main) main.style.marginLeft = collapsed ? '64px' : '240px';
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-[#111] flex flex-col z-50 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <Link to="/" className="flex items-center">
              <Logo height={32} color="#ffffff" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/60 hover:text-white transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight size={20} /> : <X size={18} />}
          </button>
        </div>

        {/* Admin badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Logged in as</p>
            <p className="text-white text-sm font-semibold mt-0.5 truncate">{user?.name || 'Admin'}</p>
            <span className="badge-pill bg-[#ffd500] text-black mt-1">ADMIN</span>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-semibold transition-all mb-0.5 ${
                  isActive
                    ? 'bg-[#ffd500] text-black'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
