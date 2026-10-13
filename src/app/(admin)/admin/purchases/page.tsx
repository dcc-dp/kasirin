"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getPurchases,
  getPurchaseById,
  getPurchaseFormOptions,
  createPurchase,
  type PurchaseListItem,
  type PurchaseDetailView,
  type PurchaseItemInput,
} from "@/actions/purchase";
import { formatRupiah, generatePurchaseInvoice } from "@/lib/financial";
import {
  Boxes,
  Calendar,
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  PackagePlus,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";

type FormProductOption = {
  id: number;
  barcode: string;
  name: string;
  stock: number;
  purchase_price: number;
  selling_price: number;
};

type FormSupplierOption = {
  id: number;
  name: string;
  phone: string;
};

export default function PurchasesPage() {
  const [purchasesList, setPurchasesList] = useState<PurchaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<number | "all">("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [selectedPurchaseDetail, setSelectedPurchaseDetail] =
    useState<PurchaseDetailView | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form State
  const [supplierOptions, setSupplierOptions] = useState<FormSupplierOption[]>([]);
  const [productOptions, setProductOptions] = useState<FormProductOption[]>([]);

  const [formSupplierId, setFormSupplierId] = useState<number>(0);
  const [formInvoice, setFormInvoice] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [formItems, setFormItems] = useState<PurchaseItemInput[]>([
    { product_id: 0, quantity: 1, purchase_price: 0, selling_price: 0 },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getPurchases();
      setPurchasesList(data);
    } catch (error) {
      console.error("Load purchases error:", error);
      alert("Gagal memuat data pembelian.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPurchases = useMemo(() => {
    return purchasesList.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.invoice.toLowerCase().includes(q) ||
        (p.supplier_name && p.supplier_name.toLowerCase().includes(q));

      const matchesSupplier =
        selectedSupplierFilter === "all" || p.supplier_id === selectedSupplierFilter;

      return matchesSearch && matchesSupplier;
    });
  }, [purchasesList, searchQuery, selectedSupplierFilter]);

  const stats = useMemo(() => {
    const totalInvoices = purchasesList.length;
    const totalSpend = purchasesList.reduce((acc, p) => acc + p.total, 0);
    const totalQuantity = purchasesList.reduce((acc, p) => acc + p.total_quantity, 0);
    const uniqueSuppliers = new Set(purchasesList.map((p) => p.supplier_id)).size;

    return { totalInvoices, totalSpend, totalQuantity, uniqueSuppliers };
  }, [purchasesList]);

  const openCreateModal = async () => {
    try {
      const options = await getPurchaseFormOptions();
      setSupplierOptions(options.suppliers);
      setProductOptions(options.products);

      setFormSupplierId(options.suppliers[0]?.id || 0);
      setFormInvoice(generatePurchaseInvoice());
      setFormDate(new Date().toISOString().slice(0, 10));

      const firstProd = options.products[0];
      setFormItems([
        {
          product_id: firstProd?.id || 0,
          quantity: 1,
          purchase_price: firstProd?.purchase_price || 0,
          selling_price: firstProd?.selling_price || 0,
        },
      ]);

      setShowCreateModal(true);
    } catch (error) {
      console.error("Load form options error:", error);
      alert("Gagal memuat data formulir restock.");
    }
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setShowCreateModal(false);
  };

  const openDetailModal = async (id: number) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const detail = await getPurchaseById(id);
      setSelectedPurchaseDetail(detail);
    } catch (error) {
      console.error("Load detail error:", error);
      alert("Gagal memuat rincian faktur pembelian.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPurchaseDetail(null);
  };

  // Form Item Manipulations
  const handleAddItemRow = () => {
    const firstProd = productOptions[0];
    setFormItems((prev) => [
      ...prev,
      {
        product_id: firstProd?.id || 0,
        quantity: 1,
        purchase_price: firstProd?.purchase_price || 0,
        selling_price: firstProd?.selling_price || 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length <= 1) {
      alert("Minimal harus ada 1 barang dalam faktur pembelian.");
      return;
    }
    setFormItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseItemInput,
    value: number
  ) => {
    setFormItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Jika user mengganti produk, isi otomatis default purchase_price & selling_price produk tersebut
      if (field === "product_id") {
        const prod = productOptions.find((p) => p.id === value);
        if (prod) {
          item.purchase_price = prod.purchase_price;
          item.selling_price = prod.selling_price;
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  const formGrandTotal = useMemo(() => {
    return formItems.reduce(
      (sum, item) => sum + (Number(item.purchase_price) || 0) * (Number(item.quantity) || 0),
      0
    );
  }, [formItems]);

  const formTotalQuantity = useMemo(() => {
    return formItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [formItems]);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formSupplierId) {
      alert("Silakan pilih pemasok / supplier.");
      return;
    }

    if (formItems.length === 0) {
      alert("Silakan tambahkan minimal 1 barang.");
      return;
    }

    for (const item of formItems) {
      if (!item.product_id) {
        alert("Pilih produk yang valid di setiap baris.");
        return;
      }
      if (item.quantity <= 0) {
        alert("Jumlah kuantitas masuk harus lebih dari 0.");
        return;
      }
      if (item.purchase_price < 0) {
        alert("Harga beli tidak boleh negatif.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await createPurchase({
        supplier_id: formSupplierId,
        invoice: formInvoice,
        purchase_date: formDate,
        items: formItems,
      });

      if (!res.success) {
        alert(res.message);
        return;
      }

      alert(res.message);
      closeCreateModal();
      await loadData();
    } catch (error) {
      console.error("Submit purchase error:", error);
      alert("Terjadi kesalahan saat memproses restock.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Pembelian & Restock Barang
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pencatatan faktur masuk dari supplier, penambahan stok gudang otomatis, dan pembaruan HPP.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
        >
          <PackagePlus className="h-4 w-4" />
          Catat Restock Baru
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Faktur Pembelian
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalInvoices}
            </span>
            <span className="text-xs text-gray-500">faktur</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Pengeluaran Restock
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(stats.totalSpend)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Barang Masuk
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalQuantity.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-gray-500">unit barang</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Distributor Terkait
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.uniqueSuppliers}
            </span>
            <span className="text-xs text-gray-500">mitra supplier</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor faktur / nama supplier..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Purchase List Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">No. Faktur / Invoice</th>
                <th className="px-5 py-3.5">Tanggal Pembelian</th>
                <th className="px-5 py-3.5">Supplier / Pemasok</th>
                <th className="px-5 py-3.5 text-center">Rincian Barang</th>
                <th className="px-5 py-3.5 text-right">Total Faktur</th>
                <th className="px-5 py-3.5">Petugas</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4 text-center">
                      <div className="h-4 w-4 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-4 w-20 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-24 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 w-16 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                  </tr>
                ))
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <PackagePlus className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Belum ada riwayat pembelian restock.
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Klik tombol "Catat Restock Baru" untuk memasukkan barang kiriman dari supplier.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase, index) => (
                  <tr
                    key={purchase.id}
                    className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.015]"
                  >
                    <td className="px-5 py-4 text-center text-xs font-medium text-gray-400">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-1 rounded">
                        {purchase.invoice}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-300">
                      {purchase.purchase_date
                        ? new Date(purchase.purchase_date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900 dark:text-white block text-sm">
                        {purchase.supplier_name || "Supplier #ID " + purchase.supplier_id}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">{purchase.total_items}</strong> jenis (
                        <strong className="text-brand-600 dark:text-brand-400">{purchase.total_quantity}</strong> pcs)
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                      {formatRupiah(purchase.total)}
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-500">
                      {purchase.user_name || "Admin"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDetailModal(purchase.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Rincian
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Restock Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-4xl flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                  <PackagePlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Catat Restock Masuk dari Supplier
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Stok produk di sistem akan bertambah otomatis dan mutasi tercatat di audit log
                  </p>
                </div>
              </div>
              <button
                onClick={closeCreateModal}
                disabled={submitting}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Header Info Faktur */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/70 dark:border-gray-800">
                {/* Pilih Supplier */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Pemasok / Supplier *
                  </label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(Number(e.target.value))}
                    disabled={submitting}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {supplierOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nomor Faktur */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      No. Faktur / Surat Jalan
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormInvoice(generatePurchaseInvoice())}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      ⚡ Buat Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formInvoice}
                    onChange={(e) => setFormInvoice(e.target.value)}
                    placeholder="Contoh: PUR-20261014-9901"
                    disabled={submitting}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 font-mono text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Tanggal Restock */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tanggal Terima Barang
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Items Restock Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4 text-brand-500" />
                    Daftar Barang yang Diterima ({formItems.length} item)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-lg"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Baris Barang
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full min-w-[700px] text-xs">
                    <thead>
                      <tr className="bg-gray-100/70 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400 text-left border-b border-gray-200 dark:border-gray-800">
                        <th className="p-3 w-48">Pilih Produk</th>
                        <th className="p-3 w-24 text-center">Stok Saat Ini</th>
                        <th className="p-3 w-24 text-center">Qty Masuk</th>
                        <th className="p-3 w-32 text-right">Harga Beli (HPP)</th>
                        <th className="p-3 w-32 text-right">Harga Jual Baru</th>
                        <th className="p-3 w-32 text-right">Subtotal</th>
                        <th className="p-3 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {formItems.map((item, idx) => {
                        const currentProd = productOptions.find((p) => p.id === item.product_id);
                        const rowSubtotal = (Number(item.purchase_price) || 0) * (Number(item.quantity) || 0);

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                            {/* Produk Select */}
                            <td className="p-2.5">
                              <select
                                value={item.product_id}
                                onChange={(e) =>
                                  handleItemChange(idx, "product_id", Number(e.target.value))
                                }
                                disabled={submitting}
                                className="w-full rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              >
                                {productOptions.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.barcode})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Info Stok Lama */}
                            <td className="p-2.5 text-center text-gray-500 font-medium">
                              {currentProd ? `${currentProd.stock} pcs` : "-"}
                            </td>

                            {/* Qty Masuk */}
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(idx, "quantity", Number(e.target.value))
                                }
                                disabled={submitting}
                                className="w-20 rounded-lg border border-gray-300 p-2 text-center text-xs font-bold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                            </td>

                            {/* Harga Beli Satuan */}
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                value={item.purchase_price}
                                onChange={(e) =>
                                  handleItemChange(idx, "purchase_price", Number(e.target.value))
                                }
                                disabled={submitting}
                                className="w-28 rounded-lg border border-gray-300 p-2 text-right text-xs font-semibold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                            </td>

                            {/* Harga Jual Satuan (Update Optional) */}
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                value={item.selling_price || 0}
                                onChange={(e) =>
                                  handleItemChange(idx, "selling_price", Number(e.target.value))
                                }
                                disabled={submitting}
                                className="w-28 rounded-lg border border-gray-300 p-2 text-right text-xs text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              />
                            </td>

                            {/* Subtotal */}
                            <td className="p-2.5 text-right font-bold text-gray-900 dark:text-white">
                              {formatRupiah(rowSubtotal)}
                            </td>

                            {/* Delete Row */}
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                disabled={formItems.length <= 1}
                                className="text-gray-400 hover:text-red-500 disabled:opacity-30 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ringkasan Belanja Box */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800">
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300 mb-2 sm:mb-0">
                  <span>
                    Macam Barang: <strong>{formItems.length} jenis</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Kuantitas: <strong>{formTotalQuantity} pcs</strong>
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs uppercase font-semibold tracking-wider text-gray-500">
                    Grand Total Faktur:
                  </span>
                  <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                    {formatRupiah(formGrandTotal)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeCreateModal}
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
                  {submitting ? "Memproses Restock..." : "Simpan Faktur & Tambah Stok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rincian Faktur Detail View */}
      {showDetailModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Faktur Pembelian #{selectedPurchaseDetail?.invoice}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rincian barang masuk dari supplier dan histori HPP restock
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail || !selectedPurchaseDetail ? (
              <div className="p-10 text-center text-sm text-gray-500">
                Memuat rincian faktur pembelian...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Info Supplier & Faktur Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/70 dark:border-gray-800 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Supplier / Pemasok:</span>
                    <strong className="text-gray-900 dark:text-white block text-sm">
                      {selectedPurchaseDetail.supplier_name}
                    </strong>
                    <span className="text-gray-500 block">{selectedPurchaseDetail.supplier_phone}</span>
                    <span className="text-gray-500 block truncate">{selectedPurchaseDetail.supplier_address}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block mb-0.5">Tanggal Faktur:</span>
                    <strong className="text-gray-900 dark:text-white block">
                      {selectedPurchaseDetail.purchase_date
                        ? new Date(selectedPurchaseDetail.purchase_date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </strong>
                    <span className="text-gray-500 block mt-1">
                      Dicatat oleh: <strong>{selectedPurchaseDetail.user_name || "Admin"}</strong>
                    </span>
                  </div>
                </div>

                {/* Table of items */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100/70 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400 text-left border-b border-gray-200 dark:border-gray-800">
                        <th className="p-3">Nama Produk</th>
                        <th className="p-3 text-center">Kuantitas</th>
                        <th className="p-3 text-right">Harga Modal (HPP)</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedPurchaseDetail.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-semibold text-gray-900 dark:text-white">
                            {it.name}
                          </td>
                          <td className="p-3 text-center font-bold text-brand-600 dark:text-brand-400">
                            {it.quantity} pcs
                          </td>
                          <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                            {formatRupiah(it.purchase_price)}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                            {formatRupiah(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-gray-800 font-bold">
                        <td colSpan={3} className="p-3 text-right uppercase text-gray-500">
                          Total Faktur:
                        </td>
                        <td className="p-3 text-right text-base text-brand-600 dark:text-brand-400">
                          {formatRupiah(selectedPurchaseDetail.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Cetak Salinan Faktur
                  </button>
                  <button
                    type="button"
                    onClick={closeDetailModal}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
