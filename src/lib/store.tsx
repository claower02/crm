import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { INITIAL_DEALS, RANDOM_COMMENTS, RANDOM_NAMES } from "./mock-data";
import type { ChatMessage, Deal, DealStatus, ServiceType } from "./types";
import { playSound } from "./sound";
import { toast } from "sonner";

interface StoreState {
  deals: Deal[];
  selectedId: number | null;
  search: string;
  responsibleFilter: string;
  cityFilter: string;
}

interface StoreActions {
  setSelected: (id: number | null) => void;
  setSearch: (s: string) => void;
  setResponsibleFilter: (s: string) => void;
  setCityFilter: (s: string) => void;
  moveDeal: (id: number, status: DealStatus) => void;
  updateDeal: (id: number, patch: Partial<Deal>) => void;
  addMessage: (id: number, msg: Omit<ChatMessage, "id" | "at">) => void;
  markRead: (id: number) => void;
  createDeal: (deal: Omit<Deal, "id" | "createdAt" | "updatedAt" | "chat" | "attachments" | "unread">) => void;
  simulateNewLead: () => void;
}

type Store = StoreState & StoreActions;

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const moveDeal = useCallback((id: number, status: DealStatus) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d,
      ),
    );
    if (status === "done") {
      playSound("success");
      toast.success("Сделка завершена", { description: `Заявка #${id} переведена в «Завершено»` });
    }
  }, []);

  const updateDeal = useCallback((id: number, patch: Partial<Deal>) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
      ),
    );
  }, []);

  const addMessage = useCallback((id: number, msg: Omit<ChatMessage, "id" | "at">) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              chat: [
                ...d.chat,
                { ...msg, id: `m${Date.now()}`, at: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
              unread: msg.fromClient ? d.unread + 1 : d.unread,
            }
          : d,
      ),
    );
  }, []);

  const markRead = useCallback((id: number) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, unread: 0 } : d)));
  }, []);

  const createDeal = useCallback<StoreActions["createDeal"]>((deal) => {
    setDeals((prev) => {
      const id = (prev[0]?.id ?? 100) + 1;
      const next: Deal = {
        ...deal,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chat: [],
        attachments: [],
        unread: 1,
      };
      return [next, ...prev];
    });
    playSound("new-lead");
  }, []);

  const simulateNewLead = useCallback(() => {
    const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const comment = RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
    const services: ServiceType[] = ["moskitka", "okno", "plisse", "remont"];
    const cities = ["Алматы", "Астана", "Шымкент", "Караганда"];
    const responsibles = ["Алекс", "Андрей", "Динар"];
    const phone = `+7 7${Math.floor(Math.random() * 10)}${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;

    const newDeal = {
      status: "new" as DealStatus,
      client: name,
      phone,
      city: cities[Math.floor(Math.random() * cities.length)],
      service: services[Math.floor(Math.random() * services.length)],
      comment,
      responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
      source: "site" as const,
    };

    setDeals((prev) => {
      const id = (prev[0]?.id ?? 100) + 1;
      const d: Deal = {
        ...newDeal,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chat: [{ id: `m${Date.now()}`, author: name, text: comment, at: new Date().toISOString(), fromClient: true }],
        attachments: [],
        unread: 1,
      };
      toast("🔔 Новая заявка", {
        description: `${name} · ${d.city} · ${comment.slice(0, 60)}…`,
        action: {
          label: "Открыть",
          onClick: () => setSelectedId(id),
        },
      });
      return [d, ...prev];
    });
    playSound("new-lead");
  }, []);

  // Auto-simulate incoming leads every 35–60s for demo wow factor
  useEffect(() => {
    const tick = () => {
      simulateNewLead();
      schedule();
    };
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const ms = 35_000 + Math.random() * 25_000;
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
    }),
    [deals, selectedId, search, responsibleFilter, cityFilter, moveDeal, updateDeal, addMessage, markRead, createDeal, simulateNewLead],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
