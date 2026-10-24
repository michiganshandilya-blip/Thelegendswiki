import React, { useState, useEffect } from 'react';
import {
  fetchAiAdminSettings,
  updateAiAdminSettings,
  AiAdminSettings,
  askAiAssistant,
} from '../../services/aiService';
import { Button } from '../common/Button';
import {
  Sparkles,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Sliders,
  Lock,
  Cpu,
  Zap,
} from 'lucide-react';

export const AdminAiControls: React.FC = () => {
  const [data, setData] = useState<AiAdminSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [assistantEnabled, setAssistantEnabled] = useState<boolean>(true);
  const [editorToolsEnabled, setEditorToolsEnabled] = useState<boolean>(true);
  const [searchAssistantEnabled, setSearchAssistantEnabled] = useState<boolean>(true);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState<number>(60);
  const [temperature, setTemperature] = useState<number>(0.7);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchAiAdminSettings();
      if (res) {
        setData(res);
        setAssistantEnabled(res.settings.assistantEnabled);
        setEditorToolsEnabled(res.settings.editorToolsEnabled);
        setSearchAssistantEnabled(res.settings.searchAssistantEnabled);
        setRateLimitPerMinute(res.settings.rateLimitPerMinute);
        setTemperature(res.settings.temperature);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await updateAiAdminSettings({
        assistantEnabled,
        editorToolsEnabled,
        searchAssistantEnabled,
        rateLimitPerMinute,
        temperature,
      });
      if (res) {
        setData(res);
        setNotice({ type: 'success', message: 'AI configuration successfully saved and applied.' });
      } else {
        setNotice({ type: 'error', message: 'Failed to update AI settings.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Error updating settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleTestAiConnectivity = async () => {
    try {
      setTestLoading(true);
      setTestStatus(null);
      const res = await askAiAssistant({
        messages: [{ role: 'user', content: 'Ping: Archival system status test.' }],
      });
      if (res.error) {
        setTestStatus(`Error: ${res.error}`);
      } else {
        setTestStatus(`Success: Connected to ${data?.settings.modelName || 'Gemini'}. Response received: "${res.reply?.slice(0, 80)}..."`);
      }
    } catch (err: any) {
      setTestStatus(`Failed: ${err?.message || 'Connection timeout.'}`);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[#54595d]">
        <RefreshCw size={18} className="animate-spin mx-auto text-[#3366cc] mb-2" />
        <span>Loading AI governance settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`p-3 rounded-sm text-xs flex items-center gap-2 border shadow-xs ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={15} className="text-rose-600 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* AI Overview & Health Card */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eaecf0] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-[#3366cc] rounded-sm border border-blue-200">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#101418]">
                Gemini AI Engine &amp; Knowledge Assistant Status
              </h3>
              <p className="text-xs text-[#54595d]">
                Configure language models, editorial assistance, query guardrails, and request limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestAiConnectivity}
              disabled={testLoading}
              icon={<Activity size={13} className={testLoading ? 'animate-spin text-[#3366cc]' : ''} />}
            >
              {testLoading ? 'Testing API...' : 'Run Diagnostics'}
            </Button>
          </div>
        </div>

        {/* Diagnostic Status Box */}
        {testStatus && (
          <div
            className={`p-3 rounded-sm text-xs font-mono border ${
              testStatus.startsWith('Success')
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            {testStatus}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm">
            <div className="text-[10px] font-mono uppercase text-[#72777d]">Total AI Syntheses</div>
            <div className="text-xl font-bold font-mono text-[#101418] mt-0.5">
              {data?.stats.totalRequests || 0}
            </div>
          </div>

          <div className="p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm">
            <div className="text-[10px] font-mono uppercase text-[#72777d]">Active Model</div>
            <div className="text-xs font-bold font-mono text-[#3366cc] mt-1 flex items-center gap-1">
              <Cpu size={12} />
              <span>{data?.settings.modelName || 'gemini-3.8-flash'}</span>
            </div>
          </div>

          <div className="p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm">
            <div className="text-[10px] font-mono uppercase text-[#72777d]">API Key Status</div>
            <div className="text-xs font-bold font-mono text-emerald-700 mt-1 flex items-center gap-1">
              <Shield size={12} />
              <span>{data?.stats.hasApiKey ? 'Configured in AI Studio' : 'Active runtime env'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggles and Guardrails Configuration */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-5 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#eaecf0] pb-2">
          <Sliders size={16} className="text-[#3366cc]" />
          <h4 className="font-serif font-bold text-sm text-[#101418]">
            Feature Clearance &amp; System Toggles
          </h4>
        </div>

        <div className="space-y-4">
          {/* Toggle 1: AI Assistant Widget */}
          <div className="flex items-start justify-between gap-4 p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm">
            <div>
              <div className="text-xs font-serif font-bold text-[#101418]">
                Enable Public AI Wiki Assistant
              </div>
              <p className="text-[11px] text-[#54595d] mt-0.5 leading-relaxed">
                Allows general users and readers to ask questions, request summaries, and navigate the encyclopedia using the floating chat assistant.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={assistantEnabled}
                onChange={(e) => setAssistantEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3366cc]"></div>
            </label>
          </div>

          {/* Toggle 2: AI Writing Tools in Editor */}
          <div className="flex items-start justify-between gap-4 p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm">
            <div>
              <div className="text-xs font-serif font-bold text-[#101418]">
                Enable AI Article Writing Assistant Tools
              </div>
              <p className="text-[11px] text-[#54595d] mt-0.5 leading-relaxed">
                Provides outline generation, grammar improvement, scholarly tone enhancements, and category suggestions in the article editor.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={editorToolsEnabled}
                onChange={(e) => setEditorToolsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3366cc]"></div>
            </label>
          </div>

          {/* Toggle 3: AI Semantic Search */}
          <div className="flex items-start justify-between gap-4 p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm">
            <div>
              <div className="text-xs font-serif font-bold text-[#101418]">
                Enable AI-Assisted Natural Language Search
              </div>
              <p className="text-[11px] text-[#54595d] mt-0.5 leading-relaxed">
                Enables natural language search queries with grounded semantic analysis and contextual cross-referencing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={searchAssistantEnabled}
                onChange={(e) => setSearchAssistantEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3366cc]"></div>
            </label>
          </div>
        </div>

        {/* Rate Limits & Temperature */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#eaecf0]">
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-[#54595d] mb-1">
              Rate Limit (Requests / Minute per IP):
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={rateLimitPerMinute}
              onChange={(e) => setRateLimitPerMinute(Number(e.target.value))}
              className="w-full bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-2 text-xs text-[#202122] font-mono focus:border-[#3366cc] focus:outline-none"
            />
            <p className="text-[10px] text-[#72777d] mt-1">
              Protects server and Gemini quota from automated spam.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-bold text-[#54595d] mb-1">
              Model Temperature (Creativity vs Factual Precision):
            </label>
            <input
              type="number"
              step={0.1}
              min={0.0}
              max={1.0}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-2 text-xs text-[#202122] font-mono focus:border-[#3366cc] focus:outline-none"
            />
            <p className="text-[10px] text-[#72777d] mt-1">
              Recommended: 0.7 for conversational Q&A, 0.2 for search ranking.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaecf0]">
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'Saving Guardrails...' : 'Save AI Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
};
