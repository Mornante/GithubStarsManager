import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import { useDismissableOpen } from '../../hooks/useDismissableOpen'
import { OcticonChevronUpDown, OcticonMoon, OcticonSignOut, OcticonSun } from '../icons/Octicons'

export default function AccountMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { open, setOpen, ref } = useDismissableOpen<HTMLDivElement>()
  const account = useAuthStore((s) => s.currentAccount())
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme } = useTheme()

  if (!account) return null

  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          role="menu"
          className={`absolute bottom-full left-0 mb-2 min-w-56 rounded-md border border-border-default bg-canvas-overlay shadow-lg p-2 space-y-1 ${
            collapsed ? 'w-56' : 'w-full'
          }`}
        >
          <div className="flex items-center gap-2 px-2 py-1.5">
            <img src={account.user.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{account.user.name ?? account.user.login}</div>
              <div className="text-xs text-fg-muted truncate">
                {account.user.email ?? `@${account.user.login}`}
              </div>
            </div>
          </div>

          <div className="border-t border-border-default" />

          <button
            type="button"
            role="menuitem"
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-canvas-subtle"
          >
            {theme === 'dark' ? <OcticonSun /> : <OcticonMoon />}
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </button>

          <div className="border-t border-border-default" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              logout()
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-danger-fg hover:bg-danger-fg/10"
          >
            <OcticonSignOut />
            Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? (account.user.name ?? account.user.login) : undefined}
        className={`w-full flex items-center gap-2 rounded-md p-2 hover:bg-canvas-subtle ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <img src={account.user.avatarUrl} alt="" className="w-7 h-7 rounded-full shrink-0" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-medium truncate">
                {account.user.name ?? account.user.login}
              </span>
              <span className="block text-xs text-fg-muted truncate">@{account.user.login}</span>
            </span>
            <OcticonChevronUpDown className="text-fg-muted shrink-0" />
          </>
        )}
      </button>
    </div>
  )
}
