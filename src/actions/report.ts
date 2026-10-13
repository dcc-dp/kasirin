"use server";

import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  transactions,
  transaction_details,
  products,
  members,
  users,
  purchases,
  cash_shifts,
  returns,
  return_details,
  categoris,
} from "@/db/schema";
import { getSession } from "@/lib/auth";

export type FinancialSummary = {
  gross_sales: number;
  total_discount: number;
  total_tax: number;
  total_refund: number;
  net_sales: number;
  cogs: number; // Cost of Goods Sold (HPP)
  gross_profit: number; // Net Sales - HPP
  profit_margin: number; // (Gross Profit / Net Sales) * 100
  restock_expenses: number;
  cash_difference: number;
  transaction_count: number;
  average_basket_size: number;
};

export type PaymentBreakdownItem = {
  method: "cash" | "qris" | "transfer";
  label: string;
  total_amount: number;
  count: number;
  percentage: number;
};

export type DailyTrendItem = {
  date: string;
  revenue: number;
  cogs: number;
  profit: number;
  transactions: number;
};

export type TopProductItem = {
  product_id: number;
  name: string;
  category_name: string;
  quantity_sold: number;
  total_revenue: number;
  total_profit: number;
};

export type CashierPerformanceItem = {
  user_id: number;
  cashier_name: string;
  transaction_count: number;
  total_sales: number;
  average_sale: number;
  shifts_count: number;
  net_difference: number;
};

export type ExportTransactionRow = {
  invoice_number: string;
  transaction_date: string;
  time: string;
  cashier_name: string;
  customer_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  payment_method: string;
  cogs: number;
  gross_profit: number;
  status: string;
};

export type FinancialReportData = {
  summary: FinancialSummary;
  paymentBreakdown: PaymentBreakdownItem[];
  dailyTrends: DailyTrendItem[];
  topProducts: TopProductItem[];
  cashierPerformance: CashierPerformanceItem[];
  dateRange: {
    start: string;
    end: string;
    periodLabel: string;
  };
};

/**
 * Mengambil Laporan Keuangan, Analisis Laba Rugi, dan Breakdown Performa Toko
 */
