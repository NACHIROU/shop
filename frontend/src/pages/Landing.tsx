import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, MessageCircle, BarChart3, Package, Users, Activity,
  CheckCircle, ShieldCheck, Zap, ChevronDown, ChevronUp, X, ArrowUp,
  Globe, MapPin, Star
} from 'lucide-react';

/* ─── Constants ─────────────────────────────── */
const PHONE_DISPLAY = '6751898';
const PHONE_WA = '2296751898';
const WHATSAPP_URL = `https://wa.me/${PHONE_WA}`;

/* ─── Feature Card ───────────────────────────── */
function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="group p-8 bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="inline-flex mb-6 text-stone-800">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-3">{title}</h3>
      <p className="text-stone-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Step Card ──────────────────────────────── */
function StepCard({ number, title, description }: any) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-stone-100 flex items-center justify-center text-stone-800 font-bold text-lg border border-stone-200">
          {number}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-stone-900 text-lg mb-2">{title}</h3>
        <p className="text-stone-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Testimonial Card ──────────────────────── */
function TestimonialCard({ name, role, company, text, initials }: any) {
  return (
    <div className="bg-white p-8 border border-stone-200 shadow-sm flex flex-col gap-6">
      <p className="text-stone-600 text-sm leading-relaxed flex-grow italic">"{text}"</p>
      <div className="flex items-center gap-4 pt-4 border-t border-stone-100">
        <div className="w-10 h-10 bg-stone-100 flex items-center justify-center text-stone-800 font-bold text-sm border border-stone-200">
          {initials}
        </div>
        <div>
          <div className="font-semibold text-stone-900 text-sm">{name}</div>
          <div className="text-xs text-stone-500">{role} — {company}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Item ───────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left hover:bg-stone-50 transition-colors px-4"
      >
        <span className="font-semibold text-stone-900">{q}</span>
        {open
          ? <ChevronUp className="h-5 w-5 text-stone-600 flex-shrink-0" />
          : <ChevronDown className="h-5 w-5 text-stone-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-6 text-stone-600 text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-900 font-sans selection:bg-stone-800 selection:text-stone-100">
      
      {/* ── ANNOUNCEMENT BANNER ──────────────── */}
      {!bannerDismissed && (
        <div className="bg-stone-800 text-stone-100 text-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 justify-center flex-wrap">
              <span>Nouveau : Module de gestion des dépenses avec export PDF disponible.</span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="flex-shrink-0 p-1 hover:bg-stone-700 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── NAV ──────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#f5f5f0]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="EM Logo" className="h-10 w-auto rounded-md shadow-sm mix-blend-multiply" />
            <span className="text-xl font-bold tracking-tight text-stone-800 uppercase">
              EasyManaging
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-stone-600 uppercase tracking-widest">
            <a href="#features" className="hover:text-stone-900 transition-colors">Fonctionnalités</a>
            <a href="#how" className="hover:text-stone-900 transition-colors">Démarche</a>
            <a href="#testimonials" className="hover:text-stone-900 transition-colors">Avis</a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-all uppercase tracking-widest"
            >
              Contact
            </a>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-2.5 bg-stone-800 text-stone-100 font-semibold text-sm hover:bg-stone-900 transition-colors uppercase tracking-widest"
            >
              Connexion
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────── */}
      <section 
        className="relative py-32 px-4 sm:px-6 lg:px-8 border-b border-stone-200 bg-cover bg-center"
        style={{ backgroundImage: 'url("/merchant_hero.jpg")' }}
      >
        <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-stone-50 mb-8 leading-tight">
            Gérez votre boutique intelligemment
          </h1>

          <p className="text-lg md:text-xl text-stone-200 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
            Centralisez les stocks, les équipes, les tâches et les finances dans une interface épurée conçue pour les commerçants exigeants.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-stone-100 text-stone-900 font-semibold text-lg hover:bg-white transition-colors uppercase tracking-widest"
            >
              Accéder maintenant
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-8 py-4 border border-stone-400 text-stone-100 font-semibold text-lg hover:bg-stone-800 transition-colors uppercase tracking-widest"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 border-t border-stone-500/50 pt-8">
            {['Zéro configuration', 'Multi-rôles', 'Sécurisé & audité'].map((tag) => (
              <div key={tag} className="flex items-center gap-2 text-sm text-stone-300 font-medium uppercase tracking-widest">
                <CheckCircle className="h-4 w-4" />
                {tag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────── */}
      <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Fonctionnalités</p>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
              L'essentiel pour piloter votre activité
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────── */}
      <section id="how" className="py-32 px-4 sm:px-6 lg:px-8 bg-[#f5f5f0] border-y border-stone-200">
        <div className="max-w-4xl mx-auto">
          <div className="mb-20 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Processus simplifié</p>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
              Démarrez en 3 étapes
            </h2>
          </div>
          <div className="space-y-12">
            <StepCard number="01" title="Créez votre compte marchand" description="Contactez-nous pour activer votre espace. Configuration rapide, aucune compétence technique requise." />
            <StepCard number="02" title="Ajoutez vos produits & équipe" description="Importez votre catalogue, créez vos catégories et invitez vos collaborateurs avec les bonnes permissions." />
            <StepCard number="03" title="Pilotez et décidez" description="Suivez en continu vos ventes, tâches et performances financières pour faire croître votre activité." />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────── */}
      <section id="testimonials" className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Témoignages</p>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
              Retours de marchands
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map(t => <TestimonialCard key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────── */}
      <section id="faq" className="py-32 px-4 sm:px-6 lg:px-8 bg-[#f5f5f0] border-t border-stone-200">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Questions fréquentes
            </h2>
          </div>
          <div className="border-t border-stone-200">
            {faqs.map(f => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer className="bg-stone-900 text-stone-400 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 pb-16 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.jpg" alt="EM Logo" className="h-10 w-auto rounded-md mix-blend-screen opacity-90" />
                <span className="text-xl font-bold text-stone-100 uppercase tracking-widest block">
                  EasyManaging
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-8 max-w-sm">
                La plateforme SaaS de gestion commerciale sobre et efficace pensée pour les marchands modernes.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-stone-100 hover:text-stone-300 transition-colors uppercase tracking-widest text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" /> Nous contacter
              </a>
            </div>

            <div>
              <h4 className="font-semibold text-stone-100 mb-6 uppercase tracking-widest text-sm">Produit</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#features" className="hover:text-stone-100 transition-colors">Fonctionnalités</a></li>
                <li><a href="#how" className="hover:text-stone-100 transition-colors">Démarche</a></li>
                <li><span className="hover:text-stone-100 transition-colors cursor-default">Accès & Rôles</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-stone-100 mb-6 uppercase tracking-widest text-sm">Informations</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Globe className="h-4 w-4 mt-0.5" />
                  <span>Lun – Sam, 8h – 20h</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>Bénin & Afrique de l'Ouest</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs uppercase tracking-widest text-stone-500">
            <p>© {new Date().getFullYear()} EasyManaging.</p>
            <div className="flex gap-8">
              <span className="hover:text-stone-300 transition-colors cursor-default">Confidentialité</span>
              <span className="hover:text-stone-300 transition-colors cursor-default">Conditions</span>
            </div>
          </div>
        </div>
      </footer>
      
      {/* ── BACK TO TOP ──────────────────────── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-6 z-50 w-12 h-12 bg-stone-800 text-stone-100 rounded-full shadow-lg flex items-center justify-center hover:bg-stone-900 transition-all duration-200"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/* ─── Static Data ────────────────────────────── */

const features = [
  { icon: <Package className="h-6 w-6" />, title: 'Gestion des Stocks', description: 'Inventaire structuré avec alertes de stock faible.' },
  { icon: <Activity className="h-6 w-6" />, title: 'Suivi des Tâches', description: 'Assignez des livraisons et suivez les statuts en continu.' },
  { icon: <BarChart3 className="h-6 w-6" />, title: 'Rapports Financiers', description: 'Vue claire des revenus, bénéfices et dépenses.' },
  { icon: <Users className="h-6 w-6" />, title: 'Multi-Collaborateurs', description: 'Accès restreints pour sécuriser la délégation.' },
  { icon: <ShieldCheck className="h-6 w-6" />, title: 'Sécurité & Audit', description: 'Journaux détaillés et traçabilité de chaque action.' },
  { icon: <Zap className="h-6 w-6" />, title: 'Haute Disponibilité', description: 'Interface rapide et fluide, adaptée à tous les écrans.' },
];

const testimonials = [
  {
    name: 'Amédée K.',
    role: 'Gérant',
    company: 'PhoneZone',
    text: 'Une interface sobre qui va droit au but. Parfait pour se concentrer sur l\'essentiel.',
    initials: 'AK',
  },
  {
    name: 'Fatoumata D.',
    role: 'Responsable',
    company: 'TechStore',
    text: 'L\'absence de distractions visuelles permet à mon équipe d\'être plus efficace.',
    initials: 'FD',
  },
  {
    name: 'Rodrigue A.',
    role: 'Admin',
    company: 'GadgetHub',
    text: 'Exactement ce qu\'il nous fallait. Un outil professionnel, clair et sécurisé.',
    initials: 'RA',
  },
];

const faqs = [
  {
    q: 'Comment activer mon compte ?',
    a: 'Contactez-nous, nous configurons votre espace en quelques heures. Aucune installation technique n\'est requise.',
  },
  {
    q: 'Puis-je limiter l\'accès de mes employés ?',
    a: 'Oui, chaque collaborateur dispose d\'un profil avec des permissions strictement définies par vos soins.',
  },
  {
    q: 'L\'outil est-il adapté aux connexions lentes ?',
    a: 'Totalement. Le design minimaliste et l\'architecture robuste garantissent des temps de chargement très courts.',
  },
];
