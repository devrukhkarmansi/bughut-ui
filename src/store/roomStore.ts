import { create } from "zustand";
import { socket } from "@/lib/socket";
import type {
  RoomCreatedResponse,
  RoomJoinedResponse,
  RoomUpdatedResponse,
  CardFlippedResponse,
  MatchResponse,
  NoMatchResponse,
  TurnChangedResponse,
  GameOverResponse,
  GameStartedResponse,
  GameErrorResponse,
} from "@/types/socket";
import type { GameState, Player } from "@/types/game";

interface RoomState {
  roomCode: string | null;
  isHost: boolean;
  players: Player[];
  status: "waiting" | "ready" | "playing";
  error: string | null;
  gameState: GameState | null;
  _isLeaving: boolean;
  _lastCreateTime: number;
  _turnTimer: NodeJS.Timeout | null;
  _flippedCardId: string | null;
  setRoomCode: (code: string) => void;
  setHost: (isHost: boolean) => void;
  setPlayers: (players: Player[]) => void;
  setStatus: (status: "waiting" | "ready" | "playing") => void;
  setError: (error: string | null) => void;
  setGameState: (gameState: GameState) => void;
  createRoom: (nickname: string) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  leaveRoom: () => void;
  flipCard: (cardId: string) => void;
  startGame: () => void;
  restoreRoomState: () => void;
}

