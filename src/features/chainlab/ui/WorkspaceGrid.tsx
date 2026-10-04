'use client';

import type { ReactNode } from 'react';
import { EASE } from '../constants';

/**
 * Three-column workspace shared by ChainLab and the Writing Desk.
 * Left rail (432px) slides away when feedback opens; feedback panel (406px) slides in on the right.
 * While feedback is open, the rail can come back as an overlay drawer ("Đề bài").
 */
export function WorkspaceGrid({ rail, railOpen, reviewOpen, main, panel, overlay }: { rail: ReactNode; railOpen: boolean; reviewOpen: boolean; main: ReactNode; panel: ReactNode; overlay?: ReactNode }) {
  const showRail = railOpen && !reviewOpen;
  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: (showRail ? '432px' : '0px') + ' minmax(0,1fr) ' + (reviewOpen ? '406px' : '0px'), transition: 'grid-template-columns .5s ' + EASE }}>
      <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 432, flexShrink: 0, height: '100%', paddingRight: 26, display: 'flex', flexDirection: 'column', opacity: showRail ? 1 : 0, transform: showRail ? 'none' : 'translateX(-24px)', transition: 'opacity .35s, transform .5s ' + EASE }}>{!reviewOpen && rail}</div>
      </div>
      {reviewOpen && (
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 20, width: 406, maxWidth: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column', borderRadius: 18, boxShadow: railOpen ? '0 18px 48px rgba(20,20,19,.16)' : 'none', opacity: railOpen ? 1 : 0, transform: railOpen ? 'none' : 'translateX(-24px)', pointerEvents: railOpen ? 'auto' : 'none', transition: 'opacity .3s, transform .45s ' + EASE + ', box-shadow .3s' }}>{rail}</div>
      )}
      {main}
      <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ width: 406, height: '100%', paddingLeft: 26, opacity: reviewOpen ? 1 : 0, transform: reviewOpen ? 'none' : 'translateX(24px)', transition: 'opacity .35s, transform .5s ' + EASE }}>
          {reviewOpen && panel}
        </div>
      </div>
      {overlay}
    </div>
  );
}
