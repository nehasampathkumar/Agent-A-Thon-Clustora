import React, { useState } from 'react';
import { X, Mail, Lock, User, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [debugCodeReceived, setDebugCodeReceived] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onSuccess(res.user);
        onClose();
      } else if (mode === 'signup') {
        const res = await api.signup(email, password, fullName);
        onSuccess(res.user);
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setSuccessMsg(res.message);
        if (res.debugCode) {
          setDebugCodeReceived(res.debugCode);
          setResetCode(res.debugCode);
        }
        setMode('reset');
      } else if (mode === 'reset') {
        const res = await api.resetPassword(email, resetCode, newPassword);
        setSuccessMsg(res.message);
        setPassword(newPassword);
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@studysync.ai');
    setPassword('password123');
    setLoading(true);
    setError(null);
    try {
      const res = await api.login('demo@studysync.ai', 'password123');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        id="auth-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'login' && 'Sign in to StudySync AI'}
              {mode === 'signup' && 'Create Student Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Enter 6-Digit Code'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login' && 'Access your adaptive study plans & progress'}
              {mode === 'signup' && 'Prepare for your exams with tailored schedules'}
              {mode === 'forgot' && 'We will send a 6-digit code to verify your identity'}
              {mode === 'reset' && 'Set a new password to restore access'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p>{successMsg}</p>
                {debugCodeReceived && (
                  <p className="mt-1 font-mono font-bold text-emerald-800">
                    Verification Code: {debugCodeReceived}
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Verification Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send 6-Digit Code'}
                    {mode === 'reset' && 'Update Password'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          {mode === 'login' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⚡ Instant Sign-in with Demo Student (Alex Rivera)</span>
              </button>
            </div>
          )}

          {/* Mode switch */}
          <div className="mt-4 text-center text-xs text-slate-500">
            {mode === 'login' && (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Sign in
                </button>
              </p>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                ← Return to Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
