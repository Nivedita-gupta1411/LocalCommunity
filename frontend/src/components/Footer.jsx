import React from 'react';
import { Store } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2 space-x-6 md:mb-0 mb-4">
            <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">
              About
            </a>
            <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">
              Contact
            </a>
            <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">
              Terms
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1 flex items-center justify-center space-x-2">
            <Store className="h-5 w-5 text-emerald-600" />
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} LocalCommunity. Buy. Sell. Exchange. Connect locally.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
