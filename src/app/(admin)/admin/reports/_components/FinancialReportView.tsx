"use client";

import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { formatRupiah } from "@/lib/financial";
import { exportToExcel, exportToCsv } from "@/lib/export";
import type { FinancialReportData, ExportTransactionRow } from "@/actions/report";
import { getFinancialReport, getExportReportData } from "@/actions/report";
import PrintReportModal from "@/components/report/PrintReportModal";

// ApexCharts Dynamic Import (Zero SSR Error)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Icons
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LineChart,
  Package,
  PieChart,
  Printer,
  RefreshCw,
  RotateCcw,
  Store,
  Tag,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";

interface FinancialReportViewProps {
  initialData: FinancialReportData;
}

export default function FinancialReportView({
  initialData,
}: FinancialReportViewProps) {
  const [reportData, setReportData] = useState<FinancialReportData>(initialData);
  const [period, setPeriod] = useState<
    "today" | "week" | "month" | "year" | "custom"
  >("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isPending, startTransition] = useTransition();

  // Export State
  const [exporting, setExporting] = useState<boolean>(false);
  const [isPrintModal, setIsPrintModal] = useState<boolean>(false);

  const { summary, paymentBreakdown, dailyTrends, topProducts, cashierPerformance, dateRange } =
    reportData;

  // Handle Perubahan Periode
  const handleApplyFilter = (nextPeriod: typeof period) => {
    setPeriod(nextPeriod);
    startTransition(async () => {
      try {
        const updated = await getFinancialReport({
          period: nextPeriod,
          startDate: nextPeriod === "custom" ? customStart : undefined,
          endDate: nextPeriod === "custom" ? customEnd : undefined,
        });
        setReportData(updated);
      } catch (err) {
        console.error("Filter error:", err);
      }
    });
  };

  // Ekspor Excel .xlsx
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const rows = await getExportReportData({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (!rows || rows.length === 0) {
        alert("Tidak ada data transaksi pada periode ini untuk diekspor.");
        return;
      }

      exportToExcel(
        `Laporan_Keuangan_Kasirin_${dateRange.start}_sd_${dateRange.end}`,
        "Transaksi Penjualan",
        rows
      );
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Terjadi kesalahan saat mengekspor data Excel.");
    } finally {
      setExporting(false);
    }
  };

  // Ekspor CSV
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const rows = await getExportReportData({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (!rows || rows.length === 0) {
        alert("Tidak ada data transaksi pada periode ini untuk diekspor.");
        return;
      }

      exportToCsv(
        `Laporan_Keuangan_Kasirin_${dateRange.start}_sd_${dateRange.end}.csv`,
        rows
      );
    } catch (err) {
      console.error("CSV export error:", err);
      alert("Terjadi kesalahan saat mengekspor data CSV.");
    } finally {
      setExporting(false);
    }
  };

  // ApexCharts Data Format
  const chartCategories = dailyTrends.map((d) => {
    const parts = d.date.split("-");
    return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : d.date;
  });

  const chartSeries = [
    {
      name: "Omzet Bersih",
      data: dailyTrends.map((d) => d.revenue),
    },
    {
      name: "Laba Kotor",
      data: dailyTrends.map((d) => d.profit),
    },
    {
      name: "HPP (Modal)",
      data: dailyTrends.map((d) => d.cogs),
    },
  ];

  const chartOptions: any = {
    chart: {
      type: "area",
      height: 310,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
    },
    colors: ["#3b82f6", "#10b981", "#f59e0b"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    xaxis: {
      categories: chartCategories,
      labels: {
        style: { colors: "#6b7280", fontSize: "11px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
          return val;
        },
        style: { colors: "#6b7280", fontSize: "11px" },
      },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val: number) => formatRupiah(val),
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 95, 100],
      },
    },
    grid: {
      borderColor: "#f3f4f6",
      strokeDashArray: 4,
    },
  };

  return (
    <div className="space-y-6">
      {/* ===================== TOP HEADER & TOOLBAR ===================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Laporan Keuangan & Analisis Laba Rugi
            </h2>
            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              Periode: {dateRange.periodLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Rekapitulasi omzet penjualan, laba kotor, HPP, beban pembelian, dan rekonsiliasi kas register
          </p>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 px-3.5 py-2 transition disabled:opacity-50"
            title="Download Format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Download CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 px-3 py-2 transition disabled:opacity-50"
            title="Download Format CSV Spreadsheet"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>

          {/* Cetak PDF */}
          <button
            type="button"
            onClick={() => setIsPrintModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2 shadow-sm shadow-brand-500/20 transition"
            title="Cetak Dokumen Akuntansi A4 / Simpan ke PDF"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* ===================== FILTER PRESET BAR ===================== */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          {(
            [
              { id: "today", label: "Hari Ini" },
              { id: "week", label: "Minggu Ini" },
              { id: "month", label: "Bulan Ini" },
              { id: "year", label: "Tahun Ini" },
              { id: "custom", label: "Kustom Tanggal" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyFilter(p.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl font-bold transition ${
                period === p.id
                  ? "bg-brand-500 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker jika period === 'custom' */}
        {period === "custom" && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-xl border border-gray-300 bg-transparent px-2.5 py-1.5 text-xs text-gray-800 dark:border-gray-700 dark:text-white"
            />
            <span className="text-gray-400">s/d</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-xl border border-gray-300 bg-transparent px-2.5 py-1.5 text-xs text-gray-800 dark:border-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => handleApplyFilter("custom")}
              className="px-3 py-1.5 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600"
            >
              Terapkan
            </button>
          </div>
        )}
      </div>

      {/* ===================== 6 KARTU KPI FINANSIAL ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Omzet Bersih */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Omzet Bersih</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              {formatRupiah(summary.net_sales)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Kotor: {formatRupiah(summary.gross_sales)}
            </p>
          </div>
        </div>

        {/* KPI 2: HPP (Modal Barang) */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>HPP / Modal Terjual</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              {formatRupiah(summary.cogs)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Cost of Goods Sold
            </p>
          </div>
        </div>

        {/* KPI 3: Laba Kotor Toko */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs dark:border-emerald-900/60 dark:bg-emerald-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            <span>Laba Kotor (Gross)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-100 tracking-tight">
              {formatRupiah(summary.gross_profit)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              <span>Margin: {summary.profit_margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Beban Restock Pembelian */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Beban Restock</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              {formatRupiah(summary.restock_expenses)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Belanja Faktur Supplier
            </p>
          </div>
        </div>

        {/* KPI 5: Net Selisih Kasir */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Selisih Kas Laci</span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                summary.cash_difference < 0
                  ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  : summary.cash_difference > 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3
              className={`text-lg font-black tracking-tight ${
                summary.cash_difference < 0
                  ? "text-red-600"
                  : summary.cash_difference > 0
                  ? "text-emerald-600"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {summary.cash_difference > 0 ? "+" : ""}
              {formatRupiah(summary.cash_difference)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {summary.cash_difference === 0 ? "Klop / Seimbang" : "Selisih Rekonsiliasi"}
            </p>
          </div>
        </div>

        {/* KPI 6: Transaksi & Basket Size */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Rata-rata Belanja</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              {formatRupiah(summary.average_basket_size)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Dari {summary.transaction_count} Transaksi
            </p>
          </div>
        </div>
      </div>

      {/* ===================== GRAFIK TREN HARIAN (APEXCHARTS) ===================== */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Tren Omzet, HPP & Laba Kotor Toko
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Analisis fluktuasi laba harian untuk memantau performa penjualan produk
            </p>
          </div>
        </div>

        {dailyTrends.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Tidak ada transaksi pada periode ini untuk ditampilkan di grafik.
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={310}
            />
          </div>
        )}
      </div>

      {/* ===================== DUA KOLOM: METODE BAYAR & TOP PRODUK ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kolom Kiri: Breakdown Metode Pembayaran */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Rincian Cara Bayar
              </h3>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {paymentBreakdown.map((pb, idx) => {
                const colorBg =
                  pb.method === "cash"
                    ? "bg-emerald-500"
                    : pb.method === "qris"
                    ? "bg-brand-500"
                    : "bg-purple-500";

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {pb.label}
                      </span>
                      <span className="font-mono font-extrabold text-gray-900 dark:text-white">
                        {formatRupiah(pb.total_amount)} ({pb.percentage}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colorBg} transition-all duration-500`}
                        style={{ width: `${pb.percentage}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-gray-400 text-right">
                      {pb.count} Transaksi
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Catatan Diskon & Refund */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Total Diskon Promo:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                -{formatRupiah(summary.total_discount)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Total Retur / Refund:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                -{formatRupiah(summary.total_refund)}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Top 10 Produk Terlaris */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Top Produk Penjualan Tertinggi
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                10 produk paling laris dan kontribusi laba kotor terhadap toko
              </p>
            </div>
            <Package className="h-5 w-5 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Belum ada produk yang terjual dalam periode ini.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Produk</th>
                    <th className="px-3 py-2.5">Kategori</th>
                    <th className="px-3 py-2.5 text-center">Terjual</th>
                    <th className="px-3.5 py-2.5 text-right">Omzet</th>
                    <th className="px-3.5 py-2.5 text-right">Laba Kotor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {topProducts.map((prod, idx) => (
                    <tr
                      key={prod.product_id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">
                        <span className="text-gray-400 font-mono mr-1.5">#{idx + 1}</span>
                        {prod.name}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">
                        {prod.category_name}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-gray-800 dark:text-gray-200">
                        {prod.quantity_sold} Unit
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                        {formatRupiah(prod.total_revenue)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(prod.total_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ===================== TABEL KINERJA KASIR ===================== */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Kinerja & Rekonsiliasi Kasir
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Audit transaksi yang dilayani dan riwayat selisih kas fisik per petugas
            </p>
          </div>
          <UserCheck className="h-5 w-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          {cashierPerformance.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Belum ada riwayat aktivitas kasir dalam periode ini.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Nama Kasir</th>
                  <th className="px-4 py-2.5 text-center">Shift Terbuka</th>
                  <th className="px-4 py-2.5 text-center">Transaksi Selesai</th>
                  <th className="px-4 py-2.5 text-right">Rata-rata / Nota</th>
                  <th className="px-4 py-2.5 text-right">Total Omzet Kasir</th>
                  <th className="px-4 py-2.5 text-right">Selisih Kas Laci</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {cashierPerformance.map((c) => (
                  <tr
                    key={c.user_id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {c.cashier_name}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {c.shifts_count} Kali
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-800 dark:text-gray-200">
                      {c.transaction_count} Faktur
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                      {formatRupiah(c.average_sale)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                      {formatRupiah(c.total_sales)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span
                        className={
                          c.net_difference < 0
                            ? "text-red-600 dark:text-red-400"
                            : c.net_difference > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-500"
                        }
                      >
                        {c.net_difference > 0 ? "+" : ""}
                        {formatRupiah(c.net_difference)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===================== MODAL PRATINJAU CETAK PDF A4 ===================== */}
      <PrintReportModal
        isOpen={isPrintModal}
        data={reportData}
        onClose={() => setIsPrintModal(false)}
      />
    </div>
  );
}
