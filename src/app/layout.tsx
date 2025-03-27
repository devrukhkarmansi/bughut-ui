import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { initializeSocket } from "@/lib/socketInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bug Hunt",
  description: "A developer-themed memory card game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize socket connection
  if (typeof window !== "undefined") {
    initializeSocket();
  }

  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
