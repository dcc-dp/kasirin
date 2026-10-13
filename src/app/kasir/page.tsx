import React from "react";
import { getProducts, getProductOptions } from "@/actions/product";
import { getActiveShift } from "@/actions/shift";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PosTerminalView from "@/components/pos/PosTerminalView";

export const dynamic = "force-dynamic";

export default async function KasirPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  // Fetch initial data secara paralel
  const [productList, productOptions, activeShift] = await Promise.all([
    getProducts(),
    getProductOptions(),
    getActiveShift(session.userId),
  ]);

  const mappedProducts = (productList || []).map((p: any) => ({
    id: p.id,
    barcode: p.barcode,
    name: p.name,
    description: p.description,
    purchase_price: p.purchase_price,
    selling_price: p.selling_price,
    stock: p.stock,
    category_id: p.category_id,
    category_name: p.category_name,
    unit_name: p.unit_name,
  }));

  const mappedCategories = (productOptions.categories || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }));

  const currentUser = {
    id: session.userId,
    name: session.name || "Kasir",
    roleCode: session.roleCode,
  };

  return (
    <PosTerminalView
      initialProducts={mappedProducts}
      categories={mappedCategories}
      initialActiveShift={activeShift}
      currentUser={currentUser}
    />
  );
}
