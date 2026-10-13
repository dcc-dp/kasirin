import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kasirin POS • Mesin Kasir Digital",
  description: "Point of Sale (POS) modern, cepat, keyboard-first, terintegrasi manajemen shift kasir.",
};

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans select-none">
      {children}
    </div>
  );
}
