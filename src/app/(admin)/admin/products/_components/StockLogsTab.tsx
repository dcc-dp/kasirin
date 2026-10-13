"use client";

import React, { useEffect, useState } from "react";
import { History, Filter, RefreshCw, Search } from "lucide-react";
import { getStockLogs } from "@/actions/product";

type StockLog = {
  id: number;
  product_id: number;
  product_name: string;
  type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_type?: string | null;
  description?: string | null;
  user_name?: string | null;
  created_at: Date | string;
};

export default function StockLogsTab() {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<StockLog[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getStockLogs();
      setLogs(data as StockLog[]);
      setFilteredLogs(data as StockLog[]);
    } catch (error) {
      console.error("Gagal mengambil riwayat stok:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = logs;
    if (selectedType !== "all") {
      result = result.filter((item) => item.type.toLowerCase() === selectedType.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.product_name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    setFilteredLogs(result);
  }, [selectedType, searchQuery, logs]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "in":
      case "masuk":
      case "purchase":
        return "Stok Masuk";

      case "out":
      case "keluar":
      case "sale":
        return "Stok Keluar";

      case "adjustment":
      case "penyesuaian":
        return "Penyesuaian";

      default:
        return type;
    }
  };

  const getTypeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case "in":
      case "masuk":
      case "purchase":
        return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";

      case "out":
      case "keluar":
      case "sale":
        return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";

      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      {/* HEADER & CONTROLS */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <History size={22} className="text-blue-600 dark:text-blue-400" />
            Riwayat Perubahan Stok
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Audit trail otomatis pergerakan stok masuk, keluar kasir, dan penyesuaian manual.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Muat Ulang
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedType("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedType === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Semua ({logs.length})
          </button>
          <button
            onClick={() => setSelectedType("in")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedType === "in"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Masuk ({logs.filter((l) => l.type.toLowerCase() === "in").length})
          </button>
          <button
            onClick={() => setSelectedType("out")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedType === "out"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Keluar ({logs.filter((l) => l.type.toLowerCase() === "out").length})
          </button>
          <button
            onClick={() => setSelectedType("adjustment")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedType === "adjustment"
                ? "bg-amber-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Penyesuaian ({logs.filter((l) => l.type.toLowerCase() === "adjustment").length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk / keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 dark:border-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3 text-center">Jumlah</th>
              <th className="px-4 py-3 text-center">Sebelum</th>
              <th className="px-4 py-3 text-center">Sesudah</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3 text-center">Petugas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-blue-600" />
                  Memuat riwayat stok...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <History size={40} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tidak ada riwayat perubahan stok yang cocok.
                  </p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-900 dark:text-white">{log.product_name}</p>
                    <p className="text-xs text-gray-500">ID #{log.product_id}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeClass(log.type)}`}>
                      {getTypeLabel(log.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-semibold text-gray-900 dark:text-white">
                    {log.type === "in" ? `+${log.quantity}` : log.type === "out" ? `-${log.quantity}` : log.quantity}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-300">
                    {log.stock_before}
                  </td>
                  <td className="px-4 py-3.5 text-center font-semibold text-gray-900 dark:text-white">
                    {log.stock_after}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {log.description || "-"}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-600 dark:text-gray-300">
                    {log.user_name || "Sistem"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}