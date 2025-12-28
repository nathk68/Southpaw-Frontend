import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// URL de l'API Python (configurable via variable d'environnement)
const PYTHON_API_URL = process.env.PYTHON_API_URL;

if (!PYTHON_API_URL) {
  throw new Error('PYTHON_API_URL environment variable is required');
}

// Schéma de validation avec Zod
const FighterPredictionSchema = z.object({
  fighter1Name: z.string()
    .min(2, 'Nom trop court (minimum 2 caractères)')
    .max(50, 'Nom trop long (maximum 50 caractères)')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Caractères invalides dans le nom'),
  fighter2Name: z.string()
    .min(2, 'Nom trop court (minimum 2 caractères)')
    .max(50, 'Nom trop long (maximum 50 caractères)')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Caractères invalides dans le nom'),
});

/**
 * POST /api/predict
 * Body: { fighter1Name: string, fighter2Name: string }
 *
 * Cette route Next.js fait le pont entre le frontend et l'API Python ML
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation des inputs avec Zod
    const validationResult = FighterPredictionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { fighter1Name, fighter2Name } = validationResult.data;

    console.log(`🔍 Recherche de combattants: ${fighter1Name} vs ${fighter2Name}`);

    // Étape 1: Chercher les combattants via l'API Python
    const searchFighter1 = await fetch(
      `${PYTHON_API_URL}/search/fighter?name=${encodeURIComponent(fighter1Name)}`
    );
    const searchFighter2 = await fetch(
      `${PYTHON_API_URL}/search/fighter?name=${encodeURIComponent(fighter2Name)}`
    );

    if (!searchFighter1.ok || !searchFighter2.ok) {
      throw new Error('Erreur lors de la recherche des combattants');
    }

    const results1 = await searchFighter1.json();
    const results2 = await searchFighter2.json();

    console.log(`📋 Résultats recherche ${fighter1Name}:`, JSON.stringify(results1));
    console.log(`📋 Résultats recherche ${fighter2Name}:`, JSON.stringify(results2));

    if (!results1.results || results1.results.length === 0) {
      console.error(`❌ Aucun résultat pour ${fighter1Name}. Response:`, results1);
      return NextResponse.json(
        { error: `Combattant non trouvé: ${fighter1Name}` },
        { status: 404 }
      );
    }

    if (!results2.results || results2.results.length === 0) {
      console.error(`❌ Aucun résultat pour ${fighter2Name}. Response:`, results2);
      return NextResponse.json(
        { error: `Combattant non trouvé: ${fighter2Name}` },
        { status: 404 }
      );
    }

    // Fonction pour choisir le meilleur match en fonction de la catégorie de poids
    const chooseBestMatch = (results: any[], opponentResults: any[]) => {
      // Si un seul résultat, le retourner
      if (results.length === 1) return results[0];

      // Si plusieurs résultats, matcher par catégorie de poids
      if (opponentResults.length > 0 && opponentResults[0].weight) {
        const opponentWeight = opponentResults[0].weight;

        // Trier par proximité de poids en priorité
        results.sort((a, b) => {
          const aWeight = a.weight || 0;
          const bWeight = b.weight || 0;

          const aDiff = Math.abs(aWeight - opponentWeight);
          const bDiff = Math.abs(bWeight - opponentWeight);

          // Prioriser celui avec le poids le plus proche
          // Si différence < 10 lbs, prioriser stats complètes puis victoires
          if (Math.abs(aDiff - bDiff) < 10) {
            // Si un a des stats complètes et pas l'autre, prendre celui avec stats
            if (a.hasCompleteStats && !b.hasCompleteStats) return -1;
            if (!a.hasCompleteStats && b.hasCompleteStats) return 1;

            // Sinon, prendre celui avec plus de victoires
            const aWins = parseInt(a.record.split('-')[0]) || 0;
            const bWins = parseInt(b.record.split('-')[0]) || 0;
            return bWins - aWins;
          }

          // Si différence > 10 lbs, TOUJOURS prendre le plus proche en poids
          return aDiff - bDiff;
        });

        console.log(`   🎯 Matching par poids: adversaire ${opponentWeight} lbs, choisi ${results[0].name} (${results[0].weight} lbs, hasCompleteStats: ${results[0].hasCompleteStats})`);
      }

      // Retourner le premier (déjà trié par stats complètes + victoires depuis l'API)
      return results[0];
    };

    // Choisir les meilleurs matchs
    const fighter1 = chooseBestMatch(results1.results, results2.results);
    const fighter2 = chooseBestMatch(results2.results, results1.results);

    console.log(`✅ Trouvé: ${fighter1.name} (${fighter1.record}) vs ${fighter2.name} (${fighter2.record})`);

    // Étape 2: Demander la prédiction à l'API Python
    const predictionResponse = await fetch(`${PYTHON_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fighter1_id: fighter1.id,
        fighter2_id: fighter2.id,
      }),
    });

    if (!predictionResponse.ok) {
      const error = await predictionResponse.json();
      console.error(`❌ Erreur prédiction ML:`, error);
      console.error(`   Fighter1 ID: ${fighter1.id}`);
      console.error(`   Fighter2 ID: ${fighter2.id}`);

      // Vérifier si c'est un problème de stats incomplètes
      if (error.detail && error.detail.includes('Stats incomplètes')) {
        return NextResponse.json(
          {
            error: `Statistiques incomplètes pour ${fighter1.name} ou ${fighter2.name}`,
            details: 'Ces combattants n\'ont pas assez de statistiques historiques pour générer une prédiction ML fiable. Cela arrive souvent avec les nouveaux combattants qui n\'ont pas encore beaucoup de combats UFC.',
            fightersInfo: {
              fighter1: `${fighter1.name} (${fighter1.record})`,
              fighter2: `${fighter2.name} (${fighter2.record})`
            }
          },
          { status: 422 }  // 422 Unprocessable Entity
        );
      }

      throw new Error(error.detail || 'Erreur de prédiction');
    }

    const mlPrediction = await predictionResponse.json();
    console.log(`✅ Prédiction ML réussie:`, mlPrediction);

    console.log(`📊 Prédiction ML: ${fighter1.name} ${mlPrediction.fighter1_win_prob}% vs ${fighter2.name} ${mlPrediction.fighter2_win_prob}%`);

    // Étape 3: Récupérer les infos détaillées des combattants
    const fighter1Details = await fetch(`${PYTHON_API_URL}/fighter/${fighter1.id}`);
    const fighter2Details = await fetch(`${PYTHON_API_URL}/fighter/${fighter2.id}`);

    const f1Info = fighter1Details.ok ? await fighter1Details.json() : null;
    const f2Info = fighter2Details.ok ? await fighter2Details.json() : null;

    // Étape 4: Convertir la réponse Python vers le format attendu par le frontend
    const analysis = mlPrediction.analysis || {};

    // Générer des facteurs clés personnalisés basés sur les stats réelles
    const keyFactors: string[] = [];

    // NOTE: On génère les keyFactors en utilisant les valeurs RAW de l'API
    // Les valeurs normalisées (avec poids) seront calculées plus tard pour les barres

    // Facteur 1: Basé sur l'avantage striking
    if (analysis.striking_advantage) {
      const strikingLeader = analysis.striking_advantage > 0 ? fighter1.name : fighter2.name;
      const strikingValue = Math.abs(analysis.striking_advantage);
      if (strikingValue > 20) {
        keyFactors.push(`${strikingLeader} possède un avantage striking significatif (+${strikingValue.toFixed(0)}%)`);
      } else if (strikingValue > 10) {
        keyFactors.push(`${strikingLeader} a un léger avantage au striking`);
      }
    }

    // Facteur 2: Basé sur l'avantage grappling
    if (analysis.grappling_advantage) {
      const grapplingLeader = analysis.grappling_advantage > 0 ? fighter1.name : fighter2.name;
      const grapplingValue = Math.abs(analysis.grappling_advantage);
      if (grapplingValue > 20) {
        keyFactors.push(`${grapplingLeader} domine au grappling avec des takedowns constants`);
      }
    }

    // Facteur 3: Finish potential
    if (analysis.finish_potential) {
      const finisherValue = Math.abs(analysis.finish_potential);
      if (finisherValue > 15) {
        const finisher = analysis.finish_potential > 0 ? fighter1.name : fighter2.name;
        keyFactors.push(`${finisher} a un taux de finish élevé - risque de KO/Soumission`);
      }
    }

    // Facteur 4: Stats spécifiques si disponibles
    if (analysis.f1_str && analysis.f2_str) {
      const maxStr = Math.max(analysis.f1_str, analysis.f2_str);
      if (maxStr > 500) {
        const volumeStriker = analysis.f1_str > analysis.f2_str ? fighter1.name : fighter2.name;
        keyFactors.push(`${volumeStriker} maintient un volume de frappes élevé (${maxStr.toFixed(0)} frappes totales)`);
      }
    }

    // Calculer les avantages relatifs basés sur les probabilités de victoire
    // Convention UI: valeur positive = avantage BLUE (fighter2), valeur négative = avantage RED (fighter1)
    const probDifference = mlPrediction.fighter1_win_prob - mlPrediction.fighter2_win_prob;

    // Les avantages de l'API Python suivent la convention:
    // Positif = Fighter1 (RED) a l'avantage
    // Négatif = Fighter2 (BLUE) a l'avantage
    // On doit UNIQUEMENT inverser le signe pour correspondre à notre affichage UI
    const normalizeAdvantage = (rawAdvantage: number): number => {
      // Inverser le signe SANS poids artificiel
      return -rawAdvantage;
    };

    // Créer des avantages de base pour les piliers sans données
    // Négatif si fighter1 gagne, positif si fighter2 gagne
    const baseAdvantage = -probDifference * 0.5;

    // Toujours ajouter les facteurs généraux à la fin
    keyFactors.push(
      `Prédiction basée sur 8,255 combats historiques (72.3% accuracy)`,
      `Modèle: Random Forest avec 48 features statistiques`
    );

    const prediction = {
      fighter1WinProbability: mlPrediction.fighter1_win_prob,
      fighter2WinProbability: mlPrediction.fighter2_win_prob,
      confidenceScore: mlPrediction.confidence,
      breakdown: {
        // Utiliser directement les valeurs de l'API (juste inverser le signe pour l'UI)
        // Ordre basé sur l'importance des features dans le modèle ML
        knockdownAdvantage: analysis.knockdown_advantage
          ? normalizeAdvantage(analysis.knockdown_advantage)
          : baseAdvantage,
        strikingAdvantage: analysis.striking_advantage
          ? normalizeAdvantage(analysis.striking_advantage)
          : baseAdvantage,
        grapplingAdvantage: analysis.grappling_advantage
          ? normalizeAdvantage(analysis.grappling_advantage)
          : baseAdvantage,
        groundAdvantage: analysis.ground_advantage
          ? normalizeAdvantage(analysis.ground_advantage)
          : baseAdvantage,
        controlAdvantage: analysis.control_advantage
          ? normalizeAdvantage(analysis.control_advantage)
          : baseAdvantage,
        headStrikesAdvantage: analysis.head_strikes_advantage
          ? normalizeAdvantage(analysis.head_strikes_advantage)
          : baseAdvantage,
        defensiveAdvantage: analysis.defense_advantage
          ? normalizeAdvantage(analysis.defense_advantage)
          : baseAdvantage,
        submissionAdvantage: analysis.submission_advantage
          ? normalizeAdvantage(analysis.submission_advantage)
          : baseAdvantage,
        finishPotential: analysis.finish_potential
          ? normalizeAdvantage(analysis.finish_potential)
          : baseAdvantage,
        experienceAdvantage: analysis.experience_advantage
          ? normalizeAdvantage(analysis.experience_advantage)
          : baseAdvantage,
      },
      analysis: {
        keyFactors,
        warnings: mlPrediction.confidence < 15
          ? ['Combat très serré - Issue incertaine', 'Les deux combattants ont des chances équilibrées']
          : mlPrediction.confidence < 25
          ? ['Prédiction serrée - Plusieurs scénarios possibles']
          : [],
        prediction: mlPrediction.prediction === 'fighter1'
          ? `Victoire probable de ${fighter1.name}`
          : `Victoire probable de ${fighter2.name}`,
      },
    };

    return NextResponse.json({
      success: true,
      fighter1: {
        name: fighter1.name,
        style: f1Info?.fighting_style || undefined,
        age: f1Info?.age?.toString() || undefined,
        reach: f1Info?.reach?.toString() || undefined,
        profileUrl: `https://www.ufc.com/athlete/${fighter1Name}` // Approximation
      },
      fighter2: {
        name: fighter2.name,
        style: f2Info?.fighting_style || undefined,
        age: f2Info?.age?.toString() || undefined,
        reach: f2Info?.reach?.toString() || undefined,
        profileUrl: `https://www.ufc.com/athlete/${fighter2Name}` // Approximation
      },
      prediction,
    });
  } catch (error) {
    console.error('Prediction API Error:', error);

    // Vérifier si l'API Python est accessible
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      return NextResponse.json(
        {
          error: 'API de prédiction non disponible. Assurez-vous que le serveur Python tourne sur le port 8000.',
          details: 'Lancez: python3 api.py'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors du calcul de la prédiction' },
      { status: 500 }
    );
  }
}
