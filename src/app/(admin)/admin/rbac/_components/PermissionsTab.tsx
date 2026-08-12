"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Shield, X, Check, Settings } from "lucide-react";
import { getRoles, getMenus, getRolePermissions, saveRolePermissions } from "@/actions/rbac";

type MenuPermission = {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_report: boolean;
};

type PermissionsState = Record<number, MenuPermission>;

export default function PermissionsTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  
  // Permissions state for the active role
  const [permissions, setPermissions] = useState<PermissionsState>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const rolesData = await getRoles();
    const menusData = await getMenus();
    setRoles(rolesData);
    setMenus(menusData);
  };

  const handleOpenModal = async (role: any) => {
    setSelectedRole(role);
    // Fetch permissions for this role
    const perms = await getRolePermissions(role.id);
    
    const initialState: PermissionsState = {};
    perms.forEach((p: any) => {
      initialState[p.menu_id] = {
        can_read: p.can_read,
        can_create: p.can_create,
        can_update: p.can_update,
        can_delete: p.can_delete,
        can_report: p.can_report,
      };
    });
    
    setPermissions(initialState);
    setIsModalOpen(true);
  };

  const handleToggle = (menuId: number, field: keyof MenuPermission) => {
    setPermissions(prev => {
      const current = prev[menuId] || { can_read: false, can_create: false, can_update: false, can_delete: false, can_report: false };
      return {
        ...prev,
        [menuId]: {
          ...current,
          [field]: !current[field]
        }
      };
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    
    // Construct permissions array
    const permissionsArray = Object.entries(permissions).map(([menuIdStr, perms]) => ({
      role_id: selectedRole.id,
      menu_id: parseInt(menuIdStr),
      ...perms
    })).filter(p => p.can_read || p.can_create || p.can_update || p.can_delete || p.can_report); // Only save if at least one is true

    await saveRolePermissions(selectedRole.id, permissionsArray);
    setIsModalOpen(false);
    alert("Hak akses berhasil disimpan!");
  };

  // Determine which menus have sub-menus
  const parentMenuIds = menus.filter(m => m.parent_id !== null).map(m => m.parent_id);

  const CheckboxItem = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-3 dark:bg-[#313D4A] hover:bg-gray-4 dark:hover:bg-[#3A4A5A]'
      }`}
    >
      {checked && <Check size={16} className="text-white" strokeWidth={4} />}
    </div>
  );

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-[#2E3A47] dark:!bg-[#24303F] sm:px-7.5 xl:pb-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Daftar Role & Hak Akses
        </h4>
      </div>

      {/* HEADER TABEL ROLE */}
      <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-[#313D4A] text-left text-black dark:text-white">
        <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">NO</h5></div>
        <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Kode Role</h5></div>
        <div className="p-2.5 xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Nama Role</h5></div>
        <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-semibold uppercase xsm:text-base">Aksi</h5></div>
      </div>

      {/* ISI TABEL ROLE */}
      <div className="flex flex-col">
        {roles.map((role, index) => (
          <div className={`grid grid-cols-4 ${index === roles.length - 1 ? "" : "border-b border-stroke dark:border-[#2E3A47]"}`} key={role.id}>
            <div className="flex items-center p-2.5 xl:p-5"><p className="text-black dark:text-white font-medium text-sm sm:text-base">{index + 1}</p></div>
            <div className="flex items-center p-2.5 xl:p-5"><p className="text-black dark:text-white font-medium text-sm sm:text-base">{role.code || role.name.toUpperCase()}</p></div>
            <div className="flex items-center p-2.5 xl:p-5"><p className="text-black dark:text-white font-medium text-sm sm:text-base">{role.name}</p></div>
            <div className="flex items-center justify-center p-4 xl:p-5">
              <button 
                onClick={() => handleOpenModal(role)} 
                className="text-blue-500 hover:text-blue-400 transition-colors"
                title="Atur Hak Akses"
              >
                <Shield size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedRole && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-[#2E3A47] dark:bg-[#24303F] max-h-[90vh] overflow-hidden flex flex-col relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white"><X size={18} /></button>
            <div className="border-b border-stroke pb-4 dark:border-[#2E3A47]">
              <h3 className="text-lg font-semibold text-black dark:text-white">Hak Akses: {selectedRole.name}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto mt-4 p-0">
              {/* HEADER TABEL PERMISSION */}
              <div className="grid grid-cols-7 rounded-sm bg-gray-2 dark:bg-[#313D4A] text-left text-black dark:text-white sticky top-0 z-10">
                <div className="p-2.5 xl:p-5 col-span-2"><h5 className="text-sm font-semibold uppercase xsm:text-base tracking-wider">MENU</h5></div>
                <div className="p-2.5 xl:p-5 text-center"><h5 className="text-sm font-semibold uppercase xsm:text-base tracking-wider">BACA</h5></div>
                <div className="p-2.5 xl:p-5 text-center"><h5 className="text-sm font-semibold uppercase xsm:text-base tracking-wider">TAMBAH</h5></div>
                <div className="p-2.5 xl:p-5 text-center"><h5 className="text-sm font-semibold uppercase xsm:text-base tracking-wider">UBAH</h5></div>
                <div className="p-2.5 xl:p-5 text-center"><h5 className="text-sm font-semibold uppercase xsm:text-base tracking-wider">HAPUS</h5></div>
                <div className="p-2.5 xl:p-5 text-center"><h5 className="text-sm font-semibold uppercase xsm:text-base tracking-wider">LAPORAN</h5></div>
              </div>

              {/* ISI TABEL PERMISSION */}
              <div className="flex flex-col">
                {menus.filter(m => !m.parent_id).map(parent => {
                  const hasSub = parentMenuIds.includes(parent.id);
                  const submenus = menus.filter(m => m.parent_id === parent.id);
                  const parentPerms = permissions[parent.id] || { can_read: false, can_create: false, can_update: false, can_delete: false, can_report: false };

                  return (
                    <React.Fragment key={parent.id}>
                      {/* PARENT ROW */}
                      <div className="grid grid-cols-7 items-center border-b border-stroke dark:border-[#2E3A47]">
                        <div className="p-2.5 xl:p-5 col-span-2 flex items-center gap-2">
                          {hasSub && <Settings size={16} className="text-gray-400" />}
                          <div>
                            <p className="font-medium text-black dark:text-white text-sm sm:text-base">{parent.name}</p>
                            {!hasSub && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{parent.path}</p>}
                          </div>
                        </div>

                        {!hasSub ? (
                          <>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={parentPerms.can_read} onChange={() => handleToggle(parent.id, 'can_read')} /></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={parentPerms.can_create} onChange={() => handleToggle(parent.id, 'can_create')} /></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={parentPerms.can_update} onChange={() => handleToggle(parent.id, 'can_update')} /></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={parentPerms.can_delete} onChange={() => handleToggle(parent.id, 'can_delete')} /></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={parentPerms.can_report} onChange={() => handleToggle(parent.id, 'can_report')} /></div>
                          </>
                        ) : (
                          <>
                            <div className="p-2.5 xl:p-5 flex justify-center"></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"></div>
                          </>
                        )}
                      </div>

                      {/* SUBMENU ROWS */}
                      {hasSub && submenus.map(sub => {
                        const subPerms = permissions[sub.id] || { can_read: false, can_create: false, can_update: false, can_delete: false, can_report: false };
                        return (
                          <div key={sub.id} className="grid grid-cols-7 items-center border-b border-stroke dark:border-[#2E3A47]">
                            <div className="p-2.5 xl:p-5 pl-12 col-span-2 flex items-start gap-2 border-l border-stroke dark:border-[#2E3A47] ml-6">
                              <div className="w-4 h-4 border-b border-l border-stroke dark:border-gray-500 rounded-bl mt-1"></div>
                              <div>
                                <p className="text-black dark:text-white font-medium text-sm sm:text-base">{sub.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{sub.path}</p>
                              </div>
                            </div>
                            
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={subPerms.can_read} onChange={() => handleToggle(sub.id, 'can_read')} /></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={subPerms.can_create} onChange={() => handleToggle(sub.id, 'can_create')} /></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={subPerms.can_update} onChange={() => handleToggle(sub.id, 'can_update')} /></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={subPerms.can_delete} onChange={() => handleToggle(sub.id, 'can_delete')} /></div>
                            <div className="p-2.5 xl:p-5 flex justify-center"><CheckboxItem checked={subPerms.can_report} onChange={() => handleToggle(sub.id, 'can_report')} /></div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-[#2E3A47]">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded border border-stroke py-2 px-4 font-medium text-black hover:shadow-1 dark:border-[#2E3A47] dark:text-white text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={handleSave} className="rounded bg-blue-600 py-2 px-4 font-medium text-white hover:bg-opacity-90 text-xs cursor-pointer">Simpan Hak Akses</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}