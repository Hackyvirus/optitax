export const PROFILE_EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "aadhaar",
  "companyName",
  "companyAddress",
  "photo",
  "mobileOtp",
  "emailOtp",
];

export const USER_EDITABLE_FIELDS = ["email", ...PROFILE_EDITABLE_FIELDS];

export function applyUserUpdates(user, body, fields) {
  for (const field of fields) {
    const value = body[field];

    if (value === undefined || typeof value !== "string") {
      continue;
    }

    if (field === "photo") {
      user.photo = value;
      continue;
    }

    if (field === "email") {
      user.email = value.trim().toLowerCase();
      continue;
    }

    if (field === "emailOtp") {
      user.emailotp = value.trim();
      continue;
    }

    user[field] = value.trim();
  }

  if (typeof body.firstName === "string") {
    user.name = body.firstName.trim();
  }
}
