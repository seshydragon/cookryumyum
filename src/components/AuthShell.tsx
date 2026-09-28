import { img } from '../lib/img'

/** Shared two-column frame for sign in and sign up: form left, plate right. */
export function AuthShell({
  children,
  image,
  imageAlt,
  quote,
}: {
  children: React.ReactNode
  image: string
  imageAlt: string
  quote: string
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-0 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-20">
      <div className="max-w-md">{children}</div>

      <figure className="relative mt-12 hidden lg:mt-0 lg:block">
        <img
          src={img(image, { w: 1000 })}
          alt={imageAlt}
          className="h-full max-h-[34rem] w-full object-cover"
        />
        <figcaption className="absolute right-0 bottom-0 left-0 bg-ink/85 p-5">
          <p className="font-display text-lg leading-snug font-semibold text-paper">
            “{quote}”
          </p>
        </figcaption>
      </figure>
    </div>
  )
}
