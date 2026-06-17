'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaEye, FaEyeSlash, FaShieldAlt, FaArrowRight } from 'react-icons/fa';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const t = toast.loading('Verifying admin credentials…');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      toast.success('Welcome, Admin!', { id: t });
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(err.message, { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">

      {/* Background glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-700/15 rounded-full blur-3xl" />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-[400px]">

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center">
              <FaShieldAlt className="text-white text-[9px]" />
            </div>
            <span className="text-[13px] font-semibold text-indigo-300 tracking-wide">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 p-8">

          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-[28px] font-extrabold text-white tracking-tight mb-1.5"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Admin Sign In
            </h1>
            <p className="text-[14px] text-slate-400">
              Restricted access — authorised personnel only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="admin-email"
                placeholder="admin@facelessstudio.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-[14px] text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="admin-password"
                  placeholder="Enter admin password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 text-[14px] text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="admin-login-btn"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-150 mt-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <FaArrowRight className="text-sm" />
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
            <FaShieldAlt className="text-amber-400 text-xs mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-amber-400/80 leading-relaxed">
              This portal is for platform administrators only. Unauthorised access attempts are logged.
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[12px] text-slate-600 mt-6">
          FacelessVidStudio · Admin Panel
        </p>
      </div>
    </div>
  );
}
