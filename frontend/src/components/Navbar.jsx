import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Store, User, LogOut, PlusCircle, Heart, MessageSquare, LayoutDashboard, Menu, X, Package, Bell, DollarSign } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Quiet fail if guest or server error
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + Nav Links */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center" onClick={closeMobile}>
              <Store className="h-7 w-7 text-emerald-600" />
              <div className="ml-2">
                <span className="text-xl font-bold tracking-tight text-gray-900">Local<span className="text-emerald-600">Community</span></span>
              </div>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              <Link to="/browse" className="text-gray-600 hover:text-emerald-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors">
                Browse
              </Link>
              {user && (
                <>
                  <Link to="/favorites" className="text-gray-600 hover:text-emerald-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors">
                    Favorites
                  </Link>
                  <Link to="/offers" className="text-gray-600 hover:text-emerald-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors">
                    Offers
                  </Link>
                  <Link to="/messages" className="text-gray-600 hover:text-emerald-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors">
                    Messages
                  </Link>
                  <Link to="/my-listings" className="text-gray-600 hover:text-emerald-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors">
                    My Listings
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-emerald-600 transition-colors" title="Notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/create-listing" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Sell / Share
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="p-2 text-gray-500 hover:text-emerald-600 transition-colors" title="Admin Dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                )}
                <Link to="/profile" className="p-2 text-gray-500 hover:text-emerald-600 transition-colors" title="Profile">
                  <User className="h-5 w-5" />
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <Link to="/notifications" className="relative p-2 text-gray-600">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600 hover:text-emerald-600 p-2">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link to="/browse" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
              Browse Marketplace
            </Link>
            {user ? (
              <>
                <Link to="/create-listing" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-700 bg-emerald-50">
                  <PlusCircle className="inline h-4 w-4 mr-2" /> Create New Listing
                </Link>
                <Link to="/offers" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                  <DollarSign className="inline h-4 w-4 mr-2" /> My Offers
                </Link>
                <Link to="/notifications" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                  <Bell className="inline h-4 w-4 mr-2" /> Notifications ({unreadCount})
                </Link>
                <Link to="/favorites" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                  <Heart className="inline h-4 w-4 mr-2" /> Favorites
                </Link>
                <Link to="/messages" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                  <MessageSquare className="inline h-4 w-4 mr-2" /> Messages
                </Link>
                <Link to="/my-listings" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                  <Package className="inline h-4 w-4 mr-2" /> My Listings
                </Link>
                <Link to="/profile" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                  <User className="inline h-4 w-4 mr-2" /> Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 hover:bg-purple-50">
                    <LayoutDashboard className="inline h-4 w-4 mr-2" /> Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="inline h-4 w-4 mr-2" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                  Login
                </Link>
                <Link to="/register" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 text-center">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
