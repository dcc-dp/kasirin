import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";

export default function PurchaseTable() {
  return (
    <ComponentCard title="Purchase List">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Purchase List
          </h2>
          <p className="text-sm text-gray-500">
            Manage purchase transactions from suppliers.
          </p>
        </div>

        <Link
          href="/admin/rbac/purchases/create"
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + New Purchase
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <input
          type="text"
          placeholder="Search Invoice..."
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />

        <select className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900">
          <option>All Supplier</option>
        </select>

        <input
          type="date"
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />

        <button className="rounded-lg bg-gray-800 px-4 py-2 font-medium text-white transition hover:bg-gray-900">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Purchase Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-4 py-4">PO-000001</td>
              <td className="px-4 py-4">PT ABC</td>
              <td className="px-4 py-4">18 Jul 2026</td>
              <td className="px-4 py-4 text-right">Rp 2.500.000</td>
              <td className="px-4 py-4 text-center">
                <Link
                  href="/admin/rbac/purchases/1"
                  className="text-blue-600 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ComponentCard>
  );
}