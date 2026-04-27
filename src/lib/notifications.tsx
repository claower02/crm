import type { ReactNode } from "react";
import { StoreProvider } from "./store";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
