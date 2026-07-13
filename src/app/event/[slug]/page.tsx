'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Shield, Loader2, Trophy, Brain, TrendingUp, X, ExternalLink, Lock, ShoppingCart, Zap } from 'lucide-react';
import { Navbar, Footer, CustomCursor } from '@/components/LandingUI';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PRODUCT_LINKS } from '@/lib/whop';
import { canAccessEvent } from '@/lib/access-control';

interface Fight {
  fighter1: string;
  fighter2: string;
  fighter1Image?: string;
  fighter2Image?: string;
  weightClass: string;
  isTitleFight: boolean;
  order: number;
}

interface FighterInfo {
  name: string;
  style?: string;
  age?: string;
  reach?: string;
  profileUrl?: string;
}

interface PredictionData {
  fighter1WinProbability: number;
  fighter2WinProbability: number;
  confidenceScore: number;
  breakdown: {
    knockdownAdvantage: number;
    strikingAdvantage: number;
    grapplingAdvantage: number;
    groundAdvantage: number;
    controlAdvantage: number;
    headStrikesAdvantage: number;
    defensiveAdvantage: number;
    submissionAdvantage: number;
    finishPotential: number;
    experienceAdvantage: number;
  };
  analysis: {
    keyFactors: string[];
    warnings: string[];
    prediction: string;
  };
}

interface PredictionResponse {
  success: boolean;
  fighter1?: FighterInfo;
  fighter2?: FighterInfo;
  prediction?: PredictionData;
  error?: string;
}

