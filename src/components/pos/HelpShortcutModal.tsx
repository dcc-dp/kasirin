"use client";

import React, { useEffect } from "react";
import { Keyboard, X } from "lucide-react";

interface HelpShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpShortcutModal({
  isOpen,
  onClose,
}: HelpShortcutModalProps) {
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

  const shortcuts = [
    {
      key: "F1",
      name: "Bantuan Shortcut",
      desc: "Menampilkan jendela panduan tombol pintas keyboard ini",
      badge: "Umum",
    },
    {
      key: "F2",
      name: "Fokus Scan / Cari Produk",
      desc: "Langsung mengarahkan kursor ke input pencarian produk & scanner barcode",
      badge: "Navigasi",
    },
    {
      key: "F3",
      name: "Pilih / Ganti Member",
      desc: "Buka dialog pencarian member loyalitas atau pendaftaran member baru",
      badge: "Pelanggan",
    },
    {
      key: "F4",
      name: "Diskon Transaksi",
      desc: "Berikan potongan harga global dalam bentuk persentase (%) atau nominal (Rp)",
      badge: "Promo",
    },
    {
      key: "F7",
      name: "Kosongkan Keranjang",
      desc: "Menghapus semua item belanjaan yang sedang aktif dalam keranjang",
      badge: "Keranjang",
    },
    {
      key: "F8 / Space",
      name: "Buka Pembayaran",
      desc: "Membuka modal kasir untuk pembayaran Tunai, QRIS, atau Transfer Bank",
      badge: "Checkout",
    },
    {
      key: "Enter",
      name: "Konfirmasi / Bayar",
      desc: "Menyelesaikan transaksi saat berada di modal pembayaran atau memilih item",
      badge: "Aksi",
    },
    {
      key: "Esc",
      name: "Tutup / Batal",
      desc: "Menutup modal pop-up yang sedang aktif atau membatalkan operasi",
      badge: "Batal",
    },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Panduan Keyboard Shortcut POS
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Operasikan kasir secepat kilat tanpa sentuh mouse
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

        {/* List Shortcuts */}
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-2.5">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 transition"
            >
              <div className="flex items-start gap-3">
                <kbd className="min-w-[70px] inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-mono font-black text-brand-700 bg-white border border-gray-200 rounded-lg shadow-2xs dark:bg-gray-800 dark:text-brand-400 dark:border-gray-700">
                  {item.key}
                </kbd>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-gray-200/70 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Tekan <kbd className="font-mono font-bold bg-white dark:bg-gray-800 border px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> untuk menutup
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 shadow-sm transition"
          >
            Tutup Bantuan
          </button>
        </div>
      </div>
    </div>
  );
}
