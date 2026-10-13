import * as XLSX from "xlsx";

/**
 * Utilitas Ekspor Data ke Excel (.xlsx)
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  data: Record<string, any>[]
) {
  if (typeof window === "undefined" || !data || data.length === 0) return;

  // 1. Buat worksheet dari json data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Buat workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Laporan");

  // 3. Tulis dan download file .xlsx
  const validFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, validFilename);
}

/**
 * Utilitas Ekspor Data ke CSV (dengan BOM UTF-8 untuk kompatibilitas penuh Excel)
 */
export function exportToCsv(
  filename: string,
  data: Record<string, any>[],
  headers?: { key: string; label: string }[]
) {
  if (typeof window === "undefined" || !data || data.length === 0) return;

  const columnKeys = headers ? headers.map((h) => h.key) : Object.keys(data[0]);
  const columnLabels = headers ? headers.map((h) => h.label) : columnKeys;

  // Header CSV
  const csvRows: string[] = [];
  csvRows.push(columnLabels.map((label) => `"${label.replace(/"/g, '""')}"`).join(","));

  // Baris Data
  data.forEach((row) => {
    const values = columnKeys.map((key) => {
      const val = row[key];
      const stringVal = val === null || val === undefined ? "" : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  });

  const csvString = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
