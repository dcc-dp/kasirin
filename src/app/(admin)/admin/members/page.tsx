"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  adjustMemberPoints,
  type MemberWithStats,
} from "@/actions/member";
import { formatRupiah } from "@/lib/financial";
import { maskPhoneNumber } from "@/lib/privacy";
import {
  Award,
  Coins,
  Edit,
  Eye,
  EyeOff,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export default function MembersPage() {
  const [membersList, setMembersList] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [hidePII, setHidePII] = useState(true); // Default privasi aktif

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingMember, setEditingMember] = useState<MemberWithStats | null>(null);
  const [deletingMember, setDeletingMember] = useState<MemberWithStats | null>(null);
  const [pointMember, setPointMember] = useState<MemberWithStats | null>(null);

  // Form State
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Point Adjustment State
  const [pointAdjustment, setPointAdjustment] = useState<number>(10);
  const [pointReason, setPointReason] = useState<string>("Reward Loyalitas Pelanggan");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMembers();
      setMembersList(data);
    } catch (error) {
      console.error("Load members error:", error);
      alert("Gagal memuat data member.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMembers = useMemo(() => {
    return membersList.filter((m) => {
      const q = searchQuery.toLowerCase();
      return m.nama.toLowerCase().includes(q) || m.phone.toLowerCase().includes(q);
    });
  }, [membersList, searchQuery]);

  const stats = useMemo(() => {
    const totalMembers = membersList.length;
    const totalPoints = membersList.reduce((acc, m) => acc + m.poin, 0);
    const totalSpent = membersList.reduce((acc, m) => acc + m.total_spent, 0);
    const activeMembers = membersList.filter((m) => m.total_transactions > 0).length;

    return { totalMembers, totalPoints, totalSpent, activeMembers };
  }, [membersList]);

  const openCreateModal = () => {
    setEditingMember(null);
    setNama("");
    setPhone("");
    setAddress("");
    setShowModal(true);
  };

  const openEditModal = (member: MemberWithStats) => {
    setEditingMember(member);
    setNama(member.nama);
    setPhone(member.phone);
    setAddress(member.address || "");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingMember(null);
    setNama("");
    setPhone("");
    setAddress("");
  };

  const openPointModal = (member: MemberWithStats) => {
    setPointMember(member);
    setPointAdjustment(10);
    setPointReason("Reward Loyalitas Pelanggan");
    setShowPointModal(true);
  };

  const closePointModal = () => {
    if (saving) return;
    setShowPointModal(false);
    setPointMember(null);
  };

  const openDeleteModal = (member: MemberWithStats) => {
    setDeletingMember(member);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeletingMember(null);
    setShowDeleteModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      alert("Nama lengkap member wajib diisi.");
      return;
    }

    if (!phone.trim() || phone.length < 9) {
      alert("Nomor telepon minimal 9 digit.");
      return;
    }

    try {
      setSaving(true);
      let res;

      if (editingMember) {
        res = await updateMember(editingMember.id, { nama, phone, address });
      } else {
        res = await createMember({ nama, phone, address });
      }

      if (!res.success) {
        alert(res.message);
        return;
      }

      alert(res.message);
      closeModal();
      await loadData();
    } catch (err) {
      console.error("Save member error:", err);
      alert("Terjadi kesalahan saat menyimpan member.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointMember) return;

    if (pointAdjustment === 0) {
      alert("Nilai penyesuaian poin tidak boleh 0.");
      return;
    }

    try {
      setSaving(true);
      const res = await adjustMemberPoints(pointMember.id, pointAdjustment, pointReason);

      if (!res.success) {
        alert(res.message);
        return;
      }

      alert(res.message);
      closePointModal();
      await loadData();
    } catch (err) {
      console.error("Adjust points error:", err);
      alert("Gagal memperbarui saldo poin member.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMember) return;

    try {
      setDeleting(true);
      const res = await deleteMember(deletingMember.id);

      if (!res.success) {
        alert(res.message);
        return;
      }

      alert(res.message);
      closeDeleteModal();
      await loadData();
    } catch (err) {
      console.error("Delete member error:", err);
      alert("Gagal menghapus member.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Master Data Member & Loyalitas
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola pelanggan setia toko, perolehan saldo poin belanja, dan program reward member.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHidePII(!hidePII)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
              hidePII
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {hidePII ? (
              <>
                <Shield className="h-4 w-4 text-emerald-600" />
                PII Sensor Aktif
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-gray-500" />
                Tampilkan Nomor HP
              </>
            )}
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Daftarkan Member
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Member
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalMembers}
            </span>
            <span className="text-xs text-gray-500">orang</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Poin Beredar
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.totalPoints.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400">poin reward</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Akumulasi Belanja Member
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(stats.totalSpent)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Member Aktif Belanja
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.activeMembers}
            </span>
            <span className="text-xs text-gray-500">pernah transaksi</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama member / nomor HP..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Member Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">Nama Member</th>
                <th className="px-5 py-3.5">Kontak / WhatsApp</th>
                <th className="px-5 py-3.5">Alamat Domisili</th>
                <th className="px-5 py-3.5 text-center">Saldo Poin</th>
                <th className="px-5 py-3.5 text-right">Total Belanja</th>
                <th className="px-5 py-3.5 text-center">Transaksi</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4 text-center">
                      <div className="h-4 w-4 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-5 w-16 mx-auto rounded-full bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-4 w-8 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 w-24 ml-auto rounded bg-gray-200 dark:bg-gray-800" />
                    </td>
                  </tr>
                ))
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Belum ada member terdaftar.
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Daftarkan nomor telepon pelanggan untuk mulai mengumpulkan poin belanja.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.015]"
                  >
                    <td className="px-5 py-4 text-center text-xs font-medium text-gray-400">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                          {member.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white block">
                            {member.nama}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            ID: #{member.id.toString().padStart(4, "0")}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {hidePII ? maskPhoneNumber(member.phone) : member.phone}
                        </span>
                        <a
                          href={`https://wa.me/${member.phone.replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Chat WhatsApp Member"
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {member.address || "-"}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        {member.poin}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                      {formatRupiah(member.total_spent)}
                    </td>

                    <td className="px-5 py-4 text-center text-xs text-gray-500">
                      {member.total_transactions}x belanja
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Adjust Points */}
                        <button
                          type="button"
                          title="Koreksi / Reward Poin"
                          onClick={() => openPointModal(member)}
                          className="rounded-lg border border-gray-200 p-2 text-amber-600 hover:bg-amber-50 dark:border-gray-750 dark:text-amber-400 dark:hover:bg-amber-950/40"
                        >
                          <Coins className="h-3.5 w-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="Edit Member"
                          onClick={() => openEditModal(member)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-750 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Hapus */}
                        <button
                          type="button"
                          title="Hapus Member"
                          onClick={() => openDeleteModal(member)}
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Member */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingMember ? "Edit Profil Member" : "Registrasi Member Baru"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pelanggan dapat mengumpulkan poin reward setiap transaksi di kasir
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nama Lengkap Member *
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Rina Anggraini"
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 font-mono text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
                <span className="mt-1 block text-[11px] text-gray-400">
                  Digunakan untuk identifikasi member saat transaksi di layar POS kasir.
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Alamat Domisili (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat tempat tinggal member..."
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-transparent px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 shadow-md shadow-brand-500/20"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingMember
                    ? "Simpan Perubahan"
                    : "Daftarkan Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Koreksi / Reward Poin */}
      {showPointModal && pointMember && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Atur Poin Member
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {pointMember.nama} (Poin saat ini: {pointMember.poin})
                  </p>
                </div>
              </div>
              <button
                onClick={closePointModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Penyesuaian Poin (+ / -)
                </label>
                <div className="flex gap-2 mb-2">
                  {[+10, +25, +50, -10].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPointAdjustment(val)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                        pointAdjustment === val
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                      }`}
                    >
                      {val > 0 ? `+${val}` : val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={pointAdjustment}
                  onChange={(e) => setPointAdjustment(Number(e.target.value))}
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Estimasi Saldo Baru:{" "}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {Math.max(0, pointMember.poin + pointAdjustment)} Poin
                  </strong>
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Alasan Penyesuaian
                </label>
                <input
                  type="text"
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  placeholder="Misal: Reward Ulang Tahun / Koreksi Human Error"
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePointModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 shadow-md shadow-amber-500/20"
                >
                  {saving ? "Menyimpan..." : "Simpan Poin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Member */}
      {showDeleteModal && deletingMember && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Hapus Member?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Apakah Anda yakin ingin menghapus member{" "}
              <strong className="text-gray-800 dark:text-white">
                "{deletingMember.nama}"
              </strong>
              ?
            </p>
            {deletingMember.total_transactions > 0 && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                ⚠️ Member ini memiliki {deletingMember.total_transactions} riwayat transaksi belanja dan tidak dapat dihapus demi integritas pembukuan kasir.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deletingMember.total_transactions > 0}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-600/20"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
