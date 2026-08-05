import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  LightBulbIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/api';

export default function NotificationDrawer({ isOpen, onClose, onUnreadCountChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      const list = res.notifications || [];
      setNotifications(list);
      const unread = res.unreadCount ?? list.filter((n) => !n.read).length;
      onUnreadCountChange?.(unread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      onUnreadCountChange?.(Math.max(0, notifications.filter((n) => !n.read).length - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onUnreadCountChange?.(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif._id);
    }
    onClose();

    if (notif.type === 'audit_completed' && notif.data?.auditId) {
      navigate('/dashboard', { state: { auditId: notif.data.auditId } });
    } else if (notif.type === 'report_ready') {
      navigate('/compliance-reports');
    } else if (notif.type === 'bias_increased') {
      navigate('/monitoring');
    } else if (notif.type === 'new_recommendation') {
      navigate('/remediation');
    }
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'audit_completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'bias_increased':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'report_ready':
        return <DocumentTextIcon className="w-5 h-5 text-blue-600" />;
      case 'new_recommendation':
        return <LightBulbIcon className="w-5 h-5 text-amber-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-[#c9400a]" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#e5e7eb] animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-[#c9400a]" />
            <h3 className="font-serif text-lg font-bold text-[#0f0e0d]">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-[#c9400a] hover:underline flex items-center gap-1"
            >
              <CheckIcon className="w-4 h-4" />
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 rounded text-gray-500 hover:text-gray-800">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="text-center py-8 text-[#6b7280]">Loading notifications...</div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-12 text-[#9ca3af]">
              <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-sm">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">Audit updates and bias alerts will appear here.</p>
            </div>
          )}

          {!loading &&
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleItemClick(notif)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-white border-gray-200 hover:border-gray-300'
                    : 'bg-orange-50/60 border-orange-200 hover:border-orange-300 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-[#0f0e0d] truncate">{notif.title}</p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#c9400a] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#6b7280] line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-[#9ca3af] mt-2">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
