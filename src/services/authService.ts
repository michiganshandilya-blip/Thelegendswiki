import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';
import { createUserProfile, getUserById, isUsernameAvailable, ensureUserProfile, normalizeHandle, DESIGNATED_SUPER_ADMIN_EMAIL } from './userService';

export interface AuthResult {
  user: User | null;
  profile: UserProfile | null;
  error?: string;
  isProviderDisabled?: boolean;
}

let recaptchaVerifierInstance: RecaptchaVerifier | null = null;

/**
 * Maps raw Firebase authentication errors into clear, friendly, and actionable messages.
 */
export function formatAuthError(
  error: any,
  provider: 'email' | 'google' | 'apple' | 'phone' = 'email'
): { message: string; isProviderDisabled?: boolean } {
  if (!error) return { message: 'An unknown authentication error occurred.' };

  const code = error?.code || '';
  const rawMsg = error?.message || '';

  if (code === 'auth/operation-not-allowed') {
    const providerName = 
      provider === 'google' ? 'Google' : 
      provider === 'apple' ? 'Apple' : 
      provider === 'phone' ? 'Phone' : 'Email/Password';

    return {
      message: `${providerName} sign-in is currently not enabled in your Firebase project. To enable it, navigate to Firebase Console → Authentication → Sign-in method → ${providerName} → Enable.`,
      isProviderDisabled: true,
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      message: 'The authentication window was closed before completing sign-in.',
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      message: 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
    };
  }

  if (code === 'auth/cancelled-popup-request') {
    return {
      message: 'Authentication request was replaced by another active request.',
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      message: 'This web domain is not authorized for OAuth operations in Firebase Console. Please add this domain to Firebase Console → Authentication → Settings → Authorized domains.',
    };
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return {
      message: 'An account already exists with the same email using a different sign-in method. Please sign in using your existing provider.',
    };
  }

  if (code === 'auth/invalid-phone-number') {
    return {
      message: 'Invalid phone number format. Please ensure international country code prefix is included (e.g. +1 555-0100).',
    };
  }

  if (code === 'auth/missing-phone-number') {
    return {
      message: 'Please provide a valid phone number.',
    };
  }

  if (code === 'auth/invalid-verification-code') {
    return {
      message: 'The 6-digit SMS verification code entered is incorrect. Please check and retry.',
    };
  }

  if (code === 'auth/code-expired') {
    return {
      message: 'The SMS verification code has expired. Please request a new code.',
    };
  }

  if (code === 'auth/billing-not-enabled') {
    return {
      message: 'Real SMS dispatch requires the Firebase Blaze (pay-as-you-go) plan or testing numbers configured in Firebase Console. To test without billing, configure a phone number under Firebase Console → Authentication → Sign-in method → Phone → "Phone numbers for testing" (e.g. +1 650-555-3434 with code 123456).',
      isProviderDisabled: false,
    };
  }

  if (code === 'auth/quota-exceeded') {
    return {
      message: 'SMS verification quota exceeded for this Firebase project. To continue testing, use configured test phone numbers in Firebase Console or switch to email sign-in.',
    };
  }

  if (code === 'auth/captcha-check-failed') {
    return {
      message: 'Anti-abuse reCAPTCHA verification failed. Please try again.',
    };
  }

  if (code === 'auth/invalid-action-code') {
    return {
      message: 'This password reset link is invalid, expired, or has already been used. Please request a new reset link.',
    };
  }

  if (code === 'auth/expired-action-code') {
    return {
      message: 'This password reset link has expired. Please request a new reset link.',
    };
  }

  if (code === 'auth/missing-email') {
    return {
      message: 'Please enter your registered email address.',
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      message: 'This email address is already registered in TheLegendsWiki. Please log in instead.',
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      message: 'Please enter a valid institutional or personal email address.',
    };
  }

  if (code === 'auth/weak-password') {
    return {
      message: 'Password security is too weak. Please use at least 6 characters.',
    };
  }

  if (code === 'auth/user-not-found') {
    return {
      message: 'No registered user account found with this email address.',
    };
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password'
  ) {
    return {
      message: 'Invalid email or password credentials. Please double check and try again.',
    };
  }

  if (code === 'auth/user-disabled') {
    return {
      message: 'This researcher account has been deactivated by registry administrators.',
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      message: 'Access temporarily locked due to consecutive failed attempts. Please try again shortly.',
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      message: 'Network connection failed. Please check your internet connection and try again.',
    };
  }

  // Fallback to cleaner message
  if (rawMsg) {
    const cleanMsg = rawMsg.replace(/^Firebase:\s*/, '').replace(/\s*\([^)]*\)$/, '');
    return { message: cleanMsg || 'Authentication failed. Please verify your details.' };
  }

  return { message: 'Authentication failed. Please try again.' };
}

