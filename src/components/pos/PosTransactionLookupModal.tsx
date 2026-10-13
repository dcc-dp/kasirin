"use client";

import React, { useState } from "react";
import { formatRupiah } from "@/lib/financial";
import {
  getTransactionDetailById,
  getTransactions,
  type TransactionDetailData,
  type TransactionListItem,
} from "@/actions/transaction";
import {
  AlertCircle,
  Ban,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Printer,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

interface PosTransactionLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReturn: (detail: TransactionDetailData) => void;
  onSelectVoid: (tx: TransactionListItem) => void;
  onPrintReceipt: (invoiceNumber: string) => void;
}

export default function PosTransactionLookupModal({
  isOpen,
  onClose,
  onSelectReturn,
  onSelectVoid,
  onPrintReceipt,
}: PosTransactionLookupModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TransactionListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setSearching(true);
      setHasSearched(true);
      const res = await getTransactions({ search: query.trim() });
      setResults(res.list.slice(0, 8)); // Ambil max 8 transaksi terkini
    } catch (err) {
      console.error("Search transactions error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handlePickReturn = async (txId: number) => {
    try {
      const detail = await getTransactionDetailById(txId);
      if (detail) {
        onSelectReturn(detail);
        onClose();
      }
    } catch (err) {
      console.error("Pick return error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Cari Transaksi / Retur Barang POS
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scan barcode struk atau ketik nomor invoice / nama pelanggan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik INV-... atau scan barcode pada struk belanja..."
              className="w-full rounded-xl border border-gray-300 bg-transparent pl-10 pr-24 py-2.5 text-xs text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white font-mono"
              autoFocus
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 disabled:opacity-50"
            >
              {searching ? "Mencari..." : "Cari Faktur"}
            </button>
          </form>
        </div>

        {/* Results List */}
        <div className="max-h-[50vh] overflow-y-auto p-5 space-y-2.5">
          {results.length > 0 ? (
            results.map((tx) => {
              const isPaid = tx.status === "paid";
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-400 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                        #{tx.invoice_number}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                        }`}
                      >
                        {isPaid ? "Paid" : "Void"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {new Date(tx.transaction_date).toLocaleString("id-ID")} • Kasir: {tx.user_name}
                      {tx.member_name && ` • Pelanggan: ${tx.member_name}`}
                    </p>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white mt-1">
                      {formatRupiah(tx.grand_total)}{" "}
                      <span className="text-[10px] text-gray-400 uppercase font-normal">
                        ({tx.payment_method})
                      </span>
                    </p>
                  </div>

                  {/* Actions for this transaction */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => onPrintReceipt(tx.invoice_number)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      title="Cetak Ulang Struk"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    {isPaid && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePickReturn(tx.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 text-xs font-bold hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Retur</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectVoid(tx);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 transition"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>Void</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : hasSearched ? (
            <div className="p-8 text-center text-xs text-gray-500">
              Tidak ditemukan faktur transaksi dengan nomor &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">
              Masukkan nomor invoice atau scan barcode struk pelanggan di atas
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
