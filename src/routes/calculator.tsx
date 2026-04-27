import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Calculator } from "@/components/calculator";

export const Route = createFileRoute("/calculator")({
  component: CalculatorPage,
});

function CalculatorPage() {
  return (
    <AppShell>
      <Calculator />
    </AppShell>
  );
}
