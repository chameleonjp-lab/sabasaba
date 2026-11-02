import { t, getLocale } from "@/i18n/runtime";
import type { AttackResultStat } from "@/game/types";
import { SCORE_RULES } from "@/game/rules";
import "./ResultLayout.css";

const number = (value: number) => Math.floor(value).toLocaleString(getLocale());

export default function EvolutionResults({ stats }: { stats: AttackResultStat[] }) {
  const evolved = stats.filter((stat) => stat.evolutionId);
  if (evolved.length === 0) return null;
  return <section className="evolution-result" aria-label={t("進化武器の成績")} data-testid="evolution-results">
    <header>{t("進化武器の成績")}</header>
    <p>{t("進化が成立した後に与えたダメージと、とどめを刺した敵を記録します。進化前の分は含みません。")}</p>
    <div className="evolution-result-grid">{evolved.map((stat) => <article key={stat.evolutionId} data-testid="evolution-result-card">
      <span className="evolution-badge">{t("進化完成")}</span>
      <h3>{t(stat.label)}</h3>
      <p>{stat.sourceLabels?.map(t).join(" ＋ ")}</p>
      <dl>
        <div><dt>{t("進化後のダメージ")}</dt><dd>{number(stat.evolvedDamage ?? 0)}</dd></div>
        <div><dt>{t("進化後の撃破")}</dt><dd>{t(`${number(stat.evolvedKills ?? 0)}体`)}</dd></div>
        <div><dt>{t("撃破による得点")}</dt><dd>{t(`${number((stat.evolvedKills ?? 0) * SCORE_RULES.killPoints)}点`)}</dd></div>
      </dl>
    </article>)}</div>
    <p>{t("撃破得点は総得点に含まれています。追加のボーナスではありません。ダメージ自体は得点に加算しません。")}</p>
  </section>;
}
