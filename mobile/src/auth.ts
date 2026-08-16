/** Converts Supabase/network errors into safe, actionable copy for end users. */
export function authErrorMessage(error: unknown): string {
  const value = error as { code?: string; message?: string } | null;
  const code = value?.code ?? "";
  const message = (value?.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials"))
    return "Incorrect email or password.";
  if (code === "email_not_confirmed" || message.includes("email not confirmed"))
    return "Confirm your email address before logging in.";
  if (code === "user_already_exists" || message.includes("already registered"))
    return "An account with this email already exists.";
  if (code === "weak_password" || message.includes("password should"))
    return "Choose a stronger password.";
  if (code.includes("rate_limit") || message.includes("rate limit"))
    return "Too many emails were requested. Please wait and try again later.";
  if (code === "same_password" || message.includes("same password"))
    return "Your new password must be different from your current password.";
  if (code === "session_not_found" || message.includes("session"))
    return "Your secure session has expired. Please start again.";
  return "Something went wrong. Please try again.";
}
