// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { 
//   Server, 
//   Wallet, 
//   Users, 
//   Activity, 
//   Plus, 
//   ArrowUpRight,
//   Zap,
//   TrendingUp
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import { statsAPI, activityAPI } from '../services/api';
// import GlassCard from '../components/GlassCard';
// import LoadingSpinner from '../components/LoadingSpinner';
// import NeonProgress from '../components/NeonProgress';

// const Overview = () => {
//   const { user } = useAuth();
//   const [stats, setStats] = useState(null);
//   const [activities, setActivities] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [statsResult, activityResult] = await Promise.all([
//         statsAPI.getOverviewStats(),
//         activityAPI.getRecentActivity()
//       ]);

//       if (statsResult.success) setStats(statsResult.stats);
//       if (activityResult.success) setActivities(activityResult.activities);
//     } catch (err) {
//       console.error('Error fetching overview data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-[60vh]">
//         <LoadingSpinner size="lg" text="Loading dashboard..." />
//       </div>
//     );
//   }

//   const statCards = [
//     { 
//       icon: Server, 
//       label: 'Total Servers', 
//       value: stats?.totalServers || 0,
//       subValue: `${stats?.onlineServers || 0} online`,
//       color: 'hsl(120 100% 50%)',
//       link: '/servers'
//     },
//     { 
//       icon: Wallet, 
//       label: 'Wallet Balance', 
//       value: `$${(user?.wallet || 0).toFixed(2)}`,
//       subValue: 'Available funds',
//       color: 'hsl(120 100% 50%)',
//       link: '/wallet'
//     },
//     { 
//       icon: Users, 
//       label: 'Referrals', 
//       value: user?.referrals || 0,
//       subValue: `${10 - (user?.referrals || 0)} to Admin`,
//       color: 'hsl(120 100% 50%)',
//       link: '/referrals'
//     },
//     { 
//       icon: Activity, 
//       label: 'Uptime', 
//       value: stats?.uptime || '99.9%',
//       subValue: 'Last 30 days',
//       color: 'hsl(120 100% 50%)',
//       link: '/servers'
//     },
//   ];

//   const quickActions = [
//     { icon: Plus, label: 'Create Server', path: '/servers', color: 'primary' },
//     { icon: Wallet, label: 'Deposit Funds', path: '/wallet', color: 'primary' },
//     { icon: Users, label: 'View Referrals', path: '/referrals', color: 'primary' },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Welcome Header */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="mb-8"
//       >
//         <h1 className="text-2xl sm:text-3xl font-display font-bold neon-text mb-2">
//           Welcome back, {user?.username || 'User'}
//         </h1>
//         <p className="text-muted-foreground">
//           Here's what's happening with your servers today.
//         </p>
//       </motion.div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {statCards.map((stat, index) => (
//           <Link key={stat.label} to={stat.link}>
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//             >
//               <GlassCard className="group">
//                 <div className="flex items-start justify-between mb-4">
//                   <div 
//                     className="w-12 h-12 rounded-lg flex items-center justify-center"
//                     style={{ 
//                       background: 'hsl(120 100% 50% / 0.1)',
//                       boxShadow: '0 0 20px hsl(120 100% 50% / 0.2)'
//                     }}
//                   >
//                     <stat.icon size={24} className="text-primary" />
//                   </div>
//                   <ArrowUpRight 
//                     size={20} 
//                     className="text-muted-foreground group-hover:text-primary transition-colors" 
//                   />
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
//                   <p className="text-2xl font-display font-bold neon-text">{stat.value}</p>
//                   <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
//                 </div>
//               </GlassCard>
//             </motion.div>
//           </Link>
//         ))}
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Quick Actions */}
//         <motion.div
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ delay: 0.4 }}
//         >
//           <GlassCard hover={false}>
//             <div className="flex items-center gap-2 mb-6">
//               <Zap size={20} className="text-primary" />
//               <h2 className="text-lg font-display font-bold">Quick Actions</h2>
//             </div>
//             <div className="space-y-3">
//               {quickActions.map((action) => (
//                 <Link key={action.label} to={action.path}>
//                   <motion.div
//                     className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
//                     whileHover={{ x: 4 }}
//                   >
//                     <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                       <action.icon size={18} className="text-primary" />
//                     </div>
//                     <span className="font-mono text-sm">{action.label}</span>
//                     <ArrowUpRight size={16} className="ml-auto text-muted-foreground" />
//                   </motion.div>
//                 </Link>
//               ))}
//             </div>
//           </GlassCard>
//         </motion.div>

//         {/* Recent Activity */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.5 }}
//           className="lg:col-span-2"
//         >
//           <GlassCard hover={false}>
//             <div className="flex items-center gap-2 mb-6">
//               <TrendingUp size={20} className="text-primary" />
//               <h2 className="text-lg font-display font-bold">Recent Activity</h2>
//             </div>
//             <div className="space-y-4">
//               {activities.map((activity, index) => (
//                 <motion.div
//                   key={activity.id}
//                   className="flex items-center gap-4 p-3 rounded-lg border border-border/30 hover:border-border/50 transition-colors"
//                   initial={{ opacity: 0, x: 20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: 0.6 + index * 0.1 }}
//                 >
//                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
//                   <div className="flex-1">
//                     <p className="text-sm font-medium">{activity.action}</p>
//                     <p className="text-xs text-muted-foreground">{activity.target}</p>
//                   </div>
//                   <span className="text-xs text-muted-foreground font-mono">
//                     {activity.time}
//                   </span>
//                 </motion.div>
//               ))}
//             </div>
//           </GlassCard>
//         </motion.div>
//       </div>

