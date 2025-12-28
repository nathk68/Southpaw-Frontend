'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Link as LinkIcon, LogOut, User } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import Link from 'next/link';
import gsap from 'gsap';
import { useAuth } from '@/contexts/AuthContext';
import { EmailLoginModal } from './EmailLoginModal';

// --- Custom Cursor ---
export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Désactivé sur mobile
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;

    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current && followerRef.current) {
        gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0 });
        gsap.to(followerRef.current, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power2.out" });
      }
    };

    const handleMouseEnter = () => {
      if (cursorRef.current && followerRef.current) {
        gsap.to(cursorRef.current, { scale: 1.5, duration: 0.3 });
        gsap.to(followerRef.current, { scale: 1.8, duration: 0.3 });
      }
    };

    const handleMouseLeave = () => {
      if (cursorRef.current && followerRef.current) {
        gsap.to(cursorRef.current, { scale: 1, duration: 0.3 });
        gsap.to(followerRef.current, { scale: 1, duration: 0.3 });
      }
    };

    window.addEventListener('mousemove', moveCursor);

    // Add hover effects on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, [role="button"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="fixed w-3 h-3 bg-brand-lime rounded-full pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 hidden md:block lime-glow" />
      <div ref={followerRef} className="fixed w-10 h-10 border-2 border-brand-lime/50 rounded-full pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 hidden md:block" />
    </>
  );
};


