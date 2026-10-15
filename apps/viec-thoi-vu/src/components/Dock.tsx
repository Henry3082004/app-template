import type { ReactNode } from 'react'

/** Primary action pinned within thumb reach, above the bottom nav. */
export function Dock({ children, noNav }: { children: ReactNode; noNav?: boolean }) {
  return (
    <div className={noNav ? 'dock no-nav' : 'dock'}>
      <div className="dock-inner">{children}</div>
    </div>
  )
}
