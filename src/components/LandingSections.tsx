'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronRight, Zap, Shield, Search, Brain, TrendingUp, Crosshair, MessageCircle, LucideIcon } from 'lucide-react';

// Enregistrement du plugin côté client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// --- Hero Section ---
export const Hero = () => {
  const titleRef = useRef(null);
  const badgeRef = useRef(null);
  const descRef = useRef(null);
  const buttonsRef = useRef(null);
  const imageCardRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    if (badgeRef.current && titleRef.current && descRef.current && buttonsRef.current && imageCardRef.current) {
      // Entrance animations
      tl.fromTo(badgeRef.current,
        { opacity: 0, y: -20, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8 }
      )
      .fromTo((titleRef.current as HTMLElement).children,
        { opacity: 0, y: 120, rotateX: -90 },
        { opacity: 1, y: 0, rotateX: 0, duration: 1.4, stagger: 0.15 },
        "-=0.4"
      )
      .fromTo(descRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.6"
      )
      .fromTo((buttonsRef.current as HTMLElement).children,
        { opacity: 0, y: 30, scale: 0.8, rotateX: 45 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1, stagger: 0.12 },
        "-=0.7"
      )
      .fromTo(imageCardRef.current,
        { opacity: 0, scale: 0.7, rotateY: -60, x: 100 },
        { opacity: 1, scale: 1, rotateY: 0, x: 0, duration: 1.8, ease: "power3.out" },
        "-=1.3"
      );

      // Advanced parallax effects on scroll (sans opacity)
      gsap.to(titleRef.current, {
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
        y: -150,
        scale: 0.9,
      });

      gsap.to(descRef.current, {
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 2,
        },
        y: -80,
      });

      gsap.to(imageCardRef.current, {
        scrollTrigger: {
          trigger: imageCardRef.current,
          start: "top center",
          end: "bottom top",
          scrub: 1,
        },
        y: 100,
        rotateY: 15,
        scale: 0.95,
      });
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-[0.05]"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 relative z-30">
          <div ref={badgeRef}>
            <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-brand-lime rounded-none bg-brand-lime text-black text-xs font-mono mb-6 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
              </span>
              PROBABILITÉS EN TEMPS RÉEL
            </div>
          </div>
          <h1 ref={titleRef} className="font-display font-bold text-[3rem] sm:text-6xl md:text-8xl lg:text-9xl leading-[0.85] tracking-tight mb-6 sm:mb-8 relative z-30">
            <span className="block text-brand-white">BETTING</span>
            <span className="block text-brand-lime glitch-text" data-text="INTELLIGENCE">INTELLIGENCE</span>
          </h1>
          <p ref={descRef} className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-lg mb-8 sm:mb-10 font-sans font-light border-l-2 border-brand-lime pl-3 sm:pl-4 md:pl-6">
            <strong className="text-white font-medium">Southpaw</strong> n&apos;est pas un bookmaker. C&apos;est votre analyste personnel.
            Nous croisons des milliers de données (styles, cardio, historique) pour vous donner l&apos;avantage mathématique.
          </p>
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-brand-lime text-black font-bold font-display uppercase tracking-wider overflow-hidden clip-path-card shadow-lg shadow-brand-lime/30 hover:shadow-2xl hover:shadow-brand-lime/50 transition-all duration-300 hover:scale-105 text-sm sm:text-base">
              <span className="relative z-10 flex items-center gap-2 justify-center">
                Voir les prédictions <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white transform translate-y-full transition-transform group-hover:translate-y-0 duration-300"></div>
            </button>
            <button className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/40 hover:border-brand-lime text-white font-mono uppercase text-xs sm:text-sm transition-all clip-path-card bg-white/5 hover:bg-brand-lime hover:text-black duration-300">
              Comment ça marche ?
            </button>
          </div>
        </div>

        <div className="md:col-span-5 relative h-[500px] w-full hidden md:block perspective-1000" ref={imageCardRef}>
             <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent z-20"></div>

             <div className="absolute top-0 right-10 z-30 font-mono text-xs text-black border-2 border-brand-lime p-2 bg-brand-lime animate-pulse-slow font-bold">
                 REACH_ADVANTAGE: +5CM
             </div>

             <div className="absolute bottom-20 -left-10 z-30 font-mono text-xs text-black border-2 border-white p-2 bg-white font-bold">
                 TAKEDOWN_DEFENSE: 92%
             </div>

             <div className="relative w-full h-full bg-brand-gray border border-white/10 transform rotate-2 hover:rotate-0 transition-all duration-700 ease-out shadow-2xl shadow-brand-lime/5 group overflow-hidden clip-path-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/homepage_image.webp" className="w-full h-full object-contain grayscale group-hover:scale-105 transition-all duration-700 mix-blend-luminosity" alt="Fighter Analysis" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                <div className="absolute bottom-0 left-0 w-full p-8">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="font-display text-4xl font-bold italic text-white group-hover:text-brand-lime transition-colors">PEREIRA</h3>
                        <div className="text-right">
                            <div className="text-xs font-mono text-gray-400">WIN PROB.</div>
                            <span className="text-brand-lime font-mono text-3xl font-bold">65%</span>
                        </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-none ${i < 7 ? 'bg-brand-lime' : 'bg-gray-900'}`}></div>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2"><Zap size={10} className="text-brand-lime"/> Striking: Elite</div>
                        <div className="flex items-center gap-2"><Shield size={10} className="text-red-500"/> Grappling: Mid</div>
                    </div>
                </div>
             </div>
        </div>
      </div>
    </section>
  );
};

// --- Features Section ---
const StatCard = ({ icon: Icon, title, desc, delay }: { icon: LucideIcon, title: string, desc: string, delay?: string }) => (
  <div className="stat-card relative border-2 border-brand-lime/30 bg-[#1a1a1a] p-10 hover:bg-[#222222] transition-all hover:border-brand-lime hover:shadow-xl hover:shadow-brand-lime/30 group overflow-hidden hover:scale-105 duration-500 min-h-[320px]" style={{transitionDelay: delay}}>
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110 text-brand-lime/20">
          <Icon size={100} />
      </div>
      <Icon className="text-brand-lime w-14 h-14 mb-8 group-hover:scale-125 group-hover:rotate-3 transition-all duration-500 relative z-10 lime-glow" />
      <h3 className="font-display text-3xl font-bold mb-4 uppercase relative z-10 text-white group-hover:text-brand-lime transition-colors duration-300">{title}</h3>
      <p className="text-gray-300 font-light leading-relaxed text-base relative z-10 font-sans group-hover:text-white transition-colors duration-300">
          {desc}
      </p>
      <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-brand-lime to-transparent group-hover:w-full transition-all duration-700"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/0 to-brand-lime/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  </div>
);

export const Features = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    // Animate section title
    gsap.from(titleRef.current, {
      scrollTrigger: {
        trigger: titleRef.current,
        start: "top 85%",
      },
      x: -150,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out"
    });

    // Animate cards with advanced 3D stagger
    gsap.fromTo(".stat-card",
      {
        y: 120,
        opacity: 0,
        rotateX: -45,
        rotateZ: -5,
        scale: 0.8,
      },
      {
        scrollTrigger: {
          trigger: "#features",
          start: "top 75%",
        },
        y: 0,
        opacity: 1,
        rotateX: 0,
        rotateZ: 0,
        scale: 1,
        stagger: {
          each: 0.2,
          from: "start",
          ease: "power2.inOut"
        },
        duration: 1.2,
        ease: "power3.out",
        clearProps: "all"
      }
    );

    // Individual card parallax on scroll
    gsap.utils.toArray<HTMLElement>(".stat-card").forEach((card, i) => {
      gsap.to(card, {
        scrollTrigger: {
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
        y: -60 * (i % 2 === 0 ? 1 : -1),
        rotateY: 5 * (i % 2 === 0 ? 1 : -1),
      });
    });

    // Parallax effect for the entire section
    gsap.to(sectionRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 2,
      },
      y: -80,
    });
  }, []);

  return (
    <section id="features" className="py-32 relative bg-brand-black" ref={sectionRef}>
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 mb-20 items-end" ref={titleRef}>
                <div>
                    <h2 className="font-display font-bold text-5xl md:text-6xl mb-6">LA SCIENCE <br/><span className="text-gray-600">DU COMBAT</span></h2>
                    <div className="h-1 w-20 bg-brand-lime rounded-none"></div>
                </div>
                <p className="font-mono text-gray-400 text-sm md:text-base border-l border-brand-lime pl-6">
                    <span className="text-brand-lime">const</span> victory = analyze(history, style);<br/>
                    {/* Southpaw scrape le web en temps réel. */}<br/>
                    {/* Analyse historique, forme physique, et style matchups. */}
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <StatCard 
                    icon={Search} 
                    title="Data Mining" 
                    desc="Notre moteur scanne des milliers d'articles, stats officielles et réseaux sociaux pour connaître l'état de forme réel de chaque combattant avant la pesée."
                />
                <StatCard 
                    icon={Brain} 
                    title="Style Matchups" 
                    desc="L'algorithme comprend que 'Styles Make Fights'. Un lutteur d'élite contre un striker sans takedown defense ? Nous ajustons les probabilités drastiquement."
                />
                <StatCard 
                    icon={TrendingUp} 
                    title="Valeur Attendue (EV+)" 
                    desc="Nous ne cherchons pas juste le vainqueur. Nous identifions les cotes mal ajustées par les bookmakers pour maximiser votre ROI long terme."
                />
            </div>
         </div>
    </section>
  );
};

// --- Upcoming Fights Section ---
interface FightRowProps {
  fighter1: string;
  fighter2: string;
  date: string;
  prob1: number;
  prob2: number;
  event: string;
  confidence?: number;
}

const FightRow = ({ fighter1, fighter2, date, prob1, prob2, event, confidence = 0 }: FightRowProps) => {
  // Utiliser la confiance ML si disponible, sinon la probabilité du favori
  const displayConfidence = confidence > 0 ? confidence : Math.max(prob1, prob2);

  return (
    <div className="fight-row relative border-b border-white/10 py-8 hover:bg-white/5 transition-colors group cursor-pointer overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col items-center md:items-start w-full md:w-1/6">
                <span className="bg-brand-lime text-black font-mono text-xs font-bold px-2 py-1 border border-brand-lime mb-2">{event}</span>
                <span className="text-white font-display text-xl">{date}</span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-12 flex-1 w-full md:flex-nowrap flex-wrap">
                <div className={`text-right flex-shrink min-w-0 transition-opacity duration-300 ${prob1 >= prob2 ? 'opacity-100 text-brand-lime' : 'opacity-50 text-white'}`}>
                    <div className="text-lg sm:text-2xl md:text-5xl font-display font-bold uppercase leading-none overflow-hidden text-ellipsis whitespace-nowrap md:overflow-visible md:whitespace-normal">{fighter1}</div>
                </div>
                <div className="font-display text-base sm:text-xl italic font-bold text-gray-700 flex-shrink-0 mx-2">VS</div>
                <div className={`text-left flex-shrink min-w-0 transition-opacity duration-300 ${prob2 > prob1 ? 'opacity-100 text-brand-lime' : 'opacity-50 text-white'}`}>
                    <div className="text-lg sm:text-2xl md:text-5xl font-display font-bold uppercase leading-none overflow-hidden text-ellipsis whitespace-nowrap md:overflow-visible md:whitespace-normal">{fighter2}</div>
                </div>
            </div>

            <div className="w-full md:w-1/6 flex flex-col items-center md:items-end">
                <div className="text-[10px] font-mono text-gray-500 mb-1 uppercase tracking-widest">Confiance IA</div>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-24 bg-gray-900 skew-x-[-12deg] overflow-hidden border border-white/10">
                        <div className="h-full bg-brand-lime transition-all duration-1000" style={{width: `${displayConfidence}%`}}></div>
                    </div>
                    <span className="text-brand-lime font-bold font-mono text-2xl">{displayConfidence.toFixed(0)}%</span>
                </div>
            </div>
        </div>
        <div className="absolute inset-0 bg-brand-lime/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none z-0"></div>
    </div>
  );
};

interface Fight {
  fighter1: string;
  fighter2: string;
  eventTitle: string;
  eventDate: string;
  prob1?: number;
  prob2?: number;
  confidence?: number;
}

interface UFCEvent {
  title: string;
  date: string;
  dateISO: string;
  location: string;
  url: string;
  imgUrl: string;
  mainCard: string;
  eventType: string;
  eventNumber?: string;
}

export const UpcomingFights = () => {
  const sectionRef = useRef(null);
  const [fights, setFights] = React.useState<Fight[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUpcomingFights = async () => {
      try {
        // Charger les prédictions pré-calculées depuis le fichier JSON statique
        const response = await fetch('/upcoming-predictions.json');
        const data = await response.json();

        if (data.fights && data.fights.length > 0) {
          // Les prédictions sont déjà au bon format
          setFights(data.fights);
        }
      } catch (error) {
        console.error('Error fetching upcoming predictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingFights();
  }, []);

  const totalFights = fights.length;

  useEffect(() => {
    if (!loading && fights.length > 0) {
      // Entrance animation with clip-path reveal
      gsap.from(".fight-row", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
        x: -150,
        opacity: 0,
        clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
        stagger: {
          each: 0.15,
          ease: "power2.out"
        },
        duration: 1,
        ease: "power3.out"
      });

      // Parallax on each fight row
      gsap.utils.toArray<HTMLElement>(".fight-row").forEach((row, i) => {
        gsap.to(row, {
          scrollTrigger: {
            trigger: row,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
          x: 30 * (i % 2 === 0 ? 1 : -1),
        });
      });
    }
  }, [loading, fights]);

  // Format date to "MMM DD"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase().replace(' ', ' ');
  };

  // Get event name badge (e.g., "UFC 311" or "FIGHT NIGHT")
  const getEventBadge = (title: string) => {
    if (title.includes('UFC ') && /\d/.test(title)) {
      const match = title.match(/UFC (\d+)/);
      return match ? `UFC ${match[1]}` : 'UFC EVENT';
    }
    return 'FIGHT NIGHT';
  };

  return (
    <section id="fights" className="py-20 bg-brand-dark relative" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row justify-between items-end gap-4">
              <h2 className="font-display font-bold text-4xl uppercase text-white">Prochains Combats</h2>
              <div className="flex items-center gap-2 text-xs font-mono bg-brand-lime text-black px-3 py-1 border-2 border-brand-lime rounded-full font-bold">
                  <span className="animate-pulse h-2 w-2 bg-black rounded-full block"></span> SYNCING LIVE ODDS
              </div>
          </div>

          <div className="border-t border-white/10">
              {loading ? (
                <div className="py-20 text-center text-gray-500 font-mono">Chargement des combats...</div>
              ) : fights.length > 0 ? (
                fights.map((fight, idx) => (
                  <FightRow
                    key={idx}
                    event={getEventBadge(fight.eventTitle)}
                    date={formatDate(fight.eventDate)}
                    fighter1={fight.fighter1}
                    fighter2={fight.fighter2}
                    prob1={fight.prob1 || 50}
                    prob2={fight.prob2 || 50}
                    confidence={fight.confidence}
                  />
                ))
              ) : (
                <div className="py-20 text-center text-gray-500 font-mono">Aucun combat à venir</div>
              )}
          </div>

          <div className="text-center mt-12">
               <a href="/fight-card" className="group text-brand-lime font-mono text-sm transition-colors flex items-center justify-center gap-2 mx-auto hover:text-white">
                  VOIR TOUTES les analyses <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
              </a>
          </div>
      </section>
   );
};

// --- Call To Action Section ---
export const CallToAction = () => {
  const ctaRef = useRef(null);
  const formRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    if (!ctaRef.current || !iconRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ctaRef.current,
        start: "top 80%",
      }
    });

    tl.from(iconRef.current, {
      scale: 0,
      rotation: -180,
      opacity: 0,
      duration: 1,
      ease: "back.out(1.7)"
    })
    .from(ctaRef.current, {
      scale: 0.9,
      opacity: 0,
      y: 30,
      duration: 1,
      ease: "power3.out"
    }, "-=0.7");

    // Continuous rotation on icon
    gsap.to(iconRef.current, {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: "none"
    });

    // Parallax on CTA section
    gsap.to(ctaRef.current, {
      scrollTrigger: {
        trigger: ctaRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5,
      },
      y: -50,
    });
  }, []);

  return (
    <section className="py-32 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544298516-08996e174268?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 grayscale mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black"></div>

      <div className="relative z-10 text-center max-w-3xl px-6">
          <div ref={iconRef}>
            <Crosshair className="w-16 h-16 text-brand-lime mx-auto mb-6 lime-glow" />
          </div>
          <div ref={ctaRef}>
            <h2 className="font-display font-bold text-5xl md:text-7xl mb-8 leading-none">
                ARRÊTEZ DE PARIER <br/>
                <span className="text-brand-lime lime-glow-text">AU HASARD</span>
            </h2>
          </div>
          <p className="text-gray-300 mb-10 font-sans text-lg">
              L&apos;UFC est un chaos organisé. Southpaw est l&apos;outil qui met de l&apos;ordre dans le chaos.
              Rejoignez notre Discord pour accéder aux analyses.
          </p>

          {/* Discord CTA */}
          <div className="flex justify-center">
            <a
              href="https://discord.gg/Aappan5y8Z"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 border-2 border-brand-lime text-brand-lime hover:bg-brand-lime hover:text-black transition-all duration-300 clip-path-card font-mono font-bold uppercase group"
            >
              <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
              Rejoindre le Discord
            </a>
          </div>
       </div>
    </section>
  );
};