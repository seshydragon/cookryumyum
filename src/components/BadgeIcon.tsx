import {
  Archive,
  BookOpen,
  CakeSlice,
  Dumbbell,
  Flame,
  Globe2,
  Moon,
  ShoppingBasket,
  Sunrise,
  Target,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  utensils: UtensilsCrossed,
  sunrise: Sunrise,
  moon: Moon,
  cake: CakeSlice,
  archive: Archive,
  book: BookOpen,
  flame: Flame,
  dumbbell: Dumbbell,
  target: Target,
  globe: Globe2,
  basket: ShoppingBasket,
  trophy: Trophy,
}

export function BadgeIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const Icon = ICONS[icon] ?? Trophy
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />
}
