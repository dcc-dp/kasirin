"use client";

import React, { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Link2, LayoutGrid, ChevronRight, Eye, FolderTree, Trash2 } from "lucide-react";

// Data simulasi internal agar UI langsung terisi data
const contohDataMenu = [
  { id: 1, name: "Dashboard Utama", path: "/admin/dashboard", icon: "LayoutGrid", parent_id: null, permission_path: "dashboard.read" },
  { id: 2, name: "Manajemen Hak Akses (RBAC)", path: "/admin/rbac", icon: "FolderTree", parent_id: null, permission_path: "rbac.read" },
  { id: 3, name: "Daftar Role", path: "/admin/rbac/roles", icon: "ChevronRight", parent_id: 2, permission_path: "roles.read" },
  { id: 4, name: "Pengaturan Menu", path: "/admin/rbac/menus", icon: "ChevronRight", parent_id: 2, permission_path: "menus.read" },
  { id: 5, name: "Manajemen Produk", path: "/admin/products", icon: "LayoutGrid", parent_id: null, permission_path: "products.read" },
];

export default function MenusTab() {
  const [menus, setMenus] = useState<any[]>(contohDataMenu);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const rootMenus = menus.filter(menu => !menu.parent_id);

  const handleDeleteMenu = (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;
    setMenus(menus.filter(m => m.id !== id));
    setActiveDropdownId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* ATASAN / TOMBOL TAMBAH */}
      <div className="flex justify-end">
        <button 
          onClick={() => alert("Simulasi Tambah Menu Baru")}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-opacity-90 text-white px-4 py-2.5 rounded font-medium text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* STRUKTUR POHON MENU (Sudah Di-Bypass Tembak Kode Warna Gelap TailAdmin) */}
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
                          onClick={() => handleDeleteMenu(rootMenu.id)}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-2 dark:hover:bg-[#313D4A] flex items-center gap-2 font-medium cursor-pointer"
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
                                onClick={() => handleDeleteMenu(sub.id)}
                                className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-2 dark:hover:bg-[#313D4A] flex items-center gap-2 font-medium cursor-pointer"
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

    </div>
  );
}