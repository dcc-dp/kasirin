"use client";

import React, { useState } from "react";
import { openShift } from "@/actions/shift";
import { formatRupiah } from "@/lib/financial";
import { Banknote, CheckCircle2, DollarSign, Sparkles, Store, X } from "lucide-react";

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (shiftId: number) => void;
}

export default function OpenShiftModal({
  isOpen,
  onClose,
  onSuccess,
}: OpenShiftModalProps) {
  const [startingCash, setStartingCash] = useState<number>(200000);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [100000, 150000, 200000, 300000, 500000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (startingCash < 0) {
      setErrorMsg("Modal kas awal tidak boleh bernilai negatif.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await openShift(startingCash, notes);

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      if (res.data?.shiftId) {
        onSuccess(res.data.shiftId);
      }
      onClose();
    } catch (err) {
      console.error("Open shift error:", err);
      setErrorMsg("Terjadi kegagalan jaringan saat membuka shift.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Buka Shift Kasir Baru
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Input modal uang kembalian di laci sebelum transaksi
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

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Modal Kas Awal di Laci (Starting Cash) *
            </label>

            {/* Presets Button */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStartingCash(val)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    startingCash === val
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {formatRupiah(val)}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={startingCash}
                onChange={(e) => setStartingCash(Number(e.target.value))}
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 bg-transparent pl-11 pr-4 py-2.5 text-base font-bold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
              />
            </div>
            <span className="mt-1 block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Terbaca: {formatRupiah(startingCash)}
            </span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Catatan Pembukaan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Shift Pagi / Uang kembalian pecahan 2.000 & 5.000"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
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
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              {submitting ? "Membuka Shift..." : "Buka Shift Sekarang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
