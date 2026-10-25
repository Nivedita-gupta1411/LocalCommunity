import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, User, Clock, ChevronRight } from 'lucide-react';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages');
      // Group messages by conversation (product + other user)
      const grouped = {};
      res.data.data.forEach(msg => {
        const otherUser = msg.sender._id === user._id ? msg.receiver : msg.sender;
        const key = `${msg.product._id}_${otherUser._id}`;
        if (!grouped[key]) {
          grouped[key] = {
            product: msg.product,
            otherUser,
            lastMessage: msg,
            unreadCount: 0,
            key
          };
        }
        // Track unread messages sent TO current user
        if (!msg.read && msg.receiver?._id === user._id) {
          grouped[key].unreadCount++;
        }
        // Keep the latest message
        if (new Date(msg.createdAt) > new Date(grouped[key].lastMessage.createdAt)) {
          grouped[key].lastMessage = msg;
        }
      });

      // Sort by most recent message
      const sorted = Object.values(grouped).sort(
        (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );
      setConversations(sorted);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center py-20 text-gray-500">Please log in to view messages.</div>;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500 mb-4">Start a conversation by contacting a seller on a product page.</p>
          <Link to="/browse" className="text-emerald-600 font-medium hover:underline">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Link
              key={conv.key}
              to={`/messages/${conv.product._id}/${conv.otherUser._id}`}
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center space-x-4">
                {/* Product thumbnail */}
                <div className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {conv.product.images?.[0] ? (
                    <img src={`https://localcommunity-1.onrender.com${conv.product.images[0]}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 truncate">{conv.otherUser.name}</span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{conv.unreadCount}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center flex-shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    Re: {conv.product.title}
                  </p>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {conv.lastMessage.sender?._id === user._id ? 'You: ' : ''}{conv.lastMessage.message}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
