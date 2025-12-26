'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Trophy, TrendingUp, Calendar, MapPin, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { Navbar, Footer, CustomCursor } from '@/components/LandingUI';

interface FightPrediction {
  fighter1: string;
  fighter2: string;
  weightClass: string;
  isTitleFight: boolean;
  prediction: {
    fighter1WinProbability: number;
    fighter2WinProbability: number;
    breakdown: {
      strikingAdvantage: number;
      grapplingAdvantage: number;
      biometricAdvantage: number;
      finishPotential: number;
      experienceAdvantage: number;
    };
  } | null;
  algorithmPrediction: 'fighter1' | 'fighter2' | null;
  actualWinner: 'fighter1' | 'fighter2' | 'draw' | 'no-contest' | 'cancelled';
  wasCorrect: boolean | null;
}

interface HistoricalEvent {
  slug: string;
  title: string;
  date: string;
  location: string;
  accuracy: number;
  correctPredictions: number;
  totalDecidedFights: number;
  totalFights: number;
  fights: FightPrediction[];
}

interface HistoricalDataMetadata {
  globalAccuracy: number;
  totalTestFights: number;
  correctPredictions: number;
  displayedEvents: number;
  trainingFights: number;
  generatedAt: string;
}

interface HistoricalData {
  metadata: HistoricalDataMetadata;
  events: HistoricalEvent[];
}