// Set up socket event listeners
const setupSocketListeners = (
  set: (
    fn: Partial<RoomState> | ((state: RoomState) => Partial<RoomState>)
  ) => void
) => {
  // Room created event
  socket.on("room:created", (response: RoomCreatedResponse) => {
    console.log("=== Room Created Event ===");
    console.log("Full response:", response);
    console.log("Response data:", response.data);
    console.log("Host data:", response.data?.host);

    if (!response.data?.roomCode) {
      console.error("Invalid room creation response - missing roomCode");
      set({ error: "Invalid room creation response" });
      return;
    }

    // Create host player with default values if host data is missing
    const hostPlayer: Player = {
      id: response.data.host?.id || `host-${Date.now()}`,
      nickname: response.data.host?.nickname || "Host",
      score: 0,
      matchesFound: 0,
      isHost: true,
      isReady: false,
      joinedAt: Date.now(),
    };

    // Convert players object to array if it exists
    const playersArray = response.data.players
      ? Object.values(response.data.players).map(
          (socketPlayer: {
            id: string;
            nickname: string;
            isHost: boolean;
            isReady: boolean;
            joinedAt: number;
          }) => ({
            id: socketPlayer.id,
            nickname: socketPlayer.nickname,
            score: 0,
            matchesFound: 0,
            isHost: socketPlayer.isHost,
            isReady: socketPlayer.isReady,
            joinedAt: socketPlayer.joinedAt,
          })
        )
      : [hostPlayer];

    console.log("Setting state with:", {
      roomCode: response.data.roomCode,
      isHost: true,
      players: playersArray,
      status: "waiting",
    });

    // Update state in a single operation to ensure consistency
    set({
      roomCode: response.data.roomCode,
      isHost: true,
      players: playersArray,
      status: "waiting",
      error: null,
    });

    // Double check the state was updated correctly
    const afterState = useRoomStore.getState();
    console.log("=== State After Room Creation ===");
    console.log("Room Code:", afterState.roomCode);
    console.log("Is Host:", afterState.isHost);
    console.log("Players:", afterState.players);
    console.log("Status:", afterState.status);
  });

  // Room joined event
  socket.on("room:joined", (response: RoomJoinedResponse) => {
    console.log("=== Room Joined Event ===");
    console.log("Full response:", response);
    console.log("Response data:", response.data);
    console.log("Players object:", response.data?.players);

    if (!response.data?.roomCode) {
      console.error("Invalid room join response - missing roomCode");
      set({ error: "Invalid room join response" });
      return;
    }

    // Convert players object to array
    const playersArray = Object.values(response.data.players || {}).map(
      (socketPlayer: {
        id: string;
        nickname: string;
        isHost: boolean;
        isReady: boolean;
        joinedAt: number;
      }) => ({
        id: socketPlayer.id,
        nickname: socketPlayer.nickname,
        score: 0,
        matchesFound: 0,
        isHost: socketPlayer.isHost,
        isReady: socketPlayer.isReady,
        joinedAt: socketPlayer.joinedAt,
      })
    );

    console.log("Converted players array:", playersArray);

    set({
      roomCode: response.data.roomCode,
      isHost: false,
      players: playersArray,
      status: response.data.status || "waiting",
    });
  });

  // Room updated event
  socket.on("room:updated", (response: RoomUpdatedResponse) => {
    console.log("=== Room Updated Event ===");
    console.log("Full response:", response);
    console.log("Response data:", response.data);
    console.log("Players object:", response.data?.players);

    if (!response.data?.roomCode) {
      console.error("Invalid room update response - missing roomCode");
      set({ error: "Invalid room update response" });
      return;
    }

    // Convert players object to array
    const playersArray = Object.values(response.data.players || {}).map(
      (socketPlayer: {
        id: string;
        nickname: string;
        isHost: boolean;
        isReady: boolean;
        joinedAt: number;
      }) => ({
        id: socketPlayer.id,
        nickname: socketPlayer.nickname,
        score: 0,
        matchesFound: 0,
        isHost: socketPlayer.isHost,
        isReady: socketPlayer.isReady,
        joinedAt: socketPlayer.joinedAt,
      })
    );

    console.log("Updated players array:", playersArray);

    set({
      players: playersArray,
      status: response.data.status || "waiting",
    });
  });

  // Game started event
  socket.on("game:started", (response: GameStartedResponse) => {
    console.log("=== Game Started Event ===");
    console.log("Full response:", response);
    console.log("Game state:", response.data);
    console.log("Current store state:", useRoomStore.getState());

    if (!response.data?.gameId) {
      console.error("Invalid game start response - missing gameId");
      set({ error: "Invalid game start response" });
      return;
    }

    console.log("=== Updating Game State ===");
    // Update game state for all players
    set((state) => {
      const newState = {
        status: "playing" as const,
        gameState: response.data,
        error: null,
        players: state.players.map((player) => ({
          ...player,
          score: 0,
          matchesFound: 0,
        })),
      };
      console.log("New state:", newState);
      return newState;
    });

    // Double check the state was updated
    const afterState = useRoomStore.getState();
    console.log("=== State After Update ===");
    console.log("Status:", afterState.status);
    console.log("Game State:", afterState.gameState);
    console.log("Players:", afterState.players);
  });

  // Card flipped event
  socket.on("game:cardFlipped", (response: CardFlippedResponse) => {
    console.log("=== Card Flipped Event ===");
    console.log("Full response:", response);
    console.log("Game state:", response.data.gameState);
    console.log("Card ID:", response.data.cardId);
    console.log("Player ID:", response.data.playerId);

    // Update the game state with the new state from the server
    set((state) => {
      if (!state.gameState) return state;

      // Update the specific card that was flipped
      const updatedCards = state.gameState.cards.map((card) => {
        if (card.id === response.data.cardId) {
          return {
            ...card,
            isFlipped: true,
            flippedBy: response.data.playerId,
          };
        }
        return card;
      });

      // Update player scores
      const updatedPlayers = state.players.map((player) => {
        const updatedPlayer = response.data.gameState.players[player.id];
        if (updatedPlayer) {
          return {
            ...player,
            score: updatedPlayer.score,
            matchesFound: updatedPlayer.matchesFound,
          };
        }
        return player;
      });

      return {
        gameState: {
          ...response.data.gameState,
          cards: updatedCards,
        },
        players: updatedPlayers,
      };
    });
  });

  // Match found event
  socket.on("game:match", (response: MatchResponse) => {
    console.log("=== Match Found Event ===");
    console.log("Full response:", response);
    console.log("Game state:", response.data.gameState);
    console.log("Player ID:", response.data.playerId);
    console.log("Matched cards:", response.data.matchedCards);
    console.log("Message:", response.data.message);

    // Update both game state and player scores
    set((state) => {
      // Update player scores
      const updatedPlayers = state.players.map((player) => {
        const updatedPlayer = response.data.gameState.players[player.id];
        if (updatedPlayer) {
          return {
            ...player,
            score: updatedPlayer.score,
            matchesFound: updatedPlayer.matchesFound,
          };
        }
        return player;
      });

      return {
        gameState: response.data.gameState,
        players: updatedPlayers,
      };
    });
  });

  // No match event
  socket.on("game:noMatch", (response: NoMatchResponse) => {
    console.log("=== No Match Event ===");
    console.log("Full response:", response);
    console.log("Game state:", response.data.gameState);
    console.log("Player ID:", response.data.playerId);
    console.log("Cards:", response.data.cards);
    console.log("Message:", response.data.message);

    // Update both game state and player scores
    set((state) => {
      // Update player scores
      const updatedPlayers = state.players.map((player) => {
        const updatedPlayer = response.data.gameState.players[player.id];
        if (updatedPlayer) {
          return {
            ...player,
            score: updatedPlayer.score,
            matchesFound: updatedPlayer.matchesFound,
          };
        }
        return player;
      });

      return {
        gameState: response.data.gameState,
        players: updatedPlayers,
      };
    });
  });

  // Turn changed event
  socket.on("game:turnChanged", (response: TurnChangedResponse) => {
    console.log("=== Turn Changed Event ===");
    console.log("Full response:", response);
    console.log("Game state:", response.data.gameState);
    console.log("Current player:", response.data.currentPlayer);
    console.log("Message:", response.data.message);
    console.log(
      "Cards state:",
      response.data.gameState.cards.map((card) => ({
        id: card.id,
        isFlipped: card.isFlipped,
        flippedBy: card.flippedBy,
      }))
    );

    // Update both game state and player scores
    set((state) => {
      // Update player scores
      const updatedPlayers = state.players.map((player) => {
        const updatedPlayer = response.data.gameState.players[player.id];
        if (updatedPlayer) {
          return {
            ...player,
            score: updatedPlayer.score,
            matchesFound: updatedPlayer.matchesFound,
          };
        }
        return player;
      });

      return {
        gameState: response.data.gameState,
        players: updatedPlayers,
      };
    });
  });

  // Game over event
  socket.on("game:over", (response: GameOverResponse) => {
    console.log("=== Game Over Event ===");
    console.log("Full response:", response);
    console.log("Game state:", response.data.gameState);
    console.log("Winners:", response.data.winners);
    console.log("Is tie:", response.data.isTie);
    console.log("Message:", response.data.message);

    // First update the game state with winner information
    set({
      gameState: {
        ...response.data.gameState,
        winners: response.data.winners,
        isTie: response.data.isTie,
        gameOverMessage: response.data.message,
      },
    });

    // After 5 seconds, reset the game state
    setTimeout(() => {
      // Reset store state
      set({
        gameState: null,
        status: "waiting",
        roomCode: null,
        isHost: false,
        players: [],
        error: null,
      });
    }, 5000);
  });

  // Player joined event
  socket.on("player:joined", (response) => {
    console.log("=== Player Joined Event ===");
    console.log("Full response:", response);
    console.log("Player data:", response.data);
    set((state: RoomState) => ({
      players: [
        ...state.players,
        {
          id: response.data.id,
          nickname: response.data.nickname,
          score: 0,
          matchesFound: 0,
          isHost: false,
          isReady: false,
          joinedAt: Date.now(),
        },
      ],
    }));
  });

  // Player left event
  socket.on("player:left", (response) => {
    console.log("=== Player Left Event ===");
    console.log("Full response:", response);
    console.log("Player ID:", response.data.id);
    set((state: RoomState) => ({
      players: state.players.filter((p) => p.id !== response.data.id),
    }));
  });

  // Error event
  socket.on("error", (response) => {
    console.error("=== Socket Error Event ===");
    console.error("Error response:", response);
    set({ error: response.message });
  });

  // Connection event
  socket.on("connect", () => {
    console.log("=== Socket Connected ===");
    console.log("Socket ID:", socket.id);
  });

  // Disconnection event
  socket.on("disconnect", () => {
    console.log("=== Socket Disconnected ===");
    console.log("Socket ID:", socket.id);
    // Don't clear the state on disconnect
  });
};

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: null,
  isHost: false,
  players: [],
  status: "waiting",
  error: null,
  gameState: null,
  _isLeaving: false,
  _lastCreateTime: 0,
  _turnTimer: null,
  _flippedCardId: null,

  setRoomCode: (code) => set({ roomCode: code }),
  setHost: (isHost) => set({ isHost }),
  setPlayers: (players) =>
    set({ players: Array.isArray(players) ? players : [] }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setGameState: (gameState) => set({ gameState }),

  createRoom: (nickname) => {
    const now = Date.now();
    const state = useRoomStore.getState();

    if (state.roomCode || state.isHost) {
      console.log("=== Skipping Room Creation ===");
      console.log("Already in a room or creating one");
      return;
    }

    if (now - state._lastCreateTime < 2000) {
      console.log("=== Skipping Room Creation ===");
      console.log("Too soon after last creation");
      return;
    }

    console.log("=== Creating Room ===");
    console.log("Nickname:", nickname);
    console.log("Socket connected:", socket.connected);
    console.log("Socket ID:", socket.id);

    // Set initial state before emitting
    set({
      _lastCreateTime: now,
      isHost: true, // Set host flag immediately
      status: "waiting", // Ensure status is set
      error: null, // Clear any previous errors
    });

    // Function to emit room creation
    const emitRoomCreate = () => {
      console.log("=== Emitting Room Create ===");
      console.log("Socket connected:", socket.connected);
      console.log("Socket ID:", socket.id);

      // Remove any existing listeners to prevent duplicates
      socket.off("room:created");

      // Add a one-time listener for room:created
      socket.once("room:created", (response: RoomCreatedResponse) => {
        console.log("=== Room Created Response Received ===");
        console.log("Response:", response);

        if (!response.data?.roomCode) {
          console.error("Invalid room creation response - missing roomCode");
          set({ error: "Invalid room creation response" });
          return;
        }

        // Create host player with default values if host data is missing
        const hostPlayer: Player = {
          id: response.data.host?.id || `host-${Date.now()}`,
          nickname: response.data.host?.nickname || "Host",
          score: 0,
          matchesFound: 0,
          isHost: true,
          isReady: false,
          joinedAt: Date.now(),
        };

        // Convert players object to array if it exists
        const playersArray = response.data.players
          ? Object.values(response.data.players).map(
              (socketPlayer: {
                id: string;
                nickname: string;
                isHost: boolean;
                isReady: boolean;
                joinedAt: number;
              }) => ({
                id: socketPlayer.id,
                nickname: socketPlayer.nickname,
                score: 0,
                matchesFound: 0,
                isHost: socketPlayer.isHost,
                isReady: socketPlayer.isReady,
                joinedAt: socketPlayer.joinedAt,
              })
            )
          : [hostPlayer];

        console.log("Setting state with:", {
          roomCode: response.data.roomCode,
          isHost: true,
          players: playersArray,
          status: "waiting",
        });

        // Update state in a single operation to ensure consistency
        set({
          roomCode: response.data.roomCode,
          isHost: true,
          players: playersArray,
          status: "waiting",
          error: null,
        });

        // Double check the state was updated correctly
        const afterState = useRoomStore.getState();
        console.log("=== State After Room Creation ===");
        console.log("Room Code:", afterState.roomCode);
        console.log("Is Host:", afterState.isHost);
        console.log("Players:", afterState.players);
        console.log("Status:", afterState.status);
      });

      socket.emit("room:create", {
        event: "room:create",
        data: { nickname },
      });
    };

    // If socket is already connected, emit immediately
    if (socket.connected) {
      emitRoomCreate();
    } else {
      // If socket is not connected, wait for connection
      console.log("Socket not connected, waiting for connection...");
      socket.once("connect", () => {
        console.log("Socket connected, now emitting room create");
        emitRoomCreate();
      });

      // Attempt to connect
      socket.connect();
    }
  },

  joinRoom: (roomCode, nickname) => {
    console.log("=== Joining Room ===");
    console.log("Room Code:", roomCode);
    console.log("Nickname:", nickname);
    console.log("Socket connected:", socket.connected);
    console.log("Socket ID:", socket.id);

    // Set initial state before emitting
    set({
      roomCode, // Set room code immediately
      isHost: false, // Set host flag immediately
    });

    socket.emit("room:join", {
      event: "room:join",
      data: { roomCode, nickname },
    });
  },

  leaveRoom: () => {
    const state = useRoomStore.getState();

    if (state._isLeaving || (!state.roomCode && !state.isHost)) {
      console.log("=== Skipping Leave Room ===");
      console.log("Already leaving or no room to leave");
      return;
    }

    console.log("=== Leaving Room ===");
    console.log("Stack trace:", new Error().stack);
    console.log("Current room state:", {
      roomCode: state.roomCode,
      isHost: state.isHost,
      players: state.players,
    });

    set({ _isLeaving: true });

    // Reset all state to initial values
    set({
      roomCode: null,
      isHost: false,
      players: [],
      status: "waiting",
      error: null,
      gameState: null,
      _isLeaving: false,
      _lastCreateTime: 0, // Reset the last create time
    });

    // Disconnect and reconnect socket to ensure clean state
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  },

  // Add new method to restore room state
  restoreRoomState: () => {
    if (typeof window === "undefined") return;

    try {
      const storedState = sessionStorage.getItem("roomState");
      if (storedState) {
        const state = JSON.parse(storedState);
        console.log("=== Restoring Room State ===", state);

        // Only restore if the state is less than 5 minutes old
        if (Date.now() - state.timestamp < 5 * 60 * 1000) {
          if (state.isHost) {
            useRoomStore.getState().createRoom(state.nickname);
          } else if (state.roomCode) {
            useRoomStore.getState().joinRoom(state.roomCode, state.nickname);
          }
        } else {
          // Clear old state
          sessionStorage.removeItem("roomState");
        }
      }
    } catch (error) {
      console.error("Failed to restore room state:", error);
    }
  },

  startGame: () => {
    const state = useRoomStore.getState();

    console.log("=== Starting Game - Debug Info ===");
    console.log("Socket Status:", {
      id: socket.id,
      connected: socket.connected,
      disconnected: socket.disconnected,
    });
    console.log("Room State:", {
      roomCode: state.roomCode,
      isHost: state.isHost,
      players: state.players,
    });

    if (!socket.connected) {
      console.error("Socket is not connected! Attempting to reconnect...");
      socket.connect();
      set({ error: "Lost connection to server. Reconnecting..." });
      return;
    }

    if (!state.isHost || !state.roomCode) {
      console.log("=== Cannot Start Game ===");
      console.log("Not host or no room code");
      return;
    }

    try {
      console.log("=== Emitting room:startGame ===");
      console.log("Room Code:", state.roomCode);

      socket.emit("room:startGame", {
        event: "room:startGame",
        data: {
          roomCode: state.roomCode,
        },
      });
    } catch (error) {
      console.error("Error in startGame:", error);
      set({ error: "An error occurred while starting the game." });
    }
  },

  flipCard: (cardId: string) => {
    const state = useRoomStore.getState();
    if (!state.gameState?.gameId || !state.roomCode) {
      console.log("=== Cannot Flip Card ===");
      console.log("No active game or room code");
      console.log("Game State:", state.gameState);
      console.log("Room Code:", state.roomCode);
      return;
    }

    console.log("=== Flipping Card ===");
    console.log("Game ID:", state.gameState.gameId);
    console.log("Room Code:", state.roomCode);
    console.log("Card ID:", cardId);
    console.log("Socket Status:", {
      id: socket.id,
      connected: socket.connected,
      disconnected: socket.disconnected,
    });

    // If this is the first card being flipped
    if (!state._flippedCardId) {
      console.log("=== First card of turn ===");
      set({
        _flippedCardId: cardId,
      });
    }

    // Remove any existing one-time listeners to prevent duplicates
    socket.off("game:cardFlipped");
    socket.off("game:error");

    // Add one-time listener for the response
    socket.once("game:cardFlipped", (response: CardFlippedResponse) => {
      // Update the game state with the new state from the server
      set((state) => {
        if (!state.gameState) return state;

        // Update the specific card that was flipped
        const updatedCards = state.gameState.cards.map((card) => {
          if (card.id === response.data.cardId) {
            return {
              ...card,
              isFlipped: true,
              flippedBy: response.data.playerId,
            };
          }
          return card;
        });

        // Update player scores and turn time
        const updatedPlayers = state.players.map((player) => {
          const updatedPlayer = response.data.gameState.players[player.id];
          if (updatedPlayer) {
            return {
              ...player,
              score: updatedPlayer.score,
              matchesFound: updatedPlayer.matchesFound,
            };
          }
          return player;
        });

        return {
          gameState: {
            ...response.data.gameState,
            cards: updatedCards,
            turnTimeLeft: response.data.timeLeft,
          },
          players: updatedPlayers,
        };
      });
    });

    // Add one-time listener for errors
    socket.once("game:error", (response: GameErrorResponse) => {
      console.error("=== Card Flip Error ===");
      console.error("Error response:", response);
      set({ error: response.data.message });
    });

    // Emit the flip card event
    socket.emit("game:flipCard", {
      event: "game:flipCard",
      data: {
        gameId: state.gameState.gameId,
        roomCode: state.roomCode,
        cardId,
      },
    });

    // Log that the event was emitted
    console.log("=== Flip Card Event Emitted ===");
  },
}));

// Set up socket listeners when the store is created
console.log("=== Setting up Room Store Socket Listeners ===");
setupSocketListeners(useRoomStore.setState);
