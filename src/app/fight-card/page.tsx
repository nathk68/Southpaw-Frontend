'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, ExternalLink, Loader2, Lock, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar, Footer, CustomCursor } from '@/components/LandingUI';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessEvent } from '@/lib/access-control';

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

interface APIResponse {
  success?: boolean;
  error?: string;
  updatedAt: string;
  count: number;
  data: UFCEvent[];
}

export default function FightCardPage() {
  const [events, setEvents] = useState<UFCEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [nextEventSlug, setNextEventSlug] = useState<string | null>(null);
  const router = useRouter();
  const { access } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const data: APIResponse = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setEvents(data.data || []);
          setLastUpdate(data.updatedAt);
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch the next event
  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const response = await fetch('/api/events/next');
        const data = await response.json();

        if (data.success && data.data) {
          const nextSlug = data.data.url.split('/').pop()?.split('?')[0] || '';
          setNextEventSlug(nextSlug);
        }
      } catch (err) {
        console.error('Failed to fetch next event:', err);
      }
    };

    fetchNextEvent();
  }, []);

  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) {
        return 'DATE TBA';
      }
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
    } catch {
      return 'DATE TBA';
    }
  };

  const formatUpdateTime = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="antialiased text-brand-white bg-brand-black min-h-screen selection:bg-brand-lime selection:text-black font-sans">
      <CustomCursor />
      <Navbar />

      <main className="pt-32 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <button
              onClick={() => router.push('/')}
              className="group flex items-center gap-2 text-brand-lime hover:text-white transition-colors font-mono text-sm"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              RETOUR
            </button>
          </div>

          <div className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6">
              <div>
                <h1 className="font-display font-bold text-5xl md:text-7xl mb-4 text-white">
                  FIGHT CARD
                </h1>
                <p className="text-gray-400 font-mono text-sm">
                  Événements UFC à venir scrappés en temps réel depuis ufc.com
                </p>
              </div>

              {lastUpdate && !loading && (
                <div className="flex items-center gap-2 text-xs font-mono bg-brand-lime/10 text-brand-lime px-4 py-2 border border-brand-lime/30 rounded-none">
                  <span className="animate-pulse h-2 w-2 bg-brand-lime rounded-full block"></span>
                  MAJ: {formatUpdateTime(lastUpdate)}
                </div>
              )}
            </div>

            <div className="h-1 w-32 bg-brand-lime rounded-none"></div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-12 h-12 text-brand-lime animate-spin mb-4" />
              <p className="text-brand-lime text-center font-mono animate-pulse">
                Scanning UFC Frequency...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="border-2 border-red-500/30 bg-red-500/10 p-8 text-center">
              <p className="text-red-400 font-mono">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-red-500 text-white font-mono text-sm hover:bg-red-600 transition-colors"
              >
                RÉESSAYER
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="border-2 border-white/10 bg-white/5 p-8 text-center">
              <p className="text-gray-400 font-mono">Aucun événement à venir trouvé.</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => {
                const eventSlug = event.url.split('/').pop() || `event-${index}`;
                const isNextEvent = nextEventSlug === eventSlug;
                const accessResult = canAccessEvent(access, eventSlug, nextEventSlug);
                const isRestricted = !accessResult.canAccess && access?.isPPV;

                return (
                  <div
                    key={index}
                    onClick={() => router.push(`/event/${eventSlug}`)}
                    className="group relative border-2 border-white/10 bg-brand-dark hover:border-brand-lime transition-all duration-500 overflow-hidden hover:scale-105 hover:shadow-2xl hover:shadow-brand-lime/20 cursor-pointer"
                  >
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                      {event.imgUrl && (
                        <div className="absolute inset-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={event.imgUrl}
                            alt={event.mainCard}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent"></div>
                        </div>
                      )}

                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        <div className="bg-brand-lime text-black font-mono text-xs font-bold px-3 py-1 border-2 border-brand-lime uppercase">
                          {event.eventType}
                        </div>
                        {/* Badge for PPV users */}
                        {access?.isPPV && isNextEvent && (
                          <div className="bg-green-500 text-black font-mono text-xs font-bold px-3 py-1 border-2 border-green-500 uppercase flex items-center gap-1">
                            <Zap size={12} />
                            PPV ACCESS
                          </div>
                        )}
                        {/* Badge for restricted events */}
                        {isRestricted && (
                          <div className="bg-gray-800/90 text-gray-400 font-mono text-xs font-bold px-3 py-1 border-2 border-gray-600 uppercase flex items-center gap-1">
                            <Lock size={12} />
                            PRO ONLY
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4 z-10">
                        <div className="text-white font-display text-lg font-bold uppercase drop-shadow-lg">
                          {event.eventNumber ? `UFC ${event.eventNumber}` : event.eventType}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-display text-2xl font-bold mb-3 text-white group-hover:text-brand-lime transition-colors uppercase">
                        {event.mainCard}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                          <Calendar size={14} className="text-brand-lime" />
                          <span>{formatDate(event.dateISO)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                          <MapPin size={14} className="text-brand-lime" />
                          <span className="truncate">{event.location.split('\n')[0]}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/event/${eventSlug}`);
                          }}
                          className="group/link inline-flex items-center gap-2 text-brand-lime hover:text-white font-mono text-xs transition-colors"
                        >
                          VOIR DÉTAILS
                          <ExternalLink size={12} className="group-hover/link:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/0 to-brand-lime/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-0 h-1 bg-brand-lime group-hover:w-full transition-all duration-700"></div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && events.length > 0 && (
            <div className="mt-12 text-center">
              <p className="text-gray-500 font-mono text-xs">
                {events.length} événement{events.length > 1 ? 's' : ''} trouvé{events.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
