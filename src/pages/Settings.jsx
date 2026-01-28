// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { 
//   Settings as SettingsIcon, 
//   User, 
//   Lock, 
//   Shield, 
//   Key,
//   Moon,
//   Sun,
//   Copy,
//   RefreshCw,
//   CheckCircle,
//   AlertCircle,
//   Eye,
//   EyeOff
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import GlassCard from '../components/GlassCard';
// import LoadingSpinner from '../components/LoadingSpinner';

// const Settings = () => {
//   const { user, updateUser } = useAuth();
  
//   const [activeTab, setActiveTab] = useState('account');
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', text: '' });
//   const [showPassword, setShowPassword] = useState(false);
  
//   // Form states
//   const [accountForm, setAccountForm] = useState({
//     username: user?.username || '',
//     email: user?.email || ''
//   });
  
//   const [passwordForm, setPasswordForm] = useState({
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
//   const [darkMode, setDarkMode] = useState(true);

//   const [apiKeys, setApiKeys] = useState([
//     { id: 1, name: 'Production API Key', key: 'wh_prod_xxxxxxxxxxxxx', created: '2024-03-01', lastUsed: '2 hours ago' },
//     { id: 2, name: 'Development API Key', key: 'wh_dev_xxxxxxxxxxxxx', created: '2024-02-15', lastUsed: '5 days ago' },
//   ]);

//   const showMessage = (type, text) => {
//     setMessage({ type, text });
//     setTimeout(() => setMessage({ type: '', text: '' }), 3000);
//   };

//   const handleAccountUpdate = async (e) => {
//     e.preventDefault();
//     setLoading(true);
    
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       await updateUser(accountForm);
//       showMessage('success', 'Account updated successfully!');
//     } catch (err) {
//       showMessage('error', 'Failed to update account');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePasswordUpdate = async (e) => {
//     e.preventDefault();
    
//     if (passwordForm.newPassword !== passwordForm.confirmPassword) {
//       showMessage('error', 'Passwords do not match');
//       return;
//     }
    
//     if (passwordForm.newPassword.length < 6) {
//       showMessage('error', 'Password must be at least 6 characters');
//       return;
//     }

//     setLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       showMessage('success', 'Password updated successfully!');
//       setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
//     } catch (err) {
//       showMessage('error', 'Failed to update password');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateApiKey = () => {
//     const newKey = {
//       id: apiKeys.length + 1,
//       name: `New API Key ${apiKeys.length + 1}`,
//       key: `wh_key_${Math.random().toString(36).substring(2, 15)}`,
//       created: new Date().toISOString().split('T')[0],
//       lastUsed: 'Never'
//     };
//     setApiKeys([...apiKeys, newKey]);
//     showMessage('success', 'New API key generated!');
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text);
//     showMessage('success', 'Copied to clipboard!');
//   };

//   const tabs = [
//     { id: 'account', label: 'Account', icon: User },
//     { id: 'security', label: 'Security', icon: Lock },
//     { id: 'api', label: 'API Keys', icon: Key },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl sm:text-3xl font-display font-bold neon-text mb-2">
//           Settings
//         </h1>
//         <p className="text-muted-foreground">
//           Manage your account and preferences
//         </p>
//       </div>

//       {/* Message Toast */}
//       {message.text && (
//         <motion.div
//           className={`
//             flex items-center gap-2 px-4 py-3 rounded-lg
//             ${message.type === 'success' ? 'bg-primary/20 border border-primary/50 text-primary' : ''}
//             ${message.type === 'error' ? 'bg-destructive/20 border border-destructive/50 text-destructive' : ''}
//           `}
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//         >
//           {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
//           <span className="text-sm font-mono">{message.text}</span>
//         </motion.div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Sidebar Tabs */}
//         <GlassCard hover={false} className="lg:col-span-1 h-fit">
//           <nav className="space-y-1">
//             {tabs.map((tab) => {
//               const Icon = tab.icon;
//               return (
//                 <motion.button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`
//                     w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
//                     ${activeTab === tab.id 
//                       ? 'bg-primary/10 border border-primary/50 neon-text' 
//                       : 'hover:bg-primary/5 border border-transparent'
//                     }
//                   `}
//                   whileHover={{ x: 4 }}
//                 >
//                   <Icon size={18} />
//                   <span className="font-mono text-sm">{tab.label}</span>
//                 </motion.button>
//               );
//             })}
//           </nav>

