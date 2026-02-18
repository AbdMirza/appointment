import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const Services = () => {
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`${API_URL}/services?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setServices(data);
      } else {
        console.error("Failed to fetch services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchServices();
    }
  }, [token, searchQuery]); // Removed filterStatus to prevent unnecessary refetching

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
      const res = await fetch(`${API_URL}/services/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updatedService = await res.json();
        setServices(
          services.map((s) => (s.id === id ? updatedService : s))
        );
      } else {
        alert("Failed to update service status");
      }
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
      let res;
      if (editingService) {
        // Update existing
        res = await fetch(`${API_URL}/services/${editingService.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(serviceData),
        });
      } else {
        // Create new
        res = await fetch(`${API_URL}/services`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(serviceData),
        });
      }

      if (res.ok) {
        const savedService = await res.json();
        if (editingService) {
          // Update existing service in list
          setServices(services.map(s => s.id === editingService.id ? savedService : s));
        } else {
          // Add new service to list directly
          setServices([...services, savedService]);
        }
        setShowModal(false);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save service");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error saving service");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete via API
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setServices(services.filter((s) => s.id !== id));
        setShowDeleteConfirm(null);
      } else {
        if (data.hasFutureBookings) {
          alert(data.message);
        } else {
          alert(data.message || "Failed to delete service");
        }
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Error deleting service");
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

  // Count active/inactive for filter buttons
  const activeCount = services.filter((s) => s.isActive).length;
  const inactiveCount = services.filter((s) => !s.isActive).length;

  // Filter services for display
  const filteredServices = services.filter((service) => {
    if (filterStatus === "active") return service.isActive;
    if (filterStatus === "inactive") return !service.isActive;
    return true;
  });

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add New Service
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                All ({services.length})
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "active"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setFilterStatus("inactive")}
                className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "inactive"
                  ? "bg-slate-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          /* Services Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${service.isActive
                  ? "border-slate-200 hover:border-blue-300"
                  : "border-slate-200 opacity-75"
                  }`}
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {service.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${service.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${service.isActive ? "bg-green-500" : "bg-slate-400"
                            }`}
                        ></span>
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2">
                    {service.description || "No description"}
                  </p>
                </div>

                {/* Card Stats */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Duration */}
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                      {/* Buffer time if exists */}
                      {(service.bufferTimeBefore > 0 ||
                        service.bufferTimeAfter > 0) && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                              />
                            </svg>
                            <span className="text-xs">
                              +{service.bufferTimeBefore + service.bufferTimeAfter}m
                              buffer
                            </span>
                          </div>
                        )}
                    </div>
                    {/* Price */}
                    <div className="text-right">
                      <span
                        className={`text-xl font-bold ${service.price > 0 ? "text-slate-800" : "text-green-600"
                          }`}
                      >
                        {service.price > 0 ? `$${service.price}` : "Free"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(service.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${service.isActive ? "bg-green-500" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${service.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium text-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(service.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium text-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {services.length === 0 && !loading && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-slate-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  No services found
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery
                    ? "Try adjusting your search or filter"
                    : "Get started by adding your first service"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Your First Service
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingService ? "Edit Service" : "Create New Service"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Premium Consultation"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this service includes..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Duration <span className="text-red-500">*</span>
                  </label>

                  {/* Preset Duration Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {durationPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            duration: preset,
                            useCustomDuration: false,
                            customDuration: "",
                          })
                        }
                        className={`px-4 py-2 rounded-lg font-medium transition ${!formData.useCustomDuration &&
                          formData.duration === preset
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {formatDuration(preset)}
                      </button>
                    ))}
                  </div>

                  {/* Custom Duration Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.useCustomDuration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            useCustomDuration: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">
                        Custom duration
                      </span>
                    </label>
                    {formData.useCustomDuration && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.customDuration}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customDuration: e.target.value,
                            })
                          }
                          placeholder="e.g., 45"
                          min="1"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                        <span className="text-sm text-slate-500">minutes</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Leave empty or 0 for free services
                  </p>
                </div>

                {/* Buffer Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Buffer Before
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.bufferTimeBefore}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bufferTimeBefore: e.target.value,
                          })
                        }
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        min
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Buffer After
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.bufferTimeAfter}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bufferTimeAfter: e.target.value,
                          })
                        }
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        min
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 -mt-3">
                  Optional: Add preparation or cleanup time around appointments
                </p>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-700">
                      Service Status
                    </p>
                    <p className="text-sm text-slate-500">
                      {formData.isActive
                        ? "Customers can book this service"
                        : "Hidden from customer booking"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, isActive: !formData.isActive })
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${formData.isActive ? "bg-green-500" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${formData.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : editingService ? "Save Changes" : "Create Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
                Delete Service?
              </h3>
              <p className="text-center text-slate-500 mb-6">
                This action cannot be undone. The service will be permanently
                removed from your catalog.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold"
                >
                  Delete Service
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
