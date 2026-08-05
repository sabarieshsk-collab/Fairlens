import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { registerCompany, isLoggedIn } from '../services/auth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function SignUp() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!companyName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    try {
      await registerCompany({ companyName, email, password, confirmPassword });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0e0d] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-bold text-[#0f0e0d] tracking-tight">
              FairLens
            </h1>
          </div>

          <p className="text-center text-[#6b7280] text-base mb-6">
            Create your company account
          </p>

          <div className="w-12 h-0.5 bg-[#c9400a] mx-auto mb-8" />

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 text-center">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-[#374151] mb-1.5">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
                className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#c9400a] focus:ring-1 focus:ring-[#c9400a] text-[#111827] placeholder-gray-400"
                required
                autoComplete="organization"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1.5">
                Company Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hr@yourcompany.com"
                className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#c9400a] focus:ring-1 focus:ring-[#c9400a] text-[#111827] placeholder-gray-400"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#c9400a] focus:ring-1 focus:ring-[#c9400a] text-[#111827] placeholder-gray-400"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#374151] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 pr-12 border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#c9400a] focus:ring-1 focus:ring-[#c9400a] text-[#111827] placeholder-gray-400"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c9400a] text-white py-3.5 px-6 rounded-lg font-medium text-base hover:bg-[#a8360a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
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
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-6">
            <span className="text-[#9ca3af] mr-2">Already have an account?</span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-[#c9400a] hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Login
            </button>
          </p>

          <p className="text-center text-xs text-[#9ca3af] mt-8">
            FairLens — For HR Compliance Officers
          </p>
        </div>
      </div>
    </div>
  );
}