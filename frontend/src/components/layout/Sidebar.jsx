import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  PlusCircleIcon,
  ClockIcon,
  BellIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  WrenchIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: HomeIcon },
    { path: '/new-audit', label: t('newAudit'), icon: PlusCircleIcon },
    { path: '/audit-history', label: t('auditHistory'), icon: ClockIcon },
    { path: '/monitoring', label: t('monitoring'), icon: BellIcon },
    { path: '/compliance-reports', label: t('complianceReports'), icon: DocumentTextIcon },
    { path: '/remediation', label: t('remediation'), icon: WrenchIcon },
    { path: '/settings', label: t('settings'), icon: Cog6ToothIcon },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const getInitials = () => {
    if (!user) return '?';
    return (user.companyName || user.name || user.email || '?').charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('fairlens_token');
    localStorage.removeItem('fairlens_company');
    localStorage.removeItem('fairlens_user');
    navigate('/login');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-[#0f0e0d] text-white flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[#1f1e1c]">
        <h1 className="font-serif text-2xl font-bold text-white tracking-wide">FairLens</h1>
        <p className="text-[10px] text-[#9ca3af] uppercase tracking-widest mt-0.5 font-sans">AI Fairness Audit</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-[#c9400a] text-white font-semibold shadow-md shadow-[#c9400a]/20'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#1f1e1c]'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-[#1f1e1c] p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#c9400a] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {getInitials()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.companyName || user?.name || 'Company'}
            </p>
            <p className="text-xs text-[#9ca3af] truncate">{user?.email}</p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1f1e1c] transition-colors text-sm font-medium"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}