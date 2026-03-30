'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading('Signing in...');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast.success('Welcome back!', { id: loadingToast });
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-xl border border-orange-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-500 mt-2">Sign in to your FacelessVidStudio account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="relative">
              {/* <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" /> */}
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="input-field pl-72"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="relative">
              {/* <FaLock className="absolute left-3 top-3.5 text-gray-400" /> */}
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="input-field pl-10 pr-10"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-600 cursor-pointer">
              <input 
                type="checkbox" 
                className="mr-2 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Optional: Demo credentials for testing (remove in production) */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">Demo Credentials:</p>
          <p className="text-xs text-gray-400">demo@example.com / password123</p>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}