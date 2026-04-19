import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Fuel, Wrench, LayoutDashboard, BarChart3, Menu, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Kendaraan', path: '/vehicles', icon: Car },
    { name: 'BBM', path: '/fuel', icon: Fuel },
    { name: 'Service', path: '/service', icon: Wrench },
    { name: 'Data', path: '/analysis', icon: BarChart3 },
  ];

  const currentPath = location.pathname;

  const getTheme = () => {
    switch (currentPath) {
      case '/fuel': return { text: 'text-orange-500', bg: 'bg-orange-500', headerBg: 'bg-orange-600', iconBg: 'bg-orange-100', indicator: 'bg-orange-500', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.4)]', navText: 'text-white' };
      case '/service': return { text: 'text-purple-600', bg: 'bg-purple-600', headerBg: 'bg-purple-700', iconBg: 'bg-purple-100', indicator: 'bg-purple-600', glow: 'shadow-[0_0_10px_rgba(147,51,234,0.4)]', navText: 'text-white' };
      case '/analysis': return { text: 'text-blue-600', bg: 'bg-blue-600', headerBg: 'bg-blue-700', iconBg: 'bg-blue-100', indicator: 'bg-blue-600', glow: 'shadow-[0_0_10px_rgba(37,99,235,0.4)]', navText: 'text-white' };
      case '/settings': return { text: 'text-gray-600', bg: 'bg-gray-600', headerBg: 'bg-gray-700', iconBg: 'bg-gray-100', indicator: 'bg-gray-600', glow: 'shadow-[0_0_10px_rgba(75,85,99,0.4)]', navText: 'text-white' };
      case '/vehicles': return { text: 'text-neon-green', bg: 'bg-dark-green', headerBg: 'bg-black', iconBg: 'bg-neon-green/30', indicator: 'bg-neon-green', glow: 'shadow-[0_0_10px_rgba(57,255,20,0.4)]', navText: 'text-text-black' };
      default: return { text: 'text-neon-green', bg: 'bg-dark-green', headerBg: 'bg-dark-green', iconBg: 'bg-neon-green/30', indicator: 'bg-neon-green', glow: 'shadow-[0_0_10px_rgba(57,255,20,0.4)]', navText: 'text-text-black' };
    }
  };

  const theme = getTheme();

  return (
    <div className="min-h-screen bg-light-gray flex flex-col font-sans selection:bg-neon-green selection:text-text-black">
      {/* Top Header - Hidden on Mobile Scroll maybe, but let's keep it clean */}
      <header className={`transition-colors duration-500 ${theme.headerBg} text-white shadow-xl sticky top-0 z-40 md:relative`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="bg-neon-green p-2 rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all group-hover:shadow-[0_0_25px_rgba(57,255,20,0.5)]"
              >
                <Car className="text-text-black h-6 w-6" />
              </motion.div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-xl tracking-tighter text-neon-green uppercase italic">Vehicle<span className="text-white">App</span></span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-60">Personal Fleet Manager</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-lg text-sm font-black uppercase italic tracking-tight transition-all duration-300 ${
                      isActive
                        ? theme.navText
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <item.icon size={16} />
                      {item.name}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-bg"
                        className={`absolute inset-0 ${theme.bg} rounded-lg z-0 ${theme.glow}`}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:block">
              <Link to="/settings" className="p-2 text-gray-400 hover:text-neon-green transition-colors block">
                <Settings size={20} />
              </Link>
            </div>

            {/* Mobile simplified header (Right side) */}
            <div className="md:hidden flex items-center gap-4">
               {/* Just a small indicator or settings icon */}
               <Link to="/settings" className="p-2 text-gray-400 hover:text-neon-green transition-colors">
                  <Settings size={20} />
               </Link>
            </div>
          </div>
        </div>
        
        {/* Animated Accent Line */}
        <motion.div 
          className={`h-0.5 ${theme.bg} w-full`}
          initial={false}
          animate={{ backgroundColor: theme.bg === 'bg-neon-green' ? '#39ff14' : theme.bg === 'bg-orange-500' ? '#f97316' : theme.bg === 'bg-purple-600' ? '#9333ea' : theme.bg === 'bg-blue-600' ? '#2563eb' : '#39ff14' }}
        />
      </header>

      {/* Main Content Area */}
      <main className="flex-grow pb-24 md:pb-8 pt-6 md:pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-dark-green/10 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${
                  isActive ? theme.text : 'text-gray-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? `${theme.iconBg} scale-110` : ''}`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-black uppercase mt-1 tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.name}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="bottom-nav-indicator"
                    className={`absolute -top-[2px] w-8 h-1 ${theme.indicator} rounded-full ${theme.glow}`}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Only visible on desktop or tablet */}
      <footer className="hidden md:block bg-white border-t-2 border-dark-green/5 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Car className="text-dark-green h-5 w-5" />
            <span className="font-black italic uppercase tracking-tighter text-dark-green">Vehicle<span className="text-neon-green bg-dark-green px-1 ml-0.5">App</span></span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Develope by Digi Script Management &bull; {new Date().getFullYear()}
          </p>
          <div className="flex gap-4 opacity-50">
             {/* Social or links placeholders */}
             <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
             <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
