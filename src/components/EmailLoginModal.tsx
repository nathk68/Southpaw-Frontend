'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Mail } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmailLoginModal({ isOpen, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleDiscordLogin = () => {
    // Redirect vers Discord OAuth
    window.location.href = '/api/auth/discord';
  };

  const handleWhopLogin = () => {
    // Redirect vers Whop OAuth
    window.location.href = '/api/auth/whop';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/whop/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        // Petite pause pour que le cookie soit bien créé
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        setError(data.error || 'Email non trouvé dans nos abonnés Whop');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-brand-dark border-2 border-brand-lime max-w-md w-full my-auto">
        <div className="p-6 border-b border-brand-lime/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="text-brand-lime" size={24} />
              <h2 className="font-display text-2xl font-bold text-white uppercase">
                Connexion
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Discord Login - Unique option */}
          <button
            onClick={handleDiscordLogin}
            className="w-full px-6 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono font-bold uppercase transition-colors flex items-center justify-center gap-3 group"
          >
            <FaDiscord size={32} className="group-hover:rotate-12 transition-transform" />
            <div className="text-center flex-1">
              <div className="text-sm">Se connecter avec</div>
              <div className="text-xl">DISCORD</div>
            </div>
          </button>

          <p className="mt-4 text-sm text-gray-400 text-center font-mono">
            Connectez-vous avec Discord pour vérifier votre abonnement
          </p>
        </div>

        <form onSubmit={handleSubmit} className="hidden">
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2 uppercase">
              Email Whop
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 bg-black border-2 border-brand-lime/30 text-white font-mono focus:border-brand-lime outline-none transition-colors"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 font-mono">
              Utilisez l&apos;email de votre compte Whop
            </p>
          </div>

          {error && (
            <div className="border-2 border-red-500/50 bg-red-500/10 p-4">
              <div className="flex items-start gap-2">
                <span className="text-red-500 text-lg">⚠</span>
                <p className="text-red-400 text-sm font-mono leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-brand-lime text-black font-mono font-bold uppercase hover:bg-brand-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Vérification en cours...
              </>
            ) : (
              'Vérifier mon accès'
            )}
          </button>
        </form>

        <div className="p-6 border-t border-white/10 bg-white/5">
          <p className="text-xs text-gray-500 font-mono text-center mb-4 uppercase">
            Pas encore abonné?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://whop.com/checkout/plan_DjGRIqi0cbxc4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-brand-lime text-black text-center font-mono text-xs font-bold hover:bg-brand-lime/90 transition-colors uppercase"
            >
              Southpaw PRO
            </a>
            <a
              href="https://whop.com/checkout/plan_hOMobCScuCYPM"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 border-2 border-brand-lime text-brand-lime text-center font-mono text-xs font-bold hover:bg-brand-lime/10 transition-colors uppercase"
            >
              PPV Pass
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
