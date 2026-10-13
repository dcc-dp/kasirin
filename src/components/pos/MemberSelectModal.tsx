"use client";

import React, { useState, useEffect } from "react";
import { searchMembers, createMember } from "@/actions/member";
import { maskPhoneNumber } from "@/lib/privacy";
import { formatRupiah } from "@/lib/financial";
import {
  Coins,
  Crown,
  Phone,
  Plus,
  Search,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
  Check,
} from "lucide-react";

export interface SelectedMemberData {
  id: number;
  nama: string;
  phone: string;
  poin: number;
  pointsToRedeem?: number;
  pointDiscountAmount?: number;
}

interface MemberSelectModalProps {
  isOpen: boolean;
  currentMember: SelectedMemberData | null;
  subtotal: number;
  onSelectMember: (member: SelectedMemberData | null) => void;
  onClose: () => void;
}

export default function MemberSelectModal({
  isOpen,
  currentMember,
  subtotal,
  onSelectMember,
  onClose,
}: MemberSelectModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "register">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Quick Register Form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Redeem Poin State
  const [redeemPoints, setRedeemPoints] = useState<number>(
    currentMember?.pointsToRedeem || 0
  );

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setActiveTab("search");
      setRedeemPoints(currentMember?.pointsToRedeem || 0);
      setRegisterError(null);
    }
  }, [isOpen, currentMember]);

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

  // Live member search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchMembers(searchQuery);
        setSearchResults(res || []);
      } catch (err) {
        console.error("Search member error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Konversi poin: 1 poin = Rp 100
  const POINT_VALUE_RUPIAH = 100;

  const handlePickMember = (m: any) => {
    const memberPoints = m.poin || 0;
    // Hitung default redeem jika kasir memilih
    const maxRedeemablePoints = Math.min(
      memberPoints,
      Math.floor(subtotal / POINT_VALUE_RUPIAH)
    );
    const chosenRedeem = Math.min(redeemPoints, maxRedeemablePoints);

    onSelectMember({
      id: m.id,
      nama: m.nama,
      phone: m.phone,
      poin: memberPoints,
      pointsToRedeem: chosenRedeem,
      pointDiscountAmount: chosenRedeem * POINT_VALUE_RUPIAH,
    });
    onClose();
  };

  const handleSavePointsOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;

    const maxRedeemablePoints = Math.min(
      currentMember.poin,
      Math.floor(subtotal / POINT_VALUE_RUPIAH)
    );
    const validPoints = Math.max(0, Math.min(redeemPoints, maxRedeemablePoints));

    onSelectMember({
      ...currentMember,
      pointsToRedeem: validPoints,
      pointDiscountAmount: validPoints * POINT_VALUE_RUPIAH,
    });
    onClose();
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!newName.trim() || !newPhone.trim()) {
      setRegisterError("Nama dan nomor WhatsApp wajib diisi.");
      return;
    }

    try {
      setRegistering(true);
      const res = await createMember({
        nama: newName.trim(),
        phone: newPhone.trim(),
        address: newAddress.trim() || undefined,
      });

      if (!res.success) {
        setRegisterError(res.message);
        return;
      }

      // Otomatis jadikan member aktif
      onSelectMember({
        id: res.data?.id || 0,
        nama: newName.trim(),
        phone: newPhone.trim(),
        poin: 0,
        pointsToRedeem: 0,
        pointDiscountAmount: 0,
      });
      onClose();
    } catch (err: any) {
      console.error("Register member error:", err);
      setRegisterError(err?.message || "Gagal mendaftarkan member baru.");
    } finally {
      setRegistering(false);
    }
  };

  const handleRemoveMember = () => {
    onSelectMember(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Member & Pelanggan Loyal
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih akun member untuk perolehan & penukaran poin
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

        {/* Tab Navigasi */}
        <div className="flex border-b border-gray-100 px-5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition ${
              activeTab === "search"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Search className="h-4 w-4" />
            Cari / Pilih Member
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition ${
              activeTab === "register"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Daftar Member Cepat
          </button>
        </div>

        {activeTab === "search" ? (
          <div className="p-5 space-y-4">
            {/* Status Member Terpilih Saat Ini */}
            {currentMember && (
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-purple-950 dark:text-purple-200">
                        {currentMember.nama}
                      </p>
                      <p className="text-[11px] text-purple-700 dark:text-purple-400">
                        {maskPhoneNumber(currentMember.phone)} • Saldo:{" "}
                        <strong className="text-purple-900 dark:text-purple-200">
                          {currentMember.poin} Poin
                        </strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveMember}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Lepas
                  </button>
                </div>

                {/* Redeem Poin Section */}
                {currentMember.poin > 0 && (
                  <form onSubmit={handleSavePointsOnly} className="pt-2 border-t border-purple-200/60 dark:border-purple-900/40">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-amber-500" />
                        Tukarkan Poin Belanja:
                      </span>
                      <span className="text-[11px] text-purple-700 dark:text-purple-300">
                        1 Poin = Rp {POINT_VALUE_RUPIAH}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max={Math.min(
                            currentMember.poin,
                            Math.floor(subtotal / POINT_VALUE_RUPIAH)
                          )}
                          value={redeemPoints || ""}
                          onChange={(e) =>
                            setRedeemPoints(
                              Math.min(
                                currentMember.poin,
                                Math.max(0, Number(e.target.value))
                              )
                            )
                          }
                          placeholder="Jumlah poin ditukar"
                          className="w-full rounded-xl border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 focus:border-purple-600 focus:outline-hidden dark:bg-gray-800 dark:border-purple-700 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRedeemPoints(
                            Math.min(
                              currentMember.poin,
                              Math.floor(subtotal / POINT_VALUE_RUPIAH)
                            )
                          )
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 text-xs font-bold hover:bg-purple-200"
                      >
                        Maksimal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
                      >
                        Pasang
                      </button>
                    </div>
                    {redeemPoints > 0 && (
                      <p className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 mt-1.5">
                        Potongan dari Poin: -{formatRupiah(redeemPoints * POINT_VALUE_RUPIAH)}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Input Search Member */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Cari Berdasarkan Nama atau Nomor WhatsApp
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik minimal 2 karakter (cth: Budi, 0812...)"
                  className="w-full rounded-xl border border-gray-300 bg-transparent pl-10 pr-4 py-2.5 text-xs text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
            </div>

            {/* List Hasil Pencarian */}
            <div className="max-h-[35vh] overflow-y-auto space-y-2">
              {isSearching ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  Mencari data member...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handlePickMember(m)}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40 hover:border-brand-400 dark:hover:border-brand-600 cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {m.nama}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {maskPhoneNumber(m.phone)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
                        <Coins className="h-3 w-3" />
                        {m.poin} Poin
                      </span>
                    </div>
                  </div>
                ))
              ) : searchQuery.trim().length >= 2 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-gray-500">
                    Tidak ditemukan member dengan kata kunci &quot;{searchQuery}&quot;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(isNaN(Number(searchQuery)) ? searchQuery : "");
                      setNewPhone(!isNaN(Number(searchQuery)) ? searchQuery : "");
                      setActiveTab("register");
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Daftarkan Member Baru?
                  </button>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">
                  Ketik nama atau nomor handphone pelanggan di atas
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={handleRemoveMember}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Gunakan Mode Non-Member (Guest)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleQuickRegister} className="p-5 space-y-4">
            {registerError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50">
                {registerError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Nama Lengkap Pelanggan *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Rian Pratama"
                className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-xs text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Nomor WhatsApp / HP *
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-xs text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Alamat (Opsional)
              </label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Contoh: Yogyakarta"
                className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2 text-xs text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={registering}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-xs font-bold text-white hover:bg-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {registering ? "Mendaftarkan..." : "Daftar & Pilih"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
