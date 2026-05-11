"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✏️ અહીં તમારી details બદલો
const COMPANY_NAME = "Your Company";
const USER_NAME    = "Admin User";
const USER_INITIALS = "AU"; // profile avatar માટે

// Columns જે badge તરીકે બતાવવા છે
const BADGE_KEYS = ["status", "priority"];

// Columns જે date format માં છે
const DATE_KEYS = ["createdAt", "updatedAt", "date"];

// Columns skip કરવા (table માં ન બતાવો)
const SKIP_KEYS: string[] = [];

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  open:         { bg: "#dcfce7", text: "#16a34a" },
  "in-progress":{ bg: "#fef9c3", text: "#ca8a04" },
  closed:       { bg: "#fee2e2", text: "#dc2626" },
  resolved:     { bg: "#dbeafe", text: "#2563eb" },
  high:         { bg: "#fee2e2", text: "#dc2626" },
  medium:       { bg: "#fef9c3", text: "#ca8a04" },
  low:          { bg: "#dcfce7", text: "#16a34a" },
  urgent:       { bg: "#fce7f3", text: "#be185d" },
  default:      { bg: "#f3f4f6", text: "#6b7280" },
};

function Badge({ value }: { value: string }) {
  const key = (value ?? "").toLowerCase();
  const c = BADGE_COLORS[key] ?? BADGE_COLORS["default"];
  return (
    <span style={{
      backgroundColor: c.bg, color: c.text,
      padding: "3px 10px", borderRadius: "9999px",
      fontSize: "0.72rem", fontWeight: 700,
      letterSpacing: "0.05em", textTransform: "capitalize",
      whiteSpace: "nowrap",
    }}>
      {value}
    </span>
  );
}

function formatDate(val: any): string {
  if (!val) return "—";
  if (val?.toDate) return val.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (val instanceof Date) return val.toLocaleDateString("en-IN");
  return String(val);
}

function formatValue(key: string, val: any): React.ReactNode {
  if (val === undefined || val === null || val === "") return <span style={{ color: "#cbd5e1" }}>—</span>;
  if (BADGE_KEYS.includes(key)) return <Badge value={String(val)} />;
  if (DATE_KEYS.includes(key)) return <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{formatDate(val)}</span>;
  if (typeof val === "boolean") return <Badge value={val ? "Yes" : "No"} />;
  const str = String(val);
  return (
    <span title={str} style={{ fontSize: "0.875rem", color: "#334155" }}>
      {str.length > 50 ? str.slice(0, 50) + "…" : str}
    </span>
  );
}

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

export default function TicketsPage() {
  const [tickets, setTickets]     = useState<any[]>([]);
  const [columns, setColumns]     = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deleting, setDeleting]   = useState<string | null>(null);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      let q;
      try {
        q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
      } catch {
        q = query(collection(db, "tickets"));
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Auto-detect columns from all documents
      const allKeys = new Set<string>();
      data.forEach(doc => Object.keys(doc).forEach(k => {
        if (k !== "id" && !SKIP_KEYS.includes(k)) allKeys.add(k);
      }));
      // Sort: known fields first, then rest alphabetically
      const preferred = ["title", "name", "status", "priority", "assignee", "description", "createdAt"];
      const sorted = [
        ...preferred.filter(k => allKeys.has(k)),
        ...[...allKeys].filter(k => !preferred.includes(k)).sort(),
      ];
      setColumns(sorted);
      setTickets(data);
    } catch (err: any) {
      console.error(err);
      setError("Tickets load કરવામાં error આવ્યો. Firebase config અને Firestore rules ચેક કરો.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("આ ticket delete કરવી છે?")) return;
    try {
      setDeleting(id);
      await deleteDoc(doc(db, "tickets", id));
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch {
      alert("Delete failed. Firestore rules ચેક કરો.");
    } finally {
      setDeleting(null);
    }
  };

  const statuses   = ["all", ...Array.from(new Set(tickets.map(t => t.status).filter(Boolean)))];
  const priorities = ["all", ...Array.from(new Set(tickets.map(t => t.priority).filter(Boolean)))];

  const filtered = tickets.filter(t => {
    const matchSearch = !search || columns.some(k =>
      String(t[k] ?? "").toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus   = statusFilter === "all"   || t.status === statusFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "24px 32px" }}>
        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="🔍  Search anything..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: "1", minWidth: "220px", padding: "9px 14px",
              border: "1.5px solid #e2e8f0", borderRadius: "8px",
              fontSize: "0.875rem", outline: "none", backgroundColor: "#fff",
            }}
          />
          {statuses.length > 1 && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "9px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", backgroundColor: "#fff", cursor: "pointer" }}>
              {statuses.map(s => <option key={s} value={s}>{s === "all" ? "All Status" : s}</option>)}
            </select>
          )}
          {priorities.length > 1 && (
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              style={{ padding: "9px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.875rem", backgroundColor: "#fff", cursor: "pointer" }}>
              {priorities.map(p => <option key={p} value={p}>{p === "all" ? "All Priority" : p}</option>)}
            </select>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <p style={{ color: "#64748b", marginTop: "14px" }}>Tickets load થઈ રહ્યા છે...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "20px 24px", color: "#dc2626" }}>
            <strong>⚠️ Error:</strong> {error}
            <button onClick={fetchTickets} style={{ marginLeft: "16px", backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "3rem" }}>🎫</div>
            <p style={{ marginTop: "12px" }}>
              {tickets.length === 0 ? "Firestore માં કોઈ tickets નથી." : "કોઈ ticket match નથી."}
            </p>
          </div>
        )}

        {/* ── Table ── */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    {columns.map(col => (
                      <th key={col} style={{
                        padding: "12px 16px", textAlign: "left",
                        fontSize: "0.72rem", fontWeight: 700,
                        color: "#64748b", textTransform: "uppercase",
                        letterSpacing: "0.07em", borderBottom: "2px solid #e2e8f0",
                        whiteSpace: "nowrap",
                      }}>
                        {toLabel(col)}
                      </th>
                    ))}
                    <th style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: "0.72rem", fontWeight: 700,
                      color: "#64748b", textTransform: "uppercase",
                      letterSpacing: "0.07em", borderBottom: "2px solid #e2e8f0",
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket, i) => (
                    <tr
                      key={ticket.id}
                      style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#eff6ff")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#fff" : "#fafafa")}
                    >
                      {columns.map(col => (
                        <td key={col} style={{ padding: "12px 16px", maxWidth: "220px", verticalAlign: "middle" }}>
                          {formatValue(col, ticket[col])}
                        </td>
                      ))}
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          disabled={deleting === ticket.id}
                          style={{
                            backgroundColor: deleting === ticket.id ? "#fca5a5" : "#fee2e2",
                            color: "#dc2626", border: "none",
                            padding: "5px 12px", borderRadius: "6px",
                            cursor: deleting === ticket.id ? "not-allowed" : "pointer",
                            fontSize: "0.78rem", fontWeight: 700,
                          }}
                        >
                          {deleting === ticket.id ? "…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}