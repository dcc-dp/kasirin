"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, AlertTriangle } from "lucide-react";
import { getRoles, createRole, updateRole, deleteRole } from "@/actions/rbac";

export default function RolesTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: number, name: string} | null>(null);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const data = await getRoles();
    setRoles(data);
  };

  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    if (editingId) {
      await updateRole(editingId, { code: code.toUpperCase(), name });
    } else {
      await createRole({ code: code.toUpperCase(), name });
    }

    setCode("");
    setName("");
    setEditingId(null);
    setIsOpen(false);
    await loadRoles();
  };

  const handleOpenEdit = (role: any) => {
    setCode(role.code);
    setName(role.name);
    setEditingId(role.id);
    setIsOpen(true);
  };

  const handleOpenCreate = () => {
    setCode("");
    setName("");
    setEditingId(null);
    setIsOpen(true);
  };

  const confirmDelete = (id: number, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const executeDelete = async () => {
    if (deleteConfirm) {
      await deleteRole(deleteConfirm.id);
      await loadRoles();
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-[#2E3A47] dark:!bg-[#24303F] sm:px-7.5 xl:pb-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Daftar Peran (Roles)
        </h4>
        <button 
          onClick={handleOpenCreate}
          className="flex justify-center rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-sm cursor-pointer items-center gap-1"
        >
          <Plus size={14} />
          <span>Tambah Role</span>
        </button>
      </div>

      <div className="flex flex-col">
        {/* HEADER TABEL */}
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-[#313D4A] text-left text-black dark:text-white">
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Kode Role</h5></div>
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Nama Role</h5></div>
          <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Aksi</h5></div>
        </div>

        {/* ISI BARIS TABEL */}
        {roles.map((role, key) => (
          <div className={`grid grid-cols-3 ${key === roles.length - 1 ? "" : "border-b border-stroke dark:border-[#2E3A47]"}`} key={role.id}>
            <div className="flex items-center p-2.5 xl:p-5">
              <p className="font-mono text-black dark:text-white font-medium bg-gray-100 dark:bg-[#313D4A] px-2.5 py-1 rounded text-xs sm:text-sm">
                {role.code}
              </p>
            </div>
            <div className="flex items-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white font-medium text-sm sm:text-base">
                {role.name}
              </p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5 gap-4">
              <button onClick={() => handleOpenEdit(role)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium cursor-pointer">
                Edit
              </button>
              <button 
                onClick={() => confirmDelete(role.id, role.name)} 
                className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL POP-UP TAMBAH ROLE */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] relative">
            <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white"><X size={18} /></button>
            <div className="border-b border-stroke pb-4 dark:border-[#2E3A47]">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {editingId ? "Edit Peran" : "Tambah Peran Baru"}
              </h3>
            </div>
            
            <form onSubmit={handleAddRole} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Kode Role</label>
                <input type="text" placeholder="Contoh: ADM" value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" required />
              </div>
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Nama Role</label>
                <input type="text" placeholder="Contoh: Administrator" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" required />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-[#2E3A47]">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded border border-stroke py-2 px-4 font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white text-xs cursor-pointer">Batal</button>
                <button type="submit" className="rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-xs cursor-pointer">Simpan Peran</button>
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
              Apakah Anda yakin ingin menghapus role <strong>{deleteConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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