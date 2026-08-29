"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, AlertTriangle } from "lucide-react";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/category";

type Category = {
  id: number;
  name: string;
  description: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export default function CategoriesTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // =========================
  // LOAD CATEGORIES
  // =========================
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const data = await getCategories();

      setCategories(data as Category[]);
    } catch (error) {
      console.error("Gagal mengambil kategori:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // TAMBAH / EDIT
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    let result;

    if (editingId !== null) {
      result = await updateCategory(
        editingId,
        name,
        description
      );
    } else {
      result = await createCategory(
        name,
        description
      );
    }

    if (!result.success) {
      alert(result.message);
      return;
    }

    // Reset form
    setName("");
    setDescription("");
    setEditingId(null);
    setIsOpen(false);

    // Refresh data
    await loadCategories();
  };

  // =========================
  // BUKA FORM TAMBAH
  // =========================
  const handleOpenCreate = () => {
    setName("");
    setDescription("");
    setEditingId(null);
    setIsOpen(true);
  };

  // =========================
  // BUKA FORM EDIT
  // =========================
  const handleOpenEdit = (category: Category) => {
    setName(category.name);
    setDescription(category.description ?? "");
    setEditingId(category.id);
    setIsOpen(true);
  };

  // =========================
  // BATAL FORM
  // =========================
  const handleCloseModal = () => {
    setName("");
    setDescription("");
    setEditingId(null);
    setIsOpen(false);
  };

  // =========================
  // KONFIRMASI HAPUS
  // =========================
  const confirmDelete = (id: number, name: string) => {
    setDeleteConfirm({
      id,
      name,
    });
  };

  // =========================
  // HAPUS
  // =========================
  const executeDelete = async () => {
    if (!deleteConfirm) return;

    const result = await deleteCategory(
      deleteConfirm.id
    );

    if (!result.success) {
      alert(result.message);
      setDeleteConfirm(null);
      return;
    }

    await loadCategories();

    setDeleteConfirm(null);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-[#2E3A47] dark:!bg-[#24303F] sm:px-7.5 xl:pb-1">

      {/* =========================
          HEADER
      ========================= */}
      <div className="flex justify-between items-center mb-6">

        <h4 className="text-xl font-semibold text-black dark:text-white">
          Daftar Kategori
        </h4>

        <button
          onClick={handleOpenCreate}
          className="flex justify-center rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-sm cursor-pointer items-center gap-1"
        >
          <Plus size={14} />

          <span>
            Tambah Kategori
          </span>
        </button>

      </div>

      {/* =========================
          TABLE
      ========================= */}
      <div className="flex flex-col overflow-x-auto">

        {/* HEADER TABLE */}

        <div className="min-w-[700px] grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-[#313D4A] text-left text-black dark:text-white">

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Nama Kategori
            </h5>
          </div>

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Deskripsi
            </h5>
          </div>

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Dibuat
            </h5>
          </div>

          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-semibold uppercase xsm:text-base">
              Aksi
            </h5>
          </div>

        </div>

        {/* =========================
            LOADING
        ========================= */}

        {loading && (
          <div className="min-w-[700px] py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Memuat kategori...
          </div>
        )}

        {/* =========================
            DATA KOSONG
        ========================= */}

        {!loading && categories.length === 0 && (
          <div className="min-w-[700px] py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Belum ada kategori.
          </div>
        )}

        {/* =========================
            DATA
        ========================= */}

        {!loading &&
          categories.map((category, key) => (
            <div
              key={category.id}
              className={`min-w-[700px] grid grid-cols-4 ${
                key === categories.length - 1
                  ? ""
                  : "border-b border-stroke dark:border-[#2E3A47]"
              }`}
            >

              {/* NAMA */}

              <div className="flex items-center p-2.5 xl:p-5">

                <p className="text-black dark:text-white font-medium text-sm sm:text-base">
                  {category.name}
                </p>

              </div>

              {/* DESKRIPSI */}

              <div className="flex items-center p-2.5 xl:p-5">

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {category.description || "-"}
                </p>

              </div>

              {/* CREATED */}

              <div className="flex items-center p-2.5 xl:p-5">

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(
                    category.created_at
                  ).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

              </div>

              {/* AKSI */}

              <div className="flex items-center justify-center p-2.5 xl:p-5 gap-4">

                <button
                  onClick={() =>
                    handleOpenEdit(category)
                  }
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium cursor-pointer"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    confirmDelete(
                      category.id,
                      category.name
                    )
                  }
                  className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium cursor-pointer"
                >
                  Hapus
                </button>

              </div>

            </div>
          ))}

      </div>

      {/* ==================================================
          MODAL TAMBAH / EDIT KATEGORI
      ================================================== */}

      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] relative">

              {/* CLOSE */}

              <button
                onClick={handleCloseModal}
                className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X size={18} />
              </button>

              {/* TITLE */}

              <div className="border-b border-stroke pb-4 dark:border-[#2E3A47]">

                <h3 className="text-lg font-semibold text-black dark:text-white">
                  {editingId !== null
                    ? "Edit Kategori"
                    : "Tambah Kategori Baru"}
                </h3>

              </div>

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="mt-4 space-y-4"
              >

                {/* NAMA */}

                <div>

                  <label className="mb-2 block text-black dark:text-white text-xs font-medium">
                    Nama Kategori
                  </label>

                  <input
                    type="text"
                    placeholder="Contoh: Minuman"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                    required
                  />

                </div>

                {/* DESKRIPSI */}

                <div>

                  <label className="mb-2 block text-black dark:text-white text-xs font-medium">
                    Deskripsi
                  </label>

                  <textarea
                    placeholder="Contoh: Kategori untuk produk minuman"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    rows={4}
                    className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white resize-none"
                  />

                </div>

                {/* BUTTON */}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-[#2E3A47]">

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded border border-stroke py-2 px-4 font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white text-xs cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-xs cursor-pointer"
                  >
                    {editingId !== null
                      ? "Simpan Perubahan"
                      : "Simpan Kategori"}
                  </button>

                </div>

              </form>

            </div>

          </div>,

          document.body
        )}

      {/* ==================================================
          MODAL KONFIRMASI HAPUS
      ================================================== */}

      {deleteConfirm &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-sm rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] text-center">

              {/* ICON */}

              <div className="mx-auto flex h-15 w-15 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 mb-4">

                <AlertTriangle size={32} />

              </div>

              {/* TITLE */}

              <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
                Hapus Kategori
              </h3>

              {/* MESSAGE */}

              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">

                Apakah Anda yakin ingin menghapus kategori{" "}

                <strong>
                  {deleteConfirm.name}
                </strong>
                ?

                <br />

                Tindakan ini tidak dapat dibatalkan.

              </p>

              {/* BUTTON */}

              <div className="flex justify-center gap-3">

                <button
                  onClick={() =>
                    setDeleteConfirm(null)
                  }
                  className="w-full rounded border border-stroke py-2.5 font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white text-sm cursor-pointer"
                >
                  Batal
                </button>

                <button
                  onClick={executeDelete}
                  className="w-full rounded bg-red-600 py-2.5 font-medium text-white hover:bg-opacity-90 text-sm cursor-pointer"
                >
                  Ya, Hapus
                </button>

              </div>

            </div>

          </div>,

          document.body
        )}

    </div>
  );
}