export async function getFinancialReport(filters?: {
  period?: "today" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}): Promise<FinancialReportData> {
  const db = getDb();

  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), 1); // Default awal bulan ini
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let periodLabel = "Bulan Ini";

  const period = filters?.period || "month";

  if (period === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    periodLabel = "Hari Ini";
  } else if (period === "week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Senin
    start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    periodLabel = "Minggu Ini";
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    periodLabel = "Bulan Ini";
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    periodLabel = "Tahun Ini";
  } else if (period === "custom" && filters?.startDate) {
    start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);
    if (filters.endDate) {
      end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
    }
    periodLabel = `${start.toLocaleDateString("id-ID")} - ${end.toLocaleDateString("id-ID")}`;
  }

  // 1. Ambil transaksi yang berstatus 'paid' dalam periode
  const paidTxList = await db
    .select({
      id: transactions.id,
      invoice_number: transactions.invoice_number,
      transaction_date: transactions.transaction_date,
      subtotal: transactions.subtotal,
      discount: transactions.discount,
      tax: transactions.tax,
      grand_total: transactions.grand_total,
      payment_method: transactions.payment_methode,
      user_id: transactions.user_id,
      user_name: users.name,
      member_name: members.nama,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.user_id, users.id))
    .leftJoin(members, eq(transactions.member_id, members.id))
    .where(
      and(
        eq(transactions.status, "paid"),
        gte(transactions.transaction_date, start),
        lte(transactions.transaction_date, end)
      )
    )
    .orderBy(desc(transactions.transaction_date));

  const txIds = paidTxList.map((t: any) => t.id);

  // 2. Ambil detail items transaksi untuk hitung HPP (COGS)
  let txDetailsList: {
    transaction_id: number;
    product_id: number;
    name: string;
    selling_price: number;
    purchase_price: number;
    quantity: number;
    subtotal: number;
  }[] = [];

  if (txIds.length > 0) {
    txDetailsList = await db
      .select({
        transaction_id: transaction_details.transaction_id,
        product_id: transaction_details.product_id,
        name: transaction_details.name,
        selling_price: transaction_details.selling_price,
        purchase_price: transaction_details.purchase_price,
        quantity: transaction_details.quantity,
        subtotal: transaction_details.subtotal,
      })
      .from(transaction_details)
      .where(sql`${transaction_details.transaction_id} IN (${sql.join(txIds, sql`, `)})`);
  }

  // 3. Ambil data retur dalam rentang tanggal
  const returnList = await db
    .select({
      id: returns.id,
      transaction_id: returns.transaction_id,
      total_refund: returns.total_refund,
      refund_method: returns.refund_method,
      created_at: returns.created_at,
    })
    .from(returns)
    .where(
      and(
        gte(returns.created_at, start),
        lte(returns.created_at, end)
      )
    );

  // Ambil detail retur untuk koreksi HPP barang layak jual
  let returnItemsList: {
    product_id: number;
    quantity: number;
    price: number;
    item_condition: string;
  }[] = [];

  if (returnList.length > 0) {
    const returnIds = returnList.map((r: any) => r.id);
    returnItemsList = await db
      .select({
        product_id: return_details.product_id,
        quantity: return_details.quantity,
        price: return_details.price,
        item_condition: return_details.item_condition,
      })
      .from(return_details)
      .where(sql`${return_details.return_id} IN (${sql.join(returnIds, sql`, `)})`);
  }

  // 4. Ambil beban pembelian restock dari supplier dalam periode
  const [purchaseSummary] = await db
    .select({
      total_purchases: sql<number>`COALESCE(SUM(${purchases.total}), 0)`.mapWith(Number),
    })
    .from(purchases)
    .where(
      and(
        gte(purchases.purchase_date, start),
        lte(purchases.purchase_date, end)
      )
    );

  // 5. Ambil data shift kasir untuk menghitung net selisih kas fisik
  const shiftList = await db
    .select({
      id: cash_shifts.id,
      user_id: cash_shifts.user_id,
      user_name: users.name,
      difference: cash_shifts.difference,
      created_at: cash_shifts.created_at,
    })
    .from(cash_shifts)
    .leftJoin(users, eq(cash_shifts.user_id, users.id))
    .where(
      and(
        gte(cash_shifts.start_time, start),
        lte(cash_shifts.start_time, end)
      )
    );

  // ===================== KALKULASI FINANSIAL =====================
  const grossSales = paidTxList.reduce((acc: number, t: any) => acc + t.subtotal, 0);
  const totalDiscount = paidTxList.reduce((acc: number, t: any) => acc + t.discount, 0);
  const totalTax = paidTxList.reduce((acc: number, t: any) => acc + t.tax, 0);
  const totalRefund = returnList.reduce((acc: number, r: any) => acc + r.total_refund, 0);

  // Net Sales = Penjualan Kotor - Diskon - Retur
  const netSales = Math.max(0, grossSales - totalDiscount - totalRefund);

  // Hitung HPP (COGS): Modal barang yang terjual
  let rawCogs = txDetailsList.reduce(
    (acc, it) => acc + it.purchase_price * it.quantity,
    0
  );

  // Koreksi HPP: jika barang diretur layak jual ('good'), modal barang tersebut kembali ke toko
  for (const retItem of returnItemsList) {
    if (retItem.item_condition === "good") {
      // Cari produk purchase price
      const matched = txDetailsList.find((td) => td.product_id === retItem.product_id);
      const unitHpp = matched?.purchase_price || 0;
      rawCogs = Math.max(0, rawCogs - unitHpp * retItem.quantity);
    }
  }

  const cogs = rawCogs;
  const grossProfit = netSales - cogs;
  const profitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
  const restockExpenses = purchaseSummary?.total_purchases || 0;
  const cashDifference = shiftList.reduce((acc: number, s: any) => acc + (s.difference || 0), 0);
  const transactionCount = paidTxList.length;
  const averageBasketSize = transactionCount > 0 ? Math.round(netSales / transactionCount) : 0;

  // ===================== BREAKDOWN PEMBAYARAN =====================
  const paymentTotals: Record<"cash" | "qris" | "transfer", { amount: number; count: number }> = {
    cash: { amount: 0, count: 0 },
    qris: { amount: 0, count: 0 },
    transfer: { amount: 0, count: 0 },
  };

  paidTxList.forEach((t: any) => {
    const method = t.payment_method as "cash" | "qris" | "transfer";
    if (paymentTotals[method]) {
      paymentTotals[method].amount += t.grand_total;
      paymentTotals[method].count += 1;
    }
  });

  const totalPaidSum =
    paymentTotals.cash.amount + paymentTotals.qris.amount + paymentTotals.transfer.amount;

  const paymentBreakdown: PaymentBreakdownItem[] = [
    {
      method: "cash",
      label: "Tunai (Cash)",
      total_amount: paymentTotals.cash.amount,
      count: paymentTotals.cash.count,
      percentage: totalPaidSum > 0 ? Math.round((paymentTotals.cash.amount / totalPaidSum) * 100) : 0,
    },
    {
      method: "qris",
      label: "QRIS",
      total_amount: paymentTotals.qris.amount,
      count: paymentTotals.qris.count,
      percentage: totalPaidSum > 0 ? Math.round((paymentTotals.qris.amount / totalPaidSum) * 100) : 0,
    },
    {
      method: "transfer",
      label: "Transfer Bank",
      total_amount: paymentTotals.transfer.amount,
      count: paymentTotals.transfer.count,
      percentage: totalPaidSum > 0 ? Math.round((paymentTotals.transfer.amount / totalPaidSum) * 100) : 0,
    },
  ];

  // ===================== TREN HARIAN (APEXCHARTS) =====================
  // Kelompokkan per tanggal (YYYY-MM-DD)
  const dailyMap = new Map<string, { revenue: number; cogs: number; profit: number; count: number }>();

  // Inisialisasi rentang hari (jika range <= 31 hari)
  const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (dayDiff <= 31) {
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().split("T")[0];
      dailyMap.set(key, { revenue: 0, cogs: 0, profit: 0, count: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // Petakan HPP per transaksi
  const txCogsMap = new Map<number, number>();
  txDetailsList.forEach((td) => {
    const cur = txCogsMap.get(td.transaction_id) || 0;
    txCogsMap.set(td.transaction_id, cur + td.purchase_price * td.quantity);
  });

  paidTxList.forEach((t: any) => {
    if (!t.transaction_date) return;
    const dateKey = new Date(t.transaction_date).toISOString().split("T")[0];
    const prev = dailyMap.get(dateKey) || { revenue: 0, cogs: 0, profit: 0, count: 0 };
    const tCogs = txCogsMap.get(t.id) || 0;
    const tProfit = t.grand_total - tCogs;

    dailyMap.set(dateKey, {
      revenue: prev.revenue + t.grand_total,
      cogs: prev.cogs + tCogs,
      profit: prev.profit + tProfit,
      count: prev.count + 1,
    });
  });

  // Kurangi refund pada hari retur terjadi
  returnList.forEach((r: any) => {
    const dateKey = new Date(r.created_at).toISOString().split("T")[0];
    const prev = dailyMap.get(dateKey);
    if (prev) {
      prev.revenue = Math.max(0, prev.revenue - r.total_refund);
      prev.profit = Math.max(0, prev.profit - r.total_refund);
    }
  });

  const dailyTrends: DailyTrendItem[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, val]) => ({
      date,
      revenue: val.revenue,
      cogs: val.cogs,
      profit: val.profit,
      transactions: val.count,
    }));

  // ===================== TOP 10 PRODUK TERLARIS =====================
  const productAggMap = new Map<
    number,
    { name: string; quantity: number; revenue: number; profit: number }
  >();

  txDetailsList.forEach((td) => {
    const prev = productAggMap.get(td.product_id) || {
      name: td.name,
      quantity: 0,
      revenue: 0,
      profit: 0,
    };
    const lineRev = td.selling_price * td.quantity;
    const lineCogs = td.purchase_price * td.quantity;
    const lineProfit = lineRev - lineCogs;

    productAggMap.set(td.product_id, {
      name: td.name,
      quantity: prev.quantity + td.quantity,
      revenue: prev.revenue + lineRev,
      profit: prev.profit + lineProfit,
    });
  });

  // Ambil kategori untuk produk-produk ini
  const allCategories = await db.select().from(categoris);
  const allProds = await db.select({ id: products.id, category_id: products.category_id }).from(products);
  const prodCatMap = new Map<number, string>();
  allProds.forEach((p: any) => {
    const cat = allCategories.find((c: any) => c.id === p.category_id);
    prodCatMap.set(p.id, cat?.name || "Umum");
  });

  const topProducts: TopProductItem[] = Array.from(productAggMap.entries())
    .map(([prodId, data]) => ({
      product_id: prodId,
      name: data.name,
      category_name: prodCatMap.get(prodId) || "Umum",
      quantity_sold: data.quantity,
      total_revenue: data.revenue,
      total_profit: data.profit,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10);

  // ===================== PERFORMA KASIR =====================
  const cashierMap = new Map<
    number,
    { name: string; txCount: number; sales: number; shiftsCount: number; difference: number }
  >();

  paidTxList.forEach((t: any) => {
    const prev = cashierMap.get(t.user_id) || {
      name: t.user_name || "Kasir",
      txCount: 0,
      sales: 0,
      shiftsCount: 0,
      difference: 0,
    };
    cashierMap.set(t.user_id, {
      ...prev,
      txCount: prev.txCount + 1,
      sales: prev.sales + t.grand_total,
    });
  });

  shiftList.forEach((s: any) => {
    const prev = cashierMap.get(s.user_id) || {
      name: s.user_name || "Kasir",
      txCount: 0,
      sales: 0,
      shiftsCount: 0,
      difference: 0,
    };
    cashierMap.set(s.user_id, {
      ...prev,
      shiftsCount: prev.shiftsCount + 1,
      difference: prev.difference + (s.difference || 0),
    });
  });

  const cashierPerformance: CashierPerformanceItem[] = Array.from(cashierMap.entries()).map(
    ([userId, data]) => ({
      user_id: userId,
      cashier_name: data.name,
      transaction_count: data.txCount,
      total_sales: data.sales,
      average_sale: data.txCount > 0 ? Math.round(data.sales / data.txCount) : 0,
      shifts_count: data.shiftsCount,
      net_difference: data.difference,
    })
  );

  return {
    summary: {
      gross_sales: grossSales,
      total_discount: totalDiscount,
      total_tax: totalTax,
      total_refund: totalRefund,
      net_sales: netSales,
      cogs,
      gross_profit: grossProfit,
      profit_margin: profitMargin,
      restock_expenses: restockExpenses,
      cash_difference: cashDifference,
      transaction_count: transactionCount,
      average_basket_size: averageBasketSize,
    },
    paymentBreakdown,
    dailyTrends,
    topProducts,
    cashierPerformance,
    dateRange: {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      periodLabel,
    },
  };
}

/**
 * Mengambil Seluruh Baris Transaksi Rinci untuk Download Ekspor (Excel & CSV)
 */
export async function getExportReportData(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<ExportTransactionRow[]> {
  const db = getDb();

  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (filters?.startDate) {
    start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);
  }
  if (filters?.endDate) {
    end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
  }

  const txList = await db
    .select({
      id: transactions.id,
      invoice_number: transactions.invoice_number,
      transaction_date: transactions.transaction_date,
      subtotal: transactions.subtotal,
      discount: transactions.discount,
      tax: transactions.tax,
      grand_total: transactions.grand_total,
      payment_method: transactions.payment_methode,
      status: transactions.status,
      cashier_name: users.name,
      customer_name: members.nama,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.user_id, users.id))
    .leftJoin(members, eq(transactions.member_id, members.id))
    .where(
      and(
        gte(transactions.transaction_date, start),
        lte(transactions.transaction_date, end)
      )
    )
    .orderBy(desc(transactions.transaction_date));

  const txIds = txList.map((t: any) => t.id);

  let details: { transaction_id: number; purchase_price: number; quantity: number }[] = [];
  if (txIds.length > 0) {
    details = await db
      .select({
        transaction_id: transaction_details.transaction_id,
        purchase_price: transaction_details.purchase_price,
        quantity: transaction_details.quantity,
      })
      .from(transaction_details)
      .where(sql`${transaction_details.transaction_id} IN (${sql.join(txIds, sql`, `)})`);
  }

  const hppMap = new Map<number, number>();
  details.forEach((d) => {
    const cur = hppMap.get(d.transaction_id) || 0;
    hppMap.set(d.transaction_id, cur + d.purchase_price * d.quantity);
  });

  return txList.map((t: any) => {
    const d = new Date(t.transaction_date || Date.now());
    const cogs = hppMap.get(t.id) || 0;
    const profit = t.status === "paid" ? t.grand_total - cogs : 0;

    return {
      invoice_number: t.invoice_number,
      transaction_date: d.toLocaleDateString("id-ID"),
      time: d.toLocaleTimeString("id-ID"),
      cashier_name: t.cashier_name || "Kasir",
      customer_name: t.customer_name || "Pelanggan Umum",
      subtotal: t.subtotal,
      discount: t.discount,
      tax: t.tax,
      grand_total: t.grand_total,
      payment_method: t.payment_method.toUpperCase(),
      cogs: cogs,
      gross_profit: profit,
      status: t.status === "paid" ? "Sukses" : "Void / Batal",
    };
  });
}
