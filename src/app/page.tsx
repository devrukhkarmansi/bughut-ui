"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, ChangeEvent, useEffect } from "react";
import Link from "next/link";
import { useRoomStore } from "@/store/roomStore";

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const { leaveRoom } = useRoomStore();

  // Reset room state when home page loads
  useEffect(() => {
    console.log("=== Resetting Room State ===");
    leaveRoom();
  }, [leaveRoom]);

  const handleNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleRoomCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRoomCode(e.target.value.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-b from-gray-900 via-gray-900/95 to-purple-900/10 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent mb-2">
            Bug Hunt
          </h1>
          <p className="text-purple-300/70">
            A developer-themed memory card game
          </p>
        </div>

        {/* Nickname Input */}
        <div className="space-y-2">
          <label
            htmlFor="nickname"
            className="text-sm font-medium text-purple-400"
          >
            Your Nickname
          </label>
          <Input
            id="nickname"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={handleNicknameChange}
            className="mt-2 w-full bg-gray-800/50 border-purple-500/20 text-green-400 placeholder:text-purple-300/40 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href={`/waiting-room?nickname=${nickname}&isHost=true`}
            className="w-full"
          >
            <Button
              className="mb-4 w-full bg-purple-500 hover:bg-purple-600 text-white border-none"
              disabled={!nickname}
            >
              Create Room
            </Button>
          </Link>

          <div className="flex gap-2">
            <Input
              placeholder="Enter room code"
              value={roomCode}
              onChange={handleRoomCodeChange}
              className="flex-1 bg-gray-800/50 border-purple-500/20 text-green-400 placeholder:text-purple-300/40 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
            <Link
              href={`/waiting-room?nickname=${nickname}&roomCode=${roomCode}`}
            >
              <Button
                className="whitespace-nowrap bg-gray-800/50 border border-green-500/20 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                disabled={!nickname || !roomCode}
              >
                Join Room
              </Button>
            </Link>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
          <h2 className="text-lg font-semibold text-purple-400 mb-2">
            How to Play
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li className="text-green-400">Enter your nickname</li>
            <li className="text-purple-300/70">
              Create a room or join with a code
            </li>
            <li className="text-green-400">Wait for other players to join</li>
            <li className="text-purple-300/70">
              Match bug cards with their solutions
            </li>
            <li className="text-green-400">Score points for each match</li>
            <li className="text-purple-300/70">
              Win by finding the most matches!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
