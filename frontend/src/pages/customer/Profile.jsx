import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Profile data
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        createdAt: "",
    });

    // Profile update form
    const [profileForm, setProfileForm] = useState({
        name: "",
        email: "",
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Password change form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Delete account
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    // Messages
    const [message, setMessage] = useState({ type: "", text: "" });
    const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
    const [loading, setLoading] = useState(false);

    // Fetch profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await API.get("/customers/profile");
            const userData = response.data;
            setProfile(userData);
            setProfileForm({
                name: userData?.name || "",
                email: userData?.email || "",
            });
        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to load profile",
            });
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await API.put("/customers/profile", profileForm);
            const userData = response.data;
            setProfile(userData);
            setIsEditingProfile(false);
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to update profile",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPasswordMessage({ type: "", text: "" });
        setMessage({ type: "", text: "" });

        // Validation
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: "error", text: "New passwords do not match" });
            setLoading(false);
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({
                type: "error",
                text: "Password must be at least 6 characters",
            });
            setLoading(false);
            return;
        }

        try {
            await API.patch("/customers/password", {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setPasswordMessage({ type: "success", text: "Password changed successfully!" });
            setIsChangingPassword(false);
        } catch (error) {
            setPasswordMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to change password",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") {
            setMessage({ type: "error", text: "Please type DELETE to confirm" });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            await API.delete("/customers/account");
            logout();
            navigate("/login");
        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to delete account",
            });
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            {/* Premium Navbar */}
            <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Link to="/customer/home" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                            Appointify
                        </span>
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/customer/home"
                        className="text-slate-600 px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-300"
                    >
                        Home
                    </Link>
                    <button
                        onClick={logout}
                        className="bg-white text-slate-600 px-5 py-2 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 hover:text-red-500 hover:border-red-100 transition-all duration-300 shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
                        My Profile
                    </h1>
                    <p className="text-slate-500">
                        Manage your account settings and preferences
                    </p>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div
                        className={`mb-6 p-4 rounded-2xl border ${message.type === "success"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Profile Information Card */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">
                                Profile Information
                            </h2>
                            <p className="text-slate-500 text-sm">
                                View and update your personal details
                            </p>
                        </div>
                        {!isEditingProfile && (
                            <button
                                onClick={() => setIsEditingProfile(true)}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-sm"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {!isEditingProfile ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">
                                    Name
                                </label>
                                <div className="text-lg text-slate-900">{profile?.name}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">
                                    Email
                                </label>
                                <div className="text-lg text-slate-900">{profile?.email}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">
                                    Member Since
                                </label>
                                <div className="text-lg text-slate-900">
                                    {profile?.createdAt ? formatDate(profile.createdAt) : ""}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) =>
                                        setProfileForm({ ...profileForm, name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) =>
                                        setProfileForm({ ...profileForm, email: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-sm disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditingProfile(false);
                                        setProfileForm({
                                            name: profile.name,
                                            email: profile.email,
                                        });
                                    }}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Password Change Card */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">
                                Change Password
                            </h2>
                            <p className="text-slate-500 text-sm">
                                Update your password to keep your account secure
                            </p>
                        </div>
                        {!isChangingPassword && (
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="px-5 py-2.5 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all duration-300 shadow-sm"
                            >
                                Change Password
                            </button>
                        )}
                    </div>

                    {passwordMessage.text && (
                        <div
                            className={`mb-4 p-4 rounded-xl border text-sm ${passwordMessage.type === "success"
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-red-50 border-red-200 text-red-700"
                                }`}
                        >
                            {passwordMessage.text}
                        </div>
                    )}

                    {isChangingPassword && (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) =>
                                        setPasswordForm({
                                            ...passwordForm,
                                            currentPassword: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) =>
                                        setPasswordForm({
                                            ...passwordForm,
                                            newPassword: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordForm({
                                            ...passwordForm,
                                            confirmPassword: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all duration-300 shadow-sm disabled:opacity-50"
                                >
                                    {loading ? "Updating..." : "Update Password"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordForm({
                                            currentPassword: "",
                                            newPassword: "",
                                            confirmPassword: "",
                                        });
                                    }}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Delete Account Card */}
                <div className="bg-red-50 rounded-3xl border border-red-200 shadow-sm p-8">
                    <div>
                        <h2 className="text-2xl font-bold text-red-900 mb-1">
                            Delete Account
                        </h2>
                        <p className="text-red-600 text-sm mb-6">
                            Permanently delete your account and all associated data. This
                            action cannot be undone.
                        </p>
                    </div>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 shadow-sm"
                        >
                            Delete Account
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-red-900 mb-2">
                                    Type <span className="font-mono">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-4 py-3 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="DELETE"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 shadow-sm disabled:opacity-50"
                                >
                                    {loading ? "Deleting..." : "Confirm Delete"}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText("");
                                    }}
                                    className="px-6 py-3 bg-white text-slate-700 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Profile;
