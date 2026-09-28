const SWATCHES: Record<string, string> = {
  ember: 'var(--color-ember)',
  olive: 'var(--color-olive)',
  plum: 'var(--color-plum)',
  gold: 'var(--color-gold)',
  ink: 'var(--color-ink-2)',
}

/** Initials on a coloured tile. Deterministic from the name, so it never shifts. */
export function Avatar({
  name,
  swatch = 'ember',
  size = 36,
}: {
  name: string
  swatch?: string
  size?: number
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const keys = Object.keys(SWATCHES)
  const fallback =
    keys[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % keys.length]
  const background = SWATCHES[swatch] ?? SWATCHES[fallback]

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-sm font-bold text-paper"
      style={{
        width: size,
        height: size,
        background,
        fontSize: size * 0.38,
        letterSpacing: '0.02em',
      }}
    >
      {initials || '?'}
    </span>
  )
}
