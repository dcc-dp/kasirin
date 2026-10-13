import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTransactions, getReturnHistory } from "@/actions/transaction";
import TransactionAdminView from "./_components/TransactionAdminView";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  // Kasir tidak boleh mengakses halaman admin secara langsung
  if (session.roleCode === "KSR") {
    redirect("/kasir");
  }

  const [{ list, kpis }, returns] = await Promise.all([
    getTransactions(),
    getReturnHistory(),
  ]);

  return (
    <TransactionAdminView
      initialTransactions={list}
      initialKpis={kpis}
      initialReturns={returns}
      currentUserRole={session.roleCode || "ADM"}
    />
  );
}
