"use client";
import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import Card from "@/components/Card";
const inputClass =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm text-[color:var(--text)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20";
const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  aadhaar: "",
  companyName: "",
  companyAddress: "",
  role: "user",
  photo: "",
};
export default function SetupProfilePage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const isSubmitDisabled = useMemo(() => {
    return (
      submittingProfile ||
      !otp.trim() ||
      !isOtpVerified ||
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.aadhaar.trim()
    );
  }, [form, isOtpVerified, otp, submittingProfile]);
  useEffect(() => {
    if (!cooldown) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setCooldown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailFromQuery = params.get("email");
    const roleFromQuery = params.get("role");
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
    if (
      roleFromQuery === "admin" ||
      roleFromQuery === "employee" ||
      roleFromQuery === "user"
    ) {
      updateField("role", roleFromQuery);
    }
  }, []);
  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }
  function handleInputChange(event) {
    const { name, value } = event.target;
    const nextValue =
      name === "phone" || name === "aadhaar"
        ? value.replace(/\D/g, "")
        : value;
    updateField(name, nextValue);
  }
  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateField(
        "photo",
        typeof reader.result === "string" ? reader.result : "",
      );
    };
    reader.readAsDataURL(file);
  }
  async function requestOtp() {
    if (requestingOtp || !email || cooldown > 0) {
      return;
    }
    setRequestingOtp(true);
    setError("");
    setStatusMessage("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Could not generate OTP.");
        return;
      }
      setStep(2);
      setCooldown(30);
      setIsOtpVerified(false);
      setStatusMessage("OTP has been sent to your email.");
    } catch {
      setError("Could not generate OTP.");
    } finally {
      setRequestingOtp(false);
    }
  }
  async function verifyOtp() {
    if (verifyingOtp || !email || !otp.trim()) {
      return;
    }
    setVerifyingOtp(true);
    setError("");
    setStatusMessage("");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setIsOtpVerified(false);
        setError(data.error || "OTP verification failed.");
        return;
      }
      setIsOtpVerified(true);
      setStatusMessage("OTP verified successfully. You can submit your profile.");
    } catch {
      setIsOtpVerified(false);
      setError("OTP verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  }
  async function submitProfile() {
    setSubmittingProfile(true);
    setError("");
    setStatusMessage("");
    try {
      const response = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, ...form }),
      });
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Profile submission failed.");
      }
    } catch {
      setError("Profile submission failed.");
    } finally {
      setSubmittingProfile(false);
    }
  }
  return (
    <PageShell>
      <Card className="max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[color:var(--primary)]">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Verify your email and finish account setup.
          </p>
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {statusMessage ? (
          <p className="mt-4 text-sm text-green-700">{statusMessage}</p>
        ) : null}
        {step === 1 ? (
          <div className="mt-8">
            <label className="block text-sm font-medium text-[color:var(--text)]">
              Email
            </label>
            <input
              value={email}
              disabled
              className={`${inputClass} bg-slate-100`}
            />
            <button
              onClick={requestOtp}
              disabled={requestingOtp || !email}
              className="mt-6 w-full rounded-md bg-[color:var(--primary)] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {requestingOtp ? "Generating OTP..." : "Generate OTP"}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="OTP" className="md:col-span-2">
              <div className="space-y-2">
                <input
                  placeholder="Enter OTP"
                  className={inputClass}
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value);
                    setIsOtpVerified(false);
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={verifyingOtp || !otp.trim()}
                      className="font-semibold text-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifyingOtp ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={requestingOtp || cooldown > 0}
                      className="font-semibold text-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requestingOtp
                        ? "Resending OTP..."
                        : cooldown > 0
                          ? `Resend OTP in ${cooldown}s`
                          : "Resend OTP"}
                    </button>
                  </div>
                  {cooldown > 0 ? (
                    <span className="text-[color:var(--muted)]">
                      Please wait before requesting again.
                    </span>
                  ) : null}
                </div>
                {isOtpVerified ? (
                  <p className="text-sm text-green-700">OTP verified.</p>
                ) : null}
              </div>
            </Field>
            <Field label="First Name">
              <input
                name="firstName"
                className={inputClass}
                value={form.firstName}
                onChange={handleInputChange}
              />
            </Field>
            <Field label="Last Name">
              <input
                name="lastName"
                className={inputClass}
                value={form.lastName}
                onChange={handleInputChange}
              />
            </Field>
            <Field label="Phone">
              <input
                name="phone"
                inputMode="numeric"
                pattern="[0-9]*"
                className={inputClass}
                value={form.phone}
                onChange={handleInputChange}
              />
            </Field>
            <Field label="Aadhaar Number">
              <input
                name="aadhaar"
                inputMode="numeric"
                pattern="[0-9]*"
                className={inputClass}
                value={form.aadhaar}
                onChange={handleInputChange}
              />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <input
                name="address"
                className={inputClass}
                value={form.address}
                onChange={handleInputChange}
              />
            </Field>
            <Field label="Company Name">
              <input
                name="companyName"
                className={inputClass}
                value={form.companyName}
                onChange={handleInputChange}
              />
            </Field>
            <Field label="Company Address">
              <input
                name="companyAddress"
                className={inputClass}
                value={form.companyAddress}
                onChange={handleInputChange}
              />
            </Field>
            <Field label="Role" className="md:col-span-2">
              <select
                name="role"
                className={inputClass}
                value={form.role}
                onChange={handleInputChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
            </Field>
            <Field label="Photo" className="md:col-span-2">
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full text-sm text-[color:var(--muted)]"
                onChange={handlePhotoChange}
              />
            </Field>
            <div className="md:col-span-2">
              <button
                onClick={submitProfile}
                disabled={isSubmitDisabled}
                className="w-full rounded-md bg-[color:var(--primary)] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingProfile ? "Submitting..." : "Submit Profile"}
              </button>
            </div>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
function Field({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[color:var(--text)]">
        {label}
      </label>
      {children}
    </div>
  );
}
