import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

export function Topbar({ title, back, right }: { title: string; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate()
  const { t } = useI18n()
  return (
    <header className="topbar">
      <div className="row grow">
        {back && (
          <button className="back" aria-label={t('back')} onClick={() => (typeof back === 'string' ? nav(back) : history.length > 1 ? nav(-1) : nav('/app'))}>←</button>
        )}
        <h1 className="grow">{title}</h1>
      </div>
      {right}
    </header>
  )
}
