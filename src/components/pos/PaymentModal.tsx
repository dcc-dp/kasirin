"use client";

import React, { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/financial";
import { playPosBeep } from "@/lib/audio";
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  QrCode,
  Wallet,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { CartItemInput, CheckoutInput, ReceiptDetail } from "@/actions/transaction";
import { checkoutTransaction } from "@/actions/transaction";

interface PaymentModalProps {
  isOpen: boolean;
  items: CartItemInput[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  memberId?: number | null;
  pointsRedeemed?: number;
  onClose: () => void;
  onSuccess: (receipt: ReceiptDetail) => void;
}

export default function PaymentModal({
  isOpen,
  items,
  subtotal,
  discount,
  tax,
  grandTotal,
  memberId,
  pointsRedeemed,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [paidAmount, setPaidAmount] = useState<number>(grandTotal);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaidAmount(grandTotal);
      setErrorMessage(null);
      setSubmitting(false);
    }
  }, [isOpen, grandTotal]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitting) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "1" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        setPaymentMethod("cash");
      } else if (e.key === "2" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        setPaymentMethod("qris");
        setPaidAmount(grandTotal);
      } else if (e.key === "3" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        setPaymentMethod("transfer");
        setPaidAmount(grandTotal);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, grandTotal, onClose]);

  if (!isOpen) return null;

  const changeAmount = Math.max(0, (paidAmount || 0) - grandTotal);
  const isInsufficient = paymentMethod === "cash" && (paidAmount || 0) < grandTotal;

  // Preset pecahan uang pas & rounded
  const generateQuickCashPresets = () => {
    const list: number[] = [grandTotal]; // Uang pas

    const candidates = [10000, 20000, 50000, 100000, 150000, 200000, 300000, 500000];
    for (const val of candidates) {
      if (val > grandTotal && !list.includes(val)) {
        list.push(val);
      }
      if (list.length >= 5) break;
    }

    // Jika belum cukup, tambahkan kelipatan 50k atau 100k di atas grandTotal
    if (list.length < 4) {
      const ceil50 = Math.ceil(grandTotal / 50000) * 50000;
      if (!list.includes(ceil50) && ceil50 > grandTotal) list.push(ceil50);
      const ceil100 = Math.ceil(grandTotal / 100000) * 100000;
      if (!list.includes(ceil100) && ceil100 > grandTotal) list.push(ceil100);
    }

    return list.slice(0, 5);
  };

  const quickPresets = generateQuickCashPresets();

  const handleProcessCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;

    if (isInsufficient) {
      setErrorMessage("Uang yang diterima kurang dari total belanja.");
      playPosBeep("error");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload: CheckoutInput = {
        member_id: memberId || null,
        items,
        subtotal,
        discount,
        tax,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        paid_amount: paymentMethod === "cash" ? paidAmount : grandTotal,
        points_redeemed: pointsRedeemed || 0,
      };

      const res = await checkoutTransaction(payload);

      if (!res.success) {
        setErrorMessage(res.message);
        playPosBeep("error");
        return;
      }

      playPosBeep("success");
      if (res.data) {
        onSuccess(res.data);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      playPosBeep("error");
      setErrorMessage(err?.message || "Terjadi kesalahan sistem saat memproses transaksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Pembayaran Transaksi
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih metode bayar & kalkulasi kembalian pelanggan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleProcessCheckout} className="p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Grand Total Display */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total yang Harus Dibayar
            </p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
              {formatRupiah(grandTotal)}
            </h2>
            {(discount > 0 || (pointsRedeemed && pointsRedeemed > 0)) && (
              <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 mt-1">
                {discount > 0 && <span>Diskon: -{formatRupiah(discount)}</span>}
                {pointsRedeemed && pointsRedeemed > 0 ? (
                  <span>Poin: -{formatRupiah(pointsRedeemed * 100)}</span>
                ) : null}
              </div>
            )}
          </div>

          {/* Metode Pembayaran Tabs */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Metode Pembayaran (Tekan <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">1</kbd>/<kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">2</kbd>/<kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">3</kbd>)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === "cash"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <Banknote className="h-5 w-5 mb-1" />
                <span>[1] Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("qris");
                  setPaidAmount(grandTotal);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === "qris"
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <QrCode className="h-5 w-5 mb-1" />
                <span>[2] QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("transfer");
                  setPaidAmount(grandTotal);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === "transfer"
                    ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <Building2 className="h-5 w-5 mb-1" />
                <span>[3] Transfer</span>
              </button>
            </div>
          </div>

          {/* Conditional Input Berdasarkan Metode */}
          {paymentMethod === "cash" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Uang Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={paidAmount || ""}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="0"
                    className={`w-full rounded-xl border bg-transparent pl-11 pr-4 py-2.5 text-lg font-black focus:outline-hidden ${
                      isInsufficient
                        ? "border-red-400 text-red-600 focus:border-red-500"
                        : "border-gray-300 text-gray-900 focus:border-emerald-500 dark:border-gray-700 dark:text-white"
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Cash Chips */}
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1.5">Uang Pas & Rekomendasi:</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map((amt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPaidAmount(amt)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                        paidAmount === amt
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                      }`}
                    >
                      {amt === grandTotal ? `Pas (${formatRupiah(amt)})` : formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Box Kembalian */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isInsufficient
                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300"
                }`}
              >
                <div>
                  <span className="text-xs font-bold">
                    {isInsufficient ? "Uang Kurang:" : "Kembalian:"}
                  </span>
                  <p className="text-[10px] opacity-80">
                    {isInsufficient
                      ? "Harap masukkan nominal uang yang cukup"
                      : "Berikan kembalian tunai ke pelanggan"}
                  </p>
                </div>
                <span className="text-lg font-black tracking-tight">
                  {isInsufficient
                    ? `- ${formatRupiah(grandTotal - (paidAmount || 0))}`
                    : formatRupiah(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === "qris" && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 text-center space-y-2">
              <div className="mx-auto w-36 h-36 bg-white p-2 rounded-xl shadow-xs border border-gray-200 flex flex-col items-center justify-center">
                <QrCode className="w-24 h-24 text-gray-800" />
                <span className="text-[9px] font-black text-gray-500 tracking-wider">
                  NMID: ID10200392019
                </span>
              </div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Scan QRIS Dinamis • {formatRupiah(grandTotal)}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Mendukung GoPay, OVO, ShopeePay, DANA, BCA, Mandiri, dan m-Banking lainnya
              </p>
            </div>
          )}

          {paymentMethod === "transfer" && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">Bank Tujuan:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">BCA (Bank Central Asia)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">No. Rekening:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">882-019-2810</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Atas Nama:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">KASIRIN STORE</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Batal (Esc)
            </button>
            <button
              type="submit"
              disabled={submitting || isInsufficient}
              className="flex-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses Transaksi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selesaikan Pembayaran (Enter)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
