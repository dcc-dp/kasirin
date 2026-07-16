"use client";

import React, { useState } from "react";

type PermissionMatrix = {
  [menuId: number]: {
    [roleId: number]: boolean;
  };
};

export default function PermissionsTab() {
  // 1. Data Mock Role untuk kolom tabel
  const roles = [
    { id: 1, name: "Admin" },
    { id: 2, name: "Kasir" },
    { id: 3, name: "Manager" },
  ];

  // 2. Data Mock Menu/Fitur untuk baris tabel
  const menus = [
    { id: 1, name: "Dashboard Utama" },
    { id: 2, name: "Manajemen Role" },
    { id: 3, name: "Manajemen Menu" },
    { id: 4, name: "Matriks Otoritas" },
    { id: 5, name: "Manajemen Produk" },
    { id: 6, name: "Transaksi Kasir (POS)" },
  ];

  // 3. State Status Centang Matriks (Default Otorisasi)
  const [matrix, setMatrix] = useState<PermissionMatrix>({
    1: { 1: true, 2: true, 3: true },  // Semua bisa buka Dashboard
    2: { 1: true, 2: false, 3: false }, // Hanya Admin yang bisa buka Manajemen Role
    3: { 1: true, 2: false, 3: false }, // Hanya Admin yang bisa buka Manajemen Menu
    4: { 1: true, 2: false, 3: false }, // Hanya Admin yang bisa buka Matriks Otoritas
    5: { 1: true, 2: false, 3: true },  // Admin & Manager bisa atur Produk
    6: { 1: true, 2: true, 3: true },  // Semua bisa akses Transaksi POS
  });

  // Fungsi untuk pasang/lepas centang saat diklik
  const handleToggle = (menuId: number, roleId: number) => {
    setMatrix((prev) => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [roleId]: !prev[menuId]?.[roleId],
      },
    }));
  };

  const handleSave = () => {
    alert("Perubahan hak akses matriks otorisasi berhasil disimpan!");
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      {/* Bagian Header Konten */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Pengaturan Matriks Akses
          </h4>
          <p className="text-sm text-body dark:text-bodydark mt-1">
            Centang untuk memberikan izin akses menu berdasarkan peran pengguna.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex justify-center rounded bg-primary py-2.5 px-6 font-medium text-white hover:bg-opacity-90 text-sm shadow-md transition-all"
        >
          Simpan Konfigurasi
        </button>
      </div>

      {/* Tabel Matriks Responsif */}
      <div className="flex flex-col overflow-x-auto">
        <div className="min-w-[700px]">
          
          {/* Header Grid Tabel */}
          <div className="grid grid-cols-5 rounded-sm bg-gray-2 dark:bg-meta-4 text-left border-b border-stroke dark:border-strokedark">
            <div className="p-4 col-span-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                Modul / Menu Aplikasi
              </h5>
            </div>
            {roles.map((role) => (
              <div key={role.id} className="p-4 text-center">
                <h5 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                  {role.name}
                </h5>
              </div>
            ))}
          </div>

          {/* Isi Grid Tabel */}
          <div className="divide-y divide-stroke dark:divide-strokedark">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="grid grid-cols-5 items-center hover:bg-gray-50 dark:hover:bg-meta-4/10 transition-colors py-1"
              >
                {/* Kolom Judul Menu */}
                <div className="p-4 col-span-2">
                  <p className="font-medium text-black dark:text-white text-sm sm:text-base">
                    {menu.name}
                  </p>
                </div>

                {/* Kolom Checkbox Per Role */}
                {roles.map((role) => {
                  const isChecked = matrix[menu.id]?.[role.id] || false;
                  return (
                    <div key={role.id} className="p-4 flex justify-center">
                      <label className="relative flex cursor-pointer select-none items-center">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={() => handleToggle(menu.id, role.id)}
                        />
                        {/* Kotak Checkbox Custom TailAdmin */}
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                            isChecked
                              ? "border-primary bg-primary text-white"
                              : "border-stroke bg-transparent dark:border-form-strokedark"
                          }`}
                        >
                          {isChecked && (
                            <svg
                              className="h-3 w-3 fill-current"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}