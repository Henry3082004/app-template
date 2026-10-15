import type { ReactNode } from 'react'

export function SuccessScreen({ title, text, children }: { title: string; text?: ReactNode; children: ReactNode }) {
  return (
    <div className="success" role="status">
      <div className="tick">✓</div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      <div className="actions">{children}</div>
    </div>
  )
}
