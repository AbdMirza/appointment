import React, { useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import api from "../../api/axios";

const Services = () => {
  const { services, setData } = useAdminData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 30,
    customDuration: "",
    useCustomDuration: false,
    price: "",
    bufferTimeBefore: "",
    bufferTimeAfter: "",
    isActive: true,
  });

  // Duration presets
  const durationPresets = [15, 30, 45, 60, 90, 120];

  // Open modal for creating new service
  const handleAddNew = () => {
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      duration: 30,
      customDuration: "",
      useCustomDuration: false,
      price: "",
      bufferTimeBefore: "",
      bufferTimeAfter: "",
      isActive: true,
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (service) => {
    setEditingService(service);
    const isCustom = !durationPresets.includes(service.duration);
    setFormData({
      name: service.name,
      description: service.description || "",
      duration: isCustom ? 30 : service.duration,
      customDuration: isCustom ? service.duration.toString() : "",
      useCustomDuration: isCustom,
      price: service.price.toString(),
      bufferTimeBefore: service.bufferTimeBefore?.toString() || "",
      bufferTimeAfter: service.bufferTimeAfter?.toString() || "",
      isActive: service.isActive,
    });
    setShowModal(true);
  };

  // Toggle active status via API
  const handleToggleActive = async (id) => {
    try {
      const res = await api.patch(`/services/${id}/toggle`);
      const updatedService = res.data;
      
      // Update global state
      setData(prev => ({
        ...prev,
        services: prev.services.map((s) => (s.id === id ? updatedService : s))
      }));
    } catch (error) {
      console.error("Error toggling service:", error);
      alert("Error updating service status");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const finalDuration = formData.useCustomDuration
      ? parseInt(formData.customDuration) || 30
      : formData.duration;

    const serviceData = {
      name: formData.name,
      description: formData.description,
      duration: finalDuration,
      price: formData.price ? parseFloat(formData.price).toFixed(2) : "0.00",
      bufferTimeBefore: parseInt(formData.bufferTimeBefore) || 0,
      bufferTimeAfter: parseInt(formData.bufferTimeAfter) || 0,
      isActive: formData.isActive,
    };

    try {
      if (editingService) {
        const res = await api.put(`/services/${editingService.id}`, serviceData);
        const savedService = res.data;
        
        setData(prev => ({
          ...prev,
          services: prev.services.map(s => s.id === editingService.id ? savedService : s)
        }));
      } else {
        const res = await api.post('/services', serviceData);
        const savedService = res.data;
        
        setData(prev => ({
          ...prev,
          services: [...prev.services, savedService]
        }));
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving service:", error);
      alert(error.response?.data?.message || "Error saving service");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete via API
  const handleDelete = async (id) => {
    try {
      await api.delete(`/services/${id}`);
      
      setData(prev => ({
        ...prev,
        services: prev.services.filter((s) => s.id !== id)
      }));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting service:", error);
      alert(error.response?.data?.message || "Error deleting service");
      setShowDeleteConfirm(null);
    }
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  // Filter services for display
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filterStatus === "active") return service.isActive;
    if (filterStatus === "inactive") return !service.isActive;
    return true;
  });

  const activeCount = services.filter((s) => s.isActive).length;
  const inactiveCount = services.filter((s) => !s.isActive).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Services</h1>
          <p className="text-slate-500 mt-1">
            Manage services that customers can book
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-semibold shadow-lg shadow-blue-500/25"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Service
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              All ({services.length})
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "active" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus("inactive")}
              className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "inactive" ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${service.isActive ? "border-slate-200 hover:border-blue-300" : "border-slate-200 opacity-75"}`}
          >
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{service.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${service.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${service.isActive ? "bg-green-500" : "bg-slate-400"}`}></span>
                    {service.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <p className="text-slate-500 text-sm line-clamp-2">{service.description || "No description"}</p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{formatDuration(service.duration)}</span>
                  </div>
                  {(service.bufferTimeBefore > 0 || service.bufferTimeAfter > 0) && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="text-xs">+{service.bufferTimeBefore + service.bufferTimeAfter}m buffer</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${service.price > 0 ? "text-slate-800" : "text-green-600"}`}>
                    {service.price > 0 ? `$${service.price}` : "Free"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleToggleActive(service.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${service.isActive ? "bg-green-500" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${service.isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(service)} className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium text-sm">
                  Edit
                </button>
                <button onClick={() => setShowDeleteConfirm(service.id)} className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No services found</h3>
            <button onClick={handleAddNew} className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition font-semibold">
              Add Your First Service
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-800">{editingService ? "Edit Service" : "Create New Service"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Consultation"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this service includes..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Duration *</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {durationPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, duration: preset, useCustomDuration: false, customDuration: "" })}
                      className={`px-4 py-2 rounded-lg font-medium transition ${!formData.useCustomDuration && formData.duration === preset ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      {formatDuration(preset)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.useCustomDuration} onChange={(e) => setFormData({ ...formData, useCustomDuration: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-slate-600">Custom duration</span>
                  </label>
                  {formData.useCustomDuration && (
                    <input type="number" value={formData.customDuration} onChange={(e) => setFormData({ ...formData, customDuration: e.target.value })} className="w-24 px-3 py-2 border border-slate-200 rounded-lg" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50">
                  {saving ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Delete Service?</h3>
            <p className="text-slate-600 mb-8">This action cannot be undone. All future bookings for this service will be affected.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/25">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
