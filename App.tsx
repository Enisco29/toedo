
import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameState, Task, Difficulty } from './types';
import { geminiService } from './services/geminiService';

const WIN_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

const THEMES = [
  "General Fun", 
  "Software Engineering", 
  "Fitness & Health", 
  "Space & Science", 
  "Pop Culture", 
  "Hard Mode", 
  "Zen Master", 
  "Master Chef", 
  "History Buff", 
  "Nature Explorer", 
  "80s Nostalgia", 
  "Mystery & Noir",
  "Travel Guru",
  "Literary Legend"
];

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    tasks: {},
    isProcessing: false,
    gameStarted: false,
    theme: THEMES[0],
    difficulty: 'Medium'
  });

  const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>("");

  const checkWinner = (board: Player[]): Player | 'Draw' | null => {
    for (const [a, b, c] of WIN_COMBINATIONS) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== null)) return 'Draw';
    return null;
  };

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      tasks: {},
      isProcessing: false
    }));
    setAiReasoning("");
  };

  const handleCellClick = async (index: number) => {
    if (gameState.board[index] || gameState.winner || gameState.isProcessing || gameState.currentPlayer === 'O') return;

    setGameState(prev => ({ ...prev, isProcessing: true }));
    try {
      const taskDescription = await geminiService.generateTask(gameState.theme, index, gameState.difficulty);
      setGameState(prev => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [index]: { id: Date.now(), description: taskDescription, isCompleted: false, assignedTo: 'X' }
        },
        isProcessing: false
      }));
      setActiveTaskIndex(index);
    } catch (err) {
      console.error("Error generating task:", err);
      setGameState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const completeTask = (index: number) => {
    const newBoard = [...gameState.board];
    newBoard[index] = 'X';
    
    const winStatus = checkWinner(newBoard);
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: winStatus ? null : 'O' as any,
      winner: winStatus,
      tasks: {
        ...prev.tasks,
        [index]: { ...prev.tasks[index]!, isCompleted: true }
      }
    }));
    setActiveTaskIndex(null);
  };

  const triggerAiTurn = useCallback(async () => {
    if (gameState.winner || gameState.currentPlayer !== 'O') return;

    setGameState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const aiMove = await geminiService.getAiMove(gameState.board, gameState.theme);
      setAiReasoning(aiMove.reasoning);

      await new Promise(res => setTimeout(res, 1500));

      const newBoard = [...gameState.board];
      newBoard[aiMove.index] = 'O';
      const winStatus = checkWinner(newBoard);

      setGameState(prev => ({
        ...prev,
        board: newBoard,
        currentPlayer: winStatus ? null : 'X' as any,
        winner: winStatus,
        isProcessing: false
      }));
    } catch (err) {
      console.error("AI turn error:", err);
      setGameState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [gameState.board, gameState.winner, gameState.currentPlayer, gameState.theme]);

  useEffect(() => {
    if (gameState.currentPlayer === 'O' && !gameState.winner) {
      triggerAiTurn();
    }
  }, [gameState.currentPlayer, gameState.winner, triggerAiTurn]);

  const resetGame = () => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      tasks: {},
      isProcessing: false,
      gameStarted: false,
      theme: THEMES[0],
      difficulty: 'Medium'
    });
    setAiReasoning("");
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Hard': return 'text-rose-600 bg-rose-50 border-rose-100';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {!gameState.gameStarted ? (
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in">
          <div className="mb-6 flex justify-center">
             <div className="bg-indigo-100 p-4 rounded-full animate-bounce-slow">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
             </div>
          </div>
          <h1 className="text-4xl font-outfit font-extrabold mb-4 text-slate-800">Todo Tic-Tac-Toe</h1>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            The board is your to-do list. To claim a square, you must complete an AI-generated task.
          </p>
          
          <div className="space-y-6 mb-8 text-left">
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest px-1 mb-3">Select Vibe</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {THEMES.map(t => (
                  <button
                    key={t}
                    onClick={() => setGameState(prev => ({ ...prev, theme: t }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all truncate ${
                      gameState.theme === t 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105 z-10' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-xs">
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest px-1 mb-3">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setGameState(prev => ({ ...prev, difficulty: d }))}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      gameState.difficulty === d 
                      ? `${getDifficultyColor(d)} shadow-sm` 
                      : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={startGame}
            className="w-full sm:w-auto min-w-[200px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 rounded-2xl transition-all shadow-lg hover:shadow-indigo-300 transform hover:-translate-y-1"
          >
            Start Your Quest
          </button>
        </div>
      ) : (
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-outfit font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-indigo-600 rounded-full"></span>
                Game Status
              </h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl flex items-center justify-between ${gameState.currentPlayer === 'X' ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 opacity-60'}`}>
                  <span className="font-semibold text-slate-700">You (X)</span>
                  {gameState.currentPlayer === 'X' && <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full animate-pulse">Your Turn</span>}
                </div>
                <div className={`p-4 rounded-2xl flex items-center justify-between ${gameState.currentPlayer === 'O' ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50 opacity-60'}`}>
                  <span className="font-semibold text-slate-700">Gemini (O)</span>
                  {gameState.currentPlayer === 'O' && <span className="text-xs bg-rose-600 text-white px-2 py-1 rounded-full animate-pulse">Thinking...</span>}
                </div>
              </div>
            </div>

            {aiReasoning && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-slide-up">
                <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-2">Gemini's Strategy</h3>
                <p className="text-slate-600 italic text-sm leading-relaxed">"{aiReasoning}"</p>
              </div>
            )}

            <button 
              onClick={resetGame}
              className="w-full py-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl transition-colors"
            >
              Forfeit & Restart
            </button>
          </div>

          <div className="lg:col-span-8 flex flex-col items-center">
            {gameState.winner ? (
              <div className="mb-8 w-full bg-slate-900 text-white p-8 rounded-3xl text-center shadow-2xl animate-bounce-slow">
                <h2 className="text-4xl font-outfit font-extrabold mb-2">
                  {gameState.winner === 'Draw' ? "It's a Tie!" : `${gameState.winner === 'X' ? 'You' : 'Gemini'} Won!`}
                </h2>
                <p className="opacity-80 mb-6">Excellent performance on the todo board.</p>
                <button onClick={resetGame} className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors">Play Again</button>
              </div>
            ) : null}

            <div className="relative bg-white p-4 rounded-[2rem] shadow-2xl border-8 border-indigo-50">
              <div className="grid grid-cols-3 gap-3">
                {gameState.board.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    disabled={!!cell || gameState.winner !== null || gameState.isProcessing}
                    className={`w-20 h-20 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-4xl md:text-6xl font-black transition-all transform hover:scale-95 disabled:hover:scale-100 ${
                      !cell && !gameState.winner && !gameState.isProcessing ? 'hover:bg-indigo-50 cursor-pointer shadow-inner bg-slate-50' : ''
                    } ${cell === 'X' ? 'text-indigo-600 bg-indigo-50' : cell === 'O' ? 'text-rose-500 bg-rose-50' : 'text-slate-200'}`}
                  >
                    {cell}
                    {!cell && gameState.isProcessing && gameState.currentPlayer === 'X' && (
                       <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                       </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-widest bg-white py-3 px-6 rounded-full shadow-sm border border-slate-100">
              <span className="text-slate-400">Vibe: <span className="text-indigo-600">{gameState.theme}</span></span>
              <span className="hidden sm:inline text-slate-200">|</span>
              <span className="text-slate-400">Difficulty: <span className={gameState.difficulty === 'Easy' ? 'text-emerald-500' : gameState.difficulty === 'Medium' ? 'text-amber-500' : 'text-rose-500'}>{gameState.difficulty}</span></span>
            </div>
          </div>
        </div>
      )}

      {activeTaskIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className={`p-6 text-white text-center ${gameState.difficulty === 'Easy' ? 'bg-emerald-600' : gameState.difficulty === 'Medium' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 block">Quest For Square {activeTaskIndex + 1}</span>
              <div className="flex items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/20">{gameState.difficulty}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/20 truncate max-w-[120px]">{gameState.theme}</span>
              </div>
            </div>
            <div className="p-8">
              <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 shadow-inner">
                <p className="text-xl text-slate-800 font-medium text-center italic leading-relaxed">
                  "{gameState.tasks[activeTaskIndex]?.description}"
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => completeTask(activeTaskIndex)}
                  className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-lg ${
                    gameState.difficulty === 'Easy' ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200' : 
                    gameState.difficulty === 'Medium' ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200' : 
                    'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-200'
                  }`}
                >
                  Mark as Done
                </button>
                <button 
                  onClick={() => setActiveTaskIndex(null)}
                  className="w-full bg-white text-slate-400 font-semibold py-2 rounded-2xl hover:text-slate-600 transition-colors"
                >
                  I'm not ready yet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
