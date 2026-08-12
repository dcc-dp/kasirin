"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";

export default function MenusTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [menus, setMenus] = useState([
    { id: 1, name: "Dashboard", path: "/admin/dashboard", icon: "GridIcon" },
    { id: 2, name: "Manajemen Produk", path: "/admin/products", icon: "BoxCubeIcon" },
    { id: 3, name: "Layar Kasir (POS)", path: "/kasir", icon: "TableIcon" },
  ]);

  // State untuk menangkap input form registrasi menu
  const [menuName, setMenuName] = useState("");
  const [menuPath, setMenuPath] = useState("");
  const [menuIcon, setMenuIcon] = useState("");

  // Fungsi Tambah Menu
  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName || !menuPath || !menuIcon) return;

    const newMenu = {
      id: Date.now(),
      name: menuName,
      path: menuPath,
      icon: menuIcon,
    };

    setMenus([...menus, newMenu]);
    setMenuName("");
    setMenuPath("");
    setMenuIcon("");
    setIsOpen(false);
  };

  // Fungsi Hapus Menu
  const handleDeleteMenu = (id: number) => {
    if (confirm("Yakin ingin menghapus menu ini?")) {
      setMenus(menus.filter((menu) => menu.id !== id));
    }
  };

  return (
  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-[#2E3A47] dark:!bg-[#24303F] sm:px-7.5 xl:pb-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Daftar Menu Halaman
        </h4>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex justify-center rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-sm cursor-pointer items-center gap-1"
        >
          <Plus size={14} />
          <span>Tambah Menu</span>
        </button>
      </div>

      <div className="flex flex-col">
        {/* HEADER TABEL */}
        <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-[#313D4A] text-left text-black dark:text-white">
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Nama Menu</h5></div>
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Rute (Path)</h5></div>
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Nama Icon</h5></div>
          <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Aksi</h5></div>
        </div>

        {/* ISI BARIS TABEL */}
        {menus.map((menu, key) => (
          <div className={`grid grid-cols-4 ${key === menus.length - 1 ? "" : "border-b border-stroke dark:border-[#2E3A47]"}`} key={menu.id}>
            <div className="flex items-center p-2.5 xl:p-5"><p className="text-black dark:text-white font-medium text-sm sm:text-base">{menu.name}</p></div>
            <div className="flex items-center p-2.5 xl:p-5"><p className="font-mono text-xs text-black dark:text-gray-300">{menu.path}</p></div>
            <div className="flex items-center p-2.5 xl:p-5"><p className="font-mono text-xs text-black dark:text-gray-300">{menu.icon}</p></div>
            <div className="flex items-center justify-center p-2.5 xl:p-5 gap-4">
              <button onClick={() => alert("Fitur edit")} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium cursor-pointer">Edit</button>
              <button 
                onClick={() => handleDeleteMenu(menu.id)} 
                className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL POP-UP REGISTRASI MENU */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] relative">
            <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white"><X size={18} /></button>
            <div className="border-b border-stroke pb-4 dark:border-[#2E3A47]">
              <h3 className="text-lg font-semibold text-black dark:text-white">Registrasi Menu Baru</h3>
            </div>
            
            <form onSubmit={handleAddMenu} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Nama Menu</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Laporan Keuangan" 
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" 
                  required 
                />
              </div>
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Rute Halaman (Path)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: /admin/reports" 
                  value={menuPath}
                  onChange={(e) => setMenuPath(e.target.value)}
                  className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" 
                  required 
                />
              </div>
              <div>
                <label className="mb-2 block text-black dark:text-white text-xs font-medium">Nama Icon (Lucide / SVG)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: PieChartIcon" 
                  value={menuIcon}
                  onChange={(e) => setMenuIcon(e.target.value)}
                  className="w-full rounded border border-stroke bg-transparent py-2 px-4 text-black outline-hidden transition focus:border-primary dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white" 
                  required 
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-[#2E3A47]">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded border border-stroke py-2 px-4 font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white text-xs cursor-pointer">Batal</button>
                <button type="submit" className="rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-xs cursor-pointer">Simpan Menu</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}