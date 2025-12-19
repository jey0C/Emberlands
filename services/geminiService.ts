
import { GoogleGenAI, Type } from "@google/genai";
import { MemoryEntry, EmotionCategory, Insight } from "../types";

// Ensure TypeScript knows process exists in the build environment
declare const process: {
  env: {
    API_KEY: string;
  };
};

const extractJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON from response:", text);
    throw new Error("AI returned an invalid data format. Please try again.");
  }
};

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("GEMINI API KEY MISSING");
    throw new Error("API Key is missing. Please ensure your environment is configured.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeMemory = async (text: string, imageData?: string, userCoords?: { lat: number, lng: number }): Promise<MemoryEntry['analysis'] & { location?: { lat: number, lng: number, name?: string } }> => {
  const ai = getAIInstance();
  const parts: any[] = [{ text: `Analyze this moment: "${text || "(Visual input provided)"}". ${userCoords ? `Current Location: Lat ${userCoords.lat}, Lng ${userCoords.lng}.` : ''}` }];
  
  if (imageData && imageData.includes('base64,')) {
    try {
      const splitData = imageData.split('base64,');
      const base64Data = splitData[1];
      const mimeType = imageData.split(';')[0].split(':')[1];
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    } catch (e) {
      console.error("Image processing error:", e);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: `You are an empathetic emotional data analyst. Extract emotional metadata and spatial context.
        
        Guidelines:
        - Intensity: 1-10 scale.
        - DominantEmotions: Choose 1-3 from: [Joy, Sorrow, Anger, Fear, Calm, Excitement, Anxiety, Awe].
        - Themes: 2-3 short labels.
        - Summary: ONE poetic, evocative sentence.
        - Location: Suggest a lat/lng if a specific place is implied by text or image.
        
        Output ONLY valid JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intensity: { type: Type.NUMBER },
            dominantEmotions: { type: Type.ARRAY, items: { type: Type.STRING } },
            themes: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            location: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                name: { type: Type.STRING }
              }
            }
          },
          required: ['intensity', 'dominantEmotions', 'themes', 'summary']
        }
      }
    });

    const output = response.text;
    if (!output) throw new Error("The AI provided an empty response. It might have been filtered for safety.");
    return extractJson(output);
  } catch (err: any) {
    if (err.message?.includes('API_KEY_INVALID')) throw new Error("Invalid API Key.");
    throw err;
  }
};

export const generateInsights = async (history: MemoryEntry[]): Promise<Insight[]> => {
  if (history.length < 3) return [];
  const ai = getAIInstance();
  const historyString = history.map(h => 
    `Time: ${new Date(h.timestamp).toISOString()}, Emotions: ${h.analysis.dominantEmotions.join(', ')}, Intensity: ${h.analysis.intensity}, Summary: ${h.analysis.summary}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Examine this history and provide 2-3 reflective insights on patterns:\n${historyString}`,
      config: {
        systemInstruction: `Return a JSON array of Insight objects. Be reflective and pattern-oriented. No medical advice.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['pattern', 'spike', 'cycle'] }
            },
            required: ['title', 'description', 'type']
          }
        }
      }
    });

    const output = response.text;
    if (!output) return [];
    return extractJson(output);
  } catch (e) {
    console.warn("Insight generation failed:", e);
    return [];
  }
};
