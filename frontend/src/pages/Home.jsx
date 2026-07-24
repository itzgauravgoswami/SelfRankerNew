import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { LOGO_BASE64 } from '../utils/logoBase64';
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  ChevronDown, 
  HelpCircle, 
  Star, 
  Layers, 
  ShieldCheck, 
  ArrowUpRight,
  X,
  FileText,
  Tv,
  Map,
  Trophy,
  Bot,
  BookOpen
} from 'lucide-react';

// Scroll reveal animation wrapper component
function Reveal({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('sr_token');
      if (token) {
        try {
          const data = await api.get('/auth/profile');
          setProfile(data.user);
        } catch (err) {
          console.log('Not logged in or token expired');
        }
      }
    };
    checkAuth();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePremiumCTA = async () => {
    if (!profile) {
      navigate('/signin');
      return;
    }

    if (profile.isPremium) {
      navigate('/dashboard');
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    try {
      const orderData = await api.post('/payment/order');
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Self Ranker',
        image: LOGO_BASE64,
        description: 'Upgrade for advanced AI features',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyData = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyData.success) {
              alert('Payment verified! Your account has been upgraded.');
              navigate('/dashboard');
            }
          } catch (err) {
            alert('Verification failed: ' + err.message);
          }
        },
        prefill: {
          name: profile?.name || '',
          email: profile?.email || ''
        },
        theme: {
          color: '#7c3aed'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Failed to start checkout: ' + err.message);
    }
  };

  const handleStarterCTA = () => {
    if (profile) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };
  const features = [
    {
      icon: <FileText className="w-6 h-6 text-purple-600" />,
      title: "AI Notes Generator",
      desc: "Instantly create structured study guides and notes on any academic or placement topic with LaTeX math equations and clean structural formatting."
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-purple-600" />,
      title: "Interactive AI Quizzes",
      desc: "Configure and generate custom practice assessments with instant feedback, scoring, and automatic progress logging directly to your dashboard."
    },
    {
      icon: <Tv className="w-6 h-6 text-purple-600" />,
      title: "Supreme Learning Videos",
      desc: "Search, fetch, and curate high-quality educational YouTube videos to play inline, perfectly coordinated alongside your topic study plans."
    },
    {
      icon: <Map className="w-6 h-6 text-purple-600" />,
      title: "Day-by-Day Learning Paths",
      desc: "Generate full, structured roadmaps tailored to your exams. Comes with diversified, validated direct resource links (YouTube, MDN Web Docs, LeetCode)."
    },
    {
      icon: <Trophy className="w-6 h-6 text-purple-600" />,
      title: "Gamification & Ranks",
      desc: "Compete with peer cohorts, level up your rank, earn experience points (XP), and maintain daily streak consistency to build placement stamina."
    },
    {
      icon: <Bot className="w-6 h-6 text-purple-600" />,
      title: "AI Tutor & Study Q&A",
      desc: "Have a conversational tutor explain complex algorithms or subject queries step-by-step. Get instant answers to study problems."
    }
  ];

  const steps = [
    { num: "01", title: "Set Your Learning Goals", desc: "Select your subject and topic targets to calibrate your placement curriculum." },
    { num: "02", title: "Study & Practice", desc: "Generate AI notes, watch curated video playlists, and solve customized quizzes to test your understanding." },
    { num: "03", title: "Rank & Analyze", desc: "Track quiz scores, check weekly active analytics, and compete on the global leaderboard as you climb the ranks." }
  ];

  const testimonials = [
    {
      quote: "Self Ranker saved me hundreds of hours. Instead of scouring random blogs, I got custom day-by-day roadmaps with validated direct links (MDN, LeetCode) and practice quizzes that led to my SDE offer at Microsoft!",
      author: "Aditya Sharma",
      role: "SDE-1, Microsoft",
      stars: 5
    },
    {
      quote: "The interactive AI study notes and Supreme Video playlists are game-changers. Calibrating my scores on the global leaderboard kept me motivated to master DSA.",
      author: "Sneha Patel",
      role: "SDE, McKinsey Tech",
      stars: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter Plan",
      price: "₹0",
      desc: "Perfect for initial self-assessment and tracking.",
      features: [
        "10 AI Notes PDF downloads per month",
        "5 daily AI Quizzes & Q&A tests",
        "5 daily Supreme Learning video plays",
        "Up to 5 active Day-by-Day roadmaps",
        "Single device active session",
        "Daily Streak tracking & Global Leaderboard"
      ],
      popular: false,
      cta: "Start Free"
    },
    {
      name: "Premium",
      price: "₹21",
      period: "/month",
      desc: "For serious candidates targeting tier-1 companies and maximum percentile ranks.",
      features: [
        "Unlimited AI Notes downloads",
        "Unlimited daily AI Quizzes & Q&A tests",
        "Unlimited daily Supreme Learning sessions",
        "Up to 10 active Day-by-Day roadmaps with verified resources",
        "Up to 2 simultaneous active device sessions",
        "Full Mastery Analytics & Leaderboard ranking multiplier"
      ],
      popular: true,
      cta: "Get Started Pro"
    }
  ];

  const faqs = [
    {
      q: "How do the AI Learning Paths generate resources?",
      a: "Our AI engine generates structured day-by-day roadmaps and validates each resource link in real-time. It links directly to top study platforms like YouTube, MDN Web Docs, Wikipedia, and LeetCode, and automatically falls back to verified search queries if a link is offline."
    },
    {
      q: "How do I earn XP and level up?",
      a: "You gain Experience Points (XP) by actively studying: generating AI Notes, taking subject quizzes, and resolving questions with the AI Tutor. Maintaining your daily streak multiplies your XP gains to help you climb the global leaderboards."
    },
    {
      q: "What benefits does the Aurora Pro Premium plan provide?",
      a: "Pro Premium unlocks unlimited AI generations (Notes, Quizzes, Q&A), priority access on our fast response queues, supreme educational video curations, full analytics history, and granular subject mastery metrics."
    },
    {
      q: "Are the study quizzes customizable?",
      a: "Yes! You can configure the topic, target subject, number of questions, and select specific exams (like JEE, GATE, CAT, UPSC, or General study) and difficulty tiers (Easy/Medium/Hard) to get tailored prep assessments."
    }
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const offset = 80;
      const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-zinc-350 antialiased selection:bg-purple-200 dark:selection:bg-purple-900/60 selection:text-purple-900 dark:selection:text-purple-100 transition-colors duration-300 overflow-x-hidden">
      {/* Decorative Gradient Background Elements */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[100px] -z-10 pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[30vh] left-1/4 w-[350px] h-[350px] bg-indigo-200/20 dark:bg-indigo-950/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-float" />

      {/* Render Navbar Component */}
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content Layout Wrapper */}
      <div className="pt-20 pb-20">
        
        {/* HERO SECTION */}
        <section id="home" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 pb-16 md:pt-12 md:pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 text-xs font-semibold tracking-wide mb-6 uppercase animate-fade-in-up">
            <Sparkles size={14} className="text-purple-600 dark:text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
            Empowering Placement Prep
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white leading-tight max-w-4xl mx-auto mb-6 animate-fade-in-up delay-100">
            Rank Yourself Against the Best. <br/>
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-text-shine">
              Secure Your Dream Placement.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-sans animate-fade-in-up delay-200">
            Self Ranker is the ultimate placement preparation dashboard. Assess your coding, aptitude, and core skills, compete with peer cohorts, and follow personalized AI-driven roadmaps to success.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <a
              href="#pricing"
              onClick={(e) => handleLinkClick(e, '#pricing')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-102 flex items-center justify-center gap-2 cursor-pointer font-display"
            >
              Get Started Free
              <ArrowUpRight size={18} />
            </a>
            <a
              href="#about"
              onClick={(e) => handleLinkClick(e, '#about')}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-900 text-slate-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 font-semibold rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Learn More
            </a>
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[3px] bg-gradient-to-r from-transparent via-15% via-purple-300/80 via-85% to-transparent opacity-75" />

        {/* ABOUT SECTION */}
        <section id="about" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Reveal>
                <div className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-3 font-display">About the Platform</div>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight mb-6">
                  Engineered for transparency, built for progress.
                </h2>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 font-sans">
                  Preparing for exams or placement cycles shouldn't happen in isolation. Most candidates study blind, with no clear indicator of their preparation level or how they compare to the peer competition.
                </p>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed mb-8 font-sans">
                  Self Ranker bridges this visibility gap. We equip you with advanced AI Notes, customized mock quizzes, Day-by-Day roadmaps, and inline Supreme learning playlists while letting you compete on active leaderboards. Know exactly where you stand, study effectively, and level up your ranking.
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold text-slate-950 dark:text-white font-display">University Standards</h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-550">Built to mirror top university placement criteria.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold text-slate-950 dark:text-white font-display">Data Privacy</h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-550">Your profile, progress, and rankings are fully secure.</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
            <div className="relative">
              <Reveal delay={200}>
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-300 to-indigo-300 rounded-2xl filter blur-2xl opacity-20 dark:opacity-10" />
                <div className="relative bg-white dark:bg-zinc-900/90 border border-purple-100 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                  <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-zinc-800 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold font-display">SR</div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white font-display">Daily Prep Tracker</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">Last calibrated: Just now</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full border border-green-100 dark:border-green-900/50 font-display">Active</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-medium font-sans">
                        <span className="text-slate-700 dark:text-zinc-300">Data Structures & Algos</span>
                        <span className="text-purple-700 dark:text-purple-400">82%</span>
                      </div>
                      <div className="w-full bg-purple-50 dark:bg-purple-950/30 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: '82%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-medium font-sans">
                        <span className="text-slate-700 dark:text-zinc-300">System Design Basics</span>
                        <span className="text-purple-700 dark:text-purple-400">65%</span>
                      </div>
                      <div className="w-full bg-purple-50 dark:bg-purple-950/30 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-medium font-sans">
                        <span className="text-slate-700 dark:text-zinc-300">Quantitative Aptitude</span>
                        <span className="text-purple-700 dark:text-purple-400">90%</span>
                      </div>
                      <div className="w-full bg-purple-50 dark:bg-purple-950/30 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-sm font-sans">
                    <span className="text-slate-500 dark:text-zinc-500">Your Placement Rank Index:</span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 font-display text-lg">Top 5%</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[3px] bg-gradient-to-r from-transparent via-15% via-purple-300/80 via-85% to-transparent opacity-75" />

        {/* FEATURES SECTION */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-3 font-display">Powerful Features</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Everything you need to level up your game.
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 mt-4 leading-relaxed font-sans">
              We design features that don't just track metrics, but actively help you study, practice, and benchmark your progress.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <Reveal key={idx} delay={idx * 150}>
                <div className="bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm border border-purple-100/60 dark:border-zinc-800/80 p-8 rounded-2xl shadow-sm card-hover hover:scale-102 hover:border-purple-200 dark:hover:border-purple-900/60 group h-full">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    {React.cloneElement(feat.icon, { className: 'w-6 h-6 text-purple-600 group-hover:text-white transition-colors duration-300' })}
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-3">{feat.title}</h3>
                  <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed font-sans">{feat.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[3px] bg-gradient-to-r from-transparent via-15% via-purple-300/80 via-85% to-transparent opacity-75" />

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-3 font-display">Simple Roadmap</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              How Self Ranker Works
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 mt-4 leading-relaxed font-sans">
              Three simple steps to transition from anxious to placement-ready.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            {steps.map((step, idx) => (
              <Reveal key={idx} delay={idx * 150}>
                <div className="relative bg-white/40 dark:bg-zinc-900/20 p-8 rounded-2xl border border-slate-100 dark:border-zinc-800/80 flex flex-col justify-between group card-hover transition-colors h-full">
                  <div>
                    <div className="text-5xl font-extrabold font-display text-purple-200 dark:text-purple-500/30 mb-6 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">{step.num}</div>
                    <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-3">{step.title}</h3>
                    <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed font-sans">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[3px] bg-gradient-to-r from-transparent via-15% via-purple-300/80 via-85% to-transparent opacity-75" />

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-3 font-display">Success Stories</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Trusted by successful graduates.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((test, idx) => (
              <Reveal key={idx} delay={idx * 200}>
                <div className="bg-white dark:bg-zinc-900/60 border border-purple-100 dark:border-zinc-800/60 p-8 rounded-2xl shadow-sm card-hover relative h-full flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-4">
                      {[...Array(test.stars)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-zinc-300 italic text-base leading-relaxed mb-6 font-sans">
                      "{test.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                      {test.author[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm font-display">{test.author}</h4>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium font-display">{test.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[3px] bg-gradient-to-r from-transparent via-15% via-purple-300/80 via-85% to-transparent opacity-75" />

        {/* PRICING SECTION */}
        <section id="pricing" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-3 font-display">Fair Pricing</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Simple, transparent pricing plans.
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 mt-4 leading-relaxed font-sans">
              No hidden fees. Upgrade or cancel your subscription at any time.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <Reveal key={idx} delay={idx * 200}>
                <div 
                  className={`bg-white dark:bg-zinc-900/60 rounded-3xl p-8 border transition-all card-hover h-full flex flex-col justify-between ${
                    plan.popular 
                      ? 'border-purple-600 dark:border-purple-500 shadow-xl shadow-purple-500/10 dark:shadow-purple-500/5 relative scale-102 hover:scale-103' 
                      : 'border-slate-200 dark:border-zinc-800/80 shadow-sm hover:border-purple-200 dark:hover:border-purple-900/50'
                  }`}
                >
                  <div>
                    {plan.popular && (
                      <span className="absolute top-0 right-8 -translate-y-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase font-display tracking-wider">
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-500 dark:text-zinc-500 text-sm mb-6 font-sans">{plan.desc}</p>
                    <div className="flex items-baseline mb-6 font-sans">
                      <span className="text-4xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white">{plan.price}</span>
                      {plan.period && <span className="text-slate-500 dark:text-zinc-500 text-sm ml-1">{plan.period}</span>}
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-zinc-400 font-sans">
                          <CheckCircle2 size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => plan.popular ? handlePremiumCTA() : handleStarterCTA()}
                    className={`w-full py-3.5 rounded-full font-semibold transition-all flex items-center justify-center cursor-pointer font-display border-0 ${
                      plan.popular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20'
                        : 'bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-600 border border-slate-200 hover:border-purple-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700 dark:hover:border-purple-900/50'
                    }`}
                  >
                    {profile && profile.isPremium && plan.popular ? "Already Premium" : plan.cta}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[3px] bg-gradient-to-r from-transparent via-15% via-purple-300/80 via-85% to-transparent opacity-75" />

        {/* FAQ SECTION */}
        <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-16 md:py-24">
          <div className="text-center mb-16">
            <div className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-3 font-display">FAQ</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <Reveal key={idx} delay={idx * 100}>
                <div className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-sm border border-purple-100/50 dark:border-zinc-800/50 p-6 rounded-2xl shadow-sm card-hover hover:border-purple-200 dark:hover:border-purple-900/60 transition-colors">
                  <h3 className="text-lg font-bold font-display text-slate-950 dark:text-white flex gap-2 items-center mb-3">
                    <HelpCircle size={18} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed pl-7 font-sans">
                    {faq.a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[3px] bg-gradient-to-r from-transparent via-15% via-purple-300/80 via-85% to-transparent opacity-75" />

        {/* FOUNDER SECTION */}
        <section id="founder" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-16 md:py-24">
          <Reveal>
            <div className="text-center mb-12">
              <div className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-3 font-display">
                Behind the Platform
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
                Meet the Founder
              </h2>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="relative overflow-hidden bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md border border-purple-100/50 dark:border-zinc-800/50 rounded-3xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-300">
              {/* Decorative background glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 grid md:grid-cols-12 gap-8 md:gap-12 items-center">
                {/* Photo Column */}
                <div className="md:col-span-4 flex justify-center">
                  <div className="relative group">
                    {/* Gradient Border Ring */}
                    <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
                    
                    <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-white dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 shadow-md">
                      <img 
                        src="/founder/Photo.png" 
                        alt="Gaurav Goswami" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=500"; 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Content Column */}
                <div className="md:col-span-8 text-center md:text-left flex flex-col justify-center">
                  <div className="inline-flex items-center gap-1.5 self-center md:self-start px-3 py-1 rounded-full text-xs font-semibold bg-purple-50/80 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 mb-4">
                    <Sparkles size={12} className="animate-pulse" />
                    Founder & Developer
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">
                    Gaurav Goswami
                  </h3>
                  
                  <p className="text-purple-600 dark:text-purple-400 font-medium font-display text-sm sm:text-base mb-4">
                    MERN & GenAI Developer
                  </p>
                  
                  <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 font-sans">
                    As a dedicated MERN Stack and GenAI Developer, Gaurav envisioned and built Self Ranker as a comprehensive ecosystem to bridge the gap between traditional engineering preparation and actual industry benchmarks. Passionate about AI integration and developer empowerment, he aims to guide graduates towards successful placement journeys.
                  </p>
                  
                  {/* Social Icons */}
                  <div className="flex gap-4 justify-center md:justify-start">
                    <a 
                      href="https://github.com/itzgauravgoswami" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-purple-500/5"
                      title="GitHub"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                    </a>
                    
                    <a 
                      href="https://linkedin.com/in/itzgauravgoswami" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-purple-500/5"
                      title="LinkedIn"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                      </svg>
                    </a>
                    
                    <a 
                      href="https://instagram.com/itzgauravgoswami" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-purple-500/5"
                      title="Instagram"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    </a>
                    
                    <a 
                      href="https://gauravgoswami.me" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-purple-500/5"
                      title="Portfolio"
                    >
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-purple-100 dark:border-zinc-900/80 bg-white/70 dark:bg-zinc-950/40 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top section: Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            
            {/* Column 1: Brand & Tagline */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/Assets/Logos/Logo (MAIN).png" alt="Self Ranker Logo" className="h-8 w-auto object-contain brightness-110 contrast-105" />
                <span className="text-2xl font-black font-display bg-gradient-to-r from-purple-600 via-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-text-shine">
                  Self Ranker
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed max-w-sm font-sans">
                The ultimate preparation platform for engineering grads. Build skills, assess percentile rankings, and benchmark progress to secure dream placements.
              </p>
              <div className="flex gap-4">
                <a href="#github" className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center cursor-pointer">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </a>
                <a href="#linkedin" className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center cursor-pointer">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                  </svg>
                </a>
                <a href="#twitter" className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center cursor-pointer">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-display">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" onClick={(e) => handleLinkClick(e, '#features')} className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Features</a></li>
                <li><a href="#how-it-works" onClick={(e) => handleLinkClick(e, '#how-it-works')} className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Roadmap</a></li>
                <li><a href="#pricing" onClick={(e) => handleLinkClick(e, '#pricing')} className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Pricing</a></li>
                <li><a href="#faq" onClick={(e) => handleLinkClick(e, '#faq')} className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">FAQ</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-display">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#blog" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Coding Guides</a></li>
                <li><a href="#mocktests" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Mock Assessment</a></li>
                <li><a href="#leaderboards" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Cohort Ranks</a></li>
                <li><a href="#universities" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Partnerships</a></li>
              </ul>
            </div>

            {/* Column 4: Legal & Contact */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-display">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#about" onClick={(e) => handleLinkClick(e, '#about')} className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">About Us</a></li>
                <li><a href="#careers" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans inline-flex items-center gap-1.5">Careers <span className="px-1.5 py-0.5 text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-semibold rounded-full border border-purple-100 dark:border-purple-900/50">Hiring</span></a></li>
                <li><a href="#privacy" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Privacy Policy</a></li>
                <li><a href="#terms" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar Section */}
          <div className="pt-8 border-t border-purple-100/60 dark:border-zinc-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p className="text-slate-400 dark:text-zinc-550 font-sans">
              © {new Date().getFullYear()} Self Ranker. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 px-3 py-1.5 rounded-full border border-slate-100 dark:border-zinc-800/80">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium font-sans">All Systems Operational</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
