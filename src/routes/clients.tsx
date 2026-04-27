import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { formatTenge, timeAgo } from "@/lib/format";
import { Phone, Search } from "lucide-react";

export const Route = createFileRoute("/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { deals, setSelected } = useStore();
  const [q, setQ] = useState("");

  const clients = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; city: string; deals: number; total: number; lastAt: string; lastDealId: number }>();
    for (const d of deals) {
      const key = d.phone;
      const cur = map.get(key);
      if (cur) {
        cur.deals += 1;
        cur.total += d.amount ?? 0;
        if (new Date(d.updatedAt) > new Date(cur.lastAt)) {
          cur.lastAt = d.updatedAt;
          cur.lastDealId = d.id;
        }
      } else {
        map.set(key, {
          name: d.client,
          phone: d.phone,
          city: d.city,
          deals: 1,
          total: d.amount ?? 0,
          lastAt: d.updatedAt,
          lastDealId: d.id,
        });
      }
    }
    const list = [...map.values()].sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.city.toLowerCase().includes(s));
  }, [deals, q]);

  return (
    <AppShell>
      <div className="h-full overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Клиенты</h2>
            <p className="text-sm text-muted-foreground">Всего: {clients.length}</p>
          </div>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Поиск клиента…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Клиент</th>
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Город</th>
                <th className="px-4 py-3 text-right">Сделок</th>
                <th className="px-4 py-3 text-right">На сумму</th>
                <th className="px-4 py-3 text-left">Последняя активность</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.phone}
                  onClick={() => setSelected(c.lastDealId)}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-accent/30"
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-info">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.deals}</td>
                  <td className="px-4 py-3 text-right">{c.total ? formatTenge(c.total) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(c.lastAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
