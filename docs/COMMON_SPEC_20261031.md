# サバサバ 共通仕様対応記録（2026-10-31）

## 対象と参照版

実験場が現在読むSupabase `games` の登録行で `is_active=true` とゲームURLを確認し、そのURLのHTTP200/タイトルを確認した。固定fallback一覧だけでは判定していない。今回対象 `sabasaba_normal, sabasaba_endless`。公開URL: https://chameleonjp-lab.github.io/sabasaba/

ランキング詳細: https://chameleonjp-lab.github.io/chameleonjp_lab/ranking.html?game=sabasaba_normal / https://chameleonjp-lab.github.io/chameleonjp_lab/ranking.html?game=sabasaba_endless

着手時GitHub公開ブランチ `main`、SHA `4b673710d8be5fe3abc2044e4de206c0bafcca1e`。進行中のopen PRは着手時およびPR作成前のAPI読取りで0件。ブランチ保護APIは403で詳細未確認、rulesetsの読取りは空。保護・環境・登録フラグは変更していない。Codebergからの導線切替は今回行わない（現在登録されたGitHub公開URLを維持）。

多言語基準: Sainome `79b1e5733e725cd1148b10fa5699ba846e2bf57d` / `js/language-options.js` の言語選択肢: ja,en,es,pt-BR,zh-Hans,fr,de,ko,ru,it,zh-Hant,id,tr,vi,th。

## 実装

ホーム名を任意にし、開始時の名前を固定。空白では公開登録せず結果ランキングを取得。モード別集計30名、X投稿画面/コピーと詳細URLを統一。初操作の音オフを先に反映し、音量0/オフの保存、発音数/連打抑制、音声ノード解放と非表示時停止を追加。公開workflowを最新mainの検証済み成果物に限定。

## 対応表

| 共通仕様 | 状態 | 根拠・残り |
|---|---|---|
|1 対象判定|既存確認済み|現行登録行と公開HTMLを別々に確認。|
|2 既存仕様/記録|既存で維持|採点・時間・難易度・ゲームslug・保存済みデータを初期化しない。|
|3 正式URL/移行|既存URL維持|登録されたGitHub Pagesを正式URLとして使用。Codeberg側の新規公開/切替なし。別origin保存の移行完了は主張しない。|
|4 多言語|未完了|未完了: 日本語UI・装備説明等の15言語翻訳・言語選択。|
|5 名前/送信|今回実装/既存維持・一部未完了|今回ホーム任意名、公開説明、名前変更/消去保存、開始時名の参照を固定。verified endpointのプレイトークン、正規クリア/ゲームオーバー限定を維持。|
|6 ランキング|今回実装/既存維持・本人同一性未完了|今回モード別get_best_score_rankingの最大30名へ。匿名/中断も閲覧のみ可能。サーバーrankをそのまま表示。|
|7 X共有|今回実装|ホーム紹介と今回結果を分離。X投稿確定は利用者。黒/白、コピーまたは選択可能な代替。未翻訳言語は§4。|
|8 効果音|既存確認/今回補修|下記イベント表。実際の聞こえ方は未確認。|
|9 音初期/保存|既存維持/今回実装|初回on、既存offと0尊重。実機復帰/音質は未確認。|
|10 文言/UI|今回実装・一部未確認|公開説明、共有/ランキングラベルと操作サイズ。iPhone17 Pro実機は未確認。|
|11 継続公開|今回実装・本番未確認|PRは検証のみ。保護を維持し、公開ブランチの検証済み成果物のみ公開。下記設定手順。|
|12 検証|今回実施・一部未完了|下記ログ要約。母語話者・実音・実機・マージ後公開は未実施。|
|13 PR/記録|今回作成|ゲーム別Draft PR。未完了を対象外に分類しない。|

## 記録とランキング契約

