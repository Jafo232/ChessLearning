import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Knightfall | Chess Tactics Studio",
  description:
    "Learn to play and defend against chess tactics on an interactive three-dimensional board.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
