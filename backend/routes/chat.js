import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// Helper to generate content trying available Gemini models in sequence
async function generateGeminiResponse(genAI, promptText) {
  const modelsToTry = [
    'gemini-2.5-flash', 
    'gemini-flash-latest', 
    'gemini-3.5-flash', 
    'gemini-2.5-pro',
    'gemini-flash-lite-latest',
    'gemini-1.5-flash'
  ];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptText);
      if (result && result.response) {
        return { text: result.response.text(), modelUsed: modelName };
      }
    } catch (err) {
      console.warn(`Gemini model ${modelName} attempt notice:`, err.message);
    }
  }
  throw new Error('All Gemini free models were unavailable or API key invalid.');
}

// POST /api/chat - AI Concierge chat endpoint with RAG context
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const message = body.message;
    const messages = body.messages;
    const userPrompt = message || (Array.isArray(messages) && messages[messages.length - 1]?.text) || '';

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return res.status(400).json({ error: 'Message field is required' });
    }

    // 1. Safely query Mongo DB for available vehicles
    let availableVehicles = [];
    try {
      if (Vehicle && Vehicle.db && Vehicle.db.readyState === 1) {
        availableVehicles = await Vehicle.find({ status: 'Available' }).lean().exec();
      } else {
        availableVehicles = await Vehicle.find({}).lean().exec();
      }
    } catch (dbErr) {
      console.warn('[Chat AI] MongoDB query notice:', dbErr.message);
    }

    // Format vehicle list for RAG context
    const vehicleSummaryList = (availableVehicles || []).map(v => ({
      id: v._id ? String(v._id) : '',
      name: `${v.make || ''} ${v.model || ''}`,
      category: v.category || 'Car',
      subcategory: v.subcategory || '',
      year: v.year || 2024,
      pricePerDay: v.pricePerDay || v.pricePerHour || 0,
      transmission: v.features?.transmission || 'Non spécifié',
      fuel: v.features?.fuel || 'Non spécifié',
      horsepower: v.features?.horsepower || 0
    }));

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    // 2. OPTION 1: Google Gemini API (100% FREE Tier from Google AI Studio)
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);

        const systemPrompt = `Tu es "WahranRent AI Concierge", l'assistant IA intelligent et chaleureux de WahranRent (plateforme de location de véhicules VIP en Algérie).

FLOTTE ACTUELLE EN TEMPS RÉEL (BASE DE DONNÉES) :
${JSON.stringify(vehicleSummaryList, null, 2)}

INFORMATIONS & RÈGLES DE LOCATION :
- Agences : Alger & Oran (Livraison aux aéroports disponible 24/7).
- Conditions : Permis de conduire valide (min. 2 ans d'ancienneté), Passeport ou pièce d'identité originale.
- Caution : Zéro caution obligatoire en ligne, option de dépôt flexible et 100% du paiement effectué sur place.

RÈGLES STRICTES DE RÉPONSE :
1. Sois extrêmement professionnel, poli et réactif en Français (ou Arabe si le client s'adresse en Arabe).
2. Analyse les besoins du client (budget, SUV, citadine, boîte automatique, sport, etc.) et propose des modèles de notre flotte.
3. À la TOUTE FIN sur une nouvelle ligne, renvoie obligatoirement ce bloc JSON strict :
\`\`\`json
{ "recommendedVehicleIds": ["ID1", "ID2"] }
\`\`\`
`;

        const promptText = `${systemPrompt}\n\nMessage client : "${userPrompt}"`;
        const { text: rawText, modelUsed } = await generateGeminiResponse(genAI, promptText);

        let textResponse = rawText;
        let recommendedVehicleIds = [];

        const jsonMatch = rawText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            recommendedVehicleIds = parsed.recommendedVehicleIds || [];
            textResponse = rawText.replace(/```json\s*\{[\s\S]*?\}\s*```/, '').trim();
          } catch (e) {
            // ignore JSON parse error
          }
        }

        let recommendedVehicles = [];
        if (recommendedVehicleIds.length > 0) {
          recommendedVehicles = availableVehicles.filter(v => 
            v._id && recommendedVehicleIds.includes(String(v._id))
          );
        }

        return res.json({
          reply: textResponse,
          recommendedVehicles,
          provider: `Google Gemini (${modelUsed})`
        });
      } catch (aiErr) {
        console.error('[Chat AI] Gemini API error, falling back to free RAG engine:', aiErr.message);
      }
    }

    // 3. OPTION 2: Modèle Intégré RAG 100% Gratuit (Sans aucune clé requise !)
    const q = userPrompt.toLowerCase();
    let matches = [...availableVehicles];
    let reason = '';

    if (q.includes('suv') || q.includes('4x4') || q.includes('familial')) {
      matches = matches.filter(v => (v.subcategory && v.subcategory.toLowerCase().includes('suv')) || (v.model && v.model.toLowerCase().includes('duster')) || (v.model && v.model.toLowerCase().includes('tucson')));
      reason = 'SUV & Modèles Familiaux';
    } else if (q.includes('citadine') || q.includes('pas cher') || q.includes('économique')) {
      matches = matches.filter(v => (v.make && v.make.toLowerCase().includes('dacia')) || (v.model && v.model.toLowerCase().includes('clio')) || (v.model && v.model.toLowerCase().includes('208')));
      reason = 'Citadines Économiques';
    } else if (q.includes('luxe') || q.includes('prestige') || q.includes('mariage')) {
      matches = matches.sort((a, b) => (b.pricePerDay || 0) - (a.pricePerDay || 0));
      reason = 'Gamme Prestige & Luxe';
    } else if (q.includes('auto') || q.includes('automatique')) {
      matches = matches.filter(v => v.features && v.features.transmission === 'Automatic');
      reason = 'Boîte Automatique';
    }

    matches = matches.slice(0, 4);

    let replyText = `Bonjour ! Je suis **WahranRent AI Concierge**.\n\nVoici notre sélection de véhicules disponibles correspondant à votre recherche :`;
    if (reason) {
      replyText += `\n\n🎯 *Sélection basée sur : ${reason}*`;
    }

    return res.json({
      reply: replyText,
      recommendedVehicles: matches,
      provider: 'AI Engine'
    });

  } catch (err) {
    console.error('[Chat AI Error]:', err);
    return res.status(200).json({
      reply: "Bonjour ! Je suis l'assistant WahranRent AI. Comment puis-je vous aider dans votre choix de véhicule ?",
      recommendedVehicles: [],
      provider: 'Modèle Gratuit Intégré'
    });
  }
});

export default router;
