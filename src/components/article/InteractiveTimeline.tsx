import React, { useState } from 'react';
import { TimelineEvent } from '../../types';
import { Clock, Star, Key, Calendar } from 'lucide-react';

interface InteractiveTimelineProps {
  events: TimelineEvent[];
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({ events }) => {
  const [activeEventIndex, setActiveEventIndex] = useState<number | null>(null);

  return (
    <section className="bg-white border border-[#cbd5e1] rounded-sm p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-amber-800" />
          <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
            Behind-the-Scenes Chronological Timeline
          </h3>
        </div>
        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-xs font-bold">
          {events.length} Key Milestones
        </span>
      </div>

      <div className="relative border-l-2 border-amber-300 ml-3 pl-5 space-y-6">
        {events.map((event, idx) => {
          const isSelected = activeEventIndex === idx;

          return (
            <div
              key={idx}
              onClick={() => setActiveEventIndex(isSelected ? null : idx)}
              className={`relative group cursor-pointer transition-all ${
                isSelected ? 'scale-[1.01]' : ''
              }`}
            >
              {/* Timeline Marker */}
              <div
                className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  event.isTurningPoint
                    ? 'bg-amber-500 border-amber-800 ring-2 ring-amber-200'
                    : 'bg-white border-amber-600 group-hover:bg-amber-600'
                }`}
              />

              {/* Event Content Box */}
              <div
                className={`p-3.5 rounded-xs border transition-all space-y-1.5 ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-400 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-xs">
                      {event.date}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-slate-900">
                      {event.title}
                    </h4>
                  </div>
                  {event.isTurningPoint && (
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-800 bg-amber-200/80 border border-amber-400 px-1.5 py-0.2 rounded-xs flex items-center gap-1">
                      <Star size={10} className="fill-amber-700 text-amber-700" />
                      <span>Turning Point</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {event.description}
                </p>

                {event.significance && (
                  <div className="pt-1 text-[11px] font-mono text-amber-900 border-t border-slate-200/70">
                    <strong>Significance:</strong> {event.significance}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
