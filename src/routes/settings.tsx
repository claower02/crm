import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSoundVolume, isSoundEnabled, playSound, setSoundEnabled, setSoundVolume } from "@/lib/sound";
import { Bell, Volume2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [vol, setVol] = useState(0.6);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    setVol(getSoundVolume());
  }, []);

  return (
    <AppShell>
      <div className="mx-auto h-full max-w-2xl space-y-4 overflow-auto p-6">
        <h2 className="font-display text-xl font-bold">Настройки уведомлений</h2>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Звуковые уведомления</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Воспроизводить звук при поступлении новых заявок и сообщений
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => {
                setEnabled(v);
                setSoundEnabled(v);
              }}
            />
          </div>

          <div className="mt-6">
            <Label className="flex items-center gap-2 text-sm">
              <Volume2 className="h-4 w-4" /> Громкость
            </Label>
            <div className="mt-3 flex items-center gap-3">
              <Slider
                value={[vol * 100]}
                max={100}
                step={5}
                onValueChange={([v]) => {
                  const nv = v / 100;
                  setVol(nv);
                  setSoundVolume(nv);
                }}
                className="flex-1"
              />
              <span className="w-10 text-right text-sm text-muted-foreground">{Math.round(vol * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-base font-semibold">Тестирование звуков</h3>
          <p className="mt-1 text-xs text-muted-foreground">Прослушайте звуки уведомлений перед началом работы.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => playSound("new-lead")} className="gap-2">
              <Bell className="h-4 w-4 text-info" /> Новая заявка
            </Button>
            <Button variant="outline" onClick={() => playSound("message")} className="gap-2">
              <Bell className="h-4 w-4 text-warning" /> Сообщение
            </Button>
            <Button variant="outline" onClick={() => playSound("success")} className="gap-2">
              <Bell className="h-4 w-4 text-success" /> Успех
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
