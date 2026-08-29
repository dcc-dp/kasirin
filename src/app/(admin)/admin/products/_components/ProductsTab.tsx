"use client";

import { useEffect, useState } from "react";

import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "@/actions/product";

import { getCategories } from "@/actions/category";
import { getUnits } from "@/actions/unit";

type Category = {
  id: number;
  name: string;
};

type Unit = {
  id: number;
  name: string;
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
  created_at: Date | string;
  updated_at: Date | string;
  category?: {
    id: number;
    name: string;
  } | null;
  unit?: {
    id: number;
    name: string;
  } | null;
};

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [deletingProduct, setDeletingProduct] =
    useState<Product | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ==================================================
  // LOAD DATA
  // ==================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [productData, categoryData, unitData] =
        await Promise.all([
          getProducts(),
          getCategories(),
          getUnits(),
        ]);

      setProducts(productData as Product[]);
      setCategories(categoryData as Category[]);
      setUnits(unitData as Unit[]);
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

  // ==================================================
  // RESET FORM
  // ==================================================

  const resetForm = () => {
    setCategoryId("");
    setUnitId("");
    setBarcode("");
    setName("");
    setDescription("");
    setPurchasePrice("");
    setSellingPrice("");
    setStock("");
    setEditingProduct(null);
  };

  // ==================================================
  // CREATE
  // ==================================================

  const openCreateModal = () => {
    resetForm();

    setShowModal(true);
  };

  // ==================================================
  // EDIT
  // ==================================================

  const openEditModal = (product: Product) => {
    setEditingProduct(product);

    setCategoryId(String(product.category_id));
    setUnitId(String(product.unit_id));
    setBarcode(product.barcode);
    setName(product.name);
    setDescription(product.description || "");

    setPurchasePrice(
      String(product.purchase_price)
    );

    setSellingPrice(
      String(product.selling_price)
    );

    setStock(String(product.stock));

    setShowModal(true);
  };

  // ==================================================
  // CLOSE MODAL
  // ==================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);

    resetForm();
  };

  // ==================================================
  // SUBMIT
  // ==================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!categoryId) {
      alert("Kategori wajib dipilih.");
      return;
    }

    if (!unitId) {
      alert("Satuan wajib dipilih.");
      return;
    }

    if (!name.trim()) {
      alert("Nama produk wajib diisi.");
      return;
    }

    if (!barcode.trim()) {
      alert("Barcode wajib diisi.");
      return;
    }

    if (!purchasePrice) {
      alert("Harga beli wajib diisi.");
      return;
    }

    if (!sellingPrice) {
      alert("Harga jual wajib diisi.");
      return;
    }

    if (stock === "") {
      alert("Stok wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const data = {
        category_id: Number(categoryId),
        unit_id: Number(unitId),
        barcode: barcode.trim(),
        name: name.trim(),
        description: description.trim(),
        purchase_price: Number(purchasePrice),
        selling_price: Number(sellingPrice),
        stock: Number(stock),
      };

      let result;

      if (editingProduct) {
        result = await updateProduct(
          editingProduct.id,
          data
        );
      } else {
        result = await createProduct(data);
      }

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(result.message);

      setShowModal(false);

      resetForm();

      await loadData();
    } catch (error) {
      console.error("Save product error:", error);

      alert(
        "Terjadi kesalahan saat menyimpan produk."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // DELETE MODAL
  // ==================================================

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);

    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeletingProduct(null);

    setShowDeleteModal(false);
  };

  // ==================================================
  // DELETE
  // ==================================================

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

      setShowDeleteModal(false);
      setDeletingProduct(null);

      await loadData();
    } catch (error) {
      console.error("Delete product error:", error);

      alert(
        "Terjadi kesalahan saat menghapus produk."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==================================================
  // FORMAT RUPIAH
  // ==================================================

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (date: Date | string) => {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "-";
    }

    return value.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Daftar Produk
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola produk, kategori, satuan, harga, barcode,
            dan stok produk.
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

      {/* ==================================================
          TABLE
      ================================================== */}

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
                  Harga Beli
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
                    colSpan={9}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Memuat data produk...
                  </td>
                </tr>

              ) : products.length === 0 ? (

                <tr>
                  <td
                    colSpan={9}
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

                    {/* NO */}

                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {index + 1}
                    </td>

                    {/* PRODUK */}

                    <td className="px-6 py-4">

                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {product.name}
                        </p>

                        {product.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                            {product.description}
                          </p>
                        )}
                      </div>

                    </td>

                    {/* BARCODE */}

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {product.barcode}
                    </td>

                    {/* KATEGORI */}

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {product.category?.name ||
                        categories.find(
                          (category) =>
                            category.id ===
                            product.category_id
                        )?.name ||
                        "-"}
                    </td>

                    {/* SATUAN */}

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {product.unit?.name ||
                        units.find(
                          (unit) =>
                            unit.id ===
                            product.unit_id
                        )?.name ||
                        "-"}
                    </td>

                    {/* HARGA BELI */}

                    <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                      {formatRupiah(
                        product.purchase_price
                      )}
                    </td>

                    {/* HARGA JUAL */}

                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-800 dark:text-white">
                      {formatRupiah(
                        product.selling_price
                      )}
                    </td>

                    {/* STOK */}

                    <td className="px-6 py-4 text-center">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          product.stock <= 0
                            ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                            : product.stock <= 5
                            ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400"
                            : "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                        }`}
                      >
                        {product.stock}
                      </span>

                    </td>

                    {/* AKSI */}

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

      {/* ==================================================
          CREATE / EDIT MODAL
      ================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">

            {/* HEADER */}

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {editingProduct
                    ? "Edit Produk"
                    : "Tambah Produk"}
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {editingProduct
                    ? "Perbarui informasi produk."
                    : "Tambahkan produk baru ke dalam sistem."}
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

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* KATEGORI + SATUAN */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* KATEGORI */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kategori
                  </label>

                  <select
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(e.target.value)
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >

                    <option value="">
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

                {/* SATUAN */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Satuan
                  </label>

                  <select
                    value={unitId}
                    onChange={(e) =>
                      setUnitId(e.target.value)
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >

                    <option value="">
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

              </div>

              {/* NAMA */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nama Produk
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Contoh: Aqua 600ml"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />

              </div>

              {/* BARCODE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Barcode
                </label>

                <input
                  type="text"
                  value={barcode}
                  onChange={(e) =>
                    setBarcode(e.target.value)
                  }
                  placeholder="Contoh: 8999999999999"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />

              </div>

              {/* DESKRIPSI */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deskripsi
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Masukkan deskripsi produk..."
                  rows={3}
                  disabled={saving}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />

              </div>

              {/* HARGA */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* HARGA BELI */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Harga Beli
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) =>
                      setPurchasePrice(
                        e.target.value
                      )
                    }
                    placeholder="Contoh: 5000"
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />

                </div>

                {/* HARGA JUAL */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Harga Jual
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(
                        e.target.value
                      )
                    }
                    placeholder="Contoh: 7000"
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                  />

                </div>

              </div>

              {/* STOK */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stok Awal
                </label>

                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value)
                  }
                  placeholder="Contoh: 100"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />

              </div>

              {/* BUTTON */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">

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

      {/* ==================================================
          DELETE CONFIRMATION
      ================================================== */}

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

            <p className="mt-2 text-sm text-red-500">
              Produk yang sudah memiliki transaksi
              sebaiknya tidak dihapus.
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
