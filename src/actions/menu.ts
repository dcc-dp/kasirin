"use server";

import { getDb } from "@/db";
import { menus, role_permissions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import React from "react";
import { 
  BoxCubeIcon, 
  ChevronDownIcon, 
  GridIcon, 
  HorizontaLDots, 
  ListIcon, 
  PageIcon, 
  PlugInIcon, 
  TableIcon, 
  UserCircleIcon 
} from "@/icons";

export async function getSidebarMenus() {
  const session = await getSession();
  if (!session) return [];

  const db = getDb();

  // Get menus allowed for this role
  const permissions = await db
    .select({
      menu_id: role_permissions.menu_id,
      can_read: role_permissions.can_read,
      name: menus.name,
      path: menus.path,
      icon: menus.icon,
      parent_id: menus.parent_id
    })
    .from(role_permissions)
    .innerJoin(menus, eq(role_permissions.menu_id, menus.id))
    .where(and(eq(role_permissions.role_id, session.roleId), eq(role_permissions.can_read, true)));

  // Reconstruct hierarchy
  const parentMenus = permissions.filter((p: any) => !p.parent_id);
  const result = parentMenus.map((parent: any) => {
    const subItems = permissions
      .filter((p: any) => p.parent_id === parent.menu_id)
      .map((sub: any) => ({ name: sub.name, path: sub.path }));

    return {
      name: parent.name,
      path: parent.path,
      iconName: parent.icon,
      subItems: subItems.length > 0 ? subItems : undefined
    };
  });

  return result;
}
