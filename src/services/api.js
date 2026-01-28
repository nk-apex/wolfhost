// src/services/api.js

// ======================
// CONFIGURATION
// ======================

// Base URL for your backend API
const API_BASE_URL = import.meta.env?.VITE_API_URL || 
                     process.env?.REACT_APP_API_URL || 
                     'http://localhost:3001/api';

// Simulate API delay
const API_DELAY = 300;

// ======================
// UTILITY FUNCTIONS
// ======================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data (in KES)
const mockUser = {
  id: '1',
  email: 'demo@example.com',
  name: 'Demo User',
  phone: '+254712345678',
  wallet: 1500.00, // KES
  referrals: 5,
  tier: 'pro',
  createdAt: '2024-01-01',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
  country: 'Kenya',
  isEmailVerified: true,
  isPhoneVerified: false,
  twoFactorEnabled: false
};

// Initialize localStorage for MPESA transactions
if (typeof window !== 'undefined') {
  if (!localStorage.getItem('mpesa_transactions')) {
    localStorage.setItem('mpesa_transactions', JSON.stringify([]));
  }
  if (!localStorage.getItem('wallet_balance')) {
    localStorage.setItem('wallet_balance', '1500.00');
  }
}

// ======================
// AUTH API
// ======================

export const authAPI = {
  login: async (email, password) => {
    try {
      await delay(API_DELAY);
      console.log('🔐 Mock login attempt:', email);
      
      // Basic validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Simulate successful login
      return {
        success: true,
        user: {
          ...mockUser,
          email: email
        },
        token: 'mock-jwt-token-' + Date.now(),
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed. Please check your credentials.' 
      };
    }
  },

  register: async (userData) => {
    try {
      await delay(API_DELAY);
      console.log('📝 Mock registration:', userData);
      
      // Validate required fields
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      return {
        success: true,
        user: {
          id: 'new-' + Date.now(),
          email: userData.email,
          name: userData.name || 'New User',
          phone: userData.phone || '',
          wallet: 0.00,
          referrals: 0,
          tier: 'basic',
          createdAt: new Date().toISOString().split('T')[0]
        },
        token: 'mock-jwt-token-new-' + Date.now(),
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  },

  logout: async () => {
    try {
      await delay(API_DELAY);
      console.log('👋 Mock logout');
      return { 
        success: true, 
        message: 'Logged out successfully' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Logout failed' 
      };
    }
  },

  // Required by AuthContext
  getUser: async () => {
    try {
      await delay(API_DELAY);
      return {
        success: true,
        user: mockUser
      };
    } catch (error) {
      console.error('Get user error:', error);
      return { 
        success: false, 
        message: 'Failed to get user data' 
      };
    }
  },

  // Alias for getUser
  getCurrentUser: async () => {
    return authAPI.getUser();
  },

  updateProfile: async (profileData) => {
    try {
      await delay(API_DELAY);
      console.log('🔄 Mock update profile:', profileData);
      
      return {
        success: true,
        user: {
          ...mockUser,
          ...profileData
        },
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        message: 'Failed to update profile' 
      };
    }
  },

  verifyPhone: async (phone, code) => {
    try {
      await delay(API_DELAY);
      console.log('📱 Mock verify phone:', phone);
      
      return {
        success: true,
        message: 'Phone number verified successfully'
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to verify phone number' 
      };
    }
  }
};

// ======================
// STATS API
// ======================

export const statsAPI = {
  // Required by Overview.jsx
  getOverviewStats: async () => {
    try {
      await delay(API_DELAY);
      
      // Get wallet balance from localStorage
      const balance = parseFloat(localStorage.getItem('wallet_balance') || '1500.00');
      const transactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      const totalMpesaDeposits = transactions.reduce((sum, txn) => sum + txn.amount, 0);
      
      return {
        success: true,
        stats: {
          totalServers: 3,
          activeServers: 2,
          totalRevenue: totalMpesaDeposits, // Total MPESA deposits
          pendingInvoices: 1,
          referralCount: 5,
          referralEarnings: 1250.00, // KES
          monthlyGrowth: 15.5,
          uptime: 99.8,
          storageUsed: '65%',
          bandwidthUsed: '42%',
          currentBalance: balance
        }
      };
    } catch (error) {
      console.error('Stats error:', error);
      return { 
        success: false, 
        stats: {},
        message: 'Failed to load dashboard stats' 
      };
    }
  },

  // Alias for compatibility
  getDashboardStats: async () => {
    return statsAPI.getOverviewStats();
  }
};

// ======================
// ACTIVITY API
// ======================

export const activityAPI = {
  // Required by Overview.jsx
  getRecentActivity: async () => {
    try {
      await delay(API_DELAY);
      
      // Get MPESA transactions
      const mpesaTransactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      
      // Convert MPESA transactions to activities
      const mpesaActivities = mpesaTransactions.slice(-5).map(txn => ({
        id: txn.id,
        type: 'mpesa_deposit',
        message: `MPESA deposit of KES ${txn.amount.toLocaleString()} from ${txn.phone}`,
        timestamp: new Date(txn.date).toLocaleString(),
        icon: '💰',
        color: 'green'
      }));
      
      // Add other activities
      const otherActivities = [
        { 
          id: 'server1', 
          type: 'server_created', 
          message: 'Created new production server', 
          timestamp: '2024-03-10 14:30',
          icon: '🚀',
          color: 'blue'
        },
        { 
          id: 'referral1', 
          type: 'referral_joined', 
          message: 'New referral joined from social media', 
          timestamp: '2024-03-08 16:45',
          icon: '👥',
          color: 'purple'
        }
      ];
      
      return {
        success: true,
        activities: [...mpesaActivities, ...otherActivities].slice(0, 10)
      };
    } catch (error) {
      console.error('Activity error:', error);
      return { 
        success: false, 
        activities: [],
        message: 'Failed to load recent activity' 
      };
    }
  }
};

// ======================
// REFERRAL API
// ======================

export const referralAPI = {
  // Required by Referrals.jsx
  getReferrals: async () => {
    try {
      await delay(API_DELAY);
      
      return {
        success: true,
        referrals: [
          { 
            id: '1', 
            email: 'ref1@example.com', 
            name: 'John Doe',
            phone: '+254700000001',
            joined: '2024-03-01', 
            earnings: 250.00, // KES
            status: 'active',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
          },
          { 
            id: '2', 
            email: 'ref2@example.com', 
            name: 'Jane Smith',
            phone: '+254700000002',
            joined: '2024-02-15', 
            earnings: 500.00, // KES
            status: 'active',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
          }
        ],
        totalEarnings: 1250.00, // KES
        pendingEarnings: 250.00,
        totalReferrals: 8
      };
    } catch (error) {
      console.error('Referrals error:', error);
      return { 
        success: false, 
        referrals: [], 
        totalEarnings: 0,
        message: 'Failed to load referrals' 
      };
    }
  },

  getReferralCode: async () => {
    try {
      await delay(API_DELAY);
      
      return {
        success: true,
        code: 'NEON-7A9B3C',
        link: 'https://neonhost.com/ref/NEON-7A9B3C',
        clicks: 42,
        conversions: 5
      };
    } catch (error) {
      console.error('Referral code error:', error);
      return { 
        success: false, 
        code: '', 
        link: '',
        message: 'Failed to load referral code' 
      };
    }
  }
};

// ======================
// SERVER API
// ======================

export const serverAPI = {
  // Required by Servers.jsx
  getServers: async () => {
    try {
      await delay(API_DELAY);
      
      return {
        success: true,
        servers: [
          { 
            id: '1', 
            name: 'Production Web Server', 
            type: 'pro', 
            status: 'running', 
            cpu: 45, 
            memory: 68, 
            storage: 42,
            uptime: '15d 6h',
            ip: '192.168.1.100',
            location: 'Nairobi, KE',
            price: 1250.00, // KES/month
            tags: ['production', 'web']
          },
          { 
            id: '2', 
            name: 'Development Server', 
            type: 'basic', 
            status: 'stopped', 
            cpu: 0, 
            memory: 12, 
            storage: 25,
            uptime: '0d 0h',
            ip: '192.168.1.101',
            location: 'Nairobi, KE',
            price: 500.00, // KES/month
            tags: ['development']
          }
        ]
      };
    } catch (error) {
      console.error('Servers error:', error);
      return { 
        success: false, 
        servers: [],
        message: 'Failed to load servers' 
      };
    }
  },

  createServer: async (serverData) => {
    try {
      console.log('🆕 Mock create server:', serverData);
      await delay(API_DELAY * 2);
      
      return {
        success: true,
        server: {
          id: Date.now().toString(),
          ...serverData,
          status: 'creating',
          cpu: 0,
          memory: 0,
          storage: 0,
          uptime: '0d 0h',
          ip: '192.168.1.' + Math.floor(Math.random() * 255),
          location: 'Nairobi, KE'
        },
        message: 'Server creation initiated'
      };
    } catch (error) {
      console.error('Create server error:', error);
      return { 
        success: false, 
        message: 'Failed to create server' 
      };
    }
  }
};

// ======================
// WALLET API (MPESA FOCUSED)
// ======================

export const walletAPI = {
  // Record MPESA payment
  recordMpesaPayment: async (amount, phone, reference) => {
    try {
      console.log(`💰 Recording MPESA Payment:`, {
        amount: amount,
        phone: phone,
        reference: reference
      });
      
      // Get existing transactions
      const transactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      
      const transaction = {
        id: 'MPESA_' + Date.now(),
        type: 'mpesa_deposit',
        amount: amount,
        phone: phone,
        reference: reference,
        status: 'completed',
        date: new Date().toISOString(),
        description: 'MPESA deposit via STK Push',
        method: 'MPESA'
      };
      
      // Add new transaction
      transactions.push(transaction);
      localStorage.setItem('mpesa_transactions', JSON.stringify(transactions));
      
      // Update wallet balance
      const currentBalance = parseFloat(localStorage.getItem('wallet_balance') || '1500.00');
      const newBalance = currentBalance + amount;
      localStorage.setItem('wallet_balance', newBalance.toString());
      
      return {
        success: true,
        message: 'MPESA payment recorded successfully',
        transaction: transaction,
        newBalance: newBalance
      };
    } catch (error) {
      console.error('Error recording MPESA payment:', error);
      return {
        success: false,
        message: 'Failed to record payment'
      };
    }
  },

  // Get MPESA transactions
  getMpesaTransactions: async () => {
    try {
      const transactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      
      return {
        success: true,
        transactions: transactions,
        total: transactions.reduce((sum, txn) => sum + txn.amount, 0)
      };
    } catch (error) {
      return {
        success: false,
        transactions: []
      };
    }
  },

  // Get wallet balance (KES)
  getBalance: async () => {
    try {
      const balance = parseFloat(localStorage.getItem('wallet_balance') || '1500.00');
      
      return {
        success: true,
        balance: balance,
        currency: 'KES'
      };
    } catch (error) {
      return {
        success: true,
        balance: 1500.00,
        currency: 'KES'
      };
    }
  },

  // Update balance (called after successful payment)
  updateBalance: async (amount, reference, phone = '') => {
    return walletAPI.recordMpesaPayment(amount, phone, reference);
  },

  // Get all transactions (including MPESA)
  getTransactions: async () => {
    try {
      await delay(API_DELAY);
      
      // Get MPESA transactions
      const mpesaTransactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      
      // Convert to transaction format
      const transactions = mpesaTransactions.map(txn => ({
        id: txn.id,
        type: 'deposit',
        amount: txn.amount,
        method: 'MPESA',
        date: new Date(txn.date).toISOString().split('T')[0],
        status: 'completed',
        reference: txn.reference,
        description: txn.description,
        phone: txn.phone
      }));
      
      // Add some mock transactions
      const mockTransactions = [
        {
          id: 'invoice1',
          type: 'invoice_payment',
          amount: -500.00, // KES
          method: 'Auto-debit',
          date: '2024-03-05',
          status: 'completed',
          reference: 'INV_001',
          description: 'Basic Server - Development'
        },
        {
          id: 'referral1',
          type: 'referral_earning',
          amount: 250.00, // KES
          method: 'Referral',
          date: '2024-03-01',
          status: 'completed',
          reference: 'REF_001',
          description: 'Referral commission'
        }
      ];
      
      const allTransactions = [...transactions, ...mockTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const balance = parseFloat(localStorage.getItem('wallet_balance') || '1500.00');
      
      return {
        success: true,
        transactions: allTransactions,
        totalDeposits: allTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawals: Math.abs(allTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)),
        currentBalance: balance
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { 
        success: false, 
        transactions: [],
        message: 'Failed to fetch transactions' 
      };
    }
  },

  // Update invoice status
  updateInvoiceStatus: async (invoiceId, status) => {
    try {
      console.log(`📄 Mock updating invoice ${invoiceId} to ${status}`);
      await delay(API_DELAY);
      
      return {
        success: true,
        message: `Invoice ${invoiceId} marked as ${status}`
      };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { 
        success: false, 
        message: 'Failed to update invoice' 
      };
    }
  },

  // Withdraw funds
  withdraw: async (amount, method, phone = '') => {
    try {
      console.log(`🏧 Mock withdrawal: KES ${amount} via ${method}`, phone ? `to ${phone}` : '');
      await delay(API_DELAY);
      
      // Get current balance
      const currentBalance = parseFloat(localStorage.getItem('wallet_balance') || '1500.00');
      
      if (amount > currentBalance) {
        throw new Error('Insufficient balance');
      }
      
      // Update balance
      const newBalance = currentBalance - amount;
      localStorage.setItem('wallet_balance', newBalance.toString());
      
      // Record withdrawal transaction
      const transactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      const transaction = {
        id: 'WDR_' + Date.now(),
        type: 'withdrawal',
        amount: -amount,
        phone: phone,
        method: method,
        status: 'pending',
        date: new Date().toISOString(),
        description: `Withdrawal to ${method}`
      };
      transactions.push(transaction);
      localStorage.setItem('mpesa_transactions', JSON.stringify(transactions));
      
      return {
        success: true,
        message: 'Withdrawal request submitted',
        transactionId: transaction.id,
        newBalance: newBalance
      };
    } catch (error) {
      console.error('Withdrawal error:', error);
      return { 
        success: false, 
        message: error.message || 'Withdrawal failed' 
      };
    }
  },

  // Get MPESA withdrawal history
  getWithdrawals: async () => {
    try {
      const transactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      const withdrawals = transactions.filter(t => t.type === 'withdrawal');
      
      return {
        success: true,
        withdrawals: withdrawals,
        totalWithdrawn: Math.abs(withdrawals.reduce((sum, t) => sum + t.amount, 0))
      };
    } catch (error) {
      return {
        success: false,
        withdrawals: []
      };
    }
  }
};

// ======================
// SETTINGS API
// ======================

export const settingsAPI = {
  updateProfile: async (profileData) => {
    try {
      console.log('👤 Mock update profile:', profileData);
      await delay(API_DELAY);
      
      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        message: 'Failed to update profile' 
      };
    }
  },

  updatePassword: async (passwordData) => {
    try {
      console.log('🔑 Mock update password');
      await delay(API_DELAY);
      
      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Update password error:', error);
      return { 
        success: false, 
        message: 'Failed to update password' 
      };
    }
  },

  getNotifications: async () => {
    try {
      await delay(API_DELAY);
      
      return {
        success: true,
        notifications: [
          { 
            id: '1', 
            type: 'info', 
            title: 'MPESA Integration', 
            message: 'MPESA payments are now live! Top up your wallet easily.',
            read: false, 
            timestamp: '2024-03-12 09:00'
          },
          { 
            id: '2', 
            type: 'success', 
            title: 'Payment Received', 
            message: 'Your MPESA deposit was successful',
            read: true, 
            timestamp: '2024-03-11 14:30'
          }
        ]
      };
    } catch (error) {
      console.error('Notifications error:', error);
      return { 
        success: false, 
        notifications: [] 
      };
    }
  }
};

// ======================
// BILLING API (KES FOCUSED)
// ======================

export const billingAPI = {
  getInvoices: async () => {
    try {
      await delay(API_DELAY);
      
      // Get balance for invoice amounts
      const balance = parseFloat(localStorage.getItem('wallet_balance') || '1500.00');
      
      return {
        success: true,
        invoices: [
          { 
            id: 'INV-001', 
            date: '2024-03-01', 
            amount: 1250.00, // KES
            status: 'paid', 
            description: 'Pro Server - Production',
            dueDate: '2024-03-01'
          },
          { 
            id: 'INV-002', 
            date: '2024-03-01', 
            amount: 500.00, // KES
            status: 'paid', 
            description: 'Basic Server - Development',
            dueDate: '2024-03-01'
          },
          { 
            id: 'INV-003', 
            date: '2024-04-01', 
            amount: 1250.00, // KES
            status: balance >= 1250 ? 'paid' : 'pending', 
            description: 'Pro Server - Production',
            dueDate: '2024-04-05'
          },
          { 
            id: 'INV-004', 
            date: '2024-04-01', 
            amount: 2500.00, // KES
            status: balance >= 2500 ? 'paid' : 'pending', 
            description: 'Enterprise Server - Database',
            dueDate: '2024-04-05'
          },
        ]
      };
    } catch (error) {
      console.error('Invoices error:', error);
      return { 
        success: false, 
        invoices: [] 
      };
    }
  },

  payInvoice: async (invoiceId, amount, phone = '') => {
    try {
      console.log('💳 Mock paying invoice:', invoiceId, 'Amount:', amount, 'Phone:', phone);
      await delay(API_DELAY * 2);
      
      // Record as MPESA payment
      if (phone) {
        await walletAPI.recordMpesaPayment(amount, phone, `INV_${invoiceId}`);
      }
      
      return {
        success: true,
        message: `Invoice ${invoiceId} paid successfully via MPESA`
      };
    } catch (error) {
      console.error('Pay invoice error:', error);
      return { 
        success: false, 
        message: 'Failed to pay invoice' 
      };
    }
  },

  // Get billing summary
  getBillingSummary: async () => {
    try {
      const balance = parseFloat(localStorage.getItem('wallet_balance') || '1500.00');
      const transactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      const mpesaTotal = transactions.reduce((sum, txn) => sum + txn.amount, 0);
      
      return {
        success: true,
        summary: {
          currentBalance: balance,
          totalDeposits: mpesaTotal,
          totalWithdrawals: 0,
          pendingInvoices: 2,
          nextBillingDate: '2024-04-05',
          autoPayEnabled: false
        }
      };
    } catch (error) {
      return {
        success: false,
        summary: {}
      };
    }
  }
};

// ======================
// MPESA SPECIFIC API
// ======================

export const mpesaAPI = {
  // Initiate STK Push
  stkPush: async (phone, amount) => {
    try {
      console.log('📲 Mock STK Push:', { phone, amount });
      await delay(API_DELAY * 3); // Simulate MPESA delay
      
      // Simulate successful STK Push
      const reference = 'MPESA_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      return {
        success: true,
        message: 'STK Push initiated. Please check your phone to enter PIN.',
        reference: reference,
        checkoutRequestID: reference,
        merchantRequestID: 'MR_' + reference
      };
    } catch (error) {
      console.error('STK Push error:', error);
      return {
        success: false,
        message: 'Failed to initiate STK Push. Please try again.'
      };
    }
  },

  // Query transaction status
  queryTransaction: async (reference) => {
    try {
      console.log('🔍 Mock query transaction:', reference);
      await delay(API_DELAY);
      
      // Check if transaction exists in localStorage
      const transactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      const transaction = transactions.find(t => t.reference === reference);
      
      if (transaction) {
        return {
          success: true,
          status: 'completed',
          transaction: transaction
        };
      }
      
      // Simulate pending transaction
      return {
        success: true,
        status: Math.random() > 0.5 ? 'pending' : 'completed',
        message: 'Transaction is being processed'
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        message: 'Failed to query transaction'
      };
    }
  },

  // Get MPESA transaction history
  getTransactionHistory: async (phone = '') => {
    try {
      const transactions = JSON.parse(localStorage.getItem('mpesa_transactions') || '[]');
      
      let filteredTransactions = transactions;
      if (phone) {
        filteredTransactions = transactions.filter(t => t.phone === phone);
      }
      
      return {
        success: true,
        transactions: filteredTransactions,
        totalCount: filteredTransactions.length,
        totalAmount: filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
      };
    } catch (error) {
      return {
        success: false,
        transactions: []
      };
    }
  }
};

// Default export for backward compatibility
export default {
  authAPI,
  statsAPI,
  activityAPI,
  referralAPI,
  serverAPI,
  walletAPI,
  settingsAPI,
  billingAPI,
  mpesaAPI
};