import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStoreSettings } from "@/actions/setting";
import StoreSettingsView from "./_components/StoreSettingsView";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  // Route Guard: Kasir dilarang mengakses konfigurasi toko
  if (session.roleCode === "KSR") {
    redirect("/kasir");
  }

  const settings = await getStoreSettings();

  return <StoreSettingsView initialSettings={settings} />;
}
