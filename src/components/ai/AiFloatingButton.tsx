import React, { useState, useEffect, useRef } from 'react';
import { CodeXAvatar } from './CodeXAvatar';
import { GripVertical } from 'lucide-react';

interface AiFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const STORAGE_KEY_POS = 'thelegendswiki_codex_pos';

export const AiFloatingButton: React.FC<AiFloatingButtonProps> = ({ onClick, isOpen }) => {
  // Default position: Top-right below header
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; buttonX: number; buttonY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    buttonX: 0,
    buttonY: 0,
    moved: false,
  });
  const buttonRef = useRef<HTMLDivElement | null>(null);

  // Initialize position from localStorage or default
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Clamp within initial viewport
          const clampedX = Math.min(Math.max(12, parsed.x), window.innerWidth - 130);
          const clampedY = Math.min(Math.max(60, parsed.y), window.innerHeight - 60);
          setPosition({ x: clampedX, y: clampedY });
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Default right side top corner
    const defaultX = Math.max(12, window.innerWidth - 150);
    const defaultY = 70;
    setPosition({ x: defaultX, y: defaultY });
  }, []);

  // Handle window resizing to keep button within bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const clampedX = Math.min(Math.max(12, prev.x), window.innerWidth - 130);
        const clampedY = Math.min(Math.max(60, prev.y), window.innerHeight - 60);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse / Pointer dragging handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    if (!position) return;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      buttonX: position.x,
      buttonY: position.y,
      moved: false,
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    // Distinguish intentional drag from a normal tap/click
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragStartRef.current.moved = true;
    }

    const newX = dragStartRef.current.buttonX + deltaX;
    const newY = dragStartRef.current.buttonY + deltaY;

    // Bounds checking
    const btnWidth = buttonRef.current?.offsetWidth || 130;
    const btnHeight = buttonRef.current?.offsetHeight || 44;

    const clampedX = Math.min(Math.max(10, newX), window.innerWidth - btnWidth - 10);
    const clampedY = Math.min(Math.max(56, newY), window.innerHeight - btnHeight - 10);

    setPosition({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    // Save final position to localStorage
    if (position) {
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
      } catch {
        // Ignore
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If the user was dragging, do not trigger opening the modal
    if (dragStartRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  if (isOpen || !position) return null;

  return (
    <aside
      ref={buttonRef}
      aria-label="Code X AI Assistant Floating Access"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
      }}
      className={`fixed top-0 left-0 z-40 select-none will-change-transform ${
        isDragging ? 'cursor-grabbing opacity-95 scale-105 transition-none' : 'transition-transform duration-75'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        id="thelegendswiki-ai-assistant-trigger"
        aria-label="Open Code X AI Assistant (Drag anywhere to move)"
        title="Ask Code X (Gemini AI Assistant) • Drag anywhere to move"
        className={`flex items-center gap-1.5 sm:gap-2 bg-white/95 hover:bg-white text-[#101418] border border-[#a2a9b1] hover:border-[#3366cc] rounded-full pl-2 pr-3 py-1.5 sm:pl-2 sm:pr-3.5 sm:py-2 shadow-md hover:shadow-xl transition-all duration-200 cursor-grab active:cursor-grabbing group focus-visible:ring-2 focus-visible:ring-[#3366cc] focus-visible:outline-none ${
          isDragging ? 'shadow-2xl border-[#3366cc] ring-2 ring-blue-400/50' : ''
        }`}
      >
        {/* Visual Drag Handle Indicator */}
        <div className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 flex items-center pr-0.5">
          <GripVertical size={13} className="opacity-70 group-hover:opacity-100" />
        </div>

        <CodeXAvatar size={20} className="group-hover:scale-105 transition-transform" />

        <div className="flex flex-col items-start leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-serif font-bold text-[#202122] group-hover:text-[#3366cc] transition-colors">
              Code X
            </span>
            <span className="hidden sm:inline-block text-[8px] font-mono uppercase bg-blue-50 text-[#3366cc] border border-blue-200 px-1 py-0.2 rounded-xs font-bold">
              AI
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
