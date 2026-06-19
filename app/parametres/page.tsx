import { redirect } from "next/navigation";

// /parametres has no content of its own — it opens on General settings.
export default function SettingsIndexPage() {
  redirect("/parametres/general");
}