export default function StatsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [metadata, setMetadata] = useState<HistoricalDataMetadata | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const response = await fetch('/historical-predictions.json');
        const data: HistoricalData = await response.json();

        // Charger la metadata
        setMetadata(data.metadata);

        // Trier les événements du plus récent au plus ancien
        const sortedEvents = data.events.sort((a: HistoricalEvent, b: HistoricalEvent) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setEvents(sortedEvents);
      } catch (error) {
        console.error('Error loading historical data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, []);

  const getWinnerIcon = (wasCorrect: boolean | null) => {
    if (wasCorrect === true) return <CheckCircle2 className="text-green-500" size={20} />;
    if (wasCorrect === false) return <XCircle className="text-red-500" size={20} />;
    return <Circle className="text-gray-500" size={20} />;
  };

  const getWinnerText = (winner: string) => {
    if (winner === 'fighter1') return 'Red Corner';
    if (winner === 'fighter2') return 'Blue Corner';
    if (winner === 'draw') return 'Draw';
    if (winner === 'no-contest') return 'No Contest';
    if (winner === 'cancelled') return 'Cancelled';
    return 'Unknown';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-500';
    if (accuracy >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Utiliser la metadata pour la précision globale (basée sur TOUS les combats de test)
  // au lieu de calculer seulement sur les événements affichés
  const globalAccuracy = metadata?.globalAccuracy || 0;
  const globalStats = metadata ? {
    totalCorrect: metadata.correctPredictions,
    totalDecided: metadata.totalTestFights,
    totalEvents: events.length,
    displayedEvents: metadata.displayedEvents,
    trainingFights: metadata.trainingFights
  } : null;

  return (
    <div className="antialiased text-brand-white bg-brand-black min-h-screen selection:bg-brand-lime selection:text-black font-sans">
      <CustomCursor />
      <Navbar />

      <main className="pt-32 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-12">
            <button
              onClick={() => router.push('/')}
              className="group flex items-center gap-2 text-brand-lime hover:text-white transition-colors font-mono text-sm"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Retour
            </button>
          </div>

          <div className="mb-12">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 uppercase">
              Statistiques
              <span className="text-brand-lime">.</span>
            </h1>
            <p className="text-gray-400 font-mono text-sm md:text-base max-w-2xl">
              Performance historique du Southpaw Predictive Engine sur les événements UFC passés
            </p>
          </div>

          {/* Global Stats */}
          {globalStats && (
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              <div className="border-2 border-brand-lime/30 bg-brand-lime/5 p-6">
                <div className="text-xs text-brand-lime font-mono font-bold mb-2">PRÉCISION GLOBALE</div>
                <div className={`text-4xl font-display font-bold mb-1 ${getAccuracyColor(globalAccuracy)}`}>
                  {globalAccuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  {globalStats.totalCorrect}/{globalStats.totalDecided} combats de test
                </div>
              </div>

              <div className="border-2 border-white/10 bg-brand-dark p-6">
                <div className="text-xs text-gray-400 font-mono font-bold mb-2">ÉVÉNEMENTS AFFICHÉS</div>
                <div className="text-4xl font-display font-bold text-white mb-1">
                  {globalStats.displayedEvents}
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  Les plus récents
                </div>
              </div>

              <div className="border-2 border-white/10 bg-brand-dark p-6">
                <div className="text-xs text-gray-400 font-mono font-bold mb-2">DONNÉES D'ENTRAÎNEMENT</div>
                <div className="text-4xl font-display font-bold text-white mb-1">
                  {globalStats.trainingFights.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  Combats historiques
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-brand-lime font-mono">Chargement des données...</div>
            </div>
          )}

          {/* Events List */}
          {!loading && events.length > 0 && (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.slug} className="border-2 border-white/10 bg-brand-dark overflow-hidden">
                  {/* Event Header */}
                  <button
                    onClick={() => setExpandedEvent(expandedEvent === event.slug ? null : event.slug)}
                    className="w-full p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="text-brand-lime" size={20} />
                          <h2 className="font-display text-xl md:text-2xl font-bold text-white uppercase">
                            {event.title}
                          </h2>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-mono">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            {event.location}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className={`text-3xl font-display font-bold ${getAccuracyColor(event.accuracy || 0)}`}>
                            {event.accuracy ? event.accuracy.toFixed(1) : '0.0'}%
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {event.correctPredictions}/{event.totalDecidedFights}
                          </div>
                        </div>

                        {expandedEvent === event.slug ? (
                          <ChevronUp className="text-brand-lime" size={24} />
                        ) : (
                          <ChevronDown className="text-gray-400" size={24} />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Event Details */}
                  {expandedEvent === event.slug && (
                    <div className="border-t-2 border-white/10 p-6 space-y-4">
                      {event.fights.map((fight, idx) => (
                        <div key={idx} className="border-2 border-white/5 bg-black/20 p-4">
                          {/* Fight Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <div className="font-mono text-xs text-gray-500 mb-2">
                                {fight.weightClass}
                                {fight.isTitleFight && <span className="ml-2 text-yellow-500">👑 TITLE</span>}
                              </div>
                              <div className="font-display text-lg font-bold text-white">
                                <span className="text-red-500">{fight.fighter1}</span>
                                {' vs '}
                                <span className="text-blue-500">{fight.fighter2}</span>
                              </div>
                            </div>
                            {getWinnerIcon(fight.wasCorrect)}
                          </div>

                          {/* Prediction vs Reality */}
                          {fight.prediction ? (
                            <div className="grid md:grid-cols-2 gap-4">
                              {/* Prediction */}
                              <div className="border border-brand-lime/30 bg-brand-lime/5 p-4 rounded">
                                <div className="flex items-center gap-2 mb-3">
                                  <TrendingUp className="text-brand-lime" size={16} />
                                  <span className="font-mono text-xs text-brand-lime font-bold">
                                    PRÉDICTION ALGORITHME
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-mono text-sm text-gray-300">Red Corner</span>
                                  <span className="font-mono text-lg font-bold text-white">
                                    {fight.prediction.fighter1WinProbability.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-sm text-gray-300">Blue Corner</span>
                                  <span className="font-mono text-lg font-bold text-white">
                                    {fight.prediction.fighter2WinProbability.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-brand-lime/20">
                                  <span className="font-mono text-xs text-brand-lime">
                                    Avis: {fight.algorithmPrediction === 'fighter1' ? fight.fighter1 : fight.fighter2}
                                  </span>
                                </div>
                              </div>

                              {/* Reality */}
                              <div className="border border-white/20 bg-white/5 p-4 rounded">
                                <div className="flex items-center gap-2 mb-3">
                                  {fight.wasCorrect === true ? (
                                    <CheckCircle2 className="text-green-500" size={16} />
                                  ) : fight.wasCorrect === false ? (
                                    <XCircle className="text-red-500" size={16} />
                                  ) : (
                                    <Circle className="text-gray-500" size={16} />
                                  )}
                                  <span className="font-mono text-xs text-gray-400 font-bold">
                                    RÉSULTAT RÉEL
                                  </span>
                                </div>
                                <div className="text-2xl font-display font-bold text-white mb-2">
                                  {getWinnerText(fight.actualWinner)}
                                </div>
                                {fight.actualWinner === 'fighter1' && (
                                  <div className="text-sm text-gray-400 font-mono">
                                    Victoire de {fight.fighter1}
                                  </div>
                                )}
                                {fight.actualWinner === 'fighter2' && (
                                  <div className="text-sm text-gray-400 font-mono">
                                    Victoire de {fight.fighter2}
                                  </div>
                                )}
                                <div className="mt-3 pt-3 border-t border-white/20">
                                  <span className={`font-mono text-xs font-bold ${
                                    fight.wasCorrect === true ? 'text-green-500' :
                                    fight.wasCorrect === false ? 'text-red-500' :
                                    'text-gray-500'
                                  }`}>
                                    {fight.wasCorrect === true ? '✓ Prédiction correcte' :
                                     fight.wasCorrect === false ? '✗ Prédiction incorrecte' :
                                     '○ Non comptabilisé'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500 font-mono text-sm">
                              Prédiction non disponible (combattants non trouvés)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && events.length === 0 && (
            <div className="text-center py-20">
              <div className="text-gray-500 font-mono mb-4">Aucune donnée historique disponible</div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
