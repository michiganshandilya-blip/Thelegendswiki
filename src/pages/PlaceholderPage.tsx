import React from 'react';
import { useRouter } from '../context/RouterContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { FileEdit, PlusCircle, ShieldAlert, User, Clock, ArrowLeft } from 'lucide-react';

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
          icon: <PlusCircle size={24} className="text-[#3366cc]" />,
          phase: 'Contribution System Active',
          description:
            'Use the visual article editor, citation manager, and publication workflow to submit new articles for peer review.',
          activeScope: 'The core contributor tools are enabled for registered accounts.',
        };
      case 'edit':
        return {
          title: `Article Editor: ${slug || 'Entry'}`,
          subtitle: 'Collaborative Revision & Editing',
          icon: <FileEdit size={24} className="text-[#3366cc]" />,
          phase: 'Editing Workflow Active',
          description:
            `The article editor and revision workflow for "${slug}" allows structured section editing and citation maintenance.`,
          activeScope: 'The encyclopedia routing structure recognizes dynamic article slugs.',
        };
      case 'user':
        return {
          title: `Contributor Profile: ${username || 'Member'}`,
          subtitle: 'User Account & Contribution History',
          icon: <User size={24} className="text-[#3366cc]" />,
          phase: 'User Account Profile',
          description:
            'User identity verification, contribution metrics, and edit history are linked to your registered profile.',
          activeScope: 'The platform profile routing is established.',
        };
      case 'admin':
        return {
          title: 'Administration & Registry Governance',
          subtitle: 'System Control & Moderation Panel',
          icon: <ShieldAlert size={24} className="text-[#3366cc]" />,
          phase: 'Governance Target',
          description:
            'The administrative moderation queue, permission management, and content review pipeline manage the encyclopedia database.',
          activeScope: 'Protected administrative routes are mapped in the application router.',
        };
    }
  };

  const details = getPageDetails();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: details.title }]} />

      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 space-y-6 shadow-xs relative">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm shrink-0 shadow-xs">
            {details.icon}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200 mb-1">
              <Clock size={11} /> {details.phase}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418] leading-tight">
              {details.title}
            </h1>
            <p className="text-xs text-[#54595d] font-sans mt-0.5">
              {details.subtitle}
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-xs sm:text-sm text-[#202122] space-y-3 leading-relaxed font-sans">
          <p>{details.description}</p>
          <div className="pt-2 border-t border-[#eaecf0] text-xs text-[#54595d]">
            <span><strong className="text-[#101418]">Status:</strong> {details.activeScope}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={14} />}
          >
            Return to Main Page
          </Button>
          <Button
            variant="secondary"
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
