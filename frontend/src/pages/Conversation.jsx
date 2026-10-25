import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Send, ArrowLeft, User } from 'lucide-react';

const Conversation = () => {
  const { productId, otherUserId } = useParams();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [product, setProduct] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchProduct();
    fetchOtherUser();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [productId, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${productId}/${otherUserId}`);
      setMessages(res.data.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      setProduct(res.data.data);
    } catch (err) {
      console.error('Failed to fetch product');
    }
  };

  const fetchOtherUser = async () => {
    try {
      const res = await api.get(`/users/profile/${otherUserId}`);
      setOtherUser(res.data.data);
    } catch (err) {
      console.error('Failed to fetch user');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await api.post('/messages', {
        receiver: otherUserId,
        product: productId,
        message: newMessage.trim()
      });
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!user) return <div className="text-center py-20 text-gray-500">Please log in to view messages.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="bg-white rounded-t-2xl border border-gray-100 p-4 flex items-center space-x-4">
        <Link to="/messages" className="text-gray-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <User className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{otherUser?.name || 'Loading...'}</h2>
          {product && (
            <Link to={`/product/${productId}`} className="text-sm text-emerald-600 hover:underline truncate block">
              Re: {product.title}
            </Link>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 border-x border-gray-100 p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender.toString() === user._id || msg.sender._id === user._id;
            return (
              <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-emerald-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white rounded-b-2xl border border-gray-100 p-4 flex items-center space-x-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default Conversation;
