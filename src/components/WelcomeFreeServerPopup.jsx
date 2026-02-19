import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Server, Wallet, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const WelcomeFreeServerPopup = ({ user, onClose, onClaimed }) => {
  const [step, setStep] = useState('claim');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/free-server/claim-welcome', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.panelId || user.id,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('topup');
        if (onClaimed) onClaimed();
      } else {
        if (data.alreadyClaimed) {
          setStep('topup');
        } else {
          setError(data.message || 'Failed to claim free server');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('welcome_popup_dismissed', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleDismiss} />

        <motion.div
          className="relative w-full max-w-md rounded-2xl border border-primary/30 bg-[#0a0a0a] p-6 shadow-2xl shadow-primary/10"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {step === 'claim' && (
            <div className="text-center">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4"
                animate={{ boxShadow: ['0 0 15px hsl(120 100% 50% / 0.1)', '0 0 30px hsl(120 100% 50% / 0.3)', '0 0 15px hsl(120 100% 50% / 0.1)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift className="w-8 h-8 text-primary" />
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-white mb-2">
                Welcome to <span className="text-primary">WOLF</span><span className="text-gray-400">HOST</span>!
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                As a new member, you get a <span className="text-primary font-semibold">free 3-day trial server</span> to explore our platform. Claim it now!
              </p>

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <Server className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">Free Trial Server</p>
                    <p className="text-gray-500 text-xs font-mono">1GB RAM | 5GB Disk | 1 vCPU | 3 Days</p>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              <motion.button
                onClick={handleClaim}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-mono font-semibold transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating your server...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Claim My Free Server
                  </>
                )}
              </motion.button>

              <button
                onClick={handleDismiss}
                className="mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                Maybe later
              </button>
            </div>
          )}

          {step === 'topup' && (
            <div className="text-center">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <CheckCircle className="w-8 h-8 text-primary" />
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-white mb-2">
                Server Created!
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Your free trial server is now live! It will be available for <span className="text-primary font-semibold">3 days</span>. For a permanent server, top up your wallet and deploy a paid plan.
              </p>

              <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <Wallet className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">Want a lasting server?</p>
                    <p className="text-gray-500 text-xs font-mono">Top up your wallet to deploy a permanent server.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link to="/wallet" className="flex-1" onClick={handleDismiss}>
                  <motion.button
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-mono font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Wallet className="w-4 h-4" />
                    Top Up Now
                  </motion.button>
                </Link>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors font-mono text-sm"
                >
                  Later
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeFreeServerPopup;
