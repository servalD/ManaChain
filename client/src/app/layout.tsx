import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner";
import { Web3Provider } from "@/components/Web3Provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mana Chain - Community Engagement Platform",
  description: "Redefine the relationship between brands and communities. Create your community token, unite your audience, and generate revenue differently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased font-sans`}
      >
        <Web3Provider>
          {children}
          <SonnerToaster 
            position="top-right"
            richColors
            closeButton
          />
        </Web3Provider>
      </body>
    </html>
  );
}
