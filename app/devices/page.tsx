"use client";

import { useEffect, useState } from "react";
import { 
  collection, onSnapshot, query, orderBy, 
  addDoc, updateDoc, deleteDoc, doc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Plus, Edit, Trash2, Search, X, 
  ChevronLeft, ChevronRight, Save 
} from "lucide-react";

const fields = [
  { key: "name", label: "Device Name", type: "text" },
  { key: "type", label: "Device Type", type: "select", options: ["Laptop", "Desktop", "Mobile", "Tablet", "Printer", "Server", "Network Device", "Monitor", "Keyboard", "Mouse", "Other"] },
  { key: "company", label: "Company/Brand", type: "text" },
  { key: "model", label: "Model Number", type: "text" },
  { key: "serialNumber", label: "Serial Number", type: "text" },
  { key: "status", label: "Status", type: "select", options: ["Active", "Inactive", "Maintenance", "Repair", "Retired", "Lost", "Stolen"] },
  { key: "assignedTo", label: "Assigned To", type: "text" },
  { key: "department", label: "Department", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "purchaseDate", label: "Purchase Date", type: "date" },
  { key: "warrantyExpiry", label: "Warranty Expiry", type: "date" },
  { key: "price", label: "Price (USD)", type: "number" },
  { key: "supplier", label: "Supplier/Vendor", type: "text" },
  { key: "os", label: "Operating System", type: "text" },
  { key: "ram", label: "RAM (GB)", type: "number" },
  { key: "storage", label: "Storage", type: "text" },
  { key: "processor", label: "Processor", type: "text" },
  { key: "lastMaintenance", label: "Last Maintenance", type: "date" },
  { key: "nextMaintenance", label: "Next Maintenance", type: "date" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  // Fetch devices from Firebase
  useEffect(() => {
    const devicesRef = collection(db, "devices");
    const q = query(devicesRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const devicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDevices(devicesData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching devices:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter devices
  const filteredDevices = devices.filter(device =>
    Object.values(device).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDevices = filteredDevices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);

  // CRUD Operations
  const handleAddDevice = async () => {
    try {
      await addDoc(collection(db, "devices"), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      handleCloseModal();
    } catch (err) {
      console.error("Error adding device:", err);
      alert("Error adding device");
    }
  };

  const handleUpdateDevice = async () => {
    try {
      const deviceRef = doc(db, "devices", editingDevice.id);
      await updateDoc(deviceRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      handleCloseModal();
    } catch (err) {
      console.error("Error updating device:", err);
      alert("Error updating device");
    }
  };

  const handleDeleteDevice = async (id) => {
    if (confirm("Are you sure you want to delete this device?")) {
      try {
        await deleteDoc(doc(db, "devices", id));
      } catch (err) {
        console.error("Error deleting device:", err);
        alert("Error deleting device");
      }
    }
  };

  const handleOpenModal = (device = null) => {
    if (device) {
      setEditingDevice(device);
      setFormData(device);
    } else {
      setEditingDevice(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
    setFormData({});
  };

  const handleSubmit = () => {
    if (editingDevice) {
      handleUpdateDevice();
    } else {
      handleAddDevice();
    }
  };

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500 text-lg">Loading devices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <h3 className="text-red-800 font-semibold">Error Loading Devices</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Device Management</h1>
          <p className="text-gray-500 mt-1">Total Devices: {devices.length}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Device
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search devices by name, serial number, company, assigned to..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RAM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentDevices.map((device, index) => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {indexOfFirstItem + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {device.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.type || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.company || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.model || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.serialNumber || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    device.status === "Active" ? "bg-green-100 text-green-800" :
                    device.status === "Inactive" ? "bg-gray-100 text-gray-800" :
                    device.status === "Maintenance" ? "bg-yellow-100 text-yellow-800" :
                    device.status === "Repair" ? "bg-red-100 text-red-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {device.status || "-"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.assignedTo || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.department || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.location || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.purchaseDate ? new Date(device.purchaseDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.warrantyExpiry ? new Date(device.warrantyExpiry).toLocaleDateString() : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.price ? `$${device.price}` : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.supplier || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.os || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.ram ? `${device.ram} GB` : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.storage || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {device.processor || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(device)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDevices.length)} of {filteredDevices.length} devices
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingDevice ? "Edit Device" : "Add New Device"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Save size={18} />
                {editingDevice ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}