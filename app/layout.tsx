import type { Metadata } from "next";
import "./globals.css";

// NOTE: This sandbox's network is locked to an allowlist that doesn't include
// fonts.googleapis.com, so next/font/google can't fetch at build time here.
// On your machine (normal internet access) you can swap back to the real
// faces by replacing this block with:
//
//   import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
//   const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
//   const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
//   const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
//
// and using `${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`
// on the body className below instead of "font-fallback".

export const metadata: Metadata = {
  title: "Aegis — Air quality operations",
  description: "The operations copilot for air quality response.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-fallback antialiased bg-bg-0 text-text-primary">
        {children}
      </body>
    </html>
  );
}
