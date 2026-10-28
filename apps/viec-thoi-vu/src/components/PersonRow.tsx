import type { ReactNode } from 'react'
import { avatarUrl } from '../lib/worker'
import { Avatar } from './ui'

/** Photo + name (+ an optional tag beside the name and a line underneath): the top of every worker card. */
export function PersonRow({ name, avatar, tag, sub }: { name: string; avatar: string | null; tag?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="row">
      <Avatar name={name} src={avatarUrl(avatar)} size={52} />
      <div style={{ minWidth: 0, flex: 1 }}>
        {tag ? <div className="hrow" style={{ alignItems: 'center' }}><b>{name}</b>{tag}</div> : <b>{name}</b>}
        {sub && <div className="sub" style={{ fontSize: 14 }}>{sub}</div>}
      </div>
    </div>
  )
}
