import React from 'react';
import { ArticleCitation } from '../../types';
import { isValidUrl } from '../../lib/validation';
import { Plus, Trash2, BookMarked, ExternalLink, AlertCircle } from 'lucide-react';

interface EditorReferencesProps {
  citations: ArticleCitation[];
  onChange: (citations: ArticleCitation[]) => void;
}

export const EditorReferences: React.FC<EditorReferencesProps> = ({
  citations,
  onChange,
}) => {
  const handleAddCitation = () => {
    const nextId = citations.length > 0 ? Math.max(...citations.map((c) => c.id || 0)) + 1 : 1;
    const newCitation: ArticleCitation = {
      id: nextId,
      title: '',
      publisher: '',
      url: '',
      year: new Date().getFullYear().toString(),
    };
    onChange([...citations, newCitation]);
  };

  const handleRemoveCitation = (index: number) => {
    const updated = citations.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleUpdateCitation = (index: number, field: keyof ArticleCitation, value: string) => {
    const updated = [...citations];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  return (
    <section className="space-y-4 bg-[#0a0f1d] border border-slate-800 rounded-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked size={16} className="text-sky-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100 font-display">
              Academic Sources &amp; Citations
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Add verifiable primary sources, historical records, and academic publications.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCitation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/40 rounded-sm text-xs font-semibold transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Add Reference</span>
        </button>
      </div>

      {citations.length === 0 ? (
        <div className="text-center py-6 px-4 bg-[#080c14] border border-dashed border-slate-800 rounded-sm">
          <BookMarked size={24} className="mx-auto text-slate-600 mb-2" />
          <p className="text-xs text-slate-400">
            No references attached yet. Credible encyclopedia entries require verified citations.
          </p>
          <button
            type="button"
            onClick={handleAddCitation}
            className="mt-2.5 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline underline-offset-2"
          >
            + Add first citation source
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {citations.map((cite, idx) => {
            const hasInvalidUrl = cite.url && !isValidUrl(cite.url);

            return (
              <div
                key={cite.id || idx}
                className="p-3.5 bg-[#0e1424] border border-slate-800/90 rounded-sm space-y-3 transition-colors hover:border-slate-700/80"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-sm border border-sky-800/50">
                    [{idx + 1}] Source Record
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveCitation(idx)}
                    title="Remove citation"
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Title */}
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                      Publication / Work Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={cite.title}
                      onChange={(e) => handleUpdateCitation(idx, 'title', e.target.value)}
                      placeholder="e.g. The Library of Alexandria: Centre of Ancient Learning"
                      className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Publisher / Author */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                      Publisher / Author
                    </label>
                    <input
                      type="text"
                      value={cite.publisher || ''}
                      onChange={(e) => handleUpdateCitation(idx, 'publisher', e.target.value)}
                      placeholder="e.g. Oxford University Press"
                      className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                    />
                  </div>

                  {/* URL */}
                  <div className="sm:col-span-9">
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                      Source Web URL (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={cite.url || ''}
                        onChange={(e) => handleUpdateCitation(idx, 'url', e.target.value)}
                        placeholder="https://..."
                        className={`w-full bg-[#080c14] border ${
                          hasInvalidUrl ? 'border-amber-500/80' : 'border-slate-800 focus:border-blue-500'
                        } rounded-sm px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all font-mono`}
                      />
                      {cite.url && isValidUrl(cite.url) && (
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-400"
                          title="Test reference URL"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    {hasInvalidUrl && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 mt-1">
                        <AlertCircle size={11} />
                        Please provide a valid URL starting with http:// or https://
                      </span>
                    )}
                  </div>

                  {/* Year / Date */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                      Year / Date
                    </label>
                    <input
                      type="text"
                      value={cite.year || ''}
                      onChange={(e) => handleUpdateCitation(idx, 'year', e.target.value)}
                      placeholder="e.g. 2002"
                      className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
