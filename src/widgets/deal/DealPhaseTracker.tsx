import { Check } from 'lucide-react'
import { cx } from '@shared/lib/cx'
import {
  DEAL_PHASE_LABELS,
  DEAL_PHASE_ORDER,
  dealPhase,
  type DealPhase,
  type DealStatus,
} from '@features/deals/dealData'

type Props = {
  status: DealStatus
  className?: string
}

// Renders the five ТЗ §5.3 phases of a deal as a horizontal stepper.
// Cancelled deals collapse the tracker to a single "Отменена" indicator.
export function DealPhaseTracker({ status, className }: Props) {
  const current = dealPhase(status)

  if (current === 'cancelled') {
    return (
      <div className={cx('rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600', className)}>
        {DEAL_PHASE_LABELS.cancelled}
      </div>
    )
  }

  const currentIndex = DEAL_PHASE_ORDER.indexOf(current)

  return (
    <ol className={cx('flex flex-wrap items-stretch gap-2', className)} aria-label="Стадия сделки">
      {DEAL_PHASE_ORDER.map((phase, index) => {
        const state: 'done' | 'current' | 'todo' =
          index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo'
        return <PhaseStep key={phase} phase={phase} index={index} state={state} />
      })}
    </ol>
  )
}

function PhaseStep({ phase, index, state }: { phase: DealPhase; index: number; state: 'done' | 'current' | 'todo' }) {
  const baseClasses = 'flex flex-1 min-w-[140px] items-center gap-3 rounded-2xl border px-3 py-2 text-sm'
  const stateClasses =
    state === 'done'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : state === 'current'
        ? 'border-brand-blue bg-brand-blue/5 text-slate-900 shadow-sm'
        : 'border-slate-200 bg-white text-slate-500'

  const markerClasses =
    state === 'done'
      ? 'bg-emerald-500 text-white'
      : state === 'current'
        ? 'bg-brand-blue text-white'
        : 'bg-slate-100 text-slate-500'

  return (
    <li className={cx(baseClasses, stateClasses)} aria-current={state === 'current' ? 'step' : undefined}>
      <span className={cx('grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold', markerClasses)}>
        {state === 'done' ? <Check className="size-4" /> : index + 1}
      </span>
      <span className="font-medium leading-tight">{DEAL_PHASE_LABELS[phase]}</span>
    </li>
  )
}
