import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KanbanBoard } from "@/components/kanban-board";
import { DealDrawer } from "@/components/deal-drawer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <KanbanBoard />
      <DealDrawer />
    </AppShell>
  );
}
