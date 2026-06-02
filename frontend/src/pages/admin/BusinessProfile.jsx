import React, { useState, useEffect } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import BusinessHoursEditor from "../../components/admin/BusinessHoursEditor";
import api from "../../api/axios";

const BusinessProfile = () => {
    const { business, setData } = useAdminData();
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        name: "",
        address: "",
        contact: "",
        timezone: "UTC"
    });

    // Populate form from global state
    useEffect(() => {
        if (business) {
            setForm({
                name: business.name || "",
                address: business.address || "",
                contact: business.contact || "",
                timezone: business.timezone || "UTC"
            });
        }
    }, [business]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            const res = await api.put("/business/profile", form);
            const updatedBusiness = res.data;
            
            // Update global state
            setData(prev => ({
                ...prev,
                business: { ...prev.business, ...updatedBusiness }
            }));
            
            setSuccess(true);
        } catch (err) {
            console.error("Error updating profile:", err);
            alert(err.response?.data?.message || "Server error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-2xl">
                <h1 className="text-3xl font-bold mb-2">Business Profile</h1>
                <p className="text-slate-500 mb-8">
                    Update your business information below
                </p>

                {success && (
                    <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        Profile updated successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md border border-slate-200 mb-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Business Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                rows={3}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Information</label>
                            <input
                                type="text"
                                name="contact"
                                value={form.contact}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Timezone</label>
                            <select
                                name="timezone"
                                value={form.timezone}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                required
                            >
                                {Intl.supportedValuesOf('timeZone').map((tz) => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>

                <BusinessHoursEditor
                    initialHours={business?.businessHours}
                    onSaved={(updatedHours) => {
                        setData((prev) => ({
                            ...prev,
                            business: { ...prev.business, businessHours: updatedHours },
                        }));
                    }}
                />
            </div>
        </div>
    );
};

export default BusinessProfile;
