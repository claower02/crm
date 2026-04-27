import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { Phone, PhoneIncoming, PhoneMissed } from "lucide-react";

export const Route = createFileRoute("/calls")({
  component: CallsPage,
});

function CallsPage() {
  const { deals } = useStore();
  const calls = deals.filter((d) => d.source === "call" || d.source === "whatsapp");
  return (
    <AppShell>
      <div className="h-full overflow-auto p-6">
        <h2 className="mb-4 font-display text-xl font-bold">История звонков</h2>
        <div className="space-y-2">
          {calls.map((d) => (
            <div key={d.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15 text-success">
                {d.source === "call" ? <PhoneIncoming className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <div className="font-medium">{d.client}</div>
                <div className="text-xs text-muted-foreground">{d.phone} · {d.city}</div>
              </div>
              <div className="text-xs text-muted-foreground">{timeAgo(d.createdAt)}</div>
            </div>
          ))}
          {calls.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              <PhoneMissed className="mx-auto mb-2 h-8 w-8" />
              Звонков пока нет
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
