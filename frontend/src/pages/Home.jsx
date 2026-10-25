import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Book, Laptop, Armchair, Bike, Shirt, Pencil, Coffee, Box, ArrowRight, Users, ShoppingBag, Shield, Clock, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const categories = [
  { name: 'Books', icon: Book },
  { name: 'Electronics', icon: Laptop },
  { name: 'Furniture', icon: Armchair },
  { name: 'Cycles', icon: Bike },
  { name: 'Fashion', icon: Shirt },
  { name: 'Stationery', icon: Pencil },
  { name: 'Hostel Essentials', icon: Coffee },
  { name: 'Other', icon: Box },
];

const Home = () => {
  const { user } = useContext(AuthContext);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  useEffect(() => {
    if (user) {
      loadPersonalizedSections();
    }
  }, [user]);

  const loadPersonalizedSections = async () => {
    setLoadingExtras(true);
    try {
      const [recentRes, recRes] = await Promise.all([
        api.get('/users/me/recently-viewed'),
        api.get('/users/me/recommendations')
      ]);
      setRecentlyViewed(recentRes.data.data || []);
      setRecommendations(recRes.data.data || []);
    } catch (err) {
      // Quiet fail if guest or endpoint error
    } finally {
      setLoadingExtras(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Your Campus. Your Community. Your Marketplace.
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Buy. Sell. Rent. Donate.<br />Connect locally.
          </h1>
          <p className="text-xl text-emerald-100 max-w-2xl mb-10">
            The trusted peer-to-peer campus marketplace. Find what you need, negotiate fair prices, and trade safely within your college community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/browse" className="bg-white text-emerald-700 hover:bg-gray-100 px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center">
              Browse Marketplace
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/create-listing" className="bg-emerald-800/50 backdrop-blur-sm text-white hover:bg-emerald-800/70 border border-white/30 px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg transition-all">
              List an Item
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="p-6 text-center">
            <Users className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">Campus Community</p>
            <p className="text-sm text-gray-500">Verified students & hostels</p>
          </div>
          <div className="p-6 text-center">
            <ShoppingBag className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">4 Listing Types</p>
            <p className="text-sm text-gray-500">Buy, Rent, Exchange, Donate</p>
          </div>
          <div className="p-6 text-center">
            <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">Negotiations</p>
            <p className="text-sm text-gray-500">Structured offer & counter flow</p>
          </div>
        </div>
      </div>

      {/* Recently Viewed (if logged in) */}
      {user && recentlyViewed.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-14 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="h-6 w-6 mr-2 text-emerald-600" /> Recently Viewed
              </h2>
              <p className="text-sm text-gray-500">Pick up where you left off</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewed.slice(0, 4).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Rule-Based Recommendations (if logged in) */}
      {user && recommendations.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-14 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-amber-500" /> Recommended For You
              </h2>
              <p className="text-sm text-gray-500">Based on your activity and interests</p>
            </div>
            <Link to="/browse" className="text-sm font-semibold text-emerald-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.slice(0, 4).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Explore by Category</h2>
        <p className="text-gray-500 mb-8">Textbooks, electronics, cycles, and hostel furnishings</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.name} to={`/browse?category=${cat.name}`} className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-emerald-200 group">
                <div className="p-3 bg-emerald-50 rounded-xl mb-3 group-hover:bg-emerald-100 transition-colors">
                  <Icon className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-gray-50 py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">How It Works</h2>
          <p className="text-gray-500 mb-12 text-center">Three simple steps to buy, sell, or rent locally</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Find or List an Item', desc: 'Browse books, electronics, or cycles. Or post your own item for Sale, Rent, Exchange, or free Donation.' },
              { step: '2', title: 'Make an Offer & Chat', desc: 'Negotiate transparently with structured offers or send messages to arrange a campus meetup.' },
              { step: '3', title: 'Meet & Transact', desc: 'Meet safely at your campus library or hostel common room to inspect and complete the exchange.' }
            ].map((item) => (
              <div key={item.step} className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
                <div className="bg-emerald-100 text-emerald-700 rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-5 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
