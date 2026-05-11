import DataTable from "@/components/DataTable";
const fields = [
  { key:"name",   label:"Name",   type:"text"   as const },
  { key:"email",  label:"Email",  type:"email"  as const },
  { key:"role",   label:"Role",   type:"select" as const, options:["Staff","Manager","Supervisor","Admin"] },
  { key:"status", label:"Status", type:"select" as const, options:["Active","Inactive","On Leave"] },
];
export default function StaffPage() {
  return <DataTable collectionName="staff" title="Staff" fields={fields} accentColor="#8b5cf6" accentLight="#ede9fe"/>;
}
