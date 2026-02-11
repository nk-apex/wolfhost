import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { walletAPI } from '../services/api';

const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [headerBalance, setHeaderBalance] = useState(0);

  useEffect(() => {
    const fetchBal = async () => {
      try {
        const result = await walletAPI.getBalance();
        if (result.success) setHeaderBalance(result.balance);
      } catch (e) { /* ignore */ }
    };
    fetchBal();
    const interval = setInterval(fetchBal, 30000);
    return () => clearInterval(interval);
  }, []);

  const notifications = [
    { id: 1, message: 'Server "Production" started successfully', time: '2 min ago' },
    { id: 2, message: 'Deposit of $100 received', time: '1 hour ago' },
    { id: 3, message: 'New referral signup!', time: '3 hours ago' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-gray-800/60 bg-black/60 backdrop-blur-md">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link to="/overview" className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-lg font-display font-bold text-primary/80">W</span>
            </motion.div>
            <span className="hidden sm:block text-lg font-display font-bold">
              <span className="text-primary/80">WOLF</span>
              <span className="text-gray-400">HOST</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/wallet">
            <motion.div
              className="px-3 py-1.5 flex items-center gap-2 cursor-pointer rounded-lg border border-gray-700/50 bg-black/40 hover:border-gray-600/60 transition-all"
              whileHover={{ scale: 1.02 }}
            >
              <Wallet size={14} className="text-gray-400" />
              <span className="font-mono text-sm text-gray-200">
                KES {headerBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </motion.div>
          </Link>

          <div className="relative">
            <motion.button
              className="relative p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-gray-200"
              onClick={() => setShowNotifications(!showNotifications)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary/70 rounded-full" />
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-700/50 bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-3 border-b border-gray-800/60">
                    <span className="font-mono text-sm text-gray-300">Notifications</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors"
                      >
                        <p className="text-sm text-gray-300">{notif.message}</p>
                        <span className="text-xs text-gray-500 font-mono">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <motion.button
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
                <User size={14} className="text-gray-400" />
              </div>
              <span className="hidden sm:block text-sm font-mono text-gray-300">{user?.username || 'User'}</span>
              <ChevronDown size={14} className="hidden sm:block text-gray-500" />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-700/50 bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-4 border-b border-gray-800/60">
                    <p className="font-mono text-sm text-white">{user?.username}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-300 hover:text-white"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings size={15} className="text-gray-500" />
                      <span className="text-sm font-mono">Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <LogOut size={15} className="text-gray-500" />
                      <span className="text-sm font-mono">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
