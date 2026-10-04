'use client';

import { useState, type DragEvent } from 'react';

export interface ReorderBinding {
  isDragging: boolean;
  isOver: boolean;
  handleProps: { onMouseDown: () => void; onMouseUp: () => void };
  itemProps: {
    draggable: boolean;
    onDragStart: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDragEnd: () => void;
    onDrop: (e: DragEvent) => void;
  };
}

/** Drag-to-reorder for a list; dragging only starts from the item's grip handle. */
export function useReorder<T extends { id: string }>(items: T[], setItems: (items: T[]) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  return (id: string): ReorderBinding => ({
    isDragging: dragId === id,
    isOver: overId === id && dragId !== id,
    handleProps: { onMouseDown: () => setArmed(id), onMouseUp: () => setArmed(null) },
    itemProps: {
      draggable: armed === id,
      onDragStart: (e) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; },
      onDragOver: (e) => {
        e.preventDefault();
        if (!dragId || dragId === id) return;
        setOverId(id);
        const from = items.findIndex((c) => c.id === dragId), to = items.findIndex((c) => c.id === id);
        if (from < 0 || to < 0 || from === to) return;
        const n = [...items]; const [m] = n.splice(from, 1); n.splice(to, 0, m); setItems(n);
      },
      onDragEnd: () => { setDragId(null); setArmed(null); setOverId(null); },
      onDrop: (e) => e.preventDefault(),
    },
  });
}
