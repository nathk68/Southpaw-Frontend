/**
 * Advanced Feature Engineering for UFC Fight Prediction
 *
 * Creates sophisticated features beyond basic stats:
 * - Interaction features (striking × reach, grappling × weight)
 * - Momentum features (weighted recent performance)
 * - Style matchup analysis (striker vs grappler)
 * - Statistical ratios and deltas
 */

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

interface AdvancedFeatures {
  // Basic deltas (24 features from original)
  basic_features: number[];

  // Interaction features (8 features)
  f1_striking_reach_product: number;
  f2_striking_reach_product: number;
  f1_grappling_weight_product: number;
  f2_grappling_weight_product: number;
  f1_defensive_efficiency: number;
  f2_defensive_efficiency: number;
  f1_offensive_diversity: number;
  f2_offensive_diversity: number;

  // Style matchup features (6 features)
  f1_striker_score: number;
  f2_striker_score: number;
  f1_grappler_score: number;
  f2_grappler_score: number;
  style_matchup_advantage: number; // positive = f1 advantage, negative = f2 advantage
  combat_style_diversity: number;

  // Experience & momentum features (6 features)
  f1_win_rate: number;
  f2_win_rate: number;
  f1_finish_rate: number;
  f2_finish_rate: number;
  experience_gap: number;
  momentum_advantage: number;

  // Total: 24 + 8 + 6 + 6 = 44 features
}

