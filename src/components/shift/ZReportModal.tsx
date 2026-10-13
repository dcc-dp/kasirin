"use client";

import React from "react";
import type { CloseShiftResult } from "@/actions/shift";
import { formatRupiah } from "@/lib/financial";
import { CheckCircle2, Printer, Store, X } from "lucide-react";

interface ZReportModalProps {
  isOpen: boolean;
  data: CloseShiftResult | null;
  onClose: () => void;
}

export default function ZReportModal({ isOpen, data, onClose }: ZReportModalProps) {
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
          #printable-zreport,
          #printable-zreport * {
            visibility: visible !important;
          }
          #printable-zreport {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            font-family: monospace, monospace !important;
            font-size: 10px !important;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>

      <div className="max-h-[92vh] w-full max-w-md flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Struk Rekap Tutup Shift (Z-Report)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Shift telah resmi ditutup & tersimpan permanen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Slip Preview Container */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50 dark:bg-black/30">
          <div
            id="printable-zreport"
            className="mx-auto w-[280px] p-4 bg-white text-black font-mono text-xs rounded-lg shadow-sm border border-gray-200"
          >
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
              <h4 className="font-bold text-sm tracking-widest uppercase">KASIRIN POS</h4>
              <p className="text-[10px] text-gray-600">REKAPITULASI REGISTER (Z-REPORT)</p>
            </div>

            {/* Shift Info */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Shift ID:</span>
                <span className="font-bold">#{data.shiftId}</span>
              </div>
              <div className="flex justify-between">
                <span>Nama Kasir:</span>
                <span className="font-bold">{data.userName}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu Buka:</span>
                <span>{new Date(data.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu Tutup:</span>
                <span>{new Date(data.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{new Date(data.endTime).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Modal Awal:</span>
                <span>{formatRupiah(data.startingCash)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Penjualan Tunai:</span>
                <span>+{formatRupiah(data.cashSales)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Penjualan Non-Tunai:</span>
                <span>{formatRupiah(data.nonCashSales)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Total Transaksi:</span>
                <span>{data.totalTransactions} nota</span>
              </div>
              {data.cashIn > 0 && (
                <div className="flex justify-between">
                  <span>Kas Masuk (+):</span>
                  <span>+{formatRupiah(data.cashIn)}</span>
                </div>
              )}
              {data.cashOut > 0 && (
                <div className="flex justify-between">
                  <span>Kas Keluar (-):</span>
                  <span>-{formatRupiah(data.cashOut)}</span>
                </div>
              )}
            </div>

            {/* Reconciliation Cash Drawer */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>Uang Diharapkan:</span>
                <span>{formatRupiah(data.expectedCash)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Uang Fisik Aktual:</span>
                <span>{formatRupiah(data.actualCash)}</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-gray-300">
                <span>Selisih Fisik:</span>
                <span>
                  {data.difference === 0
                    ? "Rp 0 (PAS)"
                    : data.difference > 0
                    ? `+${formatRupiah(data.difference)} (LEBIH)`
                    : `-${formatRupiah(Math.abs(data.difference))} (KURANG)`}
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 text-center text-[10px] pt-2">
              <div>
                <p>Kasir</p>
                <div className="h-8" />
                <p>({data.userName})</p>
              </div>
              <div>
                <p>Supervisor / Toko</p>
                <div className="h-8" />
                <p>( .................... )</p>
              </div>
            </div>

            <div className="text-center text-[9px] text-gray-500 mt-3">
              Dicetak otomatis oleh Sistem Kasirin
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Selesai
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk Z-Report
          </button>
        </div>
      </div>
    </div>
  );
}
