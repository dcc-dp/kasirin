"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, AlertTriangle } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, getRoles } from "@/actions/rbac";

export default function UsersTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: number, name: string} | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    role_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const usersData = await getUsers();
    const rolesData = await getRoles();
    setUsers(usersData);
    setRoles(rolesData);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role_id) return;

    if (editingId) {
      await updateUser(editingId, {
        name: formData.name,
        password: formData.password || undefined,
        role_id: parseInt(formData.role_id),
      });
    } else {
      await createUser({
        name: formData.name,
        password: formData.password || undefined,
        role_id: parseInt(formData.role_id),
      });
    }

    setFormData({ name: "", password: "", role_id: "" });
    setEditingId(null);
    setIsOpen(false);
    await loadData();
  };

  const handleOpenEdit = (user: any) => {
    setFormData({
      name: user.name,
      password: "", // Don't show existing password
      role_id: user.role_id.toString(),
    });
    setEditingId(user.id);
    setIsOpen(true);
  };

  const handleOpenCreate = () => {
    setFormData({ name: "", password: "", role_id: "" });
    setEditingId(null);
    setIsOpen(true);
  };

  const confirmDelete = (id: number, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const executeDelete = async () => {
    if (deleteConfirm) {
      await deleteUser(deleteConfirm.id);
      await loadData();
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-[#2E3A47] dark:!bg-[#24303F] sm:px-7.5 xl:pb-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Daftar Pengguna
        </h4>
        <button 
          onClick={handleOpenCreate}
          className="flex justify-center rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-sm cursor-pointer items-center gap-1"
        >
          <Plus size={14} />
          <span>Tambah User</span>
        </button>
      </div>

      <div className="flex flex-col">
        {/* HEADER TABEL */}
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-[#313D4A] text-left text-black dark:text-white">
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Nama (Username)</h5></div>
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Role</h5></div>
          <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Aksi</h5></div>
        </div>

        {/* ISI BARIS TABEL */}
        {users.map((user, key) => (
          <div className={`grid grid-cols-3 ${key === users.length - 1 ? "" : "border-b border-stroke dark:border-[#2E3A47]"}`} key={user.id}>
            <div className="flex items-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white font-medium text-sm sm:text-base">
                {user.name}
              </p>
            </div>
            <div className="flex items-center p-2.5 xl:p-5">
              <span className="bg-primary/10 text-primary dark:bg-primary/20 rounded px-3 py-1 text-xs font-semibold">
                {user.role_name}
              </span>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5 gap-4">
              <button onClick={() => handleOpenEdit(user)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium cursor-pointer">
                Edit
              </button>
              <button 
                onClick={() => confirmDelete(user.id, user.name)} 
                className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL POP-UP TAMBAH USER */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] relative">
            <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white"><X size={18} /></button>
            <div className="border-b border-stroke pb-4 dark:border-[#2E3A47]">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {editingId ? "Edit Pengguna" : "Tambah Pengguna Baru"}
              </h3>
            </div>
            
            <form onSubmit={handleAddUser} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Nama Lengkap (Username)</label>
                <input type="text" placeholder="Masukkan nama" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" required />
              </div>
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">
                  {editingId ? "Password (kosongkan jika tidak ingin diubah)" : "Password"}
                </label>
                <input type="password" placeholder={editingId ? "" : "Kosongkan untuk default: password123"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Role</label>
                <select value={formData.role_id} onChange={(e) => setFormData({...formData, role_id: e.target.value})} className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" required>
                  <option value="">-- Pilih Role --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-[#2E3A47]">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded border border-stroke py-2 px-4 font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white text-xs cursor-pointer">Batal</button>
                <button type="submit" className="rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-xs cursor-pointer">Simpan User</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {deleteConfirm && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] text-center">
            <div className="mx-auto flex h-15 w-15 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-black dark:text-white">Hapus Data</h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Apakah Anda yakin ingin menghapus pengguna <strong>{deleteConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
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
