import { redirect } from "next/navigation";

// UI-REC: /settings is an empty placeholder — redirecting to home.
// Remove the redirect() and restore the original return if you build the page.
export default function SettingsPage() {
  redirect("/");
}
