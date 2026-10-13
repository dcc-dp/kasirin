"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, History, Tags, Scale } from "lucide-react";

export default function ProductNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Katalog Produk",
      href: "/admin/products",
      icon: Package,
      exact: true,
    },
    {
      name: "Riwayat & Mutasi Stok",
      href: "/admin/products/stock-logs",
      icon: History,
      exact: false,
    },
    {
      name: "Kategori",
      href: "/admin/products/categories",
      icon: Tags,
      exact: false,
    },
    {
      name: "Satuan Unit",
      href: "/admin/products/units",
      icon: Scale,
      exact: false,
    },
  ];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar gap-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              isActive
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? "text-brand-500" : "text-gray-400"}`} />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
