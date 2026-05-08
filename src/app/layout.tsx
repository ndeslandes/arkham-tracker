import type { Metadata } from "next";
import { EB_Garamond, Special_Elite } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

const specialElite = Special_Elite({
  weight: "400",
  variable: "--font-special-elite",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arkham Horror Tracker",
  description: "Track your Arkham Horror: The Card Game collection and campaigns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body className="min-h-full font-serif bg-slate-950 text-slate-200">{children}</body>
    </html>
  );
}
