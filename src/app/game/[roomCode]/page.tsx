"use client";

import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function GamePage() {
  const params = useParams();
  const roomCode = params.roomCode as string;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Bug Hunt</h1>
            <p className="text-muted-foreground">Room: {roomCode}</p>
          </div>
          <Link href="/">
            <Button variant="outline">Leave Game</Button>
          </Link>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Placeholder for cards */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] bg-card rounded-lg border cursor-pointer hover:border-primary transition-colors"
            >
              {/* Card content will go here */}
            </div>
          ))}
        </div>

        {/* Player Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Player 1</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Matches</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Player 2</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Matches</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
