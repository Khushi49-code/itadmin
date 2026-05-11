"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp, setDoc, getDoc
} from "firebase/firestore";
import {
  Plus, Edit, Trash2, X, Check, Loader2, Search,
  ShieldCheck, LayoutDashboard, BarChart2, Ticket, HardDrive, 
  Building2, Eye
} from "lucide-react";

interface DataItem {
  id: string; name: string; email?: string; role?: string; status?: string;
  createdAt?: Timestamp; [key: string]: unknown;
}
interface AccessConfig { 
  dashboard: boolean; 
  reports: boolean; 
  tickets: boolean; 
  devices: boolean;
  companies: boolean;
}

const PAGE_OPTIONS = [
  { key: "dashboard", label: "Dashboard", desc: "Overview & stats",    icon: LayoutDashboard, accent: "#6366f1", light: "#eef2ff" },
  { key: "reports",   label: "Reports",   desc: "Reports & analytics", icon: BarChart2,       accent: "#8b5cf6", light: "#ede9fe" },
  { key: "tickets",   label: "Tickets",   desc: "Support tickets",     icon: Ticket,          accent: "#f59e0b", light: "#fef3c7" },
  { key: "devices",   label: "Devices",   desc: "Device management",   icon: HardDrive,       accent: "#0ea5e9", light: "#e0f2fe" },
  { key: "companies", label: "Companies", desc: "Company management",   icon: Building2,       accent: "#10b981", light: "#d1fae5" },
];

const FIELDS = [
  { key: "name",   label: "Name",   type: "text" as const },
  { key: "email",  label: "Email",  type: "email" as const },
  { key: "role",   label: "Role",   type: "select" as const, options: ["User","Staff","Manager","Admin"] },
  { key: "status", label: "Status", type: "select" as const, options: ["Active","Inactive","Pending"] },
];

const DEFAULT_ACCESS: AccessConfig = { 
  dashboard: true, 
  reports: false, 
  tickets: false, 
  devices: false,
  companies: true,
};

