export type CapyAct = 'hello' | 'wave' | 'happy' | 'think' | 'dragged' | 'drop' | 'sleepy' | 'tap' | 'cheer'

/** Capy, the mascot, as live SVG (drawn in Claude Design): it breathes, blinks, twitches its ears and the orange on its head sways.
 *  `act` plays one of the actions in app.css (`.cfx.act-…`); everything stops when the phone asks for less motion. */
export function CapyFigure({ act, className }: { act?: CapyAct; className?: string }) {
  const cls = ['cfx', act && `act-${act}`, className].filter(Boolean).join(' ')
  return (
    <svg className={cls} viewBox="0 0 100 100" fill="none" stroke="#2A1D14"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse className="cf-shadow" cx="50" cy="95" rx="28" ry="3" fill="#2A1D14" fillOpacity=".14" stroke="none" />
      <g className="cf-root">
      <g className="cf-foot-l"><ellipse cx="35" cy="88" rx="9" ry="5.5" fill="#C49A6C" /></g>
      <g className="cf-foot-r"><ellipse cx="65" cy="88" rx="9" ry="5.5" fill="#C49A6C" /></g>
      <g className="cf-breath">
      <g><path d="M50 20C71 20 83 35 83 56C83 77 74 88 50 88C26 88 17 77 17 56C17 35 29 20 50 20Z" fill="#C49A6C" /></g>
      <g><path d="M55 70L65 69L63.5 82L58.5 78.5L54 82Z" fill="#B35A24" /><path d="M17.4 60Q50 67.5 82.6 60L82.4 67.5Q50 75.5 17.6 67.5Z" fill="#B35A24" /></g>
      <g className="cf-arm-l"><g transform="translate(19 58) rotate(12)"><rect x="-4.2" y="-2" width="8.4" height="19" rx="4.2" fill="#C49A6C" /></g></g>
      <g className="cf-arm-r"><g transform="translate(81 58) rotate(-12)"><rect x="-4.2" y="-2" width="8.4" height="19" rx="4.2" fill="#C49A6C" /></g></g>
      <g className="cf-head">
      <g className="cf-ear-l"><path d="M21.5 36C19 28.5 26 22.5 34 24.5Z" fill="#C49A6C" stroke="none" /><path d="M21.5 36C19 28.5 26 22.5 34 24.5" /><circle cx="27.5" cy="29" r="2.3" fill="#A87850" stroke="none" /></g>
      <g className="cf-ear-r"><path d="M78.5 36C81 28.5 74 22.5 66 24.5Z" fill="#C49A6C" stroke="none" /><path d="M78.5 36C81 28.5 74 22.5 66 24.5" /><circle cx="72.5" cy="29" r="2.3" fill="#A87850" stroke="none" /></g>
      <rect x="42" y="37" width="16" height="21" rx="7" fill="#A87850" stroke="none" />
      <g className="cf-eye-l"><path className="e-line" d="M32 42H38.5" /><path className="e-happy" d="M32 44Q35.25 38.5 38.5 44" /><circle className="e-dot" cx="35.25" cy="42" r="3.4" fill="#2A1D14" stroke="none" /><path className="e-closed" d="M32 41.5Q35.25 45 38.5 41.5" /></g>
      <g className="cf-eye-r"><path className="e-line" d="M61.5 42H68" /><path className="e-happy" d="M61.5 44Q64.75 38.5 68 44" /><circle className="e-dot" cx="64.75" cy="42" r="3.4" fill="#2A1D14" stroke="none" /><path className="e-closed" d="M61.5 41.5Q64.75 45 68 41.5" /></g>
      <g><path className="m-t" d="M45.5 45H54.5M50 45V53M50 53L47 56M50 53L53 56" strokeWidth="2.8" /><g className="m-open"><path d="M45.5 45H54.5M50 45V49" strokeWidth="2.8" /><ellipse cx="50" cy="53.5" rx="3.6" ry="3.2" fill="#6B2F25" strokeWidth="2.2" /></g></g>
      <path d="M22 49.5H27.5M23 54H28.5M78 49.5H72.5M77 54H71.5" strokeWidth="2.2" />
      <g className="fx fx-blush" fill="#E8907C" stroke="none"><circle cx="31" cy="50" r="3.5" /><circle cx="69" cy="50" r="3.5" /></g>
      <g className="cf-orange"><circle cx="50" cy="15.5" r="6" fill="#F4A023" /><path d="M50 9.8C49 6 52 4 56 4.8C56 8 53.5 10 50 9.8Z" fill="#5E9E52" /></g>
      </g>
      </g>
      <g className="fx fx-sweat"><path d="M88 24C88 24 84.5 29 84.5 31.5A3.5 3.5 0 0 0 91.5 31.5C91.5 29 88 24 88 24Z" fill="#8FD0EE" strokeWidth="2.2" /></g>
      <g className="fx fx-anger" transform="translate(11 24)" stroke="#C0392B" strokeWidth="2.4"><path d="M-2.5-5Q-1-2-5-1.5M2.5-5Q1-2 5-1.5M-2.5 5Q-1 2-5 1.5M2.5 5Q1 2 5 1.5" /></g>
      <g className="fx fx-sparkle" stroke="#F2C14E" strokeWidth="2.6"><path d="M10 13l3 4M27 5l1.5 4.5M73 5l-1.5 4.5M90 13l-3 4" /></g>
      <g className="fx fx-z" strokeWidth="2"><g transform="translate(72 14)"><path className="z" d="M0 0H5.5L0 6.5H5.5" /></g><g transform="translate(80 7) scale(0.8)"><path className="z z2" d="M0 0H5.5L0 6.5H5.5" /></g><g transform="translate(87 1) scale(0.65)"><path className="z z3" d="M0 0H5.5L0 6.5H5.5" /></g></g>
      <g className="fx fx-dots" fill="#2A1D14" stroke="none"><circle className="dot" cx="76" cy="9" r="2.4" /><circle className="dot d2" cx="83" cy="9" r="2.4" /><circle className="dot d3" cx="90" cy="9" r="2.4" /></g>
      <g className="fx fx-stars" fill="#F2C14E" strokeWidth="1.6"><g className="st s1"><path transform="translate(8 30)" d="M0-5Q1-1 5 0Q1 1 0 5Q-1 1-5 0Q-1-1 0-5Z" /></g><g className="st s2"><path transform="translate(92 30)" d="M0-5Q1-1 5 0Q1 1 0 5Q-1 1-5 0Q-1-1 0-5Z" /></g><g className="st s3"><path transform="translate(24 8) scale(0.8)" d="M0-5Q1-1 5 0Q1 1 0 5Q-1 1-5 0Q-1-1 0-5Z" /></g><g className="st s4"><path transform="translate(76 7) scale(0.9)" d="M0-5Q1-1 5 0Q1 1 0 5Q-1 1-5 0Q-1-1 0-5Z" /></g><g className="st s5"><path transform="translate(6 60) scale(0.7)" d="M0-5Q1-1 5 0Q1 1 0 5Q-1 1-5 0Q-1-1 0-5Z" /></g><g className="st s6"><path transform="translate(94 60) scale(0.7)" d="M0-5Q1-1 5 0Q1 1 0 5Q-1 1-5 0Q-1-1 0-5Z" /></g></g>
      </g>
    </svg>
  )
}
