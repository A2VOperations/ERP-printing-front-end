import { redirect } from "next/navigation";

export default function DashboardSettingsRedirect() {
  redirect("/dashboard/admin/settings/company");
}
