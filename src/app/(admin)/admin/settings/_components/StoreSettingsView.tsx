"use client";

import React, { useState, useTransition } from "react";
import type { StoreSettingsData, UpdateSettingsInput } from "@/actions/setting";
import { updateStoreSettings } from "@/actions/setting";
import { formatRupiah } from "@/lib/financial";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Globe,
  HardDrive,
  Info,
  Lock,
  Mail,
  MapPin,
  Percent,
  Phone,
  Printer,
  RefreshCw,
  Save,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
} from "lucide-react";

interface StoreSettingsViewProps {
  initialSettings: StoreSettingsData;
}

export default function StoreSettingsView({
  initialSettings,
}: StoreSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"store" | "security">("store");
  const [isPending, startTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState<UpdateSettingsInput>({
    store_name: initialSettings.store_name,
    address: initialSettings.address,
    phone: initialSettings.phone || "",
    email: initialSettings.email,
    logo: initialSettings.logo,
    tax: initialSettings.tax,
    receipt_footer: initialSettings.receipt_footer || "",
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Live Struk Thermal Width
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("58mm");

  // SRE Live Health Test State
  const [healthTesting, setHealthTesting] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [readyTesting, setReadyTesting] = useState(false);
  const [readyData, setReadyData] = useState<any>(null);

  // Handle Input Changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "tax" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateStoreSettings(formData);
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Pengaturan toko berhasil diperbarui!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menyimpan perubahan.",
        });
      }
    });
  };

  // Run Live Health Probe Test
  const runHealthProbe = async () => {
    setHealthTesting(true);
    try {
      const start = performance.now();
      const res = await fetch("/api/health");
      const json = await res.json();
      const latency = Math.round(performance.now() - start);
      setHealthData({ ...json, client_latency_ms: latency, http_status: res.status });
    } catch (err: any) {
      setHealthData({ error: err.message, http_status: 500 });
    } finally {
      setHealthTesting(false);
    }
  };

  // Run Live Readiness Probe Test
  const runReadyProbe = async () => {
    setReadyTesting(true);
    try {
      const start = performance.now();
      const res = await fetch("/api/ready");
      const json = await res.json();
      const latency = Math.round(performance.now() - start);
      setReadyData({ ...json, client_latency_ms: latency, http_status: res.status });
    } catch (err: any) {
      setReadyData({ error: err.message, http_status: 500 });
    } finally {
      setReadyTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <Store className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            Pengaturan Toko & Keamanan SRE
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kelola profil resmi usaha, konfigurasi struk nota kasir, tarif PPN default, dan pantau keandalan sistem (*SRE Health Probes*).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab("store")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "store"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Profil & Struk Toko
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("security");
              if (!healthData) runHealthProbe();
              if (!readyData) runReadyProbe();
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "security"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Audit Keamanan & SRE
          </button>
        </div>
      </div>

      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/40"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAB 1: Profil & Struk Toko */}
      {activeTab === "store" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Formulir Pengaturan (7 Cols) */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900"
            >
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-500" />
                  Identitas Usaha & Struk Nota
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Informasi di bawah ini akan tercetak langsung pada struk belanja pelanggan dan laporan resmi toko.
                </p>
              </div>

              <div className="space-y-4">
                {/* Nama Toko */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Nama Toko / Usaha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="store_name"
                      required
                      value={formData.store_name}
                      onChange={handleChange}
                      placeholder="Contoh: Toko Berkah Makmur"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                    />
                  </div>
                </div>

                {/* Alamat Fisik Toko */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Alamat Lengkap Toko <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      name="address"
                      required
                      rows={2}
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Contoh: Jl. Malioboro No. 45, Yogyakarta"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                    />
                  </div>
                </div>

                {/* Kontak: Telepon & Email (Grid 2 Cols) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Nomor Telepon / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        placeholder="Contoh: 0812-3456-7890"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Email Toko
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Contoh: kontak@toko.com"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarif Pajak PPN & Logo URL */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Tarif PPN Default (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        name="tax"
                        min="0"
                        max="100"
                        required
                        value={formData.tax}
                        onChange={handleChange}
                        placeholder="11"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Digunakan saat kalkulasi transaksi POS jika pajak diaktifkan.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Logo Toko (URL / SVG)
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="logo"
                        value={formData.logo || ""}
                        onChange={handleChange}
                        placeholder="/images/logo/logo.svg"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Pesan Kaki Struk Nota */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Catatan Kaki Struk (*Receipt Footer Message*)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="receipt_footer"
                      value={formData.receipt_footer || ""}
                      onChange={handleChange}
                      placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar kecuali ada cacat produksi"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-98 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Thermal Receipt Simulator (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-brand-500" />
                Live Pratinjau Struk Kasir
              </span>

              {/* Paper width toggler */}
              <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPaperWidth("58mm")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    paperWidth === "58mm"
                      ? "bg-white dark:bg-gray-700 text-brand-600 shadow-2xs"
                      : "text-gray-500"
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth("80mm")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    paperWidth === "80mm"
                      ? "bg-white dark:bg-gray-700 text-brand-600 shadow-2xs"
                      : "text-gray-500"
                  }`}
                >
                  80mm
                </button>
              </div>
            </div>

            {/* Thermal Receipt Paper Container */}
            <div className="rounded-2xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-800 dark:bg-black/20 flex justify-center">
              <div
                className={`bg-white text-black font-mono text-[11px] p-4 rounded-lg shadow-md border border-gray-300 transition-all ${
                  paperWidth === "58mm" ? "w-[260px]" : "w-[340px]"
                }`}
              >
                {/* Toko Header */}
                <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                  <h4 className="font-extrabold text-sm tracking-wider uppercase text-gray-900">
                    {formData.store_name || "NAMA TOKO ANDA"}
                  </h4>
                  <p className="text-[10px] text-gray-600 leading-tight mt-0.5">
                    {formData.address || "Alamat Toko Belum Diatur"}
                  </p>
                  {formData.phone && (
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      Telp: {formData.phone}
                    </p>
                  )}
                  {formData.email && (
                    <p className="text-[9px] text-gray-500">
                      {formData.email}
                    </p>
                  )}
                </div>

                {/* Contoh Transaksi Meta */}
                <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>No: INV-20261014-001</span>
                    <span>14/10/2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir: Kasir Toko</span>
                    <span>12:30:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan: Budi Santoso</span>
                    <span>(Member)</span>
                  </div>
                </div>

                {/* Contoh Item Belanja */}
                <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1.5 text-[10px]">
                  <div>
                    <div className="font-bold">Indomie Goreng Original</div>
                    <div className="flex justify-between text-gray-600">
                      <span>3 x Rp 3.500</span>
                      <span>Rp 10.500</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">Kopi Kapal Api Special 165g</div>
                    <div className="flex justify-between text-gray-600">
                      <span>1 x Rp 14.500</span>
                      <span>Rp 14.500</span>
                    </div>
                  </div>
                </div>

                {/* Ringkasan & Total */}
                <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp 25.000</span>
                  </div>
                  {formData.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>PPN ({formData.tax}%):</span>
                      <span>{formatRupiah(Math.round(25000 * (formData.tax / 100)))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>
                      {formatRupiah(25000 + Math.round(25000 * (formData.tax / 100)))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span>BAYAR (TUNAI):</span>
                    <span>Rp 50.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KEMBALIAN:</span>
                    <span>
                      {formatRupiah(50000 - (25000 + Math.round(25000 * (formData.tax / 100))))}
                    </span>
                  </div>
                </div>

                {/* Footer Struk */}
                <div className="text-center text-[10px] text-gray-600 pt-1 space-y-1">
                  <p className="font-medium italic">
                    {formData.receipt_footer || "Terima Kasih Atas Kunjungan Anda!"}
                  </p>
                  <p className="text-[9px] text-gray-400 font-mono">
                    *** STRUK RESMI KASIRIN POS ***
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Keamanan & SRE Health */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* SRE Probes Live Tester */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Liveness Probe Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Liveness Probe (`/api/health`)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Memantau kestabilan runtime web server
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runHealthProbe}
                  disabled={healthTesting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${healthTesting ? "animate-spin" : ""}`}
                  />
                  Test Ping
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {healthData ? (
                  <div className="rounded-xl bg-gray-50 p-4 font-mono text-xs dark:bg-gray-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status Response:</span>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        HTTP {healthData.http_status} {healthData.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Client Latency:</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {healthData.client_latency_ms} ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Uptime:</span>
                      <span>{healthData.uptime_seconds} detik</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Memory RSS / Heap:</span>
                      <span>
                        {healthData.memory?.rss} / {healthData.memory?.heapUsed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Environment:</span>
                      <span className="capitalize">{healthData.environment}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 text-xs text-gray-400">
                    Klik &quot;Test Ping&quot; untuk menjalankan probe.
                  </div>
                )}
              </div>
            </div>

            {/* Readiness Probe Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Readiness Probe (`/api/ready`)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Uji konektivitas pool MySQL sebelum melayani traffic
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runReadyProbe}
                  disabled={readyTesting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${readyTesting ? "animate-spin" : ""}`}
                  />
                  Test Ping
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {readyData ? (
                  <div className="rounded-xl bg-gray-50 p-4 font-mono text-xs dark:bg-gray-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status Response:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${
                          readyData.http_status === 200
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                        }`}
                      >
                        HTTP {readyData.http_status} {readyData.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Database Engine:</span>
                      <span className="font-bold">{readyData.database?.engine || "MySQL"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">DB Ping Latency:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {readyData.database?.latency_ms ?? "-"} ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Client Latency:</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {readyData.client_latency_ms} ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Timestamp:</span>
                      <span className="text-[10px]">{readyData.timestamp}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 text-xs text-gray-400">
                    Klik &quot;Test Ping&quot; untuk menjalankan probe.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Headers & Proteksi Audit Checklist */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Matriks Audit Keamanan & Hardening (DevSecOps)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Standar perlindungan data toko dan pencegahan manipulasi transaksi kasir.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Header 1: Anti Clickjacking */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    X-Frame-Options
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    SAMEORIGIN
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Mencegah antarmuka POS kasir ditanam di dalam `&lt;iframe&gt;` oleh pihak luar (*Clickjacking Prevention*).
                </p>
              </div>

              {/* Header 2: MIME Sniffing */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    X-Content-Type-Options
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    nosniff
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Memaksa browser mematuhi MIME types dan menolak eksekusi file berbahaya yang disamarkan.
                </p>
              </div>

              {/* Header 3: HSTS */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Strict-Transport-Security
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    2 Tahun HSTS
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Memastikan komunikasi selalu terenkripsi HTTPS dan menolak downgrade ke HTTP biasa.
                </p>
              </div>

              {/* Header 4: Brute Force Protection */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Anti Brute-Force Rate Limiter
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Max 5x / 15m
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Mengunci percobaan login otomatis jika terdeteksi 5 kali gagal berturut-turut untuk melindungi akun admin & kasir.
                </p>
              </div>

              {/* Header 5: JWT HS256 & HttpOnly */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Signed JWT HttpOnly Cookie
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    HS256 Sign
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Cookie sesi tidak dapat dibaca oleh skrip JavaScript sisi klien (*XSS cookie theft immune*).
                </p>
              </div>

              {/* Header 6: ACID Negative Stock Prevention */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Integritas Stok ACID
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Stok Minus = Ditolak
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Klausa atomik menolak transaksi penjualan jika stok fisik di database tidak mencukupi (pencegahan race condition).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
