'use client';

import React from 'react';
import { X } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';

interface DiscordLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function DiscordLoginModal({ isOpen, onClose, onLogin }: DiscordLoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-black border-2 border-brand-lime/30 rounded-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Accès aux prédictions</h2>
          <p className="text-gray-400 text-sm">
            Connecte-toi avec Discord pour accéder aux prédictions ML
          </p>
        </div>

        {/* Products */}
        <div className="space-y-3 mb-6">
          <div className="border border-brand-lime/20 rounded-lg p-4 bg-brand-lime/5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-brand-lime">SOUTHPAW PRO</h3>
                <p className="text-xs text-gray-400">Accès illimité à tous les événements</p>
              </div>
              <span className="text-brand-lime font-bold">€19/mois</span>
            </div>
            <a
              href="https://whop.com/southpaw-pro/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-brand-lime text-black font-bold py-2 rounded hover:bg-brand-lime/90 transition-colors text-sm mt-3"
            >
              Acheter PRO
            </a>
          </div>

          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-white">PPV PASS</h3>
                <p className="text-xs text-gray-400">Accès au prochain événement uniquement</p>
              </div>
              <span className="text-white font-bold">€12</span>
            </div>
            <a
              href="https://whop.com/southpaw/ppv-pass/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-white text-black font-bold py-2 rounded hover:bg-white/90 transition-colors text-sm mt-3"
            >
              Acheter PPV
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-300 leading-relaxed">
            <strong className="block mb-1">📋 Instructions :</strong>
            1. Achète un abonnement ci-dessus<br />
            2. Tu recevras automatiquement le rôle Discord correspondant<br />
            3. Connecte-toi avec Discord pour accéder aux prédictions
          </p>
        </div>

        {/* Discord Login Button */}
        <button
          onClick={onLogin}
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
        >
          <FaDiscord size={24} />
          <span>Se connecter avec Discord</span>
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Tu n'as pas encore de compte Discord ?{' '}
          <a
            href="https://discord.gg/Aappan5y8Z"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-lime hover:underline"
          >
            Rejoins notre serveur
          </a>
        </p>
      </div>
    </div>
  );
}
