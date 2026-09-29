import { Link } from '@tanstack/react-router'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-paper-3 bg-paper-2/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-black">COOKr</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            A recipe shelf run by four people who cook every dish before writing about
            it. Nothing here is generated from a nutrition table and hoped for the best.
          </p>
          <p className="mt-4 text-xs text-ink-faint">
            Support 09:00–18:00 CET · hello@cookandflame.studio
          </p>
        </div>

        <div>
          <p className="eyebrow mb-3">Cook</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link to="/recipes" search={{ cuisine: [], when: [], tag: [], q: '', sort: 'top', max: undefined }} className="hover:text-ember">
                Recipe shelf
              </Link>
            </li>
            <li>
              <Link to="/challenges" className="hover:text-ember">
                Weekly challenge
              </Link>
            </li>
            <li>
              <Link to="/leaderboard" className="hover:text-ember">
                Leaderboards
              </Link>
            </li>
            <li>
              <Link to="/kitchen" className="hover:text-ember">
                My kitchen
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-3">Account</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link to="/signup" className="hover:text-ember">
                Create an account
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-ember">
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/security" className="hover:text-ember">
                How accounts are protected
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper-3 px-4 py-4 text-center text-xs text-ink-faint sm:px-6">
        Macro figures are per serving and calculated from the ingredient list, not weighed
        in a lab. Cook by taste.
      </div>
    </footer>
  )
}
