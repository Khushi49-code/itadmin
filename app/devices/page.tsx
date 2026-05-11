import DataTable from "@/components/DataTable";
const fields = [
  { key:"name",   label:"Device Name", type:"text"   as const },
  { key:"status", label:"Status",      type:"select" as const, options:["Active","Inactive","Maintenance"] },
];
export default function DevicesPage() {
  return <DataTable collectionName="devices" title="Devices" fields={fields} accentColor="#0ea5e9" accentLight="#e0f2fe"/>;
}
