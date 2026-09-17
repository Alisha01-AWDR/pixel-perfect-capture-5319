import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/routes/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Darukaa.Earth — Field Console" }, { name: "description", content: "Monitor carbon, biodiversity, and ecological sites from one field console." }, { property: "og:title", content: "Darukaa.Earth — Field Console" }, { property: "og:description", content: "Monitor carbon, biodiversity, and ecological sites from one field console." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: DashboardPage,
});