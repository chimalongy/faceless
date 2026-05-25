'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FaYoutube,
  FaMagic,
  FaRocket,
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaCheckCircle,
  FaArrowRight,
  FaPlayCircle,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [counts, setCounts] = useState({ users: 0, scriptsGenerated: 0, channelsCreated: 0 });
  const statsRef = useRef(null);
  const animatedRef = useRef(false);

  const statTargets = { users: 1250, scriptsGenerated: 5680, channelsCreated: 890 };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          Object.entries(statTargets).forEach(([key, end]) => {
            const startTime = performance.now();
            const duration = 1800;
            const step = (now) => {
              const progress = Math.min((now - startTime) / duration, 1);
              const ease = 1 - Math.pow(1 - progress, 3);
              setCounts((prev) => ({ ...prev, [key]: Math.floor(ease * end) }));
              if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          });
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Successfully subscribed!');
      setEmail('');
      setIsSubmitting(false);
    }, 1500);
  };

  const features = [
    {
      icon: <FaMagic />,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-50',
      title: 'AI Script Generation',
      description: "Generate engaging YouTube scripts in minutes with AI that understands your channel's voice and niche.",
    },
    {
      icon: <FaRocket />,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50',
      title: 'Content Organization',
      description: 'Organize content into channels and topics for a consistent, structured content strategy.',
    },
    {
      icon: <FaChartLine />,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
      title: 'Performance Analytics',
      description: 'Track content performance and get insights on what drives growth for your faceless channel.',
    },
    {
      icon: <FaUsers />,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      title: 'Collaboration Ready',
      description: 'Share channels and topics with your team. Perfect for agencies and content studios.',
    },
    {
      icon: <FaShieldAlt />,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-50',
      title: 'Secure & Private',
      description: 'Your scripts and ideas are fully encrypted. We never share your content with third parties.',
    },
    {
      icon: <FaYoutube />,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-50',
      title: 'YouTube Optimized',
      description: 'Scripts are structured for maximum retention and engagement with YouTube algorithms.',
    },
  ];

  const steps = [
    { step: '01', title: 'Create Your Channel', desc: 'Set up your YouTube channel profile with name, niche, and description.' },
    { step: '02', title: 'Organize Topics', desc: 'Create topics within your channel to keep your content strategy structured.' },
    { step: '03', title: 'Write Your Story', desc: 'Write or paste your story content. Add images to visualize your script.' },
    { step: '04', title: 'Generate Script', desc: 'Let AI transform your story into a professional YouTube script instantly.' },
  ];

  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Finance Creator',
      content: 'Scaled from 10k to 100k subscribers in 3 months. The script quality is genuinely phenomenal.',
      subscribers: '250K',
      initials: 'AJ',
    },
    {
      name: 'Sarah Miller',
      role: 'Educational Creator',
      content: 'As a solo creator, this saved me 20+ hours per week. The organization features changed everything.',
      subscribers: '150K',
      initials: 'SM',
    },
    {
      name: 'Mike Chen',
      role: 'Tech Tutorial Creator',
      content: 'The AI understands exactly what makes viral tech tutorials. My retention improved by 40%.',
      subscribers: '500K',
      initials: 'MC',
    },
  ];

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#testimonials', label: 'Testimonials' },
    { href: '#pricing', label: 'Pricing' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVIGATION ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/92 border-b border-gray-100 shadow-sm' : 'bg-white/70 border-b border-transparent'} backdrop-blur-md`}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[10px] flex items-center justify-center shadow-md shadow-orange-500/20">
                <FaYoutube className="text-white text-base" />
              </div>
              <span className="text-[18px] font-bold text-stone-900 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                FacelessVid<span className="text-orange-500">Studio</span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors no-underline">
                  {l.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors no-underline px-2">
                Sign In
              </Link>
              <Link href="/register" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-[10px] shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline">
                Get Started Free
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-stone-700 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg transition-all duration-200 ${mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="px-5 py-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block py-3 text-[15px] font-medium text-stone-700 border-b border-gray-50 last:border-0 no-underline hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 pb-2">
              <Link
                href="/register"
                className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[15px] py-3 rounded-xl shadow-md shadow-orange-500/20 no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="text-center text-[14px] font-semibold text-orange-500 py-2 no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 px-5 bg-stone-50/60 relative overflow-hidden">
        {/* Background blobs */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-orange-400/8 blur-3xl -translate-y-1/2" />
        <div className="pointer-events-none absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-amber-400/6 blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[13px] font-semibold px-4 py-1.5 rounded-full mb-7">
            <FaYoutube className="text-[13px]" />
            The #1 Faceless YouTube Platform
          </div>

          <h1
            className="text-[clamp(2.6rem,6vw,4.8rem)] font-extrabold text-stone-900 leading-[1.08] tracking-tight mb-6"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Build Faceless Channels<br />
            That{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              Actually Convert
            </span>
          </h1>

          <p className="text-[clamp(16px,2.5vw,19px)] text-stone-500 max-w-[580px] mx-auto leading-relaxed mb-10">
            Organize, write, and AI-generate scripts for successful faceless YouTube channels — no camera, no face, just compelling content.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-16">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[16px] px-8 py-4 rounded-xl shadow-xl shadow-orange-500/20 hover:opacity-92 hover:-translate-y-px active:translate-y-0 transition-all no-underline"
            >
              Start Creating Free <FaArrowRight className="text-sm" />
            </Link>
            <button className="inline-flex items-center gap-2 bg-white text-stone-700 font-bold text-[16px] px-8 py-4 rounded-xl border-[1.5px] border-gray-200 hover:border-orange-500 hover:text-orange-500 transition-all">
              <FaPlayCircle /> Watch Demo
            </button>
          </div>

          {/* Stats pill */}
          <div
            ref={statsRef}
            className="inline-flex flex-wrap justify-center bg-white border border-gray-100 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] py-5 px-2"
          >
            {[
              { val: counts.users.toLocaleString(), label: 'Active Users' },
              { val: counts.scriptsGenerated.toLocaleString(), label: 'Scripts Generated' },
              { val: counts.channelsCreated.toLocaleString(), label: 'Channels Created' },
              { val: '95%', label: 'Success Rate' },
            ].map((s, i, arr) => (
              <div key={i} className="flex items-center">
                <div className="px-7 text-center min-w-[110px]">
                  <div className="text-[26px] font-extrabold text-stone-900 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {s.val}
                  </div>
                  <div className="text-[12px] text-gray-400 font-medium mt-0.5">{s.label}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-white px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-3">Features</p>
            <h2
              className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-stone-900 tracking-tight mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Everything for Faceless Success
            </h2>
            <p className="text-[17px] text-stone-500 max-w-[480px] mx-auto">
              Specialized tools built specifically for faceless YouTube creators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-250">
                <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                  <span className={`${f.iconColor} text-xl`}>{f.icon}</span>
                </div>
                <h3 className="text-[17px] font-bold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-[14px] text-stone-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-stone-50/70 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-3">Process</p>
            <h2
              className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-stone-900 tracking-tight mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Four Steps to Great Content
            </h2>
            <p className="text-[17px] text-stone-500 max-w-[440px] mx-auto">From idea to published script in minutes</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-md transition-all">
                <div
                  className="text-[72px] font-extrabold leading-none mb-2 bg-gradient-to-br from-orange-200 to-amber-200 bg-clip-text text-transparent"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {s.step}
                </div>
                <h3 className="text-[16px] font-bold text-stone-900 mb-2">{s.title}</h3>
                <p className="text-[14px] text-stone-500 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 w-5 h-5 bg-gray-100 rounded-full items-center justify-center">
                    <FaArrowRight className="text-[8px] text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 bg-stone-900 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-3">Testimonials</p>
            <h2
              className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-white tracking-tight mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Trusted by Top Creators
            </h2>
            <p className="text-[17px] text-stone-400 max-w-[440px] mx-auto">Thousands of creators building successful channels</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0">
                    {t.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-900">{t.name}</p>
                    <p className="text-[12px] text-gray-400">{t.role}</p>
                  </div>
                  <div className="bg-green-50 text-green-700 text-[12px] font-bold px-3 py-1 rounded-full border border-green-100 flex-shrink-0">
                    {t.subscribers}
                  </div>
                </div>
                <p className="text-[14px] text-gray-600 leading-relaxed italic mb-4">"{t.content}"</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-[13px]">★</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-5">
        <div className="max-w-[860px] mx-auto">
          <div className="relative bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-12 sm:p-16 overflow-hidden text-center">
            {/* Glow blobs */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-[300px] h-[300px] rounded-full bg-orange-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 w-[250px] h-[250px] rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative z-10">
              <h2
                className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-white tracking-tight mb-4"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Start Your Faceless Journey
              </h2>
              <p className="text-[17px] text-stone-400 max-w-[460px] mx-auto mb-9">
                Join thousands building successful channels without ever showing their face.
              </p>

              <div className="flex flex-wrap gap-3 justify-center mb-10">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[16px] px-8 py-4 rounded-xl shadow-xl shadow-orange-500/20 hover:opacity-92 hover:-translate-y-px transition-all no-underline"
                >
                  Get Started Free <FaArrowRight className="text-sm" />
                </Link>
                <button className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white font-semibold text-[16px] px-8 py-4 rounded-xl hover:bg-white/14 transition-all">
                  Schedule a Demo
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-10">
                {[['30-Day', 'Free Trial'], ['No Credit Card', 'Required'], ['Cancel', 'Anytime']].map(([top, sub]) => (
                  <div key={top} className="text-center">
                    <p className="text-[15px] font-bold text-orange-500">{top}</p>
                    <p className="text-[13px] text-stone-500">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="py-14 px-5 bg-stone-50 border-t border-gray-100">
        <div className="max-w-[520px] mx-auto text-center">
          <h3 className="text-[22px] font-bold text-stone-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Stay Updated
          </h3>
          <p className="text-[15px] text-stone-500 mb-6">Tips, tutorials, and updates on faceless content creation</p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-wrap gap-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 min-w-[200px] px-5 py-3 rounded-xl border border-gray-200 text-[15px] text-stone-900 placeholder-gray-300 bg-white outline-none focus:border-orange-500 focus:ring-[3px] focus:ring-orange-500/12 transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-shrink-0 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold text-[15px] px-6 py-3 rounded-xl transition-all"
            >
              {isSubmitting ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 px-5 pt-14 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[9px] flex items-center justify-center">
                  <FaYoutube className="text-white text-sm" />
                </div>
                <span className="text-[16px] font-bold text-stone-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                  FacelessVid<span className="text-orange-500">Studio</span>
                </span>
              </div>
              <p className="text-[14px] text-gray-400 leading-relaxed">
                The platform for faceless YouTube content creation and script generation.
              </p>
            </div>

            {[
              { heading: 'Product', links: [['#features', 'Features'], ['#how-it-works', 'How It Works'], ['/pricing', 'Pricing'], ['#', 'API']] },
              { heading: 'Company', links: [['#', 'About'], ['#', 'Blog'], ['#', 'Careers'], ['#', 'Contact']] },
              { heading: 'Legal', links: [['#', 'Privacy Policy'], ['#', 'Terms of Service'], ['#', 'Cookie Policy'], ['#', 'GDPR']] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-[13px] font-bold text-stone-900 uppercase tracking-wider mb-4">{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([href, label]) => (
                    <li key={label}>
                      <a href={href} className="text-[14px] text-gray-400 hover:text-orange-500 transition-colors no-underline">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-[13px] text-gray-300">© {new Date().getFullYear()} FacelessVidStudio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}