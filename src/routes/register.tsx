import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/darukaa-shell";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Darukaa.Earth" }, { name: "description", content: "Create a Darukaa.Earth field console account." }, { property: "og:title", content: "Create account — Darukaa.Earth" }, { property: "og:description", content: "Create a Darukaa.Earth field console account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <AuthPage mode="register" />,
});