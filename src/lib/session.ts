/**
 * Signe une session avec HMAC pour empêcher la falsification
 * Utilise Web Crypto API pour compatibilité avec Edge Runtime
 */
export async function signSession(sessionData: any): Promise<string> {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
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

    // Comparaison timing-safe
    if (parsed.signature !== expectedSignature || parsed.signature.length !== expectedSignature.length) {
      console.warn('⚠️ Session signature mismatch - possible tampering detected');
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}
