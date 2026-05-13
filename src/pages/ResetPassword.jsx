import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import api from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyRound, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z
    .string()
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
      "New password must be at least 8 characters, contain a letter, a number, and a special character"
    ),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [step, setStep] = useState(1); // 1: OTP, 2: Passwords
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromState,
      otp: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const otpValue = watch("otp");

  const handleNextStep = async () => {
    const isOtpValidField = await trigger("otp");
    if (!isOtpValidField) return;

    setLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        email: watch("email"),
        otp: watch("otp")
      });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);

    const payload = {
      email: data.email,
      otp: data.otp,
      newPassword: data.newPassword
    };

    try {
      await api.post("/auth/reset-password", payload);
      toast.success("Password successfully reset! Please sign in with your new password.");
      setStep(3); // Success state
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="glass-panel auth-card animate-scale-in"
        style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', borderRadius: '2rem' }}
      >
        {step === 1 && (
          <div
            key="step1"
            className="animate-fade-in"
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <ShieldCheck size={32} style={{ color: '#818cf8' }} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'white' }}>
                Verify <span className="text-gradient">Identity</span>
              </h2>
              <p style={{ color: '#94a3b8', marginTop: '0.75rem' }}>
                Enter the 6-digit code sent to <br /><span style={{ color: 'white', fontWeight: 600 }}>{emailFromState || "your email"}</span>
              </p>
            </div>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label">Verification Code</label>
              <input
                {...register("otp")}
                type="text"
                maxLength={6}
                placeholder="000000"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 800 }}
                className="glass-input"
              />
              {errors.otp && <p className="error-text" style={{ textAlign: 'center' }}>{errors.otp.message}</p>}
            </div>

            <button
              onClick={handleNextStep}
              disabled={loading}
              className="glass-btn-primary"
              style={{ width: '100%', padding: '1rem', fontWeight: 700 }}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div
            key="step2"
            className="animate-fade-in"
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <KeyRound size={32} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'white' }}>
                New <span className="text-gradient">Password</span>
              </h2>
              <p style={{ color: '#94a3b8', marginTop: '0.75rem' }}>Please choose a strong, unique password.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="input-group">
                <label className="input-label" htmlFor="newPassword">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input
                    id="newPassword"
                    {...register("newPassword")}
                    type="password"
                    className="glass-input"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
                {errors.newPassword && <p className="error-text">{errors.newPassword.message}</p>}
              </div>

              <div className="input-group" style={{ marginTop: '1.25rem' }}>
                <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input
                    id="confirmPassword"
                    {...register("confirmPassword")}
                    type="password"
                    className="glass-input"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
                {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="glass-btn"
                  style={{ flex: 1, padding: '1rem' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="glass-btn-primary"
                  style={{ flex: 2, padding: '1rem' }}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div
            key="step3"
            className="animate-scale-in"
            style={{ textAlign: 'center', padding: '1rem 0' }}
          >
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <CheckCircle2 size={48} style={{ color: '#10b981' }} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>Success!</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Your password has been changed successfully. <br />
              Redirecting you to login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
