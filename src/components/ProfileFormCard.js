"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";

const inputClass =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm outline-none transition disabled:bg-slate-100 focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20";

export default function ProfileFormCard() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    companyName: "",
    companyAddress: "",
    role: "",
    aadhaar: "",
    mobileOtp: "",
    emailOtp: "",
    photo: "",
  });
  const [initialData, setInitialData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/user/me");
        const data = await response.json().catch(() => ({}));
        const fallbackFirstName = String(data?.name || "").trim();
        const mapped = {
          firstName: data?.firstName || fallbackFirstName,
          lastName: data?.lastName || "",
          email: data?.email || "",
          phone: data?.phone || "",
          address: data?.address || "",
          companyName: data?.companyName || "",
          companyAddress: data?.companyAddress || "",
          role: data?.role || "",
          aadhaar: data?.aadhaar || "",
          mobileOtp: data?.mobileOtp || "",
          emailOtp: data?.emailOtp || data?.emailotp || "",
          photo: data?.photo || "",
        };
        setFormData(mapped);
        setInitialData(mapped);
      } catch {
        setMessage("We could not load your profile right now.");
      }
    }
    loadUser();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    const nextValue =
      name === "phone" || name === "aadhaar"
        ? value.replace(/\D/g, "")
        : value;
    setFormData((previous) => ({ ...previous, [name]: nextValue }));
  }

  function handlePhotoChange(event) {
    if (!isEditing) {
      return;
    }
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setFormData((previous) => ({ ...previous, photo: result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          aadhaar: formData.aadhaar,
          mobileOtp: formData.mobileOtp,
          emailOtp: formData.emailOtp,
          photo: formData.photo,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "Could not save changes.");
        return;
      }
      setInitialData(formData);
      setIsEditing(false);
      setMessage("Profile updated successfully.");
    } catch {
      setMessage("Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--primary)]">Profile</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Keep your contact details up to date so the team can reach you quickly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isEditing && initialData) {
              setFormData(initialData);
            }
            setIsEditing((previous) => !previous);
            setMessage("");
          }}
          className="rounded-md border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--text)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
        >
          {isEditing ? "Cancel Edit" : "Edit Profile"}
        </button>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSave}>
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--soft)] px-4 py-5">
          <div className="flex flex-col items-center">
            <div className="h-28 w-28 overflow-hidden rounded-full border border-[color:var(--border)] bg-white">
              {formData.photo ? (
                <img
                  src={formData.photo}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
              Profile Photo
            </p>
            {isEditing ? (
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="mt-3 w-full rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-[color:var(--text)] file:mr-3 file:rounded file:border-0 file:bg-[color:var(--soft)] file:px-3 file:py-2"
              />
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="First Name">
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="First Name"
              className={inputClass}
            />
          </Field>

          <Field label="Last Name">
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Last Name"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Work Email">
          <input
            value={formData.email}
            disabled
            className={inputClass}
          />
        </Field>

        <Field label="Role">
          <input
            value={formData.role}
            disabled
            className={inputClass}
          />
        </Field>

        <Field label="Phone Number">
          <input
            name="phone"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Phone Number"
            className={inputClass}
          />
        </Field>

        <Field label="Address">
          <input
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Address"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Company Name">
            <input
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Company Name"
              className={inputClass}
            />
          </Field>

          <Field label="Company Address">
            <input
              name="companyAddress"
              value={formData.companyAddress}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Company Address"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Aadhaar Number">
            <input
              name="aadhaar"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.aadhaar}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Aadhaar Number"
              className={inputClass}
            />
          </Field>

          <Field label="Mobile OTP">
            <input
              name="mobileOtp"
              value={formData.mobileOtp}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Mobile OTP"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Email OTP">
          <input
            name="emailOtp"
            value={formData.emailOtp}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Email OTP"
            className={inputClass}
          />
        </Field>

        {message ? <p className="text-sm text-[color:var(--muted)]">{message}</p> : null}

        {isEditing ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[color:var(--primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        ) : null}
      </form>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-[color:var(--text)]">
      {label}
      {children}
    </label>
  );
}
