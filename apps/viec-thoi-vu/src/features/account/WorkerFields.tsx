import { useState } from 'react'
import { api } from '../../lib/api'
import { tap } from '../../lib/haptics'
import { useI18n, type TKey } from '../../lib/i18n'
import { AppError, AVAILABILITY, EXPERIENCE, type Availability, type Experience, type WorkerInfo } from '../../lib/types'
import { ageOf, avatarUrl, birthYears, squarePhoto } from '../../lib/worker'
import { Ic } from '../../components/Ic'
import { Avatar, Chip, ErrorBox, Fld } from '../../components/ui'

/** Photo, birth year, past work and free time — all taps, no typing. Used by the intro dialog and Account. */
export function WorkerFields({ name, value, onChange }: { name: string; value: WorkerInfo; onChange(v: WorkerInfo): void }) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const pickPhoto = async (file?: File) => {
    if (!file) return
    setBusy(true); setError(null)
    try {
      onChange({ ...value, avatar_path: await api.uploadAvatar(await squarePhoto(file)) })
    } catch (e) {
      // a file the browser can't read as an image gets the friendly photo message, not "something went wrong"
      setError(e instanceof AppError ? e : new AppError('PHOTO_FAILED', String(e)))
    } finally { setBusy(false) }
  }
  const toggleExp = (k: Experience) => {
    tap()
    const on = value.experience.includes(k)
    // "never worked yet" excludes everything else (same rule as the database)
    const next = on ? value.experience.filter((x) => x !== k) : k === 'none' ? ['none' as const] : [...value.experience.filter((x) => x !== 'none'), k]
    onChange({ ...value, experience: next })
  }
  const toggleAvail = (k: Availability) => {
    tap()
    const on = value.availability.includes(k)
    onChange({ ...value, availability: on ? value.availability.filter((x) => x !== k) : [...value.availability, k] })
  }

  return (
    <>
      <div className="photopick">
        <Avatar name={name} src={avatarUrl(value.avatar_path)} size={64} />
        <div>
          <label className="btn btn-ghost sm">
            <Ic n="camera" size={16} /> {busy ? '…' : t(value.avatar_path ? 'photoChange' : 'photoAdd')}
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => void pickPhoto(e.target.files?.[0])} />
          </label>
          <div className="small muted" style={{ marginTop: 4 }}>{t('photoHint')}</div>
        </div>
      </div>
      {error != null && <ErrorBox error={error} where="WorkerFields.photo" />}
      <Fld label={t('birthYear')} htmlFor="w-year">
        <select id="w-year" className="inp" value={value.birth_year ?? ''} onChange={(e) => onChange({ ...value, birth_year: e.target.value ? Number(e.target.value) : null })}>
          <option value="">{t('birthYearPick')}</option>
          {birthYears().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </Fld>
      <Fld label={t('expLabel')}>
        <div className="chiprow wrap">{EXPERIENCE.map((k) => <Chip key={k} on={value.experience.includes(k)} onClick={() => toggleExp(k)}>{t(`exp_${k}` as TKey)}</Chip>)}</div>
      </Fld>
      <Fld label={t('availLabel')} hint={t('availHint')}>
        <div className="chiprow wrap">{AVAILABILITY.map((k) => <Chip key={k} on={value.availability.includes(k)} onClick={() => toggleAvail(k)}>{t(`avail_${k}` as TKey)}</Chip>)}</div>
      </Fld>
    </>
  )
}

/** One line of facts for a business: age, past work, free time. */
export function WorkerFacts({ w }: { w: WorkerInfo }) {
  const { t } = useI18n()
  const age = ageOf(w.birth_year)
  if (!age && !w.experience.length && !w.availability.length) return null
  return (
    <div className="wfacts">
      {age && <span className="tag">{t('ageYears', { n: age })}</span>}
      {w.experience.map((k) => <span key={k} className="tag">{t(`exp_${k}` as TKey)}</span>)}
      {w.availability.length > 0 && <span className="muted"><Ic n="calendar" size={13} /> {w.availability.map((k) => t(`avail_${k}` as TKey)).join(' · ')}</span>}
    </div>
  )
}

export const workerInfoOf = (w: WorkerInfo): WorkerInfo => ({ birth_year: w.birth_year, experience: w.experience, availability: w.availability, avatar_path: w.avatar_path })
