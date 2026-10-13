"use client";

import React, { useState } from "react";
import type { ReceiptDetail } from "@/actions/transaction";
import { formatRupiah } from "@/lib/financial";
import BarcodeSvg from "@/components/common/BarcodeSvg";
import { CheckCircle2, Printer, RotateCcw, X } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  data: ReceiptDetail | null;
  onClose: () => void;
  onNewTransaction: () => void;
}

export default function ReceiptModal({
  isOpen,
  data,
  onClose,
  onNewTransaction,
}: ReceiptModalProps) {
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("58mm");

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-thermal-receipt,
          #printable-thermal-receipt * {
            visibility: visible !important;
          }
          #printable-thermal-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${paperWidth === "58mm" ? "58mm" : "80mm"} !important;
            margin: 0 !important;
            padding: 3mm !important;
            background: white !important;
            color: black !important;
            font-family: monospace, monospace !important;
            font-size: ${paperWidth === "58mm" ? "10px" : "12px"} !important;
            line-height: 1.25 !important;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>

      <div className="max-h-[92vh] w-full max-w-md flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Transaksi Berhasil
              </h3>
              <p className="text-[11px] text-gray-500 font-mono">
                #{data.invoice_number}
              </p>
            </div>
          </div>

          {/* Paper Switch */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setPaperWidth("58mm")}
              className={`px-2 py-0.5 rounded ${
                paperWidth === "58mm"
                  ? "bg-white dark:bg-gray-700 text-brand-600 shadow-2xs"
                  : "text-gray-500"
              }`}
            >
              58mm
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth("80mm")}
              className={`px-2 py-0.5 rounded ${
                paperWidth === "80mm"
                  ? "bg-white dark:bg-gray-700 text-brand-600 shadow-2xs"
                  : "text-gray-500"
              }`}
            >
              80mm
            </button>
          </div>
        </div>

        {/* Thermal Slip Content Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-black/30">
          <div
            id="printable-thermal-receipt"
            className={`mx-auto bg-white text-black font-mono text-[11px] p-3 rounded-lg shadow-xs border border-gray-200 ${
              paperWidth === "58mm" ? "w-[260px]" : "w-[340px]"
            }`}
          >
            {/* Header Toko */}
            <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
              <h4 className="font-extrabold text-sm tracking-wider uppercase">KASIRIN STORE</h4>
              <p className="text-[10px] text-gray-600">Jl. Malioboro No. 45, Yogyakarta</p>
              <p className="text-[10px] text-gray-600">Telp: 0812-3456-7890</p>
            </div>

            {/* Meta Transaksi */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>No: {data.invoice_number}</span>
                <span>
                  {new Date(data.transaction_date).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kasir: {data.user_name}</span>
                <span>
                  {new Date(data.transaction_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {data.member_name && (
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Pelanggan: {data.member_name}</span>
                </div>
              )}
            </div>

            {/* Item Rows */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1">
              {data.items.map((item, idx) => (
                <div key={idx}>
                  <p className="font-bold truncate text-[11px]">{item.name}</p>
                  <div className="flex justify-between text-[10px] text-gray-700">
                    <span>
                      {item.quantity} x {formatRupiah(item.selling_price)}
                    </span>
                    <span className="font-bold text-black">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(data.subtotal)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(data.discount)}</span>
                </div>
              )}
              {data.tax > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>PPN:</span>
                  <span>+{formatRupiah(data.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-dotted border-gray-300">
                <span>TOTAL:</span>
                <span>{formatRupiah(data.grand_total)}</span>
              </div>
              <div className="flex justify-between text-[10px] pt-1">
                <span className="uppercase">Bayar ({data.payment_method}):</span>
                <span>{formatRupiah(data.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span>Kembalian:</span>
                <span>{formatRupiah(data.change_amount)}</span>
              </div>
            </div>

            {/* Poin Info */}
            {data.point_gained > 0 && (
              <div className="text-center text-[10px] border-b border-dashed border-gray-400 pb-1 mb-2">
                <span>Poin Didapat: +{data.point_gained} Poin</span>
              </div>
            )}

            {/* Footer Barcode & Thank You */}
            <div className="text-center space-y-1 pt-1">
              <p className="text-[10px] font-bold uppercase">Terima Kasih Atas Kunjungan Anda</p>
              <p className="text-[9px] text-gray-500">Barang yang sudah dibeli tidak dapat ditukar</p>
              <div className="pt-1 flex justify-center scale-90">
                <BarcodeSvg value={data.invoice_number} height={30} scale={1} showText={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onNewTransaction}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RotateCcw className="h-4 w-4" />
            Transaksi Baru
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-600 shadow-md shadow-brand-500/20"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk Nota
          </button>
        </div>
      </div>
    </div>
  );
}
