import React from 'react';
import { ArticleCitation } from '../../types';
import { isValidUrl } from '../../lib/validation';
import {
  Plus,
  Trash2,
  BookMarked,
  ExternalLink,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface EditorReferencesProps {
  citations: ArticleCitation[];
  error?: string;
  onChange: (citations: ArticleCitation[]) => void;
}

const CITATION_TYPES = [
  { value: 'general', label: 'General Citation / Record' },
  { value: 'book', label: 'Book / Monograph' },
  { value: 'journal', label: 'Academic Journal / Peer-Reviewed Paper' },
  { value: 'primary_source', label: 'Primary Historical Source / Manuscript' },
  { value: 'website', label: 'Official Web Source / Digital Archive' },
  { value: 'archive', label: 'Museum / Library Archival Record' },
];

export const EditorReferences: React.FC<EditorReferencesProps> = ({
  citations,
  error,
  onChange,
}) => {
  const handleAddCitation = () => {
    const nextId = citations.length > 0 ? Math.max(...citations.map((c) => c.id || 0)) + 1 : 1;
    const newCitation: ArticleCitation = {
      id: nextId,
      title: '',
      author: '',
      publisher: '',
      url: '',
      year: new Date().getFullYear().toString(),
      citationType: 'general',
      pages: '',
      doi: '',
      isbn: '',
    };
    onChange([...citations, newCitation]);
  };

  const handleRemoveCitation = (index: number) => {
    const updated = citations.filter((_, idx) => idx !== index);
    // Renumber IDs sequentially
    const renumbered = updated.map((c, i) => ({
      ...c,
      id: i + 1,
    }));
    onChange(renumbered);
  };

  const handleMoveCitation = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= citations.length) return;

    const copy = [...citations];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Renumber IDs to maintain 1, 2, 3 sequence
    const renumbered = copy.map((c, i) => ({
      ...c,
      id: i + 1,
    }));
    onChange(renumbered);
  };

  const handleUpdateCitation = (index: number, field: keyof ArticleCitation, value: any) => {
    const updated = [...citations];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  return (
    <section 
      id="section-editor-sources-references"
      className={`space-y-4 bg-[#ffffff] border rounded-sm p-4 sm:p-5 shadow-xs transition-colors ${
        error ? 'border-red-400 ring-1 ring-red-300' : 'border-[#a2a9b1]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#eaecf0]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold text-white bg-[#3366cc] px-2.5 py-0.5 rounded-xs shrink-0">
              § 9
            </span>
            <BookMarked size={17} className="text-[#3366cc]" />
            <h3 className="text-sm sm:text-base font-bold text-[#101418] font-serif">
              Sources / References
            </h3>
            <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-xs font-semibold">
              Mandatory
            </span>
          </div>
          <p className="text-xs text-[#54595d] mt-1 font-sans">
            Provide the complete sources and references used for the dossier. Sources / References are required before submission. Connect sources to claims wherever practical, distinguishing primary evidence from secondary reporting. Reference citations inline using <code className="font-mono bg-blue-50 text-[#3366cc] px-1 py-0.2 rounded-xs border border-blue-200">[1]</code>, <code className="font-mono bg-blue-50 text-[#3366cc] px-1 py-0.2 rounded-xs border border-blue-200">[2]</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCitation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#3366cc] border border-blue-300 rounded-sm text-xs font-semibold font-mono transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>+ Add Citation Source</span>
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xs text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {citations.length === 0 ? (
        <div className="text-center py-6 px-4 bg-[#f8f9fa] border border-dashed border-[#cbd5e1] rounded-sm space-y-2">
          <BookOpen size={24} className="mx-auto text-[#cbd5e1]" />
          <p className="text-xs text-[#54595d]">
            No references attached yet. Credible encyclopedia entries require verified primary sources and academic citations.
          </p>
          <button
            type="button"
            onClick={handleAddCitation}
            className="text-xs text-[#3366cc] hover:underline font-semibold cursor-pointer font-mono"
          >
            + Add first citation source
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {citations.map((cite, idx) => {
            const hasInvalidUrl = Boolean(cite.url && !isValidUrl(cite.url));
            const currentNumber = cite.id || idx + 1;

            return (
              <div
                key={cite.id || idx}
                className="p-4 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm space-y-3.5 transition-colors hover:border-[#3366cc]"
              >
                {/* Header bar of citation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#3366cc] bg-blue-50 px-2.5 py-0.5 rounded-sm border border-blue-200">
                      [{currentNumber}] Source Record
                    </span>
                    <span className="text-[11px] text-[#72777d] font-mono hidden sm:inline">
                      Tag in text: <strong className="text-[#3366cc]">[{currentNumber}]</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveCitation(idx, 'up')}
                      disabled={idx === 0}
                      title="Move reference up"
                      className="p-1 text-[#72777d] hover:text-[#101418] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCitation(idx, 'down')}
                      disabled={idx === citations.length - 1}
                      title="Move reference down"
                      className="p-1 text-[#72777d] hover:text-[#101418] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCitation(idx)}
                      title="Remove citation"
                      className="p-1 text-[#72777d] hover:text-red-600 transition-colors cursor-pointer ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Title */}
                  <div className="sm:col-span-8">
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      Publication / Work Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cite.title}
                      onChange={(e) => handleUpdateCitation(idx, 'title', e.target.value)}
                      placeholder="e.g. The Library of Alexandria: Centre of Ancient Learning"
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none transition-all font-serif"
                    />
                  </div>

                  {/* Citation Type */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      Source Type
                    </label>
                    <select
                      value={cite.citationType || 'general'}
                      onChange={(e) => handleUpdateCitation(idx, 'citationType', e.target.value)}
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] focus:outline-none"
                    >
                      {CITATION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Author */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      Author(s)
                    </label>
                    <input
                      type="text"
                      value={cite.author || ''}
                      onChange={(e) => handleUpdateCitation(idx, 'author', e.target.value)}
                      placeholder="e.g. Isaacson, Walter"
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-sans"
                    />
                  </div>

                  {/* Publisher / Journal */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      Publisher / Journal / Institution
                    </label>
                    <input
                      type="text"
                      value={cite.publisher || ''}
                      onChange={(e) => handleUpdateCitation(idx, 'publisher', e.target.value)}
                      placeholder="e.g. Oxford University Press"
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-sans"
                    />
                  </div>

                  {/* Year / Date */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      Year / Date
                    </label>
                    <input
                      type="text"
                      value={cite.year || cite.date || ''}
                      onChange={(e) => {
                        handleUpdateCitation(idx, 'year', e.target.value);
                        handleUpdateCitation(idx, 'date', e.target.value);
                      }}
                      placeholder="e.g. 2007"
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-mono"
                    />
                  </div>

                  {/* Web URL */}
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      Source Web URL (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={cite.url || ''}
                        onChange={(e) => handleUpdateCitation(idx, 'url', e.target.value)}
                        placeholder="https://..."
                        className={`w-full bg-[#ffffff] border ${
                          hasInvalidUrl ? 'border-amber-500' : 'border-[#a2a9b1] focus:border-[#3366cc]'
                        } rounded-sm px-2.5 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-mono`}
                      />
                      {cite.url && isValidUrl(cite.url) && (
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#72777d] hover:text-[#3366cc]"
                          title="Test reference URL"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    {hasInvalidUrl && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-700 mt-1 font-sans">
                        <AlertCircle size={11} />
                        Please provide a valid URL starting with http:// or https://
                      </span>
                    )}
                  </div>

                  {/* Pages */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      Pages / Section
                    </label>
                    <input
                      type="text"
                      value={cite.pages || ''}
                      onChange={(e) => handleUpdateCitation(idx, 'pages', e.target.value)}
                      placeholder="e.g. 142–158"
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] focus:outline-none font-mono"
                    />
                  </div>

                  {/* DOI or ISBN */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      DOI or ISBN
                    </label>
                    <input
                      type="text"
                      value={cite.doi || cite.isbn || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('10.') || val.includes('/')) {
                          handleUpdateCitation(idx, 'doi', val);
                        } else {
                          handleUpdateCitation(idx, 'isbn', val);
                        }
                      }}
                      placeholder="e.g. 10.1093/..."
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] focus:outline-none font-mono"
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
