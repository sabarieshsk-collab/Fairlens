import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserIcon,
  KeyIcon,
  GlobeAltIcon,
  BellIcon,
  PaintBrushIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateNotificationPreferences,
  deleteAccount,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import SkeletonLoader from '../components/ui/SkeletonLoader';

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  // Profile Form
  const [profileData, setProfileData] = useState({
    companyName: user?.companyName || user?.company || '',
    email: user?.email || '',
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Theme & Language
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [themeMode, setThemeMode] = useState('dark-sidebar'); // default dark sidebar

  // Notifications Form
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: true,
    auditCompleteNotif: true,
    biasAlertNotif: true,
    reportReadyNotif: true,
    weeklyDigest: false,
  });

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ password: '', confirmation: '' });

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const prof = await getProfile().catch(() => null);
        if (isMounted && prof) {
          setProfileData({
            companyName: prof.companyName || user?.companyName || '',
            email: prof.email || user?.email || '',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    }
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    i18n.changeLanguage(langCode);
    showToast(`Language changed to ${langCode.toUpperCase()}`, 'success');
  };

  const handleSaveNotifPrefs = async () => {
    try {
      await updateNotificationPreferences(notifPrefs);
      showToast('Notification preferences saved', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save preferences', 'error');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteForm.confirmation !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }
    try {
      await deleteAccount(deleteForm);
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Failed to delete account', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <SkeletonLoader type="card" count={3} />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#0f0e0d]">{t('settings')}</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Manage your organization profile, security, language, theme, and notifications.
        </p>
      </div>

      {/* SECTION 1: PROFILE */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#0f0e0d] flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-[#c9400a]" /> {t('profile')}
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('companyName')}</label>
            <input
              type="text"
              value={profileData.companyName}
              onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('email')}</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
              required
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#c9400a] text-white rounded-xl text-xs font-semibold hover:bg-[#a8360a] transition-all shadow-sm"
          >
            {t('save')} Profile Changes
          </button>
        </form>
      </div>

      {/* SECTION 2: CHANGE PASSWORD */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#0f0e0d] flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-[#c9400a]" /> Change Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* SECTION 3: LANGUAGE SELECTION (INSTANT i18n TRANSLATION) */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#0f0e0d] flex items-center gap-2">
          <GlobeAltIcon className="w-5 h-5 text-[#c9400a]" /> {t('language')} (Multi-Language i18n)
        </h3>
        <p className="text-xs text-gray-500">
          Selecting a language will translate the application interface immediately.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          {[
            { code: 'en', label: 'English (Default)' },
            { code: 'ta', label: 'தமிழ் (Tamil)' },
            { code: 'hi', label: 'हिंदी (Hindi)' },
            { code: 'te', label: 'తెలుగు (Telugu)' },
            { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
            { code: 'ml', label: 'മലയാളം (Malayalam)' },
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                currentLanguage === lang.code
                  ? 'border-[#c9400a] bg-orange-50 text-[#c9400a] shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span>{lang.label}</span>
              {currentLanguage === lang.code && <CheckCircleIcon className="w-4 h-4 text-[#c9400a]" />}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: THEME & APPEARANCE */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#0f0e0d] flex items-center gap-2">
          <PaintBrushIcon className="w-5 h-5 text-[#c9400a]" /> {t('theme')}
        </h3>

        <div className="flex gap-4 max-w-md">
          <button
            type="button"
            onClick={() => setThemeMode('dark-sidebar')}
            className={`flex-1 p-4 rounded-xl border text-left transition-all ${
              themeMode === 'dark-sidebar'
                ? 'border-[#c9400a] bg-orange-50/50 text-[#0f0e0d]'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            <div className="w-full h-8 bg-[#0f0e0d] rounded-lg mb-2 flex items-center px-2">
              <span className="w-2 h-2 rounded-full bg-[#c9400a]" />
            </div>
            <p className="font-bold text-xs">Dark Sidebar (Default)</p>
            <p className="text-[10px] text-gray-500">Signature FairLens Brand Theme</p>
          </button>
        </div>
      </div>

      {/* SECTION 5: NOTIFICATIONS PREFERENCES */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#0f0e0d] flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-[#c9400a]" /> Notification Preferences
        </h3>

        <div className="space-y-3 max-w-lg">
          {[
            { key: 'emailNotifications', label: 'Email Alerts for Critical Bias Warnings' },
            { key: 'auditCompleteNotif', label: 'Audit Completion Notifications' },
            { key: 'reportReadyNotif', label: 'Compliance Report Ready Notifications' },
            { key: 'weeklyDigest', label: 'Weekly Summary Digest' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50 cursor-pointer">
              <span className="text-xs font-semibold text-gray-800">{item.label}</span>
              <input
                type="checkbox"
                checked={notifPrefs[item.key]}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                className="w-4 h-4 accent-[#c9400a]"
              />
            </label>
          ))}

          <button
            type="button"
            onClick={handleSaveNotifPrefs}
            className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* SECTION 6: ACCOUNT ACTIONS (LOGOUT & DELETE) */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#0f0e0d]">Account Management</h3>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" /> {t('logout')}
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50"
          >
            <TrashIcon className="w-4 h-4" /> {t('deleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleDeleteAccount} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-red-600">Delete Account &amp; All Data?</h3>
            <p className="text-xs text-gray-600">
              This action will permanently remove your organization account and delete all associated MongoDB audit records and compliance reports.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={deleteForm.password}
                onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Type "DELETE" to confirm</label>
              <input
                type="text"
                value={deleteForm.confirmation}
                onChange={(e) => setDeleteForm({ ...deleteForm, confirmation: e.target.value })}
                placeholder="DELETE"
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
              >
                Permanently Delete Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationCircleIcon className="w-5 h-5" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}