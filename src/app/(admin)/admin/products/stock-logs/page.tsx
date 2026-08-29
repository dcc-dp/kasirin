"use client";

import React from "react";
import StockLogsTab from "../_components/StockLogsTab";

export default function StockLogsPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10 space-y-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Riwayat Stok
        </h2>
      </div>

      <StockLogsTab />
    </div>
  );
}