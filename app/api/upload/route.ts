import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Étape 1 : appel WhisperAPI avec la clé directement intégrée
    const whisperRes = await fetch('https://api.whisperapi.com/asr', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer talbZKkdhs8SnGmSbFWciBsAVrRat4UY',
        'Content-Type': 'audio/mpeg',
      },
      body: buffer,
    });

    if (!whisperRes.ok) {
      const error = await whisperRes.text();
      console.error('Erreur WhisperAPI :', error);
      return NextResponse.json({ error: 'Erreur WhisperAPI', details: error }, { status: 500 });
    }

    const whisperData = await whisperRes.json();
    const userText = whisperData.text || whisperData.transcription || 'Transcription non trouvée';

    // Étape 2 : appel OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Tu es un assistant vocal bienveillant.' },
          { role: 'user', content: userText }
        ]
      }),
    });

    const openaiData = await openaiRes.json();
    const aiResponse = openaiData.choices?.[0]?.message?.content || 'Réponse vide.';

    // Étape 3 : appel Coqui (TTS)
    const ttsRes = await fetch(`${process.env.COQUI_URL}/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: aiResponse }),
    });

    if (!ttsRes.ok) {
      const ttsErr = await ttsRes.text();
      console.error('Erreur Coqui :', ttsErr);
      return NextResponse.json({ error: 'Erreur Coqui', details: ttsErr }, { status: 500 });
    }

    const ttsData = await ttsRes.json();

    return NextResponse.json({ audioUrl: ttsData.audioUrl });

  } catch (err: any) {
    console.error('Erreur serveur :', err);
    return NextResponse.json({ error: 'Erreur serveur', details: err.message }, { status: 500 });
  }
}
