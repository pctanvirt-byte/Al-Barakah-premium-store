import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  KeyRound, 
  Mail,
  LogIn,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AlBarakahLogo } from './AlBarakahLogo';
import { StaffMember } from './AdminDashboard';

interface AdminAuthGuardProps {
  onBackToStore: () => void;
  onAuthenticated: (adminEmail: string, role: string) => void;
  allowedStaff: StaffMember[];
}

export const SUPER_ADMIN_EMAILS = [
  'albarakahpremium10@gmail.com',
  'pctanvirt@gmail.com'
];

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({
  onBackToStore,
  onAuthenticated,
  allowedStaff,
}) => {
  const { user, profile, signInWithGoogle, signOut } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPasscodeOption, setShowPasscodeOption] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP State for 2-Factor Authentication
  const [step, setStep] = useState<'LOGIN' | 'OTP'>('LOGIN');
  const [pendingAdminEmail, setPendingAdminEmail] = useState<string>('');
  const [pendingAdminRole, setPendingAdminRole] = useState<string>('Super Admin');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  // Send / Generate OTP for Super Admin (sent to Gmail - 1 min validity)
  const dispatchOtp = async (targetEmail: string) => {
    setIsSendingOtp(true);
    setEnteredOtp('');
    setResendCooldown(60);
    setAuthError(null);

    try {
      const response = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch OTP');
      }
    } catch (err: any) {
      console.warn('Backend OTP API notice:', err);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Cooldown countdown timer (60s / 1 min)
  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Check if email is authorized
  const checkEmailAuthorization = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if Super Admin
    if (SUPER_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === cleanEmail)) {
      return { authorized: true, role: 'Super Admin', name: 'Super Admin (Owner)' };
    }

    // Check in allowed staff list
    const found = allowedStaff.find((s) => s.email.toLowerCase() === cleanEmail && s.status === 'Active');
    if (found) {
      return { authorized: true, role: found.role, name: found.name };
    }

    return { authorized: false, role: 'Customer', name: '' };
  };

  const handleGoogleAdminLogin = async () => {
    setAuthError(null);
    setIsVerifying(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (
        e?.code !== 'auth/popup-closed-by-user' &&
        e?.code !== 'auth/cancelled-popup-request' &&
        !e?.message?.includes('popup-closed-by-user')
      ) {
        // Fallback to Super Admin Tanvir OTP verification directly
        handleTanvirSuperAdminTrigger();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // React on user change
  useEffect(() => {
    if (user?.email && step === 'LOGIN') {
      const authResult = checkEmailAuthorization(user.email);
      if (authResult.authorized) {
        setPendingAdminEmail(user.email);
        setPendingAdminRole(authResult.role);
        setStep('OTP');
        dispatchOtp(user.email);
      } else {
        setAuthError(
          `Access Blocked: The account "${user.email}" is NOT authorized. Only authorized Super Admins (pctanvirt@gmail.com, albarakahpremium10@gmail.com) can enter.`
        );
        // Automatically redirect unauthorized user back after 3.5s
        const redirectTimer = setTimeout(() => {
          onBackToStore();
        }, 3500);
        return () => clearTimeout(redirectTimer);
      }
    }
  }, [user, allowedStaff, step]);

  // Direct login trigger for Super Admin Tanvir
  const handleTanvirSuperAdminTrigger = () => {
    setAuthError(null);
    setPendingAdminEmail('pctanvirt@gmail.com');
    setPendingAdminRole('Super Admin');
    setStep('OTP');
    dispatchOtp('pctanvirt@gmail.com');
  };

  // Verify OTP submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingOtp(true);

    const cleanInput = enteredOtp.trim();
    if (!cleanInput || cleanInput.length < 6) {
      setAuthError('Please enter the 6-digit OTP code received in your Gmail or Master Recovery Key.');
      setIsSubmittingOtp(false);
      return;
    }

    // Submit verification to backend API (keeps Master Key and OTP secret on server-side)
    try {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingAdminEmail || 'pctanvirt@gmail.com',
          code: cleanInput,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsSubmittingOtp(false);
        onAuthenticated(pendingAdminEmail || 'pctanvirt@gmail.com', pendingAdminRole || 'Super Admin');
        return;
      } else {
        setIsSubmittingOtp(false);
        setAuthError(data.error || 'Invalid Verification Code. Please check your Gmail and try again.');
      }
    } catch (err) {
      setIsSubmittingOtp(false);
      setAuthError('Connection error during verification. Please try again.');
    }
  };

  // Handle Admin Passcode Access (Validated securely against server)
  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanKey = adminPasscode.trim();
    if (!cleanKey) {
      setAuthError('Please enter the Master Security Key.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'pctanvirt@gmail.com',
          code: cleanKey,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPendingAdminEmail('pctanvirt@gmail.com');
        setPendingAdminRole('Super Admin');
        onAuthenticated('pctanvirt@gmail.com', 'Super Admin');
      } else {
        setAuthError(data.error || 'Invalid Master Security Key. Access Denied.');
      }
    } catch (err) {
      setAuthError('Server connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#021810] text-stone-100 flex items-center justify-center p-4 selection:bg-[#D4AF37] selection:text-stone-950 font-sans">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#021810] to-[#021810] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#052d20] border border-emerald-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-stone-950/60 border border-[#D4AF37]/40 shadow-inner mb-4">
            <AlBarakahLogo className="w-12 h-12" />
          </div>

          <h1 
            className="text-xl sm:text-2xl font-bold tracking-widest text-[#D4AF37] uppercase font-serif"
            style={{ fontFamily: "'Cinzel', Georgia, serif" }}
          >
            AL BARAKAH
          </h1>
          <p className="text-[11px] font-bold tracking-[0.25em] text-emerald-400 uppercase mt-0.5">
            RESTRICTED ADMIN GATEWAY
          </p>

          <div className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-[11px] text-emerald-300 w-fit mx-auto">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{step === 'OTP' ? 'Step 2: 2-Factor OTP Verification' : 'Super Admin Authentication Only'}</span>
          </div>
        </div>

        {/* STEP 1: Google Login & Super Admin Verification */}
        {step === 'LOGIN' && (
          <>
            {/* Notice for Super Admin Email */}
            <div className="mt-6 p-3.5 rounded-2xl bg-black/40 border border-emerald-900/80 text-xs text-stone-300 space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Authorized Super Admin Access:</span>
              </div>
              <div className="space-y-1">
                {SUPER_ADMIN_EMAILS.map((email) => (
                  <div
                    key={email}
                    className="font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1.5 rounded-lg border border-emerald-800/50 break-all font-semibold flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{email}</span>
                    </div>
                    {email === 'pctanvirt@gmail.com' && (
                      <span className="text-[10px] bg-emerald-800/50 text-emerald-300 px-1.5 py-0.5 rounded font-sans">
                        OTP Enabled
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-stone-400">
                * Unauthorized accounts are immediately blocked and returned to the storefront.
              </p>
            </div>

            {/* Error Alert */}
            {authError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-600/60 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{authError}</div>
              </div>
            )}

            {/* Actions Container */}
            <div className="mt-6 space-y-3.5">
              {/* Primary Action: Sign In with Google */}
              <button
                onClick={handleGoogleAdminLogin}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs sm:text-sm shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                id="admin-google-login-btn"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Verify Google Super Admin</span>
              </button>

              {/* Direct Super Admin Tanvir Quick Gateway */}
              <button
                onClick={handleTanvirSuperAdminTrigger}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 text-xs font-semibold border border-emerald-700/60 transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Super Admin Tanvir (Send OTP)</span>
              </button>

              {/* Quick Passcode Toggle */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasscodeOption(!showPasscodeOption)}
                  className="text-[11px] font-semibold text-stone-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  {showPasscodeOption ? 'Hide Master Key option' : 'Use Admin Master Passcode / Key'}
                </button>
              </div>

              {/* Passcode Form */}
              {showPasscodeOption && (
                <form onSubmit={handlePasscodeLogin} className="space-y-3 pt-2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter Admin Master Key"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-emerald-700/60 text-white placeholder-stone-500 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#0c7042] text-white text-xs font-bold transition-colors cursor-pointer border border-emerald-500/30"
                  >
                    Authenticate with Master Key
                  </button>
                </form>
              )}

              {/* Return to Store button */}
              <button
                onClick={onBackToStore}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-transparent hover:bg-stone-900/60 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-stone-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Storefront</span>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: 2-FACTOR OTP VERIFICATION */}
        {step === 'OTP' && (
          <div className="mt-4 space-y-4">
            {/* Single Clean Compact Header */}
            <div className="text-center space-y-1.5 pb-1">
              <div className="inline-flex p-2.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[#D4AF37] mb-1">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 
                className="text-base font-bold text-white font-serif"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
              >
                Enter 6-Digit Verification Code
              </h3>
              <p className="text-xs text-stone-300">
                A 6-digit code has been sent to{' '}
                <span className="font-bold text-[#D4AF37]">{pendingAdminEmail}</span>
              </p>
              <p className="text-[11px] text-emerald-400/90 font-medium">
                (Check inbox & spam &bull; Code valid for 1 min)
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/60 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{authError}</div>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1.5 uppercase tracking-wider text-center">
                  Verification Code (OTP) or Master Key
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP or Master Key"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-emerald-600/60 text-white placeholder-stone-600 text-center font-mono text-base sm:text-lg font-bold tracking-wider focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  autoFocus
                  id="admin-otp-input"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingOtp || enteredOtp.trim().length < 6}
                className="w-full py-3.5 rounded-xl bg-[#CFA43B] hover:bg-[#b88f30] text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                id="admin-otp-submit-btn"
              >
                {isSubmittingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Unlock Admin Dashboard</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP & Back Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-900/60 text-xs">
              <button
                type="button"
                onClick={() => dispatchOtp(pendingAdminEmail)}
                disabled={resendCooldown > 0 || isSendingOtp}
                className="text-emerald-400 hover:text-emerald-300 disabled:text-stone-500 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 || isSendingOtp ? '' : 'animate-pulse'}`} />
                <span>
                  {isSendingOtp
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend OTP Code'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('LOGIN');
                  setAuthError(null);
                }}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

