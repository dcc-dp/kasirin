"use client";

import React from "react";
import ProductNavTabs from "../_components/ProductNavTabs";
import StockLogsTab from "../_components/StockLogsTab";

export default function StockLogsPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10 space-y-6">
      <ProductNavTabs />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Audit Riwayat & Mutasi Stok
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Jejak rekaman keluar masuk barang (pembelian, transaksi POS, retur, dan penyesuaian opname).
          </p>
        </div>
      </div>

      <StockLogsTab />
    </div>
  );
}