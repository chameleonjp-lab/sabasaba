FILES = [
  {"path": "client/src/components/EvolutionNotice.tsx", "before": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "after": "fabc52fc8d7f4a7868b6736cd4972089cbecf9003875f84d162e0532d8e9fef0", "edits": [
    (0, 0, r'''import { useEffect, useRef, useState } from "react";
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
    const timer = window.setTimeout(() => setNames([]), 3500);
    return () => window.clearTimeout(timer);
  }, [signature]);
  if (!visible || names.length === 0) return null;
  return <div className="evolution-notice" role="status" aria-live="polite" data-testid="evolution-notice">
    <b>武器が進化！</b><strong>{names.join("・")}</strong><span>2つの武器が合体。攻撃枠が1つ空きました。</span>
  </div>;
}
'''),
  ]},
  {"path": "client/src/components/EvolutionResults.tsx", "before": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "after": "1449f0b87666575c3aaca93d04fcdc0ef17f61f2536f1997ef06694a5dbf259c", "edits": [
    (0, 0, r'''import type { AttackResultStat } from "@/game/types";
import { SCORE_RULES } from "@/game/rules";

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
'''),
  ]},
  {"path": "client/src/components/GameCanvas.tsx", "before": "14bd0171eb6f353a640d8c8cda29d6c1de779af006e22ead7dfa27e2bb907cad", "after": "c197e60023d1cbf760665deef91acf3b6eb9d1c4affe85022ba0d8ffab854b9a", "edits": [
    (1145, 1145, r'''import EvolutionResults from "@/components/EvolutionResults";
import EvolutionNotice from "@/components/EvolutionNotice";
'''),
    (8027, 8027, r'''初期'''),
    (8036, 8036, r'''す。無限モードでは10レベルごとに攻撃枠が増え、最大14枠になりま'''),
    (57912, 57912, r'''は初期'''),
    (57929, 57932, r'''無限は10レベルごとに'''),
    (57934, 57934, r'''枠+1、最大14枠です。対応する2武器'''),
    (57935, 57940, r'''レベル'''),
    (57941, 57945, r'''にす'''),
    (57952, 57952, r'''て1枠空き'''),
    (67834, 67840, r'''新しい武器'''),
    (67841, 67843, r'''優先表示'''),
    (68063, 68074, r'''しい武器を優先して表示しま'''),
    (68076, 68080, r'''空き枠がな'''),
    (68081, 68089, r'''れば装備を強化できます'''),
    (68095, 68097, r'''新しい武器の追加か、持っている'''),
    (68102, 68107, r'''を'''),
    (68110, 68116, r'''選んで'''),
    (68253, 68253, r'''{currentMode === "endless" && " レベル10ごとに攻撃枠+1（最大14枠）。進化すると1枠空きます。"}'''),
    (69866, 69866, r'''{upgrade.currentLevel === 0 && <span className="new-weapon-badge">新規</span>}'''),
    (70678, 70678, r'''><div className="result-actions result-primary-actions"><button className="primary-dialog-button" data-testid="retry-run" type="button" onClick={retryRun}>もう一度遊ぶ</button><ShareButton className="result-share-action" label="結果をシェア" testId="share-result" title="サバサバ" text={`【サバサバ】${MODE_LABELS[currentMode]} / 生存時間 ${formatTime(snapshot.seconds)} / スコア ${formatStat(score)} / レベル${snapshot.level} / 撃破${formatStat(snapshot.kills)}体${evolvedWeaponLabels.length ? ` / 進化武器：${evolvedWeaponLabels.join("・")}` : ""}`} /></div'''),
    (72253, 72283, r''''''),
    (72284, 72304, r'''E'''),
    (72312, 72313, r'''Results stats={snapshot.'''),
    (72319, 72320, r'''Stats}'''),
    (72321, 72342, r'''/'''),
    (72343, 72417, r''''''),
    (72591, 72595, r'''進化前を含む全期間'''),
    (72598, 72600, r'''得点とは別の戦闘記録'''),
    (72901, 72901, r'''{stat.evolutionId ? "進化武器（進化前の2武器分も含む）" : `'''),
    (72904, 72904, r'''$'''),
    (72939, 72939, r'''}`'''),
    (74737, 75073, r''''''),
    (75984, 75984, r'''      <EvolutionNotice weapons={evolvedWeapons} visible={runStarted && snapshot.phase === "playing" && !isPaused && countdownRemaining === 0} />
'''),
  ]},
  {"path": "client/src/components/ShareButton.tsx", "before": "a890597430bef23c2dfab0e0658399954dbcd2bbe92fbb33fc152a2f6ce41f77", "after": "b37e021885335f5ae065050704ceaf2f3348091ea9fe735e9574c651ef0d25a6", "edits": [
    (695, 695, r'''  const [pending, setPending] = useState(false);
  const [manualText, setManualText] = useState("");
  const sharingRef = useRef(false);
'''),
    (1116, 1117, r'''performS'''),
    (1138, 1138, r'''    setManualText("");
'''),
    (1778, 1778, r'''      setManualText(shareText);
'''),
    (1796, 1796, r'''下の'''),
    (1799, 1799, r'''文を選択してコピー'''),
    (1802, 1807, r'''す'''),
    (1818, 1818, r'''  };

  const share = async () => {
    if (sharingRef.current) return;
    sharingRef.current = true;
    setPending(true);
    try { await performShare(); }
    finally { sharingRef.current = false; setPending(false); }
'''),
    (1966, 1966, r'''disabled={pending} '''),
    (2028, 2028, r'''      {manualText && <textarea className="share-manual-text" aria-label="コピー用のシェア文" readOnly value={manualText} onFocus={(event) => event.currentTarget.select()} />}
'''),
  ]},
  {"path": "client/src/game/GameWorld.runtime.test.ts", "before": "1879332d2a83c5aa43063419a1d077aae2e686899d46f9da8950e671a817b11b", "after": "132af0721efd24a3064c1e4a77db06092c3c4f6ee5bd802677aac5d10b8900ac", "edits": [
    (32629, 32629, r'''async '''),
    (34300, 34300, r'''      // Real animation frames yield; allow Babylon disposal microtasks to finish, too.
      // All 72,000 simulation steps and the original assertions are retained.
      if (step % 1000 === 0) await new Promise<void>((resolve) => setImmediate(resolve));
'''),
    (35873, 35873, r''', 60_000'''),
  ]},
  {"path": "client/src/game/rules.ts", "before": "854879ebef345d18fd2e5b963bd8e50f7c032dedb6f736fbf4ada63391cbd6bc", "after": "32a609e52120f7570e5bebe080680b5c24a14324e371efbd188c1c026d289364", "edits": [
    (3253, 3253, r'''/** Endless earns one additional attack slot every ten levels, with a finite rendering budget. */
export const ENDLESS_ATTACK_SLOT_LIMIT = 14;
export const ATTACK_SLOT_LEVEL_INTERVAL = 10;
export function getAttackSlotLimit(mode: GameMode, level: number): number {
  const normalized = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  return mode === "normal" ? ATTACK_SLOT_LIMIT
    : Math.min(ENDLESS_ATTACK_SLOT_LIMIT, ATTACK_SLOT_LIMIT + Math.floor(normalized / ATTACK_SLOT_LEVEL_INTERVAL));
}
/** High-level variants must not keep their early-run HP when experience outpaces the clock. */
export function getEndlessVariantHealthFloor(level: number): number {
  const growth = Number.isFinite(level) ? Math.max(0, Math.min(MAX_PLAYER_LEVEL, Math.floor(level)) - 20) : 0;
  return EARLY_SCOUT_MIN_HP + growth * 3 + Math.floor(growth * growth / 20);
}
'''),
    (6501, 6501, r'''  "evolution",
'''),
  ]},
  {"path": "client/src/game/types.ts", "before": "11ddd811fbcba2f02621c6148e1891a0e7549f8fae4130310cb9bb3bf78bf53c", "after": "ebf237daaee999c65140a30f89eb8380d942543662ceac632563e9a2f639b89e", "edits": [
    (505, 505, r'''  | "evolution"
'''),
    (1621, 1621, r'''  /** Combined lifetime totals remain in damage/kills; these fields count hits after evolution. */
  evolutionId?: EvolutionId;
  evolvedDamage?: number;
  evolvedKills?: number;
  sourceLabels?: string[];
'''),
  ]},
  {"path": "client/src/hooks/useGameAudio.ts", "before": "bb4ea74baa049297e59d256d191be1d9a40b28a856d49922ab1b06a8d592dc73", "after": "b34dbb9fb4a8babe9494f488e42d0a5ccf3c1d109fcafa315c7e81f7d2d26adf", "edits": [
    (976, 976, r'''  evolution: [262, 330, 392, 523, 659],
'''),
    (1398, 1398, r'''  evolution: 0.65,
'''),
  ]},
  {"path": "client/src/index.css", "before": "95d17244357be8b333ebc5840adb13ea7b67844201fa620af3d84a52d957cbcd", "after": "dcdba975911a242fe363ed081877b18d78a249f636692015035172839b7eedab", "edits": [
    (105861, 105861, r'''
/* Result actions stay discoverable before the long statistics/ranking report. */
.result-actions .primary-dialog-button { color: #1a1003; background: #ffad26; border: 2px solid #ffd58a; }
.result-actions .primary-dialog-button:hover,
.result-actions .primary-dialog-button:active { color: #1a1003; background: #ffc45e; }
.result-actions button:focus-visible { outline: 3px solid #a9fff6; outline-offset: 3px; }
.result-console > h2 { font-size: clamp(32px, 8vw, 56px); line-height: 1.05; }
.result-primary-actions { position: sticky; top: 0; z-index: 4; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0 0 14px; padding: 8px; border: 1px solid #617b79; background: #071617; }
.result-primary-actions button { min-height: 48px; font-size: 13px; letter-spacing: .02em; line-height: 1.4; }
.result-primary-actions .share-action { min-width: 0; margin: 0; }
.result-primary-actions .share-button { color: #f4fffc; background: #173f40; border-color: #83ccc9; }
.evolution-result > header { font-size: 14px; line-height: 1.5; }
.evolution-result > p { color: #d9e9dc; font-size: 12px; line-height: 1.65; }
.evolution-result-grid { display: grid; gap: 10px; margin: 12px 0; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }
.evolution-result-grid article { min-width: 0; padding: 14px; border: 1px solid #81c795; background: #102720; }
.evolution-badge, .new-weapon-badge { display: inline-block; padding: 3px 7px; color: #152718; background: #b3ef98; font-size: 11px; font-weight: 700; line-height: 1.4; }
.new-weapon-badge { margin-left: 6px; }
.evolution-result-grid h3 { margin: 8px 0; color: #f0ffe7; font-size: 17px; overflow-wrap: anywhere; }
.evolution-result-grid p { color: #c3dcc9; font-size: 12px; line-height: 1.5; }
.evolution-result-grid dl { display: grid; gap: 8px; margin: 12px 0 0; }
.evolution-result-grid dl > div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; align-items: baseline; }
.evolution-result-grid dt { color: #d9e9dc; font-size: 12px; }
.evolution-result-grid dd { margin: 0; color: #fff4d8; font-size: 20px; font-weight: 700; }
.evolution-notice { position: fixed; z-index: 40; top: 25%; left: 50%; transform: translateX(-50%); display: grid; gap: 6px; width: min(88vw, 440px); padding: 14px 18px; border: 2px solid #c8fba9; background: rgba(9, 35, 29, .92); color: #f3ffe8; text-align: center; pointer-events: none; box-shadow: 0 0 22px rgba(121, 255, 201, .25); }
.evolution-notice b { color: #c8fba9; font-size: 16px; }
.evolution-notice strong { font-size: 20px; overflow-wrap: anywhere; }
.evolution-notice span { font-size: 12px; line-height: 1.5; }
.share-manual-text { width: 100%; min-height: 90px; margin-top: 8px; padding: 8px; color: #effff9; background: #071617; border: 1px solid #83ccc9; user-select: text; -webkit-user-select: text; touch-action: auto; }
@media (max-width: 420px) { .result-primary-actions { padding: 6px; gap: 6px; } .result-primary-actions button { padding: 10px 6px; font-size: 12px; } .result-stat-row strong { overflow-wrap: anywhere; } }
@media (max-height: 480px) { .evolution-notice { top: 18%; padding: 8px 12px; } .evolution-notice strong { font-size: 16px; } }
'''),
  ]},
  {"path": "docs/PROGRESSION_REVIEW_20260909.md", "before": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "after": "22d02198df43af17ff196f48d1f398f5ab1712409b7e138825d8405b11f6200e", "edits": [
    (0, 0, r'''# 武器成長・敵の行動・進化結果の修正記録

基準: main `feb036a513815137c8d0e410f79179539068fd9b`。既存ランキング式・停止針・回避・ノーマルのボス日程は維持する。

## 原因と変更

固定6攻撃枠に初期レールも含まれるため、レベル80でも追加5つで止まった。新武器候補はレベル10から、未取得優先の節目はレベル30から7レベルおきで、序盤も新規入手機会が少なかった。無限では6→14枠へ段階的に拡張し、レベル3から候補を増やし、空き枠があれば新規攻撃を必ず1件提示する。新しい武器種類そのものの追加ではない。

21派生敵には体力倍率・形状差があったが、移動は主に同じ追尾で、砲撃型と装甲型の波動は威力0の表示だけだった。7系統を移動・予告・防御・実際の攻撃で分け、レベル依存の体力下限と体力バーを加えた。

進化武器は進化前2武器の全期間成績をまとめていた。これを維持した上で、進化成立後だけの記録を別欄に加えた。「武器ダメージ＝得点」ではないことを明記し、撃破分の得点を表示する。

結果画面の再プレイは背景色だけが汎用ボタン規則で上書きされ、暗い背景に暗い文字になっていた。専用の色指定を加え、下部にあったシェアも上部の操作列へ移した。

## 検証

- 型検査、既存75件と新規34件の計109件をローカルで通過。
- 変更前のGameWorldへ新規検査の該当部分を当て、レベル80の取得・レベル3の候補・体力・固定方向突進・砲撃・装甲の11ケースが失敗することを確認。修正後は同じ検査が通過。
- 長時間検査は72,000ステップ、10/30/60分の確認値・敵数・演出数・メッシュ数・音の上限をすべて維持した。同期ループが後片付けの処理を溜めるため、1,000ステップごとに制御を返すよう修正。変更前でも同様の約2GBの一時メモリ増加を確認した。非同期化に合わせ、当該検査だけ明示的に60秒の実行上限を設定した。ゲーム内時間や合格条件を短縮していない。
- `scripts/verify-result-ui.py` はビルド後の実ページを使い、両モード×5画面寸法で操作位置・44px以上の領域・色のコントラスト・横はみ出し・進化成績を検査する。共有の成功・キャンセル・コピー・手動コピー・二重起動防止と再プレイも確認する。
- iPhone実機での操作感・発熱・フレーム速度・共有シート自体の表示は自動検査では保証しない。敵の強さと14枠時の爽快感についても実プレイ評価は別途必要。
'''),
  ]},
  {"path": "docs/SABASABA_CURRENT_SPEC.md", "before": "5caa3f17f732a50a92f1cd736cf3c02dd0ede60160dd913de81b69a0e6b63063", "after": "31c6bd4fb94df9f8fff42fddf8289e62bd3ea7152cb0a8853e333ab3eff117b9", "edits": [
    (3927, 3927, r'''
## 9. 2026-09-09 武器成長・敵行動・結果表示の改訂

### 武器を増やす機会

- 攻撃枠は初期レールを含む。ノーマルは6枠、無限は初期6枠からレベル10ごとに1枠増え、レベル80で最大14枠になる。補助は4枠のまま。
- 武器モジュールはレベル3から候補に加える。空き攻撃枠と未取得の候補がある場合、通常選択・再抽選で少なくとも1つの新規攻撃を提示する。
- レベル5から5レベルごとの選択では未取得の攻撃を優先する。取得は自動配布ではなく、提示された候補から本人が選ぶ。
- 通常選択では、両方取得済みの進化材料について次の強化候補も優先する。双方レベル3で自動進化し、2枠が1枠になる条件は変えない。

### 高レベル敵の7系統の行動

- 突進：停止して予告し、予告時の方向へ直進する。突進中にプレイヤーを追尾し直さない。
- 回り込み：横方向へ旋回しながら接近する。群れ型は左右から斜めに詰め、至近距離では直接接近する。
- 遊撃：間合いを保ち、短い突進の後に2秒間後退する。
- 砲撃：距離6～10を保ち、1秒前に固定した着弾点へ半径2.35の攻撃を行う。威力は敵設定値、最大10。予告後に着弾点を追尾させない。
- 装甲：予告後の2秒は移動を止め、受けるダメージを35%にする。防御中は装甲の輪を大きく表示する。
- 波動：停止して0.62秒予告した後、周囲へ既存の設定威力の攻撃を行う。
- 色だけでなく既存の形状部品を使い分け、高レベル敵すべてに体力バーを付ける。21種類それぞれに独立した行動プログラムを持つわけではなく、上記7系統を使う。
- 無限の派生敵の基礎体力は従来の経過時間値と、`18 + 3g + floor(g² / 20)`の大きい方に各敵の体力倍率を掛ける。`g = clamp(レベル, 20, 200) - 20`。ノーマルの時間制限・ボス体力式は変えない。
- 通常接触は2ダメージを維持する。デコイに誘導された敵は古い対プレイヤー攻撃の予告・突進を解除する。停止中は予告と攻撃を進めない。

### 進化と結果画面

- 6つの進化武器に、完成時の短い通知・専用音・発光リングを付ける。光線の芯、跳弾の連結線、重力核の周回リングと崩壊、砲列の二連砲身、周回刃の輪、誘爆ビーコンの冠と爆発リングを表示する。武器の攻撃回数・ダメージ式は演出変更で増やさない。
- 演出は既存の寿命管理と表示数上限を使用する。通知は操作を遮らず、再開後に表示する。
- 結果の進化武器欄は、進化成立後に与えたダメージ・成立後にとどめを刺した敵数・その敵数×100点を分けて示す。成立前のダメージと撃破は含めない。進化前に発射され、成立後に命中した攻撃は命中した時点で集計する。
- 全期間の武器記録には進化前の2武器分も含め、その旨を明記する。撃破得点は既存の総得点の内訳であり、追加加点しない。ランキング計算・送信契約は変更しない。
- 結果画面の上部に「もう一度遊ぶ」と「結果をシェア」を置く。再プレイは濃い文字と橙色背景、シェアは明るい文字と濃い背景で表示する。
- シェアにはモード・時間・得点・レベル・撃破数・進化武器名を含める。端末の共有が利用できない場合はコピーし、それも利用できなければ選択可能な文を表示する。共有のキャンセルではコピーへ進まない。
'''),
  ]},
  {"path": "package.json", "before": "45270e6bebb92b3e4644c9459e22a4976d8a1da8dbc285b8199b8e79cb75355a", "after": "73d630099ed84d815638d26aa32b3f0ca7e79c08c74e1e549e3a16f99f3937fd", "edits": [
    (655, 655, r''' client/src/game/GameWorld.progression.test.ts'''),
  ]},
]
