import { useState, useCallback, useEffect, useRef } from 'react';

export default function useDraggable(initialPos = { x: 400, y: 100 }) {
  const [pos, setPos] = useState(initialPos);
  const [dragging, setDragging] = useState(false);
  const [docked, setDocked] = useState(true);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    if (docked) return; // Can't drag when docked
    if (e.target.closest('button, input, textarea, select, a')) return;
    setDragging(true);
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [docked, pos]);

  const toggleDock = useCallback(() => {
    setDocked(prev => {
      if (!prev) {
        // Docking: reset position
        setPos(initialPos);
      }
      return !prev;
    });
  }, [initialPos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, e.clientX - offset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offset.current.y)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  return { pos, onMouseDown, dragging, docked, toggleDock };
}
