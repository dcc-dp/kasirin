"use client";

import { useEffect, useMemo, useState } from "react";
import { getShiftHistory, type ShiftHistoryItem, type CloseShiftResult } from "@/actions/shift";
import { formatRupiah } from "@/lib/financial";
import ZReportModal from "@/components/shift/ZReportModal";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Printer,
  Receipt,
  Search,
  Store,
  User,
  Users,
  X,
} from "lucide-react";

export default function ShiftsPage() {
  const [shiftsList, setShiftsList] = useState<ShiftHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "diff">("all");

  // Detail / Reprint Modal
  const [selectedZReport, setSelectedZReport] = useState<CloseShiftResult | null>(null);
  const [showZReportModal, setShowZReportModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getShiftHistory();
      setShiftsList(data);
    } catch (error) {
      console.error("Load shifts error:", error);
      alert("Gagal memuat data shift kasir.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredShifts = useMemo(() => {
    return shiftsList.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (s.user_name && s.user_name.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === "open") matchesStatus = s.status === "open";
      if (statusFilter === "closed") matchesStatus = s.status === "closed";
      if (statusFilter === "diff") matchesStatus = s.difference !== null && s.difference !== 0;

      return matchesSearch && matchesStatus;
    });
  }, [shiftsList, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalClosed = shiftsList.filter((s) => s.status === "closed").length;
    const currentlyOpen = shiftsList.filter((s) => s.status === "open").length;
    const netDifference = shiftsList.reduce((acc, s) => acc + (s.difference || 0), 0);
    const totalCashCollected = shiftsList.reduce(
      (acc, s) => acc + (s.actual_cash || s.starting_cash + s.total_cash_sales),
      0
    );

    return { totalClosed, currentlyOpen, netDifference, totalCashCollected };
  }, [shiftsList]);

  const handleOpenZReport = (shift: ShiftHistoryItem) => {
    const zData: CloseShiftResult = {
      shiftId: shift.id,
      userName: shift.user_name || "Kasir",
      startTime: shift.start_time,
      endTime: shift.end_time || new Date(),
      startingCash: shift.starting_cash,
      cashSales: shift.total_cash_sales,
      nonCashSales: shift.total_non_cash_sales,
      cashIn: 0,
      cashOut: 0,
      expectedCash: shift.expected_cash || shift.starting_cash + shift.total_cash_sales,
      actualCash: shift.actual_cash || 0,
      difference: shift.difference || 0,
      totalTransactions: 0,
    };
    setSelectedZReport(zData);
    setShowZReportModal(true);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Audit Riwayat Shift Kasir (Z-Report)
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pemantauan buka-tutup register kasir, modal awal, rekonsiliasi uang fisik di laci, dan pelacakan selisih kas.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Shift Aktif Saat Ini
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.currentlyOpen}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400">register sedang buka</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Shift Ditutup (Z-Report)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalClosed}
            </span>
            <span className="text-xs text-gray-500">kali rekonsiliasi</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Net Selisih Kasir
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                stats.netDifference === 0
                  ? "bg-emerald-50 text-emerald-600"
                  : stats.netDifference > 0
                  ? "bg-blue-50 text-blue-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {stats.netDifference === 0 ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold ${
                stats.netDifference === 0
                  ? "text-emerald-600"
                  : stats.netDifference > 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {stats.netDifference === 0
                ? "Pas (Rp 0)"
                : stats.netDifference > 0
                ? `+${formatRupiah(stats.netDifference)}`
                : `-${formatRupiah(Math.abs(stats.netDifference))}`}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Fisik Kas Terkumpul
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatRupiah(stats.totalCashCollected)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/60 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Semua ({shiftsList.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("open")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === "open"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-gray-700 dark:text-emerald-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Aktif ({stats.currentlyOpen})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("closed")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === "closed"
                ? "bg-white text-purple-700 shadow-xs dark:bg-gray-700 dark:text-purple-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Ditutup ({stats.totalClosed})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("diff")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === "diff"
                ? "bg-white text-red-700 shadow-xs dark:bg-gray-700 dark:text-red-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Ada Selisih
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kasir / catatan..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Shifts Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">Nama Kasir</th>
                <th className="px-5 py-3.5">Waktu Shift</th>
                <th className="px-5 py-3.5 text-right">Modal Awal</th>
                <th className="px-5 py-3.5 text-right">Penjualan Tunai</th>
                <th className="px-5 py-3.5 text-right">Non-Tunai</th>
                <th className="px-5 py-3.5 text-right">Uang Fisik Kasir</th>
                <th className="px-5 py-3.5 text-center">Selisih Kas</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4 text-center">
                      <div className="h-4 w-4 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-6 w-20 mx-auto rounded-full bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                  </tr>
                ))
              ) : filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Store className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Belum ada rekaman shift kasir.
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Shift akan tercatat otomatis saat kasir membuka laci di layar POS (/kasir).
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift, index) => {
                  const isOpen = shift.status === "open";
                  const diff = shift.difference ?? 0;

                  return (
                    <tr
                      key={shift.id}
                      className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.015]"
                    >
                      <td className="px-5 py-4 text-center text-xs font-medium text-gray-400">
                        {index + 1}
                      </td>

                      {/* Kasir */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                            {(shift.user_name || "K").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white block text-sm">
                              {shift.user_name || "Kasir"}
                            </span>
                            <span className="text-[10px] text-gray-400">Shift #{shift.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-300">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white block">
                            {new Date(shift.start_time).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {new Date(shift.start_time).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {shift.end_time ? (
                              new Date(shift.end_time).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            ) : (
                              <span className="text-emerald-600 font-semibold">Sedang Buka</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Modal Awal */}
                      <td className="px-5 py-4 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                        {formatRupiah(shift.starting_cash)}
                      </td>

                      {/* Penjualan Tunai */}
                      <td className="px-5 py-4 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatRupiah(shift.total_cash_sales)}
                      </td>

                      {/* Non-Tunai */}
                      <td className="px-5 py-4 text-right text-xs text-gray-600 dark:text-gray-400">
                        {formatRupiah(shift.total_non_cash_sales)}
                      </td>

                      {/* Uang Fisik Aktual */}
                      <td className="px-5 py-4 text-right text-sm font-black text-gray-900 dark:text-white">
                        {isOpen ? "-" : formatRupiah(shift.actual_cash || 0)}
                      </td>

                      {/* Selisih */}
                      <td className="px-5 py-4 text-center">
                        {isOpen ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            ● Shift Berjalan
                          </span>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              diff === 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                                : diff > 0
                                ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400"
                                : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
                            }`}
                          >
                            {diff === 0
                              ? "Pas"
                              : diff > 0
                              ? `+${formatRupiah(diff)}`
                              : `-${formatRupiah(Math.abs(diff))}`}
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right">
                        {!isOpen && (
                          <button
                            type="button"
                            onClick={() => handleOpenZReport(shift)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:border-gray-700 dark:text-purple-400 dark:hover:bg-purple-950/40"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Z-Report
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Z-Report Modal Preview */}
      <ZReportModal
        isOpen={showZReportModal}
        data={selectedZReport}
        onClose={() => {
          setShowZReportModal(false);
          setSelectedZReport(null);
        }}
      />
    </div>
  );
}