export function extractAdvancedFeatures(
  fighter1: FighterStats,
  fighter2: FighterStats
): AdvancedFeatures {
  // Helper functions
  const safe = (val: number | undefined, defaultVal: number = 0): number => {
    return val !== undefined && !isNaN(val) ? val : defaultVal;
  };

  const delta = (f1Val: number, f2Val: number): number => {
    return f1Val - f2Val;
  };

  // === BASIC FEATURES (24 from original system) ===
  const basic_features = [
    // Striking (6 features)
    safe(fighter1.striking_accuracy),
    safe(fighter2.striking_accuracy),
    delta(safe(fighter1.striking_accuracy), safe(fighter2.striking_accuracy)),
    safe(fighter1.striking_defense),
    safe(fighter2.striking_defense),
    delta(safe(fighter1.striking_defense), safe(fighter2.striking_defense)),

    // Grappling (6 features)
    safe(fighter1.takedown_accuracy),
    safe(fighter2.takedown_accuracy),
    delta(safe(fighter1.takedown_accuracy), safe(fighter2.takedown_accuracy)),
    safe(fighter1.takedown_defense),
    safe(fighter2.takedown_defense),
    delta(safe(fighter1.takedown_defense), safe(fighter2.takedown_defense)),

    // Biometric (6 features)
    safe(fighter1.height),
    safe(fighter2.height),
    delta(safe(fighter1.height), safe(fighter2.height)),
    safe(fighter1.reach),
    safe(fighter2.reach),
    delta(safe(fighter1.reach), safe(fighter2.reach)),

    // Submissions (3 features)
    safe(fighter1.submissions_avg),
    safe(fighter2.submissions_avg),
    delta(safe(fighter1.submissions_avg), safe(fighter2.submissions_avg)),

    // Record (3 features)
    safe(fighter1.wins),
    safe(fighter2.wins),
    delta(safe(fighter1.wins), safe(fighter2.wins)),
  ];

  // === INTERACTION FEATURES (8 features) ===

  // Striking × Reach: Long reach strikers are more dangerous
  const f1_striking_reach_product = safe(fighter1.striking_accuracy) * safe(fighter1.reach) / 100;
  const f2_striking_reach_product = safe(fighter2.striking_accuracy) * safe(fighter2.reach) / 100;

  // Grappling × Weight: Heavier grapplers have more control
  const f1_grappling_weight_product = safe(fighter1.takedown_accuracy) * safe(fighter1.weight) / 100;
  const f2_grappling_weight_product = safe(fighter2.takedown_accuracy) * safe(fighter2.weight) / 100;

  // Defensive Efficiency: (Striking Defense + Takedown Defense) / 2
  const f1_defensive_efficiency = (safe(fighter1.striking_defense) + safe(fighter1.takedown_defense)) / 2;
  const f2_defensive_efficiency = (safe(fighter2.striking_defense) + safe(fighter2.takedown_defense)) / 2;

  // Offensive Diversity: Variance in finish types (KO vs SUB vs Decision)
  const f1_total_wins = safe(fighter1.wins, 1); // Avoid division by zero
  const f2_total_wins = safe(fighter2.wins, 1);

  const f1_ko_rate = safe(fighter1.ko_wins) / f1_total_wins;
  const f1_sub_rate = safe(fighter1.sub_wins) / f1_total_wins;
  const f1_dec_rate = safe(fighter1.decision_wins) / f1_total_wins;
  const f1_offensive_diversity = Math.sqrt(
    Math.pow(f1_ko_rate - 0.33, 2) +
    Math.pow(f1_sub_rate - 0.33, 2) +
    Math.pow(f1_dec_rate - 0.33, 2)
  );

  const f2_ko_rate = safe(fighter2.ko_wins) / f2_total_wins;
  const f2_sub_rate = safe(fighter2.sub_wins) / f2_total_wins;
  const f2_dec_rate = safe(fighter2.decision_wins) / f2_total_wins;
  const f2_offensive_diversity = Math.sqrt(
    Math.pow(f2_ko_rate - 0.33, 2) +
    Math.pow(f2_sub_rate - 0.33, 2) +
    Math.pow(f2_dec_rate - 0.33, 2)
  );

  // === STYLE MATCHUP FEATURES (6 features) ===

  // Striker Score: High striking accuracy + low takedown accuracy = pure striker
  const f1_striker_score = safe(fighter1.striking_accuracy) - safe(fighter1.takedown_accuracy) / 2;
  const f2_striker_score = safe(fighter2.striking_accuracy) - safe(fighter2.takedown_accuracy) / 2;

  // Grappler Score: High takedown accuracy + high submission rate = pure grappler
  const f1_grappler_score = safe(fighter1.takedown_accuracy) + safe(fighter1.submissions_avg) * 10;
  const f2_grappler_score = safe(fighter2.takedown_accuracy) + safe(fighter2.submissions_avg) * 10;

  // Style Matchup Advantage
  // Grapplers typically beat strikers, but elite strikers with good TDD beat grapplers
  let style_matchup_advantage = 0;
  const f1_is_grappler = f1_grappler_score > f1_striker_score;
  const f2_is_grappler = f2_grappler_score > f2_striker_score;

  if (f1_is_grappler && !f2_is_grappler) {
    // F1 grappler vs F2 striker
    const f2_tdd = safe(fighter2.takedown_defense);
    style_matchup_advantage = f2_tdd > 75 ? -5 : 10; // Good TDD neutralizes grapplers
  } else if (!f1_is_grappler && f2_is_grappler) {
    // F1 striker vs F2 grappler
    const f1_tdd = safe(fighter1.takedown_defense);
    style_matchup_advantage = f1_tdd > 75 ? 5 : -10;
  }

  // Combat Style Diversity: How different are their styles?
  const combat_style_diversity = Math.abs(
    (f1_striker_score - f1_grappler_score) - (f2_striker_score - f2_grappler_score)
  );

  // === EXPERIENCE & MOMENTUM FEATURES (6 features) ===

  // Win Rate
  const f1_total_fights = safe(fighter1.wins) + safe(fighter1.losses) + safe(fighter1.draws);
  const f2_total_fights = safe(fighter2.wins) + safe(fighter2.losses) + safe(fighter2.draws);
  const f1_win_rate = f1_total_fights > 0 ? safe(fighter1.wins) / f1_total_fights : 0;
  const f2_win_rate = f2_total_fights > 0 ? safe(fighter2.wins) / f2_total_fights : 0;

  // Finish Rate (KO + SUB) / Total Wins
  const f1_finish_rate = f1_total_wins > 0
    ? (safe(fighter1.ko_wins) + safe(fighter1.sub_wins)) / f1_total_wins
    : 0;
  const f2_finish_rate = f2_total_wins > 0
    ? (safe(fighter2.ko_wins) + safe(fighter2.sub_wins)) / f2_total_wins
    : 0;

  // Experience Gap (total fights difference)
  const experience_gap = f1_total_fights - f2_total_fights;

  // Momentum Advantage (simplified - would need fight history for real momentum)
  // For now: (Win Rate × Finish Rate) as proxy for "hot streak"
  const f1_momentum = f1_win_rate * f1_finish_rate;
  const f2_momentum = f2_win_rate * f2_finish_rate;
  const momentum_advantage = f1_momentum - f2_momentum;

  return {
    basic_features,

    // Interaction features
    f1_striking_reach_product,
    f2_striking_reach_product,
    f1_grappling_weight_product,
    f2_grappling_weight_product,
    f1_defensive_efficiency,
    f2_defensive_efficiency,
    f1_offensive_diversity,
    f2_offensive_diversity,

    // Style matchup features
    f1_striker_score,
    f2_striker_score,
    f1_grappler_score,
    f2_grappler_score,
    style_matchup_advantage,
    combat_style_diversity,

    // Experience & momentum features
    f1_win_rate,
    f2_win_rate,
    f1_finish_rate,
    f2_finish_rate,
    experience_gap,
    momentum_advantage,
  };
}

