'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Lock, Eye, Database, Cookie, UserX } from 'lucide-react';
import { Navbar, Footer, CustomCursor } from '@/components/LandingUI';
import { ThreeBackground } from '@/components/ThreeBackground';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    // Set initial state
    gsap.set('.privacy-section', { opacity: 1 });

    gsap.from('.privacy-section', {
      scrollTrigger: {
        trigger: '.privacy-content',
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
                <Shield className="w-12 h-12 text-brand-lime" />
              </div>

              <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 uppercase leading-tight">
                Politique de <span className="text-brand-lime">Confidentialité</span>
              </h1>

              <p className="text-gray-400 font-mono text-lg">
                Dernière mise à jour : 26 décembre 2025
              </p>
            </div>
          </section>

          {/* Content Section */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto privacy-content">
              {/* Introduction */}
              <div className="privacy-section mb-16 border-2 border-brand-lime/30 bg-brand-lime/5 p-8 clip-path-card">
                <div className="flex items-center gap-4 mb-6">
                  <Shield className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    Introduction
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    Chez <strong className="text-brand-lime">Southpaw</strong>, nous prenons la protection de vos données
                    personnelles très au sérieux. Cette politique de confidentialité explique quelles données nous collectons,
                    comment nous les utilisons et quels sont vos droits.
                  </p>
                  <p className="text-white">
                    Cette politique s&apos;applique à tous les utilisateurs du site Southpaw et des services associés.
                  </p>
                </div>
              </div>

              {/* Données collectées */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Database className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    1. Données que nous collectons
                  </h2>
                </div>
                <div className="space-y-6 text-gray-300 font-mono text-sm leading-relaxed">
                  <div>
                    <h3 className="text-white font-bold mb-2 text-base">1.1. Données fournies volontairement</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Adresse email (si vous vous inscrivez à notre newsletter ou créez un compte)</li>
                      <li>Nom d&apos;utilisateur Discord (si vous rejoignez notre serveur Discord)</li>
                      <li>Messages ou communications que vous nous envoyez</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-2 text-base">1.2. Données collectées automatiquement</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Adresse IP</li>
                      <li>Type de navigateur et version</li>
                      <li>Pages visitées et durée de visite</li>
                      <li>Appareil utilisé (mobile, desktop)</li>
                      <li>Données de navigation (via cookies analytiques)</li>
                    </ul>
                  </div>

                  <div className="bg-brand-black/50 p-4 border-l-4 border-brand-lime">
                    <p className="text-brand-lime font-bold">
                      ℹ️ Nous ne collectons JAMAIS vos données de paiement ou informations bancaires.
                      Southpaw n&apos;est pas un site de paris et ne traite aucune transaction financière.
                    </p>
                  </div>
                </div>
              </div>

              {/* Utilisation des données */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Eye className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    2. Comment nous utilisons vos données
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>Nous utilisons vos données personnelles pour :</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Fournir et améliorer nos services de prédiction UFC</li>
                    <li>Personnaliser votre expérience utilisateur</li>
                    <li>Communiquer avec vous (newsletters, notifications importantes)</li>
                    <li>Analyser l&apos;utilisation du site pour améliorer nos performances</li>
                    <li>Détecter et prévenir les fraudes ou abus</li>
                    <li>Respecter nos obligations légales</li>
                  </ul>
                  <p className="text-brand-lime">
                    <strong>Nous ne vendons jamais vos données à des tiers.</strong>
                  </p>
                </div>
              </div>

              {/* Cookies */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Cookie className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    3. Cookies et technologies similaires
                  </h2>
                </div>
                <div className="space-y-6 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    Nous utilisons des cookies pour améliorer votre expérience sur notre site.
                  </p>

                  <div>
                    <h3 className="text-white font-bold mb-2 text-base">Types de cookies utilisés :</h3>
                    <ul className="space-y-3 ml-4">
                      <li>
                        <strong className="text-white">• Cookies essentiels :</strong> Nécessaires au fonctionnement du site
                        (authentification, préférences)
                      </li>
                      <li>
                        <strong className="text-white">• Cookies analytiques :</strong> Nous permettent de comprendre comment
                        vous utilisez le site (Google Analytics, Vercel Analytics)
                      </li>
                      <li>
                        <strong className="text-white">• Cookies de performance :</strong> Optimisent les performances et
                        la vitesse du site
                      </li>
                    </ul>
                  </div>

                  <div className="bg-brand-black/50 p-4 border-l-4 border-yellow-500">
                    <p className="text-white">
                      Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, mais cela peut affecter
                      certaines fonctionnalités du site.
                    </p>
                  </div>
                </div>
              </div>

              {/* Partage des données */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Lock className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    4. Partage et protection des données
                  </h2>
                </div>
                <div className="space-y-6 text-gray-300 font-mono text-sm leading-relaxed">
                  <div>
                    <h3 className="text-white font-bold mb-2 text-base">4.1. Partage de données</h3>
                    <p>Nous pouvons partager vos données avec :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>
                        <strong className="text-white">Prestataires de services :</strong> Vercel (hébergement),
                        Google Analytics (analyse), Discord (communauté)
                      </li>
                      <li>
                        <strong className="text-white">Autorités légales :</strong> Si requis par la loi ou pour
                        protéger nos droits
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-2 text-base">4.2. Sécurité</h3>
                    <p>
                      Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos
                      données contre l&apos;accès non autorisé, la perte ou la destruction.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>Chiffrement SSL/TLS pour toutes les communications</li>
                      <li>Stockage sécurisé des données</li>
                      <li>Accès limité aux données personnelles</li>
                      <li>Surveillance continue des menaces</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Vos droits */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <UserX className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    5. Vos droits (RGPD)
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
                  <ul className="space-y-3 ml-4">
                    <li>
                      <strong className="text-white">• Droit d&apos;accès :</strong> Obtenir une copie de vos données personnelles
                    </li>
                    <li>
                      <strong className="text-white">• Droit de rectification :</strong> Corriger vos données inexactes
                    </li>
                    <li>
                      <strong className="text-white">• Droit à l&apos;effacement :</strong> Supprimer vos données ("droit à l&apos;oubli")
                    </li>
                    <li>
                      <strong className="text-white">• Droit à la limitation :</strong> Limiter le traitement de vos données
                    </li>
                    <li>
                      <strong className="text-white">• Droit à la portabilité :</strong> Recevoir vos données dans un format structuré
                    </li>
                    <li>
                      <strong className="text-white">• Droit d&apos;opposition :</strong> Vous opposer au traitement de vos données
                    </li>
                    <li>
                      <strong className="text-white">• Droit de retirer votre consentement :</strong> À tout moment
                    </li>
                  </ul>

                  <div className="bg-brand-lime/10 p-4 border-2 border-brand-lime/30 clip-path-card mt-6">
                    <p className="text-brand-lime font-bold">
                      Pour exercer ces droits, contactez-nous à : contact@southpaw.com
                    </p>
                  </div>
                </div>
              </div>

              {/* Conservation des données */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Database className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    6. Durée de conservation
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>Nous conservons vos données personnelles uniquement le temps nécessaire aux finalités pour lesquelles elles ont été collectées :</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Données de compte : Jusqu&apos;à la suppression de votre compte + 1 an</li>
                    <li>Données analytiques : 26 mois maximum (conformément CNIL)</li>
                    <li>Logs de sécurité : 12 mois</li>
                    <li>Communications : 3 ans après le dernier contact</li>
                  </ul>
                </div>
              </div>

              {/* Transferts internationaux */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Shield className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    7. Transferts internationaux
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    Vos données peuvent être transférées et stockées sur des serveurs situés en dehors de l&apos;Union Européenne,
                    notamment aux États-Unis (Vercel, Google).
                  </p>
                  <p>
                    Nous nous assurons que ces transferts sont effectués conformément au RGPD, via :
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Clauses contractuelles types approuvées par la Commission Européenne</li>
                    <li>Privacy Shield (si applicable)</li>
                    <li>Garanties appropriées de protection des données</li>
                  </ul>
                </div>
              </div>

              {/* Mineurs */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <UserX className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    8. Protection des mineurs
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p className="text-white font-bold">
                    Notre service n&apos;est pas destiné aux personnes de moins de 18 ans.
                  </p>
                  <p>
                    Nous ne collectons pas sciemment de données personnelles auprès de mineurs. Si vous êtes parent et que vous
                    découvrez que votre enfant nous a fourni des informations personnelles, veuillez nous contacter immédiatement.
                  </p>
                  <p className="text-brand-lime">
                    Les paris sportifs sont interdits aux mineurs et peuvent créer une dépendance.
                  </p>
                </div>
              </div>

              {/* Modifications */}
              <div className="privacy-section mb-16 border-2 border-white/10 bg-brand-dark p-8 clip-path-card hover:border-brand-lime/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Eye className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    9. Modifications de cette politique
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. La date de dernière
                    mise à jour sera toujours indiquée en haut de cette page.
                  </p>
                  <p>
                    Nous vous encourageons à consulter régulièrement cette page pour rester informé de nos pratiques en
                    matière de protection des données.
                  </p>
                  <p className="text-white">
                    En cas de modification substantielle, nous vous en informerons par email ou via une notification sur le site.
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="privacy-section border-2 border-brand-lime/30 bg-brand-lime/5 p-8 clip-path-card">
                <div className="flex items-center gap-4 mb-6">
                  <Lock className="text-brand-lime w-8 h-8" />
                  <h2 className="font-display text-3xl font-bold text-white uppercase">
                    10. Nous contacter
                  </h2>
                </div>
                <div className="space-y-4 text-gray-300 font-mono text-sm leading-relaxed">
                  <p>
                    Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits :
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
                  <p className="text-white mt-6">
                    Vous avez également le droit de déposer une plainte auprès de la CNIL (Commission Nationale de
                    l&apos;Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés.
                  </p>
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
