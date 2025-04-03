import { GameState } from "./game";
import { Socket as SocketIOSocket } from "socket.io-client";

// Room Events
export interface RoomCreatePayload {
  event: "room:create";
  data: {
    nickname: string;
  };
}

export interface RoomCreatedResponse {
  event: "room:created";
  data: {
    roomCode: string;
    host: {
      id: string;
      nickname: string;
    };
    players: Record<
      string,
      {
        id: string;
        nickname: string;
        isHost: boolean;
        isReady: boolean;
        joinedAt: number;
      }
    >;
  };
}

export interface RoomJoinPayload {
  event: "room:join";
  data: {
    roomCode: string;
    nickname: string;
  };
}

export interface RoomJoinedResponse {
  event: "room:joined";
  data: {
    roomCode: string;
    players: Record<string, Player>;
    status: "waiting" | "ready" | "playing";
  };
}

export interface RoomUpdatedResponse {
  event: "room:updated";
  data: {
    roomCode: string;
    players: Record<string, Player>;
    status: "waiting" | "ready" | "playing";
    maxPlayers: number;
    currentPlayers: number;
  };
}

// Game Events
export interface GameStartPayload {
  event: "room:startGame";
  data: {
    roomCode: string;
  };
}

export interface GameStartedResponse {
  event: "game:started";
  data: GameState;
}

export interface CardFlipPayload {
  event: "game:flipCard";
  data: {
    gameId: string;
    roomCode: string;
    cardId: string;
  };
}

export interface CardFlippedResponse {
  event: "game:cardFlipped";
  data: {
    gameState: GameState;
    cardId: string;
    playerId: string;
    timeLeft: number;
  };
}

export interface MatchResponse {
  event: "game:match";
  data: {
    gameState: GameState;
    playerId: string;
    matchedCards: [string, string];
    message: string;
  };
}

export interface NoMatchResponse {
  event: "game:noMatch";
  data: {
    gameState: GameState;
    playerId: string;
    cards: [string, string];
    message: string;
  };
}

export interface TurnChangedResponse {
  event: "game:turnChanged";
  data: {
    gameState: GameState;
    currentPlayer: {
      id: string;
      nickname: string;
    };
    message: string;
  };
}

export interface GameOverResponse {
  event: "game:over";
  data: {
    gameState: GameState;
    winners: Array<{
      id: string;
      nickname: string;
      score: number;
    }>;
    isTie: boolean;
    message: string;
  };
}

// Error Events
export interface GameErrorResponse {
  event: "game:error";
  data: {
    message: string;
  };
}

export interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  isHost: boolean;
  joinedAt: number;
}

export interface RoomSettings {
  turnTimeLimit: number;
  allowSpectators: boolean;
  isPrivate: boolean;
}

export interface RoomData {
  roomCode: string;
  hostId: string;
  players: Record<string, Player>;
  status: "waiting" | "ready" | "playing";
  maxPlayers: number;
  createdAt: number;
  settings: RoomSettings;
}

// Add socket reserved events
export interface SocketReservedEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;
}

// Socket Event Maps
export interface ServerToClientEvents {
  "room:created": (response: RoomCreatedResponse) => void;
  "room:joined": (response: RoomJoinedResponse) => void;
  "room:updated": (response: RoomUpdatedResponse) => void;
  "game:started": (response: GameStartedResponse) => void;
  "game:cardFlipped": (response: CardFlippedResponse) => void;
  "game:match": (response: MatchResponse) => void;
  "game:noMatch": (response: NoMatchResponse) => void;
  "game:turnChanged": (response: TurnChangedResponse) => void;
  "game:over": (response: GameOverResponse) => void;
  "game:error": (response: GameErrorResponse) => void;
  "player:joined": (response: { data: Player }) => void;
  "player:left": (response: { data: { id: string } }) => void;
  error: (response: { message: string }) => void;
}

export interface ClientToServerEvents {
  "room:create": (data: RoomCreatePayload) => void;
  "room:join": (data: RoomJoinPayload) => void;
  "room:startGame": (data: GameStartPayload) => void;
  "game:flipCard": (data: CardFlipPayload) => void;
  "game:turnTimeout": (data: TurnTimeoutPayload) => void;
}

// Create a combined type for the socket
export type GameSocket = SocketIOSocket<
  ServerToClientEvents,
  ClientToServerEvents
> & {
  on: <T extends keyof (ServerToClientEvents & SocketReservedEvents)>(
    event: T,
    listener: (ServerToClientEvents & SocketReservedEvents)[T]
  ) => GameSocket;
};

// Add TurnTimeoutPayload type
export interface TurnTimeoutPayload {
  event: "game:turnTimeout";
  data: {
    gameId: string;
    playerId: string;
  };
}
