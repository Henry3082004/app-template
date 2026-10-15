export type CapyPose = 'wave' | 'cheer' | 'search' | 'urgent' | 'empty' | 'error' | 'bath' | 'paper' | 'face'
export const capy = (pose: CapyPose) => `/capy/capy-${pose}.png`
export const LOGO = '/capy/logo-96.png'
