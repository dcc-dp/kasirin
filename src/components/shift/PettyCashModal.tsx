"use client";

import React, { useState } from "react";
import { recordCashMovement } from "@/actions/shift";
import { formatRupiah } from "@/lib/financial";
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, X } from "lucide-react";

interface PettyCashModalProps {
  isOpen: boolean;
  shiftId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PettyCashModal({
  isOpen,
  shiftId,
  onClose,
  onSuccess,
}: PettyCashModalProps) {
  const [type, setType] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState<number>(20000);
  const [reason, setReason] = useState<string>("Beli Plastik Kresek Toko");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickReasonsOut = [
    "Beli Plastik Kresek Toko",
    "Beli Air Galon Toko",
    "Kebutuhan Alat Kebersihan",
    "Uang Parkir / Ekspedisi",
    "Beban Operasional Kasir",
  ];

  const quickReasonsIn = [
    "Penambahan Uang Kembalian (Petty Cash In)",
    "Setoran Darurat dari Pemilik",
    "Koreksi Saldo Fisik",
  ];

  const presets = [10000, 20000, 50000, 100000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg("Nominal kas harus lebih dari 0.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Keterangan alasan mutasi kas wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await recordCashMovement(shiftId, type, amount, reason);

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Petty cash error:", err);
      setErrorMsg("Gagal mencatat mutasi petty cash.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Pencatatan Kas Darurat (Petty Cash)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Catat pengeluaran atau penambahan kas kecil di laci kasir
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
          {/* Toggle Type: Kas Keluar vs Kas Masuk */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Jenis Mutasi Kas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType("out");
                  setReason(quickReasonsOut[0]);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition-all ${
                  type === "out"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                Kas Keluar (-)
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("in");
                  setReason(quickReasonsIn[0]);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition-all ${
                  type === "in"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Kas Masuk (+)
              </button>
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Nominal Uang *
            </label>
            <div className="flex gap-1.5 mb-2">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                    amount === val
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
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
                min="1000"
                step="500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 bg-transparent pl-11 pr-4 py-2.5 text-base font-bold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Alasan / Keperluan */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Keperluan / Alasan *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(type === "out" ? quickReasonsOut : quickReasonsIn).map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] transition-colors ${
                    reason === qr
                      ? "bg-brand-500 text-white font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan keterangan detail..."
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
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50 ${
                type === "out"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              {submitting ? "Mencatat..." : `Simpan ${type === "out" ? "Kas Keluar" : "Kas Masuk"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
