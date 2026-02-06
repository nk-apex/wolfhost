// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { 
//   Users, 
//   Copy, 
//   CheckCircle, 
//   Share2, 
//   Shield,
//   Gift,
//   ExternalLink
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import { referralAPI } from '../services/api';
// import GlassCard from '../components/GlassCard';
// import NeonProgress from '../components/NeonProgress';
// import StatusBadge from '../components/StatusBadge';
// import LoadingSpinner from '../components/LoadingSpinner';

// const Referrals = () => {
//   const { user } = useAuth();
//   const [referrals, setReferrals] = useState([]);
//   const [referralData, setReferralData] = useState({ link: '', code: '', totalReferrals: 0 });
//   const [loading, setLoading] = useState(true);
//   const [copied, setCopied] = useState(false);

//   useEffect(() => {
//     fetchReferralData();
//   }, []);

//   const fetchReferralData = async () => {
//     try {
//       const [referralsResult, linkResult] = await Promise.all([
//         referralAPI.getReferrals(),
//         referralAPI.getReferralLink()
//       ]);

//       if (referralsResult.success) {
//         setReferrals(referralsResult.referrals);
//         setReferralData(prev => ({ 
//           ...prev, 
//           totalReferrals: referralsResult.totalReferrals,
//           code: referralsResult.referralCode 
//         }));
//       }

//       if (linkResult.success) {
//         setReferralData(prev => ({ 
//           ...prev, 
//           link: linkResult.link,
//           code: linkResult.code 
//         }));
//       }
//     } catch (err) {
//       console.error('Error fetching referral data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const shareReferral = () => {
//     if (navigator.share) {
//       navigator.share({
//         title: 'Join WolfHost',
//         text: 'Sign up for WolfHost using my referral link!',
//         url: referralData.link
//       });
//     } else {
//       copyToClipboard(referralData.link);
//     }
//   };

//   const isAdminUnlocked = (user?.referrals || 0) >= 10;
//   const progress = ((user?.referrals || 0) / 10) * 100;

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-[60vh]">
//         <LoadingSpinner size="lg" text="Loading referrals..." />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl sm:text-3xl font-display font-bold neon-text mb-2">
//           Referral Program
//         </h1>
//         <p className="text-muted-foreground">
//           Invite friends and unlock exclusive rewards
//         </p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <GlassCard>
//           <div className="flex items-center gap-4">
//             <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center neon-border">
//               <Users size={28} className="text-primary" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Total Referrals</p>
//               <p className="text-3xl font-display font-bold neon-text">{user?.referrals || 0}</p>
//             </div>
//           </div>
//         </GlassCard>

//         <GlassCard>
//           <div className="flex items-center gap-4">
//             <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center neon-border">
//               <Gift size={28} className="text-primary" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Rewards Earned</p>
//               <p className="text-3xl font-display font-bold neon-text">${(user?.referrals || 0) * 10}</p>
//             </div>
//           </div>
//         </GlassCard>

//         <GlassCard>
//           <div className="flex items-center gap-4">
//             <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center neon-border">
//               <Shield size={28} className={isAdminUnlocked ? "text-primary" : "text-muted-foreground"} />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Admin Status</p>
//               <p className={`text-lg font-display font-bold ${isAdminUnlocked ? 'neon-text' : 'text-muted-foreground'}`}>
//                 {isAdminUnlocked ? 'Unlocked!' : 'Locked'}
//               </p>
//             </div>
//           </div>
//         </GlassCard>
//       </div>

//       {/* Referral Link Card */}
//       <GlassCard hover={false}>
//         <h2 className="text-lg font-display font-bold mb-4">Your Referral Link</h2>
        
//         <div className="flex flex-col sm:flex-row gap-3 mb-4">
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               value={referralData.link}
//               readOnly
//               className="neon-input pr-12 font-mono text-sm"
//             />
//             <motion.button
//               className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/10 rounded transition-colors"
//               onClick={() => copyToClipboard(referralData.link)}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//             >
//               {copied ? <CheckCircle size={18} className="text-primary" /> : <Copy size={18} />}
//             </motion.button>
//           </div>
//           <motion.button
//             className="neon-button flex items-center justify-center gap-2"
//             onClick={shareReferral}
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//           >
//             <Share2 size={18} />
//             Share
//           </motion.button>
//         </div>

//         <div className="flex items-center gap-2 text-sm text-muted-foreground">
//           <span>Referral Code:</span>
//           <span className="font-mono neon-text">{referralData.code}</span>
//         </div>
//       </GlassCard>

//       {/* Admin Panel Progress */}
//       <GlassCard hover={false}>
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-3">
//             <Shield size={24} className="text-primary" />
//             <h2 className="text-lg font-display font-bold">Admin Panel Unlock</h2>
//           </div>
//           <span className="font-mono text-sm neon-text">{user?.referrals || 0}/10</span>
//         </div>

//         <NeonProgress 
//           value={user?.referrals || 0} 
//           max={10} 
//           showPercentage={false}
//           size="lg"
//         />

