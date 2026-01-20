import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fakeResponse = {
      token: "fake-jwt-token",
      user: {
        name: form.name,
        email: form.email,
        role: "customer",
      },
    };

    login(fakeResponse);
    navigate("/customer/home"); // Correct route
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl w-[400px]"
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Create Customer Account
        </h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full mb-4 p-3 border rounded"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-6 p-3 border rounded"
          onChange={handleChange}
          required
        />

        <button className="w-full bg-blue-600 text-white p-3 rounded">
          Register
        </button>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
