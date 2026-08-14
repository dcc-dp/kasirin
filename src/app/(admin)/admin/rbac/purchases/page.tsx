import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PurchaseTable from "./components/PurchaseTable";

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Purchases" />

      <PurchaseTable />
    </div>
  );
}