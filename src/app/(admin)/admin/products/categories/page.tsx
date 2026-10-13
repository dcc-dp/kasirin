"use client";

import React from "react";
import ProductNavTabs from "../_components/ProductNavTabs";
import CategoriesTab from "../_components/CategoriesTab";

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10 space-y-6">
      <ProductNavTabs />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Manajemen Kategori Produk
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola pengelompokan barang untuk memudahkan pencarian di kasir dan laporan penjualan.
          </p>
        </div>
      </div>

      <CategoriesTab />
    </div>
  );
}