//         <div className="mt-4 flex items-center justify-between">
//           <p className="text-sm text-muted-foreground">
//             {isAdminUnlocked 
//               ? '🎉 Congratulations! You have unlocked the Admin Panel.' 
//               : `${10 - (user?.referrals || 0)} more referrals needed`
//             }
//           </p>
//           {isAdminUnlocked && (
//             <motion.a
//               href="/admin"
//               className="neon-button-filled text-sm px-4 py-2 flex items-center gap-2"
//               whileHover={{ scale: 1.02 }}
//             >
//               Access Admin <ExternalLink size={14} />
//             </motion.a>
//           )}
//         </div>
//       </GlassCard>

//       {/* Referral List */}
//       <GlassCard hover={false}>
//         <h2 className="text-lg font-display font-bold mb-4">Your Referrals</h2>
        
//         {referrals.length === 0 ? (
//           <div className="text-center py-8">
//             <Users size={48} className="mx-auto text-muted-foreground mb-4" />
//             <p className="text-muted-foreground">No referrals yet. Share your link to get started!</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b border-border/50">
//                   <th className="text-left p-3 text-sm font-mono text-muted-foreground">Username</th>
//                   <th className="text-left p-3 text-sm font-mono text-muted-foreground hidden sm:table-cell">Email</th>
//                   <th className="text-left p-3 text-sm font-mono text-muted-foreground">Joined</th>
//                   <th className="text-left p-3 text-sm font-mono text-muted-foreground">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {referrals.map((referral, index) => (
//                   <motion.tr 
//                     key={referral.id}
//                     className="border-b border-border/30 hover:bg-primary/5"
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: index * 0.05 }}
//                   >
//                     <td className="p-3 font-mono text-sm">{referral.username}</td>
//                     <td className="p-3 font-mono text-sm text-muted-foreground hidden sm:table-cell">{referral.email}</td>
//                     <td className="p-3 font-mono text-sm text-muted-foreground">{referral.joinedAt}</td>
//                     <td className="p-3">
//                       <StatusBadge status={referral.status} />
//                     </td>
//                   </motion.tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </GlassCard>

//       {/* Rewards Info */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <GlassCard>
//           <h3 className="font-display font-bold mb-3">How it Works</h3>
//           <ul className="space-y-2 text-sm text-muted-foreground">
//             <li className="flex items-start gap-2">
//               <span className="neon-text">1.</span>
//               Share your unique referral link with friends
//             </li>
//             <li className="flex items-start gap-2">
//               <span className="neon-text">2.</span>
//               They sign up using your link
//             </li>
//             <li className="flex items-start gap-2">
//               <span className="neon-text">3.</span>
//               You earn $10 for each successful referral
//             </li>
//             <li className="flex items-start gap-2">
//               <span className="neon-text">4.</span>
//               Reach 10 referrals to unlock Admin Panel
//             </li>
//           </ul>
//         </GlassCard>

//         <GlassCard>
//           <h3 className="font-display font-bold mb-3">Rewards</h3>
//           <ul className="space-y-2 text-sm">
//             <li className="flex items-center justify-between">
//               <span className="text-muted-foreground">Per Referral</span>
//               <span className="neon-text font-mono">$10.00</span>
//             </li>
//             <li className="flex items-center justify-between">
//               <span className="text-muted-foreground">5 Referrals</span>
//               <span className="neon-text font-mono">Free Basic Server</span>
//             </li>
//             <li className="flex items-center justify-between">
//               <span className="text-muted-foreground">10 Referrals</span>
//               <span className="neon-text font-mono">Admin Panel Access</span>
//             </li>
//             <li className="flex items-center justify-between">
//               <span className="text-muted-foreground">25 Referrals</span>
//               <span className="neon-text font-mono">VIP Status</span>
//             </li>
//           </ul>
//         </GlassCard>
//       </div>
//     </div>
//   );
// };

// export default Referrals;




































