import { t } from "@/i18n/runtime";
import { useEffect, useRef, useState } from "react";

export const buildShareText = (text: string, url: string) => `${text.trim()}\n#サバサバ #ゲーム制作\n${url}`;

type ShareButtonProps = {
  title: string;
  text: string;
  label: string;
  testId: string;
  className?: string;
};

const getShareUrl = () => 'https://chameleonjp-lab.github.io/sabasaba/';

export const buildXIntent = (text: string) => {
  const url = new URL('https://x.com/intent/post');
  url.searchParams.set('text', text);
  return url.href;
};

export default function ShareButton({ text, label, testId, className = "" }: ShareButtonProps) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [manualText, setManualText] = useState("");
  const sharingRef = useRef(false);
  const statusTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
  }, []);

  const showStatus = (message: string) => {
    setStatus(message);
    if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setStatus(""), 1800);
  };

  const performShare = async () => {
    setManualText("");
    const url = getShareUrl();
    const shareText = buildShareText(text, url);
    try {
      const popup = window.open(buildXIntent(shareText), '_blank');
      if (popup) { popup.opener = null; showStatus(t('Xの投稿画面を開きました。')); return; }
    } catch { /* Copy and manual text remain available. */ }

    try {
      await navigator.clipboard.writeText(shareText);
      showStatus(t("シェア文をコピーしました。"));
    } catch {
      setManualText(shareText);
      showStatus(t("下のシェア文を選択してコピーできます。"));
    }
  };

  const share = async () => {
    if (sharingRef.current) return;
    sharingRef.current = true;
    setPending(true);
    try { await performShare(); }
    finally { sharingRef.current = false; setPending(false); }
  };

  return (
    <div className={`share-action ${className}`.trim()}>
      <button className="share-button" data-testid={testId} type="button" disabled={pending} onClick={() => void share()}>
        {label}
      </button>
      {manualText && <textarea className="share-manual-text" aria-label={t("コピー用のシェア文")} readOnly value={manualText} onFocus={(event) => event.currentTarget.select()} />}
      {status && <p className="share-status" role="status" aria-live="polite">{status}</p>}
    </div>
  );
}
