export type CardType = "bug" | "solution";
export type CardDifficulty = "easy" | "medium" | "hard";
export type GameStatus = "waiting" | "playing" | "finished";

export interface Card {
  id: string;
  content: string;
  difficulty: "easy" | "medium" | "hard";
  isFlipped: boolean;
  isMatched: boolean;
  matchingCardId: string;
  position: number;
  type: CardType;
  flippedBy?: string;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  matchesFound: number;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}

export interface GameState {
  gameId: string;
  cards: Card[];
  currentPlayerId?: string;
  currentTurn: string;
  flippedCards: string[];
  matchedCards: string[];
  turnTimeLeft: number;
  status: "waiting" | "playing" | "finished";
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  winnerId?: string;
  players: Record<string, Player>;
  winners?: Array<{
    id: string;
    nickname: string;
    score: number;
  }>;
  isTie?: boolean;
  gameOverMessage?: string;
}

export interface GameConfig {
  numberOfPairs: number;
  turnTimeLimit: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}