/**
 * Registers a new researcher with Firebase Auth and creates their Firestore user profile document.
 */
export async function registerWithEmail(
  displayName: string,
  username: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanDisplayName = displayName.trim();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Validate inputs before hitting Firebase
  if (!cleanDisplayName || cleanDisplayName.length < 2) {
    return {
      user: null,
      profile: null,
      error: 'Please enter your full researcher or display name.',
    };
  }

  if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
    return {
      user: null,
      profile: null,
      error: 'Username must be between 3 and 30 characters.',
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return {
      user: null,
      profile: null,
      error: 'Username may only contain letters, numbers, and underscores.',
    };
  }

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return {
      user: null,
      profile: null,
      error: 'Please enter a valid email address.',
    };
  }

  if (!password || password.length < 6) {
    return {
      user: null,
      profile: null,
      error: 'Password must be at least 6 characters long.',
    };
  }

  // 2. Database-backed uniqueness check for username
  const isAvailable = await isUsernameAvailable(cleanUsername);
  if (!isAvailable) {
    return {
      user: null,
      profile: null,
      error: `The username "@${cleanUsername}" is already claimed by another researcher. Please choose a different handle.`,
    };
  }

  // 3. Create Firebase Auth user
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const authUser = userCredential.user;

    // Update display name in Firebase Auth
    try {
      await updateProfile(authUser, {
        displayName: cleanDisplayName,
      });
    } catch (profileErr) {
      console.warn('Could not update Firebase Auth displayName:', profileErr);
    }

    // 4. Create and persist user profile in Firestore
    const cleanHandle = normalizeHandle(cleanUsername) || 'scholar';
    const isSuperAdminEmail = cleanEmail === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();

    // Call ensureUserProfile directly with chosen handle and display name
    // This populates ongoingEnsures so onAuthStateChanged shares the exact same creation promise
    const profile = await ensureUserProfile(
      authUser,
      cleanHandle,
      cleanDisplayName,
      isSuperAdminEmail ? 'super_admin' : 'user'
    );

    return {
      user: authUser,
      profile,
    };
  } catch (error: any) {
    const isExpectedNotice =
      error?.code === 'auth/email-already-in-use' ||
      error?.code === 'auth/invalid-email' ||
      error?.code === 'auth/weak-password';
    if (isExpectedNotice) {
      console.warn('[Registration Flow] Validation notice in registerWithEmail:', error?.code || error?.message);
    } else {
      console.error('[Registration Flow] Error in registerWithEmail:', error);
    }
    const { message, isProviderDisabled } = formatAuthError(error, 'email');
    return {
      user: null,
      profile: null,
      error: message || error?.message || 'Failed to complete registration.',
      isProviderDisabled,
    };
  }
}

/**
 * Logs in an existing user with email and password.
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      user: null,
      profile: null,
      error: 'Please provide your account email address.',
    };
  }

  if (!password) {
    return {
      user: null,
      profile: null,
      error: 'Please enter your password.',
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const authUser = userCredential.user;

    // Automatically load or ensure authoritative user profile in Firestore
    const profile = await ensureUserProfile(authUser);

    return {
      user: authUser,
      profile,
    };
  } catch (error: any) {
    const { message, isProviderDisabled } = formatAuthError(error, 'email');
    return {
      user: null,
      profile: null,
      error: message,
      isProviderDisabled,
    };
  }
}

/**
 * Real Firebase Google Authentication with Firestore User Profile synchronization.
 */
export async function loginWithGoogle(): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    const userCredential = await signInWithPopup(auth, provider);
    const authUser = userCredential.user;

    // Ensure persistent Firestore profile while preserving existing roles & data
    const profile = await ensureUserProfile(authUser);

    return {
      user: authUser,
      profile,
    };
  } catch (error: any) {
    console.error('Google Authentication Error:', error);
    const { message, isProviderDisabled } = formatAuthError(error, 'google');
    return {
      user: null,
      profile: null,
      error: message,
      isProviderDisabled,
    };
  }
}

/**
 * Real Firebase Apple Authentication with Firestore User Profile synchronization.
 */
export async function loginWithApple(): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');

  try {
    const userCredential = await signInWithPopup(auth, provider);
    const authUser = userCredential.user;

    // Ensure persistent Firestore profile while preserving existing roles & data
    const profile = await ensureUserProfile(authUser);

    return {
      user: authUser,
      profile,
    };
  } catch (error: any) {
    console.error('Apple Authentication Error:', error);
    const { message, isProviderDisabled } = formatAuthError(error, 'apple');
    return {
      user: null,
      profile: null,
      error: message,
      isProviderDisabled,
    };
  }
}

/**
 * Initializes and mounts reCAPTCHA verifier for Phone SMS verification.
 */
