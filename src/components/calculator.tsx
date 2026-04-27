import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2, FileDown, RotateCcw, Save } from "lucide-react";
import { formatTenge } from "@/lib/format";
import { toast } from "sonner";
import { playSound } from "@/lib/sound";

type ProductType = "moskitka" | "plisse" | "remont";

const TYPE_LABEL: Record<ProductType, string> = {
  moskitka: "Москитные сетки",
  plisse: "Плиссе",
  remont: "Ремонт",
};

interface Slot {
  id: string;
  qty: number;
  height: number;
  width: number;
  net: string;
  profile: string;
  fittings: string;
  extra: number;
}

const NET_OPTIONS = [
  { id: "none", label: "Нет", price: 0 },
  { id: "standard", label: "Стандарт", price: 4500 },
  { id: "antikoshka", label: "Антикошка", price: 8200 },
  { id: "antipil", label: "Антипыль", price: 6800 },
];

const PROFILE_OPTIONS = [
  { id: "none", label: "Нет", price: 0 },
  { id: "alu", label: "Алюминий", price: 3200 },
  { id: "alu-plus", label: "Алюминий усиленный", price: 4800 },
];

const FITTINGS_OPTIONS = [
  { id: "none", label: "Нет", price: 0 },
  { id: "ruchki", label: "Ручки (пара)", price: 800 },
  { id: "petli", label: "Петли", price: 1200 },
];

function newSlot(): Slot {
  return {
    id: `s${Date.now()}${Math.random()}`,
    qty: 1,
    height: 130,
    width: 60,
    net: "standard",
    profile: "alu",
    fittings: "none",
    extra: 0,
  };
}

