"use client";

import React, { useState } from "react";
import { closeShift, type ActiveShiftData, type CloseShiftResult } from "@/actions/shift";
import { formatRupiah } from "@/lib/financial";
import {
  AlertTriangle,
  Banknote,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Receipt,
  Store,
  X,
} from "lucide-react";

interface CloseShiftModalProps {
  isOpen: boolean;
  shiftData: ActiveShiftData;
  onClose: () => void;
  onSuccess: (result: CloseShiftResult) => void;
}

export default function CloseShiftModal({
  isOpen,
  shiftData,
  onClose,
  onSuccess,
}: CloseShiftModalProps) {
  const [actualCash, setActualCash] = useState<number>(shiftData.expected_cash);
  const [notes, setNotes] = useState<string>("");
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Denominations count state
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
  });

  if (!isOpen) return null;

  const expectedCash = shiftData.expected_cash;
  const difference = actualCash - expectedCash;

  const handleDenominationChange = (val: number, count: number) => {
    const updated = { ...denominations, [val]: Math.max(0, count) };
    setDenominations(updated);

    const calculatedTotal = Object.entries(updated).reduce(
      (sum, [denom, cnt]) => sum + Number(denom) * cnt,
      0
    );
    setActualCash(calculatedTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (actualCash < 0) {
      setErrorMsg("Jumlah uang fisik aktual tidak boleh bernilai negatif.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await closeShift(shiftData.id, actualCash, notes);

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      if (res.data) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Close shift error:", err);
      setErrorMsg("Terjadi kegagalan saat menutup shift kasir.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-lg flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Tutup Shift & Rekonsiliasi Kasir
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hitung uang fisik di laci dan bandingkan dengan sistem (Z-Report)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* System Register Summary */}
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02] border border-gray-200/70 dark:border-gray-800 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Modal Kas Awal:</span>
              <strong className="text-gray-900 dark:text-white">
                {formatRupiah(shiftData.starting_cash)}
              </strong>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Penjualan Tunai ({shiftData.total_transactions} tx):</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                +{formatRupiah(shiftData.total_cash_sales)}
              </strong>
            </div>
            {shiftData.total_cash_in > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Kas Masuk (Petty Cash In):</span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  +{formatRupiah(shiftData.total_cash_in)}
                </strong>
              </div>
            )}
            {shiftData.total_cash_out > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Kas Keluar (Petty Cash Out):</span>
                <strong className="text-red-500">
                  -{formatRupiah(shiftData.total_cash_out)}
                </strong>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm font-bold text-gray-900 dark:text-white">
              <span>Uang Diharapkan di Laci:</span>
              <span className="text-brand-600 dark:text-brand-400">
                {formatRupiah(expectedCash)}
              </span>
            </div>
          </div>

          {/* Input Uang Fisik Aktual */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Uang Fisik Aktual di Laci Kasir *
              </label>
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Calculator className="h-3.5 w-3.5" />
                {showCalculator ? "Sembunyikan Hitung Pecahan" : "Hitung Pecahan Uang"}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={actualCash}
                onChange={(e) => setActualCash(Number(e.target.value))}
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 bg-transparent pl-11 pr-4 py-2.5 text-lg font-black text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Denomination Calculator Expandable */}
          {showCalculator && (
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.01] space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                Masukkan jumlah lembar / koin yang dihitung:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[100000, 50000, 20000, 10000, 5000, 2000, 1000, 500].map((denom) => (
                  <div key={denom} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">{denom >= 1000 ? `${denom / 1000}rb` : `${denom}`}</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[denom] || ""}
                      onChange={(e) => handleDenominationChange(denom, Number(e.target.value))}
                      placeholder="0"
                      className="w-16 rounded border border-gray-300 p-1 text-center font-bold outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Selisih Counter */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
              difference === 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                : difference > 0
                ? "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {difference === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="block text-[11px] uppercase tracking-wider opacity-75">
                  Status Rekonsiliasi Kas:
                </span>
                <span className="text-sm">
                  {difference === 0
                    ? "Kas Seimbang (Pas)"
                    : difference > 0
                    ? "Kas Surplus / Lebih"
                    : "Kas Kurang / Defisit"}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-[11px] opacity-75">Selisih:</span>
              <span className="text-base font-black">
                {difference === 0
                  ? "Rp 0"
                  : difference > 0
                  ? `+${formatRupiah(difference)}`
                  : `-${formatRupiah(Math.abs(difference))}`}
              </span>
            </div>
          </div>

          {/* Catatan / Alasan Selisih */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Catatan Penutupan / Alasan Selisih
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Uang receh 200 perak tertinggal di laci / aman seimbang"
              disabled={submitting}
              className="w-full resize-none rounded-xl border border-gray-300 bg-transparent px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-600/20"
            >
              {submitting ? "Menutup Register..." : "Finalisasi & Cetak Z-Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
