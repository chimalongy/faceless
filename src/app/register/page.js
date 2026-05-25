'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  FaYoutube,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaCheckCircle,
} from 'react-icons/fa';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!agreed) {
      toast.error('Please agree to the Terms of Service');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating your account...');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      toast.success('Account created successfully!', { id: loadingToast });
      router.push('/login');
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4' };
    if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/4' };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Fair', color: 'bg-amber-400', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.confirmPassword && formData.password === formData.confirmPassword;

  const perks = [
    '30-day free trial, no credit card needed',
    'AI-powered script generation',
    'Unlimited channel organization',
    'Cancel anytime',
  ];

  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[15px] text-stone-900 placeholder-gray-300 bg-white outline-none focus:border-orange-500 focus:ring-[3px] focus:ring-orange-500/12 transition-all duration-200";

  return (
    <div className="min-h-screen flex bg-stone-50 overflow-hidden relative">
      {/* Background blobs */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-400/10 -translate-y-1/3 translate-x-1/3 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-400/8 translate-y-1/3 -translate-x-1/3 blur-3xl" />

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-center max-w-[420px] w-full px-14 py-16 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 relative overflow-hidden flex-shrink-0">
        <div className="pointer-events-none absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full bg-orange-500/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-[280px] h-[280px] rounded-full bg-amber-500/12 blur-3xl" />

        <div className="relative z-10">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-12 no-underline">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[11px] flex items-center justify-center shadow-lg shadow-orange-500/25">
              <FaYoutube className="text-white text-lg" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              FacelessVid<span className="text-orange-500">Studio</span>
            </span>
          </Link>

          <h2
            className="text-[30px] font-extrabold text-white leading-tight tracking-tight mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Start building.<br />
            <span className="text-orange-500">No camera needed.</span>
          </h2>
          <p className="text-[15px] text-stone-400 leading-relaxed mb-10 max-w-[300px]">
            Join 1,250+ creators generating professional scripts and growing faceless YouTube channels.
          </p>

          {/* Perks list */}
          <div className="flex flex-col gap-4">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <FaCheckCircle className="text-orange-500 text-[10px]" />
                </div>
                <span className="text-[14px] text-stone-300">{perk}</span>
              </div>
            ))}
          </div>

          {/* Stat strip */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { val: '1,250+', label: 'Active Creators' },
              { val: '5,680+', label: 'Scripts Generated' },
              { val: '890+', label: 'Channels Created' },
              { val: '95%', label: 'Success Rate' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                <p className="text-[18px] font-extrabold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {s.val}
                </p>
                <p className="text-[12px] text-stone-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-[460px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[10px] flex items-center justify-center">
                <FaYoutube className="text-white text-base" />
              </div>
              <span className="text-lg font-bold text-stone-900 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
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
                Create your account
              </h1>
              <p className="text-sm text-gray-400">Free for 30 days — no credit card required</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">First name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Alex"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Johnson"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`${inputClass} pr-12`}
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

                {/* Strength bar */}
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className={`${inputClass} pr-12 ${formData.confirmPassword
                      ? passwordsMatch
                        ? 'border-green-400 focus:border-green-500 focus:ring-green-500/12'
                        : 'border-red-300 focus:border-red-400 focus:ring-red-400/12'
                      : ''
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors p-0.5"
                  >
                    {showConfirm ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <p className={`text-[12px] mt-1 ${passwordsMatch ? 'text-green-500' : 'text-red-400'}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Terms agreement */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer rounded flex-shrink-0"
                />
                <span className="text-[13px] text-gray-500 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-orange-500 hover:text-orange-600 font-semibold no-underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-orange-500 hover:text-orange-600 font-semibold no-underline">Privacy Policy</Link>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] py-3.5 rounded-xl shadow-[0_4px_14px_rgba(249,115,22,0.30)] transition-all duration-150 mt-1"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    <span>Creating account…</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
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

            {/* Sign in link */}
            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors no-underline">
                Sign in →
              </Link>
            </p>
          </div>

          {/* Back to home */}
          <div className="text-center mt-5">
            <Link href="/" className="text-[13px] text-gray-400 hover:text-orange-500 transition-colors no-underline">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}