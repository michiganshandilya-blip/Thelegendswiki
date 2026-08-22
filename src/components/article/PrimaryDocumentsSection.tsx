import React from 'react';
import { PrimaryDocument } from '../../types';
import { FileText, ExternalLink, Calendar, Building2, Quote } from 'lucide-react';

interface PrimaryDocumentsSectionProps {
  documents: PrimaryDocument[];
}

export const PrimaryDocumentsSection: React.FC<PrimaryDocumentsSectionProps> = ({ documents }) => {
  return (
    <section className="bg-amber-50/50 border border-amber-300/80 rounded-sm p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-amber-200 pb-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-amber-800" />
          <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
            Primary Historical Documents &amp; Declassified Correspondence
          </h3>
        </div>
        <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-xs font-bold">
          Archival Evidence
        </span>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-amber-200/90 rounded-xs p-4 space-y-3 shadow-xs"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-slate-100 pb-2">
              <h4 className="font-serif font-bold text-sm text-slate-900">
                {doc.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                {doc.date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    <span>{doc.date}</span>
                  </span>
                )}
                {doc.repository && (
                  <span className="flex items-center gap-1">
                    <Building2 size={11} />
                    <span>{doc.repository}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Document Excerpt / Quotation */}
            <div className="relative pl-6 pr-3 py-2 bg-stone-50/80 border-l-2 border-amber-600 rounded-r-xs">
              <Quote size={14} className="absolute left-1.5 top-2 text-amber-500/70" />
              <p className="font-serif italic text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                "{doc.excerpt}"
              </p>
            </div>

            {/* Analysis & Context */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-900 block">
                Archival Significance:
              </span>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                {doc.context}
              </p>
            </div>

            {/* External repository link */}
            {doc.url && (
              <div className="pt-1 text-right">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-800 hover:text-amber-900 hover:underline"
                >
                  <span>View Original Archive Record</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
