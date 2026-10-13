"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/financial";
import { playPosBeep } from "@/lib/audio";
import { useTheme } from "@/context/ThemeContext";
import { logout } from "@/actions/auth";
import type { ActiveShiftData, CloseShiftResult } from "@/actions/shift";
import { getActiveShift } from "@/actions/shift";
import type { CartItemInput, ReceiptDetail } from "@/actions/transaction";

// Modals
import OpenShiftModal from "@/components/shift/OpenShiftModal";
import PettyCashModal from "@/components/shift/PettyCashModal";
import CloseShiftModal from "@/components/shift/CloseShiftModal";
import ZReportModal from "@/components/shift/ZReportModal";
import ReceiptModal from "@/components/pos/ReceiptModal";
import PaymentModal from "@/components/pos/PaymentModal";
import DiscountModal from "@/components/pos/DiscountModal";
import MemberSelectModal, {
  type SelectedMemberData,
} from "@/components/pos/MemberSelectModal";
import HelpShortcutModal from "@/components/pos/HelpShortcutModal";

// Icons
import {
  Barcode,
  Clock,
  Coins,
  CreditCard,
  Crown,
  HelpCircle,
  Keyboard,
  Layers,
  LayoutDashboard,
  LogOut,
  Minus,
  Moon,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Store,
  Sun,
  Tag,
  Trash2,
  UserCheck,
  UserPlus,
  Wallet,
  X,
  Zap,
} from "lucide-react";

export interface ProductItem {
  id: number;
  barcode: string;
  name: string;
  description?: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  category_id?: number | null;
  category_name?: string | null;
  unit_name?: string | null;
}

export interface PosTerminalViewProps {
  initialProducts: ProductItem[];
  categories: { id: number; name: string }[];
  initialActiveShift: ActiveShiftData | null;
  currentUser: {
    id: number;
    name: string;
    roleCode: string;
  } | null;
}

export interface CartItem {
  product_id: number;
  barcode: string;
  name: string;
  selling_price: number;
  quantity: number;
  stock: number;
  unit_name?: string | null;
  subtotal: number;
}

