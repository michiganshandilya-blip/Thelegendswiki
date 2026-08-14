import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { UserProfile, UserRole } from '../types';
import { getUserByUsername } from '../services/userService';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import {
  User,
  Shield,
  Calendar,
  BookOpen,
  Award,
  Clock,
  ArrowLeft,
  ExternalLink,
  PlusCircle,
  FileText,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { formatDisplayDate } from '../lib/timestamps';

interface UserProfilePageProps {
  username: string;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ username }) => {
  const { userProfile: authProfile, currentUser } = useAuth();
  const { navigate } = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  const isOwnProfile =
    authProfile?.username?.toLowerCase() === username?.toLowerCase() ||
    (currentUser && profile?.id === currentUser.uid);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const data = await getUserByUsername(username);
        if (!isMounted) return;

        if (data) {
          setProfile(data);
        } else if (authProfile && authProfile.username?.toLowerCase() === username.toLowerCase()) {
          setProfile(authProfile);
        } else {
          // Check if it's demo scholar
          if (username.toLowerCase() === 'demo_scholar') {
            setProfile({
              id: 'demo-scholar-id',
              username: 'demo_scholar',
              displayName: 'Dr. Marcus Vance',
              email: 'scholar@thelegendswiki.org',
              role: 'editor',
              bio: 'Senior archivist specializing in Classical Antiquity, lost civilizations, and Alexandrian records.',
              createdAt: '2024-01-15T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z',
            });
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.warn('Error fetching profile:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [username, authProfile]);

  if (loading) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center space-y-4 py-12">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
          <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Querying Scholar Profile...
        </span>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-6">
        <Breadcrumbs
          items={[
            { label: 'Researchers', path: '/' },
            { label: `@${username || 'unknown'}` },
          ]}
        />
        <div className="bg-[#0e1424] border border-slate-800 rounded-sm p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-sm bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
            <User size={22} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-slate-100 font-display">
              Scholar Not Found
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No registered contributor with the handle <strong className="text-slate-200">@{username}</strong> exists in the archival codex.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/')}
              icon={<ArrowLeft size={15} />}
            >
              Return to Codex
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const roleStyles: Record<UserRole, { badge: string; border: string; label: string; text: string }> = {
    guest: {
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      border: 'border-slate-700',
      label: 'Guest Reader',
      text: 'text-slate-400',
    },
    registered_user: {
      badge: 'bg-blue-950 text-blue-300 border-blue-600/40',
      border: 'border-blue-500/40',
      label: 'Registered Scholar',
      text: 'text-blue-400',
    },
    editor: {
      badge: 'bg-amber-950 text-amber-300 border-amber-500/40',
      border: 'border-amber-500/40',
      label: 'Archival Editor',
      text: 'text-amber-400',
    },
    administrator: {
      badge: 'bg-indigo-950 text-indigo-300 border-indigo-500/40',
      border: 'border-indigo-500/40',
      label: 'Registry Administrator',
      text: 'text-indigo-400',
    },
  };

  const roleConfig = roleStyles[profile.role] || roleStyles.registered_user;
  const initial = (profile.displayName || profile.username || 'S').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <Breadcrumbs
        items={[
          { label: 'Researchers', path: '/' },
          { label: profile.displayName || `@${profile.username}` },
        ]}
      />

      {/* Main Profile Header Card */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-sm p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm object-cover border-2 border-slate-700 shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 border-2 border-blue-500/40 flex items-center justify-center text-white text-3xl font-bold font-legend shadow-xl">
                {initial}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0e1424]" title="Active Account" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-display truncate">
                {profile.displayName}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-sm border ${roleConfig.badge}`}
              >
                <Shield size={11} />
                {roleConfig.label}
              </span>
              {isOwnProfile && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-sm border border-emerald-500/30">
                  Your Account
                </span>
              )}
            </div>

            <p className="text-xs font-mono text-slate-400">
              @{profile.username}
            </p>

            {profile.bio && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed pt-1">
                {profile.bio}
              </p>
            )}

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 font-mono">
              <div className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-400" />
                <span>Member since {formatDisplayDate(profile.createdAt)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Verified Contributor</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button for Authenticated Owner */}
          {isOwnProfile && (
            <div className="shrink-0 pt-2 sm:pt-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/create')}
                icon={<PlusCircle size={14} />}
              >
                Create Article
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Public Contributions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#0e1424] border border-slate-800 rounded-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-blue-400" />
                Authored Articles & Entries
              </h2>
              <span className="text-[10px] font-mono text-slate-500">
                Live Archival Records
              </span>
            </div>

            {/* Public contribution count placeholder */}
            <div className="p-6 bg-[#121829] border border-slate-800/80 rounded-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-sm bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <FileText size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">
                  Contribution Telemetry Foundation
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Real-time authored articles and live revision history sync will be aggregated dynamically as articles are authored and peer-reviewed in the next development phase.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/category/all')}
                  className="text-xs"
                >
                  Browse Encyclopedia Articles
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Account Stats & Badges */}
        <div className="space-y-6">
          <div className="bg-[#0e1424] border border-slate-800 rounded-sm p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award size={16} className="text-indigo-400" />
              Archival Credentials
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#121829] border border-slate-800/80 rounded-sm flex items-center justify-between">
                <span className="text-slate-400">Account Role</span>
                <span className="font-semibold text-slate-200 capitalize font-mono text-[11px]">
                  {profile.role.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3 bg-[#121829] border border-slate-800/80 rounded-sm flex items-center justify-between">
                <span className="text-slate-400">Archival Clearance</span>
                <span className="font-semibold text-emerald-400 font-mono text-[11px]">
                  Level {profile.role === 'administrator' ? '4 (Full)' : profile.role === 'editor' ? '3 (Curator)' : '2 (Author)'}
                </span>
              </div>

              <div className="p-3 bg-[#121829] border border-slate-800/80 rounded-sm flex items-center justify-between">
                <span className="text-slate-400">Peer Trust Index</span>
                <span className="font-semibold text-blue-400 font-mono text-[11px]">
                  100% Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
