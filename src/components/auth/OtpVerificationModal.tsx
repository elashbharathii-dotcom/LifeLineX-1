import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OtpVerificationModalProps {
  phone: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  phone,
  onClose,
  onSuccess,
}) => {
  const { verifyPhoneOtp, sendPhoneOtp } = useAuth();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Masked phone for privacy (e.g. +91 98765 XXXXX)
  const maskedPhone = React.useMemo(() => {
    if (phone.length >= 8) {
      const visibleStart = phone.slice(0, phone.length - 5);
      return `${visibleStart} XXXXX`;
    }
    return phone;
  }, [phone]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleDigitChange = (index: number, value: string) => {
    // Handle single character
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all digits filled, auto-trigger verification
    if (char && index === 5 && newDigits.every((d) => d !== '')) {
      triggerVerification(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    setErrorMessage(null);

    // Focus last entered or next empty
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      triggerVerification(pasted);
    }
  };

  const triggerVerification = async (tokenString?: string) => {
    const code = tokenString || digits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const { error } = await verifyPhoneOtp(phone, code);
      if (error) {
        setErrorMessage(error);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);

    try {
      const { error } = await sendPhoneOtp(phone);
      if (error) {
        setErrorMessage(error);
      } else {
        setResendTimer(60);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="lx-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-modal-title"
    >
      <div className="lx-modal max-w-md w-full mx-4" style={{ borderRadius: 'var(--radius-2xl)' }}>
        {/* Modal Header */}
        <div className="lx-modal-header flex items-center justify-between pb-3">
          <button
            onClick={onClose}
            className="lx-icon-btn"
            aria-label="Change phone number"
            title="Change phone number"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Verification</span>
          </div>
          <div className="w-8" />
        </div>

        {/* Modal Body */}
        <div className="lx-modal-body space-y-5 text-center py-4">
          <div className="space-y-1.5">
            <h2 id="otp-modal-title" className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Verify your number
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Enter the 6-digit code sent to{' '}
              <strong className="font-mono" style={{ color: 'var(--color-text-primary)' }}>{maskedPhone}</strong>
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="p-3 rounded-xl text-xs flex items-start gap-2 text-left"
              style={{
                background: 'var(--color-critical-muted)',
                border: '1px solid var(--color-critical-border)',
                color: 'var(--color-critical-light)',
              }}
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 6 Digit OTP Input Boxes */}
          <div
            className="flex items-center justify-center gap-2 sm:gap-3 py-2"
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying}
                aria-label={`Digit ${idx + 1}`}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl transition-all focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--color-bg-subtle)',
                  border: digit ? '2px solid var(--color-primary)' : '1px solid var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
            ))}
          </div>

          {/* Resend Action */}
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {resendTimer > 0 ? (
              <span>Resend code in <strong className="font-mono">{resendTimer}s</strong></span>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="font-semibold flex items-center gap-1.5 hover:underline transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Sending...' : 'Resend Code'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="lx-modal-footer flex flex-col sm:flex-row items-center gap-2.5 pt-4">
          <button
            onClick={onClose}
            className="lx-btn lx-btn-secondary w-full sm:w-auto"
            disabled={isVerifying}
          >
            Change Number
          </button>
          <button
            onClick={() => triggerVerification()}
            disabled={isVerifying || digits.some((d) => d === '')}
            className="lx-btn lx-btn-primary w-full flex-1 flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying…</span>
              </>
            ) : (
              <span>Verify &amp; Continue</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