export function Calculator() {
  const [type, setType] = useState<ProductType>("moskitka");
  const [city, setCity] = useState("Алматы");
  const [client, setClient] = useState("");
  const [margin, setMargin] = useState(150);
  const [slots, setSlots] = useState<Slot[]>([newSlot(), newSlot()]);

  const calc = useMemo(() => {
    const slotResults = slots.map((s) => {
      const area = (s.height * s.width) / 10000; // m²
      const net = NET_OPTIONS.find((o) => o.id === s.net)?.price ?? 0;
      const prof = PROFILE_OPTIONS.find((o) => o.id === s.profile)?.price ?? 0;
      const fit = FITTINGS_OPTIONS.find((o) => o.id === s.fittings)?.price ?? 0;
      const base = (net + prof) * area + fit + s.extra;
      const perPiece = base * (1 + margin / 100);
      const total = perPiece * s.qty;
      return { area, base, perPiece, total };
    });

    const subtotal = slotResults.reduce((a, r) => a + r.total, 0);
    const tax = subtotal * 0.12;
    const transaction = subtotal * 0.025;
    const designerFee = subtotal * 0.05;
    const curatorFee = subtotal * 0.05;
    const grossProfit = subtotal - tax - transaction;
    const netProfit = grossProfit - designerFee - curatorFee;
    const cost = slotResults.reduce((a, r, i) => a + r.base * slots[i].qty, 0);
    const profitability = subtotal > 0 ? (netProfit / subtotal) * 100 : 0;

    return { slotResults, subtotal, tax, transaction, designerFee, curatorFee, grossProfit, netProfit, cost, profitability };
  }, [slots, margin]);

  const updateSlot = (i: number, patch: Partial<Slot>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const reset = () => {
    setSlots([newSlot(), newSlot()]);
    setMargin(150);
    toast("Калькулятор сброшен");
  };

  const save = () => {
    playSound("success");
    toast.success("Расчёт сохранён", { description: `${client || "Без имени"} · ${formatTenge(calc.subtotal)}` });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/40 px-6 py-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Клиент:</Label>
          <Input className="h-9 w-48" placeholder="Поиск заказчика…" value={client} onChange={(e) => setClient(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Город:</Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Алматы", "Астана", "Шымкент", "Караганда"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Сбросить
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <FileDown className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button size="sm" onClick={save} className="gap-1" style={{ background: "var(--gradient-primary)" }}>
            <Save className="h-3.5 w-3.5" /> Сохранить
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={type} onValueChange={(v) => setType(v as ProductType)}>
          <div className="mb-4 flex items-center justify-between">
            <TabsList>
              {(Object.keys(TYPE_LABEL) as ProductType[]).map((t) => (
                <TabsTrigger key={t} value={t}>{TYPE_LABEL[t]}</TabsTrigger>
              ))}
            </TabsList>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
              <Label className="text-xs text-muted-foreground">Наценка:</Label>
              <Slider
                value={[margin]}
                min={0}
                max={400}
                step={5}
                onValueChange={([v]) => setMargin(v)}
                className="w-40"
              />
              <span className="w-14 text-right text-sm font-semibold">{margin}%</span>
            </div>
          </div>

          <TabsContent value={type} className="mt-0 space-y-3">
            <div className="grid gap-3 lg:grid-cols-2">
              {slots.map((s, i) => (
                <SlotCard
                  key={s.id}
                  index={i}
                  slot={s}
                  result={calc.slotResults[i]}
                  onChange={(patch) => updateSlot(i, patch)}
                  onRemove={() => setSlots((prev) => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setSlots((prev) => [...prev, newSlot()])}
            >
              <Plus className="h-4 w-4" /> Добавить слот
            </Button>
          </TabsContent>
        </Tabs>

        {/* Totals */}
        <div className="mt-6 grid gap-2 lg:grid-cols-4">
          <Total label="Себестоимость" value={formatTenge(calc.cost)} />
          <Total label="К продаже (цена)" value={formatTenge(calc.subtotal)} accent="primary" big />
          <Total label="Налог (12%)" value={formatTenge(calc.tax)} muted />
          <Total label="Транзакция (2.5%)" value={formatTenge(calc.transaction)} muted />
          <Total label="Дизайнер (5%)" value={formatTenge(calc.designerFee)} muted />
          <Total label="Куратор (5%)" value={formatTenge(calc.curatorFee)} muted />
          <Total label="Валовая прибыль" value={formatTenge(calc.grossProfit)} accent="info" />
          <Total label="Чистая прибыль" value={formatTenge(calc.netProfit)} accent="success" big />
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm">
          <span className="text-muted-foreground">Рентабельность:</span>
          <span className={`text-lg font-bold ${calc.profitability >= 30 ? "text-success" : calc.profitability >= 15 ? "text-warning" : "text-destructive"}`}>
            {calc.profitability.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function SlotCard({
  index,
  slot,
  result,
  onChange,
  onRemove,
}: {
  index: number;
  slot: Slot;
  result: { area: number; perPiece: number; total: number };
  onChange: (patch: Partial<Slot>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between bg-primary px-4 py-2 text-primary-foreground">
        <div className="text-sm font-semibold">Слот {index + 1}</div>
        <button onClick={onRemove} className="rounded p-1 hover:bg-white/10">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          <FieldNum label="Кол-во шт" value={slot.qty} onChange={(v) => onChange({ qty: v })} />
          <FieldNum label="Выс. (см)" value={slot.height} onChange={(v) => onChange({ height: v })} />
          <FieldNum label="Шир. (см)" value={slot.width} onChange={(v) => onChange({ width: v })} />
        </div>

        <FieldSelect label="Сетка" value={slot.net} options={NET_OPTIONS} onChange={(v) => onChange({ net: v })} />
        <FieldSelect label="Профиль" value={slot.profile} options={PROFILE_OPTIONS} onChange={(v) => onChange({ profile: v })} />
        <FieldSelect label="Фурнитура" value={slot.fittings} options={FITTINGS_OPTIONS} onChange={(v) => onChange({ fittings: v })} />

        <div className="grid grid-cols-2 gap-2">
          <FieldNum label="Доп. сумма" value={slot.extra} onChange={(v) => onChange({ extra: v })} />
          <div className="rounded-md bg-secondary/50 px-3 py-2 text-right">
            <div className="text-[10px] uppercase text-muted-foreground">Площадь</div>
            <div className="text-sm font-semibold">{result.area.toFixed(2)} м²</div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Слот итого:</span>
          <span className="font-bold text-success">{formatTenge(result.total)}</span>
        </div>
      </div>
    </div>
  );
}

function FieldNum({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 h-9"
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string; price: number }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label} {o.price > 0 ? `(${formatTenge(o.price)})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Total({
  label,
  value,
  accent,
  big,
  muted,
}: {
  label: string;
  value: string;
  accent?: "primary" | "success" | "info";
  big?: boolean;
  muted?: boolean;
}) {
  const accentClass = {
    primary: "border-primary/40 bg-primary/10",
    success: "border-success/40 bg-success/10",
    info: "border-info/40 bg-info/10",
  } as const;
  return (
    <div className={`rounded-xl border p-3 ${accent ? accentClass[accent] : "border-border bg-card"} ${muted ? "opacity-80" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-bold ${big ? "font-display text-xl" : "text-base"}`}>{value}</div>
    </div>
  );
}
