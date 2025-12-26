// Southpaw Predictive Engine (SPE-V1 Optimized)
// Algorithme de prédiction de victoire pour les combats UFC

export interface FighterStats {
  profile_url?: string;
  status?: string;
  age?: string;
  height?: string;
  weight?: string;
  octagon_debut?: string;
  reach?: string;
  leg_reach?: string;
  fighting_style?: string;
  trains_at?: string;
  records?: {
    wld?: string; // "24-5-0 (W-L-D)"
    wins_by_knockout?: string; // "16 (67%)"
    wins_by_submission?: string; // "0 (0%)"
    wins_by_decision?: string; // "8 (33%)"
    fight_win_streak?: string;
    first_round_finishes?: string;
    title_defenses?: string;
  };
  fighter_stats?: {
    sig_strikes_defense?: string;
    takedown_defense?: string;
    avg_fight_time?: string;
    strinking_stats?: {
      sig_strikes_landed_per_min?: string;
      sig_strikes_absorbed_per_min?: string;
      sig_str_by_target?: {
        head?: string;
        body?: string;
        leg?: string;
      };
    };
    grappling_stats?: {
      takedowns_avg_per_15_min?: string;
      submission_avg_per_15_min?: string;
    };
  };
}

export interface PredictionResult {
  fighter1WinProbability: number;
  fighter2WinProbability: number;
  confidenceScore: number;
  breakdown: {
    strikingAdvantage: number;
    grapplingAdvantage: number;
    biometricAdvantage: number;
    finishPotential: number;
    historicalPerformance: number;
    experienceAdvantage: number;
  };
  analysis: {
    keyFactors: string[];
    warnings: string[];
    prediction: string;
  };
}

