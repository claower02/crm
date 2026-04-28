import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Paperclip, Phone, MapPin, Building2, FileText, Image as ImageIcon, Forward, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { SERVICE_LABELS, STATUS_LABELS } from "@/lib/types";
import type { DealStatus, ServiceType } from "@/lib/types";
import { shortDateTime, formatTenge } from "@/lib/format";
import { playSound } from "@/lib/sound";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DealDrawer() {
  const { deals, selectedId, setSelected, updateDeal, addMessage, markRead, moveDeal } = useStore();
  const deal = deals.find((d) => d.id === selectedId) ?? null;
  const [text, setText] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (deal && deal.unread > 0) markRead(deal.id);
  }, [deal, markRead]);

  if (!deal) return null;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    addMessage(deal.id, { author: "Алекс", text: t });
    playSound("message");
    setText("");
  };

  return (
    <Sheet open={!!deal} onOpenChange={(o) => !o && setSelected(null)}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border bg-surface px-5 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 font-display">
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                #{deal.id}
              </span>
              Заявка · {deal.client}
            </SheetTitle>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{shortDateTime(deal.createdAt)}</span>
            <span>·</span>
            <Select value={deal.status} onValueChange={(v) => moveDeal(deal.id, v as DealStatus)}>
              <SelectTrigger className="h-7 w-auto gap-1 border-border/60 px-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as DealStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-5 mt-3 grid w-auto grid-cols-3">
            <TabsTrigger value="info">Информация</TabsTrigger>
            <TabsTrigger value="chat" className="relative">
              Чат {(deal.chat?.length ?? 0) > 0 && <span className="ml-1 text-muted-foreground">({deal.chat.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="files">
              Файлы {(deal.attachments?.length ?? 0) > 0 && <span className="ml-1 text-muted-foreground">({deal.attachments.length})</span>}
            </TabsTrigger>
          </TabsList>

          {/* INFO */}
          <TabsContent value="info" className="flex-1 overflow-y-auto px-5 py-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Входящее сообщение
              </div>
              <p className="mt-2 text-sm text-foreground">{deal.comment}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Телефон" icon={<Phone className="h-3.5 w-3.5" />}>
                <Input value={deal.phone} onChange={(e) => updateDeal(deal.id, { phone: e.target.value })} />
              </Field>
              <Field label="Город" icon={<Building2 className="h-3.5 w-3.5" />}>
                <Input value={deal.city} onChange={(e) => updateDeal(deal.id, { city: e.target.value })} />
              </Field>
              <Field label="Услуга">
                <Select
                  value={deal.service}
                  onValueChange={(v) => updateDeal(deal.id, { service: v as ServiceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SERVICE_LABELS) as ServiceType[]).map((s) => (
                      <SelectItem key={s} value={s}>{SERVICE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ответственный">
                <Input value={deal.responsible} onChange={(e) => updateDeal(deal.id, { responsible: e.target.value })} />
              </Field>
              <Field label="Адрес" icon={<MapPin className="h-3.5 w-3.5" />} className="col-span-2">
                <Input
                  value={deal.address ?? ""}
                  placeholder="Например: ул. Абая, д. 12"
                  onChange={(e) => updateDeal(deal.id, { address: e.target.value })}
                />
              </Field>
              <Field label="Комментарий" className="col-span-2">
                <Textarea
                  rows={3}
                  value={deal.comment}
                  onChange={(e) => updateDeal(deal.id, { comment: e.target.value })}
                />
              </Field>
              <Field label="Сумма сделки" className="col-span-2">
                <Input
                  type="number"
                  value={deal.amount ?? ""}
                  placeholder="0"
                  onChange={(e) => updateDeal(deal.id, { amount: e.target.value ? Number(e.target.value) : undefined })}
                />
                {deal.amount ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatTenge(deal.amount)}
                  </div>
                ) : null}
              </Field>
            </div>

            <div className="mt-5 grid gap-2">
              <Button
                className="w-full gap-2 font-semibold"
                style={{ background: "var(--gradient-primary)" }}
                onClick={() => {
                  moveDeal(deal.id, "manager");
                  toast.success("Передано менеджеру ОП");
                }}
              >
                <Forward className="h-4 w-4" />
                Отправить менеджеру ОП
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => moveDeal(deal.id, "done")}
              >
                <CheckCircle2 className="h-4 w-4" />
                Завершить сделку
              </Button>
            </div>
          </TabsContent>

          {/* CHAT */}
          <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden p-0">
            <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {(deal.chat?.length ?? 0) === 0 && (
                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                  Нет сообщений в чате
                </div>
              )}
              {deal.chat.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    m.fromClient
                      ? "self-start bg-secondary text-foreground"
                      : "ml-auto self-end bg-primary text-primary-foreground",
                  )}
                >
                  <div className="text-[10px] opacity-70">{m.author} · {shortDateTime(m.at)}</div>
                  <div className="mt-0.5">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <Input
                placeholder="Сообщение клиенту…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <Button onClick={send} size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* FILES */}
          <TabsContent value="files" className="flex-1 overflow-y-auto px-5 py-4">
            <input
              ref={fileInput}
              type="file"
              hidden
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                const atts = files.map((f) => ({
                  id: `f${Date.now()}${Math.random()}`,
                  name: f.name,
                  size: f.size,
                  kind: f.type.startsWith("image") ? ("photo" as const) : ("doc" as const),
                }));
                updateDeal(deal.id, { attachments: [...deal.attachments, ...atts] });
                toast.success(`Прикреплено файлов: ${files.length}`);
                if (fileInput.current) fileInput.current.value = "";
              }}
            />
            <Button variant="outline" className="w-full gap-2 border-dashed" onClick={() => fileInput.current?.click()}>
              <Paperclip className="h-4 w-4" />
              Прикрепить файл (фото, чертёж)
            </Button>
            <div className="mt-3 space-y-2">
              {(deal.attachments?.length ?? 0) === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">Нет прикреплённых файлов</p>
              )}
              {deal.attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    {a.kind === "photo" ? <ImageIcon className="h-4 w-4 text-info" /> : <FileText className="h-4 w-4 text-warning" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground">{(a.size / 1024).toFixed(0)} KB</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  icon,
  children,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
