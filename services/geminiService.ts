import { GoogleGenAI } from "@google/genai";
import { TestResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeResults = async (results: TestResult[]): Promise<string> => {
  if (results.length === 0) return "No hay resultados para analizar.";

  const resultsSummary = results.map(r => 
    `- Material: ${r.material.name} (${r.material.fractureType})
     - Energía Inicial: ${r.initialEnergy.toFixed(2)} J
     - Energía Absorbida: ${r.absorbedEnergy.toFixed(2)} J
     - Ángulo Final: ${r.finalAngle.toFixed(2)} grados`
  ).join('\n');

  const prompt = `
    Actúa como un Ingeniero de Materiales Senior analizando datos del Ensayo de Impacto Charpy.
    
    Aquí están los resultados recientes de las pruebas:
    ${resultsSummary}

    Por favor, proporciona un análisis técnico conciso en español que cubra:
    1. Una comparación de la tenacidad (energía absorbida) de los materiales probados.
    2. Una explicación de la relación entre la energía absorbida y el tipo de fractura (Dúctil vs Frágil) observada en los datos.
    3. Implicaciones prácticas: ¿Dónde usarías el material más tenaz frente al más frágil basándote en estos resultados?
    
    Formatea la respuesta en Markdown claro. Mantén un tono profesional pero accesible para estudiantes de ingeniería.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Análisis completo, pero no se devolvió texto.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error al generar el análisis. Por favor verifica la configuración de la API.";
  }
};