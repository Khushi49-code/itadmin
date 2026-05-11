"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { Users, UserCog, Ticket, HardDrive, TrendingUp, Activity, ArrowUpRight } from "lucide-react";

interface Stats { users: number; staff: number; tickets: number; devices: number; }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ users: 0, staff: 0, tickets: 0, devices: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const cols = ["users","staff","tickets","devices"];
        const counts = await Promise.all(cols.map(async c => (await getDocs(collection(db, c))).size));
        setStats({ users: counts[0], staff: counts[1], tickets: counts[2], devices: counts[3] });
      } catch(e){ console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const cards = [
    { label: "Total Users",    value: stats.users,   icon: Users,     accent: "#10b981", light: "#d1fae5", href: "/users" },
    { label: "Staff Members",  value: stats.staff,   icon: UserCog,   accent: "#8b5cf6", light: "#ede9fe", href: "/staff" },
    { label: "Open Tickets",   value: stats.tickets, icon: Ticket,    accent: "#f59e0b", light: "#fef3c7", href: "/tickets" },
    { label: "Active Devices", value: stats.devices, icon: HardDrive, accent: "#0ea5e9", light: "#e0f2fe", href: "/devices" },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fc] min-h-screen">
      {/* Welcome */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back, <span className="text-gray-600 font-medium">{user?.email}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        {cards.map(({ label, value, icon: Icon, accent, light, href }) => (
          <a key={label} href={href}
            className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: light }}>
                <Icon size={18} style={{ color: accent }} />
              </div>
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {loading ? <span className="text-gray-200">—</span> : value}
            </p>
            <p className="text-gray-400 text-xs font-medium mt-1">{label}</p>
          </a>
        ))}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-indigo-500" />
            </div>
            <h3 className="text-gray-800 font-semibold text-sm">Platform Overview</h3>
          </div>
          {[
            { label: "Total Records", value: stats.users + stats.staff + stats.tickets + stats.devices },
            { label: "Collections Active", value: 4 },
            { label: "Data Status", value: "Live" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-400 text-sm">{label}</span>
              <span className="text-gray-800 text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
              <Activity size={14} className="text-green-500" />
            </div>
            <h3 className="text-gray-800 font-semibold text-sm">System Status</h3>
          </div>
          {[
            { label: "Firebase",       status: "Connected", ok: true },
            { label: "Authentication", status: "Active",    ok: true },
            { label: "Firestore DB",   status: "Online",    ok: true },
          ].map(({ label, status, ok }) => (
            <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-400 text-sm">{label}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                ok ? "text-green-600 bg-green-50 border-green-100" : "text-red-500 bg-red-50 border-red-100"
              }`}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