/**
 * Converts advanced features to flat array for ML models
 */
export function featuresToArray(features: AdvancedFeatures): number[] {
  return [
    ...features.basic_features,
    features.f1_striking_reach_product,
    features.f2_striking_reach_product,
    features.f1_grappling_weight_product,
    features.f2_grappling_weight_product,
    features.f1_defensive_efficiency,
    features.f2_defensive_efficiency,
    features.f1_offensive_diversity,
    features.f2_offensive_diversity,
    features.f1_striker_score,
    features.f2_striker_score,
    features.f1_grappler_score,
    features.f2_grappler_score,
    features.style_matchup_advantage,
    features.combat_style_diversity,
    features.f1_win_rate,
    features.f2_win_rate,
    features.f1_finish_rate,
    features.f2_finish_rate,
    features.experience_gap,
    features.momentum_advantage,
  ];
}

/**
 * Get feature names for interpretability
 */
export function getFeatureNames(): string[] {
  return [
    // Basic features (24)
    'f1_striking_accuracy', 'f2_striking_accuracy', 'striking_accuracy_delta',
    'f1_striking_defense', 'f2_striking_defense', 'striking_defense_delta',
    'f1_takedown_accuracy', 'f2_takedown_accuracy', 'takedown_accuracy_delta',
    'f1_takedown_defense', 'f2_takedown_defense', 'takedown_defense_delta',
    'f1_height', 'f2_height', 'height_delta',
    'f1_reach', 'f2_reach', 'reach_delta',
    'f1_submissions_avg', 'f2_submissions_avg', 'submissions_delta',
    'f1_wins', 'f2_wins', 'wins_delta',

    // Interaction features (8)
    'f1_striking_reach_product',
    'f2_striking_reach_product',
    'f1_grappling_weight_product',
    'f2_grappling_weight_product',
    'f1_defensive_efficiency',
    'f2_defensive_efficiency',
    'f1_offensive_diversity',
    'f2_offensive_diversity',

    // Style matchup features (6)
    'f1_striker_score',
    'f2_striker_score',
    'f1_grappler_score',
    'f2_grappler_score',
    'style_matchup_advantage',
    'combat_style_diversity',

    // Experience & momentum features (6)
    'f1_win_rate',
    'f2_win_rate',
    'f1_finish_rate',
    'f2_finish_rate',
    'experience_gap',
    'momentum_advantage',
  ];
}
