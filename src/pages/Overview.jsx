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
  CreditCard,
  Smartphone,
  ArrowDownToLine,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Overview = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [depositCount, setDepositCount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [serverCount, setServerCount] = useState({ total: 0, online: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchWithTimeout = (url, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal })
      .then(r => { clearTimeout(timer); return r.json(); })
      .catch(() => { clearTimeout(timer); return { success: false }; });
  };

  const fetchData = async () => {
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    const userId = currentUser.panelId || currentUser.id;
    const userEmail = currentUser.email || '';

    try {
      if (userId) {
        const serverResult = await fetchWithTimeout(`/api/servers?userId=${encodeURIComponent(userId)}`);
        if (serverResult.success && serverResult.servers) {
          const onlineCount = serverResult.servers.filter(s => s.status === 'running' || s.status === 'online').length;
          setServerCount({ total: serverResult.servers.length, online: onlineCount });
        }
      }
    } catch (e) {}

    try {
      const emailParam = userEmail ? `email=${encodeURIComponent(userEmail)}` : '';
      const [balanceResult, txnResult] = await Promise.all([
        fetchWithTimeout(`/api/transactions/totals${emailParam ? `?${emailParam}` : ''}`),
        fetchWithTimeout(`/api/transactions?perPage=10${emailParam ? `&${emailParam}` : ''}`)
      ]);

      if (balanceResult.success) {
        setBalance(balanceResult.balance || 0);
        setTotalDeposits(balanceResult.totalDeposits || 0);
        setDepositCount(balanceResult.totalCount || 0);
      }

      if (txnResult.success && txnResult.transactions) {
        setTransactions(txnResult.transactions);
      }
    } catch (err) {
      console.error('Error fetching overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="w-3 h-3 text-green-400" />;
    if (status === 'failed') return <XCircle className="w-3 h-3 text-red-400" />;
    return <Clock className="w-3 h-3 text-yellow-400" />;
  };

  const getChannelIcon = (channel) => {
    if (channel === 'card') return <CreditCard className="w-4 h-4 text-blue-400" />;
    if (channel === 'mobile_money') return <Smartphone className="w-4 h-4 text-green-400" />;
    return <ArrowDownToLine className="w-4 h-4 text-primary" />;
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
      label: 'Servers', 
      value: serverCount.total > 0 ? `${serverCount.online}/${serverCount.total}` : '0',
      subValue: serverCount.total > 0 ? `${serverCount.online} online` : 'No servers deployed yet',
      color: 'rgba(0,255,0,0.15)',
      link: '/servers'
    },
    { 
      icon: Wallet, 
      label: 'Wallet Balance', 
      value: `KES ${balance.toLocaleString()}`,
      subValue: 'Available for deployment',
      color: 'rgba(0,255,0,0.15)',
      link: '/wallet'
    },
    { 
      icon: CreditCard, 
      label: 'Total Deposits', 
      value: `KES ${totalDeposits.toLocaleString()}`,
      subValue: `${depositCount} transaction${depositCount !== 1 ? 's' : ''}`,
      color: 'rgba(0,255,0,0.15)',
      link: '/wallet'
    },
    { 
      icon: Users, 
      label: 'Referrals', 
      value: `${user?.referrals || 0}/10`,
      subValue: user?.referrals >= 10 ? 'Admin Panel Unlocked' : `${10 - (user?.referrals || 0)} more to unlock Admin`,
      color: 'rgba(0,255,0,0.15)',
      link: '/referrals'
    },
  ];

  const quickActions = [
    { icon: Plus, label: 'Deploy Server', path: '/servers', desc: 'Launch a new server instance' },
    { icon: Wallet, label: 'Add Funds', path: '/wallet', desc: 'Deposit via M-Pesa or Card' },
    { icon: Users, label: 'Invite Friends', path: '/referrals', desc: 'Earn 10% on referrals' },
  ];

  return (
    <div className="space-y-8" data-testid="overview-page">
      <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome-heading">Command Center</h1>
          <p className="text-gray-400 font-mono" data-testid="text-welcome-message">
            Welcome back, {user?.username || 'User'}
          </p>
        </div>
        <Link to="/servers">
          <button className="group px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all" data-testid="button-deploy-server">
            <div className="flex items-center text-sm font-mono">
              <Plus className="w-4 h-4 mr-2" />
              Deploy Server
            </div>
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link} data-testid={`link-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div 
                className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition-all"
                style={{ boxShadow: `0 0 40px ${stat.color}` }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at center, ${stat.color} 0%, transparent 70%)` }}
                />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-display font-bold text-white truncate" data-testid={`text-stat-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 font-mono relative z-10">{stat.subValue}</div>
                <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

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
              <Link to={action.path} data-testid={`link-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <action.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{action.label}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">{action.desc}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" /> Recent Transactions
            </h2>
            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.slice(0, 6).map((txn, index) => (
                  <motion.div
                    key={txn.id || txn.reference}
                    className="p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors bg-black/20"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    data-testid={`card-transaction-${txn.reference}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getChannelIcon(txn.channel)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono truncate">
                            {txn.channel === 'card' ? 'Card Payment' : txn.channel === 'mobile_money' ? 'M-Pesa Deposit' : 'Deposit'}
                            {txn.last4 && <span className="text-gray-500 ml-1">****{txn.last4}</span>}
                            {txn.phone && <span className="text-gray-500 ml-1">{txn.phone}</span>}
                          </p>
                          {getStatusIcon(txn.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          KES {txn.amount?.toLocaleString()} - {formatTimeAgo(txn.paidAt || txn.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="min-h-[200px] flex flex-col items-center justify-center text-gray-500 font-mono text-sm border border-dashed border-primary/10 rounded-lg gap-3">
                  <Wallet className="w-8 h-8 text-primary/30" />
                  <p>No transactions yet</p>
                  <Link to="/wallet" className="text-primary text-xs hover:underline" data-testid="link-first-deposit">
                    Make your first deposit
                  </Link>
                </div>
              )}
              {transactions.length > 0 && (
                <Link 
                  to="/wallet" 
                  className="block text-center text-xs text-primary hover:underline font-mono mt-2"
                  data-testid="link-view-all-transactions"
                >
                  View all transactions
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
              <h2 className="text-xl font-bold flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" /> Referral Progress
              </h2>
              <Link 
                to="/referrals" 
                className="text-xs text-primary hover:underline font-mono flex items-center gap-1"
                data-testid="link-view-referrals"
              >
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Referrals</span>
                <span className="text-primary font-mono" data-testid="text-referral-count">
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
                {user?.referrals >= 10 ? 'Admin Panel Unlocked!' : `${10 - (user?.referrals || 0)} more to unlock Admin Panel`}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-2">Your Referral Code:</p>
              <div className="font-mono text-lg bg-primary/10 border border-primary/20 rounded-lg p-3 text-center tracking-wider" data-testid="text-referral-code">
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
