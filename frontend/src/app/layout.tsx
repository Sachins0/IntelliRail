import type { Metadata } from "next";
import "../styles/globals.css"

export const metadata: Metadata = {
  title: "My App",
  description: "Next.js + TypeScript + Tailwind project",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}