//           {/* Theme Toggle */}
//           <div className="mt-6 pt-6 border-t border-border/50">
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-muted-foreground">Theme</span>
//               <button
//                 onClick={() => setDarkMode(!darkMode)}
//                 className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
//               >
//                 {darkMode ? <Moon size={18} /> : <Sun size={18} />}
//               </button>
//             </div>
//           </div>
//         </GlassCard>

//         {/* Content Area */}
//         <div className="lg:col-span-3">
//           {/* Account Tab */}
//           {activeTab === 'account' && (
//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//             >
//               <GlassCard hover={false}>
//                 <h2 className="text-lg font-display font-bold mb-6">Account Information</h2>
                
//                 <form onSubmit={handleAccountUpdate} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-mono text-muted-foreground mb-2">
//                       Username
//                     </label>
//                     <input
//                       type="text"
//                       value={accountForm.username}
//                       onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
//                       className="neon-input"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-mono text-muted-foreground mb-2">
//                       Email Address
//                     </label>
//                     <input
//                       type="email"
//                       value={accountForm.email}
//                       onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
//                       className="neon-input"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-mono text-muted-foreground mb-2">
//                       Member Since
//                     </label>
//                     <input
//                       type="text"
//                       value={user?.createdAt || '2024-01-15'}
//                       className="neon-input"
//                       disabled
//                     />
//                   </div>

//                   <motion.button
//                     type="submit"
//                     className="neon-button-filled flex items-center gap-2"
//                     disabled={loading}
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
//                   </motion.button>
//                 </form>
//               </GlassCard>
//             </motion.div>
//           )}

//           {/* Security Tab */}
//           {activeTab === 'security' && (
//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               className="space-y-6"
//             >
//               {/* Change Password */}
//               <GlassCard hover={false}>
//                 <h2 className="text-lg font-display font-bold mb-6">Change Password</h2>
                
//                 <form onSubmit={handlePasswordUpdate} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-mono text-muted-foreground mb-2">
//                       Current Password
//                     </label>
//                     <div className="relative">
//                       <input
//                         type={showPassword ? 'text' : 'password'}
//                         value={passwordForm.currentPassword}
//                         onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
//                         className="neon-input pr-12"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
//                       >
//                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                       </button>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-mono text-muted-foreground mb-2">
//                       New Password
//                     </label>
//                     <input
//                       type={showPassword ? 'text' : 'password'}
//                       value={passwordForm.newPassword}
//                       onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
//                       className="neon-input"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-mono text-muted-foreground mb-2">
//                       Confirm New Password
//                     </label>
//                     <input
//                       type={showPassword ? 'text' : 'password'}
//                       value={passwordForm.confirmPassword}
//                       onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
//                       className="neon-input"
//                     />
//                   </div>

//                   <motion.button
//                     type="submit"
//                     className="neon-button-filled flex items-center gap-2"
//                     disabled={loading}
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     {loading ? <LoadingSpinner size="sm" /> : 'Update Password'}
//                   </motion.button>
//                 </form>
//               </GlassCard>

//               {/* Two-Factor Authentication */}
//               <GlassCard hover={false}>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-4">
//                     <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center neon-border">
//                       <Shield size={24} className="text-primary" />
//                     </div>
//                     <div>
//                       <h3 className="font-display font-bold">Two-Factor Authentication</h3>
//                       <p className="text-sm text-muted-foreground">
//                         Add an extra layer of security to your account
//                       </p>
//                     </div>
//                   </div>
//                   <motion.button
//                     className={`px-4 py-2 rounded-lg font-mono text-sm ${
//                       twoFactorEnabled 
//                         ? 'bg-destructive/10 border border-destructive/50 text-destructive'
//                         : 'neon-button'
//                     }`}
//                     onClick={() => {
//                       setTwoFactorEnabled(!twoFactorEnabled);
//                       showMessage('success', twoFactorEnabled ? '2FA disabled' : '2FA enabled');
//                     }}
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     {twoFactorEnabled ? 'Disable' : 'Enable'}
//                   </motion.button>
//                 </div>
//               </GlassCard>
//             </motion.div>
//           )}

