"use client";
import Sidebar from "@/components/Sidebar";
import RouteGuard from "@/components/RouteGuard";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
      </div>
    </RouteGuard>
  );
}