import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Copy, 
  CheckCircle, 
  Share2, 
  Shield,
  Gift,
  ExternalLink,
  ArrowUpRight,
  DollarSign,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { referralAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Referrals = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [referralData, setReferralData] = useState({ link: '', code: '', totalReferrals: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const [referralsResult, linkResult] = await Promise.all([
        referralAPI.getReferrals(),
        referralAPI.getReferralLink()
      ]);

      if (referralsResult.success) {
        setReferrals(referralsResult.referrals);
        setReferralData(prev => ({ 
          ...prev, 
          totalReferrals: referralsResult.totalReferrals,
          code: referralsResult.referralCode 
        }));
      }

      if (linkResult.success) {
        setReferralData(prev => ({ 
          ...prev, 
          link: linkResult.link,
          code: linkResult.code 
        }));
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join WolfHost',
        text: 'Sign up for WolfHost using my referral link!',
        url: referralData.link
      });
    } else {
      copyToClipboard(referralData.link);
    }
  };

  const isAdminUnlocked = (user?.referrals || 0) >= 10;
  const progress = ((user?.referrals || 0) / 10) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" text="Loading referrals..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
          <p className="text-gray-400 font-mono">
            Invite friends, earn rewards
            <span className="text-primary ml-4">
              Total Earned: <span className="text-primary">${(user?.referrals || 0) * 10}</span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-400">Referrals:</span>
          <span className="text-primary font-mono text-lg">{user?.referrals || 0}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-[1.02] group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Total Referrals
                </p>
                <h3 className="text-3xl font-display font-bold text-white">
                  {user?.referrals || 0}
                </h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-mono">
              Invited friends
            </div>
            <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-[1.02] group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Rewards Earned
                </p>
                <h3 className="text-3xl font-display font-bold text-white">
                  ${(user?.referrals || 0) * 10}
                </h3>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <Gift className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-mono">
              Total earnings
            </div>
            <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-green-400/50 group-hover:text-green-400 transition-colors" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-[1.02] group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Admin Status
                </p>
                <h3 className={`text-3xl font-display font-bold ${isAdminUnlocked ? 'text-primary' : 'text-gray-400'}`}>
                  {isAdminUnlocked ? 'UNLOCKED!' : 'LOCKED'}
                </h3>
              </div>
              <div className={`p-2 ${isAdminUnlocked ? 'bg-primary/10' : 'bg-gray-800/50'} rounded-lg group-hover:${isAdminUnlocked ? 'bg-primary/20' : 'bg-gray-800/80'} transition-colors`}>
                <Shield className={`w-5 h-5 ${isAdminUnlocked ? 'text-primary' : 'text-gray-500'}`} />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-mono">
              {isAdminUnlocked ? 'Admin Panel Access' : `${10 - (user?.referrals || 0)} to unlock`}
            </div>
            <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
          </div>
        </motion.div>
      </div>

      {/* Referral Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Share2 className="w-5 h-5 mr-2 text-primary" /> Your Referral Link
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={referralData.link}
              readOnly
              className="w-full bg-black/40 border border-primary/20 rounded-lg px-4 py-3 font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
            />
            <motion.button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => copyToClipboard(referralData.link)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copied ? <CheckCircle size={18} className="text-primary" /> : <Copy size={18} className="text-gray-400 hover:text-white" />}
            </motion.button>
          </div>
          <motion.button
            className="px-4 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center gap-2 transition-all font-mono text-sm"
            onClick={shareReferral}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Share2 size={16} />
            Share
          </motion.button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Referral Code:</span>
          <span className="font-mono text-primary">{referralData.code}</span>
        </div>
      </motion.div>

      {/* Admin Panel Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" /> Admin Panel Progress
          </h2>
          <span className="font-mono text-sm text-primary">{user?.referrals || 0}/10</span>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-primary font-mono">
              {Math.min((user?.referrals || 0) * 10, 100)}%
            </span>
          </div>
          <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((user?.referrals || 0) * 10, 100)}%` }}
              transition={{ duration: 1, delay: 0.6 }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {isAdminUnlocked 
              ? '🎉 Admin Panel unlocked! Access granted.' 
              : `${10 - (user?.referrals || 0)} more referrals needed`
            }
          </p>
          {isAdminUnlocked && (
            <motion.a
              href="/admin"
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm flex items-center gap-2 transition-all font-mono"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Access Admin <ExternalLink size={14} />
            </motion.a>
          )}
        </div>
      </motion.div>

      {/* Referral List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary" /> Your Referrals
        </h2>
        
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-500 font-mono">No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left p-3 text-xs font-mono text-gray-400 uppercase tracking-wider">Username</th>
                  <th className="text-left p-3 text-xs font-mono text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-left p-3 text-xs font-mono text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="text-left p-3 text-xs font-mono text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral, index) => (
                  <motion.tr 
                    key={referral.id}
                    className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                  >
                    <td className="p-3 font-mono text-sm">{referral.username}</td>
                    <td className="p-3 font-mono text-sm text-gray-400 hidden md:table-cell">{referral.email}</td>
                    <td className="p-3 font-mono text-sm text-gray-400">{referral.joinedAt}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-mono ${
                        referral.status === 'active' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : referral.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm"
        >
          <h3 className="font-bold mb-4 flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-primary" /> How it Works
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-primary font-mono">01.</span>
              <span className="text-sm text-gray-400">Share your unique referral link with friends</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-mono">02.</span>
              <span className="text-sm text-gray-400">They sign up using your link</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-mono">03.</span>
              <span className="text-sm text-gray-400">You earn $10 for each successful referral</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-mono">04.</span>
              <span className="text-sm text-gray-400">Reach 10 referrals to unlock Admin Panel</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm"
        >
          <h3 className="font-bold mb-4 flex items-center">
            <Award className="w-4 h-4 mr-2 text-primary" /> Rewards & Benefits
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Per Referral</span>
              <span className="text-primary font-mono text-sm">$10.00</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm text-gray-400">5 Referrals</span>
              <span className="text-green-400 font-mono text-sm">Free Basic Server</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm text-gray-400">10 Referrals</span>
              <span className="text-primary font-mono text-sm">Admin Panel Access</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm text-gray-400">25 Referrals</span>
              <span className="text-yellow-400 font-mono text-sm">VIP Status</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Referrals;