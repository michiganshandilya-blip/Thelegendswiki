import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { UserProfile, UserRole, Article } from '../types';
import { 
  getUserByUsername, 
  getUserByIdOrHandle, 
  ensureUserProfile, 
  normalizeHandle, 
  formatDisplayHandle 
} from '../services/userService';
import { 
  uploadUserAvatar, 
  validateImageUpload, 
  deleteUserAvatar,
  fastCompressImage 
} from '../services/storageService';
import { getUserArticles } from '../services/articleService';
import { withTimeout } from '../lib/asyncUtils';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import {
  User,
  Shield,
  ShieldCheck,
  Calendar,
  BookOpen,
  Award,
  ArrowLeft,
  PlusCircle,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Edit3,
  ExternalLink,
  Mail,
  RefreshCw,
  AlertTriangle,
  LogIn,
  Camera,
  Upload,
  Trash2,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import { formatDisplayDate } from '../lib/timestamps';

interface UserProfilePageProps {
  username?: string;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ username = '' }) => {
  const { 
    userProfile: authProfile, 
    currentUser, 
    loading: authLoading, 
    isSuperAdmin,
    updateUserPhoto,
    updateProfileData
  } = useAuth();
  const { navigate } = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authoredArticles, setAuthoredArticles] = useState<Article[]>([]);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [articlesLoading, setArticlesLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Avatar Upload Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit State
  const [editProfileOpen, setEditProfileOpen] = useState<boolean>(false);
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);

  const cleanHandleParam = normalizeHandle(username);
  const lastFetchedKeyRef = useRef<string>('');

  const handleRetry = () => {
    setErrorMessage(null);
    setNotFound(false);
    setPageLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  // Main Profile Resolution Effect
  useEffect(() => {
    let isCancelled = false;
    const fetchKey = `${cleanHandleParam}_${currentUser?.uid || 'guest'}_${authProfile?.id || ''}_${retryKey}`;

    if (lastFetchedKeyRef.current === fetchKey && profile && !errorMessage) {
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setErrorMessage(null);
    setNotFound(false);

    const failsafeTimer = setTimeout(() => {
      if (!isCancelled) {
        setPageLoading((currentLoading) => {
          if (currentLoading) {
            if (authProfile) {
              setProfile(authProfile);
              return false;
            }
            setErrorMessage('The contributor registry request timed out. Please retry.');
            return false;
          }
          return false;
        });
      }
    }, 4500);

    const resolveContributorProfile = async () => {
      try {
        if (authLoading) {
          return;
        }

        const isDirectDashboard = !cleanHandleParam || cleanHandleParam === 'me' || cleanHandleParam === 'profile' || cleanHandleParam === 'profile-dashboard';

        if (isDirectDashboard) {
          if (currentUser) {
            const guaranteedProfile = authProfile || await withTimeout(
              ensureUserProfile(currentUser),
              3500,
              null
            );

            if (isCancelled) return;

            if (guaranteedProfile) {
              setProfile(guaranteedProfile);
              setEditDisplayName(guaranteedProfile.displayName);
              setEditBio(guaranteedProfile.bio || '');
              lastFetchedKeyRef.current = fetchKey;
            } else {
              setNotFound(true);
            }
          } else {
            setProfile(null);
          }
        } else {
          const loadedUser = await withTimeout(
            getUserByIdOrHandle(cleanHandleParam),
            3500,
            null
          );

          if (isCancelled) return;

          if (loadedUser) {
            setProfile(loadedUser);
            setEditDisplayName(loadedUser.displayName);
            setEditBio(loadedUser.bio || '');
            lastFetchedKeyRef.current = fetchKey;
          } else {
            if (currentUser && (cleanHandleParam === normalizeHandle(currentUser.displayName) || cleanHandleParam === currentUser.uid)) {
              const own = authProfile || await ensureUserProfile(currentUser);
              if (isCancelled) return;
              setProfile(own);
              setEditDisplayName(own.displayName);
              setEditBio(own.bio || '');
              lastFetchedKeyRef.current = fetchKey;
            } else {
              setNotFound(true);
            }
          }
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('Error resolving user profile:', err);
        if (authProfile) {
          setProfile(authProfile);
        } else {
          setErrorMessage('Could not load profile. Please verify your connection.');
        }
      } finally {
        if (!isCancelled) {
          clearTimeout(failsafeTimer);
          setPageLoading(false);
        }
      }
    };

    resolveContributorProfile();

    return () => {
      isCancelled = true;
      clearTimeout(failsafeTimer);
    };
  }, [cleanHandleParam, currentUser, authProfile, authLoading, retryKey]);

  // Load Authored Articles
  useEffect(() => {
    let isCancelled = false;

    const fetchArticles = async () => {
      if (!profile?.id) {
        setAuthoredArticles([]);
        return;
      }

      try {
        setArticlesLoading(true);
        const docs = await withTimeout(
          getUserArticles(profile.id),
          4000,
          []
        );
        if (!isCancelled) {
          setAuthoredArticles(docs);
        }
      } catch (err) {
        console.warn('Error loading user articles:', err);
      } finally {
        if (!isCancelled) {
          setArticlesLoading(false);
        }
      }
    };

    fetchArticles();

    const handleRoleChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; newRole: UserRole; user?: UserProfile }>;
      if (customEvent.detail && profile && customEvent.detail.userId === profile.id) {
        setProfile((prev) => (prev ? { ...prev, role: customEvent.detail.newRole } : null));
      }
    };

    const handleAvatarUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; photoURL: string }>;
      if (customEvent.detail && profile && customEvent.detail.userId === profile.id) {
        setProfile((prev) => (prev ? { ...prev, photoURL: customEvent.detail.photoURL } : null));
      }
    };

    window.addEventListener('thelegendswiki:user-role-changed', handleRoleChanged);
    window.addEventListener('thelegendswiki:user-avatar-updated', handleAvatarUpdated);

    return () => {
      isCancelled = true;
      window.removeEventListener('thelegendswiki:user-role-changed', handleRoleChanged);
      window.removeEventListener('thelegendswiki:user-avatar-updated', handleAvatarUpdated);
    };
  }, [profile?.id]);

  // Handle Image File Selection with instantaneous preview and pre-compression
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoUploadError(null);
    setPhotoUploadSuccess(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log('[Avatar] File selected:', file.name, file.type, file.size);

    const validation = validateImageUpload(file);
    if (!validation.isValid) {
      console.error('[Avatar] ERROR at file validation:', validation.error);
      setPhotoUploadError(validation.error || 'Invalid image file.');
      return;
    }
    console.log('[Avatar] File validation passed');

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setSelectedImageFile(file);

    // Pre-compress in background for zero-latency save
    try {
      const { dataUrl } = await fastCompressImage(file, 256, 0.84);
      if (dataUrl) {
        setImagePreviewUrl(dataUrl);
      }
    } catch (err) {
      console.warn('[Avatar] Pre-compression warning:', err);
    }
  };

  // Upload and Save Avatar with diagnostic pipeline and non-hanging failsafe
  const handleSaveAvatar = async () => {
    if (!selectedImageFile) {
      setPhotoUploadError('Please choose an image file first.');
      return;
    }

    const targetUid = currentUser?.uid || profile?.id;
    if (!targetUid) {
      setPhotoUploadError('Authentication required to save profile photo.');
      return;
    }

    console.log('[Avatar] Upload started for scholar:', targetUid);

    try {
      setIsUploadingPhoto(true);
      setPhotoUploadError(null);
      setPhotoUploadSuccess(null);

      const uploadWorkflow = async () => {
        console.log('[Avatar] Processing image compression and upload...');
        const { downloadUrl } = await uploadUserAvatar(targetUid, selectedImageFile);
        
        console.log('[Avatar] Updating user profile in database and context...');
        const res = await updateUserPhoto(downloadUrl);

        if (!res.success) {
          console.error('[Avatar] ERROR at user profile update:', res.error);
          throw new Error(res.error || 'Failed to update user profile with new photo.');
        }

        console.log('[Avatar] User profile updated');
        // Update local profile state immediately
        setProfile((prev) => (prev ? { ...prev, photoURL: downloadUrl } : null));

        console.log('[Avatar] Avatar upload completed');
        setPhotoUploadSuccess('Profile photo updated successfully.');

        setTimeout(() => {
          setPhotoModalOpen(false);
          setSelectedImageFile(null);
          setImagePreviewUrl(null);
          setPhotoUploadSuccess(null);
        }, 500);
      };

      // Failsafe timeout prevents any infinite loading screen
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Avatar upload timed out. Please try again.')), 10000)
      );

      await Promise.race([uploadWorkflow(), timeoutPromise]);
    } catch (err: any) {
      console.error('[Avatar] ERROR at avatar upload workflow:', err);
      setPhotoUploadError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      console.log('[Avatar] Uploading state reset to false');
    }
  };

  // Remove Avatar
  const handleRemoveAvatar = async () => {
    if (!profile?.id) return;

    try {
      setIsUploadingPhoto(true);
      setPhotoUploadError(null);

      await updateUserPhoto('');
      setProfile((prev) => (prev ? { ...prev, photoURL: '' } : null));

      setPhotoUploadSuccess('Profile photo removed.');
      setTimeout(() => {
        setPhotoModalOpen(false);
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        setPhotoUploadSuccess(null);
      }, 1000);
    } catch (err: any) {
      setPhotoUploadError(err.message || 'Failed to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save Profile Details (Name, Bio)
  const handleSaveProfileDetails = async () => {
    if (!profile?.id) return;

    try {
      setSavingProfile(true);
      setProfileSaveMessage(null);

      const updates: Partial<UserProfile> = {
        displayName: editDisplayName.trim() || profile.displayName,
        bio: editBio.trim(),
      };

      await updateProfileData(updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));

      setProfileSaveMessage('Profile saved.');
      setTimeout(() => {
        setEditProfileOpen(false);
        setProfileSaveMessage(null);
      }, 1200);
    } catch (err: any) {
      setProfileSaveMessage('Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Loading State
  if (pageLoading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <Breadcrumbs items={[{ label: 'Encyclopedia Registry', path: '/' }, { label: 'Scholar Profile' }]} />
        <LoadingState type="article" />
      </div>
    );
  }

  // Not Logged In State for Direct Profile Route
  if (!profile && (!cleanHandleParam || cleanHandleParam === 'me' || cleanHandleParam === 'profile')) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-[#ffffff] border border-[#a2a9b1] rounded-sm text-center space-y-5 shadow-xs">
        <div className="w-14 h-14 bg-blue-50 text-[#3366cc] rounded-full flex items-center justify-center mx-auto border border-blue-200">
          <User size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-serif text-[#101418]">Scholar Account Portal</h2>
          <p className="text-xs text-[#54595d] font-sans">
            Please authenticate to view your personal contributor profile, peer reviews, and authored entries.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/login')}
            icon={<LogIn size={15} />}
            className="w-full justify-center"
          >
            Sign In to Account
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/register')}
            className="w-full justify-center"
          >
            Register Contributor Account
          </Button>
        </div>
      </div>
    );
  }

  // Profile Not Found
  if (notFound || (!profile && !errorMessage)) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <Breadcrumbs items={[{ label: 'Encyclopedia Registry', path: '/' }, { label: 'Scholar Profile' }]} />
        <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-[#101418]">Contributor Not Found</h2>
            <p className="text-xs text-[#54595d] max-w-md mx-auto">
              No registered scholar dossier exists for handle: <span className="font-mono font-bold text-[#101418]">@{cleanHandleParam}</span>
            </p>
          </div>
          <div className="pt-3 flex justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/')}
              icon={<ArrowLeft size={14} />}
            >
              Return to Codex
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRetry}
              icon={<RefreshCw size={14} />}
            >
              Retry Registry Query
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage && !profile) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <Breadcrumbs items={[{ label: 'Encyclopedia Registry', path: '/' }, { label: 'Scholar Profile' }]} />
        <div className="bg-[#ffffff] border border-red-300 rounded-sm p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-[#101418]">Registry Connection Issue</h2>
            <p className="text-xs text-[#54595d] max-w-md mx-auto">{errorMessage}</p>
          </div>
          <div className="pt-3 flex justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRetry}
              icon={<RefreshCw size={14} />}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser && (currentUser.uid === profile.id || currentUser.email?.toLowerCase() === profile.email?.toLowerCase());
  const initial = profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'S';
  const profileDisplayHandle = formatDisplayHandle(profile.username);

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          avatarBg: 'bg-amber-700 text-white',
          title: 'System Super Administrator',
        };
      case 'admin':
      case 'administrator':
      case 'editor':
        return {
          label: 'Admin Curator',
          badge: 'bg-blue-50 text-[#3366cc] border-blue-200 font-bold',
          avatarBg: 'bg-[#3366cc] text-white',
          title: 'Editorial Peer Reviewer',
        };
      case 'registered_user':
      case 'user':
      default:
        return {
          label: 'Scholar Contributor',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          avatarBg: 'bg-[#3366cc] text-white',
          title: 'Registered Contributor',
        };
    }
  };

  const roleConfig = getRoleConfig(profile.role);
  const displayedArticles = authoredArticles.length > 0 ? authoredArticles : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Encyclopedia Registry', path: '/' },
          { label: `Scholar: ${profile.displayName}` },
        ]}
      />

      {/* Main Profile Header Card */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 shadow-xs relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar with Upload Trigger */}
          <div className="relative shrink-0 group">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm object-cover border-2 border-[#eaecf0] shadow-xs"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm bg-[#f8f9fa] border-2 border-[#cbd5e1] flex items-center justify-center text-[#3366cc] text-3xl font-bold font-serif shadow-xs">
                {initial}
              </div>
            )}

            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedImageFile(null);
                  setImagePreviewUrl(null);
                  setPhotoUploadError(null);
                  setPhotoUploadSuccess(null);
                  setPhotoModalOpen(true);
                }}
                className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-full border-2 border-white shadow-sm cursor-pointer transition-transform group-hover:scale-110"
                title="Change profile photo"
              >
                <Camera size={13} />
              </button>
            )}

            <div 
              className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" 
              title="Verified Contributor" 
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#101418] font-serif truncate">
                {profile.displayName}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-sm border ${roleConfig.badge}`}
              >
                <Shield size={11} />
                {roleConfig.label}
              </span>
              {isOwnProfile && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                  Your Account
                </span>
              )}
            </div>

            <p className="text-xs font-mono text-[#72777d]">
              {profileDisplayHandle}
            </p>

            {profile.bio && (
              <p className="text-xs sm:text-sm text-[#54595d] max-w-2xl leading-relaxed pt-1 font-sans">
                {profile.bio}
              </p>
            )}

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#72777d] pt-2 font-mono">
              <div className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-[#3366cc]" />
                <span>Member since {formatDisplayDate(profile.createdAt)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Verified Contributor</span>
              </div>
              {profile.email && isOwnProfile && (
                <div className="inline-flex items-center gap-1.5 text-[#54595d]">
                  <Mail size={13} className="text-[#64748b]" />
                  <span>{profile.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Authenticated Owner */}
          {isOwnProfile && (
            <div className="shrink-0 pt-2 sm:pt-0 flex flex-wrap sm:flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedImageFile(null);
                  setImagePreviewUrl(null);
                  setPhotoUploadError(null);
                  setPhotoUploadSuccess(null);
                  setPhotoModalOpen(true);
                }}
                icon={<Camera size={13} />}
                className="text-xs"
              >
                Change Photo
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditProfileOpen(true)}
                icon={<Edit3 size={13} />}
                className="text-xs"
              >
                Edit Bio
              </Button>

              {isSuperAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/super-admin')}
                  icon={<ShieldCheck size={14} />}
                  className="bg-amber-800 hover:bg-amber-900 border-amber-700 text-white font-mono font-bold text-xs"
                >
                  Super Admin
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Authored Articles & Contributions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <h2 className="text-sm font-bold text-[#101418] uppercase tracking-wider flex items-center gap-2 font-serif">
                <BookOpen size={16} className="text-[#3366cc]" />
                Authored Articles &amp; Entries ({displayedArticles.length})
              </h2>
              <span className="text-[10px] font-mono text-[#72777d]">
                Archival Records
              </span>
            </div>

            {articlesLoading ? (
              <LoadingState type="article" />
            ) : displayedArticles.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <FileText size={32} className="mx-auto text-[#a2a9b1]" />
                <p className="text-xs text-[#54595d]">
                  No authored articles recorded for this scholar yet.
                </p>
                {isOwnProfile && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/create')}
                    icon={<PlusCircle size={14} />}
                    className="mx-auto text-xs"
                  >
                    Draft First Dossier
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedArticles.map((art) => (
                  <div
                    key={art.id || art.slug}
                    className="p-4 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm hover:border-[#3366cc] transition-all space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/wiki/${art.slug}`)}
                        className="font-serif font-bold text-sm text-[#101418] hover:text-[#3366cc] hover:underline text-left cursor-pointer"
                      >
                        {art.title}
                      </button>

                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                          art.status === 'published'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : art.status === 'pending_review'
                            ? 'bg-blue-50 text-[#3366cc] border-blue-200'
                            : art.status === 'changes_requested'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : art.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {art.status || 'published'}
                      </span>
                    </div>

                    <p className="text-xs text-[#54595d] line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#eaecf0] text-[11px] font-mono text-[#72777d]">
                      <span>Category: <strong className="text-[#3366cc]">{art.category}</strong></span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye size={11} /> {art.viewCount || art.views || 0}
                        </span>
                        <span>{formatDisplayDate(art.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Contributor Dossier & Badges */}
        <div className="space-y-6">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#101418] uppercase tracking-wider flex items-center gap-2 border-b border-[#eaecf0] pb-3 font-serif">
              <Award size={16} className="text-amber-600" />
              Scholarly Credentials
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm flex items-center justify-between">
                <span className="text-[#54595d]">Published Works</span>
                <span className="font-mono font-bold text-sm text-[#101418]">
                  {displayedArticles.filter((a) => a.status === 'published').length}
                </span>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm flex items-center justify-between">
                <span className="text-[#54595d]">Clearance Tier</span>
                <span className="font-mono font-bold text-xs uppercase text-[#3366cc]">
                  {profile.role.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm flex items-center justify-between">
                <span className="text-[#54595d]">Account Status</span>
                <span className="font-mono font-bold text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          MODAL: CHANGE PROFILE PHOTO
          ================================================== */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <h3 className="font-serif font-bold text-base text-[#101418] flex items-center gap-2">
                <Camera size={18} className="text-[#3366cc]" />
                <span>Change Profile Photo</span>
              </h3>
              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                className="text-[#72777d] hover:text-[#101418] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notifications inside modal */}
            {photoUploadError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{photoUploadError}</span>
              </div>
            )}

            {photoUploadSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{photoUploadSuccess}</span>
              </div>
            )}

            {/* Preview Box */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#f8f9fa] border-2 border-dashed border-[#cbd5e1] rounded-sm space-y-3">
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Avatar preview"
                  className="w-28 h-28 rounded-sm object-cover border-2 border-[#3366cc] shadow-xs"
                />
              ) : profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-28 h-28 rounded-sm object-cover border border-[#cbd5e1] shadow-xs"
                />
              ) : (
                <div className="w-28 h-28 rounded-sm bg-white border border-[#cbd5e1] flex items-center justify-center text-[#3366cc] text-4xl font-bold font-serif shadow-xs">
                  {initial}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Upload size={13} />
                  <span>Choose Image File</span>
                </button>
              </div>

              <p className="text-[11px] text-[#72777d] text-center font-mono">
                Formats: JPG, PNG, WebP, GIF (Max 5MB)
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#eaecf0]">
              {profile.photoURL ? (
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={handleRemoveAvatar}
                  className="text-xs text-red-600 hover:text-red-800 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Trash2 size={13} />
                  <span>Remove Avatar</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedImageFile || isUploadingPhoto}
                  onClick={handleSaveAvatar}
                  className={`px-4 py-1.5 rounded-sm text-xs font-semibold text-white shadow-xs cursor-pointer ${
                    !selectedImageFile || isUploadingPhoto
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-[#3366cc] hover:bg-[#2557bb]'
                  }`}
                >
                  {isUploadingPhoto ? 'Uploading...' : 'Save Avatar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL: EDIT PROFILE DETAILS
          ================================================== */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <h3 className="font-serif font-bold text-base text-[#101418] flex items-center gap-2">
                <Edit3 size={18} className="text-[#3366cc]" />
                <span>Edit Profile Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="text-[#72777d] hover:text-[#101418] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {profileSaveMessage && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={14} />
                <span>{profileSaveMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#101418]">Display Name</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-white border border-[#a2a9b1] rounded-sm p-2 text-xs text-[#101418] focus:outline-none focus:border-[#3366cc]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#101418]">Scholarly Biography</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Specialization, historical focus, or research interests..."
                  className="w-full bg-white border border-[#a2a9b1] rounded-sm p-2 text-xs text-[#101418] focus:outline-none focus:border-[#3366cc]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingProfile}
                onClick={handleSaveProfileDetails}
                className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold shadow-xs cursor-pointer"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