export default function PosTerminalView({
  initialProducts,
  categories,
  initialActiveShift,
  currentUser,
}: PosTerminalViewProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // State Produk & Filter
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State Shift
  const [activeShift, setActiveShift] = useState<ActiveShiftData | null>(
    initialActiveShift
  );
  const [isPendingShift, startTransitionShift] = useTransition();

  // State Keranjang Belanja
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<SelectedMemberData | null>(
    null
  );
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountNote, setDiscountNote] = useState<string>("");

  // State Jam Real-Time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // State Modals
  const [isOpenShiftModal, setIsOpenShiftModal] = useState<boolean>(
    !initialActiveShift
  );
  const [isPettyCashModal, setIsPettyCashModal] = useState<boolean>(false);
  const [isCloseShiftModal, setIsCloseShiftModal] = useState<boolean>(false);
  const [isZReportModal, setIsZReportModal] = useState<boolean>(false);
  const [lastZReportData, setLastZReportData] = useState<CloseShiftResult | null>(
    null
  );

  const [isPaymentModal, setIsPaymentModal] = useState<boolean>(false);
  const [isDiscountModal, setIsDiscountModal] = useState<boolean>(false);
  const [isMemberModal, setIsMemberModal] = useState<boolean>(false);
  const [isHelpModal, setIsHelpModal] = useState<boolean>(false);
  const [isReceiptModal, setIsReceiptModal] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<ReceiptDetail | null>(null);

  // Update Jam Real-Time tiap 1 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Perbarui status shift jika prop berubah
  useEffect(() => {
    setActiveShift(initialActiveShift);
    if (!initialActiveShift) {
      setIsOpenShiftModal(true);
    }
  }, [initialActiveShift]);

  // Fungsi reload shift aktif
  const reloadShiftData = async () => {
    startTransitionShift(async () => {
      try {
        const updated = await getActiveShift();
        setActiveShift(updated);
        if (!updated) {
          setIsOpenShiftModal(true);
        }
      } catch (err) {
        console.error("Failed to refresh shift:", err);
      }
    });
  };

  // Keyboard Shortcuts & Barcode Scanner Buffer
  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Jangan cegat hotkeys jika sedang mengetik di input form selain search kasir
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";
      const isSearchInput = activeEl === searchInputRef.current;

      // Handle Hotkeys F1 - F8
      if (e.key === "F1") {
        e.preventDefault();
        setIsHelpModal(true);
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === "F3") {
        e.preventDefault();
        setIsMemberModal(true);
        return;
      }

      if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) {
          setIsDiscountModal(true);
        }
        return;
      }

      if (e.key === "F7") {
        e.preventDefault();
        if (cart.length > 0) {
          if (confirm("Kosongkan semua barang dari keranjang belanja?")) {
            setCart([]);
            setDiscountAmount(0);
            setSelectedMember(null);
          }
        }
        return;
      }

      if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          if (!activeShift) {
            setIsOpenShiftModal(true);
            return;
          }
          setIsPaymentModal(true);
        }
        return;
      }

      // Space untuk checkout cepat jika tidak sedang fokus di form input
      if (e.code === "Space" && !isInput && cart.length > 0) {
        e.preventDefault();
        if (!activeShift) {
          setIsOpenShiftModal(true);
          return;
        }
        setIsPaymentModal(true);
        return;
      }

      // Deteksi Scanner Hardware USB/Bluetooth Barcode
      const currentTimeMs = Date.now();
      if (currentTimeMs - lastKeyTime > 100) {
        barcodeBuffer = "";
      }
      lastKeyTime = currentTimeMs;

      if (e.key === "Enter") {
        if (barcodeBuffer.length >= 3 && !isInput) {
          e.preventDefault();
          const found = products.find(
            (p) =>
              p.barcode.toLowerCase() === barcodeBuffer.trim().toLowerCase()
          );
          if (found) {
            addToCart(found);
            barcodeBuffer = "";
          } else {
            playPosBeep("error");
            barcodeBuffer = "";
          }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, products, activeShift]);

  // Tambah produk ke keranjang belanja
  const addToCart = (product: ProductItem) => {
    if (!activeShift) {
      setIsOpenShiftModal(true);
      return;
    }

    if (product.stock <= 0) {
      playPosBeep("error");
      alert(`Stok produk "${product.name}" telah habis.`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.product_id === product.id
      );

      if (existingIndex >= 0) {
        const item = prev[existingIndex];
        if (item.quantity + 1 > product.stock) {
          playPosBeep("error");
          alert(
            `Kuantitas melebihi stok yang tersedia (${product.stock} ${
              product.unit_name || "pcs"
            }).`
          );
          return prev;
        }

        playPosBeep("scan");
        const nextCart = [...prev];
        nextCart[existingIndex] = {
          ...item,
          quantity: item.quantity + 1,
          subtotal: (item.quantity + 1) * item.selling_price,
        };
        return nextCart;
      } else {
        playPosBeep("scan");
        return [
          ...prev,
          {
            product_id: product.id,
            barcode: product.barcode,
            name: product.name,
            selling_price: product.selling_price,
            quantity: 1,
            stock: product.stock,
            unit_name: product.unit_name,
            subtotal: product.selling_price,
          },
        ];
      }
    });
  };

  // Ubah kuantitas produk di keranjang
  const updateQuantity = (productId: number, nextQty: number) => {
    if (nextQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && nextQty > prod.stock) {
      playPosBeep("error");
      alert(`Stok maksimal hanya tersisa ${prod.stock}.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          return {
            ...item,
            quantity: nextQty,
            subtotal: nextQty * item.selling_price,
          };
        }
        return item;
      })
    );
  };

  // Hapus item dari keranjang
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((it) => it.product_id !== productId));
  };

  // Filter Produk
  const filteredProducts = products.filter((prod) => {
    const matchCategory =
      selectedCategory === "all" || prod.category_id === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Handle Search Input Submit (Enter untuk langsung tambah barang pertama jika cocok)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Cek apakah persis barcode
    const exactBarcode = products.find(
      (p) => p.barcode.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (exactBarcode) {
      addToCart(exactBarcode);
      setSearchQuery("");
      return;
    }

    // Jika filter menghasilkan tepat 1 produk, tambahkan langsung
    if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchQuery("");
    }
  };

  // Kalkulasi Finansial Keranjang
  const rawSubtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const pointDiscount = selectedMember?.pointDiscountAmount || 0;
  const grandTotal = Math.max(0, rawSubtotal - discountAmount - pointDiscount);

  // Callback Sukses Pembayaran
  const handleCheckoutSuccess = (receipt: ReceiptDetail) => {
    // Kurangi stok di UI lokal secara optimistik
    setProducts((prev) =>
      prev.map((p) => {
        const sold = cart.find((c) => c.product_id === p.id);
        if (sold) {
          return { ...p, stock: Math.max(0, p.stock - sold.quantity) };
        }
        return p;
      })
    );

    // Reset keranjang belanja
    setCart([]);
    setSelectedMember(null);
    setDiscountAmount(0);
    setDiscountNote("");

    // Buka struk nota belanja
    setIsPaymentModal(false);
    setReceiptData(receipt);
    setIsReceiptModal(true);

    // Refresh ringkasan kas shift
    reloadShiftData();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      {/* ===================== TOP HEADER POS ===================== */}
      <header className="h-16 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between shadow-2xs z-30">
        {/* Brand & Jam */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white font-black shadow-md shadow-brand-500/30">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">
                  KASIRIN POS
                </h1>
                <span className="bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                •{" "}
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {currentTime.toLocaleTimeString("id-ID")}
                </span>
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-gray-800" />

          {/* Indikator Status Shift */}
          <div className="flex items-center gap-2">
            {activeShift ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Shift #{activeShift.id}</span>
                  <span className="text-gray-400">•</span>
                  <span>{activeShift.user_name || currentUser?.name}</span>
                </div>

                {/* Petty Cash Button */}
                <button
                  type="button"
                  onClick={() => setIsPettyCashModal(true)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  title="Catat Kas Masuk / Kas Keluar Operasional Toko"
                >
                  <Wallet className="h-3.5 w-3.5 text-amber-500" />
                  <span>Kas Kecil</span>
                </button>

                {/* Close Shift Button */}
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModal(true)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  title="Tutup Register Shift & Cetak Z-Report"
                >
                  <LockShiftIcon className="h-3.5 w-3.5" />
                  <span>Tutup Shift</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-sm animate-bounce"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Buka Shift Kasir</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & User Header */}
        <div className="flex items-center gap-2">
          {/* Shortcut Guide Button */}
          <button
            type="button"
            onClick={() => setIsHelpModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition"
            title="Panduan Shortcut Keyboard (F1)"
          >
            <Keyboard className="h-4 w-4 text-brand-500" />
            <span className="hidden sm:inline">Shortcut [F1]</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
            title="Ganti Tema Gelap / Terang"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Admin Dashboard Link (Jika User ADM/Owner) */}
          {currentUser?.roleCode !== "KSR" && (
            <Link
              href="/admin/dashboard"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Kembali ke Panel Administrasi"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          )}

          {/* Logout Action */}
          <form action={logout}>
            <button
              type="submit"
              className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              title="Keluar Akun"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* ===================== BODY POS LAYOUT ===================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2.5 sm:p-3.5 gap-3.5">
        {/* ===================== SISI KIRI: KATALOG PRODUK ===================== */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-2xs overflow-hidden">
          {/* Barcode Search & Kategori Toolbar */}
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
            {/* Search Input Barcode & Nama */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode USB atau ketik nama barang... [F2]"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-11 pr-24 py-2.5 text-xs sm:text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800/60 dark:text-white dark:placeholder-gray-500 dark:focus:bg-gray-900 transition"
                autoFocus
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-gray-400 bg-gray-200/80 rounded dark:bg-gray-700 dark:text-gray-300">
                  F2
                </kbd>
              </div>
            </form>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-bold transition ${
                  selectedCategory === "all"
                    ? "bg-brand-500 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                Semua Produk ({products.length})
              </button>

              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.category_id === cat.id
                ).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl font-bold transition ${
                      selectedCategory === cat.id
                        ? "bg-brand-500 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid Catalog */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                  <Package className="h-7 w-7" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                  Tidak Ada Produk Ditemukan
                </h4>
                <p className="mt-1 text-xs text-gray-500 max-w-xs">
                  Coba gunakan kata kunci pencarian barcode atau ganti kategori.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-3 text-xs font-bold text-brand-600 hover:underline"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
                {filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= 5;
                  const inCartItem = cart.find((c) => c.product_id === prod.id);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => !isOutOfStock && addToCart(prod)}
                      className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition text-left select-none ${
                        isOutOfStock
                          ? "opacity-60 bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-800 cursor-not-allowed"
                          : inCartItem
                          ? "bg-brand-50/40 border-brand-400 shadow-xs cursor-pointer hover:shadow-md dark:bg-brand-950/20 dark:border-brand-700"
                          : "bg-white border-gray-200 hover:border-brand-300 hover:shadow-md dark:bg-gray-800/80 dark:border-gray-700/80 cursor-pointer"
                      }`}
                    >
                      {/* Badge Kuantitas di Keranjang */}
                      {inCartItem && (
                        <span className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-brand-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-brand-500/40 ring-2 ring-white dark:ring-gray-900">
                          {inCartItem.quantity}
                        </span>
                      )}

                      <div>
                        {/* Kategori & Barcode */}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1">
                          <span className="truncate max-w-[80px]">
                            {prod.category_name || "Umum"}
                          </span>
                          <span className="font-mono">{prod.barcode}</span>
                        </div>

                        {/* Nama Produk */}
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400">Harga Satuan</p>
                          <p className="text-xs sm:text-sm font-extrabold text-brand-600 dark:text-brand-400">
                            {formatRupiah(prod.selling_price)}
                          </p>
                        </div>

                        {/* Status Stok */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isOutOfStock
                              ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                              : isLowStock
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {isOutOfStock
                            ? "Habis"
                            : `${prod.stock} ${prod.unit_name || ""}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===================== SISI KANAN: KERANJANG BELANJA & CHECKOUT ===================== */}
        <div className="w-full lg:w-[390px] xl:w-[440px] shrink-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-2xs overflow-hidden">
          {/* Header Cart & Member Quick Select */}
          <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Keranjang Belanja
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {cart.length} Jenis Barang ({cart.reduce((a, b) => a + b.quantity, 0)} Pcs)
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Kosongkan keranjang belanja?")) {
                      setCart([]);
                      setDiscountAmount(0);
                      setSelectedMember(null);
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 p-1 rounded"
                  title="Kosongkan Keranjang (F7)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset [F7]</span>
                </button>
              )}
            </div>

            {/* Member Card Bar */}
            <div
              onClick={() => setIsMemberModal(true)}
              className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/70 hover:bg-gray-100/70 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:bg-gray-800 cursor-pointer transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Crown
                  className={`h-4 w-4 shrink-0 ${
                    selectedMember ? "text-purple-600" : "text-gray-400"
                  }`}
                />
                <div className="truncate">
                  {selectedMember ? (
                    <p className="text-xs font-bold text-purple-900 dark:text-purple-300 truncate">
                      {selectedMember.nama} • {selectedMember.poin} Poin
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Pelanggan Non-Member (Umum)
                    </p>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-extrabold text-brand-600 dark:text-brand-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
                Pilih [F3]
              </span>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <ShoppingCart className="h-10 w-10 text-gray-300 dark:text-gray-700 stroke-1" />
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-2">
                  Keranjang Masih Kosong
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 max-w-[200px]">
                  Pilih produk dari katalog atau scan barcode barang dengan scanner [F2]
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product_id}
                  className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h5>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {formatRupiah(item.selling_price)} / {item.unit_name || "item"}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white shrink-0">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>

                  {/* Quantity Stepper & Delete */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1)
                        }
                        className="h-6 w-6 rounded flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.product_id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-10 text-center text-xs font-bold bg-transparent text-gray-900 dark:text-white focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                        className="h-6 w-6 rounded flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ringkasan Biaya & Checkout Footer */}
          <div className="p-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/60 space-y-2.5">
            {/* Rincian Finansial */}
            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} item)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatRupiah(rawSubtotal)}
                </span>
              </div>

              {/* Diskon Row */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsDiscountModal(true)}
                  className="inline-flex items-center gap-1 font-bold text-amber-600 hover:underline"
                >
                  <Tag className="h-3 w-3" />
                  <span>Diskon Promo [F4]</span>
                </button>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {discountAmount > 0 ? `-${formatRupiah(discountAmount)}` : "Rp 0"}
                </span>
              </div>

              {/* Poin Row jika ada */}
              {pointDiscount > 0 && (
                <div className="flex justify-between items-center text-purple-600 dark:text-purple-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    Potongan Poin Member ({selectedMember?.pointsToRedeem} Pts)
                  </span>
                  <span className="font-bold">-{formatRupiah(pointDiscount)}</span>
                </div>
              )}

              {/* Grand Total Box */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700/80 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  TOTAL TAGIHAN
                </span>
                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>

            {/* Tombol Checkout & Pembayaran */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                if (!activeShift) {
                  setIsOpenShiftModal(true);
                  return;
                }
                setIsPaymentModal(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-4 text-sm font-extrabold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.98]"
            >
              <CreditCard className="h-5 w-5" />
              <span>BAYAR SEKARANG [SPACE / F8]</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== POP-UP MODAL ENGINE ===================== */}

      {/* Modal Buka Shift Kasir */}
      <OpenShiftModal
        isOpen={isOpenShiftModal}
        onClose={() => {
          if (activeShift) {
            setIsOpenShiftModal(false);
          }
        }}
        onSuccess={async () => {
          setIsOpenShiftModal(false);
          await reloadShiftData();
        }}
      />

      {/* Modal Mutasi Petty Cash Masuk/Keluar */}
      {activeShift && (
        <PettyCashModal
          isOpen={isPettyCashModal}
          shiftId={activeShift.id}
          onClose={() => setIsPettyCashModal(false)}
          onSuccess={async () => {
            setIsPettyCashModal(false);
            await reloadShiftData();
          }}
        />
      )}

      {/* Modal Tutup Shift Kasir */}
      {activeShift && (
        <CloseShiftModal
          isOpen={isCloseShiftModal}
          shiftData={activeShift}
          onClose={() => setIsCloseShiftModal(false)}
          onSuccess={(result) => {
            setIsCloseShiftModal(false);
            setLastZReportData(result);
            setIsZReportModal(true);
            setActiveShift(null);
          }}
        />
      )}

      {/* Modal Cetak Z-Report Tutup Shift */}
      {lastZReportData && (
        <ZReportModal
          isOpen={isZReportModal}
          data={lastZReportData}
          onClose={() => {
            setIsZReportModal(false);
            setIsOpenShiftModal(true);
          }}
        />
      )}

      {/* Modal Bayar (PaymentModal) */}
      <PaymentModal
        isOpen={isPaymentModal}
        items={cart.map((c) => ({
          product_id: c.product_id,
          name: c.name,
          quantity: c.quantity,
          selling_price: c.selling_price,
          subtotal: c.subtotal,
        }))}
        subtotal={rawSubtotal}
        discount={discountAmount}
        tax={0}
        grandTotal={grandTotal}
        memberId={selectedMember?.id || null}
        pointsRedeemed={selectedMember?.pointsToRedeem || 0}
        onClose={() => setIsPaymentModal(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Modal Diskon Transaksi (DiscountModal) */}
      <DiscountModal
        isOpen={isDiscountModal}
        subtotal={rawSubtotal}
        currentDiscount={discountAmount}
        onApplyDiscount={(amount, note) => {
          setDiscountAmount(amount);
          setDiscountNote(note || "");
        }}
        onClose={() => setIsDiscountModal(false)}
      />

      {/* Modal Pilih / Daftar Member (MemberSelectModal) */}
      <MemberSelectModal
        isOpen={isMemberModal}
        currentMember={selectedMember}
        subtotal={rawSubtotal}
        onSelectMember={(m) => setSelectedMember(m)}
        onClose={() => setIsMemberModal(false)}
      />

      {/* Modal Panduan Keyboard Shortcut (HelpShortcutModal) */}
      <HelpShortcutModal
        isOpen={isHelpModal}
        onClose={() => setIsHelpModal(false)}
      />

      {/* Modal Cetak Struk Belanja (ReceiptModal) */}
      <ReceiptModal
        isOpen={isReceiptModal}
        data={receiptData}
        onClose={() => setIsReceiptModal(false)}
        onNewTransaction={() => {
          setIsReceiptModal(false);
          searchInputRef.current?.focus();
        }}
      />
    </div>
  );
}

function LockShiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
