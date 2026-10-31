export type CapyAct = 'hello' | 'wave' | 'happy' | 'think' | 'dragged' | 'drop' | 'sleepy' | 'tap' | 'cheer'

/** Capy, the mascot, as live SVG (drawn in Claude Design): it breathes, blinks, twitches its ears and the orange on its head sways.
 *  `act` plays one of the actions in app.css (`.cfx.act-…`); with no `act` it just idles. Everything stops when the phone asks for less motion. */
export function CapyFigure({ act, className }: { act?: CapyAct; className?: string }) {
  const cls = ['cfx', act && `act-${act}`, className].filter(Boolean).join(' ')
  return (
    <svg className={cls} viewBox="0 0 100 100" aria-hidden="true">
      <ellipse className="cf-shadow" cx="50" cy="93.5" rx="31" ry="3.2" fill="#2A1D14" opacity=".12" />
      <g className="cf-root">
      <g className="cf-breath"><path d="M23 44C22 60 20 76 22 84Q23 90 31 90H69Q77 90 78 84C80 76 78 60 77 44Z" fill="#C49A6C" /><path d="M23 44C22 60 20 76 22 84Q23 90 31 90H69Q77 90 78 84C80 76 78 60 77 44" fill="none" stroke="#2A1D14" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" />
      <g className="cf-head">
      <g className="cf-ear-l"><circle cx="29.2" cy="20.4" r="3.7" fill="#C49A6C" stroke="#2A1D14" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" /><circle cx="28.5" cy="19.6" r="1.6" fill="#A87850" />
      </g>
      <g className="cf-ear-r"><circle cx="70.8" cy="20.4" r="3.7" fill="#C49A6C" stroke="#2A1D14" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" /><circle cx="71.5" cy="19.6" r="1.6" fill="#A87850" />
      </g><path d="M23 44C22 22 32 14 50 14C68 14 78 22 77 44L77.5 62H22.5Z" fill="#C49A6C" /><path d="M22.6 62L23 44C22 22 32 14 50 14C68 14 78 22 77 44L77.4 62" fill="none" stroke="#2A1D14" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" /><path d="M19.6 42.4H24.2M19.8 46H24.4M75.8 42.4H80.4M75.6 46H80.2" fill="none" stroke="#2A1D14" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <g className="cf-orange"><circle cx="50" cy="9.6" r="5" fill="#F4A023" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" /><path d="M50 4.6Q50.3 3 51.2 2.2" fill="none" stroke="#2A1D14" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /><path d="M51.2 3.6Q54.8 1 58 3Q54.8 6.2 51.2 3.6Z" fill="#5E9A3C" stroke="#2A1D14" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <g className="fx-blush">
      <ellipse cx="32" cy="40.5" rx="3.4" ry="2.1" fill="#EE9A86" />
      <ellipse cx="68" cy="40.5" rx="3.4" ry="2.1" fill="#EE9A86" />
      </g><rect x="41" y="30.5" width="18" height="22" rx="5.5" fill="#A87850" /><path d="M45.6 37H54.4" fill="none" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      <g><path className="e-line" d="M32.8 33.5H39.2" fill="none" stroke="#2A1D14" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /><path className="e-happy" d="M32.6 35.1Q36 30.5 39.4 35.1" fill="none" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" /><circle className="e-dot" cx="36" cy="33.5" r="2.3" fill="#2A1D14" /><path className="e-closed" d="M32.6 32.7Q36 36.1 39.4 32.7" fill="none" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <g><path className="e-line" d="M60.8 33.5H67.2" fill="none" stroke="#2A1D14" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /><path className="e-happy" d="M60.6 35.1Q64 30.5 67.4 35.1" fill="none" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" /><circle className="e-dot" cx="64" cy="33.5" r="2.3" fill="#2A1D14" /><path className="e-closed" d="M60.6 32.7Q64 36.1 67.4 32.7" fill="none" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      </g><path className="m-t" d="M50 37V46.6M50 46.6L46.8 50.2M50 46.6L53.2 50.2" fill="none" stroke="#2A1D14" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      <g className="m-open"><path d="M50 37V44" fill="none" stroke="#2A1D14" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" /><path d="M46.4 45.4Q50 44.2 53.6 45.4Q53.4 50.6 50 50.6Q46.6 50.6 46.4 45.4Z" fill="#7A2E22" stroke="#2A1D14" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /><path d="M47.6 49.2Q50 47.8 52.4 49.2Q51.4 50.4 50 50.4Q48.6 50.4 47.6 49.2Z" fill="#E77F7A" />
      </g>
      </g><path d="M58 65L61 77Q64.5 78.6 67.5 76L65.5 63.5Z" fill="#B35A24" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" /><path d="M22.6 56Q50 66 77.4 56L78 63Q50 73 22 63Z" fill="#B35A24" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      <g className="cf-arm-l"><rect x="21" y="59.5" width="8" height="15" rx="4" transform="rotate(18 25 62)" fill="#C49A6C" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <g className="cf-arm-r"><rect x="71" y="59.5" width="8" height="15" rx="4" transform="rotate(-18 75 62)" fill="#C49A6C" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      </g>
      <g className="cf-foot-l">
      <ellipse cx="37" cy="89.6" rx="8" ry="3.8" fill="#C49A6C" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <g className="cf-foot-r">
      <ellipse cx="63" cy="89.6" rx="8" ry="3.8" fill="#C49A6C" stroke="#2A1D14" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <path className="fx-sweat fx" d="M83 20Q87 26.5 83 28.8Q79 26.5 83 20Z" fill="#9FD3EE" stroke="#2A1D14" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path className="fx" d="M79.5 9.5Q82 12 79.5 14.5M86.5 9.5Q84 12 86.5 14.5M79.5 17.5Q82 15 84.5 17.5M79.5 6.5Q82 9 84.5 6.5" fill="none" stroke="#D9453A" strokeWidth="2.4" strokeLinecap="round" />
      <g className="fx-sparkle fx" fill="none" stroke="#F4A023" strokeWidth="2.6" strokeLinecap="round"><path d="M10 26L14 29M8 34H13M88 22L84 26M92 31H87M11 58L15 56M89 58L85 56" />
      </g>
      <g className="fx-z fx" fill="none" stroke="#2A1D14" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"><path d="M80 15h5l-5 5.75h5" /><path d="M87 5h7l-7 8.05h7" />
      </g>
      <g className="fx-dots fx" fill="#fff" stroke="#2A1D14" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><circle cx="83" cy="24" r="1.6" /><circle cx="88" cy="17" r="2.2" /><circle cx="93.5" cy="9.5" r="2.8" />
      </g>
      <g className="fx-stars fx"><path d="M22 5.4Q22 9 25.6 9Q22 9 22 12.6Q22 9 18.4 9Q22 9 22 5.4Z" fill="#F4A023" stroke="#2A1D14" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" /><path d="M78 4.4Q78 8 81.6 8Q78 8 78 11.6Q78 8 74.4 8Q78 8 78 4.4Z" fill="#F4A023" stroke="#2A1D14" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" /><path d="M88 23.2Q88 26 90.8 26Q88 26 88 28.8Q88 26 85.2 26Q88 26 88 23.2Z" fill="#FFE3A3" stroke="#2A1D14" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" /><path d="M12 23.2Q12 26 14.8 26Q12 26 12 28.8Q12 26 9.2 26Q12 26 12 23.2Z" fill="#FFE3A3" stroke="#2A1D14" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      </g>
    </svg>
  )
}
