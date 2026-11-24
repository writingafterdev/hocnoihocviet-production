'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Press-and-move dragging with pointer events: past a few pixels the item lifts and follows the cursor (the caller draws
 * the floating copy at `drag.x - drag.offX`, `drag.y - drag.offY`), `onMove` lets the page make room as it goes, and
 * `onDrop` places it. A click that ends a drag is swallowed, so buttons inside a dragged item don't fire.
 */
export function usePointerDrag<P>(opts: { onMove?: (p: P, x: number, y: number) => void; onDrop: (p: P, x: number, y: number) => void; onEnd?: () => void }) {
  const press = useRef<{ p: P; sx: number; sy: number; offX: number; offY: number; w: number; h: number; on: boolean } | null>(null);
  const [drag, setDrag] = useState<{ p: P; x: number; y: number; offX: number; offY: number; w: number; h: number } | null>(null);
  const justDragged = useRef(false);
  const optsRef = useRef(opts); optsRef.current = opts;
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = press.current; if (!d) return;
      if (!d.on) { if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return; d.on = true; document.body.style.cursor = 'grabbing'; document.body.style.userSelect = 'none'; }
      e.preventDefault();
      optsRef.current.onMove?.(d.p, e.clientX, e.clientY);
      setDrag({ p: d.p, x: e.clientX, y: e.clientY, offX: d.offX, offY: d.offY, w: d.w, h: d.h });
    };
    const up = (e: PointerEvent) => {
      const d = press.current; press.current = null; if (!d || !d.on) return;
      document.body.style.cursor = ''; document.body.style.userSelect = '';
      justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 0);
      setDrag(null);
      if (e.type === 'pointerup') optsRef.current.onDrop(d.p, e.clientX, e.clientY);
      optsRef.current.onEnd?.();
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, []);
  const start = (e: React.PointerEvent, p: P) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    press.current = { p, sx: e.clientX, sy: e.clientY, offX: e.clientX - r.left, offY: e.clientY - r.top, w: r.width, h: r.height, on: false };
  };
  const swallowClick = (e: React.MouseEvent) => { if (justDragged.current) { e.stopPropagation(); e.preventDefault(); } };
  return { drag, start, swallowClick };
}

/** Where an element sits inside `root` (which must be positioned), ignoring transforms, so it can be measured mid-slide. */
function posIn(el: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0, n: HTMLElement | null = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
  return { x, y };
}

/** Elements marked `data-flip="<key>"` inside `root` slide from their old place to the new one whenever `active` is on. */
export function useFlip(root: React.RefObject<HTMLElement | null>, active: boolean) {
  const last = useRef(new Map<string, { x: number; y: number }>());
  useLayoutEffect(() => {
    const box = root.current; if (!box) return;
    const next = new Map<string, { x: number; y: number }>();
    box.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
      const k = el.dataset.flip!, p = posIn(el, box), was = last.current.get(k); next.set(k, p);
      if (active && was && (was.x !== p.x || was.y !== p.y)) el.animate([{ transform: `translate(${was.x - p.x}px, ${was.y - p.y}px)` }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
    last.current = next;
  });
}
