import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Shield,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Link2,
  Database,
  Layers,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Eye,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  InvestigationRecord,
  EvidenceItem,
  ClaimItem,
  InvestigationStatus,
  ClaimStatus,
  EvidenceVerificationStatus,
  EvidenceType,
  UserRole
} from '../../types';
import {
  getAllInvestigations,
  createInvestigation,
  updateInvestigation,
  addEvidenceItem,
  verifyEvidenceItem,
  addClaimToInvestigation,
  verifyClaim,
  deleteInvestigation,
} from '../../services/investigationService';
import { useArticles } from '../../data/dataProvider';
import { Button } from '../common/Button';

interface InvestigationEngineDeskProps {
  userProfile?: any;
  user?: any;
  role: UserRole | string;
  onNotification?: (message: string, type?: 'success' | 'error') => void;
}

export const InvestigationEngineDesk: React.FC<InvestigationEngineDeskProps> = ({
  userProfile,
  user,
  role,
  onNotification,
}) => {
  const { articles } = useArticles();
  const [investigations, setInvestigations] = useState<InvestigationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<InvestigationStatus | 'all'>('all');

  // Active dossier selected for deep claim/evidence editing
  const [selectedInv, setSelectedInv] = useState<InvestigationRecord | null>(null);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAddEvidenceModalOpen, setIsAddEvidenceModalOpen] = useState<boolean>(false);
  const [isAddClaimModalOpen, setIsAddClaimModalOpen] = useState<boolean>(false);
  const [isVerifyClaimModalOpen, setIsVerifyClaimModalOpen] = useState<boolean>(false);
  const [selectedClaimForVerify, setSelectedClaimForVerify] = useState<ClaimItem | null>(null);

  // Form States
  const [createForm, setCreateForm] = useState<{
    title: string;
    slug: string;
    subject: string;
    summary: string;
    status: InvestigationStatus;
    leadOrigin: string;
    articleSlug: string;
    findings: string;
  }>({
    title: '',
    slug: '',
    subject: '',
    summary: '',
    status: 'lead',
    leadOrigin: '',
    articleSlug: '',
    findings: '',
  });

  const [evidenceForm, setEvidenceForm] = useState<{
    title: string;
    source: string;
    sourceUrl: string;
    repository: string;
    dateCollected: string;
    evidenceType: EvidenceType;
    verificationStatus: EvidenceVerificationStatus;
    confidenceScore: number;
    custodyChain: string;
    description: string;
    rawExcerpt: string;
  }>({
    title: '',
    source: '',
    sourceUrl: '',
    repository: '',
    dateCollected: new Date().toISOString().split('T')[0],
    evidenceType: 'primary_document',
    verificationStatus: 'verified',
    confidenceScore: 90,
    custodyChain: '',
    description: '',
    rawExcerpt: '',
  });

  const [claimForm, setClaimForm] = useState<{
    subject: string;
    statement: string;
    status: ClaimStatus;
    epistemicRationale: string;
    linkedEvidenceIds: string[];
    confidenceScore: number;
  }>({
    subject: '',
    statement: '',
    status: 'unverified',
    epistemicRationale: '',
    linkedEvidenceIds: [],
    confidenceScore: 70,
  });

  const [verifyForm, setVerifyForm] = useState<{
    status: ClaimStatus;
    epistemicRationale: string;
    linkedEvidenceIds: string[];
  }>({
    status: 'confirmed',
    epistemicRationale: '',
    linkedEvidenceIds: [],
  });

  const actor = {
    uid: user?.uid || userProfile?.id || 'admin',
    email: userProfile?.email || user?.email || 'Thelegendswiki@gmail.com',
    role: role,
    displayName: userProfile?.displayName || userProfile?.username || 'Editorial Board',
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllInvestigations({
        status: statusFilter,
        searchQuery,
      });
      setInvestigations(data);
      if (selectedInv) {
        const refreshed = data.find(i => i.id === selectedInv.id);
        if (refreshed) setSelectedInv(refreshed);
      }
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to load investigations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery]);

  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.subject.trim()) {
      onNotification?.('Title and subject are required.', 'error');
      return;
    }

    const generatedSlug = createForm.slug.trim() || createForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const res = await createInvestigation(
      {
        title: createForm.title.trim(),
        slug: generatedSlug,
        subject: createForm.subject.trim(),
        summary: createForm.summary.trim(),
        status: createForm.status,
        leadOrigin: createForm.leadOrigin.trim(),
        articleSlug: createForm.articleSlug.trim(),
        findings: createForm.findings.trim(),
        claims: [],
        leadInvestigator: actor.displayName,
        leadInvestigatorId: actor.uid,
      },
      actor
    );

    if (res.success && res.data) {
      onNotification?.(`Investigation dossier "${res.data.title}" initialized.`);
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        slug: '',
        subject: '',
        summary: '',
        status: 'lead',
        leadOrigin: '',
        articleSlug: '',
        findings: '',
      });
      loadData();
    } else {
      onNotification?.(res.error || 'Failed to create investigation.', 'error');
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;
    if (!evidenceForm.title.trim() || !evidenceForm.source.trim()) {
      onNotification?.('Evidence title and source are required.', 'error');
      return;
    }

    const res = await addEvidenceItem(
      {
        investigationId: selectedInv.id,
        title: evidenceForm.title.trim(),
        source: evidenceForm.source.trim(),
        sourceUrl: evidenceForm.sourceUrl.trim(),
        repository: evidenceForm.repository.trim(),
        dateCollected: evidenceForm.dateCollected,
        evidenceType: evidenceForm.evidenceType,
        verificationStatus: evidenceForm.verificationStatus,
        confidenceScore: evidenceForm.confidenceScore,
        custodyChain: evidenceForm.custodyChain.trim(),
        description: evidenceForm.description.trim(),
        rawExcerpt: evidenceForm.rawExcerpt.trim(),
        authorId: actor.uid,
      },
      actor
    );

    if (res.success) {
      onNotification?.(`Evidence artifact "${evidenceForm.title}" recorded.`);
      setIsAddEvidenceModalOpen(false);
      setEvidenceForm({
        title: '',
        source: '',
        sourceUrl: '',
        repository: '',
        dateCollected: new Date().toISOString().split('T')[0],
        evidenceType: 'primary_document',
        verificationStatus: 'verified',
        confidenceScore: 90,
        custodyChain: '',
        description: '',
        rawExcerpt: '',
      });
      loadData();
    } else {
      onNotification?.(res.error || 'Failed to add evidence item.', 'error');
    }
  };

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;
    if (!claimForm.statement.trim() || !claimForm.subject.trim()) {
      onNotification?.('Claim subject and statement are required.', 'error');
      return;
    }

    const res = await addClaimToInvestigation(
      selectedInv.id,
      {
        subject: claimForm.subject.trim(),
        statement: claimForm.statement.trim(),
        status: claimForm.status,
        epistemicRationale: claimForm.epistemicRationale.trim(),
        linkedEvidenceIds: claimForm.linkedEvidenceIds,
        confidenceScore: claimForm.confidenceScore,
        authorId: actor.uid,
      },
      actor
    );

    if (res.success) {
      onNotification?.('Claim added to investigation.');
      setIsAddClaimModalOpen(false);
      setClaimForm({
        subject: '',
        statement: '',
        status: 'unverified',
        epistemicRationale: '',
        linkedEvidenceIds: [],
        confidenceScore: 70,
      });
      loadData();
    } else {
      onNotification?.(res.error || 'Failed to add claim.', 'error');
    }
  };

  const handleVerifyClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !selectedClaimForVerify) return;

    const res = await verifyClaim(
      selectedInv.id,
      selectedClaimForVerify.id,
      verifyForm.status,
      verifyForm.epistemicRationale.trim(),
      verifyForm.linkedEvidenceIds,
      actor
    );

    if (res.success) {
      onNotification?.(`Claim verification verdict updated to [${verifyForm.status.toUpperCase()}].`);
      setIsVerifyClaimModalOpen(false);
      setSelectedClaimForVerify(null);
      loadData();
    } else {
      onNotification?.(res.error || 'Failed to verify claim.', 'error');
    }
  };

  const handleStatusChange = async (invId: string, newStatus: InvestigationStatus) => {
    const res = await updateInvestigation(invId, { status: newStatus }, actor);
    if (res.success) {
      onNotification?.(`Investigation moved to stage: ${newStatus.toUpperCase()}`);
      loadData();
    } else {
      onNotification?.(res.error || 'Failed to update stage.', 'error');
    }
  };

  const handleDeleteInv = async (inv: InvestigationRecord) => {
    if (!window.confirm(`Are you sure you want to delete investigation "${inv.title}"?`)) return;
    const res = await deleteInvestigation(inv.id, actor);
    if (res.success) {
      onNotification?.(`Investigation "${inv.title}" deleted.`);
      if (selectedInv?.id === inv.id) setSelectedInv(null);
      loadData();
    } else {
      onNotification?.(res.error || 'Failed to delete investigation.', 'error');
    }
  };

  const getStatusColor = (status: InvestigationStatus) => {
    switch (status) {
      case 'published':
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'verification':
      case 'in_review':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'evidence_gathering':
      case 'claims_analysis':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'lead':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
              <FileCheck2 size={12} /> Evidence &amp; Verification Protocol
            </span>
            <span className="text-xs text-[#54595d]">Lead &rarr; Evidence &rarr; Claims &rarr; Verification &rarr; Publication</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#101418]">
            Investigation Engine &amp; Evidence Matrix Desk
          </h2>
          <p className="text-xs text-[#54595d]">
            Orchestrate evidentiary dossiers, primary document chains, and claim verification pipelines across encyclopedia topics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] hover:bg-[#ffffff] text-[#202122] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus size={14} />}
            className="bg-[#3366cc] hover:bg-[#2a52be] text-white text-xs font-semibold"
          >
            New Investigation Lead
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#ffffff] border border-[#c8ccd1] p-3 rounded-sm shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search size={14} className="text-[#54595d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search investigation subject, findings, or investigator..."
            className="w-full text-xs text-[#101418] placeholder-[#72777d] bg-transparent outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter size={13} className="text-[#54595d]" />
          <span className="text-[#54595d] font-semibold">Stage:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm px-2 py-1 outline-hidden"
          >
            <option value="all">All Stages ({investigations.length})</option>
            <option value="lead">1. Leads</option>
            <option value="evidence_gathering">2. Evidence Gathering</option>
            <option value="claims_analysis">3. Claims Analysis</option>
            <option value="verification">4. Verification</option>
            <option value="in_review">5. In Editorial Review</option>
            <option value="published">6. Published</option>
          </select>
        </div>
      </div>

      {/* Investigation Dossier List */}
      <div className="grid grid-cols-1 gap-4">
        {loading && investigations.length === 0 ? (
          <div className="p-8 text-center bg-[#ffffff] border border-[#c8ccd1] rounded-sm text-xs font-mono text-[#54595d]">
            Synchronizing investigation registers...
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-8 text-center bg-[#ffffff] border border-dashed border-[#c8ccd1] rounded-sm text-xs text-[#54595d]">
            No investigation dossiers found. Create a new lead to start the evidentiary verification process.
          </div>
        ) : (
          investigations.map((inv) => {
            const isSelected = selectedInv?.id === inv.id;
            const claims = inv.claims || [];
            const evidence = inv.evidence || [];
            const confirmedCount = claims.filter(c => c.status === 'confirmed').length;
            const disputedCount = claims.filter(c => c.status === 'disputed').length;

            return (
              <div
                key={inv.id}
                className={`bg-[#ffffff] border rounded-sm transition-all shadow-xs overflow-hidden ${
                  isSelected ? 'border-[#3366cc] ring-1 ring-[#3366cc]' : 'border-[#c8ccd1]'
                }`}
              >
                {/* Dossier Card Header */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f8f9fa] border-b border-[#e2e8f0]">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${getStatusColor(inv.status)}`}>
                        STAGE: {inv.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-[#54595d] px-2 py-0.5 bg-[#ffffff] border border-[#cbd5e1] rounded-sm">
                        Subject: <strong className="text-[#101418]">{inv.subject}</strong>
                      </span>
                      {inv.articleSlug && (
                        <span className="text-[10px] font-mono text-[#3366cc] px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-sm">
                          Linked: /wiki/{inv.articleSlug}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#101418]">
                      {inv.title}
                    </h3>
                  </div>

                  {/* Stage Switcher & Quick Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv.id, e.target.value as InvestigationStatus)}
                      className="text-xs font-mono font-bold bg-[#ffffff] border border-[#cbd5e1] rounded-sm px-2.5 py-1 text-[#101418]"
                    >
                      <option value="lead">Lead</option>
                      <option value="evidence_gathering">Evidence Gathering</option>
                      <option value="claims_analysis">Claims Analysis</option>
                      <option value="verification">Verification</option>
                      <option value="in_review">In Review</option>
                      <option value="published">Published</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setSelectedInv(isSelected ? null : inv)}
                      className={`px-3 py-1 text-xs font-semibold rounded-sm border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#3366cc] text-[#ffffff] border-[#3366cc]'
                          : 'bg-[#ffffff] text-[#3366cc] border-[#3366cc] hover:bg-blue-50'
                      }`}
                    >
                      {isSelected ? 'Collapse Matrix' : 'Inspect Matrix & Evidence'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteInv(inv)}
                      className="p-1.5 text-[#72777d] hover:text-rose-700 hover:bg-rose-50 rounded-sm transition-colors"
                      title="Delete Investigation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Dossier Summary Strip */}
                <div className="p-4 sm:p-5 space-y-3 text-xs">
                  <p className="text-[#202122] leading-relaxed">{inv.summary}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#f1f5f9] text-[11px] font-mono text-[#54595d]">
                    <div>
                      <span>Investigator:</span> <strong className="text-[#101418]">{inv.leadInvestigator}</strong>
                    </div>
                    <div>
                      <span>Evidence Items:</span> <strong className="text-[#3366cc]">{evidence.length}</strong>
                    </div>
                    <div>
                      <span>Claims Verified:</span> <strong className="text-emerald-700">{confirmedCount} confirmed</strong>
                    </div>
                    <div>
                      <span>Contested / Disputed:</span> <strong className="text-amber-800">{disputedCount}</strong>
                    </div>
                  </div>
                </div>

                {/* Expanded Deep Inspection Workspace */}
                {isSelected && (
                  <div className="p-4 sm:p-5 border-t-2 border-[#3366cc] bg-[#f8fafc] space-y-6">
                    {/* Header with quick add buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#cbd5e1]">
                      <div className="space-y-0.5">
                        <div className="font-serif font-bold text-sm text-[#101418]">
                          Evidence Matrix &amp; Claim Registry for "{inv.title}"
                        </div>
                        <div className="text-[11px] text-[#54595d]">
                          Attach primary source artifacts, map claims to proof, and evaluate epistemic verdicts.
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setIsAddEvidenceModalOpen(true);
                          }}
                          icon={<Database size={13} />}
                          className="text-xs"
                        >
                          Add Evidence Artifact
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setIsAddClaimModalOpen(true);
                          }}
                          icon={<ShieldCheck size={13} />}
                          className="bg-[#3366cc] hover:bg-[#2a52be] text-white text-xs"
                        >
                          Add &amp; Map Claim
                        </Button>
                      </div>
                    </div>

                    {/* Claims Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-[#101418] flex items-center gap-1.5">
                          <ShieldCheck size={15} className="text-[#3366cc]" />
                          <span>Claims &amp; Verification Breakdown ({claims.length})</span>
                        </h4>
                      </div>

                      {claims.length === 0 ? (
                        <div className="p-4 bg-[#ffffff] border border-dashed border-[#cbd5e1] rounded-sm text-center text-xs text-[#54595d]">
                          No claims recorded yet. Add an investigative assertion and link it to supporting evidence.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {claims.map((claim) => (
                            <div
                              key={claim.id}
                              className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] rounded-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-[#f1f5f9] text-[#475569] rounded-sm border">
                                    {claim.subject}
                                  </span>
                                  <span className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-sm border ${
                                    claim.status === 'confirmed'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : claim.status === 'disputed'
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}>
                                    {claim.status.toUpperCase()}
                                  </span>
                                  {claim.confidenceScore !== undefined && (
                                    <span className="font-mono text-[10px] text-[#54595d]">
                                      Score: <strong>{claim.confidenceScore}%</strong>
                                    </span>
                                  )}
                                </div>

                                <div className="font-serif text-sm font-medium text-[#101418]">
                                  "{claim.statement}"
                                </div>

                                {claim.epistemicRationale && (
                                  <div className="p-2 bg-[#f8f9fa] border-l-2 border-[#3366cc] text-[11px] text-[#334155]">
                                    <strong>Verdict Rationale:</strong> {claim.epistemicRationale}
                                  </div>
                                )}

                                <div className="text-[11px] font-mono text-[#54595d]">
                                  Linked Evidence IDs: {claim.linkedEvidenceIds?.length ? claim.linkedEvidenceIds.join(', ') : 'None'}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClaimForVerify(claim);
                                  setVerifyForm({
                                    status: claim.status,
                                    epistemicRationale: claim.epistemicRationale || '',
                                    linkedEvidenceIds: claim.linkedEvidenceIds || [],
                                  });
                                  setIsVerifyClaimModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-[#f8f9fa] hover:bg-[#ffffff] text-[#3366cc] border border-[#3366cc] rounded-sm font-semibold text-xs cursor-pointer shrink-0"
                              >
                                Verify / Edit Verdict
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Evidence Section */}
                    <div className="space-y-3 pt-4 border-t border-[#cbd5e1]">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-[#101418] flex items-center gap-1.5">
                          <Database size={15} className="text-[#3366cc]" />
                          <span>Primary Evidence Chain ({evidence.length})</span>
                        </h4>
                      </div>

                      {evidence.length === 0 ? (
                        <div className="p-4 bg-[#ffffff] border border-dashed border-[#cbd5e1] rounded-sm text-center text-xs text-[#54595d]">
                          No primary evidence records attached. Register forensic filings, witness logs, or archival papers.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {evidence.map((evi) => (
                            <div
                              key={evi.id}
                              className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] rounded-sm space-y-2 text-xs"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-[#f1f5f9] text-[#334155] rounded-sm border">
                                      {evi.evidenceType.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-sm border ${
                                      evi.verificationStatus === 'verified'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                    }`}>
                                      {evi.verificationStatus.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="font-serif font-bold text-sm text-[#101418]">
                                    {evi.title}
                                  </div>
                                </div>
                                <div className="text-[11px] font-mono text-[#54595d]">
                                  Source: <strong>{evi.source}</strong>
                                </div>
                              </div>

                              <p className="text-[#202122]">{evi.description}</p>

                              {evi.rawExcerpt && (
                                <div className="p-2 bg-[#f8f9fa] border-l-2 border-amber-700 font-mono text-[11px] text-[#101418]">
                                  "{evi.rawExcerpt}"
                                </div>
                              )}
                            </div>
                          ))}
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

      {/* Modal 1: Create Investigation */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif text-lg font-bold text-[#101418]">
                Initialize New Investigation Lead
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#54595d] hover:text-[#101418] text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateInvestigation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#101418] mb-1">Investigation Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. The 1992 Securities Scam: Ready-Forward Loophole"
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Subject / Domain *</label>
                  <input
                    type="text"
                    required
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    placeholder="e.g. Financial Market Forensics"
                    className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Initial Stage</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as InvestigationStatus })}
                    className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs bg-[#ffffff]"
                  >
                    <option value="lead">1. Lead (Uncorroborated)</option>
                    <option value="evidence_gathering">2. Evidence Gathering</option>
                    <option value="claims_analysis">3. Claims Analysis</option>
                    <option value="verification">4. Verification</option>
                    <option value="published">5. Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Summary Dossier *</label>
                <textarea
                  required
                  rows={3}
                  value={createForm.summary}
                  onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                  placeholder="Core hypothesis and investigative scope..."
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Lead Origin / Source Prompt</label>
                <input
                  type="text"
                  value={createForm.leadOrigin}
                  onChange={(e) => setCreateForm({ ...createForm, leadOrigin: e.target.value })}
                  placeholder="e.g. Whistleblower memo, investigative reporting, archival FOIA release"
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Link to Article Slug (Optional)</label>
                <select
                  value={createForm.articleSlug}
                  onChange={(e) => setCreateForm({ ...createForm, articleSlug: e.target.value })}
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs bg-[#ffffff]"
                >
                  <option value="">-- Unlinked Dossier --</option>
                  {articles.map((art) => (
                    <option key={art.id} value={art.slug}>
                      {art.title} (/wiki/{art.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="bg-[#3366cc] text-white"
                >
                  Create Investigation Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Evidence */}
      {isAddEvidenceModalOpen && selectedInv && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif text-lg font-bold text-[#101418]">
                Attach Evidence Artifact to "{selectedInv.title}"
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEvidenceModalOpen(false)}
                className="text-[#54595d] hover:text-[#101418] text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#101418] mb-1">Evidence Title *</label>
                <input
                  type="text"
                  required
                  value={evidenceForm.title}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  placeholder="e.g. Bank Receipt Duplicate Stubs"
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Source / Issuing Body *</label>
                  <input
                    type="text"
                    required
                    value={evidenceForm.source}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, source: e.target.value })}
                    placeholder="e.g. Reserve Bank of India Report"
                    className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Evidence Type</label>
                  <select
                    value={evidenceForm.evidenceType}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, evidenceType: e.target.value as EvidenceType })}
                    className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs bg-[#ffffff]"
                  >
                    <option value="primary_document">Primary Document</option>
                    <option value="forensic_record">Forensic / Accounting Record</option>
                    <option value="eyewitness_testimony">Eyewitness Testimony</option>
                    <option value="academic_peer_reviewed">Academic Finding</option>
                    <option value="official_depository">Official Depository</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Verification Status</label>
                  <select
                    value={evidenceForm.verificationStatus}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, verificationStatus: e.target.value as EvidenceVerificationStatus })}
                    className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs bg-[#ffffff]"
                  >
                    <option value="verified">Verified Fact</option>
                    <option value="corroborated">Corroborated</option>
                    <option value="under_review">Under Review</option>
                    <option value="disputed">Disputed / Contested</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Confidence Score (0-100%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={evidenceForm.confidenceScore}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, confidenceScore: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Custody Chain / Archival Path</label>
                <input
                  type="text"
                  value={evidenceForm.custodyChain}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, custodyChain: e.target.value })}
                  placeholder="e.g. Treasury Desk -> Subpoena Record -> Trial Exhibit #12"
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Description &amp; Significance</label>
                <textarea
                  rows={2}
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  placeholder="Explanation of how this artifact informs the case..."
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Direct Raw Excerpt</label>
                <textarea
                  rows={2}
                  value={evidenceForm.rawExcerpt}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, rawExcerpt: e.target.value })}
                  placeholder="Direct quotation or transcript excerpt..."
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsAddEvidenceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="bg-[#3366cc] text-white"
                >
                  Save Evidence Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Claim */}
      {isAddClaimModalOpen && selectedInv && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif text-lg font-bold text-[#101418]">
                Add &amp; Map Claim to "{selectedInv.title}"
              </h3>
              <button
                type="button"
                onClick={() => setIsAddClaimModalOpen(false)}
                className="text-[#54595d] hover:text-[#101418] text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddClaim} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#101418] mb-1">Claim Subject / Topic *</label>
                <input
                  type="text"
                  required
                  value={claimForm.subject}
                  onChange={(e) => setClaimForm({ ...claimForm, subject: e.target.value })}
                  placeholder="e.g. Mechanics of Fund Siphoning"
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Claim Statement *</label>
                <textarea
                  required
                  rows={2}
                  value={claimForm.statement}
                  onChange={(e) => setClaimForm({ ...claimForm, statement: e.target.value })}
                  placeholder="Specific factual or controversial claim asserted..."
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Claim Status</label>
                  <select
                    value={claimForm.status}
                    onChange={(e) => setClaimForm({ ...claimForm, status: e.target.value as ClaimStatus })}
                    className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs bg-[#ffffff]"
                  >
                    <option value="confirmed">Confirmed (Solid primary evidence)</option>
                    <option value="supported">Supported (Strong corroboration)</option>
                    <option value="disputed">Disputed (Conflicting evidence)</option>
                    <option value="unverified">Unverified (Pending proof)</option>
                    <option value="refuted">Refuted (Proven false)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Confidence Score (0-100%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={claimForm.confidenceScore}
                    onChange={(e) => setClaimForm({ ...claimForm, confidenceScore: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Epistemic Rationale &amp; Analysis</label>
                <textarea
                  rows={2}
                  value={claimForm.epistemicRationale}
                  onChange={(e) => setClaimForm({ ...claimForm, epistemicRationale: e.target.value })}
                  placeholder="Justification for verdict, referencing specific records or contradictions..."
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              {/* Linked Evidence Selector */}
              {selectedInv.evidence && selectedInv.evidence.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Link Evidence Artifacts</label>
                  <div className="space-y-1 max-h-36 overflow-y-auto border p-2 rounded-sm bg-[#f8f9fa]">
                    {selectedInv.evidence.map((evi) => {
                      const isLinked = claimForm.linkedEvidenceIds.includes(evi.id);
                      return (
                        <label key={evi.id} className="flex items-center gap-2 text-xs cursor-pointer p-1 hover:bg-[#ffffff] rounded-xs">
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setClaimForm({ ...claimForm, linkedEvidenceIds: [...claimForm.linkedEvidenceIds, evi.id] });
                              } else {
                                setClaimForm({ ...claimForm, linkedEvidenceIds: claimForm.linkedEvidenceIds.filter(id => id !== evi.id) });
                              }
                            }}
                          />
                          <span className="font-mono text-[11px] text-[#101418]">{evi.title}</span>
                          <span className="text-[10px] text-[#54595d]">({evi.source})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsAddClaimModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="bg-[#3366cc] text-white"
                >
                  Save Claim
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Verify Claim */}
      {isVerifyClaimModalOpen && selectedClaimForVerify && selectedInv && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif text-lg font-bold text-[#101418]">
                Verify Claim &amp; Record Epistemic Verdict
              </h3>
              <button
                type="button"
                onClick={() => setIsVerifyClaimModalOpen(false)}
                className="text-[#54595d] hover:text-[#101418] text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleVerifyClaimSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm font-serif text-sm text-[#101418]">
                "{selectedClaimForVerify.statement}"
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Verification Status *</label>
                <select
                  value={verifyForm.status}
                  onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value as ClaimStatus })}
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs bg-[#ffffff] font-bold"
                >
                  <option value="confirmed">Confirmed (Supported by unequivocal evidence)</option>
                  <option value="supported">Supported (Strong corroborating material)</option>
                  <option value="disputed">Disputed (Contradictory evidence)</option>
                  <option value="unverified">Unverified (Pending proof)</option>
                  <option value="refuted">Refuted (Disproven by facts)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#101418] mb-1">Epistemic Rationale *</label>
                <textarea
                  required
                  rows={3}
                  value={verifyForm.epistemicRationale}
                  onChange={(e) => setVerifyForm({ ...verifyForm, epistemicRationale: e.target.value })}
                  placeholder="Describe the evidentiary consensus, contradictory findings, or lack of proof..."
                  className="w-full p-2 border border-[#a2a9b1] rounded-sm text-xs"
                />
              </div>

              {/* Linked Evidence Checkboxes */}
              {selectedInv.evidence && selectedInv.evidence.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#101418] mb-1">Linked Evidence Proof</label>
                  <div className="space-y-1 max-h-36 overflow-y-auto border p-2 rounded-sm bg-[#f8f9fa]">
                    {selectedInv.evidence.map((evi) => {
                      const isLinked = verifyForm.linkedEvidenceIds.includes(evi.id);
                      return (
                        <label key={evi.id} className="flex items-center gap-2 text-xs cursor-pointer p-1 hover:bg-[#ffffff] rounded-xs">
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVerifyForm({ ...verifyForm, linkedEvidenceIds: [...verifyForm.linkedEvidenceIds, evi.id] });
                              } else {
                                setVerifyForm({ ...verifyForm, linkedEvidenceIds: verifyForm.linkedEvidenceIds.filter(id => id !== evi.id) });
                              }
                            }}
                          />
                          <span className="font-mono text-[11px] text-[#101418]">{evi.title}</span>
                          <span className="text-[10px] text-[#54595d]">({evi.source})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsVerifyClaimModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="bg-[#3366cc] text-white"
                >
                  Record Verdict
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
