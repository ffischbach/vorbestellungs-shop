import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import clubConfig from "@/club.config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Vorbestellungsshop',
  description: 'Online-Vorbestellungsshop für Vereinsveranstaltungen',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{
        ['--color-primary' as string]: clubConfig.primaryColor,
        ['--color-accent' as string]: clubConfig.accentColor,
      }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
