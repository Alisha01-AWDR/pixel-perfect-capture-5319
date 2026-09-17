import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/darukaa-shell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Darukaa.Earth" }, { name: "description", content: "Sign in to the Darukaa.Earth field console." }, { property: "og:title", content: "Sign in — Darukaa.Earth" }, { property: "og:description", content: "Sign in to the Darukaa.Earth field console." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <AuthPage mode="login" />,
});