// --- Navbar ---
export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, access, loading, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-brand-black/90 backdrop-blur-md border-b border-brand-lime/20 py-4 shadow-lg shadow-brand-lime/5' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 group-hover:scale-110 transition-all duration-300">
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="20" fill="#050505"/>
              <g transform="translate(20, 20) scale(0.6)">
                <path d="M70 0H30L15 45H65L70 0Z" fill="#CCFF00" className="lime-glow"/>
                <path d="M30 100H70L85 55H35L30 100Z" fill="#F0F0F0"/>
              </g>
            </svg>
          </div>
          <span className="font-display font-bold text-2xl tracking-tighter text-white group-hover:text-brand-lime transition-colors duration-300">SOUTHPAW</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-mono text-sm text-brand-white/70">
          <Link href="/algorithm" className="hover:text-brand-lime transition-colors duration-300 relative group">
            ALGORITHME
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-lime group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link href="/fight-card" className="hover:text-brand-lime transition-colors duration-300 relative group">
            FIGHT CARD
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-lime group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link href="/stats" className="hover:text-brand-lime transition-colors duration-300 relative group">
            STATS
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-lime group-hover:w-full transition-all duration-300"></span>
          </Link>
          <a
            href="https://discord.gg/Aappan5y8Z"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border-2 border-brand-lime/40 hover:border-brand-lime text-brand-lime hover:bg-brand-lime hover:text-black transition-all duration-300 clip-path-card group"
          >
            <FaDiscord size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="font-mono text-sm font-bold">DISCORD</span>
          </a>

          {!loading && !user && (
            <>
              <button
                onClick={() => setShowEmailModal(true)}
                className="bg-transparent border border-brand-lime text-brand-lime px-6 py-2 hover:bg-brand-lime hover:text-black transition-all duration-300 font-bold clip-path-card text-xs tracking-wider relative overflow-hidden group"
              >
                <span className="relative z-10">CONNEXION</span>
                <span className="absolute inset-0 bg-brand-lime transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
              <EmailLoginModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSuccess={() => setShowEmailModal(false)}
              />
            </>
          )}

          {!loading && user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-brand-lime/40 hover:border-brand-lime text-brand-lime hover:bg-brand-lime/10 transition-all duration-300 clip-path-card"
              >
                <User size={16} />
                <span className="font-mono text-xs font-bold uppercase">
                  {user.username || user.email || 'User'}
                </span>
                {access?.hasAccess && (
                  <span className="w-2 h-2 bg-brand-lime rounded-full"></span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-brand-dark border-2 border-brand-lime/30 shadow-lg shadow-brand-lime/10">
                  <div className="p-4 border-b border-brand-lime/20">
                    <div className="text-xs text-gray-500 font-mono mb-1">STATUT</div>
                    {access?.isPro && (
                      <div className="text-brand-lime font-mono text-sm font-bold">SOUTHPAW PRO</div>
                    )}
                    {access?.isPPV && !access?.isPro && (
                      <div className="text-brand-lime font-mono text-sm font-bold">PPV PASS</div>
                    )}
                    {!access?.hasAccess && (
                      <div className="text-gray-400 font-mono text-sm">AUCUN ABONNEMENT</div>
                    )}
                  </div>

                  {!access?.hasAccess && (
                    <div className="p-3 border-b border-brand-lime/20 space-y-2">
                      <a
                        href="https://whop.com/checkout/plan_DjGRIqi0cbxc4"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-3 py-2 bg-brand-lime text-black text-center font-mono text-xs font-bold hover:bg-brand-lime/90 transition-colors"
                      >
                        SOUTHPAW PRO
                      </a>
                      <a
                        href="https://whop.com/checkout/plan_hOMobCScuCYPM"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-3 py-2 border border-brand-lime text-brand-lime text-center font-mono text-xs font-bold hover:bg-brand-lime/10 transition-colors"
                      >
                        PPV PASS
                      </a>
                    </div>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-mono text-sm"
                  >
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-brand-black border-b border-white/10 p-6 flex flex-col gap-4 font-display text-xl text-white">
          <Link href="/algorithm" onClick={() => setMobileMenuOpen(false)}>ALGORITHME</Link>
          <Link href="/fight-card" onClick={() => setMobileMenuOpen(false)}>FIGHT CARD</Link>
          <Link href="/stats" onClick={() => setMobileMenuOpen(false)}>STATS</Link>
          <a
            href="https://discord.gg/Aappan5y8Z"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-brand-lime border-2 border-brand-lime/40 px-4 py-3 hover:bg-brand-lime hover:text-black transition-all"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaDiscord size={20} />
            <span>DISCORD</span>
          </a>

          {!loading && !user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowEmailModal(true);
              }}
              className="border-2 border-brand-lime text-brand-lime px-4 py-3 hover:bg-brand-lime hover:text-black transition-all font-bold"
            >
              CONNEXION
            </button>
          )}

          {!loading && user && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="text-sm text-gray-400">
                Connecté: {user.username || user.email}
              </div>
              {access?.hasAccess ? (
                <div className="text-brand-lime font-bold">
                  {access.isPro ? 'SOUTHPAW PRO' : 'PPV PASS'}
                </div>
              ) : (
                <div className="space-y-2">
                  <a
                    href="https://whop.com/checkout/plan_DjGRIqi0cbxc4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2 bg-brand-lime text-black text-center font-bold"
                  >
                    SOUTHPAW PRO
                  </a>
                  <a
                    href="https://whop.com/checkout/plan_hOMobCScuCYPM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2 border-2 border-brand-lime text-brand-lime text-center font-bold"
                  >
                    PPV PASS
                  </a>
                </div>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-600 text-gray-400 hover:text-white"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// --- Footer ---
export const Footer = () => (
  <footer className="relative border-t-2 border-white/10 bg-brand-dark/50 backdrop-blur-sm z-30">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Branding */}
        <div>
          <h3 className="font-display text-2xl font-bold mb-4">
            SOUTHPAW<span className="text-brand-lime">.</span>
          </h3>
          <p className="text-gray-400 text-sm">
            L&apos;algorithme prédictif ultime pour l&apos;UFC
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="font-mono text-sm font-bold mb-4 text-brand-lime">NAVIGATION</h4>
          <ul className="space-y-2">
            <li><a href="/" className="text-gray-400 hover:text-brand-lime transition-colors">Accueil</a></li>
            <li><a href="/algorithm" className="text-gray-400 hover:text-brand-lime transition-colors">Algorithme</a></li>
            <li><a href="/fight-card" className="text-gray-400 hover:text-brand-lime transition-colors">Fight Card</a></li>
            <li><a href="/stats" className="text-gray-400 hover:text-brand-lime transition-colors">Stats</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-mono text-sm font-bold mb-4 text-brand-lime">LÉGAL</h4>
          <ul className="space-y-2">
            <li><a href="/legal" className="text-gray-400 hover:text-brand-lime transition-colors">Mentions légales</a></li>
            <li><a href="/privacy" className="text-gray-400 hover:text-brand-lime transition-colors">Confidentialité</a></li>
          </ul>
          <p className="text-gray-500 text-xs mt-4">
            ⚠️ Les paris peuvent créer une dépendance.
          </p>
        </div>

        {/* Community */}
        <div>
          <h4 className="font-mono text-sm font-bold mb-4 text-brand-lime">COMMUNAUTÉ</h4>
          <a
            href="https://discord.gg/Aappan5y8Z"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-brand-lime text-black font-mono font-bold uppercase clip-path-card hover:shadow-lg hover:shadow-brand-lime/50 transition-all duration-300 hover:scale-105 group"
          >
            <FaDiscord size={20} className="group-hover:rotate-12 transition-transform" />
            Rejoindre Discord
          </a>
          <p className="text-gray-500 text-xs mt-3">
            Accès anticipé • Analyses exclusives • Communauté VIP
          </p>
        </div>
      </div>

      {/* Disclaimer légal */}
      <div className="border-t border-white/10 mt-8 pt-6">
        <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 mb-6">
          <p className="text-orange-400 text-xs font-mono leading-relaxed">
            <strong className="font-bold">⚠️ DISCLAIMER IMPORTANT :</strong> Southpaw est un outil d&apos;analyse statistique à but éducatif et informatif uniquement.
            Nous ne sommes PAS un bookmaker et n&apos;offrons AUCUN service de paris. Les prédictions fournies ne constituent en AUCUN CAS un conseil financier,
            une incitation au pari ou une garantie de résultat. Vous êtes seul responsable de vos décisions. Les paris sportifs comportent des risques financiers
            et peuvent créer une dépendance. <strong>Interdit aux mineurs (-18 ans).</strong> Jouez responsablement. En cas de problème :
            <a href="tel:0974751313" className="text-brand-lime hover:underline ml-1">09 74 75 13 13</a> (Joueurs Info Service).
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
          <p>© 2025 Southpaw - Nathan Kiss. Propulsé par l&apos;IA & la data UFC. Non affilié à l&apos;UFC®.</p>
          <div className="flex gap-4">
            <a href="/legal" className="hover:text-brand-lime transition-colors">Mentions légales</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-brand-lime transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// --- Marquee Content ---
const MarqueeContent = () => (
  <>
    <span>SOUTHPAW ANALYTICS</span>
    <span>///</span>
    <span>KO PREDICTION</span>
    <span>///</span>
    <span>SUBMISSION ARTS</span>
    <span>///</span>
    <span>UFC STATS</span>
    <span>///</span>
    <span>FIGHT IQ</span>
    <span>///</span>
    <span>DATA DRIVEN</span>
    <span>///</span>
    <span>NO EMOTIONS</span>
    <span>///</span>
    <span>JUST MATH</span>
    <span>///</span>
  </>
);

// --- Marquee ---
export const Marquee = () => {
  return (
    <div className="py-6 bg-brand-lime overflow-hidden -rotate-1 scale-105 translate-y-8 relative border-y-4 border-brand-lime shadow-2xl shadow-brand-lime/20" style={{ zIndex: 20 }}>
      <div className="flex">
        <div className="whitespace-nowrap flex gap-8 animate-marquee font-display font-black text-4xl text-black">
          <MarqueeContent />
          <MarqueeContent />
          <MarqueeContent />
          <MarqueeContent />
        </div>
      </div>
    </div>
  );
};