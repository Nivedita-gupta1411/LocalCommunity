import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import CreateListing from './pages/CreateListing';
import ProductDetails from './pages/ProductDetails';
import MyListings from './pages/MyListings';
import Favorites from './pages/Favorites';
import EditListing from './pages/EditListing';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import Offers from './pages/Offers';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminProducts from './pages/AdminProducts';
import AdminReports from './pages/AdminReports';

const NotFound = () => (
  <div className="max-w-7xl mx-auto px-4 py-28 text-center">
    <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-600 font-extrabold text-3xl mb-4 shadow-xs">
      404
    </div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
    <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
      The page you're searching for might have been moved or is no longer available.
    </p>
    <a href="/" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 shadow-sm transition-colors">
      Return to Home
    </a>
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans pb-16 md:pb-0">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/edit-listing/:id" element={<EditListing />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:productId/:otherUserId" element={<Conversation />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/reports" element={<AdminReports />} />

            {/* Legacy redirect for /dashboard to /profile */}
            <Route path="/dashboard" element={<Navigate to="/profile" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
