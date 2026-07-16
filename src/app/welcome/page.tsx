import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Post-sign-in landing hop. The login form runs in the browser and can't know
 * the account's role at the moment it redirects, so it sends everyone here and
 * the server picks the right home — otherwise an admin or vendor signs in and
 * lands on the tourist storefront.
 */
export default async function WelcomePage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "ADMIN") redirect("/admin");
  if (role === "VENDOR") redirect("/vendor/dashboard");
  redirect("/");
}
