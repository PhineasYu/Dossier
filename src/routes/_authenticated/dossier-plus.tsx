import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dossier-plus")({
  beforeLoad: () => {
    throw redirect({ to: "/settings", replace: true, statusCode: 301 });
  },
});
