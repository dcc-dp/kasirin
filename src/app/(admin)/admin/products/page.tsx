"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProductOptions,
  getProducts,
  updateProduct,
} from "@/actions/product";
import { formatRupiah, calculateMarkupPercent } from "@/lib/financial";
import { generateRandomBarcode } from "@/lib/barcode";
import ProductNavTabs from "./_components/ProductNavTabs";
import StockOpnameModal from "./_components/StockOpnameModal";
import BarcodeLabelModal from "./_components/BarcodeLabelModal";
import {
  AlertTriangle,
  Barcode,
  Boxes,
  CheckCircle2,
  DollarSign,
  Edit,
  Layers,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

type Category = {
  id: number;
  name: string;
  description: string;
};

type Unit = {
  id: number;
  name: string;
  description: string;
};

type Product = {
  id: number;
  category_id: number;
  unit_id: number;
  barcode: string;
  name: string;
  description: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  category_name: string | null;
  unit_name: string | null;
  created_at: Date;
  updated_at: Date;
};

const emptyForm = {
  category_id: 0,
  unit_id: 0,
  barcode: "",
  name: "",
  description: "",
  purchase_price: 0,
  selling_price: 0,
  stock: 0,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | "all">("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "low" | "out" | "safe">("all");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [activeProductForAction, setActiveProductForAction] = useState<Product | null>(null);

  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productData, optionData] = await Promise.all([
        getProducts(),
        getProductOptions(),
      ]);

      setProducts(productData as Product[]);
      setCategories(optionData.categories as Category[]);
      setUnits(optionData.units as Unit[]);
    } catch (error) {
      console.error("Load products error:", error);
      alert("Gagal mengambil data produk.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Filter Search
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter Category
      const matchesCategory =
        selectedCategoryFilter === "all" || p.category_id === selectedCategoryFilter;

      // Filter Stock Status
      let matchesStock = true;
      if (stockStatusFilter === "out") {
        matchesStock = p.stock <= 0;
      } else if (stockStatusFilter === "low") {
        matchesStock = p.stock > 0 && p.stock <= 5;
      } else if (stockStatusFilter === "safe") {
        matchesStock = p.stock > 5;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategoryFilter, stockStatusFilter]);

  // Inventory Statistics
  const stats = useMemo(() => {
    const totalItems = products.length;
    const outOfStock = products.filter((p) => p.stock <= 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const totalAssetValue = products.reduce((acc, p) => acc + p.stock * p.purchase_price, 0);

    return { totalItems, outOfStock, lowStock, totalAssetValue };
  }, [products]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      category_id: product.category_id,
      unit_id: product.unit_id,
      barcode: product.barcode,
      name: product.name,
      description: product.description || "",
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      stock: product.stock,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate Barcode acak jika barang belum memiliki barcode pabrik
  const handleGenerateBarcode = () => {
    const newBarcode = generateRandomBarcode();
    handleChange("barcode", newBarcode);
  };

  // Terapkan persentase markup harga jual otomatis
  const applyMarkupPreset = (percent: number) => {
    const base = Number(form.purchase_price) || 0;
    if (base > 0) {
      const calculatedSelling = Math.round(base * (1 + percent / 100));
      handleChange("selling_price", calculatedSelling);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.barcode.trim()) {
      alert("Barcode wajib diisi.");
      return;
    }

    if (!form.name.trim()) {
      alert("Nama produk wajib diisi.");
      return;
    }

    if (!form.category_id) {
      alert("Silakan pilih kategori.");
      return;
    }

    if (!form.unit_id) {
      alert("Silakan pilih satuan.");
      return;
    }

    try {
      setSaving(true);

      let result;
      if (editingProduct) {
        result = await updateProduct(editingProduct.id, form);
      } else {
        result = await createProduct(form);
      }

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(result.message);
      closeModal();
      await loadData();
    } catch (error) {
      console.error("Save product error:", error);
      alert("Terjadi kesalahan saat menyimpan produk.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeletingProduct(null);
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      setDeleting(true);
      const result = await deleteProduct(deletingProduct.id);

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(result.message);
      closeDeleteModal();
      await loadData();
    } catch (error) {
      console.error("Delete product error:", error);
      alert("Terjadi kesalahan saat menghapus produk.");
    } finally {
      setDeleting(false);
    }
  };

  // Hitung live margin untuk modal tambah/edit
  const profitNominal = Number(form.selling_price) - Number(form.purchase_price);
  const markupPercent = calculateMarkupPercent(Number(form.purchase_price), Number(form.selling_price));
  const marginPercent =
    Number(form.selling_price) > 0
      ? Math.round((profitNominal / Number(form.selling_price)) * 1000) / 10
      : 0;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10">
      {/* Top Navigation Tabs */}
      <ProductNavTabs />

      {/* Header & Primary Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Katalog Produk & Inventori
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola master barang, harga modal, harga jual, dan audit stok opname.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveProductForAction(null);
              setShowOpnameModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            <RefreshCw className="h-4 w-4 text-brand-500" />
            Stock Opname
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Inventory KPI / Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Katalog
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalItems}
            </span>
            <span className="text-xs text-gray-500">item terdaftar</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Nilai Aset Stok
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(stats.totalAssetValue)}
            </span>
          </div>
        </div>

        <div
          onClick={() => setStockStatusFilter("low")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition-all ${
            stockStatusFilter === "low"
              ? "border-amber-400 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-950/20"
              : "border-gray-200/80 bg-white hover:border-amber-300 dark:border-gray-800 dark:bg-white/[0.03]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Stok Menipis (≤ 5)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.lowStock}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400">perlu restock</span>
          </div>
        </div>

        <div
          onClick={() => setStockStatusFilter("out")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition-all ${
            stockStatusFilter === "out"
              ? "border-red-400 bg-red-50/50 dark:border-red-600 dark:bg-red-950/20"
              : "border-gray-200/80 bg-white hover:border-red-300 dark:border-gray-800 dark:bg-white/[0.03]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Stok Habis (0)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.outOfStock}
            </span>
            <span className="text-xs text-red-700 dark:text-red-400">tidak bisa dijual</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Quick Filter Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/60">
          <button
            type="button"
            onClick={() => setStockStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              stockStatusFilter === "all"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Semua ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter("safe")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              stockStatusFilter === "safe"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-gray-700 dark:text-emerald-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Stok Aman (&gt; 5)
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter("low")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              stockStatusFilter === "low"
                ? "bg-white text-amber-700 shadow-xs dark:bg-gray-700 dark:text-amber-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Menipis ({stats.lowStock})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter("out")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              stockStatusFilter === "out"
                ? "bg-white text-red-700 shadow-xs dark:bg-gray-700 dark:text-red-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Habis ({stats.outOfStock})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / barcode..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) =>
              setSelectedCategoryFilter(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">Produk</th>
                <th className="px-5 py-3.5">Barcode</th>
                <th className="px-5 py-3.5">Kategori & Satuan</th>
                <th className="px-5 py-3.5 text-right">Harga Modal</th>
                <th className="px-5 py-3.5 text-right">Harga Jual</th>
                <th className="px-5 py-3.5 text-center">Margin</th>
                <th className="px-5 py-3.5 text-center">Stok</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                // Shimmer Skeleton Loading
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4 text-center">
                      <div className="h-4 w-4 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800 mb-1.5" />
                      <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-850" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-4 w-12 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-6 w-16 mx-auto rounded-full bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 w-24 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tidak ada produk yang sesuai.
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {searchQuery || stockStatusFilter !== "all" || selectedCategoryFilter !== "all"
                          ? "Coba ubah kata kunci pencarian atau reset filter."
                          : "Mulai tambahkan produk baru untuk mengisi katalog."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => {
                  const unitMarginNominal = product.selling_price - product.purchase_price;
                  const itemMarkup = calculateMarkupPercent(product.purchase_price, product.selling_price);

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.015]"
                    >
                      {/* Index */}
                      <td className="px-5 py-4 text-center text-xs font-medium text-gray-400">
                        {index + 1}
                      </td>

                      {/* Product Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white block">
                              {product.name}
                            </span>
                            {product.description && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {product.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded-md">
                          {product.barcode}
                        </span>
                      </td>

                      {/* Kategori & Satuan */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {product.category_name || "-"}
                          </span>
                          <span className="text-gray-400">
                            Satuan: {product.unit_name || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Harga Beli */}
                      <td className="px-5 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                        {formatRupiah(product.purchase_price)}
                      </td>

                      {/* Harga Jual */}
                      <td className="px-5 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                        {formatRupiah(product.selling_price)}
                      </td>

                      {/* Margin / Markup */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-xs font-bold ${
                              unitMarginNominal > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : unitMarginNominal === 0
                                ? "text-gray-400"
                                : "text-red-500"
                            }`}
                          >
                            +{itemMarkup}%
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatRupiah(unitMarginNominal)}
                          </span>
                        </div>
                      </td>

                      {/* Status Stok */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.stock <= 0
                              ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
                              : product.stock <= 5
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              product.stock <= 0
                                ? "bg-red-500"
                                : product.stock <= 5
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          {product.stock} {product.unit_name || ""}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Cetak Barcode Label */}
                          <button
                            type="button"
                            title="Cetak Label Barcode"
                            onClick={() => {
                              setActiveProductForAction(product);
                              setShowLabelModal(true);
                            }}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-750 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* Stock Opname */}
                          <button
                            type="button"
                            title="Stock Opname Produk Ini"
                            onClick={() => {
                              setActiveProductForAction(product);
                              setShowOpnameModal(true);
                            }}
                            className="rounded-lg border border-gray-200 p-2 text-brand-600 hover:bg-brand-50 dark:border-gray-750 dark:text-brand-400 dark:hover:bg-brand-950/40"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            title="Edit Produk"
                            onClick={() => openEditModal(product)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-750 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Hapus */}
                          <button
                            type="button"
                            title="Hapus Produk"
                            onClick={() => openDeleteModal(product)}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Produk */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingProduct ? "Edit Informasi Produk" : "Tambah Produk Baru"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lengkapi barcode, harga modal, harga jual, dan stok barang
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Barcode Field with Random Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Barcode Produk *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate Acak
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={form.barcode}
                      onChange={(e) => handleChange("barcode", e.target.value)}
                      placeholder="Contoh: 8991234567890"
                      disabled={saving}
                      className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 font-mono text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Nama Produk */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Contoh: Kopi Susu Aren 250ml"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Kategori *
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => handleChange("category_id", Number(e.target.value))}
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  >
                    <option value={0}>Pilih Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-gray-800">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Satuan */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Satuan *
                  </label>
                  <select
                    value={form.unit_id}
                    onChange={(e) => handleChange("unit_id", Number(e.target.value))}
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  >
                    <option value={0}>Pilih Satuan</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id} className="dark:bg-gray-800">
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Harga Beli (Modal) */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Harga Modal / Beli (HPP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.purchase_price}
                    onChange={(e) => handleChange("purchase_price", Number(e.target.value))}
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                  <span className="mt-1 block text-[11px] text-gray-400">
                    {formatRupiah(form.purchase_price)}
                  </span>
                </div>

                {/* Harga Jual with Markup Preset */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Harga Jual Kasir *
                    </label>
                    <div className="flex gap-1 text-[10px]">
                      {[15, 25, 40].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => applyMarkupPreset(p)}
                          className="rounded px-1.5 py-0.5 bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-800 dark:text-gray-300"
                        >
                          +{p}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={form.selling_price}
                    onChange={(e) => handleChange("selling_price", Number(e.target.value))}
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                  <span className="mt-1 block text-[11px] text-gray-400">
                    {formatRupiah(form.selling_price)}
                  </span>
                </div>

                {/* Stok Awal */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {editingProduct ? "Stok Sistem Saat Ini" : "Stok Awal Produk"} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => handleChange("stock", Number(e.target.value))}
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                  {editingProduct && (
                    <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                      * Untuk koreksi fisik riil, gunakan fitur Stock Opname agar tercatat di audit mutasi.
                    </p>
                  )}
                </div>
              </div>

              {/* Profit & Margin Live Calculator Box */}
              <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Kalkulasi Margin Profit:
                  </span>
                  <span
                    className={
                      profitNominal > 0
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : profitNominal === 0
                        ? "text-gray-500"
                        : "text-red-600 font-bold"
                    }
                  >
                    Laba Bersih: {formatRupiah(profitNominal)} / unit
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white p-2 shadow-2xs dark:bg-gray-800">
                    <span className="text-[10px] text-gray-400 block">Markup dari Modal</span>
                    <span className="font-bold text-gray-800 dark:text-white">
                      {markupPercent}%
                    </span>
                  </div>
                  <div className="rounded-lg bg-white p-2 shadow-2xs dark:bg-gray-800">
                    <span className="text-[10px] text-gray-400 block">Margin dari Omzet</span>
                    <span className="font-bold text-gray-800 dark:text-white">
                      {marginPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Deskripsi / Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Catatan rasa, ukuran, lokasi rak toko..."
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-transparent px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 shadow-md shadow-brand-500/20"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingProduct
                    ? "Simpan Perubahan"
                    : "Tambahkan ke Katalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal Confirmation */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Hapus Produk?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Apakah Anda yakin ingin menghapus produk{" "}
              <strong className="text-gray-800 dark:text-white">
                "{deletingProduct.name}"
              </strong>
              ?
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              * Produk yang sudah pernah memiliki transaksi kasir atau restock supplier tidak dapat dihapus demi integritas pembukuan.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-600/20"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Produk"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Opname Modal */}
      <StockOpnameModal
        isOpen={showOpnameModal}
        onClose={() => {
          setShowOpnameModal(false);
          setActiveProductForAction(null);
        }}
        products={products}
        selectedProduct={activeProductForAction}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Barcode & Price Label Print Modal */}
      <BarcodeLabelModal
        isOpen={showLabelModal}
        onClose={() => {
          setShowLabelModal(false);
          setActiveProductForAction(null);
        }}
        product={activeProductForAction}
      />
    </div>
  );
}