```json
[
  {
    "game_slug": "sabasaba_endless",
    "title": "サバサバ（エンドレス）",
    "game_url": "https://chameleonjp-lab.github.io/sabasaba/",
    "is_active": true,
    "release_date": "2026-08-20",
    "score_order": "desc",
    "score_scale": 1,
    "score_decimals": 0,
    "score_unit": "点",
    "top_ranking_type": "best",
    "submission_mode": "verified"
  },
  {
    "game_slug": "sabasaba_normal",
    "title": "サバサバ（ノーマル）",
    "game_url": "https://chameleonjp-lab.github.io/sabasaba/",
    "is_active": true,
    "release_date": "2026-08-20",
    "score_order": "desc",
    "score_scale": 1,
    "score_decimals": 0,
    "score_unit": "点",
    "top_ranking_type": "best",
    "submission_mode": "verified"
  }
]
```

サーバーの既存参加者は表示名で識別される。このままでは同名の別人を区別できず、改名で同じ参加者を保つことも保証できない。今回データを削除/再構築したり、全記録を新しい参加者へ割り当て直したりしない。別途、安定したparticipant IDと旧記録の所有確認/移行方式が必要。上位30名の厳密な「本人単位」の達成はこの制約が残る。API集計と詳細ランキングの既存名前単位集計は一致させる。表示名や上位一覧から圏外順位/全人数を推測しない。

## 効果音対応表

| 対象イベント/役割 | 条件・重複防止・箇所 |
|---|---|
|実在するゲームイベント|client/src/hooks/useGameAudio.tsのstart/attack/kill種別/xp/level-up/evolution/warning/perfect/dodge/boss/damage/low-health/clear/gameover/choiceを維持。イベント別50ms抑制、同時source上限、終了/進化の優先停止、onended解放とhidden時停止を追加。既存CC0音のライセンスはdocs/AUDIO_CREDITS.md。音量キー追加、旧on/offキー維持。|
|無音時|視覚の判定・得点・状態表示を維持。音成功を開始条件にしない。|
|実音検証|自動テストは発音呼出/ノード/保存値を確認する範囲。スピーカーでの音量/音質・iPhone復帰は未確認。|

## 検証

TypeScript、既存ルール/実行時/ランキング/共有7ファイル110件、build成功。長時間シミュレーション既存試験を含む。Chromiumの結果画面を通常/無限×5画面サイズで確認し、X投稿画面/コピー/手動コピー/重複操作防止/再挑戦も成功（公開通信しないpreview）。

本番ランキングへ試験スコアを書いていない。ブラウザ検証はmock/ローカルページを使用し、幅変更・WebKitを実機Safari確認と混同しない。未実施の全言語自然さ、iPhone17 Pro Safariの縦横/ソフトキーボード/ブラウザバー/画面ロック復帰、実音、マージ後の公開確認は残る。

## 適用順・公開後確認・切戻し

GitHub Pages Source は `GitHub Actions`（workflow）をAPIで確認。

1. PR差分とCIを確認し、ユーザーが `main` へマージする。直接push/自動マージはしない。
2. マージコミットの検証/ビルド/公開が成功したことと、公開URLの共有ラベル・ランキング詳細導線・今回の変更を確認する。PR段階の成功を本番公開済みとは扱わない。
3. iPhoneで名前空欄→開始→結果→ランキング、名前変更後の次プレイ、Xをキャンセルして復帰、音オフ/0→再読み込み、縦横とキーボード表示を短く確認する。実データへの多数の試験登録は避ける。
4. 問題があればこのPRをrevertする新PRを作成し通常の検証/マージで戻す。DB行/設定/自己ベストを消さない。Pages設定を変更した場合は元の `workflow` / `main` 設定と既存公開artifactを記録して戻す。元の実行が新しい公開を後から上書きしないよう、古い実行を再実行しない。

現時点: **実装・ローカル検証済みの範囲と未完了を上記に区別 / ユーザーのマージ待ち / 必要な設定と権限は上記 / 本番公開後確認待ち**。共通仕様全体の完了報告ではない。

独立レビュー: 親担当が開始時名前snapshot・runID/取得世代・匿名条件を確認し、導入したblocking defectなし。音の拡張部分は型/既存110件とコード確認の範囲。
