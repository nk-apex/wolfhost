// import { Link, useLocation } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   LayoutDashboard,
//   Server,
//   Users,
//   Receipt,
//   Wallet,
//   Settings,
//   Shield,
//   X
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const menuItems = [
//   { icon: LayoutDashboard, label: 'Overview', path: '/overview' },
//   { icon: Server, label: 'My Servers', path: '/servers' },
//   { icon: Users, label: 'Referrals', path: '/referrals' },
//   { icon: Receipt, label: 'Billing', path: '/billing' },
//   { icon: Wallet, label: 'Wallet', path: '/wallet' },
//   { icon: Settings, label: 'Settings', path: '/settings' },
// ];

// const Sidebar = ({ isOpen, onClose }) => {
//   const location = useLocation();
//   const { user } = useAuth();

//   const isAdminUnlocked = (user?.referrals || 0) >= 10;

//   return (
//     <>
//       {/* Mobile Overlay */}
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//           />
//         )}
//       </AnimatePresence>

//       {/* Sidebar */}
//       <motion.aside
//         className={`
//           fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 
//           border-r border-border/50 bg-sidebar backdrop-blur-xl
//           lg:sticky lg:block
//           ${isOpen ? 'block' : 'hidden lg:block'}
//         `}
//         initial={{ x: -256 }}
//         animate={{ x: 0 }}
//         transition={{ type: 'spring', damping: 25, stiffness: 200 }}
//       >
//         {/* Mobile Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 p-2 rounded-lg hover:bg-primary/10 lg:hidden"
//         >
//           <X size={20} />
//         </button>

//         <nav className="p-4 space-y-2 mt-8 lg:mt-0">
//           {menuItems.map((item) => {
//             const isActive = location.pathname === item.path;
//             const Icon = item.icon;

//             return (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 onClick={onClose}
//               >
//                 <motion.div
//                   className={`
//                     flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
//                     ${isActive 
//                       ? 'bg-primary/10 neon-border' 
//                       : 'hover:bg-primary/5 border border-transparent'
//                     }
//                   `}
//                   whileHover={{ x: 4 }}
//                   whileTap={{ scale: 0.98 }}
//                 >
//                   <Icon 
//                     size={20} 
//                     className={isActive ? 'text-primary' : 'text-muted-foreground'} 
//                   />
//                   <span 
//                     className={`font-mono text-sm ${isActive ? 'neon-text' : 'text-muted-foreground'}`}
//                   >
//                     {item.label}
//                   </span>
//                   {isActive && (
//                     <motion.div
//                       className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
//                       layoutId="activeIndicator"
//                       style={{ boxShadow: '0 0 10px hsl(120 100% 50%)' }}
//                     />
//                   )}
//                 </motion.div>
//               </Link>
//             );
//           })}

//           {/* Admin Panel - Unlocked after 10 referrals */}
//           {isAdminUnlocked && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="mt-4 pt-4 border-t border-border/50"
//             >
//               <Link to="/admin" onClick={onClose}>
//                 <motion.div
//                   className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 neon-border"
//                   whileHover={{ x: 4 }}
//                 >
//                   <Shield size={20} className="text-primary" />
//                   <span className="font-mono text-sm neon-text">Admin Panel</span>
//                   <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full neon-text">
//                     NEW
//                   </span>
//                 </motion.div>
//               </Link>
//             </motion.div>
//           )}
//         </nav>

//         {/* Bottom Stats */}
//         <div className="absolute bottom-4 left-4 right-4">
//           <div className="glass-card p-4">
//             <div className="text-xs text-muted-foreground mb-2">System Status</div>
//             <div className="flex items-center gap-2">
//               <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
//               <span className="text-sm font-mono neon-text">All Systems Operational</span>
//             </div>
//           </div>
//         </div>
//       </motion.aside>
//     </>
//   );
// };

// export default Sidebar;




























import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Server,
  Users,
  Receipt,
  Wallet,
  Settings,
  Shield,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Command Center', path: '/overview' },
  { icon: Server, label: 'My Servers', path: '/servers' },
  { icon: Users, label: 'Referrals', path: '/referrals' },
  { icon: Receipt, label: 'Billing', path: '/billing' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isAdminUnlocked = (user?.referrals || 0) >= 10;

  const handleSignOut = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 
          border-r border-primary/20 bg-black/90 backdrop-blur-xl
          lg:sticky lg:block
          ${isOpen ? 'block' : 'hidden lg:block'}
        `}
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-primary/10 lg:hidden border border-primary/20"
        >
          <X size={20} className="text-gray-500 hover:text-primary transition-colors" />
        </button>

        {/* Logo/Header */}
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse drop-shadow-[0_0_5px_rgba(var(--primary)/0.8)]" />
            </div>
            <h1 className="text-xl font-display font-bold neon-text">WOLFHOST</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
              >
                <motion.div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                    ${isActive 
                      ? 'bg-primary/10 border border-primary/50' 
                      : 'hover:bg-primary/5 border border-primary/10 hover:border-primary/30'
                    }
                  `}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon 
                    size={20} 
                    className={`
                      ${isActive 
                        ? 'text-primary drop-shadow-[0_0_5px_rgba(var(--primary)/0.8)]' 
                        : 'text-gray-500 group-hover:text-primary transition-colors'
                      }
                    `} 
                  />
                  <span 
                    className={`
                      font-mono text-sm ${isActive 
                        ? 'neon-text font-bold' 
                        : 'text-gray-400 group-hover:text-primary transition-colors'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 rounded-full bg-primary"
                      layoutId="activeIndicator"
                      style={{ boxShadow: '0 0 10px rgba(var(--primary), 0.8)' }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}

          {/* Admin Panel - Unlocked after 10 referrals */}
          {isAdminUnlocked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 pt-4 border-t border-primary/20"
            >
              <Link to="/admin" onClick={onClose}>
                <motion.div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/50 group"
                  whileHover={{ x: 4 }}
                >
                  <Shield size={20} className="text-primary drop-shadow-[0_0_5px_rgba(var(--primary)/0.8)]" />
                  <span className="font-mono text-sm neon-text font-bold">Admin Panel</span>
                  <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full neon-text font-mono">
                    NEW
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </nav>

        {/* User Info - Updated to match image */}
        <div className="absolute bottom-24 left-4 right-4">
          <div className="p-4 rounded-lg border border-primary/20 bg-black/50">
            <div className="mb-3">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">
                LOGGED IN AS
              </p>
              <div className="space-y-1">
                <p className="text-sm font-mono text-white truncate">
                  silentwolf@gmail.com
                </p>
                <p className="text-sm font-mono text-gray-400 truncate">
                  britonkiplangat777@gmail.com
                </p>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <motion.button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all duration-200 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut size={16} className="text-gray-500 group-hover:text-primary transition-colors" />
              <span className="text-sm font-mono text-gray-400 group-hover:text-primary transition-colors">
                SIGN OUT
              </span>
            </motion.button>
          </div>
        </div>

        {/* Bottom Stats - Updated to match image */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 rounded-lg border border-primary/20 bg-black/50">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">System Status</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                <span className="text-sm font-mono text-green-500">OPTIMAL</span>
              </div>
              <span className="text-xs font-mono text-gray-500">All secure</span>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;