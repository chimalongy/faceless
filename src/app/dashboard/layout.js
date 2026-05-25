'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaHome,
  FaTv,
  FaSignOutAlt,
  FaUserCircle,
  FaMicrophoneAlt,
  FaBars,
  FaTimes,
  FaYoutube,
  FaChevronRight,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import ChannelSidebarTree from '../../components/sidebar/ChannelSidebarTree';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: FaHome },
    { label: 'Channels', href: '/dashboard/channels', icon: FaTv },
    { label: 'Voice Cloner', href: '/dashboard/voicecloner', icon: FaMicrophoneAlt },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Primary nav ── */}
      <nav className="px-3 pt-5 flex-shrink-0 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.14em] text-stone-400 uppercase">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-[13px] font-semibold no-underline ${isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
            >
              {/* Left accent bar */}
              <span
                className={`absolute left-0 w-[3px] h-7 rounded-r-full transition-all duration-150 ${isActive ? 'bg-orange-500 opacity-100' : 'opacity-0'
                  }`}
              />
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isActive
                    ? 'bg-orange-100'
                    : 'bg-stone-100 group-hover:bg-stone-200'
                  }`}
              >
                <item.icon
                  className={`text-[13px] ${isActive ? 'text-orange-500' : 'text-stone-400 group-hover:text-stone-600'}`}
                />
              </div>
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 h-px bg-gray-100 flex-shrink-0" />

      {/* ── Channel tree ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-0 pb-2
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-gray-200
        [&::-webkit-scrollbar-thumb]:rounded-full
      ">
        <ChannelSidebarTree />
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 p-3 border-t border-gray-100 space-y-1">
        {/* User pill */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 border border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
            <FaUserCircle className="text-white text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-stone-800 truncate leading-tight">My Account</p>
            <p className="text-[11px] text-stone-400 truncate">Faceless Studio</p>
          </div>
          <FaChevronRight className="text-[11px] text-stone-300 flex-shrink-0" />
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
            <FaSignOutAlt className="text-[12px] text-stone-400 group-hover:text-red-500 transition-colors" />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="w-[220px] bg-white border-r border-gray-100 hidden md:flex flex-col shadow-[1px_0_0_#f3f4f6] flex-shrink-0 relative">
        {/* Logo */}
        <div className="flex-shrink-0 px-5 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="block no-underline group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[9px] flex items-center justify-center shadow-sm shadow-orange-500/20 flex-shrink-0">
                <FaYoutube className="text-white text-sm" />
              </div>
              <div>
                <p
                  className="text-[14px] font-extrabold text-stone-900 tracking-tight leading-none"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  FacelessVid<span className="text-orange-500">Studio</span>
                </p>
                <p className="text-[9px] font-bold tracking-[0.16em] text-stone-400 uppercase mt-0.5">
                  Content Studio
                </p>
              </div>
            </div>
          </Link>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Mobile Backdrop ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Mobile Slide-out Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-white z-40 flex flex-col shadow-2xl md:hidden
          transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex-shrink-0 px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[9px] flex items-center justify-center">
              <FaYoutube className="text-white text-sm" />
            </div>
            <div>
              <p
                className="text-[14px] font-extrabold text-stone-900 tracking-tight leading-none"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                FacelessVid<span className="text-orange-500">Studio</span>
              </p>
              <p className="text-[9px] font-bold tracking-[0.16em] text-stone-400 uppercase mt-0.5">
                Content Studio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Close menu"
          >
            <FaTimes size={15} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
            aria-label="Open menu"
          >
            <FaBars size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[7px] flex items-center justify-center">
              <FaYoutube className="text-white text-xs" />
            </div>
            <span
              className="text-[14px] font-extrabold text-stone-900 tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              FacelessVid<span className="text-orange-500">Studio</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            aria-label="Sign out"
          >
            <FaSignOutAlt size={16} />
          </button>
        </header>

        {/* Desktop topbar breadcrumb strip */}
        <div className="hidden md:flex items-center px-8 h-12 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 text-[12px] text-stone-400">
            <FaHome className="text-[11px]" />
            <span>/</span>
            <span className="font-medium text-stone-600 capitalize">
              {pathname.split('/').filter(Boolean).slice(1).join(' / ') || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb:hover]:bg-gray-300
        ">
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}