import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Server,
  Activity,
  Trash2,
  UserCheck,
  UserX,
  Pause,
  Play,
  RefreshCw,
  Search,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  DollarSign,
  Phone,
  Mail,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';

const PANEL_URL = 'https://panel.xwolf.space';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ totalUsers: 0, totalServers: 0, totalNodes: 0 });
  const [users, setUsers] = useState([]);
  const [servers, setServers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentsTotalAmount, setPaymentsTotalAmount] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/overview');
      return;
    }
    fetchData();
    fetchPayments();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, serversRes] = await Promise.all([
        fetch(`/api/admin/overview?userId=${user.id}`),
        fetch(`/api/admin/users?userId=${user.id}`),
        fetch(`/api/admin/servers?userId=${user.id}`),
      ]);

      const [overviewData, usersData, serversData] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        serversRes.json(),
      ]);

      if (overviewData.success) setStats(overviewData.stats);
      if (usersData.success) setUsers(usersData.users);
      if (serversData.success) setServers(serversData.servers);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?perPage=100&userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
        setPaymentsTotalAmount(data.totalAmount || 0);
      } else {
        toast.error('Failed to load payments');
      }
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments' && payments.length === 0 && !paymentsLoading) {
      fetchPayments();
    }
  }, [activeTab]);

  const handleDeleteUser = async (targetId) => {
    setActionLoading(`delete-user-${targetId}`);
    try {
      const res = await fetch(`/api/admin/users/${targetId}?userId=${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('User deleted');
        setUsers(prev => prev.filter(u => u.id !== targetId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleToggleAdmin = async (targetId, makeAdmin) => {
    setActionLoading(`admin-${targetId}`);
    try {
      const res = await fetch(`/api/admin/users/${targetId}/admin?userId=${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: makeAdmin }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(makeAdmin ? 'User promoted to admin' : 'Admin access removed');
        setUsers(prev => prev.map(u => u.id === targetId ? { ...u, isAdmin: makeAdmin } : u));
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch {
      toast.error('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendServer = async (serverId, suspend) => {
    setActionLoading(`suspend-${serverId}`);
    try {
      const action = suspend ? 'suspend' : 'unsuspend';
      const res = await fetch(`/api/admin/servers/${serverId}/${action}?userId=${user.id}`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        toast.success(suspend ? 'Server suspended' : 'Server unsuspended');
        setServers(prev => prev.map(s => s.id === serverId ? { ...s, suspended: suspend, status: suspend ? 'suspended' : 'online' } : s));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to update server');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteServer = async (serverId) => {
    setActionLoading(`delete-server-${serverId}`);
    try {
      const res = await fetch(`/api/admin/servers/${serverId}?userId=${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Server deleted');
        setServers(prev => prev.filter(s => s.id !== serverId));
        setStats(prev => ({ ...prev, totalServers: prev.totalServers - 1 }));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to delete server');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServers = servers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ownerUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    (p.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone || '').includes(searchQuery) ||
    (p.customerName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'suspended': return 'text-red-400';
      case 'installing': return 'text-yellow-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const statusDot = (status) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'suspended': return 'bg-red-400';
      case 'installing': return 'bg-yellow-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const recentPayments = [...payments].slice(0, 5);

  if (!user?.isAdmin) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'servers', label: 'Servers', icon: Server },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-gray-400 font-mono text-xs sm:text-sm">Manage users, servers, and system</p>
          </div>
        </div>
        <button
          onClick={() => { fetchData(); if (activeTab === 'payments') fetchPayments(); }}
          className="group px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all"
        >
          <div className="flex items-center text-sm font-mono">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </div>
        </button>
      </div>

      <div className="flex gap-1 sm:gap-2 p-1 rounded-xl border border-primary/10 bg-black/30 backdrop-blur-sm overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-mono text-xs sm:text-sm transition-all flex-1 justify-center whitespace-nowrap min-w-0 ${
              activeTab === tab.id
                ? 'bg-primary/20 text-white border border-primary/30'
                : 'text-gray-400 hover:text-white hover:bg-primary/5'
            }`}
          >
            <tab.icon size={14} className="shrink-0" />
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab !== 'overview' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-primary/20 rounded-lg text-sm font-mono text-white placeholder:text-gray-500 focus:border-primary/50 focus:outline-none"
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {[
                {
                  icon: Users,
                  label: 'Total Users',
                  value: stats.totalUsers,
                  subValue: 'Registered accounts',
                  iconColor: 'text-blue-400',
                  iconBg: 'bg-blue-500/10',
                  glowColor: 'rgba(59,130,246,0.15)',
                },
                {
                  icon: Server,
                  label: 'Total Servers',
                  value: stats.totalServers,
                  subValue: 'Active instances',
                  iconColor: 'text-green-400',
                  iconBg: 'bg-green-500/10',
                  glowColor: 'rgba(34,197,94,0.15)',
                },
                {
                  icon: Activity,
                  label: 'Nodes',
                  value: stats.totalNodes,
                  subValue: 'Infrastructure nodes',
                  iconColor: 'text-purple-400',
                  iconBg: 'bg-purple-500/10',
                  glowColor: 'rgba(168,85,247,0.15)',
                },
                {
                  icon: DollarSign,
                  label: 'Total Revenue',
                  value: `KES ${paymentsTotalAmount.toLocaleString('en-KE')}`,
                  subValue: `${payments.length} payments`,
                  iconColor: 'text-yellow-400',
                  iconBg: 'bg-yellow-500/10',
                  glowColor: 'rgba(234,179,8,0.15)',
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className="p-4 sm:p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition-all"
                    style={{ boxShadow: `0 0 40px ${stat.glowColor}` }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                        <h3 className="text-lg sm:text-2xl font-display font-bold text-white truncate">{stat.value}</h3>
                      </div>
                      <div className={`p-1.5 sm:p-2 ${stat.iconBg} rounded-lg shrink-0 ml-2`}>
                        <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-4 text-[10px] sm:text-xs text-gray-500 font-mono truncate">{stat.subValue}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {recentPayments.length > 0 && (
              <div className="p-4 sm:p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Recent Payments
                  </h3>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="text-xs text-primary font-mono hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {recentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg bg-black/20 border border-primary/10">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.method === 'M-Pesa' ? 'bg-green-500/10 border border-green-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                          {p.method === 'M-Pesa' ? <Phone className="w-3.5 h-3.5 text-green-400" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-mono font-semibold text-white truncate">{p.email || p.phone || 'Unknown'}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{formatDate(p.paidAt)}</p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-mono font-bold text-green-400 shrink-0">+KES {p.amount.toLocaleString('en-KE')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-xs text-gray-500 font-mono">{filteredUsers.length} users</p>
            {filteredUsers.length === 0 ? (
              <div className="p-8 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm text-center">
                <p className="text-gray-400 font-mono">No users found</p>
              </div>
            ) : (
              filteredUsers.map((u, index) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 sm:p-4 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-mono text-xs sm:text-sm font-bold">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs sm:text-sm font-semibold text-white truncate">{u.username}</span>
                          {u.isAdmin && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono border border-primary/30">ADMIN</span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-mono truncate">{u.email}</p>
                        <p className="text-[10px] sm:text-xs text-gray-600 font-mono">
                          {u.serverCount} server{u.serverCount !== 1 ? 's' : ''} · ID: {u.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleAdmin(u.id, !u.isAdmin)}
                        disabled={u.id === user.id || actionLoading === `admin-${u.id}`}
                        title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                        className={`p-1.5 sm:p-2 rounded-lg border transition-colors disabled:opacity-30 ${
                          u.isAdmin
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                        }`}
                      >
                        {u.isAdmin ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'deleteUser', id: u.id, name: u.username })}
                        disabled={u.id === user.id || actionLoading === `delete-user-${u.id}`}
                        title="Delete user"
                        className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'servers' && (
          <motion.div
            key="servers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-xs text-gray-500 font-mono">{filteredServers.length} servers</p>
            {filteredServers.length === 0 ? (
              <div className="p-8 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm text-center">
                <p className="text-gray-400 font-mono">No servers found</p>
              </div>
            ) : (
              filteredServers.map((s, index) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 sm:p-4 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                        <Server className="text-primary" size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs sm:text-sm font-semibold text-white truncate">{s.name}</span>
                          <span className={`flex items-center gap-1 text-[10px] font-mono ${statusColor(s.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(s.status)}`} />
                            {s.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-mono truncate">
                          Owner: {s.ownerUsername} · Node {s.node} · ID: {s.id}
                        </p>
                        {s.limits && (
                          <p className="text-[10px] sm:text-xs text-gray-600 font-mono">
                            {s.limits.memory}MB RAM · {s.limits.disk}MB Disk · {s.limits.cpu}% CPU
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <a
                        href={`${PANEL_URL}/server/${s.identifier}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in panel"
                        className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                      {s.suspended ? (
                        <button
                          onClick={() => handleSuspendServer(s.id, false)}
                          disabled={actionLoading === `suspend-${s.id}`}
                          title="Unsuspend"
                          className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          <Play size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendServer(s.id, true)}
                          disabled={actionLoading === `suspend-${s.id}`}
                          title="Suspend"
                          className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                        >
                          <Pause size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmAction({ type: 'deleteServer', id: s.id, name: s.name })}
                        disabled={actionLoading === `delete-server-${s.id}`}
                        title="Delete server"
                        className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-5 rounded-xl border border-green-500/20 bg-green-500/5">
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                <h3 className="text-lg sm:text-2xl font-bold text-green-400 font-mono">KES {paymentsTotalAmount.toLocaleString('en-KE')}</h3>
              </div>
              <div className="p-3 sm:p-5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Total Payments</p>
                <h3 className="text-lg sm:text-2xl font-bold text-blue-400 font-mono">{payments.length}</h3>
              </div>
              <div className="p-3 sm:p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 col-span-2 sm:col-span-1">
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Payment</p>
                <h3 className="text-lg sm:text-2xl font-bold text-yellow-400 font-mono">
                  KES {payments.length > 0 ? Math.round(paymentsTotalAmount / payments.length).toLocaleString('en-KE') : '0'}
                </h3>
              </div>
            </div>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-mono">{filteredPayments.length} payments</p>
                  <button
                    onClick={fetchPayments}
                    className="text-xs text-primary font-mono hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>

                {filteredPayments.length === 0 ? (
                  <div className="p-8 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm text-center">
                    <CreditCard className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-mono">No payments found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPayments.map((p, index) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="p-3 sm:p-4 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all"
                      >
                        <div className="flex items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${p.method === 'M-Pesa' ? 'bg-green-500/10 border border-green-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                              {p.method === 'M-Pesa' ? <Phone className="w-4 h-4 text-green-400" /> : <CreditCard className="w-4 h-4 text-blue-400" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs sm:text-sm font-semibold text-white truncate">
                                  {p.customerName || p.email || 'Unknown'}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${p.method === 'M-Pesa' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                  {p.method}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                {p.email && (
                                  <span className="text-[10px] sm:text-xs text-gray-500 font-mono flex items-center gap-1 truncate">
                                    <Mail size={10} className="shrink-0" />
                                    {p.email}
                                  </span>
                                )}
                                {p.phone && (
                                  <span className="text-[10px] sm:text-xs text-gray-500 font-mono flex items-center gap-1">
                                    <Phone size={10} className="shrink-0" />
                                    {p.phone}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                                  <Clock size={10} className="shrink-0" />
                                  {formatDate(p.paidAt)}
                                </span>
                                <span className="text-[10px] text-gray-600 font-mono">Ref: {p.reference?.slice(0, 12)}...</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm sm:text-base font-mono font-bold text-green-400">
                              +KES {p.amount.toLocaleString('en-KE')}
                            </span>
                            <p className="text-[10px] text-gray-500 font-mono">{p.currency}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-4 sm:p-6 max-w-md w-full space-y-4 rounded-xl border border-primary/20 bg-black/80 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="text-red-400" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Confirm Delete</h3>
                  <p className="text-xs sm:text-sm text-gray-400 font-mono">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-mono text-gray-300">
                Are you sure you want to delete{' '}
                <span className="text-red-400 font-bold">{confirmAction.name}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-primary/20 text-gray-400 hover:bg-primary/5 transition-colors font-mono text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.type === 'deleteUser') handleDeleteUser(confirmAction.id);
                    if (confirmAction.type === 'deleteServer') handleDeleteServer(confirmAction.id);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors font-mono text-xs sm:text-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
