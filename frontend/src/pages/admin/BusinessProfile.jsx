import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

const BusinessProfile = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        name: "",
        address: "",
        contact: "",
        timezone: "UTC"
    });

    // Fetch current business profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/business/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setForm({
                        name: data.name || "",
                        address: data.address || "",
                        contact: data.contact || "",
                        timezone: data.timezone || "UTC"
                    });
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            const res = await fetch("http://localhost:5000/api/business/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json();
                alert(data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Server error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-slate-100 min-h-screen">
                <Sidebar />
                <div className="flex-1 p-8 flex items-center justify-center">
                    <p className="text-slate-500">Loading business profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-100 min-h-screen">
            <Sidebar />

            <div className="flex-1 p-8">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold mb-2">Business Profile</h1>
                    <p className="text-slate-500 mb-8">
                        Update your business information below
                    </p>

                    {success && (
                        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Profile updated successfully!
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                        <div className="space-y-6">
                            {/* Business Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Your Business Name"
                                    required
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                                    placeholder="123 Main Street, City, Country"
                                    required
                                />
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Contact Information
                                </label>
                                <input
                                    type="text"
                                    name="contact"
                                    value={form.contact}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Phone number or email"
                                    required
                                />
                            </div>

                            {/* Timezone */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Timezone
                                </label>
                                <select
                                    name="timezone"
                                    value={form.timezone}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                    required
                                >
                                    {Intl.supportedValuesOf('timeZone').map((tz) => (
                                        <option key={tz} value={tz}>
                                            {tz}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BusinessProfile;
