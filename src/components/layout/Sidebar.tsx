import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  OcticonChevronDown,
  OcticonHome,
  OcticonIssueOpened,
  OcticonNote,
  OcticonOrganization,
  OcticonRepo,
  OcticonRocket,
  OcticonSearch,
} from '../icons/Octicons'
import AccountMenu from './AccountMenu'

const NAV_ITEMS = [
  { to: '/', end: true, label: 'Home', icon: OcticonHome },
  { to: '/repos', end: false, label: 'Repos', icon: OcticonRepo },
  { to: '/discovery', end: false, label: 'Discovery', icon: OcticonSearch },
  { to: '/organizations', end: false, label: 'Organizations', icon: OcticonOrganization },
  { to: '/deployments', end: false, label: 'Deployments', icon: OcticonRocket },
  { to: '/notes', end: false, label: 'Notes', icon: OcticonNote },
  { to: '/issues', end: false, label: 'Issues', icon: OcticonIssueOpened },
]

const navLinkClass = (collapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${collapsed ? 'justify-center' : ''} ${
      isActive ? 'bg-accent-fg/10 text-accent-fg font-semibold' : 'text-fg-muted hover:text-fg-default hover:bg-canvas-subtle'
    }`

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="sticky top-0 h-screen border-r border-border-default bg-canvas flex flex-col transition-[width] overflow-hidden"
      style={{ flex: `0 0 ${collapsed ? '4rem' : '15rem'}`, width: collapsed ? '4rem' : '15rem' }}
    >
      <div className={`h-14 flex items-center border-b border-border-default ${collapsed ? 'justify-center px-2' : 'gap-2 px-4'}`}>
        <img
          src="https://octodex.github.com/images/original.png"
          alt="GitHub Stars Manager"
          className="w-8 h-8 rounded-full shrink-0 object-cover"
        />
        {!collapsed && <span className="font-semibold truncate">GitHub Stars Manager</span>}
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={navLinkClass(collapsed)}
          >
            <item.icon />
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-border-default space-y-1">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-fg-muted hover:text-fg-default hover:bg-canvas-subtle ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <OcticonChevronDown className={collapsed ? '-rotate-90' : 'rotate-90'} />
          {!collapsed && 'Collapse'}
        </button>
        <AccountMenu collapsed={collapsed} />
      </div>
    </aside>
  )
}
