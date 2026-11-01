import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'
import { useAction } from '../../../lib/useAction'
import { Btn, ErrorBox } from '../../../components/ui'

/** The shop gives up an accepted worker before the shift starts (the database counts it on the shop; the slot reopens). */
export function CancelHire({ appId, name, onDone }: { appId: string; name: string; onDone(): void }) {
  const { t } = useI18n()
  const act = useAction()
  return (
    <>
      <Btn v="text" sm disabled={act.busy === appId} onClick={() => { if (confirm(t('cancelHireAsk', { name }))) void act.run(appId, async () => { await api.cancelHire(appId); onDone() }) }}>
        {t('cancelHireBtn')}
      </Btn>
      {act.error != null && <ErrorBox error={act.error} where="CancelHire" />}
    </>
  )
}
