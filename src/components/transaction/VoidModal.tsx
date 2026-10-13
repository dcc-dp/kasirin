"use client";

import React, { useState, useEffect } from "react";
import { voidTransaction } from "@/actions/transaction";
import { formatRupiah } from "@/lib/financial";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";

interface VoidModalProps {
  isOpen: boolean;
  transaction: {
    id: number;
    invoice_number: string;
    grand_total: number;
    user_name: string;
    payment_method: string;
  } | null;
  currentUserRole: string; // 'ADM' or 'KSR'
  onClose: () => void;
  onSuccess: () => void;
}

export default function VoidModal({
  isOpen,
  transaction,
  currentUserRole,
  onClose,
  onSuccess,
}: VoidModalProps) {
  const [reason, setReason] = useState<string>("");
  const [supervisorUsername, setSupervisorUsername] = useState<string>("");
  const [supervisorPassword, setSupervisorPassword] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setSupervisorUsername("");
      setSupervisorPassword("");
      setErrorMessage(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const isCashier = currentUserRole === "KSR";

  const presetReasons = [
    "Pelanggan Salah Bawa Barang",
    "Kesalahan Input Kuantitas Kasir",
    "Metode Pembayaran Salah Dipilih",
    "Pelanggan Membatalkan Transaksi di Kasir",
    "Uang Tunai Pelanggan Tidak Cukup",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!reason.trim()) {
      setErrorMessage("Alasan pembatalan (void) wajib diisi.");
      return;
    }

    if (isCashier && (!supervisorUsername.trim() || !supervisorPassword)) {
      setErrorMessage("Username dan password supervisor/admin wajib diisi untuk otorisasi void.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await voidTransaction({
        transaction_id: transaction.id,
        void_reason: reason.trim(),
        supervisor_username: isCashier ? supervisorUsername.trim() : undefined,
        supervisor_password: isCashier ? supervisorPassword : undefined,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Void error:", err);
      setErrorMessage(err?.message || "Terjadi kesalahan saat memproses pembatalan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Void Pembatalan Transaksi
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                #{transaction.invoice_number}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Info Transaksi & Dampak */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-amber-900 dark:text-amber-200">
              <span>Nilai Tagihan:</span>
              <span>{formatRupiah(transaction.grand_total)} ({transaction.payment_method.toUpperCase()})</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
              ⚠️ <strong>Dampak Pembatalan (Void):</strong> Seluruh barang akan dikembalikan ke stok inventori, catatan mutasi masuk otomatis dibuat, dan pengeluaran kas dicatat jika pembayaran berupa uang tunai.
            </p>
          </div>

          {/* Input Alasan Void */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Alasan Pembatalan Transaksi *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan pembatalan faktur ini..."
              className="w-full rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-xs text-gray-800 focus:border-red-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
            />
            {/* Preset reasons */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {presetReasons.map((prs, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(prs)}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  {prs}
                </button>
              ))}
            </div>
          </div>

          {/* Bagian Otorisasi Supervisor jika kasir */}
          {isCashier ? (
            <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/20 space-y-3">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 text-xs font-bold">
                <Lock className="h-4 w-4" />
                <span>Otorisasi Supervisor / Admin</span>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Username Supervisor
                </label>
                <input
                  type="text"
                  required
                  value={supervisorUsername}
                  onChange={(e) => setSupervisorUsername(e.target.value)}
                  placeholder="Username akun Admin/Supervisor"
                  className="w-full rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-purple-600 focus:outline-hidden dark:bg-gray-800 dark:border-purple-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Password Supervisor
                </label>
                <input
                  type="password"
                  required
                  value={supervisorPassword}
                  onChange={(e) => setSupervisorPassword(e.target.value)}
                  placeholder="Password supervisor"
                  className="w-full rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-purple-600 focus:outline-hidden dark:bg-gray-800 dark:border-purple-700 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span>
                Diotorisasi langsung oleh akun Admin yang sedang login saat ini.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/20 disabled:opacity-50 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  <span>Konfirmasi Void</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
