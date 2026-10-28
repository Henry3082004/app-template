#!/usr/bin/env bash
# Runs every database scenario on a throw-away local Postgres database (never the real one).
# Needs a local Postgres 15+; point PSQL at it, e.g.  PSQL="psql -h /var/tmp/vtvpg -p 5544 -U postgres" ./run.sh
set -euo pipefail
cd "$(dirname "$0")"
PSQL="${PSQL:-psql}"
DB="${DB:-vtv_test}"
$PSQL -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
# roles are cluster-wide: clear leftovers from earlier runs in every database, then drop them
if [ -n "$($PSQL -At -d postgres -c "select 1 from pg_roles where rolname = 'anon'")" ]; then
  for d in $($PSQL -At -d postgres -c "select datname from pg_database where datallowconn and not datistemplate"); do
    $PSQL -q -d "$d" -c "drop owned by anon, authenticated cascade" >/dev/null
  done
  $PSQL -q -d postgres -c "drop role anon" -c "drop role authenticated"
fi
run() {
  echo "== $1"
  if ! out=$($PSQL -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1" 2>&1); then echo "$out" | grep -E "ERROR|FAIL" | head -5; exit 1; fi
  echo "$out" | grep -E "PASSED" || true
}
for f in 00_local_base_schema.sql ../migrations/20261016_escrow_reputation.sql ../migrations/20261017_admin_payouts.sql \
  ../migrations/20261018_reputation_integrity.sql 10_scenarios.sql 20_integrity.sql ../migrations/20261018_free_mode.sql 30_free_mode.sql \
  ../migrations/20261019_multi_login.sql ../migrations/20261020_admin_email_zalo_published.sql 40_multi_login.sql \
  ../migrations/20261021_perf_admin_stats.sql 50_perf_admin_stats.sql ../migrations/20261022_seeker_profile.sql 60_seeker_profile.sql ../migrations/20261023_dual_role.sql ../migrations/20261024_worker_upsert_grant.sql 70_dual_role.sql \
  ../migrations/20261027_quick_quiz.sql 80_quiz.sql ../migrations/20261028_cash_paid.sql 90_cash_paid.sql ../migrations/20261029_collab_notify_checkin.sql 100_collab.sql ../migrations/20261030_collab_chat_reports.sql 110_collab2.sql ../migrations/20261031_reminders.sql 120_reminders.sql ../migrations/20261101_find_workers.sql 130_find_workers.sql ../migrations/20261102_contacts_lockdown.sql 140_contacts_lockdown.sql; do run "$f"; done
