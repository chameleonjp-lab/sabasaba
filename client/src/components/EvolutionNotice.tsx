import { useEffect, useRef, useState } from "react";
import type { EvolutionId } from "@/game/types";
import { EVOLUTION_RECIPES } from "@/game/rules";

/** A short, non-interactive announcement; no game timers or damage live here. */
export default function EvolutionNotice({ weapons, visible }: { weapons: EvolutionId[]; visible: boolean }) {
  const seen = useRef(new Set<EvolutionId>());
  const [names, setNames] = useState<string[]>([]);
  const signature = weapons.join(",");
  useEffect(() => {
    const ids = signature ? signature.split(",") as EvolutionId[] : [];
    const added = ids.filter((id) => !seen.current.has(id));
    seen.current = new Set(ids);
    if (added.length === 0) {
      if (ids.length === 0) setNames([]);
      return;
    }
    setNames(added.map((id) => EVOLUTION_RECIPES.find((recipe) => recipe.id === id)!.name));
  }, [signature]);
  useEffect(() => {
    if (!visible || names.length === 0) return;
    const timer = window.setTimeout(() => setNames([]), 3500);
    return () => window.clearTimeout(timer);
  }, [visible, names]);
  if (!visible || names.length === 0) return null;
  return <div className="evolution-notice" role="status" aria-live="polite" data-testid="evolution-notice">
    <b>武器が進化！</b><strong>{names.join("・")}</strong><span>2つの武器が合体。攻撃枠が1つ空きました。</span>
  </div>;
}