// Fonction utilitaire pour parser les valeurs
const parseFloat_ = (val: string | undefined): number => {
  if (!val) return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

// Fonction sigmoid pour normaliser les scores entre -1 et 1
// Scale plus élevé = différences plus marquées
const sigmoid = (x: number, scale: number = 1): number => {
  return (2 / (1 + Math.exp(-x * scale))) - 1;
};

// Fonction pour amplifier les différences (rend les prédictions moins centrées)
const amplify = (x: number, power: number = 1.3): number => {
  const sign = x >= 0 ? 1 : -1;
  return sign * Math.pow(Math.abs(x), power);
};

// Convertir le temps de combat en minutes décimales
const parseTime = (time: string | undefined): number => {
  if (!time) return 0;
  const parts = time.split(':');
  if (parts.length !== 2) return 0;
  const minutes = parseFloat_(parts[0]);
  const seconds = parseFloat_(parts[1]);
  return minutes + (seconds / 60);
};

// Calculer l'âge au moment du combat (utiliser la date actuelle par défaut)
const getAge = (ageStr: string | undefined): number => {
  return parseFloat_(ageStr);
};

// Estimer leg_reach si manquant
const estimateLegReach = (height: number): number => {
  return height * 0.48;
};

// Parser le record W-L-D pour obtenir le win rate
const parseWinRate = (wld: string | undefined): { wins: number; losses: number; draws: number; winRate: number } => {
  if (!wld) return { wins: 0, losses: 0, draws: 0, winRate: 0 };

  // Format: "24-5-0 (W-L-D)"
  const match = wld.match(/(\d+)-(\d+)-(\d+)/);
  if (!match) return { wins: 0, losses: 0, draws: 0, winRate: 0 };

  const wins = parseInt(match[1]) || 0;
  const losses = parseInt(match[2]) || 0;
  const draws = parseInt(match[3]) || 0;

  const totalFights = wins + losses + draws;
  const winRate = totalFights > 0 ? wins / totalFights : 0;

  return { wins, losses, draws, winRate };
};

// Parser le pourcentage de victoires par méthode
// Format: "16 (67%)" ou "0 (0 %)"
const parseFinishRate = (finishStr: string | undefined): { count: number; percentage: number } => {
  if (!finishStr) return { count: 0, percentage: 0 };

  const countMatch = finishStr.match(/^(\d+)/);
  const percentMatch = finishStr.match(/\((\d+(?:\.\d+)?)\s*%\)/);

  const count = countMatch ? parseInt(countMatch[1]) : 0;
  const percentage = percentMatch ? parseFloat(percentMatch[1]) / 100 : 0;

  return { count, percentage };
};

// PILIER A: Effective Striking Index (ESI)
const calculateStrikingAdvantage = (f1: FighterStats, f2: FighterStats): number => {
  const f1StrikeLanded = parseFloat_(f1.fighter_stats?.strinking_stats?.sig_strikes_landed_per_min);
  const f1StrikeAbsorbed = parseFloat_(f1.fighter_stats?.strinking_stats?.sig_strikes_absorbed_per_min);
  const f1Defense = parseFloat_(f1.fighter_stats?.sig_strikes_defense) / 100;

  const f2StrikeLanded = parseFloat_(f2.fighter_stats?.strinking_stats?.sig_strikes_landed_per_min);
  const f2StrikeAbsorbed = parseFloat_(f2.fighter_stats?.strinking_stats?.sig_strikes_absorbed_per_min);
  const f2Defense = parseFloat_(f2.fighter_stats?.sig_strikes_defense) / 100;

  if (f1StrikeLanded === 0 && f2StrikeLanded === 0) return 0;

  // Matrice de touche: probabilité de toucher l'adversaire
  const f1HitRate = f1StrikeLanded * (1 - f2Defense);
  const f2HitRate = f2StrikeLanded * (1 - f1Defense);

  // Ratio de dommages: efficacité offensive vs défensive
  const f1DamageRatio = f1StrikeAbsorbed > 0 ? f1StrikeLanded / f1StrikeAbsorbed : f1StrikeLanded;
  const f2DamageRatio = f2StrikeAbsorbed > 0 ? f2StrikeLanded / f2StrikeAbsorbed : f2StrikeLanded;

  // Combinaison pondérée
  const hitRateDelta = f1HitRate - f2HitRate;
  const damageRatioDelta = f1DamageRatio - f2DamageRatio;

  const rawScore = (hitRateDelta * 0.6) + (damageRatioDelta * 0.4);

  // Normalisation avec sigmoid et amplification optimisées (Genetic Algorithm)
  return amplify(sigmoid(rawScore, 1.063), 1.681); // GA optimized
};

// PILIER B: Grappling Dominance Index (GDI)
const calculateGrapplingAdvantage = (f1: FighterStats, f2: FighterStats): number => {
  const f1TD = parseFloat_(f1.fighter_stats?.grappling_stats?.takedowns_avg_per_15_min);
  const f1TDDefense = parseFloat_(f1.fighter_stats?.takedown_defense) / 100;
  const f1Submissions = parseFloat_(f1.fighter_stats?.grappling_stats?.submission_avg_per_15_min);

  const f2TD = parseFloat_(f2.fighter_stats?.grappling_stats?.takedowns_avg_per_15_min);
  const f2TDDefense = parseFloat_(f2.fighter_stats?.takedown_defense) / 100;
  const f2Submissions = parseFloat_(f2.fighter_stats?.grappling_stats?.submission_avg_per_15_min);

  if (f1TD === 0 && f2TD === 0) return 0;

  // Menace de takedown
  const f1TDThreat = f1TD * (1 - f2TDDefense);
  const f2TDThreat = f2TD * (1 - f1TDDefense);

  // Facteur "Fish Out of Water": Si un combattant peut mettre au sol mais l'autre ne peut pas soumettre
  let f1Bonus = 0;
  let f2Bonus = 0;

  // Seuils abaissés pour détecter plus facilement les avantages
  if (f1TDThreat > 1.0 && f2Submissions < 0.5) {
    f1Bonus = 0.4; // Bonus plus important
  }
  if (f2TDThreat > 1.0 && f1Submissions < 0.5) {
    f2Bonus = 0.4; // Bonus plus important
  }

  // Défense de takedown parfaite annule presque totalement le grappling
  const f1Effectiveness = f2TDDefense >= 0.90 ? f1TDThreat * 0.2 : f1TDThreat;
  const f2Effectiveness = f1TDDefense >= 0.90 ? f2TDThreat * 0.2 : f2TDThreat;

  const tdDelta = (f1Effectiveness - f2Effectiveness) + (f1Bonus - f2Bonus);
  const submissionDelta = f1Submissions - f2Submissions;

  const rawScore = (tdDelta * 0.7) + (submissionDelta * 0.3);

  return amplify(sigmoid(rawScore, 1.300), 1.850); // GA optimized
};

// PILIER C: Biometric Advantage Index (BAI)
const calculateBiometricAdvantage = (f1: FighterStats, f2: FighterStats): number => {
  const f1Height = parseFloat_(f1.height);
  const f1Reach = parseFloat_(f1.reach);
  const f1LegReach = parseFloat_(f1.leg_reach) || estimateLegReach(f1Height);
  const f1Age = getAge(f1.age);
  const f1Weight = parseFloat_(f1.weight);

  const f2Height = parseFloat_(f2.height);
  const f2Reach = parseFloat_(f2.reach);
  const f2LegReach = parseFloat_(f2.leg_reach) || estimateLegReach(f2Height);
  const f2Age = getAge(f2.age);
  const f2Weight = parseFloat_(f2.weight);

  let score = 0;

  // Reach Delta (seuil abaissé pour détecter plus d'avantages)
  const reachDelta = f1Reach - f2Reach;
  if (Math.abs(reachDelta) > 3) {
    score += sigmoid(reachDelta, 0.3) * 0.6; // Impact augmenté
  }

  // Ape Index (Reach / Height ratio)
  const f1ApeIndex = f1Height > 0 ? f1Reach / f1Height : 1;
  const f2ApeIndex = f2Height > 0 ? f2Reach / f2Height : 1;
  const apeIndexDelta = f1ApeIndex - f2ApeIndex;
  score += sigmoid(apeIndexDelta, 5) * 0.4; // Impact réduit mais plus sensible

  // Age Decay (Le Mur des 35 ans) - Plus agressif
  let f1AgePenalty = 0;
  let f2AgePenalty = 0;

  if (f1Age > 35 && f1Weight < 170) {
    f1AgePenalty = Math.pow((f1Age - 35) / 8, 2.2) * -0.5; // Pénalité augmentée
  }
  if (f2Age > 35 && f2Weight < 170) {
    f2AgePenalty = Math.pow((f2Age - 35) / 8, 2.2) * -0.5;
  }

  score += (f2AgePenalty - f1AgePenalty);

  // Différence d'âge majeure (seuil abaissé)
  const ageDiff = Math.abs(f1Age - f2Age);
  if (ageDiff > 5) { // 5 ans au lieu de 7
    const youngAdvantage = f1Age < f2Age ? 0.3 : -0.3; // Impact augmenté
    score += youngAdvantage;
  }

  return amplify(Math.max(-1, Math.min(1, score)), 1.320); // GA optimized
};

// PILIER D: Finish Potential Index (FPI) - Enhanced with real finish stats
const calculateFinishPotential = (f1: FighterStats, f2: FighterStats): number => {
  // Parser les vraies statistiques de finish depuis les records
  const f1KO = parseFinishRate(f1.records?.wins_by_knockout);
  const f2KO = parseFinishRate(f2.records?.wins_by_knockout);

  const f1Sub = parseFinishRate(f1.records?.wins_by_submission);
  const f2Sub = parseFinishRate(f2.records?.wins_by_submission);

  const f1Dec = parseFinishRate(f1.records?.wins_by_decision);
  const f2Dec = parseFinishRate(f2.records?.wins_by_decision);

  const f1FirstRound = parseFloat_(f1.records?.first_round_finishes);
  const f2FirstRound = parseFloat_(f2.records?.first_round_finishes);

  // Données complémentaires
  const f1AvgTime = parseTime(f1.fighter_stats?.avg_fight_time);
  const f2AvgTime = parseTime(f2.fighter_stats?.avg_fight_time);

  const f1StrikeAbsorbed = parseFloat_(f1.fighter_stats?.strinking_stats?.sig_strikes_absorbed_per_min);
  const f2StrikeAbsorbed = parseFloat_(f2.fighter_stats?.strinking_stats?.sig_strikes_absorbed_per_min);

  let score = 0;

  // 1. KO/TKO Power - Le plus important pour le finish potential
  const f1KORate = f1KO.percentage;
  const f2KORate = f2KO.percentage;

  if (f1KORate > 0 || f2KORate > 0) {
    const koDelta = f1KORate - f2KORate;
    score += sigmoid(koDelta * 2, 1.2) * 0.45; // 45% du poids total
  }

  // 2. Submission Threat
  const f1SubRate = f1Sub.percentage;
  const f2SubRate = f2Sub.percentage;

  if (f1SubRate > 0 || f2SubRate > 0) {
    const subDelta = f1SubRate - f2SubRate;
    score += sigmoid(subDelta * 2, 1.0) * 0.25; // 25% du poids total
  }

  // 3. Early Finish Potential (First Round Finishes)
  if (f1FirstRound > 0 || f2FirstRound > 0) {
    const earlyFinishDelta = f1FirstRound - f2FirstRound;
    score += sigmoid(earlyFinishDelta, 0.5) * 0.20; // 20% du poids total
  }

  // 4. Vulnerability to Finish (inverse des décisions)
  // Un haut % de décisions = moins de vulnérabilité aux finitions
  const f1DecRate = f1Dec.percentage;
  const f2DecRate = f2Dec.percentage;

  // Si F1 finish souvent mais F2 va toujours aux décisions -> avantage F1
  if (f1KORate + f1SubRate > 0.3 && f2DecRate > 0.5) {
    score += 0.15;
  }
  if (f2KORate + f2SubRate > 0.3 && f1DecRate > 0.5) {
    score -= 0.15;
  }

  // 5. Striking absorbed vulnerability (garde l'ancienne logique)
  // Si un finisseur affronte quelqu'un qui absorbe beaucoup de coups
  if (f1KORate > 0.4 && f2StrikeAbsorbed > 4) {
    score += 0.15;
  }
  if (f2KORate > 0.4 && f1StrikeAbsorbed > 4) {
    score -= 0.15;
  }

  // 6. Average fight time (logique secondaire maintenant)
  // Seulement si pas de stats de records disponibles
  if (f1KORate === 0 && f2KORate === 0 && f1SubRate === 0 && f2SubRate === 0) {
    const f1IsFinisher = f1AvgTime < 8;
    const f2IsFinisher = f2AvgTime < 8;

    if (f1IsFinisher && !f2IsFinisher) score += 0.2;
    if (f2IsFinisher && !f1IsFinisher) score -= 0.2;

    const timeDelta = f2AvgTime - f1AvgTime;
    score += sigmoid(timeDelta, 0.1) * 0.15;
  }

  return amplify(Math.max(-1, Math.min(1, score)), 1.196); // GA optimized
};

// PILIER E: Historical Performance Index (HPI) - Win Rate & Momentum
const calculateHistoricalPerformance = (f1: FighterStats, f2: FighterStats): number => {
  const f1Record = parseWinRate(f1.records?.wld);
  const f2Record = parseWinRate(f2.records?.wld);

  const f1WinStreak = parseFloat_(f1.records?.fight_win_streak);
  const f2WinStreak = parseFloat_(f2.records?.fight_win_streak);

  const f1TitleDefenses = parseFloat_(f1.records?.title_defenses);
  const f2TitleDefenses = parseFloat_(f2.records?.title_defenses);

  let score = 0;

  // 1. Win Rate Advantage (taux de victoire global)
  if (f1Record.wins > 0 || f2Record.wins > 0) {
    const winRateDelta = f1Record.winRate - f2Record.winRate;
    score += sigmoid(winRateDelta * 4, 2.0) * 0.40; // Scale et magnitude augmentés
  }

  // 2. Win Streak Momentum
  if (f1WinStreak > 0 || f2WinStreak > 0) {
    const streakDelta = f1WinStreak - f2WinStreak;
    // Un win streak est un indicateur fort de forme actuelle
    score += sigmoid(streakDelta, 0.5) * 0.35; // Scale augmenté
  }

  // 3. Championship Pedigree (title defenses)
  if (f1TitleDefenses > 0 || f2TitleDefenses > 0) {
    const titleDelta = f1TitleDefenses - f2TitleDefenses;
    // Avoir défendu un titre montre une capacité à performer sous pression
    score += sigmoid(titleDelta, 0.6) * 0.25; // Scale augmenté
  }

  // 4. Quality over quantity (win rate minimum threshold)
  // Pénaliser les combattants avec beaucoup de défaites même s'ils ont des victoires
  if (f1Record.wins > 5 && f1Record.winRate < 0.4) {
    score -= 0.2; // Pénalité pour mauvais record
  }
  if (f2Record.wins > 5 && f2Record.winRate < 0.4) {
    score += 0.2;
  }

  return amplify(Math.max(-1, Math.min(1, score)), 1.5); // Augmenté pour plus d'impact
};

// PILIER F: Octagon Shock Index (OSI) - Expérience
const calculateExperienceAdvantage = (f1: FighterStats, f2: FighterStats): number => {
  const now = new Date();

  const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr);
    } catch {
      return null;
    }
  };

  const f1Debut = parseDate(f1.octagon_debut);
  const f2Debut = parseDate(f2.octagon_debut);

  if (!f1Debut || !f2Debut) return 0;

  const f1Experience = (now.getTime() - f1Debut.getTime()) / (1000 * 60 * 60 * 24 * 365); // années
  const f2Experience = (now.getTime() - f2Debut.getTime()) / (1000 * 60 * 60 * 24 * 365);

  let score = 0;

  // Rookie vs Veteran (impact augmenté)
  if (f2Experience < 1.5 && f1Experience > 4) {
    score += 0.4; // F1 veteran advantage (augmenté)
  }
  if (f1Experience < 1.5 && f2Experience > 4) {
    score -= 0.4; // F2 veteran advantage
  }

  // Différence d'expérience linéaire (plus sensible)
  const expDelta = f1Experience - f2Experience;
  score += sigmoid(expDelta, 0.35) * 0.5;

  // Ajustement si le vétéran est en déclin physique (combiné avec l'âge)
  const f1Age = getAge(f1.age);
  const f2Age = getAge(f2.age);

  if (f1Experience > 9 && f1Age > 35) {
    score -= 0.25; // Pénalité vétéran en déclin (augmentée)
  }
  if (f2Experience > 9 && f2Age > 35) {
    score += 0.25;
  }

  return amplify(Math.max(-1, Math.min(1, score)), 1.116); // GA optimized
};

