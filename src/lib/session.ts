/**
 * Signe une session avec HMAC pour empêcher la falsification
 * Utilise Web Crypto API pour compatibilité avec Edge Runtime
 */
export async function signSession(sessionData: any): Promise<string> {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  // Validation de la longueur minimale pour sécurité (256 bits minimum)
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long for security');
  }

  const sessionJson = JSON.stringify(sessionData);

  // Convertir le secret en clé crypto
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Créer la signature HMAC
  const dataToSign = encoder.encode(sessionJson);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataToSign);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return JSON.stringify({
    data: sessionData,
    signature: signature,
  });
}

/**
 * Vérifie et décode une session signée
 * Retourne null si la signature est invalide
 * Utilise Web Crypto API pour compatibilité avec Edge Runtime
 */
export async function verifySession(signedSession: string): Promise<any | null> {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  // Validation de la longueur minimale pour sécurité (256 bits minimum)
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long for security');
  }

  try {
    const parsed = JSON.parse(signedSession);

    if (!parsed.data || !parsed.signature) {
      return null;
    }

    // Convertir le secret en clé crypto
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Re-calculer la signature
    const sessionJson = JSON.stringify(parsed.data);
    const dataToSign = encoder.encode(sessionJson);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataToSign);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Comparaison timing-safe pour éviter les attaques par timing
    // Convertir les signatures hex en Uint8Array pour comparaison constante
    const expectedBuffer = new Uint8Array(
      expectedSignature.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    const actualBuffer = new Uint8Array(
      parsed.signature.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    // Vérifier d'abord la longueur (pas de timing attack sur la longueur)
    if (expectedBuffer.length !== actualBuffer.length) {
      console.warn('⚠️ Session signature length mismatch - possible tampering detected');
      return null;
    }

    // Comparaison timing-safe byte par byte avec XOR
    // Cette méthode prend toujours le même temps quelque soit la position de différence
    let mismatch = 0;
    for (let i = 0; i < expectedBuffer.length; i++) {
      mismatch |= expectedBuffer[i] ^ actualBuffer[i];
    }

    if (mismatch !== 0) {
      console.warn('⚠️ Session signature mismatch - possible tampering detected');
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}
