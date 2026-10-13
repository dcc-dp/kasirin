"use client";

import React from "react";
import type { TransactionDetailData } from "@/actions/transaction";
import { formatRupiah } from "@/lib/financial";
import { maskPhoneNumber } from "@/lib/privacy";
import {
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Crown,
  FileText,
  Printer,
  RotateCcw,
  ShieldAlert,
  User,
  X,
} from "lucide-react";

interface TransactionDetailModalProps {
  isOpen: boolean;
  data: TransactionDetailData | null;
  onClose: () => void;
  onPrintReceipt: () => void;
  onOpenVoid: () => void;
  onOpenReturn: () => void;
}

export default function TransactionDetailModal({
  isOpen,
  data,
  onClose,
  onPrintReceipt,
  onOpenVoid,
  onOpenReturn,
}: TransactionDetailModalProps) {
  if (!isOpen || !data) return null;

  const { transaction: tx, items, returns } = data;
  const isPaid = tx.status === "paid";
  const isVoided = tx.status === "cancelled";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isPaid
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
              }`}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Rincian Transaksi
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                  }`}
                >
                  {isPaid ? "Sukses (Paid)" : "Dibatalkan (Void)"}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                #{tx.invoice_number}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Banner Void jika dibatalkan */}
          {isVoided && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-800 dark:text-red-300">
                <Ban className="h-4 w-4" />
                <span>Transaksi Dibatalkan (Void)</span>
              </div>
              <p className="text-red-700 dark:text-red-400 text-[11px]">
                Alasan: <strong>&quot;{tx.void_reason || "Tidak ada keterangan"}&quot;</strong>
              </p>
              <p className="text-red-600 dark:text-red-400 text-[10px]">
                Dibatalkan oleh: <strong>{tx.voided_by_name || "Supervisor"}</strong> pada{" "}
                {tx.voided_at
                  ? new Date(tx.voided_at).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>
          )}

          {/* Meta Information Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Waktu Transaksi</span>
              <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                {new Date(tx.transaction_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-[11px] text-gray-500 font-mono">
                {new Date(tx.transaction_date).toLocaleTimeString("id-ID")}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Petugas Kasir</span>
              <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                {tx.user_name}
              </p>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                Metode: {tx.payment_method.toUpperCase()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Pelanggan</span>
              <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                {tx.member_name ? tx.member_name : "Pelanggan Umum (Guest)"}
              </p>
              {tx.member_phone && (
                <p className="text-[11px] text-gray-500">
                  {maskPhoneNumber(tx.member_phone)}
                </p>
              )}
            </div>
          </div>

          {/* Tabel Items Belanja */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Daftar Barang Belanja ({items.length} Item)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-[10px] font-bold text-gray-400 uppercase">
                  <tr>
                    <th className="px-3.5 py-2.5">Produk</th>
                    <th className="px-3 py-2.5 text-right">Harga</th>
                    <th className="px-3 py-2.5 text-center">Beli</th>
                    <th className="px-3 py-2.5 text-center">Retur</th>
                    <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="px-3.5 py-2.5 font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400 font-mono">
                        {formatRupiah(item.selling_price)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-gray-800 dark:text-gray-200">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {item.returned_quantity > 0 ? (
                          <span className="font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded">
                            {item.returned_quantity}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-gray-900 dark:text-white font-mono">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ringkasan Finansial */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal:</span>
              <span>{formatRupiah(tx.subtotal)}</span>
            </div>
            {tx.discount > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Diskon:</span>
                <span>-{formatRupiah(tx.discount)}</span>
              </div>
            )}
            {tx.tax > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>PPN:</span>
                <span>+{formatRupiah(tx.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm pt-1.5 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
              <span>Grand Total:</span>
              <span>{formatRupiah(tx.grand_total)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 pt-1">
              <span>Bayar ({tx.payment_method.toUpperCase()}):</span>
              <span>{formatRupiah(tx.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Kembalian:</span>
              <span>{formatRupiah(tx.change_amount)}</span>
            </div>
            {tx.point_gained > 0 && (
              <div className="flex justify-between text-[11px] text-purple-600 dark:text-purple-400 font-semibold pt-1 border-t border-gray-200 dark:border-gray-700">
                <span>Poin Loyalitas Didapat:</span>
                <span>+{tx.point_gained} Poin</span>
              </div>
            )}
          </div>

          {/* Riwayat Retur jika ada */}
          {returns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Riwayat Retur Barang ({returns.length})</span>
              </h4>
              <div className="space-y-1.5">
                {returns.map((ret) => (
                  <div
                    key={ret.id}
                    className="p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-orange-950 dark:text-orange-200 font-mono">
                        #{ret.return_number}
                      </p>
                      <p className="text-[11px] text-orange-700 dark:text-orange-400">
                        Alasan: {ret.reason} • Petugas: {ret.user_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-orange-900 dark:text-orange-300">
                        -{formatRupiah(ret.total_refund)}
                      </span>
                      <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase">
                        {ret.refund_method}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onPrintReceipt}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition"
          >
            <Printer className="h-4 w-4" />
            Cetak Ulang Struk
          </button>

          <div className="flex items-center gap-2">
            {isPaid && (
              <>
                <button
                  type="button"
                  onClick={onOpenReturn}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-xs font-bold text-orange-700 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retur Barang
                </button>
                <button
                  type="button"
                  onClick={onOpenVoid}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 transition"
                >
                  <Ban className="h-4 w-4" />
                  Void Transaksi
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gray-200 dark:bg-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
