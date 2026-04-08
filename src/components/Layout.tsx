import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Fuel, Wrench, LayoutDashboard, BarChart3, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Kendaraan', path: '/vehicles', icon: Car },
    { name: 'BBM', path: '/fuel', icon: Fuel },
    { name: 'Service', path: '/service', icon: Wrench },
    { name: 'Analisis', path: '/analysis', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-dark-green text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-neon-green p-2 rounded-lg">
                <Car className="text-text-black h-6 w-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-neon-green">VehicleApp</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-neon-green text-text-black'
                        : 'text-gray-300 hover:bg-neon-green hover:text-text-black'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon size={18} />
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-neon-green hover:bg-neon-green hover:text-text-black focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-dark-green border-t border-neon-green/20"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === item.path
                        ? 'bg-neon-green text-text-black'
                        : 'text-gray-300 hover:bg-neon-green hover:text-text-black'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>

      <footer className="bg-dark-green text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-70">
            &copy; {new Date().getFullYear()} Vehicle Maintenance App. Built with Neon Green.
          </p>
        </div>
      </footer>
    </div>
  );
}
