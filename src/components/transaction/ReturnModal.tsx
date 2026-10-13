"use client";

import React, { useState, useEffect } from "react";
import { processReturnItem, type TransactionDetailData } from "@/actions/transaction";
import { formatRupiah } from "@/lib/financial";
import {
  AlertCircle,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

interface ReturnModalProps {
  isOpen: boolean;
  transactionDetail: TransactionDetailData | null;
  onClose: () => void;
  onSuccess: (returnNumber: string, totalRefund: number) => void;
}

export default function ReturnModal({
  isOpen,
  transactionDetail,
  onClose,
  onSuccess,
}: ReturnModalProps) {
  const [returnItems, setReturnItems] = useState<{
    [productId: number]: {
      quantity: number;
      condition: "good" | "damaged";
    };
  }>({});
  const [refundMethod, setRefundMethod] = useState<"cash" | "transfer">("cash");
  const [reason, setReason] = useState<string>("Barang Cacat / Rusak Pabrik");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transactionDetail) {
      const initial: { [key: number]: { quantity: number; condition: "good" | "damaged" } } = {};
      transactionDetail.items.forEach((item) => {
        initial[item.product_id] = {
          quantity: 0,
          condition: "good",
        };
      });
      setReturnItems(initial);
      setRefundMethod("cash");
      setReason("Barang Cacat / Rusak Pabrik");
      setErrorMessage(null);
      setSubmitting(false);
    }
  }, [isOpen, transactionDetail]);

  if (!isOpen || !transactionDetail) return null;

  const { transaction, items } = transactionDetail;

  const presetReasons = [
    "Barang Cacat / Rusak Pabrik",
    "Kemasan Bocor / Penyok",
    "Salah Beli / Salah Varian",
    "Produk Melewati Masa Kedaluwarsa",
  ];

  const handleQtyChange = (productId: number, maxQty: number, nextQty: number) => {
    const validQty = Math.max(0, Math.min(maxQty, nextQty));
    setReturnItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: validQty,
      },
    }));
  };

  const handleConditionChange = (productId: number, condition: "good" | "damaged") => {
    setReturnItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        condition,
      },
    }));
  };

  // Kalkulasi Total Refund
  let totalRefund = 0;
  let totalItemCount = 0;

  items.forEach((it) => {
    const selected = returnItems[it.product_id];
    if (selected && selected.quantity > 0) {
      totalRefund += selected.quantity * it.selling_price;
      totalItemCount += selected.quantity;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const itemsToSubmit = Object.entries(returnItems)
      .filter(([_, val]) => val.quantity > 0)
      .map(([prodId, val]) => ({
        product_id: Number(prodId),
        quantity: val.quantity,
        condition: val.condition,
      }));

    if (itemsToSubmit.length === 0) {
      setErrorMessage("Tentukan minimal 1 barang yang ingin diretur (kuantitas > 0).");
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Alasan retur barang wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await processReturnItem({
        transaction_id: transaction.id,
        items: itemsToSubmit,
        refund_method: refundMethod,
        reason: reason.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }

      onSuccess(res.data?.return_number || "", res.data?.total_refund || totalRefund);
      onClose();
    } catch (err: any) {
      console.error("Return error:", err);
      setErrorMessage(err?.message || "Terjadi kesalahan saat memproses retur barang.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Retur & Pengembalian Dana (Refund)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Faktur Asal: #{transaction.invoice_number}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Daftar Barang Transaksi */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Pilih Barang & Kuantitas Retur
              </label>
              <span className="text-[11px] text-gray-400">
                Kuantitas maks = dibeli - sudah diretur
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((item) => {
                const maxReturnable = item.quantity - item.returned_quantity;
                const state = returnItems[item.product_id] || { quantity: 0, condition: "good" };
                const isSelected = state.quantity > 0;

                return (
                  <div
                    key={item.product_id}
                    className={`p-3.5 rounded-xl border transition ${
                      maxReturnable <= 0
                        ? "opacity-60 bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-800"
                        : isSelected
                        ? "bg-orange-50/50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-800"
                        : "bg-white border-gray-200 dark:bg-gray-800/60 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          <span>Harga: {formatRupiah(item.selling_price)}</span>
                          <span>•</span>
                          <span>Beli: {item.quantity}</span>
                          {item.returned_quantity > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600 dark:text-orange-400">
                                Sudah retur: {item.returned_quantity}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            Sisa Retur: {maxReturnable}
                          </span>
                        </div>
                      </div>

                      {/* Kontrol Qty Retur & Kondisi */}
                      {maxReturnable > 0 ? (
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Stepper Qty */}
                          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleQtyChange(
                                  item.product_id,
                                  maxReturnable,
                                  state.quantity - 1
                                )
                              }
                              className="h-6 w-6 rounded flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-900 dark:text-white">
                              {state.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleQtyChange(
                                  item.product_id,
                                  maxReturnable,
                                  state.quantity + 1
                                )
                              }
                              className="h-6 w-6 rounded flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Tombol Maksimal */}
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(item.product_id, maxReturnable, maxReturnable)
                            }
                            className="px-2 py-1 text-[10px] font-bold rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          >
                            Semua
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-gray-400">
                          Sudah Diretur Penuh
                        </span>
                      )}
                    </div>

                    {/* Jika Qty Dipilih, Tampilkan Opsi Kondisi Barang */}
                    {isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-orange-200/60 dark:border-orange-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-[11px]">
                            Kondisi Fisik Barang:
                          </span>
                          <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleConditionChange(item.product_id, "good")}
                              className={`px-2.5 py-1 rounded font-bold transition ${
                                state.condition === "good"
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              Layak Jual (+Stok)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConditionChange(item.product_id, "damaged")}
                              className={`px-2.5 py-1 rounded font-bold transition ${
                                state.condition === "damaged"
                                  ? "bg-red-600 text-white shadow-2xs"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              Rusak / Cacat
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-gray-500 mr-1.5">Subtotal Refund:</span>
                          <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                            {formatRupiah(state.quantity * item.selling_price)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metode Refund Uang & Alasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Metode Pengembalian Dana
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundMethod("cash")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    refundMethod === "cash"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  Tunai (Cash)
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod("transfer")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    refundMethod === "transfer"
                      ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                      : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Transfer Bank
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Alasan Pengembalian Barang *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Alasan retur..."
                className="w-full rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-xs text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Preset Reasons Chips */}
          <div className="flex flex-wrap gap-1.5">
            {presetReasons.map((prs, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReason(prs)}
                className="px-2.5 py-1 rounded-lg text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300 font-medium"
              >
                {prs}
              </button>
            ))}
          </div>

          {/* Ringkasan Biaya Refund */}
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-orange-900 dark:text-orange-200">
                Total Nilai Pengembalian ({totalItemCount} Unit Barang)
              </p>
              <p className="text-[11px] text-orange-700 dark:text-orange-300 mt-0.5">
                Uang akan diserahkan ke pelanggan via {refundMethod.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-orange-950 dark:text-orange-100">
                {formatRupiah(totalRefund)}
              </span>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || totalRefund <= 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700 shadow-md shadow-orange-600/20 disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memproses Retur...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Proses Retur & Refund</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
