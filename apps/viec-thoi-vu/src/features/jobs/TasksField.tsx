import { useState } from 'react'
import { Chip, Fld } from '../../components/ui'
import { useI18n } from '../../lib/i18n'
import { cleanTasks, MAX_TASKS, MAX_TASK_LEN, TASK_IDEAS } from '../../lib/tasks'
import type { Category } from '../../lib/types'

/** "Đầu việc trong ca": the shop lists what the worker will do (tap an idea or type one); shown to everyone who opens the post. */
export function TasksField({ value, onChange, category }: { value: string[]; onChange(v: string[]): void; category: Category }) {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')
  const has = (x: string) => value.some((v) => v.toLowerCase() === x.toLowerCase())
  const toggle = (x: string) => onChange(has(x) ? value.filter((v) => v.toLowerCase() !== x.toLowerCase()) : cleanTasks([...value, x]))
  const add = () => { if (draft.trim()) { onChange(cleanTasks([...value, draft])); setDraft('') } }
  return (
    <Fld label={t('tasksLabel')} hint={t('tasksHint')} htmlFor="p-task">
      <div className="stack">
        {value.length > 0 && (
          <div className="chiprow wrap">
            {value.map((x) => <button key={x} type="button" className="chip on" aria-label={t('tasksRemove', { x })} onClick={() => toggle(x)}>{x} ×</button>)}
          </div>
        )}
        <div className="row" style={{ gap: 8 }}>
          <input id="p-task" className="inp" value={draft} maxLength={MAX_TASK_LEN} placeholder={t('tasksPh')} disabled={value.length >= MAX_TASKS}
            onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
          <button type="button" className="btn btn-ghost sm" onClick={add} disabled={!draft.trim() || value.length >= MAX_TASKS}>{t('tasksAdd')}</button>
        </div>
        <div className="chiprow wrap" aria-label={t('tasksIdeas')}>
          {TASK_IDEAS[category].filter((x) => !has(x)).map((x) => <Chip key={x} onClick={() => toggle(x)} disabled={value.length >= MAX_TASKS}>+ {x}</Chip>)}
        </div>
      </div>
    </Fld>
  )
}
