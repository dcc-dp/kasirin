"use client";

import React, { useState, useTransition } from "react";
import { formatRupiah } from "@/lib/financial";
import { maskPhoneNumber } from "@/lib/privacy";
import type {
  TransactionListItem,
  TransactionKPIs,
  TransactionDetailData,
  ReturnHistoryItem,
} from "@/actions/transaction";
import {
  getTransactions,
  getTransactionDetailById,
  getReturnHistory,
  getReceiptByInvoice,
  type ReceiptDetail,
} from "@/actions/transaction";

// Modals
import VoidModal from "@/components/transaction/VoidModal";
import ReturnModal from "@/components/transaction/ReturnModal";
import TransactionDetailModal from "@/components/transaction/TransactionDetailModal";
import ReceiptModal from "@/components/pos/ReceiptModal";

// Icons
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Layers,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Store,
  Wallet,
  X,
} from "lucide-react";

interface TransactionAdminViewProps {
  initialTransactions: TransactionListItem[];
  initialKpis: TransactionKPIs;
  initialReturns: ReturnHistoryItem[];
  currentUserRole: string;
}

export default function TransactionAdminView({
  initialTransactions,
  initialKpis,
  initialReturns,
  currentUserRole,
}: TransactionAdminViewProps) {
  // State Data
  const [transactions, setTransactions] = useState<TransactionListItem[]>(
    initialTransactions
  );
  const [kpis, setKpis] = useState<TransactionKPIs>(initialKpis);
  const [returns, setReturns] = useState<ReturnHistoryItem[]>(initialReturns);

  // Filter State
  const [activeTab, setActiveTab] = useState<
    "all" | "paid" | "cancelled" | "returns"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPending, startTransition] = useTransition();

  // State Modals
  const [selectedTxDetail, setSelectedTxDetail] =
    useState<TransactionDetailData | null>(null);
  const [isDetailModal, setIsDetailModal] = useState(false);

  const [txToVoid, setTxToVoid] = useState<{
    id: number;
    invoice_number: string;
    grand_total: number;
    user_name: string;
    payment_method: string;
  } | null>(null);
  const [isVoidModal, setIsVoidModal] = useState(false);

  const [txToReturn, setTxToReturn] = useState<TransactionDetailData | null>(
    null
  );
  const [isReturnModal, setIsReturnModal] = useState(false);

  const [receiptData, setReceiptData] = useState<ReceiptDetail | null>(null);
  const [isReceiptModal, setIsReceiptModal] = useState(false);

  // Reload data
  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const [txRes, retRes] = await Promise.all([
          getTransactions({
            status: activeTab === "returns" ? "all" : activeTab,
            search: searchQuery,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }),
          getReturnHistory(searchQuery),
        ]);

        setTransactions(txRes.list);
        setKpis(txRes.kpis);
        setReturns(retRes);
      } catch (err) {
        console.error("Refresh error:", err);
      }
    });
  };

  // Open Detail
  const handleOpenDetail = async (id: number) => {
    try {
      const res = await getTransactionDetailById(id);
      if (res) {
        setSelectedTxDetail(res);
        setIsDetailModal(true);
      }
    } catch (err) {
      console.error("Fetch detail error:", err);
    }
  };

  // Open Void
  const handleOpenVoid = (tx: TransactionListItem) => {
    setTxToVoid({
      id: tx.id,
      invoice_number: tx.invoice_number,
      grand_total: tx.grand_total,
      user_name: tx.user_name,
      payment_method: tx.payment_method,
    });
    setIsVoidModal(true);
  };

  // Open Return
  const handleOpenReturn = async (id: number) => {
    try {
      const res = await getTransactionDetailById(id);
      if (res) {
        setTxToReturn(res);
        setIsReturnModal(true);
      }
    } catch (err) {
      console.error("Fetch return error:", err);
    }
  };

  // Print Receipt
  const handlePrintReceipt = async (invoiceNumber: string) => {
    try {
      const receipt = await getReceiptByInvoice(invoiceNumber);
      if (receipt) {
        setReceiptData(receipt);
        setIsReceiptModal(true);
      }
    } catch (err) {
      console.error("Fetch receipt error:", err);
    }
  };

  // Filtered List
  const filteredList =
    activeTab === "returns"
      ? []
      : transactions.filter((tx) => {
          if (activeTab === "paid") return tx.status === "paid";
          if (activeTab === "cancelled") return tx.status === "cancelled";
          return true;
        });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Riwayat Transaksi Penjualan
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Audit faktur POS, prosedur pembatalan (Void) dengan otorisasi supervisor, dan retur/refund barang
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/80 shadow-2xs transition disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-500 ${isPending ? "animate-spin" : ""}`}
          />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 4 Kartu KPI Transaksi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Transaksi */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Transaksi
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {kpis.total_transactions}
            </span>
            <span className="text-xs text-gray-500">Faktur Terbit</span>
          </div>
        </div>

        {/* KPI 2: Omzet Penjualan Bersih */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Omzet Penjualan Bersih
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {formatRupiah(kpis.total_revenue)}
            </span>
          </div>
        </div>

        {/* KPI 3: Transaksi Batal / Void */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Transaksi Batal (Void)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-600 dark:text-red-400">
              {kpis.total_void}
            </span>
            <span className="text-xs text-gray-500">Faktur Dibatalkan</span>
          </div>
        </div>

        {/* KPI 4: Nilai Retur / Refund */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Retur & Refund
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">
              {formatRupiah(kpis.total_returns)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Filter Toolbar */}
      <div className="rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 px-5 dark:border-gray-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 py-4 px-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "all"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Semua Transaksi ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paid")}
            className={`flex items-center gap-2 py-4 px-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "paid"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Sukses / Paid ({transactions.filter((t) => t.status === "paid").length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`flex items-center gap-2 py-4 px-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "cancelled"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Ban className="h-4 w-4" />
            <span>
              Dibatalkan / Void ({transactions.filter((t) => t.status === "cancelled").length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("returns")}
            className={`flex items-center gap-2 py-4 px-3 border-b-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "returns"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Riwayat Retur Barang ({returns.length})</span>
          </button>
        </div>

        {/* Toolbar Pencarian & Filter */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRefresh()}
              placeholder="Cari nomor invoice, kasir, atau pelanggan..."
              className="w-full rounded-xl border border-gray-300 bg-transparent pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-[11px]">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-gray-300 bg-transparent px-2.5 py-1.5 text-xs text-gray-800 focus:border-brand-500 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-[11px]">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-gray-300 bg-transparent px-2.5 py-1.5 text-xs text-gray-800 focus:border-brand-500 dark:border-gray-700 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600 transition"
            >
              Filter
            </button>
            {(startDate || endDate || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSearchQuery("");
                }}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600"
                title="Reset Filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabel Konten */}
        {activeTab === "returns" ? (
          /* TABEL RIWAYAT RETUR BARANG */
          <div className="overflow-x-auto">
            {returns.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Belum ada riwayat pengembalian barang (retur).
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">No. Retur</th>
                    <th className="px-4 py-3">Faktur Asal</th>
                    <th className="px-4 py-3">Waktu Retur</th>
                    <th className="px-4 py-3">Petugas</th>
                    <th className="px-4 py-3">Barang Diretur</th>
                    <th className="px-4 py-3 text-right">Nilai Refund</th>
                    <th className="px-4 py-3 text-center">Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {returns.map((ret) => (
                    <tr
                      key={ret.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition"
                    >
                      <td className="px-5 py-3.5 font-bold font-mono text-orange-600 dark:text-orange-400">
                        {ret.return_number}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-gray-700 dark:text-gray-300">
                        {ret.invoice_number}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {new Date(ret.created_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                        {ret.user_name}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          {ret.items.map((it, idx) => (
                            <p key={idx} className="text-[11px] text-gray-700 dark:text-gray-300">
                              • {it.name} (x{it.quantity}) -{" "}
                              <span
                                className={
                                  it.condition === "good"
                                    ? "text-emerald-600 font-semibold"
                                    : "text-red-600 font-semibold"
                                }
                              >
                                {it.condition === "good" ? "Layak Jual" : "Rusak"}
                              </span>
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-orange-600 dark:text-orange-400 font-mono">
                        {formatRupiah(ret.total_refund)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {ret.refund_method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* TABEL TRANSAKSI PENJUALAN */
          <div className="overflow-x-auto">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Tidak ada data transaksi yang sesuai filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">No. Faktur</th>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Kasir</th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3 text-right">Total Belanja</th>
                    <th className="px-4 py-3 text-center">Metode</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredList.map((tx) => {
                    const isPaid = tx.status === "paid";
                    const isCancelled = tx.status === "cancelled";

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition"
                      >
                        {/* Invoice & Items */}
                        <td className="px-5 py-3.5">
                          <p className="font-mono font-bold text-gray-900 dark:text-white">
                            {tx.invoice_number}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {tx.item_count} Jenis Barang
                          </p>
                        </td>

                        {/* Waktu */}
                        <td className="px-4 py-3.5 text-gray-500">
                          <p>
                            {new Date(tx.transaction_date).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "short" }
                            )}
                          </p>
                          <p className="text-[10px] font-mono">
                            {new Date(tx.transaction_date).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </td>

                        {/* Kasir */}
                        <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                          {tx.user_name}
                        </td>

                        {/* Pelanggan */}
                        <td className="px-4 py-3.5">
                          {tx.member_name ? (
                            <div>
                              <p className="font-bold text-gray-800 dark:text-gray-200">
                                {tx.member_name}
                              </p>
                              {tx.member_phone && (
                                <p className="text-[10px] text-gray-400">
                                  {maskPhoneNumber(tx.member_phone)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px]">
                              Guest (Umum)
                            </span>
                          )}
                        </td>

                        {/* Total Belanja */}
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                          <p>{formatRupiah(tx.grand_total)}</p>
                          {tx.total_refunded > 0 && (
                            <p className="text-[10px] text-orange-600 dark:text-orange-400">
                              Retur: -{formatRupiah(tx.total_refunded)}
                            </p>
                          )}
                        </td>

                        {/* Metode Bayar */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {tx.payment_method}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            }`}
                          >
                            {isPaid ? "Sukses" : "Void"}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Detail */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(tx.id)}
                              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                              title="Lihat Detail Transaksi"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Tombol Cetak Struk */}
                            <button
                              type="button"
                              onClick={() => handlePrintReceipt(tx.invoice_number)}
                              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                              title="Cetak Struk Nota"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

                            {/* Tombol Retur Barang (jika paid) */}
                            {isPaid && (
                              <button
                                type="button"
                                onClick={() => handleOpenReturn(tx.id)}
                                className="p-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-950/40"
                                title="Retur Barang & Refund"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}

                            {/* Tombol Void (jika paid) */}
                            {isPaid && (
                              <button
                                type="button"
                                onClick={() => handleOpenVoid(tx)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                                title="Void Transaksi (Pembatalan)"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL-MODAL INTERAKTIF */}

      {/* Modal Detail Transaksi */}
      <TransactionDetailModal
        isOpen={isDetailModal}
        data={selectedTxDetail}
        onClose={() => setIsDetailModal(false)}
        onPrintReceipt={() => {
          if (selectedTxDetail) {
            handlePrintReceipt(selectedTxDetail.transaction.invoice_number);
          }
        }}
        onOpenVoid={() => {
          if (selectedTxDetail) {
            setIsDetailModal(false);
            setTxToVoid({
              id: selectedTxDetail.transaction.id,
              invoice_number: selectedTxDetail.transaction.invoice_number,
              grand_total: selectedTxDetail.transaction.grand_total,
              user_name: selectedTxDetail.transaction.user_name,
              payment_method: selectedTxDetail.transaction.payment_method,
            });
            setIsVoidModal(true);
          }
        }}
        onOpenReturn={() => {
          if (selectedTxDetail) {
            setIsDetailModal(false);
            setTxToReturn(selectedTxDetail);
            setIsReturnModal(true);
          }
        }}
      />

      {/* Modal Void Transaksi */}
      <VoidModal
        isOpen={isVoidModal}
        transaction={txToVoid}
        currentUserRole={currentUserRole}
        onClose={() => setIsVoidModal(false)}
        onSuccess={() => {
          setIsVoidModal(false);
          handleRefresh();
        }}
      />

      {/* Modal Retur Barang */}
      <ReturnModal
        isOpen={isReturnModal}
        transactionDetail={txToReturn}
        onClose={() => setIsReturnModal(false)}
        onSuccess={() => {
          setIsReturnModal(false);
          handleRefresh();
        }}
      />

      {/* Modal Cetak Struk */}
      <ReceiptModal
        isOpen={isReceiptModal}
        data={receiptData}
        onClose={() => setIsReceiptModal(false)}
        onNewTransaction={() => setIsReceiptModal(false)}
      />
    </div>
  );
}
