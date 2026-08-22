import React from 'react';
import { HandwrittenNote } from '../../types';
import { Feather, Pin } from 'lucide-react';

interface HandwrittenMarginNotesProps {
  notes: HandwrittenNote[];
}

export const HandwrittenMarginNotes: React.FC<HandwrittenMarginNotesProps> = ({ notes }) => {
  return (
    <aside className="space-y-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1">
        <Feather size={13} className="text-amber-700" />
        <span>Archival Marginalia &amp; Notes</span>
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-3.5 bg-amber-50/90 border border-amber-300/80 rounded-xs shadow-xs space-y-1.5 transform rotate-[-0.5deg] hover:rotate-0 transition-transform relative"
          >
            <Pin size={11} className="absolute -top-1.5 -left-1 text-amber-800 fill-amber-700 rotate-[-25deg]" />
            
            <p className="font-handwritten text-sm sm:text-base text-amber-950 leading-snug">
              &ldquo;{note.text || note.noteText}&rdquo;
            </p>

            <div className="flex items-center justify-between text-[10px] font-mono text-amber-800/80 pt-1 border-t border-amber-200/80">
              <span className="font-semibold">{note.author}</span>
              {note.date && <span>{note.date}</span>}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
