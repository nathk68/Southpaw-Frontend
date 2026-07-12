'use client';

import { useEffect } from 'react';

/**
 * WhopTokenHandler
 *
 * Ce composant écoute les messages postMessage de Whop.
 * Quand l'app est chargée dans l'iFrame Whop, Whop envoie automatiquement
 * le token d'utilisateur via postMessage.
 *
 * Le composant récupère ce token et le vérifie avec notre backend.
 */
export function WhopTokenHandler() {
  useEffect(() => {
    const handleWhopMessage = async (event: MessageEvent) => {
      // Sécurité: vérifier que le message vient bien de Whop
      if (event.origin !== 'https://whop.com') {
        return;
      }

      // Vérifier que c'est un message de token Whop
      if (event.data?.type === 'WHOP_TOKEN') {
        const token = event.data.token;

        console.log('🔐 Token Whop reçu');

        try {
          // Vérifier le token avec notre backend
          const response = await fetch('/api/auth/whop/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          const data = await response.json();

          if (data.success) {
            console.log('✅ Authentification Whop réussie');
            console.log('📊 Accès:', data.access);

            // Rafraîchir la page pour mettre à jour l'état d'authentification
            // On utilise un petit délai pour que la session soit bien créée
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } else {
            console.error('❌ Échec de vérification du token:', data.error);
          }
        } catch (error) {
          console.error('❌ Erreur lors de la vérification du token Whop:', error);
        }
      }
    };

    // Écouter les messages de Whop
    window.addEventListener('message', handleWhopMessage);

    // Nettoyer à la destruction du composant
    return () => {
      window.removeEventListener('message', handleWhopMessage);
    };
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
}
