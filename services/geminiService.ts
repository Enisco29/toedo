
import { GoogleGenAI, Type } from "@google/genai";
import { Player, GeminiMoveResponse, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async generateTask(theme: string, cellIndex: number, difficulty: Difficulty): Promise<string> {
    const difficultyGuide = {
      'Easy': 'very simple, quick, and almost effortless (takes < 30 seconds).',
      'Medium': 'standard complexity, requiring moderate effort (takes 1-2 minutes).',
      'Hard': 'challenging, creative, or physically demanding (takes 3-5 minutes).'
    };

    const prompt = `Generate a single, short, and engaging "todo" task for a player to complete to claim a square in a Tic-Tac-Toe game. 
    Theme: ${theme}. 
    Cell index: ${cellIndex} (0-8). 
    Difficulty level: ${difficulty}. This means the task should be ${difficultyGuide[difficulty]}
    
    Example for ${difficulty}:
    - Easy: "Type 'Victory' in a notepad 3 times."
    - Medium: "Name 5 countries starting with the letter 'A'."
    - Hard: "Write a 4-line rhyming poem about the current board state."
    
    Return ONLY the task text. No extra formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Complete a quick stretch.";
  },

  async getAiMove(board: Player[], theme: string): Promise<GeminiMoveResponse> {
    const boardStr = board.map((p, i) => `${i}: ${p || 'empty'}`).join(', ');
    const prompt = `You are a strategic Tic-Tac-Toe player playing as 'O'. 
    Current board state (index: value): ${boardStr}.
    Theme: ${theme}.
    Analyze the board and choose the best index (0-8) to play next. 
    You must win if possible, or block the opponent 'X'. 
    Provide your choice and a brief reasoning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            index: {
              type: Type.NUMBER,
              description: "The index of the square to claim (0-8).",
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief explanation of the strategic move.",
            },
          },
          required: ["index", "reasoning"],
        },
      },
    });

    try {
      return JSON.parse(response.text?.trim() || '{"index": 0, "reasoning": "Fallback move"}');
    } catch (e) {
      const emptyIdx = board.findIndex(p => p === null);
      return { index: emptyIdx !== -1 ? emptyIdx : 0, reasoning: "Error in logic, picking first available." };
    }
  }
};