// Calculer le score de confiance basé sur la qualité des données
const calculateConfidence = (f1: FighterStats, f2: FighterStats): number => {
  let dataPoints = 0;
  let totalPoints = 16; // Nombre de champs importants

  const checkField = (val: any) => val !== undefined && val !== null && val !== '0' && val !== '';

  // F1 data completeness
  if (checkField(f1.age)) dataPoints++;
  if (checkField(f1.height)) dataPoints++;
  if (checkField(f1.reach)) dataPoints++;
  if (checkField(f1.fighter_stats?.sig_strikes_defense)) dataPoints++;
  if (checkField(f1.fighter_stats?.strinking_stats?.sig_strikes_landed_per_min)) dataPoints++;
  if (checkField(f1.fighter_stats?.strinking_stats?.sig_strikes_absorbed_per_min)) dataPoints++;
  if (checkField(f1.fighter_stats?.grappling_stats?.takedowns_avg_per_15_min)) dataPoints++;
  if (checkField(f1.octagon_debut)) dataPoints++;

  // F2 data completeness
  if (checkField(f2.age)) dataPoints++;
  if (checkField(f2.height)) dataPoints++;
  if (checkField(f2.reach)) dataPoints++;
  if (checkField(f2.fighter_stats?.sig_strikes_defense)) dataPoints++;
  if (checkField(f2.fighter_stats?.strinking_stats?.sig_strikes_landed_per_min)) dataPoints++;
  if (checkField(f2.fighter_stats?.strinking_stats?.sig_strikes_absorbed_per_min)) dataPoints++;
  if (checkField(f2.fighter_stats?.grappling_stats?.takedowns_avg_per_15_min)) dataPoints++;
  if (checkField(f2.octagon_debut)) dataPoints++;

  return (dataPoints / totalPoints) * 100;
};