export default function UsersPage() {
  const [data, setData]               = useState<DataItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [modal, setModal]             = useState<"add"|"edit"|"access"|null>(null);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [formData, setFormData]       = useState<Record<string,string>>({});
  const [accessData, setAccessData]   = useState<AccessConfig>(DEFAULT_ACCESS);
  const [accessLoading, setAccessLoading] = useState(false);
  const [notif, setNotif]             = useState<{msg:string;ok:boolean}|null>(null);
  const [search, setSearch]           = useState("");

  const showNotif = (msg: string, ok = true) => {
    setNotif({ msg, ok }); setTimeout(() => setNotif(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })) as DataItem[]);
    } catch {
      const snap = await getDocs(collection(db, "users"));
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })) as DataItem[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setFormData({ name:"", email:"", role:"User", status:"Active" }); setModal("add"); };
  const openEdit = (item: DataItem) => {
    setEditingItem(item);
    setFormData({ name: item.name??"", email: item.email??"", role: item.role??"User", status: item.status??"Active" });
    setModal("edit");
  };
  const openAccess = async (item: DataItem) => {
    setEditingItem(item); setAccessLoading(true); setModal("access");
    try {
      const snap = await getDoc(doc(db, "user_access", item.id));
      if (snap.exists()) {
        const existingData = snap.data() as AccessConfig;
        setAccessData({
          dashboard: existingData.dashboard ?? true,
          reports: existingData.reports ?? false,
          tickets: existingData.tickets ?? false,
          devices: existingData.devices ?? false,
          companies: existingData.companies ?? true,
        });
      } else {
        setAccessData({ ...DEFAULT_ACCESS });
      }
    } catch { 
      setAccessData({ ...DEFAULT_ACCESS }); 
    }
    finally { setAccessLoading(false); }
  };
  const closeModal = () => { setModal(null); setEditingItem(null); };

  const handleSave = async () => {
    if (!formData.name?.trim()) { showNotif("Name is required", false); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await addDoc(collection(db, "users"), { ...formData, createdAt: Timestamp.now() });
        showNotif("User added!");
      } else if (modal === "edit" && editingItem) {
        await updateDoc(doc(db, "users", editingItem.id), formData);
        showNotif("User updated!");
      }
      closeModal(); fetchData();
    } catch { showNotif("Operation failed", false); }
    finally { setSaving(false); }
  };

  const handleSaveAccess = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "user_access", editingItem.id), accessData);
      showNotif("Access permissions saved!"); 
      closeModal();
    } catch { showNotif("Failed to save access", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      await deleteDoc(doc(db, "user_access", id));
      showNotif("User deleted");
      setData(prev => prev.filter(i => i.id !== id));
    } catch { showNotif("Delete failed", false); }
  };

  const statusStyle = (s?: string) => {
    if (s === "Active")   return "text-green-700 bg-green-50 border-green-200";
    if (s === "Inactive") return "text-red-600 bg-red-50 border-red-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };
  const roleStyle = (r?: string) => {
    if (r === "Admin") return "text-purple-700 bg-purple-50 border-purple-200";
    if (r === "Manager" || r === "Staff") return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const filtered = data.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fc] min-h-screen">
      {/* Notification */}
      {notif && (
        <div className={`fixed top-16 md:top-6 right-4 md:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          notif.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {notif.ok ? <Check size={15} /> : <X size={15} />} {notif.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data.length} total users</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-100 w-full sm:w-auto">
          <Plus size={17} /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          className="w-full bg-white border border-gray-200 text-gray-900 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all placeholder:text-gray-300 shadow-sm"
          placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <table className="w-full table-fixed min-w-[760px]">
            <colgroup>
              <col className="w-12" />
              <col className="w-48" />
              <col className="w-56" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-52" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3.5 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">#</th>
                <th className="px-5 py-3.5 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">Name</th>
                <th className="px-5 py-3.5 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">Email</th>
                <th className="px-5 py-3.5 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">Role</th>
                <th className="px-5 py-3.5 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">Status</th>
                <th className="px-5 py-3.5 text-gray-400 text-xs font-semibold uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-300 text-sm">No users found</td>
                </tr>
              ) : (
                filtered.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-gray-300 text-sm">{i+1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {item.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-gray-900 font-medium text-sm truncate">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-sm truncate">{item.email || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleStyle(item.role)}`}>{item.role || "User"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle(item.status)}`}>{item.status || "Active"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                        <button onClick={() => openAccess(item)} title="Manage Access"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all whitespace-nowrap">
                          <ShieldCheck size={13} /> Access
                        </button>
                        <button onClick={() => openEdit(item)} title="Edit"
                          className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all shrink-0">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} title="Delete"
                          className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-300 text-sm">No users found</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {item.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-gray-400 text-xs truncate">{item.email || "No email"}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusStyle(item.status)}`}>
                  {item.status || "Active"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleStyle(item.role)}`}>
                  {item.role || "User"}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openAccess(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 active:scale-95 transition-all">
                    <ShieldCheck size={12} /> Access
                  </button>
                  <button onClick={() => openEdit(item)}
                    className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                    <Edit size={15} />
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{modal === "add" ? "Add User" : "Edit User"}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">{f.label}</label>
                  {f.type === "select" && f.options ? (
                    <select
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                      value={formData[f.key] ?? ""} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-gray-300"
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                      value={formData[f.key] ?? ""} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : modal === "add" ? "Save" : "Update"}
              </button>
              <button onClick={closeModal}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCESS CONTROL MODAL */}
      {modal === "access" && editingItem && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <ShieldCheck size={16} className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Access Control</h3>
              </div>
              <button onClick={closeModal} className="text-gray-300 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {editingItem.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">{editingItem.name}</p>
                <p className="text-gray-400 text-xs">{editingItem.email || "No email"}</p>
              </div>
              <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold border shrink-0 ${roleStyle(editingItem.role)}`}>
                {editingItem.role || "User"}
              </span>
            </div>

            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Page Permissions</p>

            {accessLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
            ) : (
              <div className="space-y-2.5">
                {PAGE_OPTIONS.map(({ key, label, desc, icon: Icon, accent, light }) => {
                  const on = accessData[key as keyof AccessConfig];
                  return (
                    <button
                      key={key}
                      onClick={() => setAccessData(p => ({ ...p, [key]: !p[key as keyof AccessConfig] }))}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                        on ? "border-opacity-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                      }`}
                      style={on ? { borderColor: accent+"55", backgroundColor: light } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: on ? accent+"22" : "#f3f4f6" }}>
                          <Icon size={16} style={{ color: on ? accent : "#9ca3af" }} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold" style={{ color: on ? "#111827" : "#9ca3af" }}>{label}</p>
                          <p className="text-xs mt-0.5" style={{ color: on ? accent : "#d1d5db" }}>{desc}</p>
                        </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-all duration-200 shrink-0`}
                        style={{ backgroundColor: on ? accent : "#e5e7eb" }}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${on ? "left-7" : "left-1"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <Eye size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-blue-400 text-xs">
                <strong>Note:</strong> Companies page is <strong className="text-emerald-500">ON by default</strong>. 
                Toggle OFF to restrict access for this user.
              </p>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleSaveAccess} disabled={saving || accessLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-100">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Access"}
              </button>
              <button onClick={closeModal}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}