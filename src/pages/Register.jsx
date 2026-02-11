// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import NeonBackground from '../components/NeonBackground';
// import GlassCard from '../components/GlassCard';
// import LoadingSpinner from '../components/LoadingSpinner';

// const Register = () => {
//   const navigate = useNavigate();
//   const { register } = useAuth();
  
//   const [formData, setFormData] = useState({
//     email: '',
//     username: '',
//     password: '',
//     confirmPassword: ''
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const validateEmail = (email) => {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   };

//   const validateForm = () => {
//     if (!formData.email.trim()) {
//       setError('Email is required');
//       return false;
//     }
//     if (!validateEmail(formData.email)) {
//       setError('Please enter a valid email address');
//       return false;
//     }
//     if (!formData.username.trim()) {
//       setError('Username is required');
//       return false;
//     }
//     if (formData.username.length < 3) {
//       setError('Username must be at least 3 characters');
//       return false;
//     }
//     if (!formData.password) {
//       setError('Password is required');
//       return false;
//     }
//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters');
//       return false;
//     }
//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match');
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');

//     if (!validateForm()) return;

//     setLoading(true);
//     try {
//       const result = await register({
//         email: formData.email,
//         username: formData.username,
//         password: formData.password
//       });
      
//       if (result.success) {
//         setSuccess('Registration successful! Redirecting to dashboard...');
//         setTimeout(() => navigate('/overview'), 1500);
//       } else {
//         setError(result.error || 'Registration failed');
//       }
//     } catch (err) {
//       setError('An error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     setError('');
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4">
//       <NeonBackground />
      
//       <motion.div
//         className="w-full max-w-md relative z-10"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         {/* Logo */}
//         <div className="text-center mb-8">
//           <motion.div
//             className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 neon-border mb-4"
//             animate={{ boxShadow: ['0 0 20px hsl(120 100% 50% / 0.3)', '0 0 40px hsl(120 100% 50% / 0.5)', '0 0 20px hsl(120 100% 50% / 0.3)'] }}
//             transition={{ duration: 2, repeat: Infinity }}
//           >
//             <span className="text-3xl font-display font-bold neon-text">W</span>
//           </motion.div>
//           <h1 className="text-3xl font-display font-bold neon-text mb-2">Join WolfHost</h1>
//           <p className="text-muted-foreground">Create your account</p>
//         </div>

//         <GlassCard hover={false}>
//           <form onSubmit={handleSubmit} className="space-y-5">
//             {/* Error Message */}
//             {error && (
//               <motion.div
//                 className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive"
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//               >
//                 <AlertCircle size={18} />
//                 <span className="text-sm">{error}</span>
//               </motion.div>
//             )}

//             {/* Success Message */}
//             {success && (
//               <motion.div
//                 className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/50 text-primary"
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//               >
//                 <CheckCircle size={18} />
//                 <span className="text-sm">{success}</span>
//               </motion.div>
//             )}

//             {/* Email Input */}
//             <div>
//               <label className="block text-sm font-mono text-muted-foreground mb-2">
//                 Email Address
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="neon-input"
//                 placeholder="your@email.com"
//                 disabled={loading}
//               />
//             </div>

//             {/* Username Input */}
//             <div>
//               <label className="block text-sm font-mono text-muted-foreground mb-2">
//                 Username
//               </label>
//               <input
//                 type="text"
//                 name="username"
//                 value={formData.username}
//                 onChange={handleChange}
//                 className="neon-input"
//                 placeholder="Choose a username"
//                 disabled={loading}
//               />
//             </div>

//             {/* Password Input */}
//             <div>
//               <label className="block text-sm font-mono text-muted-foreground mb-2">
//                 Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   className="neon-input pr-12"
//                   placeholder="Min 6 characters"
//                   disabled={loading}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>
//             </div>

//             {/* Confirm Password Input */}
//             <div>
//               <label className="block text-sm font-mono text-muted-foreground mb-2">
//                 Confirm Password
//               </label>
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 name="confirmPassword"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 className="neon-input"
//                 placeholder="Repeat your password"
//                 disabled={loading}
//               />
//             </div>

//             {/* Submit Button */}
//             <motion.button
//               type="submit"
//               className="neon-button-filled w-full flex items-center justify-center gap-2"
//               disabled={loading}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//             >
//               {loading ? (
//                 <LoadingSpinner size="sm" />
//               ) : (
//                 <>
//                   <UserPlus size={18} />
//                   Create Account
//                 </>
//               )}
//             </motion.button>

//             {/* Terms */}
//             <p className="text-xs text-center text-muted-foreground">
//               By signing up, you agree to our{' '}
//               <a href="#" className="text-primary hover:underline">Terms of Service</a>
//               {' '}and{' '}
//               <a href="#" className="text-primary hover:underline">Privacy Policy</a>
//             </p>
//           </form>

//           {/* Login Link */}
//           <div className="mt-6 pt-6 border-t border-border/50 text-center">
//             <p className="text-muted-foreground">
//               Already have an account?{' '}
//               <Link 
//                 to="/login" 
//                 className="text-primary hover:underline font-mono"
//               >
//                 Sign In
//               </Link>
//             </p>
//           </div>
//         </GlassCard>
//       </motion.div>
//     </div>
//   );
// };

// export default Register;
























import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NeonBackground from '../components/NeonBackground';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const referralCode = searchParams.get('ref') || '';
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        referralCode: referralCode || undefined,
      });
      
      if (result.success) {
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => navigate('/overview'), 1500);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <NeonBackground intensity={0.6} /> {/* Reduced intensity */}
      
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/5 border border-primary/20 mb-4"
            animate={{ boxShadow: ['0 0 10px hsl(120 100% 50% / 0.2)', '0 0 20px hsl(120 100% 50% / 0.3)', '0 0 10px hsl(120 100% 50% / 0.2)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-3xl font-display font-bold text-primary/90">W</span>
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-primary/90 mb-2">WolfHost</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <GlassCard hover={false}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/30 text-primary"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle size={18} />
                <span className="text-sm">{success}</span>
              </motion.div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="neon-input opacity-90"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="neon-input opacity-90"
                placeholder="Choose a username"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="neon-input opacity-90 pr-12"
                  placeholder="Min 6 characters"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="neon-input opacity-90"
                placeholder="Repeat your password"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="neon-button-subtle w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </motion.button>

            {/* Terms */}
            <div className="text-center p-3 rounded-lg bg-primary/3 border border-primary/15">
              <p className="text-xs text-muted-foreground">
                By signing up, you agree to our{' '}
                <a href="#" className="text-primary/80 hover:text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary/80 hover:text-primary hover:underline">Privacy Policy</a>
              </p>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-border/30 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary/80 hover:text-primary hover:underline font-mono"
              >
                Sign In
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Register;