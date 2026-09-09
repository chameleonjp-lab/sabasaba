import type { AttackResultStat } from "@/game/types";
import { SCORE_RULES } from "@/game/rules";
import "./ResultLayout.css";

const number = (value: number) => Math.floor(value).toLocaleString("ja-JP");

export default function EvolutionResults({ stats }: { stats: AttackResultStat[] }) {
  const evolved = stats.filter((stat) => stat.evolutionId);
  if (evolved.length === 0) return null;
  return <section className="evolution-result" aria-label="進化武器の成績" data-testid="evolution-results">
    <header>進化武器の成績</header>
    <p>進化が成立した後に与えたダメージと、とどめを刺した敵を記録します。進化前の分は含みません。</p>
    <div className="evolution-result-grid">{evolved.map((stat) => <article key={stat.evolutionId} data-testid="evolution-result-card">
      <span className="evolution-badge">進化完成</span>
      <h3>{stat.label}</h3>
      <p>{stat.sourceLabels?.join(" ＋ ")}</p>
      <dl>
        <div><dt>進化後のダメージ</dt><dd>{number(stat.evolvedDamage ?? 0)}</dd></div>
        <div><dt>進化後の撃破</dt><dd>{number(stat.evolvedKills ?? 0)}体</dd></div>
        <div><dt>撃破による得点</dt><dd>{number((stat.evolvedKills ?? 0) * SCORE_RULES.killPoints)}点</dd></div>
      </dl>
    </article>)}</div>
    <p>撃破得点は総得点に含まれています。追加のボーナスではありません。ダメージ自体は得点に加算しません。</p>
  </section>;
}
