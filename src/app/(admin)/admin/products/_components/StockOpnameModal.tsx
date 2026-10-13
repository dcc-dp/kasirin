"use client";

import React, { useState } from "react";
import { adjustStock } from "@/actions/product";
import { AlertCircle, ArrowDownRight, ArrowUpRight, CheckCircle2, RefreshCw, X } from "lucide-react";

interface ProductItem {
  id: number;
  barcode: string;
  name: string;
  stock: number;
  unit_name: string | null;
  category_name: string | null;
}

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  selectedProduct?: ProductItem | null;
  onSuccess: () => void;
}

export default function StockOpnameModal({
  isOpen,
  onClose,
  products,
  selectedProduct,
  onSuccess,
}: StockOpnameModalProps) {
  const [productId, setProductId] = useState<number>(
    selectedProduct ? selectedProduct.id : products[0]?.id || 0
  );
  const [opnameMode, setOpnameMode] = useState<"actual" | "add" | "reduce">("actual");
  const [inputValue, setInputValue] = useState<number>(
    selectedProduct ? selectedProduct.stock : 0
  );
  const [reason, setReason] = useState<string>("Audit Rutin Fisik");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync if selectedProduct changes
  React.useEffect(() => {
    if (selectedProduct) {
      setProductId(selectedProduct.id);
      setInputValue(selectedProduct.stock);
    } else if (products.length > 0 && !productId) {
      setProductId(products[0].id);
      setInputValue(products[0].stock);
    }
  }, [selectedProduct, products]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === Number(productId));
  const currentStock = currentProduct?.stock ?? 0;

  // Kalkulasi selisih
  let diff = 0;
  let finalStock = currentStock;

  if (opnameMode === "actual") {
    finalStock = inputValue;
    diff = inputValue - currentStock;
  } else if (opnameMode === "add") {
    finalStock = currentStock + inputValue;
    diff = inputValue;
  } else if (opnameMode === "reduce") {
    finalStock = Math.max(0, currentStock - inputValue);
    diff = -inputValue;
  }

  const quickReasons = [
    "Audit Rutin Fisik",
    "Barang Rusak / Pecah",
    "Kedaluwarsa (Expired)",
    "Selisih Kasir / Kesalahan Hitung",
    "Barang Hilang",
    "Retur / Ditemukan Kembali",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentProduct) {
      setErrorMsg("Pilih produk terlebih dahulu.");
      return;
    }

    if (inputValue < 0) {
      setErrorMsg("Kuantitas tidak boleh bernilai negatif.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Alasan penyesuaian wajib diisi.");
      return;
    }

    // Mapping mode to action payload
    let type: "in" | "out" | "adjustment" = "adjustment";
    let qtyToSend = inputValue;

    if (opnameMode === "actual") {
      type = "adjustment";
      qtyToSend = inputValue; // will be set to actual stock
    } else if (opnameMode === "add") {
      type = "in";
      qtyToSend = inputValue;
    } else if (opnameMode === "reduce") {
      type = "out";
      qtyToSend = inputValue;
    }

    try {
      setSubmitting(true);
      const res = await adjustStock({
        productId: currentProduct.id,
        type,
        quantity: qtyToSend,
        description: `Stock Opname: ${reason.trim()} (${opnameMode === "actual" ? `Fisik ${inputValue}` : `${opnameMode === "add" ? "+" : "-"}${inputValue}`})`,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Opname error:", err);
      setErrorMsg("Terjadi kegagalan jaringan saat menyimpan opname.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Stock Opname (Koreksi Stok)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sinkronisasi stok fisik di toko dengan data sistem
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
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilih Produk */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Pilih Produk
            </label>
            <select
              value={productId}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setProductId(newId);
                const p = products.find((item) => item.id === newId);
                if (p) setInputValue(p.stock);
              }}
              disabled={submitting || !!selectedProduct}
              className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-gray-800">
                  {p.name} ({p.barcode}) - Stok: {p.stock} {p.unit_name || "pcs"}
                </option>
              ))}
            </select>
          </div>

          {/* Info Status Stok Sekarang */}
          {currentProduct && (
            <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-white/[0.03] border border-gray-200/70 dark:border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Stok Sistem Saat Ini</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {currentStock} {currentProduct.unit_name || "pcs"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Stok Akhir Nanti</span>
                <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                  {finalStock} {currentProduct.unit_name || "pcs"}
                </span>
              </div>
            </div>
          )}

          {/* Tab Mode Opname */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Metode Penyesuaian
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpnameMode("actual");
                  if (currentProduct) setInputValue(currentProduct.stock);
                }}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-medium border transition-all ${
                  opnameMode === "actual"
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-600 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <span>Fisik Riil</span>
                <span className="text-[10px] opacity-75">Set Jumlah Nyata</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpnameMode("add");
                  setInputValue(1);
                }}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-medium border transition-all ${
                  opnameMode === "add"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Tambah (+)
                </span>
                <span className="text-[10px] opacity-75">Masuk Extra</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpnameMode("reduce");
                  setInputValue(1);
                }}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-medium border transition-all ${
                  opnameMode === "reduce"
                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <span className="flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" /> Kurang (-)
                </span>
                <span className="text-[10px] opacity-75">Rusak/Hilang</span>
              </button>
            </div>
          </div>

          {/* Input Nilai */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {opnameMode === "actual"
                  ? "Jumlah Stok Fisik di Rak/Gudang"
                  : opnameMode === "add"
                  ? "Jumlah Penambahan Stok"
                  : "Jumlah Pengurangan Stok"}
              </label>
              {opnameMode === "actual" && diff !== 0 && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    diff > 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  }`}
                >
                  Selisih: {diff > 0 ? `+${diff}` : diff} {currentProduct?.unit_name || "pcs"}
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              value={inputValue}
              onChange={(e) => setInputValue(Number(e.target.value))}
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-base font-semibold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Alasan Penyesuaian */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Alasan Penyesuaian
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickReasons.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                    reason === qr
                      ? "bg-brand-500 text-white font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan catatan detail alasan selisih..."
              disabled={submitting}
              className="w-full resize-none rounded-xl border border-gray-300 bg-transparent px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end gap-3 pt-2">
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
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 shadow-md shadow-brand-500/20"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Terapkan Penyesuaian
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
