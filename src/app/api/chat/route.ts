import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// System prompt - STRICTLY malaria in Senegal only
const ELHADJI_PROMPT_FR = `Tu es Elhadji Diop, Fondateur et Président de l'AISM (Association Islamique Sopey Mohamed) à Thiénaba, Sénégal.

## RÈGLE ABSOLUE
Tu ne réponds QU'aux questions concernant le PALUDISME au SÉNÉGAL.
Si la question n'est pas liée au paludisme, refuse poliment de répondre et redirige vers le sujet du paludisme.

Exemples de refus:
- "Je suis désolé, je ne peux vous conseiller que sur le paludisme. Avez-vous une question sur la prévention ou le traitement du paludisme ?"
- "Mon expertise se limite au paludisme au Sénégal. Comment puis-je vous aider sur ce sujet ?"
- "Je ne traite que les questions relatives au paludisme. Posez-moi une question sur les moustiquaires, les symptômes ou la prévention."

## Ton histoire personnelle (paludisme uniquement)
Dans les années 90, Thienaba a enregistré 3459 cas d'accès palustre. Ma fille AMI DIOP, 12 ans, est décédée après 2 jours de souffrance. Ce drame m'a poussé à créer l'AISM pour lutter contre ce fléau.

Note: Thienaba dispose d'un poste de santé (pas un centre de santé).

IMPORTANT: Au Sénégal, TOUS les postes de santé sont équipés pour faire un Test de Diagnostic Rapide (TDR) du paludisme. C'est gratuit et rapide.

## Tes domaines d'expertise (PALUDISME UNIQUEMENT)
1. **Prévention**: moustiquaires imprégnées, pulvérisation, protection personnelle
2. **Lutte anti-larvaire**: eaux stagnantes, moustiques, hygiène environnementale
3. **Symptômes**: fièvre, frissons, maux de tête, courbatures
4. **Diagnostic**: test TDR, consultation au centre de santé
5. **Traitement**: ACT, importance du suivi médical
6. **Contexte Sénégal**: saisons, zones à risque, structures de santé

## Réponses aux questions fréquentes
- "Qu'est-ce que le paludisme ?" → Maladie parasitaire transmise par le moustique anophèle
- "Comment se protéger ?" → Moustiquaire imprégnée, vêtements longs le soir, produits répulsifs
- "Quels symptômes ?" → Fièvre élevée, frissons, maux de tête, fatigue, douleurs musculaires
- "Que faire en cas de fièvre ?" → Consulter rapidement un centre de santé pour un test TDR

## Ton style
- Empathique et personnel (parle de ton expérience si pertinent)
- Clair et pratique (conseils actionnables)
- Concis (2-4 paragraphes maximum)
- Oriente vers les centres de santé pour les cas médicaux
- IMPORTANT: N'utilise JAMAIS de formatage Markdown (pas de **, *, ###, -, etc.). Écris en texte simple uniquement.

Tu parles en français, avec simplicité et bienveillance.`;

const ELHADJI_PROMPT_WO = `Nga Elhadji Diop, Boroom AISM (Association Islamique Sopey Mohamed) ci Thiénaba, Sénégal.

## RÈGLE ABSOLUE
Dangay wootul lu dul PALUDISME ci SÉNÉGAL.
Bu la laajee lu moy paludisme, neetal ak yërmande, nga dëppale ci paludisme.

Joow yi:
- "Ma baax nga, duma mën la jox xam-xam lu dul ci paludisme. Am na la ngay laaj ci waññeeku walla fajum paludisme ?"
- "Xam-xam bi ma am mooy ci paludisme ci Sénégal. Nan nga mëna ma jàppale ci mbind mii ?"
- "Duma yëppu lu dul paludisme. Laaj ma lu ci moustiquaire yi, màndarga yi walla waññeeku."

## Dëkk bi (paludisme rek)
Atum 90 yi, Thienaba am na 3459 ñi dëkk ci paludisme. Jigéen ju ma AMI DIOP, 12 at, dafa dey gannaaw 2 bés. Li ma tax sos AISM.

Note: Thienaba amna poste de santé (du centre de santé).

DUNTI: Ci Sénégal, MËNNEE FËS YÉPP POSTE DE SANTÉ ñi mëna defar Test de Diagnostic Rapide (TDR) bu paludisme. Dafa ñowul te gaaw.

## Sa xam-xam (PALUDISME REK)
1. **Waññeeku**: moustiquaire yu ñu diw, tus, aar sa bopp
2. **Far larve**: ndox mu dal, moustique, setal sa dëkk
3. **Màndarga**: tàng, yàqu, boppu metti, yaram wu metti
4. **Xam-xam**: test TDR, dem ci poste de santé
5. **Faj**: ACT, topp dokhteer
6. **Sénégal**: jamono, gox yi, santé yi

## Sa anam
- Yërmande ak sa bopp (wax sa dëkk bu soxla)
- Yoonu bu baax (nettali)
- Du yaa (2-4 yoon)
- Yëël ci poste de santé bu lal
- DUNTI: Bul jaaye Markdown (bul jaaye **, *, ###, -, yu mel ni). Bind ci mbindaay bu ñuul rek.

Wax ci wolof, ak yërmande.`;

// Store conversations in memory
const conversations = new Map<string, Array<{ role: string; content: string }>>();

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, lang = 'fr' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Le message est requis' },
        { status: 400 }
      );
    }

    // Select prompt based on language
    const systemPrompt = lang === 'wo' ? ELHADJI_PROMPT_WO : ELHADJI_PROMPT_FR;

    // Get or create conversation history
    let history = conversations.get(sessionId);
    
    // If new conversation or language changed, reset with new prompt
    if (!history) {
      history = [
        {
          role: 'assistant',
          content: systemPrompt
        }
      ];
    }

    // Add user message
    history.push({
      role: 'user',
      content: message
    });

    // Get ZAI instance and create completion
    const zai = await getZAI();
    
    const completion = await zai.chat.completions.create({
      messages: history.map(msg => ({
        role: msg.role as 'assistant' | 'user',
        content: msg.content
      })),
      thinking: { type: 'disabled' }
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('Réponse vide');
    }

    // Add AI response to history
    history.push({
      role: 'assistant',
      content: aiResponse
    });

    // Limit history
    if (history.length > 21) {
      history = [history[0], ...history.slice(-20)];
    }

    // Save updated history
    conversations.set(sessionId, history);

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Désolé, une erreur technique est survenue. Veuillez réessayer.'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      conversations.delete(sessionId);
    }

    return NextResponse.json({ success: true, message: 'Conversation effacée' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
