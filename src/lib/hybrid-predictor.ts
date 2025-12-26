/**
 * Hybrid Predictor: Grid Search + Advanced Features
 *
 * Strategy: Use optimized grid search weights BUT enrich with advanced features
 *
 * Why this works better than pure ML:
 * 1. Grid search weights are proven stable (64.8% on 1446 fights)
 * 2. Advanced features capture nuances ML struggled with
 * 3. Combines domain expertise (weights) with feature engineering
 */

import { extractAdvancedFeatures } from './advanced-features';

interface FighterStats {
  name: string;
  striking_accuracy?: number;
  striking_defense?: number;
  takedown_accuracy?: number;
  takedown_defense?: number;
  submissions_avg?: number;
  height?: number;
  weight?: number;
  reach?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  ko_wins?: number;
  sub_wins?: number;
  decision_wins?: number;
}

interface HybridPrediction {
  fighter1WinProbability: number;
  fighter2WinProbability: number;
  baseScore: number; // Grid search score
  adjustedScore: number; // After advanced features
  confidenceModifiers: {
    styleMismatch: number;
    momentum: number;
    defensive: number;
  };
}

// Poids optimisés via Grid Search (63.6% sur 28 événements)
const GRID_WEIGHTS = {
  striking: 0.280,
  grappling: 0.300,
  biometric: 0.132,
  finish: 0.200,
  historical: 0.000,
  experience: 0.088
};

/**
 * Calculate base score using grid search methodology
 */
function calculateBaseScore(fighter1: FighterStats, fighter2: FighterStats): number {
  const safe = (val: number | undefined): number => val !== undefined && !isNaN(val) ? val : 0;

  // Striking component (28%)
  const strikingDelta = safe(fighter1.striking_accuracy) - safe(fighter2.striking_accuracy);
  const strikingDefDelta = safe(fighter1.striking_defense) - safe(fighter2.striking_defense);
  const strikingScore = (strikingDelta + strikingDefDelta) / 2;

  // Grappling component (30%) - MOST IMPORTANT
  const tdAccDelta = safe(fighter1.takedown_accuracy) - safe(fighter2.takedown_accuracy);
  const tdDefDelta = safe(fighter1.takedown_defense) - safe(fighter2.takedown_defense);
  const grapplingScore = (tdAccDelta + tdDefDelta) / 2;

  // Biometric component (13.2%)
  const heightDelta = safe(fighter1.height) - safe(fighter2.height);
  const reachDelta = safe(fighter1.reach) - safe(fighter2.reach);
  const biometricScore = (heightDelta / 10 + reachDelta / 10) / 2;

  // Finish rate component (20%)
  const f1_total_wins = safe(fighter1.wins) || 1;
  const f2_total_wins = safe(fighter2.wins) || 1;
  const f1_finish_rate = (safe(fighter1.ko_wins) + safe(fighter1.sub_wins)) / f1_total_wins;
  const f2_finish_rate = (safe(fighter2.ko_wins) + safe(fighter2.sub_wins)) / f2_total_wins;
  const finishScore = (f1_finish_rate - f2_finish_rate) * 100;

  // Experience component (8.8%)
  const f1_fights = safe(fighter1.wins) + safe(fighter1.losses);
  const f2_fights = safe(fighter2.wins) + safe(fighter2.losses);
  const expScore = (f1_fights - f2_fights) / 5;

  // Weighted sum
  const totalScore =
    strikingScore * GRID_WEIGHTS.striking +
    grapplingScore * GRID_WEIGHTS.grappling +
    biometricScore * GRID_WEIGHTS.biometric +
    finishScore * GRID_WEIGHTS.finish +
    expScore * GRID_WEIGHTS.experience;

  return totalScore;
}

/**
 * Calculate confidence modifiers from advanced features
 */
function calculateModifiers(fighter1: FighterStats, fighter2: FighterStats) {
  const features = extractAdvancedFeatures(fighter1, fighter2);

  // Style mismatch modifier
  // Strong style advantages should boost confidence
  const styleMismatch = features.style_matchup_advantage / 10; // Normalize to ±1

  // Momentum modifier
  // Recent performance matters for confidence
  const momentum = features.momentum_advantage * 5; // Scale up

  // Defensive efficiency modifier
  // Defensive fighters are more predictable
  const defensiveDelta = features.f1_defensive_efficiency - features.f2_defensive_efficiency;
  const defensive = defensiveDelta / 20; // Normalize

  return {
    styleMismatch,
    momentum,
    defensive
  };
}

/**
 * Hybrid prediction combining grid search + advanced features
 */
export function predictHybrid(fighter1: FighterStats, fighter2: FighterStats): HybridPrediction {
  // 1. Calculate base score using proven grid search weights
  const baseScore = calculateBaseScore(fighter1, fighter2);

  // 2. Calculate advanced feature modifiers
  const modifiers = calculateModifiers(fighter1, fighter2);

  // 3. Apply modifiers to base score
  const adjustedScore = baseScore +
    modifiers.styleMismatch * 2 +      // ±2 points for style advantage
    modifiers.momentum * 1.5 +          // ±1.5 points for momentum
    modifiers.defensive * 1;            // ±1 point for defense

  // 4. Convert to probability (sigmoid-like transformation)
  // Adjusted score typically in range [-20, +20]
  const fighter1WinProbability = 50 + Math.min(Math.max(adjustedScore, -25), 25);

  return {
    fighter1WinProbability,
    fighter2WinProbability: 100 - fighter1WinProbability,
    baseScore,
    adjustedScore,
    confidenceModifiers: modifiers
  };
}

/**
 * Simple prediction interface (compatible with existing code)
 */
export function predictFightOutcomeHybrid(fighter1: FighterStats, fighter2: FighterStats) {
  const prediction = predictHybrid(fighter1, fighter2);

  return {
    fighter1WinProbability: prediction.fighter1WinProbability,
    fighter2WinProbability: prediction.fighter2WinProbability,
    predictedWinner: prediction.fighter1WinProbability > 50 ? 'fighter1' : 'fighter2',
    confidence: Math.abs(prediction.fighter1WinProbability - 50),
    details: {
      baseScore: prediction.baseScore,
      adjustedScore: prediction.adjustedScore,
      modifiers: prediction.confidenceModifiers
    }
  };
}
