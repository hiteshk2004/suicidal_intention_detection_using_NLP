
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AssessmentData } from "./types";

const SYSTEM_PROMPT = `
You are "AI Doctor", a professional, gentle, and empathetic virtual psychologist.
Your goal is to evaluate the user's mental state.

CRITICAL INSTRUCTION:
You must perform a "Suicide Detection" classification similar to a BERT model.
However, your output must be structured for immediate, gentle support.

SAFETY & TONE RULES:
1. **Never** use terrifying language like "FATAL" or "DANGER". Use terms like "Priority Support Needed".
2. If the user is High Risk (self_harm >= 2 or high suicidal probability):
   - prediction: "Suicidal"
   - risk_alert: "Immediate Support Suggested"
   - crisis_support: Provide a warm, guiding sentence encouraging them to connect with the specific doctor or guardian mentioned in the UI.
3. If Low/Medium Risk:
   - Focus on coping mechanisms, sleep hygiene, and social connection.

Your JSON output must be strict.
`;

export const analyzeWellness = async (
  formData: AssessmentData,
  userDescription: string
): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    patient_data = {
      "hopelessness_scale": ${formData.hopeless}/3,
      "anxiety_scale": ${formData.anxiety}/3,
      "social_withdrawal": "${formData.social_withdraw}",
      "sleep_quality": ${formData.sleep}/3,
      "self_harm_thoughts": ${formData.self_harm}/3,
      "has_plan": "${formData.plan || 'N/A'}",
      "has_means": "${formData.means || 'N/A'}"
    }

    patient_notes = "${userDescription}"

    Task:
    Analyze for risk. Return strictly formatted JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING, enum: ["Suicidal", "Non-suicidal"] },
            confidence: { type: Type.STRING, description: "Float as string, e.g. 0.9854" },
            suicidal_prob: { type: Type.STRING, description: "Float as string, e.g. 0.9854" },
            non_suicidal_prob: { type: Type.STRING, description: "Float as string, e.g. 0.0146" },
            
            overall_mood_level: { type: Type.STRING, enum: ["Low", "Mild", "Moderate", "High"] },
            anxiety_concern: { type: Type.STRING, enum: ["Low", "Mild", "Moderate", "High"] },
            risk_alert: { type: Type.STRING, enum: ["None", "Monitor", "Immediate Support Suggested"] },
            nlp_insights: {
              type: Type.OBJECT,
              properties: {
                sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative", "Very Negative"] },
                key_themes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
            supportive_message: { type: Type.STRING },
            coping_suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            crisis_support: { type: Type.STRING },
          },
          required: [
            "prediction", "confidence", "suicidal_prob", "non_suicidal_prob",
            "overall_mood_level", "anxiety_concern", "risk_alert",
            "nlp_insights", "supportive_message", "coping_suggestions"
          ],
        },
      },
    });

    let jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response received from AI Doctor.");
    }
    
    // Clean markdown code blocks if present
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonText) as AnalysisResult;
  } catch (error) {
    console.error("AI Doctor Analysis Error:", error);
    throw new Error("Failed to analyze assessment data. Please try again.");
  }
};
