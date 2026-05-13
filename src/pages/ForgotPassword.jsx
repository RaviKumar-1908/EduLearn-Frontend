import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// import { motion } from "framer-motion";
import { toast } from "react-toastify";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      await api.post("/auth/forgot-password", data);
      toast.success("Verification code sent to " + data.email);
      setTimeout(() => navigate('/reset-password', { state: { email: data.email } }), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div
        className="glass-panel auth-card animate-scale-in"
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'white' }}>
            Reset your <span className="text-gradient">password</span>
          </h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            Remembered it? <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email address</label>
            <input
              id="email"
              {...register("email")}
              type="email"
              placeholder="Enter your account email"
              className="glass-input"
            />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="glass-btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
