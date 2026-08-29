"use client";

import { useEffect, useState } from "react";
import {
  createUnit,
  deleteUnit,
  getUnits,
  updateUnit,
} from "@/actions/unit";

type Unit = {
  id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
};

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [editingUnit, setEditingUnit] =
    useState<Unit | null>(null);

  const [deletingUnit, setDeletingUnit] =
    useState<Unit | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const openCreateModal = () => {
    setEditingUnit(null);
    setName("");
    setDescription("");
    setShowModal(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setName(unit.name);
    setDescription(unit.description);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingUnit(null);
    setName("");
    setDescription("");
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Nama satuan wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const result = editingUnit
        ? await updateUnit(
            editingUnit.id,
            name,
            description
          )
        : await createUnit(
            name,
            description
          );

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(result.message);

      closeModal();
      await loadUnits();
    } catch (error) {
      console.error("Save unit error:", error);
      alert("Terjadi kesalahan saat menyimpan satuan.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (unit: Unit) => {
    setDeletingUnit(unit);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeletingUnit(null);
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    if (!deletingUnit) return;

    try {
      setDeleting(true);

      const result = await deleteUnit(
        deletingUnit.id
      );

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert(result.message);

      closeDeleteModal();
      await loadUnits();
    } catch (error) {
      console.error("Delete unit error:", error);
      alert("Terjadi kesalahan saat menghapus satuan.");
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
            Satuan Produk
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola satuan yang digunakan pada produk.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600"
        >
          + Tambah Satuan
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  #
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nama Satuan
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Deskripsi
                </th>

                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Dibuat
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
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Memuat data satuan...
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Belum ada satuan.
                  </td>
                </tr>
              ) : (
                units.map((unit, index) => (
                  <tr
                    key={unit.id}
                    className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800 dark:text-white">
                        {unit.name}
                      </span>
                    </td>

                    <td className="max-w-md px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {unit.description || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(unit.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(unit)
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openDeleteModal(unit)
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {editingUnit
                    ? "Edit Satuan"
                    : "Tambah Satuan"}
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {editingUnit
                    ? "Perbarui informasi satuan."
                    : "Tambahkan satuan produk baru."}
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
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
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
                    : editingUnit
                    ? "Simpan Perubahan"
                    : "Tambah Satuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingUnit && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Hapus Satuan?
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Apakah kamu yakin ingin menghapus satuan{" "}
              <strong className="text-gray-800 dark:text-white">
                "{deletingUnit.name}"
              </strong>
              ?
            </p>

            <p className="mt-2 text-sm text-red-500">
              Satuan yang masih digunakan produk tidak
              dapat dihapus.
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