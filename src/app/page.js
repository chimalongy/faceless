// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaYoutube, 
  FaMagic, 
  FaRocket, 
  FaChartLine, 
  FaUsers, 
  FaShieldAlt,
  FaCheckCircle,
  FaArrowRight,
  FaPlayCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    users: 1250,
    scriptsGenerated: 5680,
    channelsCreated: 890,
    successRate: '95%'
  });

  useEffect(() => {
    // Animate stats counter
    const animateCounter = (start, end, duration, setter) => {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        setter(value);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    // Only animate on client side
    animateCounter(0, stats.users, 2000, (val) => setStats(prev => ({ ...prev, users: val })));
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
      setIsSubmitting(false);
    }, 1500);
  };

  const features = [
    {
      icon: <FaMagic className="text-3xl text-orange-600" />,
      title: 'AI-Powered Script Generation',
      description: 'Generate engaging YouTube scripts in minutes with our advanced AI that understands your channel\'s voice and style.'
    },
    {
      icon: <FaRocket className="text-3xl text-amber-600" />,
      title: 'Content Organization',
      description: 'Organize your content into channels and topics. Keep everything structured for consistent content creation.'
    },
    {
      icon: <FaChartLine className="text-3xl text-green-600" />,
      title: 'Performance Analytics',
      description: 'Track your content performance and get insights on what works best for your faceless channel.'
    },
    {
      icon: <FaUsers className="text-3xl text-blue-600" />,
      title: 'Collaboration Ready',
      description: 'Work with your team by sharing channels and topics. Perfect for agencies and content teams.'
    },
    {
      icon: <FaShieldAlt className="text-3xl text-red-600" />,
      title: 'Secure & Private',
      description: 'Your content is encrypted and secure. We never share your scripts or ideas with third parties.'
    },
    {
      icon: <FaYoutube className="text-3xl text-red-500" />,
      title: 'YouTube Optimized',
      description: 'Scripts optimized for YouTube algorithms with proper structure for maximum engagement.'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create Your Channel',
      description: 'Set up your YouTube channel profile with name, niche, and description.'
    },
    {
      step: '02',
      title: 'Organize Topics',
      description: 'Create topics within your channel to keep your content strategy organized.'
    },
    {
      step: '03',
      title: 'Write Your Story',
      description: 'Write or paste your story content. Add images to visualize your script.'
    },
    {
      step: '04',
      title: 'Generate Script',
      description: 'Let AI transform your story into a professional YouTube script instantly.'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Finance YouTube Creator',
      content: 'FacelessVidStudio helped me scale from 10k to 100k subscribers in 3 months. The script quality is phenomenal!',
      subscribers: '250K'
    },
    {
      name: 'Sarah Miller',
      role: 'Educational Content Creator',
      content: 'As a solo creator, this tool saved me 20+ hours per week. The organization features are a game-changer.',
      subscribers: '150K'
    },
    {
      name: 'Mike Chen',
      role: 'Tech Tutorial Creator',
      content: 'The AI understands exactly what makes a viral tech tutorial. My retention rates improved by 40%.',
      subscribers: '500K'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-orange-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <FaYoutube className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                FacelessVidStudio
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-orange-600 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-orange-600 transition-colors font-medium">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-orange-600 transition-colors font-medium">Testimonials</a>
              <a href="#pricing" className="text-gray-600 hover:text-orange-600 transition-colors font-medium">Pricing</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-orange-600 hover:text-orange-700 font-medium px-4 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register"
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-105"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-orange-50/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gray-900">
              Create <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">Faceless</span> YouTube Content That Converts
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              The all-in-one platform for organizing, creating, and generating scripts for successful faceless YouTube channels. 
              No camera needed, just great content.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                href="/register"
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-orange-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Creating Free
                <FaArrowRight />
              </Link>
              <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-orange-500 hover:text-orange-600 transition-all flex items-center justify-center gap-2 bg-white">
                <FaPlayCircle />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  <div className="text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Everything You Need for Faceless Success</h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto">
              Specialized tools designed specifically for faceless YouTube creators
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-8 rounded-2xl shadow-lg border border-orange-50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="mb-6 bg-orange-50 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-orange-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">How FacelessVidStudio Works</h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto">
              Four simple steps from idea to published content
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-8 rounded-2xl h-full shadow-sm border border-orange-100/50 hover:shadow-md transition-all">
                  <div className="text-6xl font-bold text-orange-100 mb-4">{step.step}</div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-12 h-1 bg-gradient-to-r from-orange-200 to-amber-200"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Successful Creators</h2>
            <p className="text-orange-100 text-xl max-w-2xl mx-auto">
              Join thousands of creators who transformed their channels
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-xl text-gray-900">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                  <div className="ml-auto bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-100">
                    {testimonial.subscribers} Subs
                  </div>
                </div>
                <p className="text-gray-700 italic mb-4">"{testimonial.content}"</p>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <FaCheckCircle key={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-12 text-center shadow-2xl border border-orange-100">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Start Your Faceless YouTube Journey Today</h2>
            <p className="text-xl mb-8 text-gray-600">
              Join thousands of creators who are building successful channels without showing their face
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link 
                href="/register"
                className="bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/25"
              >
                Get Started Free
              </Link>
              <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-orange-500 hover:text-orange-600 transition-all hover:bg-orange-50">
                Schedule a Demo
              </button>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-8 text-center text-gray-600">
              <div>
                <div className="text-2xl font-bold text-orange-600">30-Day</div>
                <div className="opacity-90">Free Trial</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">No Credit Card</div>
                <div className="opacity-90">Required</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">Cancel</div>
                <div className="opacity-90">Anytime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Stay Updated</h3>
            <p className="text-gray-600 mb-6">
              Get tips, tutorials, and updates on faceless content creation
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-6 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-gray-900 py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <FaYoutube className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">FacelessVidStudio</span>
              </div>
              <p className="text-gray-500">
                The ultimate platform for faceless YouTube content creation and script generation.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-500">
                <li><a href="#features" className="hover:text-orange-600 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-orange-600 transition-colors">How It Works</a></li>
                <li><Link href="/pricing" className="hover:text-orange-600 transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-500">
                <li><a href="#" className="hover:text-orange-600 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-500">
                <li><a href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} FacelessVidStudio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}