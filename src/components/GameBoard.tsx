import { useRoomStore } from "@/store/roomStore";
import { Card } from "./Card";
import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import type { MatchResponse } from "@/types/socket";

export const GameBoard = () => {
  const gameState = useRoomStore((state) => state.gameState);
  const status = useRoomStore((state) => state.status);
  const [showGameOver, setShowGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Effect to handle timer and match events
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      console.log("Starting timer");
      setTimeLeft(30);

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            if (gameState?.gameId && gameState?.currentTurn) {
              socket.emit("game:turnTimeout", {
                event: "game:turnTimeout",
                data: {
                  gameId: gameState.gameId,
                  playerId: gameState.currentTurn,
                },
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    // Start timer on turn change if game is still active
    if (isMyTurn() && !gameState?.winners) {
      startTimer();
    }

    // Listen for match events
    const handleMatch = (response: MatchResponse) => {
      // Only reset timer if it's my turn, I found the match, and game isn't over
      if (
        isMyTurn() &&
        response.data.playerId === socket.id &&
        !gameState?.winners
      ) {
        console.log("Match found by me, resetting timer");
        if (timer) clearInterval(timer);
        startTimer();
      }
    };

    socket.on("game:match", handleMatch);

    // Clear timer if game ends
    if (gameState?.winners && timer) {
      console.log("Game over, stopping timer");
      clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
      socket.off("game:match", handleMatch);
    };
  }, [gameState?.currentTurn, gameState?.winners]);

  // Helper function to check if it's the current player's turn
  const isMyTurn = () => {
    if (!gameState) return false;
    const mySocketId = socket.id;
    const players = Object.values(gameState.players);
    const currentPlayerId = gameState.currentTurn || gameState.currentPlayerId;
    console.log("Turn check:", {
      currentPlayerId,
      mySocketId,
      players,
    });
    return currentPlayerId === mySocketId;
  };

  // Effect to handle game over state
  useEffect(() => {
    if (gameState?.winners) {
      setShowGameOver(true);
      const timer = setTimeout(() => {
        setShowGameOver(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.winners]);

  // If game hasn't started or gameState isn't loaded yet
  if (status !== "playing" || !gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="text-xl font-semibold mb-4 text-purple-400">
          Loading game...
        </div>
      </div>
    );
  }

  // Get players from gameState instead of store
  const players = Object.values(gameState.players);
  const currentPlayerId = gameState.currentTurn || gameState.currentPlayerId;
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  // Safely access arrays with default empty arrays
  const matchedCards = gameState.matchedCards || [];
  const flippedCards = gameState.flippedCards || [];

  // Helper function to format player name
  const formatPlayerName = (player: { id: string; nickname: string }) => {
    return `${player.nickname}${player.id === socket.id ? " (You)" : ""}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* Timer display */}
      {isMyTurn() && (
        <div className="fixed top-8 right-8 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-green-400/80">
              Time Left
            </div>
            <div
              className={`
                text-2xl font-bold min-w-[3ch] text-center
                ${
                  timeLeft <= 10
                    ? "text-red-400 animate-pulse"
                    : "text-green-400"
                }
                transition-colors duration-300
              `}
            >
              {timeLeft}s
            </div>
          </div>
        </div>
      )}

      {/* Game Over Toast */}
      {showGameOver && gameState.winners && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-purple-900 text-purple-100 px-6 py-4 rounded-lg shadow-lg shadow-purple-500/20 text-center min-w-[300px] border border-purple-500/30">
            <h3 className="text-xl font-bold mb-2 text-purple-300">
              {gameState.isTie ? "It's a Tie!" : "Game Over!"}
            </h3>
            <div className="text-lg">
              {gameState.isTie ? (
                <p>Multiple players tied for first place!</p>
              ) : (
                <p>
                  Winner: {formatPlayerName(gameState.winners[0])} with{" "}
                  {gameState.winners[0].score} points!
                </p>
              )}
            </div>
            {gameState.gameOverMessage && (
              <p className="mt-2 text-sm text-purple-300/90">
                {gameState.gameOverMessage}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-row gap-8 h-full">
        {/* Left Side - Player Scores */}
        <div className="w-1/4 flex flex-col gap-4 pt-[180px]">
          {/* Player Score Cards */}
          <div className="flex flex-col gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-lg shadow-lg ${
                  player.id === currentPlayerId
                    ? "bg-purple-900/40 border-2 border-purple-500/50 shadow-purple-500/20"
                    : "bg-gray-800/40 border border-gray-700"
                }`}
              >
                <div className="text-lg font-bold mb-1 text-purple-300">
                  {formatPlayerName(player)}
                </div>
                <div className="text-sm text-green-400">
                  Score: {player.score}
                </div>
                <div className="text-sm text-green-400">
                  Matches: {player.matchesFound}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Game Board */}
        <div className="w-3/4 flex flex-col items-center">
          {/* BUGHUNT Title */}
          <div className="mb-4">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
              BUGHUNT
            </h1>
          </div>

          {/* Turn Indicator and Timer */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-purple-400">
              {isMyTurn() ? (
                "Your Turn!"
              ) : (
                <>
                  Current Turn:{" "}
                  {formatPlayerName(
                    currentPlayer || { id: "", nickname: "Loading..." }
                  )}
                </>
              )}
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-4 gap-4 max-w-4xl">
            {gameState.cards.map((card) => (
              <Card
                key={card.id}
                id={card.id}
                text={card.content}
                isFlipped={card.isFlipped}
                isMatched={matchedCards.includes(card.id)}
                isDisabled={
                  !isMyTurn() ||
                  flippedCards.length >= 2 ||
                  card.isFlipped ||
                  matchedCards.includes(card.id)
                }
                playerId={card.flippedBy}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
