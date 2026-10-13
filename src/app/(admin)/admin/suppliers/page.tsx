"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type SupplierWithStats,
} from "@/actions/supplier";
import { formatRupiah } from "@/lib/financial";
import {
  Building2,
  Edit,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from "lucide-react";

export default function SuppliersPage() {
  const [suppliersList, setSuppliersList] = useState<SupplierWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<SupplierWithStats | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierWithStats | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliersList(data);
    } catch (error) {
      console.error("Load suppliers error:", error);
      alert("Gagal memuat data supplier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliersList.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    });
  }, [suppliersList, searchQuery]);

  const stats = useMemo(() => {
    const totalSuppliers = suppliersList.length;
    const totalPurchases = suppliersList.reduce((acc, s) => acc + s.total_purchases, 0);
    const totalPurchaseAmount = suppliersList.reduce((acc, s) => acc + s.total_purchase_amount, 0);
    const activeSuppliers = suppliersList.filter((s) => s.total_purchases > 0).length;

    return { totalSuppliers, totalPurchases, totalPurchaseAmount, activeSuppliers };
  }, [suppliersList]);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setName("");
    setPhone("");
    setAddress("");
    setEmail("");
    setShowModal(true);
  };

  const openEditModal = (supplier: SupplierWithStats) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setPhone(supplier.phone);
    setAddress(supplier.address);
    setEmail(supplier.email === "-" ? "" : supplier.email);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingSupplier(null);
    setName("");
    setPhone("");
    setAddress("");
    setEmail("");
  };

  const openDeleteModal = (supplier: SupplierWithStats) => {
    setDeletingSupplier(supplier);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeletingSupplier(null);
    setShowDeleteModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Nama distributor/supplier wajib diisi.");
      return;
    }

    if (!phone.trim() || phone.length < 8) {
      alert("Nomor telepon kontak supplier minimal 8 digit.");
      return;
    }

    if (!address.trim()) {
      alert("Alamat kantor/gudang supplier wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      let res;

      if (editingSupplier) {
        res = await updateSupplier(editingSupplier.id, { name, phone, address, email });
      } else {
        res = await createSupplier({ name, phone, address, email });
      }

      if (!res.success) {
        alert(res.message);
        return;
      }

      alert(res.message);
      closeModal();
      await loadData();
    } catch (err) {
      console.error("Save supplier error:", err);
      alert("Terjadi kesalahan saat menyimpan data supplier.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;

    try {
      setDeleting(true);
      const res = await deleteSupplier(deletingSupplier.id);

      if (!res.success) {
        alert(res.message);
        return;
      }

      alert(res.message);
      closeDeleteModal();
      await loadData();
    } catch (err) {
      console.error("Delete supplier error:", err);
      alert("Gagal menghapus supplier.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Master Data Supplier & Pemasok
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola distributor, vendor, kontak pemesanan restock, dan histori pembelian barang.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Tambah Supplier
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Mitra Pemasok
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalSuppliers}
            </span>
            <span className="text-xs text-gray-500">vendor aktif</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Faktur Restock
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalPurchases}
            </span>
            <span className="text-xs text-gray-500">kali pemesanan</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Belanja Restock
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(stats.totalPurchaseAmount)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Vendor Langganan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.activeSuppliers}
            </span>
            <span className="text-xs text-gray-500">memiliki riwayat</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama vendor / telepon / email..."
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

      {/* Supplier Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">Nama Distributor / Vendor</th>
                <th className="px-5 py-3.5">Kontak WhatsApp</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Alamat Gudang / Kantor</th>
                <th className="px-5 py-3.5 text-center">Faktur Restock</th>
                <th className="px-5 py-3.5 text-right">Total Pembelian</th>
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
                      <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-4 w-8 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                  </tr>
                ))
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Truck className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Belum ada supplier terdaftar.
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Tambahkan data distributor / vendor langganan toko untuk memudahkan proses restock.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier, index) => (
                  <tr
                    key={supplier.id}
                    className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.015]"
                  >
                    <td className="px-5 py-4 text-center text-xs font-medium text-gray-400">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                          {supplier.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white block">
                            {supplier.name}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            ID: #{supplier.id.toString().padStart(4, "0")}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {supplier.phone}
                        </span>
                        <a
                          href={`https://wa.me/${supplier.phone.replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Hubungi WhatsApp Pemasok"
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-300">
                      {supplier.email || "-"}
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {supplier.address}
                    </td>

                    <td className="px-5 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {supplier.total_purchases} faktur
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                      {formatRupiah(supplier.total_purchase_amount)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit */}
                        <button
                          type="button"
                          title="Edit Supplier"
                          onClick={() => openEditModal(supplier)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-750 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Hapus */}
                        <button
                          type="button"
                          title="Hapus Supplier"
                          onClick={() => openDeleteModal(supplier)}
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Supplier */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingSupplier ? "Edit Data Supplier" : "Tambah Supplier Baru"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lengkapi kontak distributor dan alamat pengiriman barang
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nama Perusahaan / Distributor *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: PT Sumber Pangan Makmur"
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nomor WhatsApp / Sales *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081298765432"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 font-mono text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Email Kontak (Opsional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@supplier.com"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Alamat Kantor / Gudang *
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap lokasi distributor atau gudang suplai..."
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-transparent px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
              </div>

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
                    : editingSupplier
                    ? "Simpan Perubahan"
                    : "Tambah Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Supplier */}
      {showDeleteModal && deletingSupplier && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Hapus Supplier?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Apakah Anda yakin ingin menghapus supplier{" "}
              <strong className="text-gray-800 dark:text-white">
                "{deletingSupplier.name}"
              </strong>
              ?
            </p>
            {deletingSupplier.total_purchases > 0 && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                ⚠️ Supplier ini memiliki {deletingSupplier.total_purchases} riwayat faktur pembelian restock dan tidak dapat dihapus demi audit akuntansi.
              </p>
            )}

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
                disabled={deleting || deletingSupplier.total_purchases > 0}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-600/20"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
