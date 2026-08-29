"use client";

import React, { useEffect, useState } from "react";
import { History } from "lucide-react";

type StockLog = {
  id: number;
  product_id: number;
  product_name: string;
  type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  created_at: Date | string;
};

export default function StockLogsTab() {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);

      // Nanti diganti dengan Server Action getStockLogs()
      // const data = await getStockLogs();
      // setLogs(data);

      setLogs([]);
    } catch (error) {
      console.error("Gagal mengambil riwayat stok:", error);
    } finally {
      setLoading(false);
    }
  };

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
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300";
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-[#2E3A47] dark:!bg-[#24303F] sm:px-7.5 xl:pb-1">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
          <History size={20} />
          Riwayat Perubahan Stok
        </h4>
      </div>

      {/* TABLE */}
      <div className="flex flex-col overflow-x-auto">

        {/* HEADER TABEL */}
        <div className="min-w-[900px] grid grid-cols-7 rounded-sm bg-gray-2 dark:bg-[#313D4A] text-left text-black dark:text-white">

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Produk
            </h5>
          </div>

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Tipe
            </h5>
          </div>

          <div className="p-2.5 xl:p-5 text-center">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Jumlah
            </h5>
          </div>

          <div className="p-2.5 xl:p-5 text-center">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Stok Sebelum
            </h5>
          </div>

          <div className="p-2.5 xl:p-5 text-center">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Stok Sesudah
            </h5>
          </div>

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Tanggal
            </h5>
          </div>

          <div className="p-2.5 xl:p-5 text-center">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              ID
            </h5>
          </div>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="min-w-[900px] py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Memuat riwayat stok...
          </div>
        )}

        {/* DATA KOSONG */}
        {!loading && logs.length === 0 && (
          <div className="min-w-[900px] py-12 text-center">

            <History
              size={40}
              className="mx-auto mb-3 text-gray-400"
            />

            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Belum ada riwayat perubahan stok.
            </p>

            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Riwayat stok akan muncul ketika terjadi transaksi atau perubahan stok.
            </p>

          </div>
        )}

        {/* DATA */}
        {!loading &&
          logs.map((log, key) => (
            <div
              key={log.id}
              className={`min-w-[900px] grid grid-cols-7 ${
                key === logs.length - 1
                  ? ""
                  : "border-b border-stroke dark:border-[#2E3A47]"
              }`}
            >

              {/* PRODUK */}
              <div className="flex items-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white font-medium text-sm sm:text-base">
                  {log.product_name}
                </p>
              </div>

              {/* TIPE */}
              <div className="flex items-center p-2.5 xl:p-5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getTypeClass(
                    log.type
                  )}`}
                >
                  {getTypeLabel(log.type)}
                </span>
              </div>

              {/* JUMLAH */}
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="font-mono text-sm font-semibold text-black dark:text-white">
                  {log.quantity > 0 ? "+" : ""}
                  {log.quantity}
                </p>
              </div>

              {/* STOK SEBELUM */}
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {log.stock_before}
                </p>
              </div>

              {/* STOK SESUDAH */}
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="font-semibold text-black dark:text-white">
                  {log.stock_after}
                </p>
              </div>

              {/* TANGGAL */}
              <div className="flex items-center p-2.5 xl:p-5">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {formatDate(log.created_at)}
                </p>
              </div>

              {/* ID */}
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  #{log.id}
                </p>
              </div>

            </div>
          ))}
      </div>
    </div>
  );
}