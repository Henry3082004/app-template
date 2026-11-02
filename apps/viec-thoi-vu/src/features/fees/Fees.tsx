import { useQuery } from '@tanstack/react-query'
import { Tag } from '../../components/ui'
import { api } from '../../lib/api'
import { money } from '../../lib/format'
import { useI18n } from '../../lib/i18n'
import type { FeePlan } from '../../lib/types'

/** The current price list (fee per worker per finished shift and the voucher), shared by the post form and the cost page. */
export const useFeePlan = () => useQuery({ queryKey: ['feePlan'], queryFn: () => api.feePlan(), staleTime: 5 * 60_000 })
const dueOf = (p: FeePlan) => p.fee - Math.floor((p.fee * p.voucher_pct) / 100)

/** One line: "Service fee 12.000đ per worker per finished shift · Launch offer −100% → you pay 0đ". */
export function FeeNote() {
  const { t, locale } = useI18n()
  const { data: p } = useFeePlan()
  if (!p) return null
  if (p.fee <= 0) return <>{t('feeNoneNote')}</>
  return (
    <>
      {t('feeShopNote', { fee: money(p.fee, locale) })}
      {p.voucher_pct > 0 && <> {t('feeVoucherNote', { name: p.voucher_name ?? t('feeVoucher'), pct: p.voucher_pct, due: money(dueOf(p), locale) })}</>}
    </>
  )
}

/** The shop's service fees on the cost page: this month (price, voucher, to pay) and the latest shifts. Nothing is charged yet. */
export function FeeCard() {
  const { t, locale } = useI18n()
  const { data: f } = useQuery({ queryKey: ['myFees'], queryFn: () => api.myFees() })
  const { data: p } = useFeePlan()
  if (!f || !p) return null
  return (
    <section className="card stack">
      <div className="hrow"><b>{t('feeTitle')}</b>{p.voucher_pct > 0 && <Tag tone="ok">{p.voucher_name ?? t('feeVoucher')} −{p.voucher_pct}%</Tag>}</div>
      <div className="small muted"><FeeNote /></div>
      <div className="tiles">
        <div><b>{money(f.month_fee, locale)}</b><span>{t('feeMonthFee')}</span></div>
        <div><b>−{money(f.month_discount, locale)}</b><span>{t('feeMonthDiscount')}</span></div>
        <div><b>{money(f.month_due, locale)}</b><span>{t('feeMonthDue')}</span></div>
      </div>
      {f.rows.length > 0 && (
        <div className="txlist">
          {f.rows.slice(0, 10).map((r) => (
            <div key={r.application_id} className="tx">
              <div><b>{r.worker}</b><span className="muted small">{r.title}{r.voucher ? ` · ${r.voucher}` : ''}</span></div>
              <div className="txr">{r.discount > 0 && <s className="muted small">{money(r.fee, locale)}</s>}<b>{money(r.due, locale)}</b></div>
            </div>
          ))}
        </div>
      )}
      <div className="small muted">{t('feeNotCharged')}</div>
    </section>
  )
}
