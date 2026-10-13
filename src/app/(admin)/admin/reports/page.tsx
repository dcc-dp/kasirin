import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFinancialReport } from "@/actions/report";
import FinancialReportView from "./_components/FinancialReportView";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  // Route Guard: Kasir tidak diizinkan mengakses laporan keuangan toko
  if (session.roleCode === "KSR") {
    redirect("/kasir");
  }

  const initialData = await getFinancialReport({ period: "month" });

  return <FinancialReportView initialData={initialData} />;
}
