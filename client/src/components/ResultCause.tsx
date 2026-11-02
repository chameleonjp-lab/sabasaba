import type {GameOutcome} from '@/game/types';
import {t} from '@/i18n/runtime';
export function ResultCause({outcome,cause}:{outcome:GameOutcome;cause:string|null}) {
 return cause && outcome !== 'clear' ? <p className="death-cause">{t(`原因 //${cause}`)}</p> : null;
}