//           {/* API Keys Tab */}
//           {activeTab === 'api' && (
//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//             >
//               <GlassCard hover={false}>
//                 <div className="flex items-center justify-between mb-6">
//                   <h2 className="text-lg font-display font-bold">API Keys</h2>
//                   <motion.button
//                     className="neon-button flex items-center gap-2"
//                     onClick={generateApiKey}
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     <RefreshCw size={16} />
//                     Generate New Key
//                   </motion.button>
//                 </div>

//                 <div className="space-y-4">
//                   {apiKeys.map((apiKey, index) => (
//                     <motion.div
//                       key={apiKey.id}
//                       className="p-4 rounded-lg border border-border/30 hover:border-border/50"
//                       initial={{ opacity: 0, y: 10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: index * 0.1 }}
//                     >
//                       <div className="flex items-center justify-between mb-2">
//                         <h3 className="font-mono font-medium">{apiKey.name}</h3>
//                         <button
//                           onClick={() => copyToClipboard(apiKey.key)}
//                           className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
//                         >
//                           <Copy size={16} />
//                         </button>
//                       </div>
//                       <div className="flex items-center gap-2 mb-2">
//                         <code className="text-sm bg-primary/10 px-3 py-1 rounded font-mono neon-text">
//                           {apiKey.key}
//                         </code>
//                       </div>
//                       <div className="flex items-center gap-4 text-xs text-muted-foreground">
//                         <span>Created: {apiKey.created}</span>
//                         <span>Last used: {apiKey.lastUsed}</span>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </div>

//                 <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
//                   <p className="text-sm text-muted-foreground">
//                     <strong className="neon-text">Note:</strong> API keys provide full access to your account. 
//                     Keep them secure and never share them publicly.
//                   </p>
//                 </div>
//               </GlassCard>
//             </motion.div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Settings;




























