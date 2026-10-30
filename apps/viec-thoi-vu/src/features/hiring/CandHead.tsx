import type { ReactNode } from 'react'
import { Ic } from '../../components/Ic'
import { Avatar } from '../../components/ui'
import { useI18n } from '../../lib/i18n'
import { avatarUrl } from '../../lib/worker'
import type { Reputation } from '../../lib/types'
import { Rep } from '../shifts/escrow'

/** Top of a candidate card for the shop: a big photo with its star rating pinned underneath, the name, and the reputation line. */
export function CandHead({ name, avatar, rep, sub, tag }: { name: string; avatar: string | null; rep?: Reputation; sub?: ReactNode; tag?: ReactNode }) {
  const { t } = useI18n()
  const rated = !!rep && rep.ratings > 0 && rep.avg_stars != null
  return (
    <div className="chead">
      <div className="chav">
        <Avatar name={name} src={avatarUrl(avatar)} size={84} />
        <span className={'chbadge' + (rated ? '' : ' new')}>{rated ? <><Ic n="star" size={13} /> {rep!.avg_stars!.toFixed(1)}</> : t('repNewWorker')}</span>
      </div>
      <div className="chtxt">
        <div className="hrow" style={{ alignItems: 'center' }}><b className="chname">{name}</b>{tag}</div>
        {sub && <div className="sub">{sub}</div>}
        <Rep rep={rep} size="sm" />
      </div>
    </div>
  )
}
