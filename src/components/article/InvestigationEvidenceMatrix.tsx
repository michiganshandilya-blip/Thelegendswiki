import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Database,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Info
} from 'lucide-react';
import { InvestigationRecord, EvidenceItem, ClaimItem, ClaimStatus, EvidenceVerificationStatus } from '../../types';
import { getInvestigationByArticleSlug } from '../../services/investigationService';

interface InvestigationEvidenceMatrixProps {
  articleSlug: string;
  articleTitle: string;
}

export const InvestigationEvidenceMatrix: React.FC<InvestigationEvidenceMatrixProps> = ({
  articleSlug,
  articleTitle,
}) => {
  const [investigation, setInvestigation] = useState<InvestigationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeClaimFilter, setActiveClaimFilter] = useState<ClaimStatus | 'all'>('all');
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'claims' | 'evidence' | 'hypotheses'>('claims');

  useEffect(() => {
    let isMounted = true;
    const fetchInv = async () => {
      try {
        setLoading(true);
        const data = await getInvestigationByArticleSlug(articleSlug);
        if (isMounted) {
          setInvestigation(data);
        }
      } catch (err) {
        console.warn('Could not load investigation for article:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInv();
    return () => {
      isMounted = false;
    };
  }, [articleSlug]);

  if (loading) {
    return (
      <div className="my-8 p-6 bg-[#f8f9fa] border border-[#c8ccd1] rounded-sm text-center">
        <div className="inline-block w-5 h-5 border-2 border-[#3366cc] border-t-transparent rounded-full animate-spin mb-2" />
        <div className="text-xs font-mono text-[#54595d]">Synchronizing evidentiary dossiers and claim verification matrix...</div>
      </div>
    );
  }

  // If no investigation is registered for this article, do not render intrusive noise
  if (!investigation) {
    return null;
  }

  const claims = investigation.claims || [];
  const evidenceList = investigation.evidence || [];

  const filteredClaims = claims.filter(c => {
    if (activeClaimFilter === 'all') return true;
    return c.status === activeClaimFilter;
  });

  const getClaimStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle size={12} className="text-emerald-700" /> Confirmed Fact
          </span>
        );
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-blue-50 text-blue-800 border border-blue-300">
            <ShieldCheck size={12} className="text-blue-700" /> Corroborated
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-amber-50 text-amber-900 border border-amber-300">
            <AlertTriangle size={12} className="text-amber-700" /> Disputed / Contested
          </span>
        );
      case 'refuted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle size={12} className="text-rose-700" /> Refuted
          </span>
        );
      case 'unverified':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle size={12} className="text-slate-600" /> Unverified Assertion
          </span>
        );
    }
  };

  const getEvidenceTypeLabel = (type: string) => {
    switch (type) {
      case 'primary_document':
        return 'Primary Archival Document';
      case 'forensic_record':
        return 'Forensic Accounting / Technical Record';
      case 'eyewitness_testimony':
        return 'Direct Eyewitness Deposition';
      case 'academic_peer_reviewed':
        return 'Peer-Reviewed Academic Finding';
      case 'official_depository':
        return 'Official Government Depository';
      default:
        return 'Investigative Artifact';
    }
  };

  return (
    <section 
      id="investigation-evidence-matrix"
      className="my-8 bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-xs overflow-hidden print:border-black"
    >
      {/* Header Strip */}
      <div className="bg-[#f8f9fa] border-b border-[#c8ccd1] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">
                <FileCheck2 size={12} /> Investigation Dossier &amp; Evidence Engine
              </span>
              <span className="text-[10px] font-mono uppercase bg-[#ffffff] text-[#54595d] px-2 py-0.5 border border-[#cbd5e1] rounded-sm">
                Status: <strong className="text-[#101418]">{investigation.status.toUpperCase()}</strong>
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#101418] tracking-tight">
              {investigation.title}
            </h2>
          </div>
          <div className="text-xs text-[#54595d] font-mono sm:text-right shrink-0">
            <div>Lead: <strong className="text-[#101418]">{investigation.leadInvestigator}</strong></div>
            <div>Evidence Items: <strong className="text-[#3366cc]">{evidenceList.length} registered</strong></div>
          </div>
        </div>

        {investigation.leadOrigin && (
          <div className="mt-3 pt-3 border-t border-[#e2e8f0] text-xs text-[#54595d] flex items-start gap-2">
            <Info size={14} className="text-[#3366cc] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#101418]">Lead Origin:</strong> {investigation.leadOrigin}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-[#cbd5e1] bg-[#ffffff] px-4 pt-2 gap-2 select-none overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'claims'
              ? 'border-[#3366cc] text-[#3366cc]'
              : 'border-transparent text-[#54595d] hover:text-[#101418]'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Claims &amp; Verification Matrix ({claims.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'border-[#3366cc] text-[#3366cc]'
              : 'border-transparent text-[#54595d] hover:text-[#101418]'
          }`}
        >
          <Database size={14} />
          <span>Primary Evidence Chain ({evidenceList.length})</span>
        </button>

        {investigation.hypotheses && investigation.hypotheses.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('hypotheses')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'hypotheses'
                ? 'border-[#3366cc] text-[#3366cc]'
                : 'border-transparent text-[#54595d] hover:text-[#101418]'
            }`}
          >
            <Layers size={14} />
            <span>Investigative Hypotheses ({investigation.hypotheses.length})</span>
          </button>
        )}
      </div>

      {/* Tab 1: Claims & Verification Matrix */}
      {activeTab === 'claims' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Claim Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#54595d] font-semibold mr-1">Filter by Status:</span>
            {(['all', 'confirmed', 'supported', 'disputed', 'unverified'] as const).map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveClaimFilter(filter)}
                className={`px-2.5 py-1 rounded-sm text-xs font-mono transition-colors cursor-pointer capitalize ${
                  activeClaimFilter === filter
                    ? 'bg-[#202122] text-[#ffffff] font-bold'
                    : 'bg-[#f8f9fa] text-[#54595d] hover:bg-[#e2e8f0] border border-[#cbd5e1]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Claims Grid / List */}
          <div className="space-y-3">
            {filteredClaims.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#54595d] bg-[#f8f9fa] border border-dashed border-[#cbd5e1] rounded-sm">
                No claims match the selected verification filter.
              </div>
            ) : (
              filteredClaims.map((claim) => {
                const linkedEvidence = evidenceList.filter(e => 
                  (claim.linkedEvidenceIds || []).includes(e.id)
                );

                return (
                  <div
                    key={claim.id}
                    className="p-4 bg-[#ffffff] border border-[#c8ccd1] hover:border-[#3366cc] rounded-sm transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#54595d] uppercase px-1.5 py-0.5 bg-[#f1f5f9] rounded-sm border border-[#e2e8f0]">
                          {claim.subject}
                        </span>
                        {getClaimStatusBadge(claim.status)}
                      </div>

                      {claim.confidenceScore !== undefined && (
                        <div className="text-[11px] font-mono text-[#54595d] flex items-center gap-1.5">
                          <span>Evidence Confidence:</span>
                          <strong className="text-[#101418]">{claim.confidenceScore}%</strong>
                          <div className="w-16 bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                claim.confidenceScore >= 80
                                  ? 'bg-emerald-600'
                                  : claim.confidenceScore >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-amber-600'
                              }`}
                              style={{ width: `${claim.confidenceScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="font-serif text-base text-[#101418] font-medium leading-relaxed">
                      "{claim.statement}"
                    </div>

                    {claim.epistemicRationale && (
                      <div className="p-2.5 bg-[#f8f9fa] border-l-2 border-[#3366cc] text-xs text-[#202122] space-y-0.5">
                        <div className="text-[10px] font-mono uppercase text-[#64748b] font-bold">
                          Verification Verdict &amp; Rationale
                        </div>
                        <p>{claim.epistemicRationale}</p>
                      </div>
                    )}

                    {/* Linked Primary Evidence Tags */}
                    {linkedEvidence.length > 0 && (
                      <div className="pt-2 border-t border-[#f1f5f9] flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] font-semibold text-[#54595d] flex items-center gap-1">
                          <Database size={11} className="text-[#3366cc]" /> Linked Evidence:
                        </span>
                        {linkedEvidence.map((evi) => (
                          <button
                            key={evi.id}
                            type="button"
                            onClick={() => {
                              setActiveTab('evidence');
                              setExpandedEvidenceId(evi.id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-[#3366cc] border border-blue-200 rounded-sm text-[11px] font-medium cursor-pointer transition-colors"
                          >
                            <span>{evi.title}</span>
                            <ExternalLink size={10} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Primary Evidence Chain */}
      {activeTab === 'evidence' && (
        <div className="p-4 sm:p-5 space-y-3">
          {evidenceList.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#54595d] bg-[#f8f9fa] border border-dashed border-[#cbd5e1] rounded-sm">
              No evidence artifacts registered yet for this dossier.
            </div>
          ) : (
            evidenceList.map((evi) => {
              const isExpanded = expandedEvidenceId === evi.id;

              return (
                <div
                  key={evi.id}
                  className={`border rounded-sm transition-all ${
                    isExpanded ? 'border-[#3366cc] bg-[#f8fafc]' : 'border-[#c8ccd1] bg-[#ffffff]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedEvidenceId(isExpanded ? null : evi.id)}
                    className="w-full p-3.5 text-left flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 bg-slate-100 text-slate-800 border border-slate-300 rounded-sm">
                          {getEvidenceTypeLabel(evi.evidenceType)}
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-sm border ${
                          evi.verificationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : evi.verificationStatus === 'disputed'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {evi.verificationStatus.toUpperCase()}
                        </span>
                        {evi.confidenceScore && (
                          <span className="text-[10px] font-mono text-[#54595d]">
                            Confidence: <strong>{evi.confidenceScore}%</strong>
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-sm sm:text-base font-bold text-[#101418]">
                        {evi.title}
                      </h4>
                      <div className="text-xs text-[#54595d]">
                        Source: <span className="text-[#101418] font-medium">{evi.source}</span>
                      </div>
                    </div>

                    <div className="p-1 text-[#54595d] shrink-0">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-[#e2e8f0] bg-[#ffffff] space-y-3 text-xs">
                      <p className="text-[#202122] leading-relaxed">{evi.description}</p>

                      {evi.rawExcerpt && (
                        <div className="p-3 bg-[#f8f9fa] border-l-3 border-amber-700 text-[#101418] font-mono text-[11px] leading-relaxed">
                          <div className="text-[9px] uppercase tracking-wider font-bold text-amber-900 mb-1">
                            Primary Archival Excerpt
                          </div>
                          "{evi.rawExcerpt}"
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#f1f5f9] text-[11px] text-[#54595d]">
                        {evi.repository && (
                          <div>
                            <strong>Archival Repository:</strong> {evi.repository}
                          </div>
                        )}
                        {evi.dateCollected && (
                          <div>
                            <strong>Collected Date:</strong> {evi.dateCollected}
                          </div>
                        )}
                        {evi.custodyChain && (
                          <div className="sm:col-span-2">
                            <strong>Custody Chain:</strong> <span className="font-mono">{evi.custodyChain}</span>
                          </div>
                        )}
                        {evi.verifiedBy && (
                          <div className="sm:col-span-2">
                            <strong>Verified By:</strong> {evi.verifiedBy} {evi.verifiedAt ? `on ${new Date(evi.verifiedAt).toLocaleDateString()}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Hypotheses */}
      {activeTab === 'hypotheses' && investigation.hypotheses && (
        <div className="p-4 sm:p-5 space-y-3">
          {investigation.hypotheses.map((hyp) => (
            <div
              key={hyp.id}
              className="p-3.5 bg-[#ffffff] border border-[#c8ccd1] rounded-sm space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-bold text-[#54595d] uppercase">
                  HYPOTHESIS #{hyp.id.replace('hyp-', '')}
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.2 rounded-sm border ${
                  hyp.status === 'validated'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : hyp.status === 'dismissed'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}>
                  {hyp.status.toUpperCase()}
                </span>
              </div>
              <div className="font-serif text-sm font-medium text-[#101418]">
                {hyp.statement}
              </div>
              {hyp.notes && (
                <div className="text-xs text-[#54595d] bg-[#f8f9fa] p-2 rounded-xs border border-[#f1f5f9]">
                  <strong>Investigator Notes:</strong> {hyp.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Findings Footer */}
      {investigation.findings && (
        <div className="bg-[#f8f9fa] border-t border-[#c8ccd1] p-4 text-xs text-[#202122] flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#101418]">Evidentiary Findings &amp; Consensus:</strong>{' '}
            <span>{investigation.findings}</span>
          </div>
        </div>
      )}
    </section>
  );
};
