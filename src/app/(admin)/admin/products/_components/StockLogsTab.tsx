"use client";

import { useEffect, useState } from "react";

import { getStockLogs } from "@/actions/stock-log";

type StockLog = {
  id: number;
  product_id: number;

  product_name: string | null;
  barcode: string | null;

  type: "in" | "out" | "adjustment";

  quantity: number;

  stock_before: number;
  stock_after: number;

  reference_type: string | null;
  reference_id: number | null;

  description: string;

  user_id: number | null;

  created_at: Date | string;
  updated_at: Date | string;
};

export default function StockLogsTab() {
  const [logs, setLogs] = useState<StockLog[]>([]);

  const [loading, setLoading] = useState(true);

  // ==================================================
  // LOAD DATA
  // ==================================================

  const loadLogs = async () => {
    try {
      setLoading(true);

      const data = await getStockLogs();

      setLogs(data as StockLog[]);
    } catch (error) {
      console.error(
        "Load stock logs error:",
        error
      );

      alert(
        "Gagal mengambil riwayat stok."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadLogs();
  }, []);

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (
    date: Date | string
  ) => {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "-";
    }

    return value.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==================================================
  // FORMAT TYPE
  // ==================================================

  const getTypeLabel = (
    type: StockLog["type"]
  ) => {
    switch (type) {
      case "in":
        return "Stok Masuk";

      case "out":
        return "Stok Keluar";

      case "adjustment":
        return "Penyesuaian";

      default:
        return type;
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Riwayat Stok
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pantau seluruh perubahan stok produk.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          {loading
            ? "Memuat..."
            : "Refresh"}
        </button>

      </div>

      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

        <div className="max-w-full overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  #
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tanggal
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Produk
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tipe
                </th>

                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Jumlah
                </th>

                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sebelum
                </th>

                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sesudah
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Keterangan
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Memuat riwayat stok...
                  </td>
                </tr>

              ) : logs.length === 0 ? (

                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Belum ada riwayat perubahan stok.
                  </td>
                </tr>

              ) : (

                logs.map((log, index) => (

                  <tr
                    key={log.id}
                    className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                  >

                    {/* NO */}

                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {index + 1}
                    </td>

                    {/* DATE */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(
                        log.created_at
                      )}
                    </td>

                    {/* PRODUCT */}

                    <td className="px-6 py-4">

                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {log.product_name ||
                            "Produk tidak ditemukan"}
                        </p>

                        {log.barcode && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {log.barcode}
                          </p>
                        )}
                      </div>

                    </td>

                    {/* TYPE */}

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          log.type === "in"
                            ? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                            : log.type === "out"
                            ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400"
                        }`}
                      >
                        {getTypeLabel(
                          log.type
                        )}
                      </span>

                    </td>

                    {/* QUANTITY */}

                    <td className="px-6 py-4 text-right">

                      <span
                        className={`text-sm font-semibold ${
                          log.type === "in"
                            ? "text-green-600 dark:text-green-400"
                            : log.type === "out"
                            ? "text-red-600 dark:text-red-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {log.type === "in"
                          ? "+"
                          : log.type === "out"
                          ? "-"
                          : ""}
                        {log.quantity}
                      </span>

                    </td>

                    {/* BEFORE */}

                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                      {log.stock_before}
                    </td>

                    {/* AFTER */}

                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-800 dark:text-white">
                      {log.stock_after}
                    </td>

                    {/* DESCRIPTION */}

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {log.description}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}