import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { STATUS_LABELS } from "@/lib/types";
import type { DealStatus } from "@/lib/types";
import { formatTenge } from "@/lib/format";
import { TrendingUp, Wallet, Users, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { deals } = useStore();
  const total = deals.length;
  const done = deals.filter((d) => d.status === "done").length;
  const revenue = deals.filter((d) => d.status === "done").reduce((a, d) => a + (d.amount ?? 0), 0);
  const pipeline = deals.filter((d) => d.status !== "done").reduce((a, d) => a + (d.amount ?? 0), 0);

  const byStatus = (Object.keys(STATUS_LABELS) as DealStatus[]).map((s) => ({
    status: s,
    count: deals.filter((d) => d.status === s).length,
  }));

  const max = Math.max(1, ...byStatus.map((b) => b.count));

  return (
    <AppShell>
      <div className="h-full overflow-auto p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={<Users className="h-4 w-4" />} label="Всего сделок" value={String(total)} />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Завершено" value={String(done)} accent="success" />
          <Stat icon={<Wallet className="h-4 w-4" />} label="Выручка" value={formatTenge(revenue)} accent="primary" />
          <Stat icon={<TrendingUp className="h-4 w-4" />} label="В воронке" value={formatTenge(pipeline)} accent="info" />
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold">Воронка по статусам</h3>
          <div className="mt-4 space-y-3">
            {byStatus.map((b) => (
              <div key={b.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{STATUS_LABELS[b.status]}</span>
                  <span className="font-semibold">{b.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(b.count / max) * 100}%`, background: "var(--gradient-primary)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "primary" | "success" | "info";
}) {
  const accentBg = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent ? accentBg[accent] : "bg-secondary text-foreground"}`}>
          {icon}
        </span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