//       {/* Referral Progress */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.7 }}
//       >
//         <GlassCard hover={false}>
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-2">
//               <Users size={20} className="text-primary" />
//               <h2 className="text-lg font-display font-bold">Admin Panel Progress</h2>
//             </div>
//             <Link 
//               to="/referrals" 
//               className="text-sm text-primary hover:underline font-mono flex items-center gap-1"
//             >
//               View Referrals <ArrowUpRight size={14} />
//             </Link>
//           </div>
//           <NeonProgress 
//             value={user?.referrals || 0} 
//             max={10} 
//             label={`${user?.referrals || 0}/10 Referrals to unlock Admin Panel`}
//             size="lg"
//           />
//           {(user?.referrals || 0) >= 10 && (
//             <motion.div 
//               className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/50 text-center"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//             >
//               <span className="neon-text font-mono">🎉 Admin Panel Unlocked! Check the sidebar.</span>
//             </motion.div>
//           )}
//         </GlassCard>
//       </motion.div>
//     </div>
//   );
// };

// export default Overview;





























import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Server, 
  Wallet, 
  Users, 
  Activity, 
  Plus, 
  ArrowUpRight,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { statsAPI, activityAPI } from '../services/api';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import NeonProgress from '../components/NeonProgress';

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResult, activityResult] = await Promise.all([
        statsAPI.getOverviewStats(),
        activityAPI.getRecentActivity()
      ]);

      if (statsResult.success) setStats(statsResult.stats);
      if (activityResult.success) setActivities(activityResult.activities);
    } catch (err) {
      console.error('Error fetching overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const statCards = [
    { 
      icon: Server, 
      label: 'Active Servers', 
      value: `${stats?.onlineServers || 0}/${stats?.totalServers || 0}`,
      subValue: 'running at peak efficiency',
      color: 'rgba(0,255,0,0.15)',
      link: '/servers'
    },
    { 
      icon: Wallet, 
      label: 'Wallet Balance', 
      value: `$${(user?.wallet || 0).toFixed(2)}`,
      subValue: 'Available for deployment',
      color: 'rgba(0,255,0,0.15)',
      link: '/wallet'
    },
    { 
      icon: Users, 
      label: 'Referral Code', 
      value: user?.referralCode || 'N/A',
      subValue: 'Earn 10% on every referral',
      color: 'rgba(0,255,0,0.15)',
      link: '/referrals'
    },
    { 
      icon: Activity, 
      label: 'System Status', 
      value: stats?.uptime || '99.9%',
      subValue: 'Last 30 days uptime',
      color: 'rgba(0,255,0,0.15)',
      link: '/servers'
    },
  ];

  const quickActions = [
    { icon: Plus, label: 'Deploy Server', path: '/servers', color: 'primary' },
    { icon: Wallet, label: 'Add Funds', path: '/wallet', color: 'primary' },
    { icon: Users, label: 'Invite Friends', path: '/referrals', color: 'primary' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Command Center</h1>
          <p className="text-gray-400 font-mono">
            Welcome back, {user?.username || 'User'}
            <span className="text-primary ml-4">
              System Status: <span className="text-primary animate-pulse">OPTIMAL</span>
            </span>
          </p>
        </div>
        <Link to="/servers">
          <button className="group px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all hover:scale-105">
            <div className="flex items-center text-sm font-mono">
              <ArrowUpRight className="w-4 h-4 mr-2 group-hover:rotate-45 transition-transform" />
              Deploy Server
            </div>
          </button>
        </Link>
      </div>

      {/* Stats Grid - Matching the original style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <div 
                className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition-all hover:scale-[1.02]"
                style={{ 
                  boxShadow: `0 0 40px ${stat.color}` 
                }}
              >
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(ellipse at center, ${stat.color} 0%, transparent 70%)`,
                  }}
                />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    <h3 className="text-3xl font-display font-bold text-white truncate">
                      {stat.value}
                    </h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 font-mono relative z-10">
                  {stat.subValue}
                </div>
                
                {/* Hover arrow */}
                <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions - Styled to match */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link to={action.path}>
                <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 hover:scale-[1.02] transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <action.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{action.label}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        Click to proceed
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors group-hover:rotate-45" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity - Matching style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" /> System Activity
            </h2>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    className="p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors bg-black/20"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div className="flex-1">
                        <p className="text-sm font-mono">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.target}</p>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        {activity.time}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="min-h-[200px] flex items-center justify-center text-gray-500 font-mono text-sm border border-dashed border-primary/10 rounded-lg">
                  No recent system anomalies detected. All secure.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Referral Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" /> Referral Progress
              </h2>
              <Link 
                to="/referrals" 
                className="text-xs text-primary hover:underline font-mono flex items-center gap-1"
              >
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Referrals</span>
                <span className="text-primary font-mono">
                  {user?.referrals || 0}/10
                </span>
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((user?.referrals || 0) * 10, 100)}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
              <p className="text-xs text-gray-500 font-mono mt-2">
                {user?.referrals >= 10 ? '🎉 Admin Panel Unlocked!' : `${10 - (user?.referrals || 0)} more to unlock Admin Panel`}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-2">Your Referral Code:</p>
              <div className="font-mono text-lg bg-primary/10 border border-primary/20 rounded-lg p-3 text-center tracking-wider">
                {user?.referralCode || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-3 text-center">
                Earn 10% on every referral
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Overview;