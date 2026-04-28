import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { RANDOM_COMMENTS, RANDOM_NAMES } from "./mock-data";
import type { ChatMessage, Deal, DealStatus, ServiceType } from "./types";
import { playSound } from "./sound";
import { toast } from "sonner";

interface StoreState {
  deals: Deal[];
  selectedId: number | null;
  search: string;
  responsibleFilter: string;
  cityFilter: string;
  loading: boolean;
}

interface StoreActions {
  setSelected: (id: number | null) => void;
  setSearch: (s: string) => void;
  setResponsibleFilter: (s: string) => void;
  setCityFilter: (s: string) => void;
  moveDeal: (id: number, status: DealStatus) => Promise<void>;
  updateDeal: (id: number, patch: Partial<Deal>) => Promise<void>;
  addMessage: (id: number, msg: Omit<ChatMessage, "id" | "at">) => Promise<void>;
  markRead: (id: number) => Promise<void>;
  createDeal: (deal: Omit<Deal, "id" | "createdAt" | "updatedAt" | "chat" | "attachments" | "unread">) => Promise<void>;
  simulateNewLead: () => Promise<void>;
  refresh: () => Promise<void>;
}

type Store = StoreState & StoreActions;

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/deals");
      if (res.ok) {
        const data = await res.json();
        setDeals(data);
      }
    } catch (err) {
      console.error("Failed to fetch deals", err);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const moveDeal = useCallback(async (id: number, status: DealStatus) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d,
      ),
    );

    try {
      const res = await fetch(`/api/deals/${id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        if (status === "done") {
          playSound("success");
          toast.success("Сделка завершена", { description: `Заявка #${id} переведена в «Завершено»` });
        }
      } else {
        throw new Error("Failed to move deal");
      }
    } catch (err) {
      refresh(); // Rollback
      toast.error("Ошибка сохранения данных");
    }
  }, [refresh]);

  const updateDeal = useCallback(async (id: number, patch: Partial<Deal>) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
      ),
    );

    try {
      const deal = deals.find(d => d.id === id);
      if (!deal) return;
      const res = await fetch(`/api/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...deal, ...patch }),
      });
      if (!res.ok) throw new Error("Failed to update deal");
    } catch (err) {
      refresh();
      toast.error("Ошибка обновления");
    }
  }, [deals, refresh]);

  const addMessage = useCallback(async (id: number, msg: Omit<ChatMessage, "id" | "at">) => {
    const deal = deals.find(d => d.id === id);
    if (!deal) return;

    const newChat = [
      ...deal.chat,
      { ...msg, id: `m${Date.now()}`, at: new Date().toISOString() },
    ];

    updateDeal(id, {
      chat: newChat,
      unread: msg.fromClient ? deal.unread + 1 : deal.unread
    });
  }, [deals, updateDeal]);

  const markRead = useCallback(async (id: number) => {
    updateDeal(id, { unread: 0 });
  }, [updateDeal]);

  const createDeal = useCallback<StoreActions["createDeal"]>(async (dealData) => {
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealData),
      });
      if (res.ok) {
        const newDeal = await res.json();
        setDeals(prev => [newDeal, ...prev]);
        playSound("new-lead");
        return newDeal.id;
      }
    } catch (err) {
      toast.error("Ошибка создания сделки");
    }
  }, []);

  const simulateNewLead = useCallback(async () => {
    const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const comment = RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
    const services: ServiceType[] = ["moskitka", "okno", "plisse", "remont"];
    const cities = ["Алматы", "Астана", "Шымкент", "Караганда"];
    const responsibles = ["Алекс", "Андрей", "Динар"];
    const phone = `+7 7${Math.floor(Math.random() * 10)}${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;

    const dealData = {
      status: "new" as DealStatus,
      client: name,
      phone,
      city: cities[Math.floor(Math.random() * cities.length)],
      service: services[Math.floor(Math.random() * services.length)],
      comment,
      responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
      source: "site" as const,
    };

    const id = await createDeal(dealData);
    if (id) {
      toast("🔔 Новая заявка", {
        description: `${name} · ${dealData.city} · ${comment.slice(0, 60)}…`,
        action: {
          label: "Открыть",
          onClick: () => setSelectedId(id),
        },
      });
    }
  }, [createDeal]);

  // Auto-simulate incoming leads every 120s for demo (reduced frequency)
  useEffect(() => {
    const tick = () => {
      simulateNewLead();
      schedule();
    };
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const ms = 60_000 + Math.random() * 60_000;
      timer = setTimeout(tick, ms);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [simulateNewLead]);

  const value = useMemo<Store>(
    () => ({
      deals,
      selectedId,
      search,
      responsibleFilter,
      cityFilter,
      loading,
      setSelected: setSelectedId,
      setSearch,
      setResponsibleFilter,
      setCityFilter,
      moveDeal,
      updateDeal,
      addMessage,
      markRead,
      createDeal,
      simulateNewLead,
      refresh,
    }),
    [deals, selectedId, search, responsibleFilter, cityFilter, loading, moveDeal, updateDeal, addMessage, markRead, createDeal, simulateNewLead, refresh],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
