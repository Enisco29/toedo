
export type Player = 'X' | 'O' | null;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Task {
  id: number;
  description: string;
  isCompleted: boolean;
  assignedTo: Player;
}

export interface GameState {
  board: Player[];
  currentPlayer: Player;
  winner: Player | 'Draw' | null;
  tasks: Record<number, Task | null>;
  isProcessing: boolean;
  gameStarted: boolean;
  theme: string;
  difficulty: Difficulty;
}

export interface GeminiMoveResponse {
  index: number;
  reasoning: string;
}
