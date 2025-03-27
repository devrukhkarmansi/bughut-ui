"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/roomStore";
import { GameBoard } from "@/components/GameBoard";
import "@/styles/card.css";

export default function GamePage() {
  const router = useRouter();
  const status = useRoomStore((state) => state.status);
  const error = useRoomStore((state) => state.error);

  useEffect(() => {
    if (status === "waiting") {
      router.push("/");
    }
  }, [status, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (status !== "playing") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <GameBoard />
    </main>
  );
}
