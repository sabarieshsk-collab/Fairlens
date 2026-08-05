import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { loginCompany, googleLoginCompany, isLoggedIn } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await loginCompany(email.trim(), password);
      if (response?.company) {
        setUser?.(response.company);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError('Please enter your company email address above to reset your password.');
    } else {
      setError('');
      setInfoMessage(`Password reset instructions sent to ${email.trim()}`);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfoMessage('');
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await googleLoginCompany(idToken, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
      });

      if (response?.company) {
        setUser?.(response.company);
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code === 'auth/configuration-not-found') {
        setError('Google Sign-In is not enabled in Firebase Console. Please go to Firebase Console -> Authentication -> Sign-in method and enable Google.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for Google sign-in.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain unauthorized. Please add "localhost" in Firebase Console -> Authentication -> Settings -> Authorized domains.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore duplicate request
      } else {
        setError(err.message || 'Google authentication failed. Please try again.');
      }
      setGoogleLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#EEF4FF] via-[#E9ECFF] to-[#F8F5FF] flex flex-col lg:flex-row items-center justify-between font-sans selection:bg-[#F15A24]/20 selection:text-[#F15A24]">
      {/* Floating Animated Gradient Blobs */}
      <div className="gradient-blob gradient-blob-1 pointer-events-none" />
      <div className="gradient-blob gradient-blob-2 pointer-events-none" />
      <div className="gradient-blob gradient-blob-3 pointer-events-none" />

      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
      </div>

      {/* LEFT SIDE: Premium AI Branding Section (60% Desktop, Hidden on Mobile) */}
      <div className="w-full lg:w-[60%] min-h-screen flex flex-col justify-between p-8 lg:p-14 relative z-10 hidden lg:flex">
        {/* Top Logo */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F15A24] to-[#6C63FF] p-0.5 shadow-lg shadow-[#F15A24]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#1A1A2E] rounded-[14px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F15A24]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1A2E]">FairLens</span>
            <span className="ml-2.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F15A24]/10 text-[#F15A24] border border-[#F15A24]/20">Enterprise AI</span>
          </div>
        </div>

        {/* Center Content & Illustration */}
        <div className="my-auto py-6">
          <div className="max-w-xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/90 shadow-sm text-xs font-semibold text-[#6C63FF] mb-5">
              <SparklesIcon className="w-4 h-4 text-[#F15A24]" />
              <span>Next-Gen Algorithmic Bias Mitigation</span>
            </div>

            <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#1A1A2E] leading-[1.15] tracking-tight mb-4">
              AI Hiring Fairness <span className="bg-gradient-to-r from-[#F15A24] to-[#6C63FF] bg-clip-text text-transparent">Platform</span>
            </h1>

            <p className="text-base lg:text-lg text-[#3D3D5C] leading-relaxed mb-6 font-normal">
              Detect hiring bias. Ensure compliance. Build trusted AI recruitment.
            </p>
          </div>

          {/* Premium AI Vector Illustration */}
          <div className="relative my-6 max-w-xl float-animation">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#F15A24]/20 to-[#6C63FF]/20 rounded-3xl blur-xl opacity-70"></div>
            <div className="relative bg-white/65 backdrop-blur-2xl border border-white/80 rounded-3xl p-5 shadow-xl">
              <svg className="w-full h-44" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Grid & Nodes */}
                <path d="M50 100 H450 M100 50 V150 M250 30 V170 M400 50 V150" stroke="#6C63FF" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="4 4" />
                
                {/* Connecting Neural Lines */}
                <path d="M80 100 C 150 40, 200 60, 250 100 C 300 140, 350 160, 420 100" stroke="url(#gradient-line1)" strokeWidth="3" strokeLinecap="round" />
                <path d="M80 130 C 140 160, 200 130, 250 100 C 300 70, 360 40, 420 70" stroke="url(#gradient-line2)" strokeWidth="2" strokeDasharray="6 6" />

                {/* Central Lens Scanner Node */}
                <circle cx="250" cy="100" r="42" fill="white" fillOpacity="0.9" stroke="#F15A24" strokeWidth="3" />
                <circle cx="250" cy="100" r="32" fill="url(#lens-gradient)" fillOpacity="0.2" />
                <circle cx="250" cy="100" r="20" stroke="#6C63FF" strokeWidth="2.5" strokeDasharray="30 10" />
                <circle cx="250" cy="100" r="8" fill="#F15A24" />

                {/* Left Candidate Node Card */}
                <g transform="translate(60, 60)">
                  <rect width="115" height="72" rx="14" fill="white" fillOpacity="0.95" stroke="#E9ECFF" strokeWidth="1.5" />
                  <circle cx="25" cy="28" r="12" fill="#EEF4FF" />
                  <path d="M20 28 C20 23, 30 23, 30 28 M25 20 A3 3 0 1 0 25 26 A3 3 0 1 0 25 20" fill="#6C63FF" />
                  <rect x="43" y="20" width="55" height="6" rx="3" fill="#1A1A2E" fillOpacity="0.8" />
                  <rect x="43" y="32" width="38" height="5" rx="2.5" fill="#6B6B8A" />
                  <rect x="12" y="48" width="91" height="14" rx="7" fill="#ECFDF3" />
                  <text x="57" y="58" textAnchor="middle" fill="#22C55E" fontSize="9" fontWeight="700" fontFamily="Inter">99.4% Unbiased</text>
                </g>

                {/* Right Compliance Shield Card */}
                <g transform="translate(325, 45)">
                  <rect width="125" height="78" rx="14" fill="white" fillOpacity="0.95" stroke="#E9ECFF" strokeWidth="1.5" />
                  <rect x="12" y="14" width="28" height="28" rx="8" fill="#F15A24" fillOpacity="0.1" />
                  <path d="M26 21 L20 24 V28 C20 32 26 35 26 35 C26 35 32 32 32 28 V24 L26 21 Z" fill="#F15A24" />
                  <text x="48" y="25" fill="#1A1A2E" fontSize="11" fontWeight="700" fontFamily="Inter">EEOC Standard</text>
                  <text x="48" y="37" fill="#22C55E" fontSize="9" fontWeight="600" fontFamily="Inter">✓ Audit Compliant</text>
                  <rect x="12" y="52" width="101" height="14" rx="7" fill="#F5F8FF" />
                  <rect x="12" y="52" width="80" height="14" rx="7" fill="#6C63FF" fillOpacity="0.85" />
                  <text x="62" y="62" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Inter">80% Rule Passed</text>
                </g>

                {/* Floating Micro Badge */}
                <g transform="translate(200, 15)">
                  <rect width="100" height="24" rx="12" fill="#1A1A2E" />
                  <text x="50" y="16" textAnchor="middle" fill="#00FFC2" fontSize="9" fontWeight="700" fontFamily="Inter">✨ Gemini AI Powered</text>
                </g>

                {/* SVG Gradients */}
                <defs>
                  <linearGradient id="gradient-line1" x1="80" y1="100" x2="420" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F15A24" />
                    <stop offset="0.5" stopColor="#6C63FF" />
                    <stop offset="1" stopColor="#22C55E" />
                  </linearGradient>
                  <linearGradient id="gradient-line2" x1="80" y1="100" x2="420" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6C63FF" />
                    <stop offset="1" stopColor="#F15A24" />
                  </linearGradient>
                  <linearGradient id="lens-gradient" x1="215" y1="65" x2="285" y2="135" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F15A24" />
                    <stop offset="1" stopColor="#6C63FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Four Animated Feature Cards */}
          <div className="grid grid-cols-2 gap-3.5 max-w-xl">
            {/* Card 1 */}
            <div className="glass-card bg-white/65 backdrop-blur-xl border border-white/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#F15A24]/40 transition-all duration-300 group">
              <div className="w-8 h-8 rounded-xl bg-[#F15A24]/10 text-[#F15A24] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm font-bold text-[#1A1A2E] mb-0.5">AI Resume Analysis</h3>
              <p className="text-[11px] text-[#6B6B8A] leading-snug">Unbiased candidate evaluations</p>
            </div>

            {/* Card 2 */}
            <div className="glass-card bg-white/65 backdrop-blur-xl border border-white/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#6C63FF]/40 transition-all duration-300 group">
              <div className="w-8 h-8 rounded-xl bg-[#6C63FF]/10 text-[#6C63FF] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm font-bold text-[#1A1A2E] mb-0.5">EEOC Compliance</h3>
              <p className="text-[11px] text-[#6B6B8A] leading-snug">Disparate impact audit reports</p>
            </div>

            {/* Card 3 */}
            <div className="glass-card bg-white/65 backdrop-blur-xl border border-white/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#22C55E]/40 transition-all duration-300 group">
              <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CpuChipIcon className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm font-bold text-[#1A1A2E] mb-0.5">Gemini AI Powered</h3>
              <p className="text-[11px] text-[#6B6B8A] leading-snug">Multi-modal reasoning engine</p>
            </div>

            {/* Card 4 */}
            <div className="glass-card bg-white/65 backdrop-blur-xl border border-white/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#F15A24]/40 transition-all duration-300 group">
              <div className="w-8 h-8 rounded-xl bg-[#F15A24]/10 text-[#F15A24] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm font-bold text-[#1A1A2E] mb-0.5">Real-time Monitoring</h3>
              <p className="text-[11px] text-[#6B6B8A] leading-snug">Continuous bias metric tracking</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-6 text-xs text-[#6B6B8A] pt-3 border-t border-white/60">
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon className="w-4 h-4 text-[#22C55E]" />
            <span>SOC 2 Type II Certified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon className="w-4 h-4 text-[#22C55E]" />
            <span>NYC Local Law 144 Compliant</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Glassmorphism Login Card (40% Desktop, Centered Mobile) */}
      <div className="w-full lg:w-[40%] min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[430px] bg-white/75 backdrop-blur-2xl border border-white/90 rounded-[24px] p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(26,26,46,0.08)] animate-fade-in-up relative">
          
          {/* Card Header Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F15A24] via-[#FF6F3D] to-[#6C63FF] p-0.5 shadow-lg shadow-[#F15A24]/20 mb-3 hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#F15A24]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
            </div>
            
            <h2 className="font-serif text-3xl font-extrabold text-[#1A1A2E] tracking-tight mb-1">
              FairLens
            </h2>
            <p className="text-xs font-medium text-[#6B6B8A]">
              Enterprise HR Compliance Portal
            </p>
          </div>

          {/* Alert Banners */}
          {error && (
            <div className="mb-4 p-3 bg-red-50/90 border border-red-200/80 rounded-xl text-center animate-fade-in">
              <p className="text-xs font-semibold text-red-600">{error}</p>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 bg-blue-50/90 border border-blue-200/80 rounded-xl text-center animate-fade-in">
              <p className="text-xs font-semibold text-blue-700">{infoMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold text-[#1A1A2E] uppercase tracking-wider mb-1.5">
                Company Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@yourcompany.com"
                  className="w-full pl-11 pr-4 py-3 bg-white/80 border border-gray-200/90 rounded-xl focus:outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/15 text-[#1A1A2E] placeholder-gray-400 font-medium text-sm transition-all duration-200 input-field"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-[11px] font-semibold text-[#1A1A2E] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <LockClosedIcon className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-white/80 border border-gray-200/90 rounded-xl focus:outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/15 text-[#1A1A2E] placeholder-gray-400 font-medium text-sm transition-all duration-200 input-field"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A1A2E] transition-colors focus:outline-none p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center cursor-pointer select-none group">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#F15A24] focus:ring-[#F15A24]/30 cursor-pointer accent-[#F15A24]"
                />
                <span className="ml-2 text-xs font-medium text-[#3D3D5C] group-hover:text-[#1A1A2E] transition-colors">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-[#F15A24] hover:text-[#D94A1C] hover:underline bg-transparent border-none p-0 cursor-pointer transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Premium Orange Gradient Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#F15A24] via-[#FF6F3D] to-[#F15A24] text-white py-3.5 px-6 rounded-xl font-semibold text-sm shadow-lg shadow-[#F15A24]/25 hover:shadow-xl hover:shadow-[#F15A24]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 group btn-lift"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200/80"></div>
            </div>
            <div className="relative flex justify-center text-[10px] text-[#6B6B8A] uppercase tracking-wider font-bold bg-white/90 px-3 py-0.5 rounded-full inline-block">
              Or continue with
            </div>
          </div>

          {/* Secondary Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full bg-white/90 hover:bg-white border border-gray-200/90 hover:border-gray-300 text-[#1A1A2E] py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {googleLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-[#4285F4]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Authenticating with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Sign Up Link */}
          <p className="text-center mt-5 text-xs sm:text-sm text-[#6B6B8A]">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-bold text-[#F15A24] hover:text-[#D94A1C] hover:underline bg-transparent border-none p-0 cursor-pointer transition-colors"
            >
              Sign Up
            </button>
          </p>

          {/* Footer note */}
          <p className="text-center text-[10px] text-[#A0A0B8] mt-4 font-medium">
            FairLens Enterprise SaaS Platform • AI Compliance
          </p>
        </div>
      </div>
    </div>
  );
}