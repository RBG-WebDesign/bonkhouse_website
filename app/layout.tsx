import type { Metadata } from "next";
import { Bebas_Neue, Covered_By_Your_Grace, Special_Elite } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const hand = Covered_By_Your_Grace({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

const special = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-special",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sunday Afternoon Bonkhouse",
  description:
    "A Culver City film social club for intimate screenings, double features, photos, merch, and neighborhood movie people."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebas.variable} ${hand.variable} ${special.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
