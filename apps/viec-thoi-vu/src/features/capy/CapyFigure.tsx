/** Capy drawn in code (not a picture) so its parts can move: the right arm waves, eyes blink, ears twitch, feet swing while dragged,
 *  and the little orange on its head bounces. All motion is CSS (`.cf-*` in app.css) and stops when the phone asks for less motion. */
export function CapyFigure({ className }: { className?: string }) {
  return (
    <svg className={'cf ' + (className ?? '')} viewBox="0 0 100 100" aria-hidden="true">
      <ellipse className="cf-shadow" cx="50" cy="96" rx="26" ry="3.5" />
      <g className="cf-body">
        <g>
          <ellipse className="cf-foot l" cx="38" cy="91" rx="8" ry="5" />
          <ellipse className="cf-foot r" cx="62" cy="91" rx="8" ry="5" />
        </g>
        <ellipse className="cf-fur" cx="50" cy="69" rx="29" ry="24" />
        <ellipse className="cf-belly" cx="50" cy="74" rx="17" ry="14" />
        <rect className="cf-limb" x="20" y="58" width="10" height="20" rx="5" transform="rotate(14 25 60)" />
        <g className="cf-head">
          <ellipse className="cf-ear l" cx="29" cy="24" rx="4.2" ry="3.4" />
          <ellipse className="cf-ear r" cx="71" cy="24" rx="4.2" ry="3.4" />
          <rect className="cf-fur" x="23" y="21" width="54" height="37" rx="17" />
          <g className="cf-orange">
            <circle cx="50" cy="16" r="6" fill="#F5A33A" stroke="#6B4226" strokeWidth="2" />
            <path d="M50 10.5 q4 -5 8 -2 q-4 3 -8 2z" fill="#6DB36D" stroke="#3E6B3E" strokeWidth="1.2" />
          </g>
          <ellipse className="cf-cheek" cx="30" cy="42" rx="4.5" ry="2.8" />
          <ellipse className="cf-cheek" cx="70" cy="42" rx="4.5" ry="2.8" />
          <g className="cf-eye"><ellipse cx="35" cy="33" rx="2.6" ry="3" fill="#2B1A10" /><circle cx="35.9" cy="32" r="1" fill="#fff" /></g>
          <g className="cf-eye"><ellipse cx="65" cy="33" rx="2.6" ry="3" fill="#2B1A10" /><circle cx="65.9" cy="32" r="1" fill="#fff" /></g>
          <rect className="cf-snout" x="35" y="37" width="30" height="18" rx="9" />
          <ellipse cx="44.5" cy="42" rx="2" ry="1.3" fill="#3A2214" />
          <ellipse cx="55.5" cy="42" rx="2" ry="1.3" fill="#3A2214" />
          <path d="M45 48.5 q5 4.5 10 0" fill="none" stroke="#3A2214" strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <g className="cf-arm"><rect className="cf-limb" x="70" y="58" width="10" height="21" rx="5" /></g>
      </g>
    </svg>
  )
}
