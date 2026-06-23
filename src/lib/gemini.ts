import { GoogleGenAI } from '@google/genai';

interface AnalysisResult {
  category: string;
  severity: number;
  title: string;
  description: string;
  reasoning: string;
}

export const analyzeIssueImage = async (imageUrl: string): Promise<AnalysisResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please check your environment variables.");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch the uploaded image for analysis.");
  }
  const blob = await response.blob();
  
  const base64Image = await new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      if (fileReader.result) {
        const base64 = (fileReader.result as string).split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsDataURL(blob);
  });

  let mimeType = blob.type;
  if (!mimeType) {
    if (imageUrl.includes('.mp4')) mimeType = 'video/mp4';
    else if (imageUrl.includes('.png')) mimeType = 'image/png';
    else mimeType = 'image/jpeg';
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a civic issue classifier. Analyze the image and respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text. Schema: 
{"category": one of ["Pothole","Garbage","Streetlight","Water Leakage","Other"], "severity": integer 1-10, "title": short string max 8 words, "description": string max 30 words, "reasoning": string max 20 words explaining the severity score}`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image, mimeType } }
        ]
      }
    ]
  });

  let rawText = result.text || "";
  
  const parseJson = (text: string) => {
    let cleanedText = text.trim();
    if (cleanedText.startsWith('\`\`\`json')) {
      cleanedText = cleanedText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (cleanedText.startsWith('\`\`\`')) {
      cleanedText = cleanedText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }
    return JSON.parse(cleanedText);
  };

  try {
    return parseJson(rawText);
  } catch (e) {
    console.error("Failed to parse the first time, going to retry parsing logic", e);
    try {
      // Just retry the parseJson once as requested
      return parseJson(rawText);
    } catch (e2) {
      throw new Error("Failed to parse Gemini response as JSON: " + (result.text || "empty"));
    }
  }
};

export const checkDuplicateIssue = async (newDescription: string, existingDescription: string): Promise<{similarity: number, isDuplicate: boolean}> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Compare these two civic issue descriptions. Respond with ONLY valid JSON: {"similarity": float 0 to 1, "isDuplicate": boolean (true if similarity > 0.8)}

Description 1: ${newDescription}
Description 2: ${existingDescription}`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ]
  });

  let rawText = result.text || "";
  
  const parseJson = (text: string) => {
    let cleanedText = text.trim();
    if (cleanedText.startsWith('\`\`\`json')) {
      cleanedText = cleanedText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (cleanedText.startsWith('\`\`\`')) {
      cleanedText = cleanedText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }
    return JSON.parse(cleanedText);
  };

  try {
    return parseJson(rawText);
  } catch (e) {
    return parseJson(rawText);
  }
};

export const predictWardTrend = async (recentReports: {category: string, severityScore: number}[]): Promise<{category: string, trend: "increasing"|"stable"|"decreasing", confidence: "low"|"medium"|"high", reasoning: string}> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const reportDataStr = JSON.stringify(recentReports);
  
  const prompt = `Based on these recent civic issue reports, predict which issue category is likely to increase in this area over the next 14 days and explain why in one sentence. Respond with ONLY valid JSON: {"category": string, "trend": "increasing"|"stable"|"decreasing", "confidence": "low"|"medium"|"high", "reasoning": string max 25 words}
  
  Reports Data:
  ${reportDataStr}`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  });

  let rawText = result.text || "";
  
  const parseJson = (text: string) => {
    let cleanedText = text.trim();
    if (cleanedText.startsWith('\`\`\`json')) {
      cleanedText = cleanedText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (cleanedText.startsWith('\`\`\`')) {
      cleanedText = cleanedText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }
    return JSON.parse(cleanedText);
  };

  try {
    return parseJson(rawText);
  } catch (e) {
    return parseJson(rawText);
  }
};