export function setupRecaptcha(containerIdOrElement: string | HTMLElement): RecaptchaVerifier {
  if (!auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  if (recaptchaVerifierInstance) {
    try {
      recaptchaVerifierInstance.clear();
    } catch {
      // Non-blocking
    }
  }

  let targetElement: string | HTMLElement = containerIdOrElement;
  if (typeof containerIdOrElement === 'string') {
    const existing = document.getElementById(containerIdOrElement);
    if (!existing) {
      // Create fallback container attached to document body
      let fallback = document.getElementById('recaptcha-fallback-container');
      if (!fallback) {
        fallback = document.createElement('div');
        fallback.id = 'recaptcha-fallback-container';
        fallback.style.display = 'none';
        document.body.appendChild(fallback);
      }
      targetElement = fallback;
    }
  }

  recaptchaVerifierInstance = new RecaptchaVerifier(auth, targetElement, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      // Response expired
    },
  });

  return recaptchaVerifierInstance;
}

/**
 * Dispatches a phone verification SMS code via Firebase Phone Authentication.
 */
export async function requestPhoneCode(
  phoneNumber: string,
  containerIdOrElement: string | HTMLElement
): Promise<{ confirmationResult?: ConfirmationResult; error?: string; isProviderDisabled?: boolean }> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanPhone = phoneNumber.trim();
  if (!cleanPhone || cleanPhone.length < 7) {
    return { error: 'Please enter a valid phone number with country code (e.g. +1 555-0199).' };
  }

  try {
    const verifier = setupRecaptcha(containerIdOrElement);
    const confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, verifier);
    return { confirmationResult };
  } catch (error: any) {
    console.error('Phone SMS Dispatch Error:', error);
    const { message, isProviderDisabled } = formatAuthError(error, 'phone');
    return { error: message, isProviderDisabled };
  }
}

/**
 * Verifies the SMS code submitted by the user and synchronizes the Firestore profile.
 */
export async function verifyPhoneVerificationCode(
  confirmationResult: ConfirmationResult,
  verificationCode: string
): Promise<AuthResult> {
  const cleanCode = verificationCode.trim();
  if (!cleanCode || cleanCode.length < 4) {
    return {
      user: null,
      profile: null,
      error: 'Please enter the 6-digit verification code sent to your phone.',
    };
  }

  try {
    const userCredential = await confirmationResult.confirm(cleanCode);
    const authUser = userCredential.user;

    // Ensure persistent Firestore profile while preserving existing roles & data
    const profile = await ensureUserProfile(authUser);

    return {
      user: authUser,
      profile,
    };
  } catch (error: any) {
    console.error('Phone Code Verification Error:', error);
    const { message, isProviderDisabled } = formatAuthError(error, 'phone');
    return {
      user: null,
      profile: null,
      error: message,
      isProviderDisabled,
    };
  }
}

/**
 * Sends a real Firebase password reset email to the specified address.
 */
export async function sendUserPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    // Dispatch standard Firebase password reset email directly via Firebase Authentication
    // Avoids invalid mobile dynamic link settings (handleCodeInApp: true) and unauthorized continue URIs
    await sendPasswordResetEmail(auth, cleanEmail);
    console.log('[authService] Dispatched password reset email via Firebase Auth project:', auth.app.options.projectId, 'to:', cleanEmail);
    return { success: true };
  } catch (error: any) {
    console.error('Password Reset Request Error:', error);
    const { message } = formatAuthError(error, 'email');
    return { success: false, error: message };
  }
}

/**
 * Validates a Firebase password reset action code (oobCode) and returns the associated email.
 */
export async function verifyResetCode(
  oobCode: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanCode = (oobCode || '').trim();
  if (!cleanCode) {
    return { success: false, error: 'Password reset code is missing or empty.' };
  }

  try {
    const email = await verifyPasswordResetCode(auth, cleanCode);
    return { success: true, email };
  } catch (error: any) {
    console.error('Verify Password Reset Code Error:', error);
    const { message } = formatAuthError(error, 'email');
    return { success: false, error: message };
  }
}

/**
 * Confirms and updates the user's password in Firebase Authentication using the action code (oobCode).
 */
export async function confirmUserPasswordReset(
  oobCode: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanCode = (oobCode || '').trim();
  if (!cleanCode) {
    return { success: false, error: 'Password reset action code is missing.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    await confirmPasswordReset(auth, cleanCode, newPassword);
    return { success: true };
  } catch (error: any) {
    console.error('Confirm Password Reset Error:', error);
    const { message } = formatAuthError(error, 'email');
    return { success: false, error: message };
  }
}

/**
 * Signs out the current user.
 */
export async function logoutUser(): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: true };
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Error logging out:', error);
    return { success: false, error: error?.message || 'Failed to log out.' };
  }
}

