import { notFound } from "next/navigation";
import { soloMode } from "@/lib/config";
import { SignupForm } from "@/app/(auth)/signup/SignupForm";

export default function SignupPage() {
  // Closed while this is one person's site. The form still exists, ready
  // for the day PRIMARY_HANDLE is cleared.
  if (soloMode) notFound();
  return <SignupForm />;
}
