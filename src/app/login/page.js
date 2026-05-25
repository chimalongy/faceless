'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaYoutube, FaSpinner, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading('Signing in...');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      toast.success('Welcome back!', { id: loadingToast });
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { emoji: '✦', title: 'AI Script Generation', desc: 'Scripts tailored to your niche and voice' },
    { emoji: '◈', title: 'Channel Organization', desc: 'Keep topics and content structured' },
    { emoji: '◉', title: '95% Success Rate', desc: 'Trusted by 1,250+ active creators' },
  ];

  const avatars = ['AJ', 'SM', 'MC', 'KL'];

  return (
    <div className="min-h-screen flex bg-stone-50 overflow-hidden relative">
      {/* Background glow blobs */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-400/10 -translate-y-1/3 translate-x-1/3 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-400/8 translate-y-1/3 -translate-x-1/3 blur-3xl" />

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-center max-w-[460px] w-full px-16 py-16 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 relative overflow-hidden flex-shrink-0">
        {/* Glow overlays */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full bg-orange-500/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-[280px] h-[280px] rounded-full bg-amber-500/12 blur-3xl" />

        <div className="relative z-10">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-14 no-underline group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[11px] flex items-center justify-center shadow-lg shadow-orange-500/25">
              <FaYoutube className="text-white text-lg" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              FacelessVid<span className="text-orange-500">Studio</span>
            </span>
          </Link>

          {/* Headline */}
          <h2
            className="text-[32px] font-extrabold text-white leading-tight tracking-tight mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Create content.<br />
            <span className="text-orange-500">Stay faceless.</span>
          </h2>
          <p className="text-[15px] text-stone-400 leading-relaxed mb-10 max-w-[300px]">
            The all-in-one platform that turns your ideas into high-converting YouTube scripts — without a camera.
          </p>

          {/* Feature list */}
          <div className="flex flex-col">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`flex items-start gap-3.5 py-4 ${i < features.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-500 text-sm">{f.emoji}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                  <p className="text-[13px] text-stone-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex">
              {avatars.map((init, i) => (
                <div
                  key={init}
                  className="w-[30px] h-[30px] rounded-full border-2 border-stone-900 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    background: `hsl(${20 + i * 12}, 85%, ${50 + i * 5}%)`,
                    marginLeft: i > 0 ? '-8px' : '0',
                  }}
                >
                  {init}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-400 text-[11px]">★</span>
                ))}
              </div>
              <p className="text-[12px] text-stone-500">Loved by 1,250+ creators</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[10px] flex items-center justify-center">
                <FaYoutube className="text-white text-base" />
              </div>
              <span
                className="text-lg font-bold text-stone-900 tracking-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                FacelessVid<span className="text-orange-500">Studio</span>
              </span>
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)] p-5 md:p-8">

            {/* Header */}
            <div className="mb-7">
              <h1
                className="text-[26px] font-extrabold text-stone-900 tracking-tight mb-1.5"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Welcome back
              </h1>
              <p className="text-sm text-gray-400">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[15px] text-stone-900 placeholder-gray-300 bg-white transition-all duration-200 outline-none focus:border-orange-500 focus:ring-[3px] focus:ring-orange-500/12"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 text-[15px] text-stone-900 placeholder-gray-300 bg-white transition-all duration-200 outline-none focus:border-orange-500 focus:ring-[3px] focus:ring-orange-500/12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors p-0.5"
                  >
                    {showPassword ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember me + forgot password */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-500 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-[15px] h-[15px] accent-orange-500 cursor-pointer rounded"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-semibold text-orange-500 hover:text-orange-600 transition-colors no-underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] py-3.5 rounded-xl shadow-[0_4px_14px_rgba(249,115,22,0.30)] transition-all duration-150 mt-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FaArrowRight className="text-[13px]" />
                  </>
                )}
              </button>
            </form>



            {/* Divider */}
            <div className="flex items-center gap-3 my-5 text-[13px] text-gray-300">
              <div className="flex-1 h-px bg-gray-100" />
              or
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-orange-500 hover:text-orange-600 font-semibold transition-colors no-underline"
              >
                Create one free →
              </Link>
            </p>
          </div>

          {/* Back to home */}
          <div className="text-center mt-5">
            <Link
              href="/"
              className="text-[13px] text-gray-400 hover:text-orange-500 transition-colors no-underline"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}