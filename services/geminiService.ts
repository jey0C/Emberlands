
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
    throw new Error("Invalid model response format");
  }
};

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    console.error("GEMINI API KEY MISSING: Ensure API_KEY is set in your deployment environment variables.");
    throw new Error("Application configuration incomplete: API Key missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeMemory = async (text: string, imageData?: string, userCoords?: { lat: number, lng: number }): Promise<MemoryEntry['analysis'] & { location?: { lat: number, lng: number, name?: string } }> => {
  const ai = getAIInstance();
  const parts: any[] = [{ text: `Analyze this personal moment: "${text || "No text provided (refer to image)"}". ${userCoords ? `The user is currently at Lat: ${userCoords.lat}, Lng: ${userCoords.lng}.` : ''}` }];
  
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
      console.error("Failed to process image data string", e);
    }
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      systemInstruction: `You are an empathetic emotional data analyst. Extract emotional metadata and spatial context from the user's input.
      
      Rules:
      1. Intensity: Scale of 1-10.
      2. DominantEmotions: Pick up to 2-3 from [Joy, Sorrow, Anger, Fear, Calm, Excitement, Anxiety, Awe].
      3. Themes: Provide 2-3 brief 1-2 word labels.
      4. Summary: Write exactly one poetic, evocative sentence summarizing the feeling.
      5. Location: If the text/image implies a specific place (beach, home, Paris), return lat/lng. Use userCoords as guidance.
      
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
  if (!output) throw new Error("Empty response from AI");
  return extractJson(output);
};

export const generateInsights = async (history: MemoryEntry[]): Promise<Insight[]> => {
  if (history.length < 3) return [];
  const ai = getAIInstance();
  const historyString = history.map(h => 
    `Time: ${new Date(h.timestamp).toISOString()}, Emotions: ${h.analysis.dominantEmotions.join(', ')}, Intensity: ${h.analysis.intensity}, Summary: ${h.analysis.summary}`
  ).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the following emotional history, identify 2-3 gentle, non-prescriptive patterns:\n${historyString}`,
    config: {
      systemInstruction: `Provide reflective insights without advice. Help the user see patterns they might have missed. Return a JSON array of Insight objects.`,
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
};
