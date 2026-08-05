import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BellIcon, MagnifyingGlassIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { getNotifications } from '../../services/api';
import GlobalSearchModal from '../ui/GlobalSearchModal';
import NotificationDrawer from '../ui/NotificationDrawer';

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await getNotifications(true);
        if (isMounted) {
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err) {
        // Fallback silently if unauthenticated
      }
    };
    fetchUnread();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // ⌘K / Ctrl+K keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowNotificationDrawer(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pageNames = {
    '/dashboard': t('dashboard'),
    '/new-audit': t('newAudit'),
    '/audit-history': t('auditHistory'),
    '/monitoring': t('monitoring'),
    '/compliance-reports': t('complianceReports'),
    '/remediation': t('remediation'),
    '/settings': t('settings'),
  };

  const getPageTitle = () => {
    for (const [path, name] of Object.entries(pageNames)) {
      if (location.pathname.startsWith(path)) {
        return name;
      }
    }
    return 'FairLens';
  };

  const handleLogout = () => {
    localStorage.removeItem('fairlens_token');
    localStorage.removeItem('fairlens_company');
    localStorage.removeItem('fairlens_user');
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '?';
    return (user.companyName || user.name || user.email || '?').charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-8 z-40">
        {/* Page Title */}
        <h1 className="font-serif text-2xl font-bold text-[#0f0e0d]">
          {getPageTitle()}
        </h1>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          {/* Global Search trigger */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#f9fafb] border border-[#e5e7eb] hover:border-[#c9400a] text-sm text-[#6b7280] rounded-lg transition-colors w-64"
          >
            <MagnifyingGlassIcon className="w-4 h-4 text-[#9ca3af]" />
            <span className="flex-1 text-left">Search audits, candidates...</span>
            <kbd className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-gray-400 font-mono">⌘K</kbd>
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDrawer(true)}
              className="relative p-2 text-[#6b7280] hover:text-[#0f0e0d] transition-colors rounded-lg hover:bg-[#f3f4f6]"
              aria-label="Notifications"
            >
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#c9400a] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#f3f4f6] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#c9400a] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">
                  {getInitials()}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#e5e7eb] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 bg-[#fafafa] border-b border-[#e5e7eb]">
                  <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Company</p>
                  <p className="text-sm font-bold text-[#0f0e0d] truncate">
                    {user?.companyName || user?.company || 'FairLens User'}
                  </p>
                  <p className="text-xs text-[#6b7280] truncate mt-0.5">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#0f0e0d] hover:bg-[#f3f4f6] transition-colors flex items-center gap-2.5"
                  >
                    <UserIcon className="w-4 h-4 text-[#6b7280]" />
                    Profile Details
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#0f0e0d] hover:bg-[#f3f4f6] transition-colors flex items-center gap-2.5"
                  >
                    <Cog6ToothIcon className="w-4 h-4 text-[#6b7280]" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-[#e5e7eb] py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5 font-medium"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-600" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}