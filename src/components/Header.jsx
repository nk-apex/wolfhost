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
    <header className="sticky top-0 z-50 h-16 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left side - Logo & Menu Toggle */}
        {/* <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link to="/overview" className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center neon-border"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-xl font-display font-bold neon-text">W</span>
            </motion.div>
            <span className="hidden sm:block text-xl font-display font-bold neon-text">
              WolfHost
            </span>
          </Link>
        </div> */}

        <div className="flex items-center gap-4">
  <button
    onClick={onMenuToggle}
    className="lg:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary/80"
  >
    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
  </button>
  
  <Link to="/overview" className="flex items-center gap-3">
    <motion.div
      className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <span className="text-xl font-display font-bold text-primary/90">W</span>
    </motion.div>
    <span className="hidden sm:block text-xl font-display font-bold text-primary/90">
      WolfHost
    </span>
  </Link>
</div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Wallet Balance */}
          <Link to="/wallet">
            <motion.div
              className="glass-card px-3 py-2 flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <Wallet size={16} className="text-primary" />
              <span className="font-mono text-sm neon-text">
                KES {headerBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </motion.div>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              className="relative p-2 rounded-lg hover:bg-primary/10 transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  className="absolute right-0 mt-2 w-72 glass-card overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-3 border-b border-border/50">
                    <span className="font-display text-sm">Notifications</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 border-b border-border/30 hover:bg-primary/5 transition-colors"
                      >
                        <p className="text-sm text-foreground">{notif.message}</p>
                        <span className="text-xs text-muted-foreground">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/10 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <User size={16} className="text-primary" />
              </div>
              <span className="hidden sm:block text-sm font-mono">{user?.username || 'User'}</span>
              <ChevronDown size={16} className="hidden sm:block" />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 glass-card overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-3 border-b border-border/50">
                    <p className="font-mono text-sm">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings size={16} />
                      <span className="text-sm">Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <LogOut size={16} />
                      <span className="text-sm">Logout</span>
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
