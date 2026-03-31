'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaHome, FaTv, FaSignOutAlt, FaUserCircle, FaMicrophoneAlt, FaBars, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: FaHome },
    { label: 'Channels', href: '/dashboard/channels', icon: FaTv },
    { label: 'Voice Cloner', href: '/dashboard/voicecloner', icon: FaMicrophoneAlt },
  ];

  const NavContent = () => (
    <>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 font-medium ${
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <item.icon className={isActive ? 'text-orange-500' : 'text-gray-400'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-orange-50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <FaUserCircle className="text-2xl text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">User</p>
            <p className="text-xs text-gray-500 truncate">Account</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FaSignOutAlt />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-orange-50/50 text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-orange-100 hidden md:flex flex-col shadow-sm">
        <div className="p-6 border-b border-orange-50">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            FacelessVidStudio
          </h1>
        </div>
        <NavContent />
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-40 flex flex-col shadow-xl md:hidden
          transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-orange-50 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            FacelessVidStudio
          </h1>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close menu"
          >
            <FaTimes size={18} />
          </button>
        </div>
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-orange-100 p-4 flex justify-between items-center shadow-sm">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-500 hover:text-orange-600 transition-colors p-1"
            aria-label="Open menu"
          >
            <FaBars size={20} />
          </button>
          <h1 className="font-bold text-orange-600">FacelessVidStudio</h1>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-500 transition-colors p-1"
            aria-label="Sign out"
          >
            <FaSignOutAlt size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-1 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}