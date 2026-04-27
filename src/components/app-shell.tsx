import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Calculator, Bell, Users, Settings, BarChart3, Phone, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Сделки", icon: LayoutGrid },
  { to: "/calculator", label: "Калькулятор", icon: Calculator },
  { to: "/clients", label: "Клиенты", icon: Users },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/calls", label: "Звонки", icon: Phone },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { deals, simulateNewLead } = useStore();
  const [soundOn, setSoundOnState] = useState(true);

  useEffect(() => {
    setSoundOnState(isSoundEnabled());
  }, []);

  const totalUnread = deals.reduce((acc, d) => acc + d.unread, 0);
  const newCount = deals.filter((d) => d.status === "new").length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 py-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-base font-bold leading-none">OkonCRM</div>
            <div className="mt-1 text-[11px] text-muted-foreground">для отдела продаж</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                <span className="flex-1">{item.label}</span>
                {item.to === "/" && newCount > 0 && (
                  <span className="rounded-full bg-info px-2 py-0.5 text-[11px] font-semibold text-info-foreground">
                    {newCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <Settings className="h-4 w-4" />
            Настройки
          </Link>
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">АК</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">Алекс Кенжебаев</div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
                Онлайн · менеджер ОП
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface/60 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-semibold">
              {NAV.find((n) => n.to === pathname)?.label ?? "OkonCRM"}
            </h1>
            <span className="rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
              База актуальна
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateNewLead()}
              className="gap-2"
            >
              <Bell className="h-3.5 w-3.5" />
              Тест уведомления
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                const next = !soundOn;
                setSoundOnState(next);
                setSoundEnabled(next);
              }}
              title={soundOn ? "Выключить звук" : "Включить звук"}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent">
              <Bell className="h-4 w-4" />
              {totalUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {totalUnread}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
