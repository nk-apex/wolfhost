import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Plus, 
  Grid, 
  List, 
  Search,
  AlertCircle,
  CheckCircle,
  X,
  ArrowUpRight,
  Play,
  StopCircle,
  RefreshCw,
  Terminal,
  Trash2,
  Wallet
} from 'lucide-react';
import { serverAPI, walletAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PLAN_PRICES = {
  Basic: 50,
  Pro: 150,
  Enterprise: 500,
};

const Servers = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [walletBalance, setWalletBalance] = useState(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false);

  const [newServer, setNewServer] = useState({ name: '', plan: 'Basic' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchServers();
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const result = await walletAPI.getBalance();
      if (result.success) {
        setWalletBalance(result.balance);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setBalanceLoaded(true);
    }
  };

  const fetchServers = async () => {
    try {
      const result = await serverAPI.getServers();
      if (result.success) {
        setServers(result.servers);
      }
    } catch (err) {
      showMessage('error', 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleDeployClick = () => {
    if (!balanceLoaded) {
      showMessage('error', 'Loading wallet balance, please wait...');
      return;
    }
    const minRequired = PLAN_PRICES['Basic'];
    if (walletBalance < minRequired) {
      showMessage('error', `Insufficient balance (KES ${walletBalance.toFixed(2)}). Minimum KES ${minRequired} required. Redirecting to wallet...`);
      setTimeout(() => navigate('/wallet'), 2000);
      return;
    }
    setShowCreateModal(true);
  };

  const handleStart = async (serverId) => {
    const result = await serverAPI.startServer(serverId);
    if (result.success) {
      setServers(servers.map(s => s.id === serverId ? result.server : s));
      showMessage('success', 'Server started successfully');
    }
  };

  const handleStop = async (serverId) => {
    const result = await serverAPI.stopServer(serverId);
    if (result.success) {
      setServers(servers.map(s => s.id === serverId ? result.server : s));
      showMessage('success', 'Server stopped');
    }
  };

  const handleRestart = async (serverId) => {
    const result = await serverAPI.restartServer(serverId);
    if (result.success) {
      setServers(servers.map(s => s.id === serverId ? result.server : s));
      showMessage('success', 'Server restarted');
    }
  };

  const handleDelete = async (serverId) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    setServerToDelete(server);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!serverToDelete) return;
    const result = await serverAPI.deleteServer(serverToDelete.id);
    if (result.success) {
      setServers(servers.filter(s => s.id !== serverToDelete.id));
      showMessage('success', `Server "${serverToDelete.name}" deleted successfully`);
    } else {
      showMessage('error', 'Failed to delete server');
    }
    setShowDeleteModal(false);
    setServerToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setServerToDelete(null);
  };

  const handleConsole = (serverId) => {
    setSelectedServer(servers.find(s => s.id === serverId));
    setShowConsoleModal(true);
  };

  const handleCreateServer = async (e) => {
    e.preventDefault();
    if (!newServer.name.trim()) {
      showMessage('error', 'Server name is required');
      return;
    }

    const planCost = PLAN_PRICES[newServer.plan] || 50;
    if (!balanceLoaded || walletBalance < planCost) {
      showMessage('error', `Insufficient balance for ${newServer.plan} plan. You need KES ${planCost} but have KES ${walletBalance.toFixed(2)}. Redirecting to wallet...`);
      setShowCreateModal(false);
      setTimeout(() => navigate('/wallet'), 2000);
      return;
    }

    setCreating(true);
    try {
      const result = await serverAPI.createServer(newServer);
      if (result.success) {
        setServers([...servers, result.server]);
        setShowCreateModal(false);
        setNewServer({ name: '', plan: 'Basic' });
        showMessage('success', 'Server created successfully');
        fetchBalance();
      }
    } catch (err) {
      showMessage('error', 'Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.ip.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" text="Loading servers..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Server Management</h1>
          <p className="text-gray-400 font-mono">
            Deploy and manage your infrastructure
            <span className="text-primary ml-4">
              Total Servers: <span className="text-primary">{servers.length}</span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-primary/20 rounded-lg font-mono text-sm" data-testid="text-wallet-balance-servers">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-gray-400">Balance:</span>
            <span className="text-primary">{balanceLoaded ? `KES ${walletBalance.toFixed(2)}` : '...'}</span>
          </div>
          <motion.button
            className="group px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all flex items-center gap-2"
            onClick={handleDeployClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            data-testid="button-deploy-server"
          >
            <div className="flex items-center text-sm font-mono">
              <Plus className="w-4 h-4 mr-2" />
              Deploy Server
              <ArrowUpRight className="w-4 h-4 ml-2 group-hover:rotate-45 transition-transform" />
            </div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div
            className={`
              fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl max-w-md
              ${message.type === 'success' ? 'bg-primary/5 border border-primary/30 text-primary' : ''}
              ${message.type === 'error' ? 'bg-red-500/5 border border-red-500/30 text-red-400' : ''}
            `}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            data-testid="text-server-message"
          >
            {message.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="text-sm font-mono">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search servers by name or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-primary/20 rounded-lg px-4 py-2 pl-10 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
              data-testid="input-search-servers"
            />
          </div>
          <div className="flex items-center gap-2 border border-primary/20 rounded-lg p-1 bg-black/40">
            <button
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setViewMode('grid')}
              data-testid="button-view-grid"
            >
              <Grid size={18} />
            </button>
            <button
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {filteredServers.length === 0 ? (
        <div className="p-12 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm text-center">
          <Server size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">No servers found</h3>
          <p className="text-gray-500 mb-2 font-mono">
            {searchQuery ? 'Try a different search term' : 'Deploy your first server to get started'}
          </p>
          {!searchQuery && (
            <>
              <p className="text-gray-600 mb-6 font-mono text-xs">
                Minimum balance required: KES {PLAN_PRICES['Basic']}
              </p>
              <button
                className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all inline-flex items-center gap-2 font-mono text-sm"
                onClick={handleDeployClick}
                data-testid="button-deploy-server-empty"
              >
                <Plus size={16} />
                Deploy Server
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredServers.map((server, index) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all group" data-testid={`card-server-${server.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-5 h-5 text-primary" />
                      <h3 className="font-bold truncate">{server.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${server.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-xs font-mono text-gray-400">{server.status.toUpperCase()}</span>
                      <span className="text-xs font-mono text-primary">·</span>
                      <span className="text-xs font-mono text-gray-400">{server.ip}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-mono ${server.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : server.plan === 'Pro' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                      {server.plan}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-1">CPU</p>
                    <p className="font-mono text-sm">{server.cpu || '4 vCPU'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-1">RAM</p>
                    <p className="font-mono text-sm">{server.ram || '8GB'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-1">Storage</p>
                    <p className="font-mono text-sm">{server.storage || '80GB'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-1">Uptime</p>
                    <p className="font-mono text-sm">{server.uptime || '99.9%'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <motion.button
                    onClick={() => server.status === 'online' ? handleStop(server.id) : handleStart(server.id)}
                    className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid={`button-toggle-server-${server.id}`}
                  >
                    {server.status === 'online' ? <StopCircle size={14} /> : <Play size={14} />}
                    {server.status === 'online' ? 'Stop' : 'Start'}
                  </motion.button>
                  <motion.button
                    onClick={() => handleRestart(server.id)}
                    className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid={`button-restart-server-${server.id}`}
                  >
                    <RefreshCw size={14} />
                    Restart
                  </motion.button>
                  <motion.button
                    onClick={() => handleConsole(server.id)}
                    className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid={`button-console-server-${server.id}`}
                  >
                    <Terminal size={14} />
                    Console
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(server.id)}
                    className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid={`button-delete-server-${server.id}`}
                  >
                    <Trash2 size={14} />
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="w-full max-w-md bg-black/90 backdrop-blur-sm border border-primary/20 rounded-xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Deploy New Server
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    data-testid="button-close-create-modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4 p-3 bg-black/40 border border-primary/10 rounded-lg">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono text-gray-400">Your balance:</span>
                  <span className={`text-sm font-mono font-bold ${!balanceLoaded ? 'text-gray-500' : walletBalance >= PLAN_PRICES[newServer.plan] ? 'text-primary' : 'text-red-400'}`}>
                    {balanceLoaded ? `KES ${walletBalance.toFixed(2)}` : 'Loading...'}
                  </span>
                  {balanceLoaded && walletBalance < PLAN_PRICES[newServer.plan] && (
                    <span className="text-xs text-red-400 ml-auto font-mono">Insufficient</span>
                  )}
                </div>

                <form onSubmit={handleCreateServer} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-mono">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={newServer.name}
                      onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                      className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
                      placeholder="my-awesome-server"
                      data-testid="input-server-name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-mono">
                      Server Plan
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(PLAN_PRICES).map(([plan, price]) => {
                        const canAfford = walletBalance >= price;
                        return (
                          <button
                            key={plan}
                            type="button"
                            onClick={() => setNewServer({ ...newServer, plan })}
                            className={`p-3 rounded-lg border text-sm font-mono transition-all ${
                              newServer.plan === plan
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : canAfford
                                  ? 'border-primary/10 hover:border-primary/20 text-gray-400 hover:text-gray-300'
                                  : 'border-red-500/10 text-gray-600 opacity-60'
                            }`}
                            data-testid={`button-plan-${plan.toLowerCase()}`}
                          >
                            {plan}
                            <div className={`text-xs mt-1 ${canAfford ? 'text-gray-500' : 'text-red-400/60'}`}>
                              KES {price}/mo
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {balanceLoaded && walletBalance < PLAN_PRICES[newServer.plan] && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-400 font-mono">
                        You need KES {PLAN_PRICES[newServer.plan]} for the {newServer.plan} plan. 
                        <button
                          type="button"
                          onClick={() => { setShowCreateModal(false); navigate('/wallet'); }}
                          className="underline ml-1 hover:text-red-300 transition-colors"
                          data-testid="link-go-to-wallet"
                        >
                          Top up your wallet
                        </button>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 border border-gray-700 rounded-lg font-mono text-sm transition-all"
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </button>
                    {balanceLoaded && walletBalance < PLAN_PRICES[newServer.plan] ? (
                      <button
                        type="button"
                        onClick={() => { setShowCreateModal(false); navigate('/wallet'); }}
                        className="flex-1 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all"
                        data-testid="button-topup-wallet"
                      >
                        <Wallet size={16} />
                        Top Up Wallet
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all"
                        disabled={creating}
                        data-testid="button-confirm-deploy"
                      >
                        {creating ? <LoadingSpinner size="sm" /> : <Plus size={16} />}
                        {creating ? 'Deploying...' : `Deploy (KES ${PLAN_PRICES[newServer.plan]})`}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConsoleModal && selectedServer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConsoleModal(false)}
          >
            <motion.div
              className="w-full max-w-2xl bg-black/90 backdrop-blur-sm border border-primary/20 rounded-xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    Console - {selectedServer.name}
                  </h2>
                  <button
                    onClick={() => setShowConsoleModal(false)}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    data-testid="button-close-console"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-black/40 border border-primary/10 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                  <div className="text-primary">$ systemctl start wolfhost</div>
                  <div className="text-gray-500">[INFO] Starting server instance...</div>
                  <div className="text-gray-500">[INFO] Loading configuration from /etc/wolfhost/server.conf</div>
                  <div className="text-primary">[OK] Server initialized on {selectedServer.ip}:25565</div>
                  <div className="text-gray-500">[INFO] Memory allocated: {selectedServer.ram || '8GB'}</div>
                  <div className="text-gray-500">[INFO] CPU cores: {selectedServer.cpu || '4'}</div>
                  <div className="text-primary">[SUCCESS] Ready for connections!</div>
                  <div className="mt-4">
                    <div className="text-green-500">[STATUS] Server is running normally</div>
                    <div className="text-gray-500">[METRICS] CPU: 12% | RAM: 45% | NET: 1.2MB/s</div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-primary">wolfhost@server:~$ </span>
                    <span className="ml-1 bg-primary/20 px-1 animate-pulse">█</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all" data-testid="button-ctrl-c">
                    Ctrl+C
                  </button>
                  <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all" data-testid="button-clear-console">
                    Clear
                  </button>
                  <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all ml-auto" data-testid="button-copy-logs">
                    Copy Logs
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && serverToDelete && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelDelete}
          >
            <motion.div
              className="w-full max-w-md bg-black/90 backdrop-blur-sm border border-red-500/20 rounded-xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    Confirm Deletion
                  </h2>
                  <button
                    onClick={cancelDelete}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    data-testid="button-close-delete-modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg mb-4">
                    <Server className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-bold text-sm">{serverToDelete.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{serverToDelete.ip} · {serverToDelete.plan}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Are you sure you want to delete this server? This action cannot be undone and all data will be permanently lost.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 border border-gray-700 rounded-lg font-mono text-sm transition-all"
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all"
                    data-testid="button-confirm-delete"
                  >
                    <Trash2 size={16} />
                    Delete Server
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Servers;
