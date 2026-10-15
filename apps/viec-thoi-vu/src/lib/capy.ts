export type CapyPose = 'wave' | 'cheer' | 'search' | 'urgent' | 'empty' | 'error' | 'bath' | 'paper' | 'face'
// BASE_URL is '/' on the web and '' inside the Zalo Mini App package (relative assets).
const BASE = import.meta.env.BASE_URL
export const capy = (pose: CapyPose) => `${BASE}capy/capy-${pose}.png`
export const LOGO = `${BASE}capy/logo-96.png`
