"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, UserCog, Ticket, HardDrive,
  LogOut, Shield, Menu, X
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, accent: "#6366f1", bg: "#ede9fe" },
  { href: "/users",     label: "Users",     icon: Users,           accent: "#10b981", bg: "#d1fae5" },
  { href: "/staff",     label: "Staff",     icon: UserCog,         accent: "#8b5cf6", bg: "#ede9fe" },
  { href: "/tickets",   label: "Tickets",   icon: Ticket,          accent: "#f59e0b", bg: "#fef3c7" },
  { href: "/devices",   label: "Devices",   icon: HardDrive,       accent: "#0ea5e9", bg: "#e0f2fe" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = async () => { await logout(); router.replace("/login"); };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <Shield className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <h1 className="text-gray-900 font-bold text-sm tracking-wide leading-none">Tickit Admin</h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase mt-0.5">Admin Panel</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-gray-400 hover:text-gray-700 transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, accent, bg }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
              style={active ? { backgroundColor: bg } : {}}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                style={{ backgroundColor: active ? accent : "#f3f4f6" }}>
                <Icon size={15} style={{ color: active ? "#fff" : "#9ca3af" }} />
              </span>
              <span className="text-sm">{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="mb-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-gray-400 text-[10px] uppercase tracking-widest">Signed in as</p>
          <p className="text-gray-600 text-xs truncate font-medium mt-0.5">{user?.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-sm font-medium">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
            <Shield size={15} className="text-white" />
          </div>
          <span className="text-gray-900 font-bold text-sm tracking-wide">ANA MATE</span>
        </div>
        <button onClick={() => setOpen(true)}
          className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-100 flex-col h-screen sticky top-0 shrink-0 shadow-sm">
        <NavContent />
      </aside>
    </>
  );
}
