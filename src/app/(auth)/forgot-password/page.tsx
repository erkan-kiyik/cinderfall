import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Coseade AI password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
