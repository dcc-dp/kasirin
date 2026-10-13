"use client";

import React, { useState } from "react";
import BarcodeSvg from "@/components/common/BarcodeSvg";
import { formatRupiah } from "@/lib/financial";
import { Printer, X } from "lucide-react";

interface ProductItem {
  id: number;
  barcode: string;
  name: string;
  selling_price: number;
  unit_name: string | null;
}

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
}

export default function BarcodeLabelModal({
  isOpen,
  onClose,
  product,
}: BarcodeLabelModalProps) {
  const [printCopies, setPrintCopies] = useState<number>(4);
  const [storeName, setStoreName] = useState<string>("KASIRIN STORE");

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyArray = Array.from({ length: printCopies }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-barcode-area,
          #printable-barcode-area * {
            visibility: visible !important;
          }
          #printable-barcode-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 10px !important;
          }
        }
      `}</style>

      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Cetak Label Harga & Barcode
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Label stiker rak toko untuk scanner kasir
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

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Nama Toko / Header
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Jumlah Salinan Label
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={printCopies}
                onChange={(e) => setPrintCopies(Math.max(1, Math.min(30, Number(e.target.value))))}
                className="w-24 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <div className="flex gap-1">
                {[1, 4, 8, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setPrintCopies(cnt)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
                      printCopies === cnt
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {cnt}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Printable Preview Area */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>Pratinjau Lembar Label ({printCopies} label siap cetak):</span>
          </div>

          <div
            id="printable-barcode-area"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-white rounded-xl border border-dashed border-gray-300 text-black"
          >
            {copyArray.map((idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-between p-3 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white"
                style={{ width: "100%", minHeight: "160px" }}
              >
                <div className="w-full border-b border-gray-200 pb-1 mb-1">
                  <span className="text-[10px] tracking-widest font-black uppercase text-gray-500 block">
                    {storeName}
                  </span>
                  <h4 className="text-xs font-bold text-gray-900 truncate" title={product.name}>
                    {product.name}
                  </h4>
                </div>

                <div className="my-1 scale-90 transform-origin-center">
                  <BarcodeSvg value={product.barcode} height={40} scale={1.2} showText={false} />
                  <span className="text-[10px] tracking-widest font-mono text-gray-700 block mt-0.5">
                    {product.barcode}
                  </span>
                </div>

                <div className="w-full border-t border-gray-200 pt-1 mt-1 flex items-baseline justify-between px-1">
                  <span className="text-[10px] text-gray-500">
                    /{product.unit_name || "pcs"}
                  </span>
                  <span className="text-sm font-extrabold text-gray-950">
                    {formatRupiah(product.selling_price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-md shadow-brand-500/20"
          >
            <Printer className="h-4 w-4" />
            Cetak Label Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
