'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [responseAudioUrl, setResponseAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    console.log('[DEBUG] FormData file', file); // 🐞 Ligne ajoutée pour déboguer

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResponseAudioUrl(data.audioUrl);
      } else {
        console.error('Erreur serveur :', data);
        alert(data.error || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error('Erreur client :', err);
      alert('Erreur côté client.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 space-y-4">
      <h1 className="text-3xl font-bold">🎙️ Bienvenue sur Coccinelle.ai</h1>
      <p className="text-lg text-gray-600">
        Votre assistant vocal intelligent est prêt à vous aider.
      </p>

      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="border p-2"
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Traitement...' : "Envoyer un fichier audio"}
      </button>

      {responseAudioUrl && (
        <audio controls className="mt-4">
          <source src={responseAudioUrl} type="audio/mp3" />
          Votre navigateur ne supporte pas l’audio.
        </audio>
      )}
    </main>
  );
}
