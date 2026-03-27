import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Mail, RefreshCw } from 'lucide-react';
import { ApiError } from '../../lib/apiClient';
import {
  backendResendVerification,
  backendVerifyEmail,
  type BackendResendVerificationResponse,
} from '../../services/backendAuthService';
import { cn } from '../../lib/utils';

type Status = 'idle' | 'success';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const emailFromQuery = searchParams.get('email')?.trim() ?? '';

  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [resendInfo, setResendInfo] = useState('');
  const [linkHint, setLinkHint] = useState('');
  const [resendPayload, setResendPayload] = useState<BackendResendVerificationResponse | null>(null);
  const [pastedToken, setPastedToken] = useState('');
  const [pasteBusy, setPasteBusy] = useState(false);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [emailFromQuery]);

  /** Magic link from email: confirm in the background so OTP stays the primary path. */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLinkHint('Confirming verification token from link…');
    (async () => {
      try {
        await backendVerifyEmail({ token });
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email is verified. You can sign in.');
          setLinkHint('');
        }
      } catch (e) {
        if (!cancelled) {
          setLinkHint(
            e instanceof ApiError
              ? 'Link could not be confirmed — use the code from your registration response or paste a token below.'
              : 'Use the code from your registration response below.'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = otp.replace(/\D/g, '').slice(0, 6);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter the email address you registered with.');
      return;
    }
    if (digits.length !== 6) {
      setFormError('Enter the 6-digit code from the registration or resend response.');
      return;
    }
    setOtpBusy(true);
    setFormError('');
    setResendInfo('');
    try {
      await backendVerifyEmail({ email: email.trim(), otp: digits });
      setStatus('success');
      setMessage('Your email is verified. You can sign in.');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Verification failed');
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyWithToken = async () => {
    if (!token) return;
    setLinkBusy(true);
    setFormError('');
    setResendInfo('');
    try {
      await backendVerifyEmail({ token });
      setStatus('success');
      setMessage('Your email is verified. You can sign in.');
      setLinkHint('');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Verification failed');
    } finally {
      setLinkBusy(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    setResendBusy(true);
    setFormError('');
    setResendPayload(null);
    try {
      const data = await backendResendVerification(email.trim());
      setResendInfo(data.detail);
      if (data.email_verify_token) {
        setResendPayload(data);
      }
    } catch (err) {
      setResendInfo(err instanceof ApiError ? err.message : 'Could not issue new credentials');
    } finally {
      setResendBusy(false);
    }
  };

  const handleVerifyPastedToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = pastedToken.trim();
    if (t.length < 8) {
      setFormError('Paste the full verification token from the API response.');
      return;
    }
    setPasteBusy(true);
    setFormError('');
    setResendInfo('');
    try {
      await backendVerifyEmail({ token: t });
      setStatus('success');
      setMessage('Your email is verified. You can sign in.');
      setLinkHint('');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Verification failed');
    } finally {
      setPasteBusy(false);
    }
  };

  const showOtpForm = status !== 'success';

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-white tracking-tight">Email verification</h1>
          <p className="mt-2 text-sm text-[#8a8aa8]">AfriTrust identity</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#14141c] p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]">
          {status === 'success' && (
            <div className="text-center space-y-6">
              <p className="text-sm text-emerald-300/95">{message}</p>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
              >
                Sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          {showOtpForm && (
            <div className="space-y-6">
              <p className="text-sm text-[#a8a8c0] text-center leading-relaxed">
                Use the <strong className="text-[#c8c8e0]">verification link</strong> or{' '}
                <strong className="text-[#c8c8e0]">6-digit code</strong> from your{' '}
                <strong className="text-[#c8c8e0]">register</strong> or <strong className="text-[#c8c8e0]">resend</strong>{' '}
                API response (no email is sent).
              </p>
              {linkHint ? (
                <p className="text-xs text-center text-[#8a8aa8]">{linkHint}</p>
              ) : null}
              {formError ? <p className="text-sm text-red-400/95 text-center">{formError}</p> : null}
              {resendInfo ? <p className="text-xs text-center text-[#8a8aa8]">{resendInfo}</p> : null}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b88]">Email</span>
                  <div className="mt-2 relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white placeholder:text-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b88]">
                    Verification code
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white tracking-[0.4em] text-center font-mono placeholder:text-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </label>
                <button
                  type="submit"
                  disabled={otpBusy || otp.replace(/\D/g, '').length !== 6}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
                >
                  {otpBusy ? 'Verifying…' : 'Verify with code'}
                </button>
              </form>

              <form onSubmit={handleVerifyPastedToken} className="space-y-3 pt-2 border-t border-white/[0.06]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b88]">
                  Or paste verification token
                </p>
                <input
                  type="text"
                  value={pastedToken}
                  onChange={e => setPastedToken(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white font-mono placeholder:text-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Token from API JSON"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={pasteBusy || pastedToken.trim().length < 8}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.12] text-sm font-medium text-[#c8c8e0] hover:bg-white/[0.05] disabled:opacity-50"
                >
                  {pasteBusy ? 'Verifying…' : 'Verify with pasted token'}
                </button>
              </form>

              {token ? (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={linkBusy}
                    onClick={handleVerifyWithToken}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.12] text-sm font-medium text-[#c8c8e0] hover:bg-white/[0.05] disabled:opacity-50"
                  >
                    {linkBusy ? 'Verifying…' : 'Verify using URL token again'}
                  </button>
                </div>
              ) : null}

              {resendPayload?.email_verify_otp ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-[#9a9ab8]">
                  <p className="font-semibold text-emerald-200/90 mb-2">New code from resend</p>
                  <code className="block text-center text-lg font-mono tracking-[0.35em] text-white">
                    {resendPayload.email_verify_otp}
                  </code>
                  {resendPayload.email_verify_link ? (
                    <a
                      href={resendPayload.email_verify_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-center text-violet-400 hover:text-violet-300"
                    >
                      Open new verification link
                    </a>
                  ) : null}
                </div>
              ) : null}

              <form onSubmit={handleResend} className="space-y-3 pt-2 border-t border-white/[0.06]">
                <p className="text-xs text-[#6b6b88] text-center">
                  Need a new token or code? Issue new credentials for this email (no email sent).
                </p>
                <button
                  type="submit"
                  disabled={resendBusy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.12] text-sm font-medium text-white transition-colors',
                    'hover:bg-white/[0.06] disabled:opacity-50'
                  )}
                >
                  <RefreshCw className={cn('w-4 h-4', resendBusy && 'animate-spin')} />
                  {resendBusy ? 'Working…' : 'Issue new verification credentials'}
                </button>
              </form>

              <p className="text-center">
                <Link to="/login" className="text-sm text-indigo-400 hover:text-indigo-300">
                  Back to sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