// Pondérations dynamiques basées sur le style de combat
const getDynamicWeights = (f1: FighterStats, f2: FighterStats) => {
  const f1Style = f1.fighting_style?.toLowerCase() || '';
  const f2Style = f2.fighting_style?.toLowerCase() || '';

  // Poids optimisés via Grid Search sur 28 événements (215 combats) - 63.6% accuracy
  let weights = {
    striking: 0.280,          // 28% - Core striking metrics
    grappling: 0.300,         // 30% - Core grappling metrics (most important)
    biometric: 0.132,         // 13.2% - Size/reach advantages
    finish: 0.200,            // 20% - Finish rates (KO/SUB)
    historical: 0.000,        // 0% - Disabled (not predictive)
    experience: 0.088         // 8.8% - Fight experience
  };

  // Ajuster si striker vs striker
  if ((f1Style.includes('striker') || f1Style.includes('boxing') || f1Style.includes('kickbox') || f1Style.includes('muay')) &&
      (f2Style.includes('striker') || f2Style.includes('boxing') || f2Style.includes('kickbox') || f2Style.includes('muay'))) {
    weights.striking = 0.40;
    weights.grappling = 0.08;
    weights.biometric = 0.15;
    weights.finish = 0.18;
    weights.historical = 0.15;
    weights.experience = 0.04;
  }

  // Ajuster si grappler vs grappler
  if ((f1Style.includes('wrestler') || f1Style.includes('grappler') || f1Style.includes('jiu-jitsu') || f1Style.includes('sambo')) &&
      (f2Style.includes('wrestler') || f2Style.includes('grappler') || f2Style.includes('jiu-jitsu') || f2Style.includes('sambo'))) {
    weights.grappling = 0.40;
    weights.striking = 0.15;
    weights.finish = 0.18;
    weights.biometric = 0.05;
    weights.historical = 0.18;
    weights.experience = 0.04;
  }

  return weights;
};

