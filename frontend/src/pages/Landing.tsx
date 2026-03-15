import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, MessageCircle, BarChart3, Package, Users, Activity,
  CheckCircle, TrendingUp, ShieldCheck, Zap, ChevronRight,
  Globe, MapPin, Star, ChevronDown, ChevronUp, X, ArrowUp,
  Code2, Database, Server, Layers, Cpu
} from 'lucide-react';

/* ─── Constants ─────────────────────────────── */
const PHONE_DISPLAY = '6751898';
const PHONE_WA = '2296751898';
const WHATSAPP_URL = `https://wa.me/${PHONE_WA}`;

/* ─── Animated Counter Hook ─────────────────── */
function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

/* ─── Floating Badge ─────────────────────────── */
function FloatingBadge({ icon, text, color, delay = '0s', top, right, left, bottom }: any) {
  return (
    <div
      className={`absolute z-10 flex items-center gap-2 bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100 text-sm font-semibold ${color} animate-float`}
      style={{ top, right, left, bottom, animationDelay: delay }}
    >
      {icon}
      {text}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────── */
function StatCard({ target, suffix, label, color }: any) {
  const { count, ref } = useCounter(target);
  return (
    <div ref={ref} className="text-center p-6">
      <div className={`text-4xl md:text-5xl font-black ${color} mb-1`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

/* ─── Feature Card ───────────────────────────── */
function FeatureCard({ icon, title, description, iconBg, delay = '0s' }: any) {
  return (
    <div
      className="group rounded-3xl p-7 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      <div className={`inline-flex p-3 rounded-2xl mb-4 ${iconBg}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Step Card ──────────────────────────────── */
function StepCard({ number, title, description }: any) {
  return (
    <div className="relative flex gap-5">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200">
          {number}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Testimonial Card ──────────────────────── */
function TestimonialCard({ name, role, company, text, rating, initials, color }: any) {
  return (
    <div className="bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4">
      <div className="flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
        ))}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed flex-grow">"{text}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}>
          {initials}
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm">{name}</div>
          <div className="text-xs text-gray-400">{role} — {company}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Item ───────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50/80 transition-colors"
      >
        <span className="font-semibold text-gray-900">{q}</span>
        {open
          ? <ChevronUp className="h-5 w-5 text-orange-500 flex-shrink-0" />
          : <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-50">
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Live Ticker ────────────────────────────── */
function LiveTicker() {
  const [merchants, setMerchants] = useState(127);
  useEffect(() => {
    const interval = setInterval(() => {
      setMerchants(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="py-4 bg-gray-950 border-b border-white/5 overflow-hidden">
      <div className="flex items-center justify-center gap-3 text-sm text-white/60 flex-wrap px-4">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-emerald-400">{merchants} marchands</span>
        <span>utilisent EasyManaging en ce moment</span>
        <span className="hidden sm:inline text-white/20">•</span>
        <span className="hidden sm:inline">Nouvelle fonctionnalité :</span>
        <a href="#features" className="hidden sm:inline text-orange-400 font-medium hover:text-orange-300 transition-colors">
          Suivi GPS des livraisons →
        </a>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  /* Scroll listener for back-to-top */
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(3deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes slide-up-fade {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes gif-pan {
          0%   { transform: scale(1.06) translate(0%, 0%); }
          25%  { transform: scale(1.06) translate(-1.5%, -1%); }
          50%  { transform: scale(1.06) translate(-2%, 1%); }
          75%  { transform: scale(1.06) translate(-0.5%, -0.5%); }
          100% { transform: scale(1.06) translate(0%, 0%); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-gif-pan { animation: gif-pan 8s ease-in-out infinite; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
        .animate-slide-up { animation: slide-up-fade 0.7s ease-out both; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-slide-down { animation: slide-down 0.4s ease-out; }
        .hero-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(251,191,36,0.12) 1px, transparent 0);
          background-size: 32px 32px;
        }
        .glass {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .tech-badge:hover { transform: translateY(-3px); }
        .tech-badge { transition: transform 0.2s ease; }
      `}</style>

      {/* ── LIVE TICKER ──────────────────────── */}
      <LiveTicker />

      {/* ── ANNOUNCEMENT BANNER ──────────────── */}
      {!bannerDismissed && (
        <div className="bg-orange-500 text-white text-sm animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 justify-center flex-wrap">
              <span className="font-bold">🆕 Nouveau :</span>
              <span>Module de gestion des dépenses avec export PDF disponible.</span>
              <a href="#features" className="underline font-semibold hover:no-underline whitespace-nowrap">
                Découvrir →
              </a>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── NAV ──────────────────────────────── */}
      <nav className="sticky top-0 z-50 glass shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
              <span className="text-white font-black text-base">E</span>
            </div>
            <span className="text-xl font-black tracking-tight">
              Easy<span className="text-orange-500">Managing</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-orange-500 transition-colors">Fonctionnalités</a>
            <a href="#preview" className="hover:text-orange-500 transition-colors">Aperçu</a>
            <a href="#testimonials" className="hover:text-orange-500 transition-colors">Avis</a>
            <a href="#faq" className="hover:text-orange-500 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-all"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </a>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-md shadow-orange-200 hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Connexion <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">

        {/* ── HERO ─────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-amber-50/40">
          <div className="absolute inset-0 hero-pattern opacity-70" />
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-100/60 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-orange-100/50 rounded-full blur-[100px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold mb-6 animate-slide-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                Plateforme SaaS de gestion commerciale
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Gérez votre<br />
                boutique{' '}
                <span className="text-orange-500">intelligemment</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Centralisez <b className="text-gray-700">stocks</b>, <b className="text-gray-700">équipes</b>, <b className="text-gray-700">tâches</b> et <b className="text-gray-700">finances</b> dans une interface conçue pour les commerçants exigeants.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={() => navigate('/login')}
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-orange-500 text-white font-bold text-lg shadow-xl shadow-orange-200 hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Accéder maintenant
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-emerald-300 text-gray-700 font-bold text-lg transition-all duration-200 hover:shadow-lg"
                >
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  WhatsApp
                </a>
              </div>

              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                {['Zéro configuration', 'Multi-rôles', 'Sécurisé & audité'].map((tag) => (
                  <div key={tag} className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — hero image */}
            <div className="relative flex justify-center items-center animate-slide-up" style={{ animationDelay: '0.35s' }}>
              <div className="absolute w-[480px] h-[480px] rounded-full border-2 border-dashed border-orange-100 animate-spin-slow" />
              <div className="absolute w-[380px] h-[380px] rounded-full border border-amber-100 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
              <div className="relative z-10 w-full max-w-lg">
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-orange-100/80 ring-1 ring-orange-50 rotate-1 hover:rotate-0 transition-transform duration-500">
                  <img src="/hero_dashboard.png" alt="Dashboard EasyManaging" className="w-full object-cover" />
                </div>
                <FloatingBadge icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} text="+24% ce mois" color="text-emerald-700" delay="0s" top="-20px" right="-10px" />
                <FloatingBadge icon={<Package className="h-4 w-4 text-orange-600" />} text="1 248 produits" color="text-orange-700" delay="1s" bottom="30px" left="-20px" />
                <FloatingBadge icon={<Users className="h-4 w-4 text-violet-600" />} text="Équipe connectée" color="text-violet-700" delay="2s" top="40%" right="-30px" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 text-xs animate-bounce">
            <span>Défiler</span>
            <ChevronRight className="h-4 w-4 rotate-90" />
          </div>
        </section>

        {/* ── STATS RIBBON ─────────────────────── */}
        <section className="py-8 bg-white border-y border-gray-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            <StatCard target={500} suffix="+" label="Produits gérés" color="text-amber-500" />
            <StatCard target={98} suffix="%" label="Satisfaction client" color="text-orange-500" />
            <StatCard target={3} suffix="" label="Niveaux d'accès" color="text-violet-500" />
            <StatCard target={100} suffix="%" label="Sécurisé & privé" color="text-emerald-500" />
          </div>
        </section>

        {/* ── PREVIEW / DEMO ───────────────────── */}
        <section id="preview" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Aperçu du produit</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                Des tableaux de bord <span className="text-orange-500">qui parlent d'eux-mêmes</span>
              </h2>
            </div>

            {/* GIF Demo */}
            <div className="relative max-w-4xl mx-auto mb-10">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-300/40 bg-white">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-4 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono border border-gray-200">
                    app.easymanaging.com/dashboard
                  </div>
                  {/* GIF badge */}
                  <span className="ml-2 flex-shrink-0 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-md tracking-wider">GIF</span>
                </div>
                {/* Animated GIF content */}
                <div className="relative overflow-hidden" style={{ maxHeight: '480px' }}>
                  <img
                    src="/demo_gif.png"
                    alt="Aperçu animé du tableau de bord EasyManaging"
                    className="w-full object-cover object-top animate-gif-pan"
                  />
                  {/* Scanline overlay for GIF feel */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 4px)',
                    }}
                  />
                </div>
              </div>
              {/* Caption below */}
              <p className="text-center text-sm text-gray-400 mt-3">
                ↑ Aperçu animé — tableau de bord EasyManaging en action
              </p>
            </div>

            {/* Two analytics cards */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="group relative rounded-3xl overflow-hidden shadow-xl shadow-gray-200 ring-1 ring-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <img src="/hero_dashboard.png" alt="Tableau de bord" className="w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-black/60 text-white">
                  <h3 className="font-bold text-lg">Tableau de bord Admin</h3>
                  <p className="text-white/70 text-sm">Revenus, stocks, commandes en temps réel</p>
                </div>
              </div>
              <div className="group relative rounded-3xl overflow-hidden shadow-xl shadow-gray-200 ring-1 ring-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <img src="/analytics_mockup.png" alt="Analytiques" className="w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-black/60 text-white">
                  <h3 className="font-bold text-lg">Graphiques & Analytiques</h3>
                  <p className="text-white/70 text-sm">Suivez votre croissance mois par mois</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────── */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Fonctionnalités</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">
                Tout pour piloter votre activité
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">De la gestion des produits à la supervision des équipes, EasyManaging couvre l'essentiel du quotidien d'un commerçant.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <FeatureCard key={f.title} {...f} delay={`${i * 0.07}s`} />
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────── */}
        <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Témoignages</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">
                Ce que disent nos marchands
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">Des professionnels du commerce qui ont transformé leur gestion quotidienne grâce à EasyManaging.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map(t => <TestimonialCard key={t.name} {...t} />)}
            </div>
            {/* Rating summary */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-6 w-6 fill-orange-400 text-orange-400" />)}
              </div>
              <div className="text-gray-600">
                <span className="font-bold text-gray-900 text-xl">4.9/5</span>
                {' '}sur la base de 50+ avis marchands
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────── */}
        <section id="how" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative flex justify-center">
              <div className="relative max-w-sm w-full">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-200">
                  <img src="/hero_illustration.png" alt="Comment ça marche" className="w-full object-cover" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4">Processus simplifié</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-10">
                Démarrez en <span className="text-orange-500">3 étapes</span> seulement
              </h2>
              <div className="space-y-8">
                <StepCard number="01" title="Créez votre compte merchant" description="Contactez-nous pour activer votre espace. Configuration rapide, pas de compétence technique requise." />
                <StepCard number="02" title="Ajoutez vos produits & équipe" description="Importez votre catalogue, créez vos catégories et invitez vos collaborateurs avec les bons droits." />
                <StepCard number="03" title="Pilotez et décidez" description="Suivez en temps réel vos ventes, tâches et bénéfices depuis votre tableau de bord personnalisé." />
              </div>
            </div>
          </div>
        </section>

        {/* ── TECH STACK ───────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">Stack Technique</p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                Construit avec des technologies <span className="text-orange-400">éprouvées</span>
              </h2>
              <p className="text-white/40 max-w-xl mx-auto text-sm">
                Chaque couche de l'architecture a été pensée pour la performance, la sécurité et la facilité de maintenance.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {techStack.map(tech => (
                <div key={tech.name} className={`tech-badge flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 hover:bg-white/10 transition-colors cursor-default`}>
                  <div className={`p-2 rounded-xl ${tech.iconBg}`}>
                    {tech.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-sm">{tech.name}</div>
                    <div className="text-white/30 text-xs mt-0.5">{tech.role}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center text-white/30 text-sm">
              Architecture RESTful · Déploiement cloud · Données chiffrées en transit et au repos
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────── */}
        <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">FAQ</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">
                Questions fréquentes
              </h2>
              <p className="text-gray-500">Tout ce que vous devez savoir avant de commencer.</p>
            </div>
            <div className="space-y-3">
              {faqs.map(f => <FaqItem key={f.q} {...f} />)}
            </div>
            <div className="mt-10 text-center p-6 rounded-2xl bg-orange-50 border border-orange-100">
              <p className="text-gray-600 mb-3">Vous avez une autre question ?</p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#20bd5a] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Posez-la nous sur WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────── */}
        <section id="contact" className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center bg-orange-500">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
              <div className="relative z-10">
                <div className="inline-flex p-4 bg-white/20 rounded-2xl mb-6">
                  <MessageCircle className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  Prêt à révolutionner votre gestion ?
                </h2>
                <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                  Contactez-nous sur WhatsApp pour une démonstration personnalisée. Notre équipe vous accompagne de A à Z.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <MessageCircle className="h-6 w-6 text-[#25D366]" />
                    Discuter sur WhatsApp
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white/40 text-white font-bold text-lg rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Me connecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────── */}
        <footer className="relative overflow-hidden bg-gray-950 text-white pt-16 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-md">
                    <span className="text-white font-black text-lg">E</span>
                  </div>
                  <span className="text-xl font-black">EasyManaging</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                  La plateforme SaaS de gestion commerciale pensée pour les marchands africains modernes.
                </p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white font-semibold rounded-xl text-sm hover:bg-[#20bd5a] transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>

              {/* Product */}
              <div>
                <h4 className="font-bold text-white mb-4">Produit</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  {['Tableau de bord', 'Gestion des stocks', 'Suivi des tâches', 'Rapports financiers', 'Gestion des équipes', 'Audit & Journaux'].map(link => (
                    <li key={link}><a href="#features" className="hover:text-orange-400 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>

              {/* Roles */}
              <div>
                <h4 className="font-bold text-white mb-4">Accès & Rôles</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  {['Super Administrateur', 'Administrateur marchand', 'Collaborateur', 'Connexion sécurisée', 'Invitations par lien'].map(link => (
                    <li key={link}><span className="hover:text-orange-400 transition-colors cursor-default">{link}</span></li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-bold text-white mb-4">Nous contacter</h4>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-orange-400 transition-colors">
                      <MessageCircle className="h-4 w-4 mt-0.5 text-[#25D366] flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-white">WhatsApp</div>
                        <div>+229 {PHONE_DISPLAY}</div>
                      </div>
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <Globe className="h-4 w-4 mt-0.5 text-orange-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Disponibilité</div>
                      <div>Lun – Sam, 8h – 20h</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-orange-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Zone couverte</div>
                      <div>Bénin & Afrique de l'Ouest</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Données sécurisées</div>
                      <div>Chiffrement bout-en-bout</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <p>© {new Date().getFullYear()} EasyManaging. Tous droits réservés.</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span>Plateforme opérationnelle</span>
              </div>
              <div className="flex gap-6">
                <span className="hover:text-orange-400 transition-colors cursor-default">Confidentialité</span>
                <span className="hover:text-orange-400 transition-colors cursor-default">Conditions d'utilisation</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ── BACK TO TOP ──────────────────────── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-6 z-50 w-12 h-12 bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-300/40 flex items-center justify-center hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all duration-200 animate-slide-up"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}

/* ─── Static Data ────────────────────────────── */

const features = [
  { icon: <Package className="h-6 w-6 text-orange-600" />, iconBg: 'bg-orange-100', title: 'Gestion des Stocks', description: 'Organisez vos produits par catégories et fournisseurs. Inventaire en temps réel avec alertes de stock faible.' },
  { icon: <Activity className="h-6 w-6 text-rose-600" />, iconBg: 'bg-rose-100', title: 'Suivi des Tâches', description: 'Créez et assignez des tâches de livraison à vos collaborateurs. Suivez les statuts en temps réel.' },
  { icon: <BarChart3 className="h-6 w-6 text-sky-600" />, iconBg: 'bg-sky-100', title: 'Rapports Financiers', description: 'Graphiques interactifs de vos revenus, bénéfices et dépenses. Exportez vos données à tout moment.' },
  { icon: <Users className="h-6 w-6 text-violet-600" />, iconBg: 'bg-violet-100', title: 'Multi-Collaborateurs', description: 'Invitez des membres avec des permissions précises. Chaque rôle n\'accède qu\'à ce qui le concerne.' },
  { icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />, iconBg: 'bg-emerald-100', title: 'Sécurité & Audit', description: 'Journaux d\'audit détaillés et supervision SuperAdmin pour une traçabilité totale des actions.' },
  { icon: <Zap className="h-6 w-6 text-amber-600" />, iconBg: 'bg-amber-100', title: 'Rapide & Réactif', description: 'Interface fluide optimisée pour mobile et desktop. Conçue pour les environnements à connexion variable.' },
];

const testimonials = [
  {
    name: 'Amédée K.',
    role: 'Gérant de boutique',
    company: 'PhoneZone Cotonou',
    text: 'EasyManaging a complètement changé ma façon de gérer ma boutique. Je vois mes bénéfices en temps réel et mes collaborateurs savent exactement quoi faire chaque jour. Un outil indispensable.',
    rating: 5,
    initials: 'AK',
    color: 'bg-orange-500',
  },
  {
    name: 'Fatoumata D.',
    role: 'Responsable commerciale',
    company: 'TechStore Parakou',
    text: 'L\'interface est très propre et intuitive. J\'ai formé mon équipe en moins d\'une heure. Le tableau de bord financier nous aide à prendre de meilleures décisions au quotidien.',
    rating: 5,
    initials: 'FD',
    color: 'bg-violet-500',
  },
  {
    name: 'Rodrigue A.',
    role: 'Admin & Co-fondateur',
    company: 'GadgetHub Bénin',
    text: 'Le système de gestion des rôles est parfaitement pensé. Mes collaborateurs ont accès à ce dont ils ont besoin, pas plus. Le suivi des tâches de livraison est une vraie révolution pour nous.',
    rating: 5,
    initials: 'RA',
    color: 'bg-emerald-500',
  },
];

const faqs = [
  {
    q: 'Comment activer mon compte EasyManaging ?',
    a: 'Il vous suffit de nous contacter via WhatsApp. Notre équipe crée votre espace en moins de 24h et vous guide lors de la première configuration. Aucune compétence technique n\'est requise.',
  },
  {
    q: 'Combien de collaborateurs puis-je inviter ?',
    a: 'Il n\'y a pas de limite imposée. Vous pouvez inviter autant de collaborateurs que nécessaire, chacun avec son propre rôle et ses propres accès (vue limitée aux tâches, ou accès complet au stock).',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Absolument. Les données sont chiffrées en transit (HTTPS) et au repos. Chaque action est enregistrée dans les journaux d\'audit. Seuls les SuperAdmins ont une vue globale sur la plateforme.',
  },
  {
    q: 'La plateforme fonctionne-t-elle sur mobile ?',
    a: 'Oui. L\'interface est entièrement responsive et optimisée pour les smartphones, tablettes et ordinateurs. Elle est conçue pour fonctionner même avec une connexion internet lente.',
  },
  {
    q: 'Puis-je exporter mes rapports financiers ?',
    a: 'Oui, tous vos rapports (revenus, dépenses, bénéfices) sont exportables. Cette fonctionnalité est disponible directement depuis la section "Rapports" de votre tableau de bord.',
  },
  {
    q: 'EasyManaging est-il adapté à plusieurs boutiques ?',
    a: 'Oui. La plateforme supporte nativement un modèle multi-marchands. Un SuperAdmin peut superviser plusieurs boutiques indépendantes depuis un seul panneau de contrôle centralisé.',
  },
];

const techStack = [
  { name: 'React', role: 'Frontend', icon: <Layers className="h-6 w-6 text-sky-400" />, iconBg: 'bg-sky-400/10' },
  { name: 'TypeScript', role: 'Typage', icon: <Code2 className="h-6 w-6 text-blue-400" />, iconBg: 'bg-blue-400/10' },
  { name: 'FastAPI', role: 'Backend', icon: <Server className="h-6 w-6 text-teal-400" />, iconBg: 'bg-teal-400/10' },
  { name: 'Python', role: 'Logique', icon: <Cpu className="h-6 w-6 text-yellow-400" />, iconBg: 'bg-yellow-400/10' },
  { name: 'PostgreSQL', role: 'Base de données', icon: <Database className="h-6 w-6 text-indigo-400" />, iconBg: 'bg-indigo-400/10' },
  { name: 'Tailwind', role: 'Styling', icon: <Zap className="h-6 w-6 text-cyan-400" />, iconBg: 'bg-cyan-400/10' },
];
