import type { Api } from './types'
import { adminApi } from './supabase/adminApi'
import { authApi } from './supabase/authApi'
import { capyApi } from './supabase/capyApi'
import { collabApi } from './supabase/collabApi'
import { jobsApi } from './supabase/jobsApi'
import { payApi } from './supabase/payApi'
import { trustApi } from './supabase/trustApi'
import { hireToolsApi } from './supabase/hireToolsApi'
import { feesApi } from './supabase/feesApi'
import { consentApi } from './supabase/consentApi'
import { adminModeApi } from './supabase/adminModeApi'

/** The real backend (Supabase), one file per area under ./supabase: sign-in & profile, jobs & applications, collaboration
 *  (notifications, attendance, chat, reports, invites, finding workers), pay & reviews, admin. Helpers live in ./supabase/core. */
export const supabaseApi: Api = { ...authApi, ...capyApi, ...jobsApi, ...collabApi, ...payApi, ...trustApi, ...hireToolsApi, ...feesApi, ...consentApi, ...adminModeApi, ...adminApi }
