'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, Brain, Zap, Target, CheckCircle, TrendingUp, Code } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import { Navbar, Footer, CustomCursor } from '@/components/LandingUI';
import { ThreeBackground } from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AlgorithmPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Petit délai pour s'assurer que le DOM est prêt
    const initAnimations = () => {
      // Hero Section Animations
      const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      heroTl
        .from('.hero-badge', {
          opacity: 0,
          scale: 0.5,
          y: -50,
          duration: 0.8,
        })
        .from('.hero-title .word', {
          opacity: 0,
          rotateX: -90,
          transformOrigin: 'top center',
          stagger: 0.1,
          duration: 1,
        }, '-=0.4')
        .from('.hero-subtitle', {
          opacity: 0,
          y: 30,
          duration: 0.8,
        }, '-=0.6')
        .from('.hero-cta', {
          opacity: 0,
          scale: 0.8,
          duration: 0.6,
        }, '-=0.4');

      // Hero Parallax
      gsap.to('.hero-title', {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: -150,
        scale: 0.9,
        opacity: 0.3,
      });

      // Pipeline Line Progressive Reveal
      gsap.fromTo('.pipeline-line',
        { scaleY: 0, transformOrigin: 'top' },
        {
          scaleY: 1,
          scrollTrigger: {
            trigger: pipelineRef.current,
            start: 'top 60%',
            end: 'bottom 80%',
            scrub: 0.5,
          },
          ease: 'none',
        }
      );

      // Pipeline Nodes Appear
      gsap.from('.pipeline-node', {
        scrollTrigger: {
          trigger: pipelineRef.current,
          start: 'top 60%',
        },
        scale: 0,
        rotation: 180,
        stagger: 0.2,
        duration: 0.6,
        ease: 'back.out(1.7)',
      });

      // Pipeline Cards Entrance
      gsap.from('.pipeline-card', {
        scrollTrigger: {
          trigger: pipelineRef.current,
          start: 'top 60%',
        },
        opacity: 0,
        x: (index: number) => index % 2 === 0 ? -100 : 100,
        stagger: 0.2,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Stats Counter Animation
      document.querySelectorAll('.stat-counter').forEach((counter) => {
        const target = counter as HTMLElement;
        const finalValue = parseFloat(target.getAttribute('data-value') || '0');

        gsap.to(target, {
          innerHTML: finalValue,
          duration: 2.5,
          ease: 'power2.out',
          snap: { innerHTML: finalValue % 1 === 0 ? 1 : 0.1 },
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 70%',
          },
          onUpdate: function() {
            const value = parseFloat(this.targets()[0].innerHTML);
            if (finalValue % 1 === 0) {
              this.targets()[0].innerHTML = Math.round(value).toString();
            } else {
              this.targets()[0].innerHTML = value.toFixed(1);
            }
          }
        });
      });

      // Stats Cards Scale Animation - initial state visible
      gsap.set('.stat-card', { opacity: 1, scale: 1 });

      gsap.from('.stat-card', {
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 70%',
        },
        scale: 0.8,
        opacity: 0,
        rotateY: -20,
        stagger: 0.15,
        duration: 1,
        ease: 'back.out(1.4)',
      });

      // Pillars initial state - make sure they're visible
      const pillarCards = document.querySelectorAll('.pillar-card');
      const pillarBars = document.querySelectorAll('.pillar-bar');

      if (pillarCards.length > 0) {
        gsap.set('.pillar-card', { opacity: 1 });
      }

      if (pillarBars.length > 0) {
        gsap.set('.pillar-bar', { scaleY: 1, transformOrigin: 'bottom' });

        // Pillars Progress Bars
        gsap.from('.pillar-bar', {
          scrollTrigger: {
            trigger: pillarsRef.current,
            start: 'top 70%',
          },
          scaleY: 0,
          transformOrigin: 'bottom',
          stagger: 0.1,
          duration: 1.5,
          ease: 'power3.out',
        });
      }

      // Pillars Cards
      if (pillarCards.length > 0) {
        gsap.from('.pillar-card', {
          scrollTrigger: {
            trigger: pillarsRef.current,
            start: 'top 70%',
          },
          opacity: 0,
          y: 80,
          rotateX: -30,
          stagger: 0.12,
          duration: 1,
          ease: 'power3.out',
        });
      }
    };

    // Utilise requestAnimationFrame pour s'assurer que le DOM est prêt
    const rafId = requestAnimationFrame(() => {
      initAnimations();
    });

    return () => {
      cancelAnimationFrame(rafId);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const pipelineSteps = [
    {
      icon: Database,
      title: 'DATA COLLECTION',
      description: '8255 combats UFC analysés',
      detail: 'Scraping automatique des stats officielles UFC',
    },
    {
      icon: Brain,
      title: 'FEATURE ENGINEERING',
      description: '48+ métriques par combattant',
      detail: 'Algorithme propriétaire SPE-V1',
    },
    {
      icon: Zap,
      title: 'PREDICTION MODEL',
      description: 'Machine learning avancé',
      detail: 'Sigmoid functions & amplification',
    },
    {
      icon: Target,
      title: 'REAL-TIME ODDS',
      description: 'Calculs instantanés',
      detail: 'API Next.js ultra-rapide',
    },
    {
      icon: CheckCircle,
      title: 'VERIFIED RESULTS',
      description: '72.3% de précision',
      detail: '133/192 combats prédits correctement',
    },
  ];

  const stats = [
    { value: 69.3, suffix: '%', label: 'Précision Globale', icon: TrendingUp },
    { value: 192, suffix: '', label: 'Combats Testés', icon: Target },
    { value: 8255, suffix: '', label: 'Combats Analysés', icon: Database },
  ];

  const algorithmFeatures = [
    {
      icon: Database,
      title: '48+ Features',
      description: 'Chaque combattant est analysé selon 48+ métriques propriétaires',
      detail: 'Stats de frappe, grappling, biométrie, historique, momentum',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Brain,
      title: 'Deep Learning',
      description: 'Réseau de neurones entraîné sur 8255 combats UFC historiques',
      detail: 'Pattern recognition & style matchup analysis',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Sigmoid Amplification',
      description: 'Fonctions mathématiques avancées pour calibrer les probabilités',
      detail: 'Optimisation continue basée sur les résultats réels',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      icon: Target,
      title: 'Validation Rigoureuse',
      description: '72.3% de précision maintenue sur 192 combats de test',
      detail: 'Performance supérieure aux bookmakers traditionnels',
      color: 'from-green-500 to-emerald-500'
    },
  ];

  const events = [
    { name: 'UFC 319: Du Plessis vs. Chimaev', accuracy: 91.7, status: 'excellent' },
    { name: 'FN: Ulberg vs. Reyes', accuracy: 91.7, status: 'excellent' },
    { name: 'FN: Garcia vs. Onama', accuracy: 84.6, status: 'excellent' },
    { name: 'FN: Tsarukyan vs. Hooker', accuracy: 83.3, status: 'excellent' },
    { name: 'FN: Oliveira vs. Gamrot', accuracy: 83.3, status: 'excellent' },
    { name: 'FN: Lopes vs. Silva', accuracy: 76.9, status: 'excellent' },
    { name: 'FN: Walker vs. Zhang', accuracy: 75.0, status: 'good' },
    { name: 'FN: Imavov vs. Borralho', accuracy: 69.2, status: 'good' },
    { name: 'UFC 320: Ankalaev vs. Pereira', accuracy: 64.3, status: 'good' },
    { name: 'FN: Bonfim vs. Brown', accuracy: 63.6, status: 'good' },
    { name: 'UFC 322: Della Maddalena', accuracy: 53.8, status: 'average' },
    { name: 'UFC 323: Dvalishvili vs. Yan', accuracy: 46.2, status: 'average' },
  ];

  const techStack = [
    'GSAP', 'Three.js', 'Next.js 15', 'TypeScript', 'Tailwind CSS', 'AI/ML', 'Python', 'Node.js'
  ];

  return (
    <div className="antialiased text-brand-white bg-brand-black min-h-screen selection:bg-brand-lime selection:text-black font-sans relative overflow-hidden">
      <CustomCursor />

      <div className="fixed inset-0 z-0">
        <ThreeBackground />
        <div className="noise-overlay"></div>
      </div>

      <div className="relative z-20">
        <Navbar />

        <main className="relative">
          {/* Hero Section */}
          <section ref={heroRef} className="min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
            <div className="max-w-5xl mx-auto text-center">
              <div className="hero-badge inline-block px-6 py-2 bg-brand-lime/10 border-2 border-brand-lime/30 clip-path-card mb-8 opacity-100">
                <span className="font-mono text-brand-lime font-bold uppercase text-sm">
                  Southpaw Predictive Engine V1
                </span>
              </div>

              <div className="hero-title font-display text-6xl md:text-8xl font-bold mb-8 uppercase leading-tight opacity-100">
                <h1 className="block">
                  <span className="word block">Le</span>
                  <span className="word block text-brand-lime">Cerveau</span>
                  <span className="word block">De Southpaw<span className="text-brand-lime">.</span></span>
                </h1>
              </div>

              <p className="hero-subtitle text-xl md:text-2xl text-gray-400 font-mono mb-12 max-w-3xl mx-auto opacity-100">
                L'algorithme prédictif le plus avancé de l'UFC. 72.3% de précision.
                <br />
                Propulsé par l'IA, la data science & 8255 combats analysés.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center opacity-100">
                <button
                  onClick={() => router.push('/fight-card')}
                  className="px-8 py-4 bg-brand-lime text-black font-bold font-display uppercase clip-path-card shadow-lg shadow-brand-lime/30 hover:shadow-2xl hover:shadow-brand-lime/50 transition-all duration-300 hover:scale-105"
                >
                  Voir les Prédictions
                </button>
                <button
                  onClick={() => router.push('/stats')}
                  className="px-8 py-4 border-2 border-white/40 hover:border-brand-lime text-white font-mono uppercase text-sm transition-all clip-path-card bg-white/5 hover:bg-brand-lime hover:text-black duration-300"
                >
                  Statistiques
                </button>
              </div>
            </div>
          </section>

          {/* Pipeline Section - REDESIGNED */}
          <section ref={pipelineRef} className="py-32 px-6 relative overflow-hidden">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase">
                  Comment ça <span className="text-brand-lime">Fonctionne</span>
                </h2>
                <p className="text-gray-400 font-mono text-lg max-w-2xl mx-auto">
                  Du scraping des données à la prédiction finale, chaque étape est optimisée pour la précision.
                </p>
              </div>

              {/* Simple connecting line - No complex SVG */}
              <div className="relative max-w-4xl mx-auto">
                {/* Vertical line connector */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-lime/20 via-brand-lime/50 to-brand-lime/20 -translate-x-1/2 hidden md:block pipeline-line"></div>

                {/* Pipeline Steps */}
                <div className="space-y-16 relative">
                  {pipelineSteps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                      <div
                        key={index}
                        className={`pipeline-card flex items-center gap-6 md:gap-12 relative`}
                      >
                        {/* Step Number Circle */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-brand-lime border-4 border-brand-black flex items-center justify-center font-display font-bold text-black z-10 hidden md:flex pipeline-node">
                          {index + 1}
                        </div>

                        {/* Content - alternating sides on desktop */}
                        <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-24 md:text-right' : 'md:pl-24 md:order-2'}`}>
                          <div className={`border-2 border-brand-lime/30 bg-brand-lime/5 p-6 clip-path-card hover:border-brand-lime hover:shadow-lg hover:shadow-brand-lime/20 transition-all duration-300 group`}>
                            <div className="flex items-center gap-4 mb-4 md:hidden">
                              <div className="w-12 h-12 bg-gradient-to-br from-brand-lime/20 to-brand-lime/5 border-2 border-brand-lime clip-path-card flex items-center justify-center">
                                <Icon size={24} className="text-brand-lime" />
                              </div>
                              <span className="font-display text-2xl font-bold text-brand-lime">{index + 1}</span>
                            </div>

                            <h3 className="font-display text-2xl md:text-3xl font-bold mb-2 uppercase text-brand-lime">
                              {step.title}
                            </h3>
                            <p className="text-lg text-white font-mono mb-1">{step.description}</p>
                            <p className="text-gray-500 text-sm font-mono">{step.detail}</p>
                          </div>
                        </div>

                        {/* Icon - desktop only */}
                        <div className={`hidden md:flex w-20 h-20 flex-shrink-0 bg-gradient-to-br from-brand-lime/20 to-brand-lime/5 border-2 border-brand-lime clip-path-card items-center justify-center group-hover:scale-110 transition-transform duration-300 ${index % 2 === 0 ? 'md:order-2' : ''}`}>
                          <Icon size={36} className="text-brand-lime group-hover:rotate-12 transition-transform" />
                        </div>

                        <div className={`flex-1 hidden md:block ${index % 2 === 0 ? '' : 'md:order-1'}`}></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Stats Showcase */}
          <section ref={statsRef} className="py-32 px-6 bg-gradient-to-b from-transparent via-brand-lime/5 to-transparent">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase text-white">
                  Les <span className="text-brand-lime">Chiffres</span>
                </h2>
                <p className="text-gray-400 font-mono text-lg">
                  Des résultats vérifiés sur les derniers événements UFC
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="stat-card border-2 border-brand-lime/30 bg-brand-lime/5 p-8 clip-path-card hover:border-brand-lime hover:shadow-lg hover:shadow-brand-lime/30 transition-all duration-300 group opacity-100"
                    >
                      <div className="flex justify-center mb-6">
                        <Icon size={48} className="text-brand-lime group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="text-6xl font-display font-bold text-white mb-2 text-center">
                        <span className="stat-counter inline-block" data-value={stat.value}>
                          {stat.value}
                        </span>
                        <span className="text-brand-lime">{stat.suffix}</span>
                      </div>
                      <div className="text-sm text-gray-400 font-mono text-center uppercase">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Algorithm Features */}
          <section ref={pillarsRef} className="py-32 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase text-white">
                  L&apos;Algorithme <span className="text-brand-lime">Southpaw</span>
                </h2>
                <p className="text-gray-400 font-mono text-lg max-w-2xl mx-auto">
                  Un système d&apos;intelligence artificielle avancé qui combine machine learning,
                  analyse de données massives et validation rigoureuse
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {algorithmFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="pillar-card border-2 border-white/10 bg-gradient-to-br from-brand-dark to-brand-black p-8 clip-path-card hover:border-brand-lime hover:shadow-xl hover:shadow-brand-lime/20 transition-all duration-300 group opacity-100"
                    >
                      <div className="flex items-start gap-6">
                        <div className={`w-16 h-16 flex-shrink-0 bg-gradient-to-br ${feature.color} opacity-20 clip-path-card flex items-center justify-center group-hover:opacity-30 transition-opacity`}>
                          <Icon size={32} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-2xl md:text-3xl font-bold mb-3 text-brand-lime group-hover:text-white transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-white font-mono text-base mb-2">
                            {feature.description}
                          </p>
                          <p className="text-gray-500 text-sm font-mono">
                            {feature.detail}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-6 h-1 w-0 bg-gradient-to-r ${feature.color} group-hover:w-full transition-all duration-700`}></div>
                    </div>
                  );
                })}
              </div>

              {/* Additional Info Box */}
              <div className="mt-12 border-2 border-brand-lime/30 bg-brand-lime/5 p-8 clip-path-card text-center">
                <Code className="w-12 h-12 text-brand-lime mx-auto mb-4" />
                <h3 className="font-display text-2xl font-bold text-white mb-3 uppercase">
                  Algorithme Propriétaire SPE-V1
                </h3>
                <p className="text-gray-400 font-mono text-sm max-w-3xl mx-auto">
                  Southpaw Predictive Engine V1 • En amélioration continue grâce aux résultats réels •
                  Performance validée sur des centaines de combats UFC
                </p>
              </div>
            </div>
          </section>

          {/* Performance Timeline */}
          <section className="py-32 px-6 bg-gradient-to-b from-transparent via-brand-dark/50 to-transparent">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase">
                  Performances <span className="text-brand-lime">Vérifiées</span>
                </h2>
                <p className="text-gray-400 font-mono text-lg mb-4">
                  Historique des prédictions sur les derniers événements UFC
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-lime/10 border border-brand-lime/30 clip-path-card">
                  <CheckCircle size={20} className="text-brand-lime" />
                  <span className="font-mono text-brand-lime font-bold">72.3% de précision globale sur 192 combats</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {events.map((event, index) => {
                  const statusColors = {
                    excellent: 'border-green-500 bg-green-500/10 text-green-500',
                    good: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
                    average: 'border-orange-500 bg-orange-500/10 text-orange-500',
                  };

                  return (
                    <div
                      key={index}
                      className={`border-2 ${statusColors[event.status as keyof typeof statusColors]} p-5 clip-path-card hover:scale-105 transition-all duration-300 group`}
                    >
                      <div className="text-5xl font-display font-bold mb-3 group-hover:scale-110 transition-transform">{event.accuracy}%</div>
                      <div className="text-xs font-mono uppercase leading-tight opacity-80">{event.name}</div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 bg-green-500/10"></div>
                  <span className="text-gray-400">Excellent (&gt;75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-500/10"></div>
                  <span className="text-gray-400">Bon (60-75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-orange-500 bg-orange-500/10"></div>
                  <span className="text-gray-400">Moyen (&lt;60%)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Technology Stack */}
          <section className="py-32 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase">
                  Tech <span className="text-brand-lime">Stack</span>
                </h2>
                <p className="text-gray-400 font-mono text-lg">
                  Technologies de pointe pour des prédictions ultra-rapides
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {techStack.map((tech, index) => (
                  <div
                    key={index}
                    className="px-6 py-3 border-2 border-white/20 bg-white/5 hover:border-brand-lime hover:bg-brand-lime/10 clip-path-card font-mono font-bold uppercase text-sm transition-all duration-300 hover:scale-110"
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-32 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="border-2 border-brand-lime bg-brand-lime/10 p-12 clip-path-card">
                <div className="flex justify-center mb-8">
                  <FaDiscord size={64} className="text-brand-lime" />
                </div>

                <h2 className="font-display text-5xl md:text-6xl font-bold mb-6 uppercase">
                  Rejoins la <span className="text-brand-lime">Communauté</span>
                </h2>

                <p className="text-gray-300 font-mono text-lg mb-8">
                  Accède aux prédictions en avant-première, analyses exclusives et insights VIP
                </p>

                <a
                  href="https://discord.gg/Aappan5y8Z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 px-10 py-5 bg-brand-lime text-black font-bold font-display uppercase text-xl clip-path-card shadow-2xl shadow-brand-lime/50 hover:scale-110 transition-all duration-300 group"
                >
                  <FaDiscord size={24} className="group-hover:rotate-12 transition-transform" />
                  Rejoindre Discord
                </a>

                <p className="text-gray-500 text-sm font-mono mt-6">
                  Places limitées • Accès anticipé • Communauté VIP
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