// Fonction principale de prédiction
export function predictFightOutcome(
  fighter1: FighterStats,
  fighter2: FighterStats
): PredictionResult {
  // Calcul des 6 piliers
  const strikingAdvantage = calculateStrikingAdvantage(fighter1, fighter2);
  const grapplingAdvantage = calculateGrapplingAdvantage(fighter1, fighter2);
  const biometricAdvantage = calculateBiometricAdvantage(fighter1, fighter2);
  const finishPotential = calculateFinishPotential(fighter1, fighter2);
  const historicalPerformance = calculateHistoricalPerformance(fighter1, fighter2);
  const experienceAdvantage = calculateExperienceAdvantage(fighter1, fighter2);

  // Pondérations dynamiques
  const weights = getDynamicWeights(fighter1, fighter2);

  // Pondération adaptative : redistribuer le poids des piliers sans données
  let adaptiveWeights = { ...weights };
  let totalDisabledWeight = 0;
  let enabledPillars: string[] = [];

  // Identifier les piliers avec des données
  if (Math.abs(biometricAdvantage) < 0.001) {
    totalDisabledWeight += weights.biometric;
    adaptiveWeights.biometric = 0;
  } else {
    enabledPillars.push('biometric');
  }

  if (Math.abs(experienceAdvantage) < 0.001) {
    totalDisabledWeight += weights.experience;
    adaptiveWeights.experience = 0;
  } else {
    enabledPillars.push('experience');
  }

  // Redistribuer le poids aux piliers actifs (priorité: striking, grappling, finish)
  if (totalDisabledWeight > 0) {
    const redistributeToStriking = totalDisabledWeight * 0.4;
    const redistributeToGrappling = totalDisabledWeight * 0.35;
    const redistributeToFinish = totalDisabledWeight * 0.25;

    adaptiveWeights.striking += redistributeToStriking;
    adaptiveWeights.grappling += redistributeToGrappling;
    adaptiveWeights.finish += redistributeToFinish;
  }

  // Score final pondéré (-1 à +1)
  let finalScore =
    (strikingAdvantage * adaptiveWeights.striking) +
    (grapplingAdvantage * adaptiveWeights.grappling) +
    (biometricAdvantage * adaptiveWeights.biometric) +
    (finishPotential * adaptiveWeights.finish) +
    (historicalPerformance * adaptiveWeights.historical) +
    (experienceAdvantage * adaptiveWeights.experience);

  // Amplification finale pour étaler les prédictions
  finalScore = amplify(finalScore, 1.63); // Baseline that worked well

  // Convertir en probabilités (0-100%)
  const fighter1WinProbability = ((finalScore + 1) / 2) * 100;
  const fighter2WinProbability = 100 - fighter1WinProbability;

  // Score de confiance
  const confidenceScore = calculateConfidence(fighter1, fighter2);

  // Analyse qualitative
  const keyFactors: string[] = [];
  const warnings: string[] = [];

  if (Math.abs(strikingAdvantage) > 0.2) {
    keyFactors.push(strikingAdvantage > 0
      ? "Avantage striking significatif pour le coin rouge"
      : "Avantage striking significatif pour le coin bleu");
  }

  if (Math.abs(grapplingAdvantage) > 0.2) {
    keyFactors.push(grapplingAdvantage > 0
      ? "Domination au sol probable du coin rouge"
      : "Domination au sol probable du coin bleu");
  }

  if (Math.abs(biometricAdvantage) > 0.15) {
    keyFactors.push("Différences physiques importantes entre les combattants");
  }

  if (Math.abs(finishPotential) > 0.2) {
    keyFactors.push(finishPotential > 0
      ? "Le coin rouge a un meilleur potentiel de finition"
      : "Le coin bleu a un meilleur potentiel de finition");
  }

  if (Math.abs(historicalPerformance) > 0.2) {
    keyFactors.push(historicalPerformance > 0
      ? "Le coin rouge possède un meilleur historique de performances"
      : "Le coin bleu possède un meilleur historique de performances");
  }

  if (confidenceScore < 60) {
    warnings.push("Données limitées disponibles - prédiction moins fiable");
  }

  const f1Age = getAge(fighter1.age);
  const f2Age = getAge(fighter2.age);
  const f1Weight = parseFloat_(fighter1.weight);

  if ((f1Age > 35 && f1Weight < 170) || (f2Age > 35 && parseFloat_(fighter2.weight) < 170)) {
    warnings.push("Facteur âge critique pour les catégories légères");
  }

  let prediction = "";
  if (Math.abs(finalScore) < 0.15) {
    prediction = "Combat très serré - Peut aller dans les deux sens";
  } else if (finalScore > 0.4) {
    prediction = "Victoire probable du coin rouge";
  } else if (finalScore > 0.15) {
    prediction = "Léger avantage pour le coin rouge";
  } else if (finalScore < -0.4) {
    prediction = "Victoire probable du coin bleu";
  } else {
    prediction = "Léger avantage pour le coin bleu";
  }

  return {
    fighter1WinProbability: Math.round(fighter1WinProbability * 10) / 10,
    fighter2WinProbability: Math.round(fighter2WinProbability * 10) / 10,
    confidenceScore: Math.round(confidenceScore),
    breakdown: {
      strikingAdvantage: Math.round(strikingAdvantage * 100) / 100,
      grapplingAdvantage: Math.round(grapplingAdvantage * 100) / 100,
      biometricAdvantage: Math.round(biometricAdvantage * 100) / 100,
      finishPotential: Math.round(finishPotential * 100) / 100,
      historicalPerformance: Math.round(historicalPerformance * 100) / 100,
      experienceAdvantage: Math.round(experienceAdvantage * 100) / 100
    },
    analysis: {
      keyFactors,
      warnings,
      prediction
    }
  };
}
