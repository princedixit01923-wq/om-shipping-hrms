import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { User, CompanySettings } from '../../types';
import { dbService } from '../../services/dbService';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  settings: CompanySettings;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, settings }) => {
  const [emailOrEmpId, setEmailOrEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailOrEmpId || !password) {
      setErrorMsg('Please enter your HR / Employee credentials and password.');
      return;
    }

    const authenticatedUser = dbService.authenticate(emailOrEmpId, password);

    if (!authenticatedUser) {
      setErrorMsg('Invalid login credentials. Please check your identifier and password.');
      return;
    }

    if (authenticatedUser.status === 'Disabled') {
      setErrorMsg('Your account has been deactivated. Please contact HR Administration.');
      return;
    }

    dbService.setCurrentUser(authenticatedUser);
    onLoginSuccess(authenticatedUser);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setShowForgotPasswordModal(false);
      setResetEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 relative bg-[#0f172a]">
      <div className="w-full flex-1 flex items-center justify-center py-8 z-10">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header Branding Banner */}
          <div className="bg-slate-900 p-6 text-center text-white border-b border-slate-800">
            <img
              src={settings.logoUrl || '/assets/om_logo.jpg'}
              alt="OM Shipping Ltd."
              className="h-12 mx-auto object-contain bg-white rounded-md p-1 mb-2 border border-slate-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/om_logo.jpg';
              }}
            />
            <h1 className="text-xl font-bold tracking-tight">OM Shipping Ltd.</h1>
            <p className="text-xs font-normal text-slate-400 mt-0.5 uppercase tracking-widest">HRMS By Priva</p>
          </div>

          {/* Login Form Body */}
          <div className="p-6">
            <div className="text-center mb-5">
              <h2 className="text-base font-bold text-slate-900">Sign in to Corporate Portal</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your assigned HR or Employee credentials</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email ID / Employee Code / PIN
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={emailOrEmpId}
                    onChange={(e) => setEmailOrEmpId(e.target.value)}
                    placeholder="e.g. hr@omshipping.com or OM0001"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Portal Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 font-normal text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  Remember Me
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2 group mt-2"
              >
                <span>SIGN IN TO HRMS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            {/* Quick Access Credentials Banner */}
            <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1 font-medium text-slate-600">
              <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
                <span>🔑 System Access Credentials</span>
              </div>
              <div className="flex justify-between items-center">
                <span>HR Admin:</span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-600">
                  hr@omshipping.com / OmShippingGreat.com
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span>Employee:</span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-emerald-600">
                  OM0001 / OM0001
                </code>
              </div>
            </div>

            {/* Bottom Tagline requested by user */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-[11px] font-medium text-slate-500 italic block">
                "Powered By Priva HRMS, You Think, We Build."
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Rights Footer */}
      <footer className="w-full py-3 text-center text-xs font-semibold text-slate-400 z-10 border-t border-slate-800/80 bg-[#071324]/80 backdrop-blur-md">
        © 2026 Priva Automations - All right reserved to priva.itsoftware@gmail.com
      </footer>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Password Recovery</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered corporate email address to receive password instructions.
            </p>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                Password reset instructions sent to your email.
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="hr@omshipping.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
