'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Scale, User, Mail, Globe } from 'lucide-react';
import { Navbar, Footer, CustomCursor } from '@/components/LandingUI';
import { ThreeBackground } from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function LegalPage() {
  const router = useRouter();

  useEffect(() => {
    // Set initial state
    gsap.set('.legal-section', { opacity: 1 });

    gsap.from('.legal-section', {
      scrollTrigger: {
        trigger: '.legal-content',
        start: 'top 80%',
      },
      opacity: 0,
      y: 50,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out',
    });
  }, []);

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
          <section className="min-h-[40vh] flex items-center justify-center px-6 pt-32 pb-20">
            <div className="max-w-4xl mx-auto text-center">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-brand-lime hover:text-white transition-colors mb-8 font-mono text-sm"
              >
                <ArrowLeft size={16} />
                Retour
              </button>

              <div className="inline-block p-4 bg-brand-lime/10 border-2 border-brand-lime/30 clip-path-card mb-8">
                <Scale className="w-12 h-12 text-brand-lime" />
              </div>

              <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase leading-tight">
                Mentions <span className="text-brand-lime">Légales</span>
              </h1>

              <p className="text-gray-400 font-mono text-lg">
                Dernière mise à jour : 26 décembre 2025
              </p>
            </div>
          </section>

          {/* Content Section */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto legal-content">
              {/* Éditeur du site */}
              <div className="legal-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <User className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    1. Éditeur du site
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">Nom du site :</strong> Southpaw
                  </p>
                  <p>
                    <strong className="text-white">Propriétaire :</strong> Nathan Kiss
                  </p>
                  <p>
                    <strong className="text-white">Statut juridique :</strong> Auto-entrepreneur
                  </p>
                  <p>
                    <strong className="text-white">Numéro SIRET :</strong> 94515738600018
                  </p>
                  <p>
                    <strong className="text-white">Adresse :</strong> 68260 Kingersheim, France
                  </p>
                  <p>
                    <strong className="text-white">Email :</strong> contact@southpaw.com
                  </p>
                </div>
              </div>

              {/* Hébergement */}
              <div className="legal-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Globe className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    2. Hébergement
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">Hébergeur :</strong> Railway Corp.
                  </p>
                  <p>
                    <strong className="text-white">Adresse :</strong> DP-Dock GmbH #4008
Attn.: Railway Corp, Ballindamm 39
20095 Hamburg, Germany
                  </p>
                  <p>
                    <strong className="text-white">Site web :</strong>{' '}
                    <a
                      href="https://railway.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-lime hover:underline"
                    >
                      https://railway.app
                    </a>
                  </p>
                </div>
              </div>

              {/* Propriété intellectuelle */}
              <div className="legal-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Scale className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    3. Propriété intellectuelle
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    L&apos;ensemble de ce site relève de la législation française et internationale sur le droit d&apos;auteur
                    et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents
                    téléchargeables et les représentations iconographiques et photographiques.
                  </p>
                  <p>
                    La reproduction de tout ou partie de ce site sur un support électronique quel qu&apos;il soit est formellement
                    interdite sauf autorisation expresse du directeur de la publication.
                  </p>
                  <p className="text-brand-lime">
                    <strong>Marques et logos :</strong> Les marques, logos, signes ainsi que tous les contenus du site
                    (textes, images, son...) font l&apos;objet d&apos;une protection par le Code de la propriété intellectuelle.
                  </p>
                </div>
              </div>

              {/* Responsabilité */}
              <div className="legal-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Mail className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    4. Limitation de responsabilité
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">Southpaw</strong> ne garantit pas l&apos;exactitude, la précision ou
                    l&apos;exhaustivité des informations mises à disposition sur ce site.
                  </p>
                  <p className="text-brand-lime font-bold">
                    ⚠️ AVERTISSEMENT IMPORTANT : Southpaw n&apos;est pas un bookmaker ni un site de paris sportifs.
                  </p>
                  <p>
                    Les prédictions et analyses fournies sont à titre informatif et éducatif uniquement. Elles ne constituent
                    en aucun cas une incitation au pari ou une garantie de résultat.
                  </p>
                  <p>
                    L&apos;utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait des informations disponibles
                    sur le site. En aucun cas, Southpaw ne pourra être tenu responsable des pertes financières liées aux paris sportifs.
                  </p>
                  <p>
                    Les paris sportifs peuvent créer une dépendance. Si vous ou l&apos;un de vos proches êtes concerné,
                    contactez un professionnel de santé ou Joueurs Info Service au 09 74 75 13 13.
                  </p>
                </div>
              </div>

              {/* Données UFC */}
              <div className="legal-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Globe className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    5. Sources des données
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    Les statistiques et données utilisées sur Southpaw proviennent de sources publiques, notamment :
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>UFC.com (statistiques officielles)</li>
                    <li>UFCStats.com</li>
                    <li>UFC 2025 Dataset - Amine Alibi (https://www.kaggle.com/datasets/aminealibi/ufc-fights-fighters-and-events-dataset)</li>
                    <li>Sources médiatiques publiques</li>
                  </ul>
                  <p className="text-brand-lime">
                    Southpaw n&apos;est pas affilié, approuvé ou sponsorisé par l&apos;UFC® (Ultimate Fighting Championship®).
                    Tous les noms, logos et marques de l&apos;UFC sont la propriété de Zuffa, LLC.
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="legal-section border-2 border-brand-lime/30 bg-brand-lime/5 p-8 clip-path-card">
                <div className="flex items-center gap-4 mb-6">
                  <Mail className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    6. Contact
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    Pour toute question concernant les mentions légales, vous pouvez nous contacter :
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <strong className="text-white">Email :</strong>{' '}
                      <a href="mailto:contact@southpaw.com" className="text-brand-lime hover:underline">
                        contact@southpaw.com
                      </a>
                    </li>
                    <li>
                      <strong className="text-white">Discord :</strong>{' '}
                      <a
                        href="https://discord.gg/Aappan5y8Z"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-lime hover:underline"
                      >
                        discord.gg/Aappan5y8Z
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
