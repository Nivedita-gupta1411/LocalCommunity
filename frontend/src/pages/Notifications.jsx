import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Bell, Check, CheckCheck, Clock, MessageSquare, DollarSign, Tag } from 'lucide-react';

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'offer_received':
      case 'offer_accepted':
      case 'offer_countered':
        return <DollarSign className="h-5 w-5 text-amber-600" />;
      case 'new_message':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'listing_sold':
        return <Tag className="h-5 w-5 text-emerald-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!user) return <div className="text-center py-20 text-gray-500">Please log in to view your notifications.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="h-6 w-6 mr-2 text-emerald-600" /> Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification(s)` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-20 border border-gray-100 p-4"></div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2.5">
          {notifications.map(notif => (
            <div
              key={notif._id}
              onClick={() => !notif.read && handleMarkRead(notif._id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                notif.read
                  ? 'bg-white border-gray-100 hover:border-gray-200'
                  : 'bg-emerald-50/40 border-emerald-200/70 shadow-xs'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                    {notif.title}
                    {!notif.read && (
                      <span className="ml-2 h-2 w-2 bg-emerald-500 rounded-full inline-block"></span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center space-x-3 mt-2 text-[11px] text-gray-400">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                    {notif.relatedProduct && (
                      <Link
                        to={`/product/${notif.relatedProduct._id || notif.relatedProduct}`}
                        className="text-emerald-600 font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Product
                      </Link>
                    )}
                    {notif.type.includes('offer') && (
                      <Link
                        to="/offers"
                        className="text-amber-600 font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Go to Offers
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(notif._id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications yet</h3>
          <p className="text-gray-500 text-sm">
            Activity like offers, new messages, and listing status updates will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
