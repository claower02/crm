import { Phone, MessageSquare, Paperclip, Globe, Instagram, MessageCircle, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABELS } from "@/lib/types";
import type { Deal, DealStatus } from "@/lib/types";
import { SERVICE_LABELS } from "@/lib/types";
import { timeAgo, formatTenge } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

const COLUMNS: DealStatus[] = ["new", "overdue", "manager", "measurer", "finance", "done"];

const STATUS_BAR_COLOR: Record<DealStatus, string> = {
  new: "bg-status-new",
  overdue: "bg-status-overdue",
  manager: "bg-status-manager",
  measurer: "bg-status-measurer",
  finance: "bg-status-finance",
  done: "bg-status-done",
};

function SourceIcon({ source }: { source: Deal["source"] }) {
  const map = {
    site: Globe,
    call: Phone,
    whatsapp: MessageCircle,
    instagram: Instagram,
  } as const;
  const Icon = map[source];
  return <Icon className="h-3 w-3" />;
}

function DealCard({ deal, onClick, onDragStart }: { deal: Deal; onClick: () => void; onDragStart: (e: React.DragEvent) => void }) {
  const overdueMs = Date.now() - new Date(deal.createdAt).getTime();
  const overdue = deal.status !== "done" && overdueMs > 1000 * 60 * 60 * 6;

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group w-full rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <SourceIcon source={deal.source} />
          <span>#{deal.id}</span>
          <span>·</span>
          <Clock className="h-2.5 w-2.5" />
          {timeAgo(deal.createdAt)}
        </div>
        {overdue && deal.status !== "done" && (
          <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive">ПРОСРОЧЕНО</span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{deal.client}</div>
          <a
            href={`tel:${deal.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-info hover:underline"
          >
            <Phone className="h-3 w-3" />
            {deal.phone}
          </a>
        </div>
        {deal.unread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {deal.unread}
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{deal.comment}</p>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
        <span className="rounded-md bg-secondary px-1.5 py-0.5 font-medium text-foreground">
          {SERVICE_LABELS[deal.service]}
        </span>
        <div className="flex items-center gap-2">
          {deal.attachments.length > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip className="h-3 w-3" /> {deal.attachments.length}
            </span>
          )}
          {deal.chat.length > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" /> {deal.chat.length}
            </span>
          )}
          {deal.amount && <span className="font-semibold text-foreground">{formatTenge(deal.amount)}</span>}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-muted-foreground">
        Ответственный: <span className="font-medium text-foreground">{deal.responsible}</span>
      </div>
    </button>
  );
}

export function KanbanBoard() {
  const { deals, setSelected, moveDeal, search, setSearch } = useStore();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<DealStatus | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter(
      (d) =>
        d.client.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        String(d.id).includes(q) ||
        d.comment.toLowerCase().includes(q),
    );
  }, [deals, search]);

  const grouped = useMemo(() => {
    const out: Record<DealStatus, Deal[]> = {
      new: [], overdue: [], manager: [], measurer: [], finance: [], done: [],
    };
    for (const d of filtered) out[d.status].push(d);
    return out;
  }, [filtered]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-surface/40 px-6 py-3">
        <Input
          placeholder="Поиск по имени, телефону или ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>Всего сделок:</span>
          <span className="font-semibold text-foreground">{filtered.length}</span>
        </div>
      </div>

      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {COLUMNS.map((status) => (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
            onDrop={() => {
              if (dragId !== null) moveDeal(dragId, status);
              setDragId(null);
              setDragOver(null);
            }}
            className={cn(
              "flex w-[280px] shrink-0 flex-col rounded-xl border bg-surface/40 transition-colors",
              dragOver === status ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <div className="flex items-center gap-2 px-3 pb-2 pt-3">
              <span className={cn("h-2 w-2 rounded-full", STATUS_BAR_COLOR[status])} />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {STATUS_LABELS[status]}
              </h3>
              <span className="ml-auto rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {grouped[status].length}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {grouped[status].map((d) => (
                <DealCard
                  key={d.id}
                  deal={d}
                  onClick={() => setSelected(d.id)}
                  onDragStart={(e) => {
                    setDragId(d.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                />
              ))}
              {grouped[status].length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  Нет сделок
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
