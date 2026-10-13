"use client";

import React, { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/financial";
import type { FinancialReportData } from "@/actions/report";
import { getPublicStoreInfo } from "@/actions/setting";
import { FileText, Printer, X } from "lucide-react";

interface PrintReportModalProps {
  isOpen: boolean;
  data: FinancialReportData;
  onClose: () => void;
}

export default function PrintReportModal({
  isOpen,
  data,
  onClose,
}: PrintReportModalProps) {
  const [storeInfo, setStoreInfo] = useState<{
    store_name: string;
    address: string;
    phone: string | null;
  }>({
    store_name: "KASIRIN STORE",
    address: "Jl. Malioboro No. 45, D.I. Yogyakarta",
    phone: "(0274) 555-1234",
  });

  useEffect(() => {
    getPublicStoreInfo().then((info) => {
      if (info) {
        setStoreInfo({
          store_name: info.store_name,
          address: info.address,
          phone: info.phone,
        });
      }
    });
  }, []);

  if (!isOpen) return null;

  const { summary, paymentBreakdown, topProducts, dateRange } = data;

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
          #printable-financial-report,
          #printable-financial-report * {
            visibility: visible !important;
          }
          #printable-financial-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: white !important;
            color: black !important;
            font-family: sans-serif !important;
            font-size: 11pt !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="max-h-[92vh] w-full max-w-3xl flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Pratinjau Dokumen Cetak Laporan
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Format Standar Akuntansi A4 • {dateRange.periodLabel}
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

        {/* Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-black/40">
          <div
            id="printable-financial-report"
            className="mx-auto w-full max-w-[210mm] bg-white p-8 rounded-xl shadow-xs border border-gray-200 text-gray-900 text-xs font-sans space-y-6"
          >
            {/* KOP Surat Toko Dinamis */}
            <div className="border-b-2 border-gray-900 pb-4 text-center">
              <h2 className="text-xl font-black uppercase tracking-wider text-gray-900">
                {storeInfo.store_name}
              </h2>
              <p className="text-[11px] text-gray-600">
                {storeInfo.address}
                {storeInfo.phone ? ` • Telp: ${storeInfo.phone}` : ""}
              </p>
              <h3 className="text-sm font-extrabold uppercase mt-2 tracking-wide text-gray-800">
                LAPORAN LABA RUGI & KINERJA FINANSIAL
              </h3>
              <p className="text-[11px] font-semibold text-gray-500">
                Periode: {dateRange.periodLabel} ({dateRange.start} s/d {dateRange.end})
              </p>
            </div>

            {/* Rincian Laba Rugi */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-300 pb-1">
                I. Ringkasan Laba Rugi (Profit & Loss)
              </h4>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-1.5 font-medium">Penjualan Kotor (Gross Sales)</td>
                    <td className="py-1.5 text-right font-mono font-bold">
                      {formatRupiah(summary.gross_sales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-600">Potongan Diskon Promo (-)</td>
                    <td className="py-1.5 text-right font-mono text-red-600">
                      -{formatRupiah(summary.total_discount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-600">Retur Penjualan & Refund (-)</td>
                    <td className="py-1.5 text-right font-mono text-red-600">
                      -{formatRupiah(summary.total_refund)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="py-2 px-1">PENJUALAN BERSIH (NET SALES)</td>
                    <td className="py-2 px-1 text-right font-mono">
                      {formatRupiah(summary.net_sales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-600">
                      Harga Pokok Penjualan / HPP (COGS) (-)
                    </td>
                    <td className="py-1.5 text-right font-mono text-gray-700">
                      -{formatRupiah(summary.cogs)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 font-black text-emerald-950 text-sm">
                    <td className="py-2.5 px-1 border-t-2 border-emerald-600">
                      LABA KOTOR TOKO (GROSS PROFIT)
                    </td>
                    <td className="py-2.5 px-1 text-right font-mono border-t-2 border-emerald-600">
                      {formatRupiah(summary.gross_profit)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-bold text-gray-600">
                      Margin Laba Kotor (%)
                    </td>
                    <td className="py-1.5 text-right font-bold text-emerald-700">
                      {summary.profit_margin.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rincian Metode Pembayaran & Beban Pengeluaran */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-300 pb-1">
                  II. Cara Pembayaran
                </h4>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-gray-100">
                    {paymentBreakdown.map((pb, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5">
                          {pb.label} ({pb.count} Transaksi)
                        </td>
                        <td className="py-1.5 text-right font-mono font-bold">
                          {formatRupiah(pb.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-300 pb-1">
                  III. Arus Kas & Pembelian
                </h4>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-1.5">Beban Restock Pembelian</td>
                      <td className="py-1.5 text-right font-mono font-bold text-red-600">
                        {formatRupiah(summary.restock_expenses)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Net Selisih Laci Kasir</td>
                      <td className="py-1.5 text-right font-mono font-bold">
                        {summary.cash_difference >= 0 ? "+" : ""}
                        {formatRupiah(summary.cash_difference)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Rata-rata Keranjang (Basket)</td>
                      <td className="py-1.5 text-right font-mono font-bold text-gray-700">
                        {formatRupiah(summary.average_basket_size)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 5 Produk Terlaris */}
            {topProducts.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-300 pb-1">
                  IV. Top 5 Produk Penjualan Tertinggi
                </h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-200">
                      <th className="py-1 text-left">Nama Produk</th>
                      <th className="py-1 text-left">Kategori</th>
                      <th className="py-1 text-center">Unit Terjual</th>
                      <th className="py-1 text-right">Kontribusi Omzet</th>
                      <th className="py-1 text-right">Laba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProducts.slice(0, 5).map((tp, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-medium">{tp.name}</td>
                        <td className="py-1.5 text-gray-500">{tp.category_name}</td>
                        <td className="py-1.5 text-center font-bold">{tp.quantity_sold}</td>
                        <td className="py-1.5 text-right font-mono">{formatRupiah(tp.total_revenue)}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-emerald-700">
                          {formatRupiah(tp.total_profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Kolom Tanda Tangan */}
            <div className="pt-8 flex justify-between text-center text-xs">
              <div>
                <p className="text-gray-500">Dipersiapkan Oleh:</p>
                <div className="h-16" />
                <p className="font-bold border-t border-gray-400 pt-1">
                  Staff Kasir / Keuangan
                </p>
              </div>

              <div>
                <p className="text-gray-500">
                  Yogyakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="text-gray-500">Disetujui Oleh:</p>
                <div className="h-16" />
                <p className="font-bold border-t border-gray-400 pt-1">
                  Pemilik Toko / Manajer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-600 shadow-md shadow-brand-500/20 transition"
          >
            <Printer className="h-4 w-4" />
            Cetak / Simpan PDF (A4)
          </button>
        </div>
      </div>
    </div>
  );
}