import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Key,
  Palette,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Sun,
  Moon,
  Zap,
  Layout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState('dark-tech');
  
  const [accountForm, setAccountForm] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Production API Key', key: 'wh_prod_xxxxxxxxxxxxx', created: '2024-03-01', lastUsed: '2 hours ago' },
    { id: 2, name: 'Development API Key', key: 'wh_dev_xxxxxxxxxxxxx', created: '2024-02-15', lastUsed: '5 days ago' },
  ]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Account updated successfully!');
    } catch (err) {
      showMessage('error', 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showMessage('error', 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const newKey = {
      id: apiKeys.length + 1,
      name: `New API Key ${apiKeys.length + 1}`,
      key: `wh_key_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };
    setApiKeys([...apiKeys, newKey]);
    showMessage('success', 'New API key generated!');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showMessage('success', 'Copied to clipboard!');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'account':
        return (
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" /> Account Information
            </h2>
            <form onSubmit={handleAccountUpdate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">
                  Username
                </label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">
                  Email Address
                </label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
              <motion.button
                type="submit"
                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center gap-2 transition-all font-mono"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
              </motion.button>
            </form>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-primary" /> Change Password
              </h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 pr-10 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center gap-2 transition-all font-mono"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Update Password'}
                </motion.button>
              </form>
            </div>
            <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Shield size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-400 font-mono">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <motion.button
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                    twoFactorEnabled 
                      ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400'
                      : 'bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary'
                  }`}
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    showMessage('success', twoFactorEnabled ? '2FA disabled' : '2FA enabled');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {twoFactorEnabled ? 'Disable' : 'Enable'}
                </motion.button>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <Key className="w-5 h-5 mr-2 text-primary" /> API Keys
              </h2>
              <motion.button
                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center gap-2 transition-all font-mono"
                onClick={generateApiKey}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw size={16} />
                Generate New Key
              </motion.button>
            </div>
            <div className="space-y-4">
              {apiKeys.map((apiKey, index) => (
                <motion.div
                  key={apiKey.id}
                  className="p-4 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors bg-black/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-mono font-medium">{apiKey.name}</h3>
                    <button
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm bg-primary/10 px-3 py-1 rounded font-mono text-primary">
                      {apiKey.key}
                    </code>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                    <span>Created: {apiKey.created}</span>
                    <span>Last used: {apiKey.lastUsed}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-gray-400 font-mono">
                <strong className="text-primary">Note:</strong> API keys provide full access to your account. 
                Keep them secure and never share them publicly.
              </p>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-primary" /> Theme Selection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                onClick={() => setTheme('dark-tech')}
                className={`p-4 rounded-xl border transition-all text-left ${
                  theme === 'dark-tech' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${theme === 'dark-tech' ? 'bg-primary/20' : 'bg-black/30'}`}>
                    <Zap size={20} className={theme === 'dark-tech' ? 'text-primary' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className="font-bold">Dark Tech</h3>
                    <p className="text-xs text-gray-400 font-mono">Default dark theme with cyberpunk elements</p>
                  </div>
                </div>
                {theme === 'dark-tech' && (
                  <div className="flex items-center gap-1 text-primary text-xs font-mono">
                    <CheckCircle size={12} />
                    <span>Active</span>
                  </div>
                )}
              </motion.button>
              <motion.button
                onClick={() => setTheme('glassmorphic')}
                className={`p-4 rounded-xl border transition-all text-left ${
                  theme === 'glassmorphic' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${theme === 'glassmorphic' ? 'bg-primary/20' : 'bg-black/30'}`}>
                    <Layout size={20} className={theme === 'glassmorphic' ? 'text-primary' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className="font-bold">Glassmorphic</h3>
                    <p className="text-xs text-gray-400 font-mono">Frosted glass effect with blur</p>
                  </div>
                </div>
                {theme === 'glassmorphic' && (
                  <div className="flex items-center gap-1 text-primary text-xs font-mono">
                    <CheckCircle size={12} />
                    <span>Active</span>
                  </div>
                )}
              </motion.button>
              <motion.button
                onClick={() => setTheme('light-mode')}
                className={`p-4 rounded-xl border transition-all text-left ${
                  theme === 'light-mode' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${theme === 'light-mode' ? 'bg-primary/20' : 'bg-black/30'}`}>
                    <Sun size={20} className={theme === 'light-mode' ? 'text-primary' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className="font-bold">Light Mode</h3>
                    <p className="text-xs text-gray-400 font-mono">Clean light theme</p>
                  </div>
                </div>
                {theme === 'light-mode' && (
                  <div className="flex items-center gap-1 text-primary text-xs font-mono">
                    <CheckCircle size={12} />
                    <span>Active</span>
                  </div>
                )}
              </motion.button>
              <motion.button
                onClick={() => setTheme('midnight')}
                className={`p-4 rounded-xl border transition-all text-left ${
                  theme === 'midnight' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${theme === 'midnight' ? 'bg-primary/20' : 'bg-black/30'}`}>
                    <Moon size={20} className={theme === 'midnight' ? 'text-primary' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className="font-bold">Midnight</h3>
                    <p className="text-xs text-gray-400 font-mono">Deep blue dark theme</p>
                  </div>
                </div>
                {theme === 'midnight' && (
                  <div className="flex items-center gap-1 text-primary text-xs font-mono">
                    <CheckCircle size={12} />
                    <span>Active</span>
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 p-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400 font-mono">
            Manage your account and preferences
            <span className="text-primary ml-4">
              Theme: <span className="text-primary font-mono">{theme.replace('-', ' ')}</span>
            </span>
          </p>
        </div>
      </div>

      {/* Message Toast */}
      {message.text && (
        <motion.div
          className={`
            fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl
            ${message.type === 'success' ? 'bg-primary/5 border border-primary/30 text-primary' : ''}
            ${message.type === 'error' ? 'bg-red-500/5 border border-red-500/30 text-red-400' : ''}
          `}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-mono">{message.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${activeTab === tab.id 
                      ? 'bg-primary/10 border border-primary/30 text-primary' 
                      : 'hover:bg-primary/5 border border-transparent text-gray-400 hover:text-gray-300'
                    }
                  `}
                  whileHover={{ x: 4 }}
                >
                  <Icon size={18} />
                  <span className="font-mono text-sm">{tab.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;