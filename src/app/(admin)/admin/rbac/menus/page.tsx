"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, MoreHorizontal, Link2, LayoutGrid, ChevronRight, Eye, FolderTree, Trash2, Edit, AlertTriangle } from "lucide-react";
import { getMenus, createMenu, updateMenu, deleteMenu } from "@/actions/rbac";

export default function MenusTab() {
  const [menus, setMenus] = useState<any[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", path: "", icon: "", parent_id: "" });

  useEffect(() => {
    loadMenus();
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const loadMenus = async () => {
    const data = await getMenus();
    setMenus(data);
  };

  const rootMenus = menus.filter(menu => !menu.parent_id);

  const confirmDelete = (id: number) => {
    setDeleteConfirmId(id);
    setActiveDropdownId(null);
  };

  const executeDelete = async () => {
    if (deleteConfirmId) {
      await deleteMenu(deleteConfirmId);
      await loadMenus();
      setDeleteConfirmId(null);
    }
  };

  const handleOpenEdit = (menu: any) => {
    setFormData({
      name: menu.name,
      path: menu.path,
      icon: menu.icon || "",
      parent_id: menu.parent_id ? menu.parent_id.toString() : "",
    });
    setEditingId(menu.id);
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleOpenCreate = () => {
    setFormData({ name: "", path: "", icon: "", parent_id: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      path: formData.path,
      icon: formData.icon || undefined,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
    };
    
    if (editingId) {
      await updateMenu(editingId, data);
    } else {
      await createMenu(data);
    }
    
    setIsModalOpen(false);
    setFormData({ name: "", path: "", icon: "", parent_id: "" });
    setEditingId(null);
    await loadMenus();
  };

  return (
    <div className="space-y-6">
      
      {/* ATASAN / TOMBOL TAMBAH */}
      <div className="flex justify-end">
        <button 
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-opacity-90 text-white px-4 py-2.5 rounded font-medium text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* STRUKTUR POHON MENU */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] overflow-visible">
        
        {/* Header Bagian Dalam Tabel */}
        <div className="px-5 py-4 bg-gray-2 dark:bg-[#313D4A] border-b border-stroke dark:border-[#2E3A47] text-sm font-medium text-black dark:text-white flex items-center gap-2">
          <FolderTree size={16} className="text-blue-500 dark:text-blue-400" /> Hirarki Navigasi Sistem
        </div>
        
        {/* Konten Pohon Menu Hirarki */}
        <div className="divide-y divide-stroke dark:divide-[#2E3A47]">
          {rootMenus.map((rootMenu) => {
            const subMenus = menus.filter(m => m.parent_id === rootMenu.id);
            const hasSub = subMenus.length > 0;

            return (
              <div key={rootMenu.id} className="p-5 hover:bg-gray-50 dark:hover:bg-[#313D4A]/30 transition-colors">
                
                {/* BARIS UTAMA (PARENT MENU) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-gray-2 text-blue-600 dark:bg-[#313D4A] dark:text-white hidden sm:block">
                      <LayoutGrid size={18} />
                    </div>
                    <div>
                      <span className="font-semibold text-black dark:text-white text-base">{rootMenu.name}</span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                        <span className="flex items-center gap-1 font-mono bg-gray-2 dark:bg-[#313D4A] px-1.5 py-0.5 rounded text-black dark:text-white">
                          <Link2 size={12} /> {rootMenu.path}
                        </span>
                        <span className="text-gray-300 dark:text-[#313D4A] hidden sm:inline">|</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono">
                          <Eye size={12} /> {rootMenu.permission_path}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* DROPDOWN AKSI */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setActiveDropdownId(activeDropdownId === rootMenu.id ? null : rootMenu.id)}
                      className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white p-1.5 rounded hover:bg-gray-2 dark:hover:bg-[#313D4A] cursor-pointer"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeDropdownId === rootMenu.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#24303F] border border-stroke dark:border-[#2E3A47] rounded shadow-lg z-30 py-1">
                        <button
                          onClick={() => handleOpenEdit(rootMenu)}
                          className="w-full text-left px-4 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-2 dark:hover:bg-[#313D4A] flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Edit size={14} /> Edit Menu
                        </button>
                        <button
                          onClick={() => confirmDelete(rootMenu.id)}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-2 dark:hover:bg-[#313D4A] flex items-center gap-2 font-medium cursor-pointer border-t border-stroke dark:border-[#2E3A47]"
                        >
                          <Trash2 size={14} /> Hapus Menu
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* BARIS SUB-MENU (CHILDREN MENU) */}
                {hasSub && (
                  <div className="mt-4 ml-4 sm:ml-12 pl-4 border-l-2 border-stroke dark:border-[#2E3A47] space-y-4">
                    {subMenus.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-2">
                          <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-black dark:text-white">{sub.name}</span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-mono text-black dark:text-white opacity-70">{sub.path}</span>
                              <span className="text-gray-300 dark:text-[#313D4A]">•</span>
                              <span className="font-mono text-amber-600/95 dark:text-amber-400/90">{sub.permission_path}</span>
                            </div>
                          </div>
                        </div>

                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setActiveDropdownId(activeDropdownId === sub.id ? null : sub.id)}
                            className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white p-1 rounded hover:bg-gray-2 dark:hover:bg-[#313D4A] cursor-pointer"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {activeDropdownId === sub.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#24303F] border border-stroke dark:border-[#2E3A47] rounded shadow-lg z-30 py-1">
                              <button
                                onClick={() => handleOpenEdit(sub)}
                                className="w-full text-left px-4 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-2 dark:hover:bg-[#313D4A] flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <Edit size={14} /> Edit Sub-Menu
                              </button>
                              <button
                                onClick={() => confirmDelete(sub.id)}
                                className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-2 dark:hover:bg-[#313D4A] flex items-center gap-2 font-medium cursor-pointer border-t border-stroke dark:border-[#2E3A47]"
                              >
                                <Trash2 size={14} /> Hapus Sub-Menu
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>


      {isModalOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">&times;</button>
            <div className="border-b border-stroke pb-4 dark:border-[#2E3A47]">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {editingId ? "Edit Menu" : "Registrasi Menu Baru"}
              </h3>
            </div>
            
            <form onSubmit={handleSaveMenu} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Nama Menu</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" 
                  required 
                />
              </div>
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Rute Halaman (Path)</label>
                <input 
                  type="text" 
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" 
                  required 
                />
              </div>
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Nama Icon (Lucide / SVG)</label>
                <input 
                  type="text" 
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" 
                />
              </div>
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Parent Menu</label>
                <select 
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                >
                  <option value="">-- Tidak ada (Root Menu) --</option>
                  {rootMenus.map(rm => (
                    <option key={rm.id} value={rm.id}>{rm.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-[#2E3A47]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded border border-stroke py-2 px-4 font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white text-xs cursor-pointer">Batal</button>
                <button type="submit" className="rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-xs cursor-pointer">Simpan Menu</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {deleteConfirmId && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] text-center">
            <div className="mx-auto flex h-15 w-15 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-black dark:text-white">Hapus Data</h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
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