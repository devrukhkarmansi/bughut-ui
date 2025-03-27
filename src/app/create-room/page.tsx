"use client";

import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useRoomStore } from "@/store/roomStore";
import { connectSocket } from "@/lib/socket";

export default function CreateRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nickname = searchParams.get("nickname") || "";
  const { roomCode, error, createRoom } = useRoomStore();

  useEffect(() => {
    if (!nickname) {
      router.push("/");
      return;
    }

    connectSocket();
    createRoom(nickname);

    // Redirect to waiting room after room creation
    if (roomCode) {
      router.push("/waiting-room");
    }
  }, [nickname, createRoom, router, roomCode]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  // Show loading state while creating room
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-xl mb-4">Creating room...</div>
    </div>
  );
}
