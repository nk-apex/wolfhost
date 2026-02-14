import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  GitBranch,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Server,
  Zap,
  Shield,
  Crown,
  Copy,
  Check,
} from 'lucide-react';
import { deployAPI, walletAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEPLOY_PLANS = {
  Limited: {
    price: 50,
    color: 'primary',
    icon: Zap,
    specs: { cpu: '1 vCPU', ram: '5GB', storage: '10GB' },
  },
  Unlimited: {
    price: 100,
    color: 'blue',
    icon: Shield,
    specs: { cpu: '2 vCPU', ram: 'Unlimited', storage: '40GB' },
  },
  Admin: {
    price: 200,
    color: 'purple',
    icon: Crown,
    specs: { cpu: '4 vCPU', ram: 'Unlimited', storage: '80GB' },
  },
};

const Deploy = () => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('Limited');
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deployments, setDeployments] = useState([]);
  const [loadingDeploys, setLoadingDeploys] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [copied, setCopied] = useState(false);
  const [deployedServer, setDeployedServer] = useState(null);

  const GITHUB_REPO = 'https://github.com/7silent-wolf/silentwolf.git';

  useEffect(() => {
    fetchDeployments();
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
    }
  };

  const fetchDeployments = async () => {
    try {
      const result = await deployAPI.getDeployments();
      if (result.success) {
        setDeployments(result.deployments || []);
      }
    } catch (err) {
      console.error('Error fetching deployments:', err);
    } finally {
      setLoadingDeploys(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setMessage({ type: '', text: '' }), 8000);
    } else {
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleDeploy = async () => {
    if (!sessionId.trim()) {
      showMessage('error', 'Please paste your Session ID');
      return;
    }

    if (!user?.panelId && !user?.id) {
      showMessage('error', 'Please log in first');
      return;
    }

    const planPrice = DEPLOY_PLANS[selectedPlan].price;
    if (walletBalance < planPrice) {
      showMessage('error', `Insufficient balance. You need KES ${planPrice} but have KES ${walletBalance.toFixed(2)}. Top up your wallet first.`);
      return;
    }

    setDeploying(true);
    setMessage({ type: '', text: '' });
    setDeployedServer(null);

    try {
      const result = await deployAPI.deploy({
        sessionId: sessionId.trim(),
        userId: user.panelId || user.id,
        userEmail: user.email,
        plan: selectedPlan,
      });

      if (result.success) {
        setDeployedServer(result.server);
        showMessage('success', result.message || 'Deployed successfully!');
        setSessionId('');
        fetchDeployments();
        fetchBalance();
      } else {
        showMessage('error', result.message || 'Deployment failed');
      }
    } catch (err) {
      showMessage('error', 'Failed to deploy. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Rocket className="text-primary" size={28} />
            DEPLOY
          </h1>
          <p className="text-sm font-mono text-gray-500 mt-1">
            One-click deploy from GitHub — paste your Session ID and go
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border font-mono text-sm flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-500/5 border-green-500/30 text-green-400'
                : 'bg-red-500/5 border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="p-6 rounded-xl border border-primary/10 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center">
                <GitBranch size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white">GitHub Repository</h2>
                <p className="text-xs font-mono text-gray-500">Auto-cloned and started on your server</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-primary/10 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GitBranch size={16} className="text-primary" />
                <span className="font-mono text-sm text-primary">
                  {GITHUB_REPO}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(GITHUB_REPO)}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-500" />}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Branch: main — Auto-update enabled
            </div>
          </div>

          <div className="p-6 rounded-xl border border-primary/10 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center">
                <Key size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white">Session ID</h2>
                <p className="text-xs font-mono text-gray-500">Paste your session ID to connect your bot</p>
              </div>
            </div>

            <textarea
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste your Session ID here..."
              className="w-full h-32 p-4 rounded-lg border border-primary/10 bg-black/80 text-white font-mono text-sm placeholder-gray-600 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none transition-all"
            />

            <p className="mt-2 text-xs font-mono text-gray-600">
              Your session ID will be securely stored as an environment variable on your server.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-primary/10 bg-black/50 backdrop-blur-sm">
            <h3 className="text-md font-display font-bold text-white mb-4">Select Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(DEPLOY_PLANS).map(([planName, planInfo]) => {
                const Icon = planInfo.icon;
                const isSelected = selectedPlan === planName;
                return (
                  <motion.button
                    key={planName}
                    onClick={() => setSelectedPlan(planName)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary)/0.1)]'
                        : 'border-primary/10 bg-black/30 hover:border-primary/20'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={18} className={isSelected ? 'text-primary' : 'text-gray-500'} />
                      <span className={`font-display text-sm font-bold ${isSelected ? 'text-primary' : 'text-gray-400'}`}>
                        {planName}
                      </span>
                    </div>
                    <div className="text-xl font-display font-bold text-white mb-2">
                      KES {planInfo.price}
                    </div>
                    <div className="space-y-1">
                      {Object.entries(planInfo.specs).map(([key, val]) => (
                        <div key={key} className="text-xs font-mono text-gray-500">
                          {key.toUpperCase()}: {val}
                        </div>
                      ))}
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-3 flex items-center gap-1 text-xs font-mono text-primary"
                      >
                        <CheckCircle size={14} />
                        Selected
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <motion.button
            onClick={handleDeploy}
            disabled={deploying || !sessionId.trim()}
            className={`w-full py-4 px-6 rounded-lg font-display font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              deploying || !sessionId.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 shadow-[0_0_20px_rgba(var(--primary)/0.15)]'
            }`}
            whileHover={!deploying && sessionId.trim() ? { scale: 1.01 } : {}}
            whileTap={!deploying && sessionId.trim() ? { scale: 0.99 } : {}}
          >
            {deploying ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                DEPLOYING...
              </>
            ) : (
              <>
                <Rocket size={22} />
                DEPLOY NOW — KES {DEPLOY_PLANS[selectedPlan].price}
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {deployedServer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-xl border border-green-500/30 bg-green-500/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle size={24} className="text-green-400" />
                  <h3 className="text-lg font-display font-bold text-green-400">Deployment Successful!</h3>
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Server Name:</span>
                    <span className="text-white">{deployedServer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Server ID:</span>
                    <span className="text-white">{deployedServer.identifier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan:</span>
                    <span className="text-primary">{deployedServer.plan}</span>
                  </div>
                </div>
                {deployedServer.panelUrl && (
                  <a
                    href={deployedServer.panelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-sm hover:bg-primary/20 transition-all"
                  >
                    <ExternalLink size={16} />
                    Open in Panel
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-xl border border-primary/10 bg-black/50 backdrop-blur-sm">
            <h3 className="text-md font-display font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              How It Works
            </h3>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Paste Session ID', desc: 'Enter your bot session ID' },
                { step: '2', title: 'Select Plan', desc: 'Choose your server tier' },
                { step: '3', title: 'Click Deploy', desc: 'Server is created & repo cloned' },
                { step: '4', title: 'Auto Start', desc: 'Bot starts running automatically' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-mono text-primary font-bold">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-white">{item.title}</p>
                    <p className="text-xs font-mono text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-primary/10 bg-black/50 backdrop-blur-sm">
            <h3 className="text-md font-display font-bold text-white mb-4 flex items-center gap-2">
              <Server size={18} className="text-primary" />
              Your Deployments
            </h3>
            {loadingDeploys ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary/50" />
              </div>
            ) : deployments.length === 0 ? (
              <p className="text-sm font-mono text-gray-600 text-center py-4">
                No deployments yet
              </p>
            ) : (
              <div className="space-y-3">
                {deployments.slice(0, 5).map((deploy, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-primary/10 bg-black/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-mono text-white truncate max-w-[150px]">
                        {deploy.serverName}
                      </span>
                      <span className="text-xs font-mono text-primary">{deploy.plan}</span>
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                      {new Date(deploy.deployedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-primary/10 bg-primary/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-500 uppercase">Wallet Balance</span>
              <span className="text-lg font-display font-bold text-primary">
                KES {walletBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Deploy;
