/** E-commerce style "into the cart": a small dot flies from the tapped button to the cart in the menu, which then bumps.
 *  The cart is any visible element marked data-cart (the menu item on phones and on the left rail). Skipped for reduced motion. */
export function flyToCart(from: HTMLElement) {
  const target = [...document.querySelectorAll<HTMLElement>('[data-cart]')].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  if (!target) return
  const bump = () => { target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump') }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('animate' in HTMLElement.prototype)) { bump(); return }
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect()
  const dot = document.createElement('div')
  dot.className = 'flydot'
  dot.style.left = `${a.left + a.width / 2 - 14}px`; dot.style.top = `${a.top + a.height / 2 - 14}px`
  document.body.appendChild(dot)
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2)
  const anim = dot.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.9)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: 0.6 },
  ], { duration: 650, easing: 'cubic-bezier(.45,0,.25,1)' })
  anim.onfinish = () => { dot.remove(); bump() }
}
