import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatBot Paludisme - AISM Thienaba",
  description: "Assistant IA pour la prévention du paludisme au Sénégal. Conseils sur les moustiquaires, la lutte anti-larvaire et les soins. Par Elhadji Diop, Fondateur AISM Thienaba.",
  keywords: ["Paludisme", "Sénégal", "AISM", "Thienaba", "Moustiquaire", "Prévention", "Santé", "Elhadji Diop"],
  authors: [{ name: "AISM Thienaba" }],
  icons: {
    icon: "/logo-aism.jpg",
  },
  openGraph: {
    title: "ChatBot Paludisme - AISM Thienaba",
    description: "Assistant IA pour la prévention du paludisme au Sénégal",
    url: "https://aismthienaba.org",
    siteName: "AISM Thienaba",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
