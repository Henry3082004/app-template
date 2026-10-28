import { useState } from 'react'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useSession } from '../../lib/session'
import { AppError } from '../../lib/types'
import { avatarUrl, squarePhoto } from '../../lib/worker'
import { Ic } from '../../components/Ic'
import { Avatar, ErrorBox } from '../../components/ui'

/** A business's logo or shop photo: one tap to pick, saved at once, shown on its job cards. */
export function LogoPicker({ name, path }: { name: string; path: string | null | undefined }) {
  const { t } = useI18n()
  const { updateProfile } = useSession()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true); setError(null)
    try {
      await updateProfile({ logo_path: await api.uploadAvatar(await squarePhoto(file)) })
    } catch (e) {
      setError(e instanceof AppError ? e : new AppError('PHOTO_FAILED', String(e)))
    } finally { setBusy(false) }
  }
  return (
    <>
      <div className="photopick">
        <Avatar square name={name} src={avatarUrl(path)} size={64} />
        <div>
          <label className="btn btn-ghost sm">
            <Ic n="camera" size={16} /> {busy ? '…' : t(path ? 'logoChange' : 'logoAdd')}
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} />
          </label>
          <div className="small muted" style={{ marginTop: 4 }}>{t('logoHint')}</div>
        </div>
      </div>
      {error != null && <ErrorBox error={error} where="LogoPicker" />}
    </>
  )
}
