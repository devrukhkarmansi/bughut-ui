"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoomStore } from "@/store/roomStore";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, Check, Loader2 } from "lucide-react";

// Declare global state
declare global {
  interface Window {
    __gameStarted?: boolean;
    __navigationAttempts?: number;
    __isNavigatingToGame?: boolean;
    __hasInitialized?: boolean;
    __lastVisibilityChange?: number;
  }
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") || "";
  const roomCode = searchParams.get("roomCode") || "";
  const isHost = searchParams.get("isHost") === "true";
  const cleanupRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const status = useRoomStore((state) => state.status);
  const players = useRoomStore((state) => state.players);
  const currentRoomCode = useRoomStore((state) => state.roomCode);
  const currentIsHost = useRoomStore((state) => state.isHost);
  const error = useRoomStore((state) => state.error);
  const startGame = useRoomStore((state) => state.startGame);
  const leaveRoom = useRoomStore((state) => state.leaveRoom);
  const createRoom = useRoomStore((state) => state.createRoom);
  const joinRoom = useRoomStore((state) => state.joinRoom);
  const restoreRoomState = useRoomStore((state) => state.restoreRoomState);

  // Initialize room when component mounts
  useEffect(() => {
    console.log("=== Initializing Room ===", {
      nickname,
      roomCode,
      isHost,
      currentRoomCode,
    });

    if (!nickname) {
      console.log("No nickname provided, redirecting to home");
      router.push("/");
      return;
    }

    if (isHost) {
      console.log("=== Creating Room ===", { nickname });
      createRoom(nickname);
    } else if (roomCode) {
      console.log("=== Joining Room ===", { roomCode, nickname });
      joinRoom(roomCode, nickname);
    }
  }, [
    nickname,
    roomCode,
    isHost,
    createRoom,
    joinRoom,
    router,
    currentRoomCode,
  ]);

  const handleCopyCode = async () => {
    if (currentRoomCode) {
      try {
        await navigator.clipboard.writeText(currentRoomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  // Handle initial room setup
  useEffect(() => {
    if (!nickname) {
      router.replace("/");
      return;
    }

    // Only initialize once
    if (!window.__hasInitialized) {
      console.log("=== Initializing Room ===", { nickname, roomCode, isHost });
      window.__hasInitialized = true;

      // Try to restore state first
      restoreRoomState();

      // If no state was restored, initialize based on URL parameters
      if (!currentRoomCode && !currentIsHost) {
        if (isHost) {
          console.log("=== Creating Room ===", { nickname });
          createRoom(nickname);
        } else if (roomCode) {
          console.log("=== Joining Room ===", { nickname, roomCode });
          joinRoom(roomCode, nickname);
        } else {
          router.replace("/");
        }
      }
    }

    // Set up cleanup handler
    const handleVisibilityChange = () => {
      const now = Date.now();
      const lastChange = window.__lastVisibilityChange || 0;

      // Debounce visibility changes (ignore if less than 1 second since last change)
      if (now - lastChange < 1000) {
        return;
      }

      window.__lastVisibilityChange = now;

      // Only trigger cleanup if:
      // 1. We're not already cleaning up
      // 2. We have valid room state
      // 3. We're not navigating to game
      // 4. Game hasn't started
      // 5. We're actually hiding the page (not just tab switching)
      if (
        document.visibilityState === "hidden" &&
        !cleanupRef.current &&
        (currentRoomCode || currentIsHost) &&
        !window.__isNavigatingToGame &&
        status !== "playing" &&
        document.hidden
      ) {
        console.log("=== Leaving Room - Visibility Change ===");
        leaveRoom();
      }
    };

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Skip cleanup if:
      // 1. We're in a Fast Refresh
      // 2. We're navigating to the game page
      // 3. The game has already started
      // 4. We've already cleaned up
      // 5. We don't have valid room state
      // 6. We're just switching tabs (not actually leaving)
      const isFastRefresh = window.location.href.includes("_next/static/");
      const isNavigatingToGame = window.__isNavigatingToGame;
      const isGameStarted = status === "playing";
      const hasValidRoomState = currentRoomCode || currentIsHost;
      const isJustTabSwitch = !document.hidden;

      if (
        isFastRefresh ||
        isNavigatingToGame ||
        isGameStarted ||
        cleanupRef.current ||
        !hasValidRoomState ||
        isJustTabSwitch
      ) {
        console.log("=== Skipping Leave Room ===", {
          reason: isFastRefresh
            ? "Fast Refresh"
            : isNavigatingToGame
            ? "Navigating to Game"
            : isGameStarted
            ? "Game Started"
            : cleanupRef.current
            ? "Already Cleaned Up"
            : !hasValidRoomState
            ? "No Valid Room State"
            : "Just Tab Switch",
        });
        return;
      }

      // Remove visibility change listener
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    nickname,
    roomCode,
    isHost,
    router,
    createRoom,
    joinRoom,
    leaveRoom,
    status,
    currentRoomCode,
    currentIsHost,
    restoreRoomState,
  ]);

  // Handle game start redirect
  useEffect(() => {
    if (status === "playing") {
      console.log("=== Game Started, Redirecting ===", {
        status,
        isHost: currentIsHost,
        roomCode: currentRoomCode,
        playersCount: players.length,
      });

      // Set flags to prevent room leave during navigation
      window.__isNavigatingToGame = true;
      cleanupRef.current = true;

      // Navigate to game page
      router.push("/game");
    }
  }, [status, router, currentIsHost, currentRoomCode, players]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("=== Room Error ===", error);
      const timer = setTimeout(() => {
        router.replace("/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, router]);

  const handleStartGame = () => {
    if (currentIsHost && players.length >= 2) {
      console.log("=== Host Starting Game ===");
      setIsStartingGame(true);
      startGame();
    }
  };

  // Reset loading state when game starts
  useEffect(() => {
    if (status === "playing") {
      setIsStartingGame(false);
    }
  }, [status]);

  const handleLeaveRoom = () => {
    window.__hasInitialized = false; // Reset initialization flag
    cleanupRef.current = true; // Set cleanup flag
    leaveRoom();
    router.replace("/");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 bg-gradient-to-b from-gray-900 via-gray-900/95 to-purple-900/10 flex flex-col items-center justify-center p-4">
        <div className="text-red-400 mb-4">{error}</div>
        <p className="text-purple-300/70">Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-b from-gray-900 via-gray-900/95 to-purple-900/10 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent mb-2">
            Waiting Room
          </h1>
          <p className="text-purple-300/70">
            {currentIsHost
              ? "Share the room code with your friends"
              : "Waiting for host to start the game"}
          </p>
        </div>

        {/* Room Code Display */}
        <div className="p-6 bg-gray-800/50 rounded-lg border border-purple-500/20 text-center">
          <p className="text-sm text-purple-300/70 mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-3xl font-mono font-bold text-green-400">
              {currentRoomCode}
            </p>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors group"
              title="Copy room code"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <ClipboardCopy className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Player List */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
          <h2 className="text-lg font-semibold text-purple-400 mb-2">
            Players
          </h2>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-purple-500/10"
              >
                <span className="text-green-400">{player.nickname}</span>
                {player.isHost && (
                  <span className="text-sm text-purple-400">(Host)</span>
                )}
              </div>
            ))}
            {players.length < 2 && (
              <div className="text-sm text-purple-300/70 text-center p-2">
                Waiting for players to join... ({players.length}/2)
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {currentIsHost ? (
            <Button
              className="w-full bg-purple-500 hover:bg-purple-600 text-white border-none"
              disabled={players.length < 2 || isStartingGame}
              onClick={handleStartGame}
            >
              {isStartingGame ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Game...
                </>
              ) : (
                "Start Game"
              )}
            </Button>
          ) : (
            <div className="text-center text-purple-300/70 p-4 bg-gray-800/50 rounded border border-purple-500/20">
              Waiting for host to start the game...
            </div>
          )}

          <Button
            variant="outline"
            className="w-full border-purple-500/20 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
            onClick={handleLeaveRoom}
            disabled={isStartingGame}
          >
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}
