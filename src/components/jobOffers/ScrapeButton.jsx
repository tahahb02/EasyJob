import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Bouton de scraping avec remplissage « verre d'eau ».
 * - au clic : la pastille d'eau monte du bas vers le haut,
 * - pendant l'exécution : progression live 0→90 %,
 * - à la fin : montée vers 100 % puis retombe à 0.
 */
export default function ScrapeButton({
  progress = 0,
  active = false,
  done = false,
  label = 'Lancer le scraping',
  activeLabel = 'Scrapping en cours',
  icon: Icon,
  activeIcon: ActiveIcon,
  className,
  children,
  ...props
}) {
  const pct = Math.min(Math.max(progress, 0), 100)
  const filled = active && pct > 0
  const isDone = active && done && pct >= 100
  const high = pct >= 55
  const IconEl = active && ActiveIcon ? ActiveIcon : Icon
  const buttonLabel = active
    ? isDone
      ? 'Terminé !'
      : `${activeLabel}${pct > 0 ? ` ${Math.round(pct)}%` : ''}`
    : label

  return (
    <Button
      {...props}
      className={cn('relative overflow-hidden', className)}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out',
          filled && 'bg-gradient-to-t from-sky-800/85 via-sky-600/70 to-sky-400/60',
        )}
        style={{ height: filled ? `${pct}%` : '0%' }}
      >
        <span className="absolute inset-x-0 top-0 h-[2px] rounded-full bg-sky-200/80 blur-[1px]" />
        <span className="water-sheen absolute inset-0" />
      </span>

      <span
        className={cn(
          'relative z-10 inline-flex items-center gap-2 transition-colors duration-300',
          filled && high && 'text-white drop-shadow-sm',
        )}
      >
        <IconEl className={cn(active && !ActiveIcon && !isDone && 'animate-pulse')} />
        {buttonLabel}
        {children}
      </span>
    </Button>
  )
}