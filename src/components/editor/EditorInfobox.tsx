import React from 'react';
import { ArticleInfobox, InfoboxDetail } from '../../types';
import { LayoutList, Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

interface EditorInfoboxProps {
  infobox?: ArticleInfobox;
  articleTitle: string;
  articleType?: 'person' | 'place' | 'science' | 'event' | 'technology' | 'organization' | 'general';
  onChange: (infobox: ArticleInfobox | undefined) => void;
}

export const EditorInfobox: React.FC<EditorInfoboxProps> = ({
  infobox,
  articleTitle,
  articleType = 'general',
  onChange,
}) => {
  const isEnabled = Boolean(infobox);

  const handleToggle = () => {
    if (isEnabled) {
      onChange(undefined);
    } else {
      onChange({
        title: articleTitle || 'Encyclopedia Entry',
        articleType,
        details: [
          { label: 'Classification', value: articleType.toUpperCase() },
          { label: 'Status', value: 'Active Archival Record' },
        ],
      });
    }
  };

  const handleFieldChange = (field: keyof ArticleInfobox, value: any) => {
    if (!infobox) return;
    onChange({
      ...infobox,
      [field]: value,
    });
  };

  const handleAddDetailRow = () => {
    if (!infobox) return;
    onChange({
      ...infobox,
      details: [...infobox.details, { label: '', value: '' }],
    });
  };

  const handleRemoveDetailRow = (index: number) => {
    if (!infobox) return;
    const updated = infobox.details.filter((_, idx) => idx !== index);
    onChange({
      ...infobox,
      details: updated,
    });
  };

  const handleDetailChange = (index: number, key: 'label' | 'value', text: string) => {
    if (!infobox) return;
    const updated = [...infobox.details];
    updated[index] = {
      ...updated[index],
      [key]: text,
    };
    onChange({
      ...infobox,
      details: updated,
    });
  };

  return (
    <section className="bg-[#0a0f1d] border border-slate-800 rounded-sm p-4 sm:p-5 space-y-4">
      {/* Header with Enable/Disable toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LayoutList size={16} className="text-sky-400" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 font-display">
              Structured Fact Sheet (Infobox)
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Provide standardized key-value quick facts for the right-hand desktop sidecard.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className={`px-3 py-1 rounded-sm text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer border ${
            isEnabled
              ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {isEnabled ? 'Infobox Active' : '+ Enable Infobox'}
        </button>
      </div>

      {isEnabled && infobox && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                Infobox Header Title
              </label>
              <input
                type="text"
                value={infobox.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Entry name"
                className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                Subtitle / Epithet (Optional)
              </label>
              <input
                type="text"
                value={infobox.subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                placeholder="e.g. Great Library of Classical Antiquity"
                className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Key-Value Details Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Quick Facts &amp; Key-Value Rows ({infobox.details.length})
              </span>
              <button
                type="button"
                onClick={handleAddDetailRow}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Fact Row</span>
              </button>
            </div>

            <div className="space-y-2">
              {infobox.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-[#0e1424] border border-slate-800/80 rounded-sm"
                >
                  <input
                    type="text"
                    value={detail.label}
                    onChange={(e) => handleDetailChange(idx, 'label', e.target.value)}
                    placeholder="Label (e.g. Founded, Era, Field)"
                    className="w-1/3 bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2 py-1 text-xs text-slate-200 focus:outline-none font-medium"
                  />
                  <input
                    type="text"
                    value={detail.value}
                    onChange={(e) => handleDetailChange(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. c. 300 BC, Alexandria, Egypt)"
                    className="flex-1 bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDetailRow(idx)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                    title="Remove row"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
