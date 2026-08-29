"use client";

import { useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProductOptions,
  getProducts,
  updateProduct,
} from "@/actions/product";

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

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [deletingProduct, setDeletingProduct] =
    useState<Product | null>(null);

  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productData, optionData] =
        await Promise.all([
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
      description: product.description,
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

  const handleChange = (
    field: keyof typeof form,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
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
        result = await updateProduct(
          editingProduct.id,
          form
        );
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

      const result = await deleteProduct(
        deletingProduct.id
      );

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

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Daftar Produk
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola produk dan stok yang tersedia di toko.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  #
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Produk
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Barcode
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Kategori
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Satuan
                </th>

                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Harga Jual
                </th>

                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  Stok
                </th>

                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Memuat data produk...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Belum ada produk.
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {product.name}
                        </p>

                        {product.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {product.barcode}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {product.category_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {product.unit_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-800 dark:text-white">
                      {formatRupiah(
                        product.selling_price
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          product.stock <= 0
                            ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                            : product.stock <= 5
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                            : "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                        }`}
                      >
                        {product.stock}{" "}
                        {product.unit_name || ""}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(product)
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openDeleteModal(product)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                        >
                          Hapus
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {editingProduct
                    ? "Edit Produk"
                    : "Tambah Produk"}
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Lengkapi informasi produk di bawah.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Barcode */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Barcode
                  </label>

                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) =>
                      handleChange(
                        "barcode",
                        e.target.value
                      )
                    }
                    placeholder="Contoh: 8991234567890"
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Nama */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nama Produk
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      handleChange(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Contoh: Aqua 600ml"
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kategori
                  </label>

                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      handleChange(
                        "category_id",
                        Number(e.target.value)
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  >
                    <option value={0}>
                      Pilih kategori
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Satuan */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Satuan
                  </label>

                  <select
                    value={form.unit_id}
                    onChange={(e) =>
                      handleChange(
                        "unit_id",
                        Number(e.target.value)
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  >
                    <option value={0}>
                      Pilih satuan
                    </option>

                    {units.map((unit) => (
                      <option
                        key={unit.id}
                        value={unit.id}
                      >
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Harga Beli */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Harga Beli
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.purchase_price}
                    onChange={(e) =>
                      handleChange(
                        "purchase_price",
                        Number(e.target.value)
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Harga Jual */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Harga Jual
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.selling_price}
                    onChange={(e) =>
                      handleChange(
                        "selling_price",
                        Number(e.target.value)
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Stok */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stok
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) =>
                      handleChange(
                        "stock",
                        Number(e.target.value)
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deskripsi
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    handleChange(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Deskripsi produk..."
                  disabled={saving}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingProduct
                    ? "Simpan Perubahan"
                    : "Tambah Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Hapus Produk?
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Apakah kamu yakin ingin menghapus produk{" "}
              <strong className="text-gray-800 dark:text-white">
                "{deletingProduct.name}"
              </strong>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-5 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting
                  ? "Menghapus..."
                  : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}