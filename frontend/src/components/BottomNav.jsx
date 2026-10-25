import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusCircle, DollarSign, MessageSquare, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40 py-1.5 px-3 shadow-lg">
      <div className="flex justify-around items-center">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-emerald-600'
            }`
          }
        >
          <Home className="h-5 w-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/browse"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-emerald-600'
            }`
          }
        >
          <Compass className="h-5 w-5 mb-0.5" />
          <span>Browse</span>
        </NavLink>

        <NavLink
          to="/create-listing"
          className="flex flex-col items-center -mt-4"
        >
          <div className="h-11 w-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 mt-0.5">Post</span>
        </NavLink>

        <NavLink
          to="/offers"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-emerald-600'
            }`
          }
        >
          <DollarSign className="h-5 w-5 mb-0.5" />
          <span>Offers</span>
        </NavLink>

        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-emerald-600'
            }`
          }
        >
          <MessageSquare className="h-5 w-5 mb-0.5" />
          <span>Chat</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-emerald-600 font-bold' : 'text-gray-500 hover:text-emerald-600'
            }`
          }
        >
          <User className="h-5 w-5 mb-0.5" />
          <span>Account</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
