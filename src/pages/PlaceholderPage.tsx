import React from 'react';
import { useRouter } from '../context/RouterContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { FileEdit, PlusCircle, ShieldAlert, User, Clock, ArrowLeft, Layers, Terminal } from 'lucide-react';

interface PlaceholderPageProps {
  type: 'create' | 'edit' | 'user' | 'admin';
  slug?: string;
  username?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ type, slug, username }) => {
  const { navigate } = useRouter();

  const getPageDetails = () => {
    switch (type) {
      case 'create':
        return {
          title: 'Article Creation Workspace',
          subtitle: 'Create a New Knowledge Entry',
          icon: <PlusCircle size={24} className="text-sky-400" />,
          phase: 'Phase 2 Architecture Target',
          description:
            'The structured visual article editor, citation manager, and publication workflow will be implemented in Phase 2 alongside database storage and revision control.',
          activeScope: 'The core navigation and typography foundations are fully operational.',
        };
      case 'edit':
        return {
          title: `Article Editor: ${slug || 'Entry'}`,
          subtitle: 'Collaborative Revision & Editing',
          icon: <FileEdit size={24} className="text-sky-400" />,
          phase: 'Phase 2 Architecture Target',
          description:
            `The inline markdown/rich article editor and revision diff viewer for "${slug}" will connect to persistent storage in upcoming phases.`,
          activeScope: 'The encyclopedia routing structure recognizes dynamic article slugs.',
        };
      case 'user':
        return {
          title: `Contributor Profile: ${username || 'Member'}`,
          subtitle: 'User Account & Contribution History',
          icon: <User size={24} className="text-sky-400" />,
          phase: 'Phase 2 Authentication Target',
          description:
            'User identity verification, contribution metrics, and edit history will be integrated in Phase 2 with secure authentication.',
          activeScope: 'The platform profile routing is established.',
        };
      case 'admin':
        return {
          title: 'Administration & Registry Governance',
          subtitle: 'System Control & Moderation Panel',
          icon: <ShieldAlert size={24} className="text-sky-400" />,
          phase: 'Phase 3 Administration Target',
          description:
            'The administrative moderation queue, permission management, and content review pipeline will be provisioned in later phases.',
          activeScope: 'Protected administrative routes are mapped in the application router.',
        };
    }
  };

  const details = getPageDetails();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: details.title }]} />

      <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-6 sm:p-8 space-y-6 shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 bg-[#141c2e] border border-slate-700/60 rounded-sm shrink-0 shadow-md">
            {details.icon}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-sm border border-sky-500/30 mb-1">
              <Clock size={11} /> {details.phase}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
              {details.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {details.subtitle}
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#141c2e] border border-slate-700/60 rounded-sm text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed relative z-10">
          <p>{details.description}</p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <Terminal size={13} className="text-sky-400" />
            <span><strong className="text-slate-200">Phase 1 Foundation:</strong> {details.activeScope}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 relative z-10">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={14} />}
          >
            Return to Main Registry
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/category/all')}
          >
            Browse Disciplines
          </Button>
        </div>
      </div>
    </div>
  );
};