interface EventDetails {
  title: string;
  date: string;
  location: string;
  mainCard: Fight[];
  preliminaryCard: Fight[];
  earlyPrelims: Fight[];
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, access, login, logout } = useAuth();
  const { t, lang } = useLanguage();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [fighter1Info, setFighter1Info] = useState<FighterInfo | null>(null);
  const [fighter2Info, setFighter2Info] = useState<FighterInfo | null>(null);
  const [nextEventSlugs, setNextEventSlugs] = useState<string[] | null>(null);
  const [eventAccessBlocked, setEventAccessBlocked] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/event?slug=${slug}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setEvent(data.data);
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEventDetails();
    }
  }, [slug]);

  // Fetch the next event and check access
  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const response = await fetch('/api/events/next');
        const data = await response.json();

        if (data.success && data.data) {
          // Use pre-computed nextSlugs (next 3 events) for PPV access window
          if (data.nextSlugs?.length) {
            setNextEventSlugs(data.nextSlugs);
          } else {
            // Fallback: extract slug from first event URL
            const slug = data.data.url.split('/').pop()?.split('?')[0] || '';
            setNextEventSlugs(slug ? [slug] : []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch next event:', err);
      }
    };

    fetchNextEvent();
  }, []);

  // Check event access when we have all necessary data
  useEffect(() => {
    if (!loading && event && nextEventSlugs !== null && access) {
      const accessResult = canAccessEvent(access, slug, nextEventSlugs);

      if (!accessResult.canAccess && accessResult.reason === 'ppv_restricted') {
        setEventAccessBlocked(true);
      } else {
        setEventAccessBlocked(false);
      }
    }
  }, [loading, event, nextEventSlugs, access, slug]);

  const handlePredictFight = async (fight: Fight) => {
    setSelectedFight(fight);
    setShowPrediction(true);
    setPrediction(null);
    setPredictionError(null);
    setFighter1Info(null);
    setFighter2Info(null);

    // Check if user is not authenticated
    if (!user) {
      setPredictionError('auth_required');
      return;
    }

    // Re-vérifier la session avant chaque prédiction
    try {
      const verifyResponse = await fetch('/api/auth/verify-roles', {
        method: 'POST',
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();

        // Si la session a expiré, déconnecter et demander re-connexion
        if (data.expired) {
          console.log('⏰ Session expired, user must re-login');
          await logout();
          setPredictionError('auth_required');
          return;
        }

        // Si l'utilisateur n'a plus accès
        if (!data.hasAccess) {
          console.log('❌ User no longer has access');
          setPredictionError('no_access');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to verify session:', error);
      // Continue quand même si la vérification échoue (failsafe)
    }

    // Check if user doesn't have access
    if (!access?.hasAccess) {
      setPredictionError('no_access');
      return;
    }

    // User has access, proceed with prediction
    setPredictionLoading(true);

    // Fonction pour normaliser le nom en format URL slug
    const toSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/'/g, '') // Supprimer les apostrophes
        .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
        .replace(/[^a-z0-9-]/g, ''); // Supprimer les caractères spéciaux
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fighter1Name: toSlug(fight.fighter1),
          fighter2Name: toSlug(fight.fighter2),
          lang,
        }),
      });

      const data: PredictionResponse = await response.json();

      if (data.success && data.prediction) {
        setPrediction(data.prediction);
        setFighter1Info(data.fighter1 || null);
        setFighter2Info(data.fighter2 || null);
      } else {
        // Display error message to the user
        setPredictionError(data.error || 'Une erreur est survenue lors de la prédiction');
        console.error('Prediction error:', data.error);
      }
    } catch (error) {
      setPredictionError('Erreur de connexion au serveur');
      console.error('Error fetching prediction:', error);
    } finally {
      setPredictionLoading(false);
    }
  };

  const PredictionModal = () => {
    if (!showPrediction || !selectedFight) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-brand-dark border-2 border-brand-lime max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-brand-dark border-b-2 border-brand-lime p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="text-brand-lime" size={24} />
              <h2 className="font-display text-2xl font-bold text-white uppercase">
                {t.event.modalTitle}
              </h2>
            </div>
            <button
              onClick={() => setShowPrediction(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="font-mono text-sm text-gray-400 mb-2">MATCHUP</div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl text-white">{selectedFight.fighter1}</span>
                  {fighter1Info?.profileUrl && (
                    <a
                      href={fighter1Info.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-lime hover:text-brand-lime/80 transition-colors"
                      title={t.event.viewProfile}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                <span className="text-gray-600 font-bold">VS</span>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl text-white">{selectedFight.fighter2}</span>
                  {fighter2Info?.profileUrl && (
                    <a
                      href={fighter2Info.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-lime hover:text-brand-lime/80 transition-colors"
                      title={t.event.viewProfile}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {predictionLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-brand-lime animate-spin mb-4" />
                <p className="text-brand-lime font-mono text-sm animate-pulse">
                  {t.event.calculating}
                </p>
              </div>
            )}

            {predictionError && !predictionLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                {/* Auth Required Error */}
                {predictionError === 'auth_required' && (
                  <div className="border-2 border-brand-lime/50 bg-brand-lime/10 p-8 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-brand-lime/20 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-brand-lime" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-white">
                          {t.event.authTitle}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">AUTH_REQUIRED</p>
                      </div>
                    </div>
                    <div className="border-t border-brand-lime/30 pt-4">
                      <p className="text-gray-300 font-mono text-sm leading-relaxed mb-6">
                        {t.event.authDesc}
                      </p>
                      <button
                        onClick={login}
                        className="w-full px-6 py-3 bg-brand-lime text-black font-mono font-bold uppercase hover:bg-brand-lime/90 transition-colors"
                      >
                        {t.event.loginBtn}
                      </button>
                    </div>
                  </div>
                )}

                {/* No Access Error */}
                {predictionError === 'no_access' && (
                  <div className="border-2 border-yellow-500/50 bg-yellow-500/10 p-8 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-white">
                          {t.event.subTitle}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">SUBSCRIPTION_REQUIRED</p>
                      </div>
                    </div>
                    <div className="border-t border-yellow-500/30 pt-4">
                      <p className="text-gray-300 font-mono text-sm leading-relaxed mb-6">
                        {t.event.subDesc}
                      </p>
                      <div className="space-y-3">
                        <a
                          href={PRODUCT_LINKS.PRO}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-6 py-3 bg-brand-lime text-black text-center font-mono font-bold uppercase hover:bg-brand-lime/90 transition-colors"
                        >
                          Southpaw PRO
                        </a>
                        <a
                          href={PRODUCT_LINKS.PPV}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-6 py-3 border-2 border-brand-lime text-brand-lime text-center font-mono font-bold uppercase hover:bg-brand-lime/10 transition-colors"
                        >
                          PPV Pass
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Errors */}
                {predictionError !== 'auth_required' && predictionError !== 'no_access' && (
                  <div className="border-2 border-red-500/50 bg-red-500/10 p-8 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <X className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-white">
                          {t.event.errorTitle}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">PREDICTION_ERROR</p>
                      </div>
                    </div>
                    <div className="border-t border-red-500/30 pt-4">
                      <p className="text-red-400 font-mono text-sm leading-relaxed">
                        {predictionError}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-red-500/30">
                      <p className="text-gray-500 text-xs font-mono">
                        {t.event.fighterNotInDb}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {prediction && !predictionLoading && !predictionError && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border-2 border-red-500/30 bg-red-500/5 p-6">
                    <div className="text-xs text-red-500 font-mono font-bold mb-2">RED CORNER</div>
                    <div className="text-4xl font-display font-bold text-white mb-1">
                      {prediction.fighter1WinProbability.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400 font-mono">{t.event.winProbability}</div>
                  </div>

                  <div className="border-2 border-blue-500/30 bg-blue-500/5 p-6">
                    <div className="text-xs text-blue-500 font-mono font-bold mb-2">BLUE CORNER</div>
                    <div className="text-4xl font-display font-bold text-white mb-1">
                      {prediction.fighter2WinProbability.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400 font-mono">{t.event.winProbability}</div>
                  </div>
                </div>

                {/* Verdict Section */}
                <div className="border-2 border-white/20 bg-white/5 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="text-brand-lime" size={18} />
                    <span className="font-mono text-sm text-brand-lime font-bold uppercase">
                      {t.event.verdictTitle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {prediction.fighter1WinProbability > prediction.fighter2WinProbability ? (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="font-display text-2xl font-bold text-white">
                            {selectedFight.fighter1}
                          </span>
                          <span className="text-xs text-red-500 font-mono font-bold">RED CORNER</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-display text-2xl font-bold text-white">
                            {selectedFight.fighter2}
                          </span>
                          <span className="text-xs text-blue-500 font-mono font-bold">BLUE CORNER</span>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-mono mb-1">{t.event.gap}</div>
                      <div className="text-lg font-mono font-bold text-brand-lime">
                        {Math.abs(prediction.fighter1WinProbability - prediction.fighter2WinProbability).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-brand-lime/30 bg-brand-lime/5 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-brand-lime" size={18} />
                    <span className="font-mono text-sm text-brand-lime font-bold">
                      {t.event.confidence} {prediction.confidenceScore}%
                    </span>
                  </div>
                  <p className="text-white font-mono text-lg">{prediction.analysis.prediction}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-mono text-sm text-gray-400 font-bold uppercase">{t.event.pillarsTitle}</h3>

                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { label: 'Knockdowns', value: prediction.breakdown.knockdownAdvantage },
                      { label: 'Striking', value: prediction.breakdown.strikingAdvantage },
                      { label: 'Grappling', value: prediction.breakdown.grapplingAdvantage },
                      { label: 'Ground %', value: prediction.breakdown.groundAdvantage },
                      { label: t.event.pillarControl, value: prediction.breakdown.controlAdvantage },
                      { label: 'Head Strikes', value: prediction.breakdown.headStrikesAdvantage },
                      { label: t.event.pillarDefense, value: prediction.breakdown.defensiveAdvantage },
                      { label: 'Submissions', value: prediction.breakdown.submissionAdvantage },
                      { label: 'Finish', value: prediction.breakdown.finishPotential },
                      { label: t.event.pillarExperience, value: prediction.breakdown.experienceAdvantage }
                    ].map((pillar) => {
                      // Ne pas plafonner la valeur pour l'affichage du label
                      const rawValue = pillar.value;

                      // Plafonner seulement pour le calcul visuel de la barre (pour éviter 100% d'une couleur)
                      // On normalise entre -100 et +100 pour avoir toujours un minimum de chaque couleur visible
                      const normalizedValue = Math.min(Math.max(pillar.value, -100), 100);

                      // Convertir en pourcentage: -100 = 100% RED, 0 = 50/50, +100 = 100% BLUE
                      const bluePercentage = ((normalizedValue + 100) / 200) * 100;
                      const redPercentage = 100 - bluePercentage;

                      // Déterminer qui a l'avantage pour l'affichage du label (utiliser la vraie valeur)
                      const advantage = Math.abs(rawValue);
                      const advantageLabel = rawValue > 0 ? 'BLUE' : rawValue < 0 ? 'RED' : 'EQUAL';

                      return (
                        <div key={pillar.label} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-gray-400 uppercase">{pillar.label}</span>
                            {advantageLabel !== 'EQUAL' && (
                              <span className="font-mono text-xs text-gray-500">
                                {advantageLabel} +{advantage.toFixed(0)}
                              </span>
                            )}
                          </div>
                          <div className="relative h-3 border border-gray-700 overflow-hidden">
                            {/* Barre rouge (part de la gauche) */}
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                              style={{ width: `${redPercentage}%` }}
                            />
                            {/* Barre bleue (part de la droite) */}
                            <div
                              className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-blue-600 to-blue-500 transition-all duration-500"
                              style={{ width: `${bluePercentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 md:col-span-2">
                    <p className="text-xs text-gray-500 font-mono text-center">
                      {t.event.pillarsDesc}
                    </p>
                  </div>
                </div>

                {prediction.analysis.keyFactors.length > 0 && (
                  <div className="border-2 border-white/10 p-4">
                    <h3 className="font-mono text-sm text-gray-400 font-bold uppercase mb-3">
                      {t.event.keyFactors}
                    </h3>
                    <ul className="space-y-2">
                      {prediction.analysis.keyFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-brand-lime mt-1">•</span>
                          <span className="text-gray-300 font-mono text-sm">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {prediction.analysis.warnings.length > 0 && (
                  <div className="border-2 border-yellow-500/30 bg-yellow-500/5 p-4">
                    <h3 className="font-mono text-sm text-yellow-500 font-bold uppercase mb-3">
                      {t.event.warnings}
                    </h3>
                    <ul className="space-y-2">
                      {prediction.analysis.warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">⚠</span>
                          <span className="text-gray-300 font-mono text-sm">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t-2 border-white/10 pt-4">
                  <p className="text-xs text-gray-500 font-mono text-center">
                    {t.event.poweredBy}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FightCard = ({ fight, index }: { fight: Fight; index: number }) => (
    <div className="group border-2 border-white/10 bg-brand-dark hover:border-brand-lime transition-all duration-300 p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-lime text-black font-mono font-bold flex items-center justify-center text-sm">
            {index + 1}
          </div>
          <div className="text-gray-400 font-mono text-xs uppercase">
            {fight.weightClass}
          </div>
        </div>
        {fight.isTitleFight && (
          <div className="flex items-center gap-2 bg-brand-lime/10 border border-brand-lime/30 px-3 py-1">
            <Trophy size={14} className="text-brand-lime" />
            <span className="text-brand-lime font-mono text-xs font-bold uppercase">Title Fight</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-6 items-center">
        <div className="col-span-2 flex flex-col items-end gap-2">
          {fight.fighter1Image && (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-red-500 group-hover:border-brand-lime transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fight.fighter1Image}
                alt={fight.fighter1}
                className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500"
                
              />
            </div>
          )}
          <div className="text-right">
            <div className="font-display text-xl md:text-2xl font-bold text-white group-hover:text-brand-lime transition-colors uppercase">
              {fight.fighter1}
            </div>
            <div className="text-xs text-red-500 font-mono mt-1 font-bold">RED CORNER</div>
          </div>
        </div>

        <div className="col-span-1 text-center">
          <div className="font-display text-3xl font-bold italic text-gray-600">VS</div>
        </div>

        <div className="col-span-2 flex flex-col items-start gap-2">
          {fight.fighter2Image && (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-blue-500 group-hover:border-brand-lime transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fight.fighter2Image}
                alt={fight.fighter2}
                className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500"
                
              />
            </div>
          )}
          <div className="text-left">
            <div className="font-display text-xl md:text-2xl font-bold text-white group-hover:text-brand-lime transition-colors uppercase">
              {fight.fighter2}
            </div>
            <div className="text-xs text-blue-500 font-mono mt-1 font-bold">BLUE CORNER</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        {eventAccessBlocked ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 border-2 border-gray-600 text-gray-400 font-mono text-sm font-bold uppercase cursor-not-allowed w-full justify-center">
              <Lock size={18} />
              {t.event.proOnly}
            </div>
            <a
              href={PRODUCT_LINKS.PRO}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-brand-lime/30 text-brand-lime hover:bg-brand-lime/10 font-mono text-xs font-bold uppercase transition-colors"
            >
              <Zap size={14} />
              {t.event.upgradeToPro}
            </a>
          </div>
        ) : (
          <button
            onClick={() => handlePredictFight(fight)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-lime/10 border-2 border-brand-lime/30 hover:bg-brand-lime hover:text-black text-brand-lime font-mono text-sm font-bold uppercase transition-all duration-300 group/btn"
          >
            <Brain size={18} className="group-hover/btn:rotate-12 transition-transform" />
            {t.event.predictBtn}
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-0 h-1 bg-brand-lime group-hover:w-full transition-all duration-500"></div>
    </div>
  );

  const CardSection = ({ title, fights, icon: Icon }: { title: string; fights: Fight[]; icon: any }) => {
    if (fights.length === 0) return null;

    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Icon className="text-brand-lime" size={24} />
          <h2 className="font-display text-3xl font-bold text-white uppercase">{title}</h2>
          <div className="h-px flex-1 bg-brand-lime/30"></div>
          <span className="text-gray-500 font-mono text-sm">{t.event.fights(fights.length)}</span>
        </div>

        <div className="space-y-4">
          {fights.map((fight, index) => (
            <FightCard key={index} fight={fight} index={index} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="antialiased text-brand-white bg-brand-black min-h-screen selection:bg-brand-lime selection:text-black font-sans">
      <CustomCursor />
      <Navbar />
      <PredictionModal />

      <main className="pt-32 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <button
              onClick={() => router.push('/fight-card')}
              className="group flex items-center gap-2 text-brand-lime hover:text-white transition-colors font-mono text-sm"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              {t.event.back}
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-12 h-12 text-brand-lime animate-spin mb-4" />
              <p className="text-brand-lime text-center font-mono animate-pulse">
                {t.event.loading}
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="border-2 border-red-500/30 bg-red-500/10 p-8 text-center">
              <p className="text-red-400 font-mono">{error}</p>
              <button
                onClick={() => router.push('/fight-card')}
                className="mt-4 px-6 py-2 bg-red-500 text-white font-mono text-sm hover:bg-red-600 transition-colors"
              >
                {t.event.backError}
              </button>
            </div>
          )}

          {event && !loading && (
            <>
              <div className="mb-16">
                <div className="border-2 border-brand-lime bg-brand-lime/5 p-8 md:p-12">
                  <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl mb-6 text-white uppercase leading-tight">
                    {event.title}
                  </h1>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-gray-300">
                      <Calendar size={20} className="text-brand-lime" />
                      <span className="font-mono text-lg">{event.date}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-300">
                      <MapPin size={20} className="text-brand-lime" />
                      <span className="font-mono text-lg">{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-6 h-1 w-full bg-brand-lime"></div>
                </div>
              </div>

              {/* PPV Pass Restriction Notice */}
              {eventAccessBlocked && access?.isPPV && (
                <div className="mb-12 border-2 border-brand-lime bg-brand-lime/5 p-8 md:p-12">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-brand-lime/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-8 h-8 text-brand-lime" />
                    </div>
                    <div>
                      <h2 className="font-display text-3xl font-bold text-white uppercase mb-2">
                        {t.event.proReservedTitle}
                      </h2>
                      <p className="text-gray-400 font-mono text-sm">
                        {t.event.ppvRestriction}
                      </p>
                    </div>
                  </div>

                  <div className="border-t-2 border-brand-lime/30 pt-6 mb-6">
                    <p className="text-gray-300 font-mono text-base leading-relaxed mb-4">
                      {t.event.ppvDesc1} <span className="text-white font-bold">PPV Pass</span>{t.event.ppvDesc2}
                    </p>
                    <p className="text-gray-300 font-mono text-base leading-relaxed">
                      {t.event.ppvUpgradePrefix} <span className="text-brand-lime font-bold">Southpaw PRO</span> {t.event.ppvUpgradeSuffix}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-brand-dark border border-brand-lime/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-brand-lime rounded-full"></div>
                        <span className="text-white font-mono text-sm font-bold">{t.event.unlimitedAccess}</span>
                      </div>
                      <p className="text-gray-400 font-mono text-xs">
                        {t.event.unlimitedDesc}
                      </p>
                    </div>

                    <div className="bg-brand-dark border border-brand-lime/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-brand-lime rounded-full"></div>
                        <span className="text-white font-mono text-sm font-bold">{t.event.fullHistory}</span>
                      </div>
                      <p className="text-gray-400 font-mono text-xs">
                        {t.event.fullHistoryDesc}
                      </p>
                    </div>

                    <div className="bg-brand-dark border border-brand-lime/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-brand-lime rounded-full"></div>
                        <span className="text-white font-mono text-sm font-bold">{t.event.realTimeUpdates}</span>
                      </div>
                      <p className="text-gray-400 font-mono text-xs">
                        {t.event.realTimeDesc}
                      </p>
                    </div>

                    <div className="bg-brand-dark border border-brand-lime/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-brand-lime rounded-full"></div>
                        <span className="text-white font-mono text-sm font-bold">{t.event.prioritySupport}</span>
                      </div>
                      <p className="text-gray-400 font-mono text-xs">
                        {t.event.priorityDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href={PRODUCT_LINKS.PRO}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-brand-lime text-black font-mono font-bold uppercase hover:bg-brand-lime/90 transition-colors group"
                    >
                      <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      {t.event.upgradeBtn}
                    </a>
                    <button
                      onClick={() => router.push('/fight-card')}
                      className="flex-1 px-8 py-4 border-2 border-brand-lime/30 text-brand-lime font-mono font-bold uppercase hover:bg-brand-lime/10 transition-colors"
                    >
                      {t.event.allEventsBtn}
                    </button>
                  </div>
                </div>
              )}

              <CardSection title="Main Card" fights={event.mainCard} icon={Trophy} />
              <CardSection title="Preliminary Card" fights={event.preliminaryCard} icon={Shield} />
              <CardSection title="Early Prelims" fights={event.earlyPrelims} icon={Shield} />

              {event.mainCard.length === 0 && event.preliminaryCard.length === 0 && event.earlyPrelims.length === 0 && (
                <div className="border-2 border-white/10 bg-white/5 p-12 text-center">
                  <p className="text-gray-400 font-mono text-lg">
                    {t.event.noFightsTitle}
                  </p>
                  <p className="text-gray-500 font-mono text-sm mt-2">
                    {t.event.noFightsDesc}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
