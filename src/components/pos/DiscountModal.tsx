"use client";

import React, { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/financial";
import { Percent, Tag, X, Check, Trash2 } from "lucide-react";

interface DiscountModalProps {
  isOpen: boolean;
  subtotal: number;
  currentDiscount: number;
  onApplyDiscount: (discountAmount: number, note?: string) => void;
  onClose: () => void;
}

export default function DiscountModal({
  isOpen,
  subtotal,
  currentDiscount,
  onApplyDiscount,
  onClose,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [percentValue, setPercentValue] = useState<number>(0);
  const [fixedValue, setFixedValue] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (currentDiscount > 0 && subtotal > 0) {
        // Cek apakah diskon saat ini merupakan persentase genap
        const calculatedPercent = (currentDiscount / subtotal) * 100;
        if (Number.isInteger(calculatedPercent)) {
          setDiscountType("percentage");
          setPercentValue(calculatedPercent);
          setFixedValue(currentDiscount);
        } else {
          setDiscountType("fixed");
          setFixedValue(currentDiscount);
          setPercentValue(0);
        }
      } else {
        setDiscountType("percentage");
        setPercentValue(0);
        setFixedValue(0);
      }
    }
  }, [isOpen, currentDiscount, subtotal]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calculatedDiscount =
    discountType === "percentage"
      ? Math.round((subtotal * (percentValue || 0)) / 100)
      : Math.min(fixedValue || 0, subtotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyDiscount(calculatedDiscount, note);
    onClose();
  };

  const handleReset = () => {
    onApplyDiscount(0, "");
    onClose();
  };

  const percentPresets = [5, 10, 15, 20, 25, 50];
  const fixedPresets = [5000, 10000, 15000, 20000, 50000, 100000];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Diskon Transaksi
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Subtotal Belanja: <strong className="text-gray-700 dark:text-gray-200">{formatRupiah(subtotal)}</strong>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipe Diskon */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Model Potongan Harga
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                  discountType === "percentage"
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <Percent className="h-4 w-4" />
                Persentase (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                  discountType === "fixed"
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <span>Rp</span>
                Nominal Tunai (Rp)
              </button>
            </div>
          </div>

          {/* Input Nilai Diskon */}
          {discountType === "percentage" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Besaran Diskon (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percentValue || ""}
                  onChange={(e) => setPercentValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-base font-bold text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  %
                </span>
              </div>

              {/* Presets Persen */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {percentPresets.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPercentValue(pct)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      percentValue === pct
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Nominal Diskon (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={fixedValue || ""}
                  onChange={(e) => setFixedValue(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-300 bg-transparent pl-11 pr-4 py-2.5 text-base font-bold text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              {/* Presets Fixed */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {fixedPresets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFixedValue(amt)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      fixedValue === amt
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keterangan Diskon */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Alasan / Keterangan Promo (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Kupon Promo Member, Diskon Weekend"
              className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2 text-xs text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
              Total Potongan Harga:
            </span>
            <span className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
              - {formatRupiah(calculatedDiscount)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {currentDiscount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-xs font-bold text-white hover:bg-brand-600 shadow-md shadow-brand-500/20"
            >
              <Check className="h-4 w-4" />
              Terapkan Diskon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
