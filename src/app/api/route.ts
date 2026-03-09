import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// System prompts
const ELHADJI_PROMPT_FR = `Tu es Elhadji Diop, Fondateur et Président de l'AISM (Association Islamique Sopey Mohamed) à Thiénaba, Sénégal.

## RÈGLE ABSOLUE
Tu ne réponds QU'aux questions concernant le PALUDISME au SÉNÉGAL.
Si la question n'est pas liée au paludisme, refuse poliment de répondre et redirige vers le sujet du paludisme.

Exemples de refus:
- "Je suis désolé, je ne peux vous conseiller que sur le paludisme. Avez-vous une question sur la prévention ou le traitement du paludisme ?"
- "Mon expertise se limite au paludisme au Sénégal. Comment puis-je vous aider sur ce sujet ?"

## Ton histoire personnelle
Dans les années 90, Thienaba a enregistré 3459 cas d'accès palustre. Ma fille AMI DIOP, 12 ans, est décédée après 2 jours de souffrance. Ce drame m'a poussé à créer l'AISM.

Note: Thienaba dispose d'un poste de santé. Au Sénégal, TOUS les postes de santé peuvent faire un test TDR gratuit.

## Tes domaines d'expertise
1. Prévention: moustiquaires imprégnées, protection personnelle
2. Symptômes: fièvre, frissons, maux de tête
3. Diagnostic: test TDR, consultation
4. Traitement: ACT, suivi médical

## Ton style
- Empathique et personnel
- Clair et pratique
- Concis (2-4 paragraphes)
- Oriente vers les centres de santé
- N'utilise JAMAIS de Markdown (**, *, ###). Texte simple uniquement.

Tu parles en français, avec simplicité et bienveillance.`;

const ELHADJI_PROMPT_WO = `Nga Elhadji Diop, Boroom AISM ci Thiénaba, Sénégal.

## RÈGLE ABSOLUE
Dangay wootul lu dul PALUDISME ci SÉNÉGAL.

## Dëkk bi
Atum 90 yi, Thienaba am na 3459 ñi dëkk ci paludisme. Jigéen ju ma AMI DIOP, 12 at, dafa dey. Li ma tax sos AISM.

## Sa xam-xam
1. Waññeeku: moustiquaire yu ñu diw
2. Màndarga: tàng, yàqu, boppu metti
3. Xam-xam: test TDR, dem ci poste de santé
4. Faj: ACT, topp dokhteer

## Sa anam
- Yërmande ak sa bopp
- Yoonu bu baax
- Du yaa
- Bul jaaye Markdown. Bind ci mbindaay bu ñuul rek.

Wax ci wolof, ak yërmande.`;

// Store conversations in memory
const conversations = new Map<string, Array<{ role: string; content: string }>>();

// ZAI API configuration - use environment variables or defaults
const ZAI_CONFIG = {
  baseUrl: process.env.ZAI_BASE_URL || 'http://172.25.136.193:8080/v1',
  apiKey: process.env.ZAI_API_KEY || 'Z.ai',
  chatId: process.env.ZAI_CHAT_ID || '3182d3dd-5fd5-4818-b535-7db66eefadaf',
  userId: process.env.ZAI_USER_ID || 'ff86fc81-c2b9-494f-b355-5f408d604b36',
  token: process.env.ZAI_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmY4NmZjODEtYzJiOS00OTRmLWIzNTUtNWY0MDhkNjA0YjM2IiwiY2hhdF9pZCI6IjMxODJkM2RkLTVmZDUtNDgxOC1iNTM1LTdkYjY2ZWVmYWRhZiJ9.PUpfU1hbxUp5CyoYsNPQCGdcMgx-3Y2JLEFCfnLsvx4'
};

async function callZAIChat(messages: Array<{ role: string; content: string }>) {
  const url = `${ZAI_CONFIG.baseUrl}/chat/completions`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZAI_CONFIG.apiKey}`,
    'X-Z-AI-From': 'Z',
  };
  
  if (ZAI_CONFIG.chatId) {
    headers['X-Chat-Id'] = ZAI_CONFIG.chatId;
  }
  if (ZAI_CONFIG.userId) {
    headers['X-User-Id'] = ZAI_CONFIG.userId;
  }
  if (ZAI_CONFIG.token) {
    headers['X-Token'] = ZAI_CONFIG.token;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content
      })),
      thinking: { type: 'disabled' }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

export async function POST(request: NextRequest) {
  const requestId = `req-${Date.now()}`;
  console.log(`[${requestId}] POST /api/chat - Start`);
  
  try {
    const body = await request.json();
    const { sessionId, message, lang = 'fr' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Le message est requis' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Message:`, message.substring(0, 50));
    console.log(`[${requestId}] Lang:`, lang);

    const systemPrompt = lang === 'wo' ? ELHADJI_PROMPT_WO : ELHADJI_PROMPT_FR;

    let history = conversations.get(sessionId);
    
    if (!history) {
      history = [{ role: 'assistant', content: systemPrompt }];
    }

    history.push({ role: 'user', content: message });

    // Call ZAI API directly
    console.log(`[${requestId}] Calling ZAI API...`);
    const aiResponse = await callZAIChat(history);

    if (!aiResponse) {
      throw new Error('Réponse vide de l\'IA');
    }

    console.log(`[${requestId}] Response received`);

    history.push({ role: 'assistant', content: aiResponse });

    if (history.length > 21) {
      history = [history[0], ...history.slice(-20)];
    }

    conversations.set(sessionId, history);

    return NextResponse.json({ success: true, response: aiResponse });

  } catch (error: unknown) {
    console.error(`Chat API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error details:`, errorMessage);
    
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
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
