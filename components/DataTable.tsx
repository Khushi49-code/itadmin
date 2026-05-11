"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { Plus, Edit, Trash2, X, Check, Loader2, Search } from "lucide-react";

interface DataItem {
  id: string; name: string; email?: string; role?: string; status?: string;
  createdAt?: Timestamp; [key: string]: unknown;
}
interface Field { key: string; label: string; type?: "text"|"email"|"select"; options?: string[]; }
interface Props { collectionName: string; title: string; fields: Field[]; accentColor: string; accentLight: string; }

export default function DataTable({ collectionName, title, fields, accentColor, accentLight }: Props) {
  const [data, setData]               = useState<DataItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [modal, setModal]             = useState<"add"|"edit"|null>(null);
  const [editingItem, setEditingItem] = useState<DataItem|null>(null);
  const [formData, setFormData]       = useState<Record<string,string>>({});
  const [notif, setNotif]             = useState<{msg:string;ok:boolean}|null>(null);
  const [search, setSearch]           = useState("");

  const showNotif = (msg: string, ok = true) => { setNotif({msg,ok}); setTimeout(()=>setNotif(null),3000); };

  const defaultForm = () => {
    const d: Record<string,string> = {};
    fields.forEach(f => { d[f.key] = f.options?.[0] ?? ""; });
    return d;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, collectionName), orderBy("createdAt","desc"));
      const snap = await getDocs(q);
      setData(snap.docs.map(d => ({id:d.id,...d.data()})) as DataItem[]);
    } catch {
      const snap = await getDocs(collection(db, collectionName));
      setData(snap.docs.map(d => ({id:d.id,...d.data()})) as DataItem[]);
    } finally { setLoading(false); }
  }, [collectionName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setFormData(defaultForm()); setModal("add"); };
  const openEdit = (item: DataItem) => {
    setEditingItem(item);
    const d: Record<string,string> = {};
    fields.forEach(f => { d[f.key] = (item[f.key] as string) ?? f.options?.[0] ?? ""; });
    setFormData(d); setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditingItem(null); };

  const handleSave = async () => {
    if (!formData.name?.trim()) { showNotif("Name is required", false); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await addDoc(collection(db, collectionName), {...formData, createdAt: Timestamp.now()});
        showNotif(`${title.slice(0,-1)} added!`);
      } else if (modal === "edit" && editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), formData);
        showNotif(`${title.slice(0,-1)} updated!`);
      }
      closeModal(); fetchData();
    } catch { showNotif("Operation failed", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      showNotif("Deleted"); setData(p => p.filter(i => i.id !== id));
    } catch { showNotif("Delete failed", false); }
  };

  const statusStyle = (s?: string) => {
    if (s === "Active" || s === "Resolved") return "text-green-700 bg-green-50 border-green-200";
    if (s === "Inactive" || s === "Closed") return "text-red-600 bg-red-50 border-red-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };
  const roleStyle = (r?: string) => {
    if (r === "Admin")                    return "text-purple-700 bg-purple-50 border-purple-200";
    if (r === "Manager" || r === "Staff") return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const hasEmail  = fields.some(f => f.key === "email");
  const hasRole   = fields.some(f => f.key === "role");

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
          {notif.ok ? <Check size={15}/> : <X size={15}/>} {notif.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data.length} total records</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-[0.98] transition-all shadow-md w-full sm:w-auto"
          style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px ${accentColor}33` }}>
          <Plus size={17}/> Add {title.slice(0,-1)}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"/>
        <input
          className="w-full bg-white border border-gray-200 text-gray-900 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all placeholder:text-gray-300 shadow-sm"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-6 h-6 animate-spin" style={{color:accentColor}}/>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3.5 text-left text-gray-400 text-xs font-semibold uppercase tracking-wider">#</th>
                {fields.map(f => (
                  <th key={f.key} className="px-5 py-3.5 text-left text-gray-400 text-xs font-semibold uppercase tracking-wider">{f.label}</th>
                ))}
                <th className="px-5 py-3.5 text-center text-gray-400 text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={fields.length+2} className="text-center py-16 text-gray-300 text-sm">No records found</td></tr>
              ) : filtered.map((item,i) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 text-gray-300 text-sm">{i+1}</td>
                  {fields.map(f => (
                    <td key={f.key} className="px-5 py-4 text-sm">
                      {f.key === "name" ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{background:`linear-gradient(135deg, ${accentColor}, ${accentColor}99)`}}>
                            {(item.name?.charAt(0)||"?").toUpperCase()}
                          </div>
                          <span className="text-gray-900 font-medium">{item.name}</span>
                        </div>
                      ) : f.key === "status" ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle(item[f.key] as string)}`}>{(item[f.key] as string)||"—"}</span>
                      ) : f.key === "role" ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleStyle(item[f.key] as string)}`}>{(item[f.key] as string)||"—"}</span>
                      ) : (
                        <span className="text-gray-400">{(item[f.key] as string)||"—"}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(item)}
                        className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                        <Edit size={15}/>
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{color:accentColor}}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-300 text-sm">No records found</div>
        ) : filtered.map(item => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{background:`linear-gradient(135deg, ${accentColor}, ${accentColor}88)`}}>
                {(item.name?.charAt(0)||"?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-sm truncate">{item.name}</p>
                {hasEmail && <p className="text-gray-400 text-xs truncate">{item.email||"No email"}</p>}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusStyle(item.status)}`}>
                {item.status||"Active"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              {hasRole ? (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleStyle(item.role)}`}>
                  {item.role||"User"}
                </span>
              ) : <span />}
              <div className="flex gap-1">
                <button onClick={() => openEdit(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 active:scale-95 transition-all">
                  <Edit size={12}/> Edit
                </button>
                <button onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 bg-red-50 border border-red-100 active:scale-95 transition-all">
                  <Trash2 size={12}/> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {modal === "add" ? `Add ${title.slice(0,-1)}` : `Edit ${title.slice(0,-1)}`}
              </h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="space-y-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">{f.label}</label>
                  {f.type === "select" && f.options ? (
                    <select
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                      value={formData[f.key]??""} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}>
                      {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type??"text"}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-gray-300"
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                      value={formData[f.key]??""} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-sm"
                style={{backgroundColor:accentColor}}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : modal==="add"?"Save":"Update"}
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
