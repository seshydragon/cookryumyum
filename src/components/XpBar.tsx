import { LEVELS } from '../data/progress'

export function XpBar({
  xp,
  levelIndex,
  progress,
  nextName,
  xpForNext,
}: {
  xp: number
  levelIndex: number
  progress: number
  nextName?: string
  xpForNext: number
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Chef level {levelIndex + 1} of {LEVELS.length}</p>
          <p className="font-display text-2xl font-semibold">{LEVELS[levelIndex].name}</p>
        </div>
        <p className="text-right text-sm text-ink-soft">
          <span className="font-display text-xl font-semibold text-ink">{xp}</span> XP
        </p>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-paper-3"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to next chef level"
      >
        <div
          className="h-full rounded-full bg-ember transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(2, progress * 100)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-ink-soft">
        {nextName
          ? `${xpForNext} XP to ${nextName}`
          : 'Top of the brigade. Nothing left to unlock.'}
      </p>
    </div>
  )
}
