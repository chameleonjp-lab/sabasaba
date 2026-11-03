import { t } from "@/i18n/runtime";
import { useLayoutEffect, useRef, useState } from "react";

export const buildShareText = (text: string, url: string) => `${text.trim()}\n#サバサバ #ゲーム制作\n${url}`;

type ShareButtonProps = {
  title: string;
  text: string;
  label: string;
  testId: string;
  contextKey: string;
  className?: string;
};

const getShareUrl = () => 'https://chameleonjp-lab.github.io/sabasaba/';

export const buildXIntent = (text: string) => {
  const url = new URL('https://x.com/intent/post');
  url.searchParams.set('text', text);
  return url.href;
};

function openXSharePopup(intent: string) {
  let popup: Window | null = null;
  try {
    // Open in the user gesture; never navigate externally before privacy setup.
    popup = window.open('about:blank', '_blank');
    if (!popup) return false;
    popup.opener = null;
    if (popup.opener !== null) throw new Error('opener_not_detached');
    const link = popup.document.createElement('a');
    link.href = intent;
    link.target = '_self';
    link.rel = 'noreferrer';
    link.referrerPolicy = 'no-referrer';
    popup.document.body.append(link);
    link.click();
    return true;
  } catch {
    try { popup?.close(); } catch { /* Best effort; never navigate on failure. */ }
    return false;
  }
}

export default function ShareButton({ text, label, testId, contextKey, className = "" }: ShareButtonProps) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [manualText, setManualText] = useState("");
  const sharingRef = useRef(false);
  const statusTimerRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const activeRef = useRef(false);

  const clearStatusTimer = () => {
    if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = null;
  };

  useLayoutEffect(() => {
    const invalidate = () => {
      generationRef.current += 1;
      activeRef.current = false;
      sharingRef.current = false;
      clearStatusTimer();
    };
    const activate = () => {
      invalidate();
      activeRef.current = document.visibilityState !== 'hidden';
      setStatus("");
      setManualText("");
      setPending(false);
    };
    const visibilityChanged = () => {
      if (document.visibilityState === 'hidden') invalidate();
      else activate();
    };
    activate();
    window.addEventListener('pagehide', invalidate);
    window.addEventListener('pageshow', activate);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      invalidate();
      window.removeEventListener('pagehide', invalidate);
      window.removeEventListener('pageshow', activate);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [contextKey, text]);

  const isCurrent = (request: number) => activeRef.current && generationRef.current === request;

  const showStatus = (message: string, request: number) => {
    if (!isCurrent(request)) return;
    setStatus(message);
    clearStatusTimer();
    statusTimerRef.current = window.setTimeout(() => {
      if (isCurrent(request)) setStatus("");
    }, 1800);
  };

  const performShare = async (request: number) => {
    setManualText("");
    const url = getShareUrl();
    const shareText = buildShareText(text, url);
    if (openXSharePopup(buildXIntent(shareText))) {
      showStatus(t('Xの投稿画面を開きました。'), request);
      return;
    }

    try {
      if (!isCurrent(request)) return;
      await navigator.clipboard.writeText(shareText);
      showStatus(t("シェア文をコピーしました。"), request);
    } catch {
      if (!isCurrent(request)) return;
      setManualText(shareText);
      showStatus(t("下のシェア文を選択してコピーできます。"), request);
    }
  };

  const share = async () => {
    if (!activeRef.current || sharingRef.current) return;
    const request = ++generationRef.current;
    sharingRef.current = true;
    clearStatusTimer();
    setStatus("");
    setPending(true);
    try { await performShare(request); }
    finally {
      if (isCurrent(request)) { sharingRef.current = false; setPending(false); }
    }
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
