"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, AlertTriangle } from "lucide-react";

import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from "@/actions/unit";

type Unit = {
  id: number;
  name: string;
  description: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export default function UnitsTab() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadUnits = async () => {
    try {
      setLoading(true);

      const data = await getUnits();

      setUnits(data as Unit[]);
    } catch (error) {
      console.error("Load units error:", error);
      alert("Gagal mengambil data satuan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  // =====================================================
  // CREATE
  // =====================================================

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setIsOpen(true);
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleOpenEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setName(unit.name);
    setDescription(unit.description ?? "");
    setIsOpen(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const handleCloseModal = () => {
    if (saving) return;

    setIsOpen(false);
    setEditingId(null);
    setName("");
    setDescription("");
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Nama satuan wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      let result;

      if (editingId !== null) {
        result = await updateUnit(
          editingId,
          name,
          description
        );
      } else {
        result = await createUnit(
          name,
          description
        );
      }

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(result.message);

      setIsOpen(false);
      setEditingId(null);
      setName("");
      setDescription("");

      await loadUnits();
    } catch (error) {
      console.error("Save unit error:", error);
      alert("Terjadi kesalahan saat menyimpan satuan.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE CONFIRMATION
  // =====================================================

  const confirmDelete = (id: number, name: string) => {
    setDeleteConfirm({
      id,
      name,
    });
  };

  // =====================================================
  // DELETE
  // =====================================================

  const executeDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);

      const result = await deleteUnit(
        deleteConfirm.id
      );

      if (!result.success) {
        alert(result.message);
        setDeleteConfirm(null);
        return;
      }

      alert(result.message);

      setDeleteConfirm(null);

      await loadUnits();
    } catch (error) {
      console.error("Delete unit error:", error);
      alert("Terjadi kesalahan saat menghapus satuan.");
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] sm:px-7.5 xl:pb-1">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Daftar Satuan
          </h4>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola satuan yang digunakan pada produk.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex cursor-pointer items-center justify-center gap-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          <Plus size={14} />

          <span>
            Tambah Satuan
          </span>
        </button>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="flex flex-col overflow-x-auto">

        <div className="min-w-[700px] grid grid-cols-4 rounded-sm bg-gray-2 text-left dark:bg-[#313D4A]">

          {/* Nama */}

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase text-black dark:text-white xsm:text-base">
              Nama Satuan
            </h5>
          </div>

          {/* Deskripsi */}

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase text-black dark:text-white xsm:text-base">
              Deskripsi
            </h5>
          </div>

          {/* Dibuat */}

          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-semibold uppercase text-black dark:text-white xsm:text-base">
              Dibuat
            </h5>
          </div>

          {/* Aksi */}

          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-semibold uppercase text-black dark:text-white xsm:text-base">
              Aksi
            </h5>
          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="min-w-[700px] py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Memuat data satuan...
          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading && units.length === 0 && (
          <div className="min-w-[700px] py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Belum ada satuan.
          </div>
        )}

        {/* =================================================
            DATA
        ================================================= */}

        {!loading &&
          units.map((unit, index) => (
            <div
              key={unit.id}
              className={`min-w-[700px] grid grid-cols-4 ${
                index === units.length - 1
                  ? ""
                  : "border-b border-stroke dark:border-[#2E3A47]"
              }`}
            >

              {/* NAMA */}

              <div className="flex items-center p-2.5 xl:p-5">
                <p className="text-sm font-medium text-black dark:text-white sm:text-base">
                  {unit.name}
                </p>
              </div>

              {/* DESKRIPSI */}

              <div className="flex items-center p-2.5 xl:p-5">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {unit.description || "-"}
                </p>
              </div>

              {/* CREATED */}

              <div className="flex items-center p-2.5 xl:p-5">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(unit.created_at)}
                </p>
              </div>

              {/* AKSI */}

              <div className="flex items-center justify-center gap-4 p-2.5 xl:p-5">

                <button
                  type="button"
                  onClick={() => handleOpenEdit(unit)}
                  className="cursor-pointer text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    confirmDelete(
                      unit.id,
                      unit.name
                    )
                  }
                  className="cursor-pointer text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Hapus
                </button>

              </div>

            </div>
          ))}

      </div>

      {/* =================================================
          MODAL TAMBAH / EDIT
      ================================================= */}

      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">

            <div className="relative w-full max-w-md rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F]">

              {/* CLOSE */}

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X size={18} />
              </button>

              {/* TITLE */}

              <div className="border-b border-stroke pb-4 dark:border-[#2E3A47]">

                <h3 className="text-lg font-semibold text-black dark:text-white">
                  {editingId !== null
                    ? "Edit Satuan"
                    : "Tambah Satuan Baru"}
                </h3>

              </div>

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="mt-4 space-y-4"
              >

                {/* NAMA */}

                <div>

                  <label className="mb-2 block text-xs font-medium text-black dark:text-white">
                    Nama Satuan
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Contoh: pcs"
                    disabled={saving}
                    required
                    className="w-full rounded border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />

                </div>

                {/* DESKRIPSI */}

                <div>

                  <label className="mb-2 block text-xs font-medium text-black dark:text-white">
                    Deskripsi
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    placeholder="Contoh: Satuan per buah"
                    rows={4}
                    disabled={saving}
                    className="w-full resize-none rounded border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />

                </div>

                {/* BUTTON */}

                <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-[#2E3A47]">

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving}
                    className="cursor-pointer rounded border border-stroke px-4 py-2 text-xs font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {saving
                      ? "Menyimpan..."
                      : editingId !== null
                      ? "Simpan Perubahan"
                      : "Simpan Satuan"}
                  </button>

                </div>

              </form>

            </div>

          </div>,
          document.body
        )}

      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {deleteConfirm &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-sm rounded-sm border border-stroke bg-white p-6 text-center shadow-default dark:border-[#2E3A47] dark:bg-[#24303F]">

              {/* ICON */}

              <div className="mx-auto mb-4 flex h-15 w-15 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">

                <AlertTriangle size={32} />

              </div>

              {/* TITLE */}

              <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
                Hapus Satuan
              </h3>

              {/* MESSAGE */}

              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">

                Apakah Anda yakin ingin menghapus satuan{" "}

                <strong className="text-black dark:text-white">
                  {deleteConfirm.name}
                </strong>
                ?

                <br />

                Tindakan ini tidak dapat dibatalkan.

              </p>

              {/* BUTTON */}

              <div className="flex justify-center gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm(null)
                  }
                  disabled={deleting}
                  className="w-full cursor-pointer rounded border border-stroke px-4 py-2.5 text-sm font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={deleting}
                  className="w-full cursor-pointer rounded bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  {deleting
                    ? "Menghapus..."
                    : "Ya, Hapus"}
                </button>

              </div>

            </div>

          </div>,
          document.body
        )}

    </div>
  );
}

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(date: Date | string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}