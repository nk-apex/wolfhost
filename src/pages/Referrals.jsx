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
  Clock,
  Award,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { referralAPI } from '../services/api';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';

const Referrals = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [adminAwarded, setAdminAwarded] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const [referralsResult, linkResult] = await Promise.all([
        referralAPI.getReferrals(),
        referralAPI.getReferralLink(),
      ]);

      if (referralsResult.success) {
        setReferrals(referralsResult.referrals || []);
        setCompletedCount(referralsResult.totalReferrals || 0);
        setPendingCount(referralsResult.pendingReferrals || 0);
      }

      if (linkResult.success) {
        setReferralCode(linkResult.code);
        setReferralLink(linkResult.link);
      }

      const rewardCheck = await referralAPI.checkAdminReward();
      if (rewardCheck.awarded) {
        setAdminAwarded(true);
        toast.success(rewardCheck.message);
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
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join WolfHost',
        text: `Sign up for WolfHost using my referral link and get started with server hosting!`,
        url: referralLink,
      });
    } else {
      copyToClipboard(referralLink);
    }
  };

  const isAdminUnlocked = completedCount >= 10 || user?.isAdmin;
  const progress = Math.min((completedCount / 10) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" text="Loading referrals..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-primary">Referral Program</h1>
          <p className="text-sm text-muted-foreground font-mono">Invite friends, earn rewards. 10 referrals = Admin Panel!</p>
        </div>
        <button
          onClick={fetchReferralData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors font-mono text-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard hover={false}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-mono">Completed</p>
              <p className="text-3xl font-orbitron font-bold text-green-400">{completedCount}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <Clock className="text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-mono">Pending</p>
              <p className="text-3xl font-orbitron font-bold text-yellow-400">{pendingCount}</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">Waiting to buy a server</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isAdminUnlocked ? 'bg-primary/10 border border-primary/30' : 'bg-gray-500/10 border border-gray-500/30'}`}>
              <Shield className={isAdminUnlocked ? 'text-primary' : 'text-gray-500'} size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-mono">Admin Panel</p>
              <p className={`text-lg font-orbitron font-bold ${isAdminUnlocked ? 'text-primary' : 'text-gray-500'}`}>
                {isAdminUnlocked ? 'UNLOCKED!' : 'LOCKED'}
              </p>
              {!isAdminUnlocked && (
                <p className="text-[10px] text-muted-foreground/60 font-mono">{10 - completedCount} more to unlock</p>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {adminAwarded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl border-2 border-primary bg-primary/5 text-center space-y-3"
        >
          <Award className="mx-auto text-primary" size={48} />
          <h2 className="text-xl font-orbitron font-bold text-primary">Congratulations!</h2>
          <p className="text-muted-foreground font-mono">
            You've reached 10 referrals and have been awarded Admin Panel access!
          </p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors font-mono text-sm"
          >
            Access Admin Panel <ExternalLink size={14} />
          </a>
        </motion.div>
      )}

      <GlassCard hover={false}>
        <h2 className="text-lg font-orbitron font-bold mb-4 flex items-center gap-2">
          <Share2 className="text-primary" size={20} />
          Your Referral Link
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="w-full bg-black/30 border border-primary/20 rounded-lg px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary/40"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => copyToClipboard(referralLink)}
            >
              {copied ? <CheckCircle size={18} className="text-primary" /> : <Copy size={18} className="text-muted-foreground" />}
            </button>
          </div>
          <button
            className="px-4 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center gap-2 transition-all font-mono text-sm text-primary"
            onClick={shareReferral}
          >
            <Share2 size={16} />
            Share
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">Referral Code:</span>
          <span className="font-mono text-primary font-bold">{referralCode}</span>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-orbitron font-bold flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            Admin Panel Progress
          </h2>
          <span className="font-mono text-sm text-primary">{completedCount}/10</span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground font-mono">Progress</span>
            <span className="text-primary font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground font-mono">
          {isAdminUnlocked
            ? 'Admin Panel unlocked! You have full admin access.'
            : `${10 - completedCount} more completed referrals needed. A referral is completed when the invited user purchases a server.`
          }
        </p>
        {isAdminUnlocked && (
          <a
            href="/admin"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors font-mono text-sm"
          >
            Access Admin Panel <ExternalLink size={14} />
          </a>
        )}
      </GlassCard>

      <GlassCard hover={false}>
        <h2 className="text-lg font-orbitron font-bold mb-4 flex items-center gap-2">
          <Users className="text-primary" size={20} />
          Your Referrals
        </h2>

        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-mono">No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref, index) => (
              <motion.div
                key={ref.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-primary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-primary font-mono text-xs font-bold">
                      {(ref.username || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-sm text-foreground">{ref.username}</p>
                    <p className="text-xs text-muted-foreground font-mono">{ref.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                    ref.completed
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {ref.completed ? 'COMPLETED' : 'PENDING'}
                  </span>
                  <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
                    {new Date(ref.registeredAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard hover={false}>
          <h3 className="font-orbitron font-bold mb-3 text-primary">How it Works</h3>
          <ul className="space-y-3 text-sm text-muted-foreground font-mono">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold min-w-[20px]">1.</span>
              Share your unique referral link with friends
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold min-w-[20px]">2.</span>
              They sign up using your link
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold min-w-[20px]">3.</span>
              When they purchase a server, your referral is completed
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold min-w-[20px]">4.</span>
              Reach 10 completed referrals to unlock Admin Panel!
            </li>
          </ul>
        </GlassCard>

        <GlassCard hover={false}>
          <h3 className="font-orbitron font-bold mb-3 text-primary">Rewards</h3>
          <ul className="space-y-3 text-sm font-mono">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Per Completed Referral</span>
              <span className="text-green-400">+1 Point</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">5 Referrals</span>
              <span className="text-blue-400">Halfway There!</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">10 Referrals</span>
              <span className="text-primary font-bold">Admin Panel Access</span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};

export default Referrals;
