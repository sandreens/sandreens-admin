import React from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title }) {
  const { user } = useAuth();

  const siteUrl = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">Sandreens Admin Dashboard</p>
      </div>

      <div className="flex items-center gap-3">
        {/* View live site */}
        <a
          href={siteUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ExternalLink size={14} />
          View Site
        </a>

        {/* Notifications placeholder */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ffd500] rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#111] flex items-center justify-center text-white font-bold text-sm">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
