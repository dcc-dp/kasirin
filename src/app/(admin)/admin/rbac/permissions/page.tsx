"use client";

import React, { useState } from "react";

const contohRoles = [
  { id: 1, name: "Administrator" },
  { id: 2, name: "Kasir / Kasir Utama" },
  { id: 3, name: "Manajer Gudang" },
];

const contohMenus = [
  { id: 1, name: "Dashboard Utama" },
  { id: 2, name: "Manajemen Produk" },
  { id: 3, name: "Transaksi POS (Penjualan)" },
  { id: 4, name: "Manajemen Hak Akses (RBAC)" },
];

export default function PermissionsTab() {
  const [selectedRole, setSelectedRole] = useState("2");
  
  const [matrix, setMatrix] = useState<Record<string, { r: boolean; c: boolean; u: boolean; d: boolean }>>({
    "1-1": { r: true, c: true, u: true, d: true },
    "2-1": { r: true, c: false, u: false, d: false },
    "2-2": { r: true, c: true, u: false, d: false },
    "2-3": { r: true, c: true, u: true, d: false },
  });

  const handleCheckboxChange = (menuId: number, accessType: "r" | "c" | "u" | "d") => {
    const key = `${selectedRole}-${menuId}`;
    setMatrix((prev) => {
      const current = prev[key] || { r: false, c: false, u: false, d: false };
      return {
        ...prev,
        [key]: {
          ...current,
          [accessType]: !current[accessType],
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* KOTAK PILIHAN ROLE (Bypass Mode Malam) */}
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F]">
        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
          Pilih Peran / Role Pengguna
        </label>
        <div className="relative z-20 bg-transparent">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-hidden transition focus:border-blue-600 active:border-blue-600 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white"
          >
            {contohRoles.map((role) => (
              <option key={role.id} value={role.id} className="text-black dark:text-white dark:bg-[#24303F]">
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABEL MATRIKS CENTANGAN CRUD (Bypass Mode Malam) */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] sm:px-7.5 xl:pb-1">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 dark:bg-[#313D4A] text-left">
                <th className="py-4 px-4 font-medium text-black dark:text-white xl:pl-11 border-b border-stroke dark:border-[#2E3A47]">
                  Nama Modul / Menu
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white text-center border-b border-stroke dark:border-[#2E3A47]">
                  Read (Lihat)
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white text-center border-b border-stroke dark:border-[#2E3A47]">
                  Create (Tambah)
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white text-center border-b border-stroke dark:border-[#2E3A47]">
                  Update (Ubah)
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white text-center border-b border-stroke dark:border-[#2E3A47]">
                  Delete (Hapus)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-[#2E3A47]">
              {contohMenus.map((menu) => {
                const key = `${selectedRole}-${menu.id}`;
                const access = matrix[key] || { r: false, c: false, u: false, d: false };

                return (
                  <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-[#313D4A]/30">
                    <td className="py-5 px-4 xl:pl-11">
                      <h5 className="font-medium text-black dark:text-white">
                        {menu.name}
                      </h5>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={access.r}
                        onChange={() => handleCheckboxChange(menu.id, "r")}
                        className="h-5 w-5 rounded border-gray-300 dark:border-[#2E3A47] text-blue-600 bg-white dark:bg-[#313D4A] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={access.c}
                        onChange={() => handleCheckboxChange(menu.id, "c")}
                        className="h-5 w-5 rounded border-gray-300 dark:border-[#2E3A47] text-blue-600 bg-white dark:bg-[#313D4A] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={access.u}
                        onChange={() => handleCheckboxChange(menu.id, "u")}
                        className="h-5 w-5 rounded border-gray-300 dark:border-[#2E3A47] text-blue-600 bg-white dark:bg-[#313D4A] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={access.d}
                        onChange={() => handleCheckboxChange(menu.id, "d")}
                        className="h-5 w-5 rounded border-gray-300 dark:border-[#2E3A47] text-blue-600 bg-white dark:bg-[#313D4A] focus:ring-0 cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end py-6">
          <button
            onClick={() => alert("Perubahan disimpan!")}
            className="flex justify-center rounded bg-blue-600 py-2.5 px-6 font-medium text-white hover:bg-opacity-90 cursor-pointer"
          >
            Simpan Hak Akses
          </button>
        </div>
      </div>
    </div>
  );
}