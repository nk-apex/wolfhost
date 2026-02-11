import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const SPENDING_FILE = path.join(__dirname, 'spending.json');

function loadSpending() {
  try {
    if (fs.existsSync(SPENDING_FILE)) {
      return JSON.parse(fs.readFileSync(SPENDING_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading spending data:', e);
  }
  return [];
}

function saveSpending(records) {
  try {
    fs.writeFileSync(SPENDING_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving spending data:', e);
  }
}

function recordSpending(email, amount, description, serverId) {
  const records = loadSpending();
  records.push({
    email: email.toLowerCase(),
    amount,
    description,
    serverId: serverId?.toString() || '',
    date: new Date().toISOString(),
  });
  saveSpending(records);
}

function getTotalSpending(email) {
  const records = loadSpending();
  return records
    .filter(r => r.email === email.toLowerCase())
    .reduce((sum, r) => sum + r.amount, 0);
}

function refundSpending(serverId) {
  const records = loadSpending();
  const updated = records.filter(r => r.serverId !== serverId.toString());
  if (updated.length !== records.length) {
    saveSpending(updated);
    return true;
  }
  return false;
}

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const PTERODACTYL_API_URL = 'https://panel.xwolf.space';
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY is not set');
}

if (!PTERODACTYL_API_KEY) {
  console.error('PTERODACTYL_API_KEY is not set');
}

async function paystackFetch(path, options = {}) {
  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

app.post('/api/mpesa/charge', async (req, res) => {
  try {
    const { phone, amount, metadata, userEmail } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'Phone and amount are required' });
    }

    if (amount < 50) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is 50 KSH' });
    }

    let formattedPhone = phone.toString().replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    if (formattedPhone.length !== 12 || !formattedPhone.startsWith('254')) {
      return res.status(400).json({ success: false, message: 'Invalid Kenyan phone number. Use format: 0713046497' });
    }

    const amountInCents = Math.round(amount * 100);
    const paystackPhone = '+' + formattedPhone;
    const chargeEmail = userEmail || `${formattedPhone}@mpesa.ke`;

    console.log('Sending to Paystack:', { phone: paystackPhone, amount: amountInCents, email: chargeEmail });

    const response = await paystackFetch('/charge', {
      method: 'POST',
      body: JSON.stringify({
        email: chargeEmail,
        amount: amountInCents,
        currency: 'KES',
        mobile_money: {
          phone: paystackPhone,
          provider: 'mpesa',
        },
        metadata: {
          ...metadata,
          payment_type: 'mpesa_stk',
          phone_number: formattedPhone,
          user_email: chargeEmail,
          country: 'KE',
        },
      }),
    });

    const data = await response.json();
    console.log('Paystack response:', JSON.stringify(data));

    if (!response.ok || !data.status) {
      const errorMessage = data.message || 'Failed to initiate M-Pesa payment';
      return res.status(response.status || 400).json({ success: false, message: errorMessage });
    }

    return res.json({
      success: true,
      data: data.data,
      message: 'M-Pesa STK Push initiated. Check your phone to enter PIN.',
      reference: data.data.reference,
    });
  } catch (error) {
    console.error('M-Pesa charge error:', error);
    return res.status(500).json({ success: false, message: 'Server error initiating payment' });
  }
});

app.get('/api/mpesa/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    const response = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Verification failed',
      });
    }

    return res.json({
      success: data.status === true,
      data: data.data,
      message: data.message,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
});

app.post('/api/card/initialize', async (req, res) => {
  try {
    const { email, amount, metadata, callbackUrl } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ success: false, message: 'Email and amount are required' });
    }

    if (amount < 50) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is 50 KSH' });
    }

    const amountInCents = Math.round(amount * 100);

    console.log('Initializing card payment:', { email, amount: amountInCents, callbackUrl });

    const response = await paystackFetch('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: amountInCents,
        currency: 'KES',
        callback_url: callbackUrl || undefined,
        channels: ['card'],
        metadata: {
          ...metadata,
          payment_type: 'card',
          country: 'KE',
        },
      }),
    });

    const data = await response.json();
    console.log('Paystack card init response:', JSON.stringify(data));

    if (!response.ok || !data.status) {
      const errorMessage = data.message || 'Failed to initialize card payment';
      return res.status(response.status || 400).json({ success: false, message: errorMessage });
    }

    return res.json({
      success: true,
      data: data.data,
      message: 'Card payment initialized. Redirecting to checkout...',
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      accessCode: data.data.access_code,
    });
  } catch (error) {
    console.error('Card initialize error:', error);
    return res.status(500).json({ success: false, message: 'Server error initializing card payment' });
  }
});

app.get('/api/card/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    const response = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Verification failed',
      });
    }

    return res.json({
      success: data.status === true && data.data?.status === 'success',
      data: data.data,
      message: data.message,
    });
  } catch (error) {
    console.error('Card verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying card payment' });
  }
});

app.post('/api/mpesa/submit-otp', async (req, res) => {
  try {
    const { otp, reference } = req.body;

    if (!otp || !reference) {
      return res.status(400).json({ success: false, message: 'OTP and reference are required' });
    }

    const response = await paystackFetch('/charge/submit_otp', {
      method: 'POST',
      body: JSON.stringify({ otp, reference }),
    });

    const data = await response.json();

    return res.json({
      success: data.status === true,
      data: data.data,
      message: data.message,
    });
  } catch (error) {
    console.error('Submit OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting OTP' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { perPage = 50, page = 1, status, email } = req.query;

    let path = `/transaction?perPage=${perPage}&page=${page}&currency=KES`;
    if (status) {
      path += `&status=${status}`;
    }
    if (email) {
      path += `&customer=${encodeURIComponent(email)}`;
    }

    const response = await paystackFetch(path);
    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(response.status || 400).json({
        success: false,
        message: data.message || 'Failed to fetch transactions',
      });
    }

    let allTransactions = data.data || [];

    if (email && allTransactions.length === 0) {
      const altResponse = await paystackFetch(`/transaction?perPage=${perPage}&page=${page}&currency=KES${status ? `&status=${status}` : ''}`);
      const altData = await altResponse.json();
      if (altResponse.ok && altData.status) {
        allTransactions = (altData.data || []).filter(txn => {
          const txnEmail = txn.customer?.email?.toLowerCase();
          const filterEmail = email.toLowerCase();
          return txnEmail === filterEmail || txn.metadata?.user_email?.toLowerCase() === filterEmail;
        });
      }
    }

    const deposits = allTransactions.map((txn) => ({
      id: txn.id,
      reference: txn.reference,
      amount: txn.amount / 100,
      currency: txn.currency,
      status: txn.status,
      channel: txn.channel,
      paidAt: txn.paid_at || txn.transaction_date,
      createdAt: txn.created_at,
      phone: txn.metadata?.phone_number || txn.authorization?.mobile_money_number || '',
      type: txn.metadata?.type || 'wallet_topup',
      description: txn.channel === 'mobile_money'
        ? 'M-Pesa deposit'
        : txn.channel === 'card'
        ? 'Card payment'
        : txn.channel || 'Payment',
      method: txn.channel === 'mobile_money' ? 'M-Pesa' : txn.channel === 'card' ? 'Card' : txn.channel || 'Unknown',
      cardType: txn.authorization?.card_type || '',
      last4: txn.authorization?.last4 || '',
      email: txn.customer?.email || '',
      direction: 'credit',
    }));

    let spendingRecords = [];
    if (email) {
      const allSpending = loadSpending().filter(r => r.email === email.toLowerCase());
      spendingRecords = allSpending.map((r, i) => ({
        id: `spend-${i}-${Date.now()}`,
        reference: `SERVER-${r.serverId}`,
        amount: r.amount,
        currency: 'KES',
        status: 'success',
        channel: 'server_purchase',
        paidAt: r.date,
        createdAt: r.date,
        phone: '',
        type: 'server_purchase',
        description: r.description,
        method: 'Wallet',
        cardType: '',
        last4: '',
        email: r.email,
        direction: 'debit',
      }));
    }

    const transactions = [...deposits, ...spendingRecords].sort((a, b) =>
      new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt)
    );

    const meta = data.meta || {};

    return res.json({
      success: true,
      transactions,
      meta: {
        total: meta.total || transactions.length,
        page: meta.page || parseInt(page),
        pageCount: meta.pageCount || 1,
        perPage: meta.perPage || parseInt(perPage),
      },
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching transactions' });
  }
});

app.get('/api/transactions/totals', async (req, res) => {
  try {
    const { email } = req.query;

    let path = '/transaction?perPage=100&currency=KES&status=success';
    if (email) {
      path += `&customer=${encodeURIComponent(email)}`;
    }

    const response = await paystackFetch(path);
    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.json({
        success: true,
        totalDeposits: 0,
        totalCount: 0,
        balance: 0,
      });
    }

    let transactions = data.data || [];

    if (email && transactions.length === 0) {
      const altResponse = await paystackFetch('/transaction?perPage=100&currency=KES&status=success');
      const altData = await altResponse.json();
      if (altResponse.ok && altData.status) {
        transactions = (altData.data || []).filter(txn => {
          const txnEmail = txn.customer?.email?.toLowerCase();
          const filterEmail = email.toLowerCase();
          return txnEmail === filterEmail || txn.metadata?.user_email?.toLowerCase() === filterEmail;
        });
      }
    }

    const totalDeposits = transactions.reduce((sum, txn) => sum + (txn.amount / 100), 0);

    const spending = email ? getTotalSpending(email) : 0;
    const balance = Math.max(0, totalDeposits - spending);

    return res.json({
      success: true,
      totalDeposits,
      totalSpending: spending,
      totalCount: transactions.length,
      balance,
    });
  } catch (error) {
    console.error('Totals fetch error:', error);
    return res.json({
      success: true,
      totalDeposits: 0,
      totalSpending: 0,
      totalCount: 0,
      balance: 0,
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email/username and password are required' });
    }

    const isEmail = email.includes('@');
    const filterParam = isEmail ? `filter[email]=${encodeURIComponent(email)}` : `filter[username]=${encodeURIComponent(email)}`;

    console.log('Looking up Pterodactyl user:', { email, isEmail });

    const pteroResponse = await fetch(`${PTERODACTYL_API_URL}/api/application/users?${filterParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Pterodactyl lookup error:', JSON.stringify(pteroData));
      return res.status(500).json({ success: false, message: 'Failed to verify account' });
    }

    const users = pteroData.data || [];
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'No account found with those credentials. Please sign up first.' });
    }

    const panelUser = users[0].attributes;

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: panelUser.id,
        email: panelUser.email,
        username: panelUser.username,
        firstName: panelUser.first_name,
        lastName: panelUser.last_name,
        panelId: panelUser.id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Email, username, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const nameParts = username.split(' ');
    const firstName = nameParts[0] || username;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : username;

    console.log('Creating Pterodactyl user:', { email, username, firstName, lastName });

    const pteroResponse = await fetch(`${PTERODACTYL_API_URL}/api/application/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: firstName,
        last_name: lastName,
        password: password,
      }),
    });

    const pteroData = await pteroResponse.json();
    console.log('Pterodactyl response status:', pteroResponse.status);

    if (!pteroResponse.ok) {
      console.error('Pterodactyl error:', JSON.stringify(pteroData));

      let errorMessage = 'Failed to create panel account';
      if (pteroData.errors && pteroData.errors.length > 0) {
        const details = pteroData.errors.map(e => e.detail).join(', ');
        if (details.toLowerCase().includes('email')) {
          errorMessage = 'An account with this email already exists on the panel';
        } else if (details.toLowerCase().includes('username')) {
          errorMessage = 'This username is already taken on the panel';
        } else {
          errorMessage = details;
        }
      }

      return res.status(pteroResponse.status === 422 ? 409 : pteroResponse.status).json({
        success: false,
        message: errorMessage,
      });
    }

    const panelUser = pteroData.attributes;

    return res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: panelUser.id,
        email: panelUser.email,
        username: panelUser.username,
        firstName: panelUser.first_name,
        lastName: panelUser.last_name,
        panelId: panelUser.id,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating account' });
  }
});

const TIER_LIMITS = {
  Limited: {
    memory: 5120,
    swap: 0,
    disk: 10240,
    io: 500,
    cpu: 100,
    databases: 1,
    allocations: 1,
    backups: 1,
  },
  Unlimited: {
    memory: 0,
    swap: 0,
    disk: 40960,
    io: 500,
    cpu: 200,
    databases: 2,
    allocations: 2,
    backups: 3,
  },
  Admin: {
    memory: 0,
    swap: 0,
    disk: 81920,
    io: 500,
    cpu: 400,
    databases: 5,
    allocations: 5,
    backups: 5,
  },
};

async function pteroFetch(path, options = {}) {
  const response = await fetch(`${PTERODACTYL_API_URL}/api/application${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

async function findFreeAllocation(nodeId = 1) {
  const response = await pteroFetch(`/nodes/${nodeId}/allocations?per_page=100`);
  const data = await response.json();
  if (!response.ok || !data.data) return null;
  const free = data.data.find(a => !a.attributes.assigned);
  return free ? free.attributes.id : null;
}

const TIER_PRICES = { Limited: 50, Unlimited: 100, Admin: 200 };

async function verifyUserBalance(email, requiredAmount) {
  try {
    let path = `/transaction?perPage=100&currency=KES&status=success`;
    if (email) {
      path += `&customer=${encodeURIComponent(email)}`;
    }
    const response = await paystackFetch(path);
    const data = await response.json();
    if (!response.ok || !data.status) return 0;

    let transactions = data.data || [];
    if (email && transactions.length === 0) {
      const altResponse = await paystackFetch('/transaction?perPage=100&currency=KES&status=success');
      const altData = await altResponse.json();
      if (altResponse.ok && altData.status) {
        transactions = (altData.data || []).filter(txn => {
          const txnEmail = txn.customer?.email?.toLowerCase();
          const filterEmail = email.toLowerCase();
          return txnEmail === filterEmail || txn.metadata?.user_email?.toLowerCase() === filterEmail;
        });
      }
    }

    const totalDeposits = transactions.reduce((sum, txn) => sum + (txn.amount / 100), 0);
    const spending = getTotalSpending(email);
    return Math.max(0, totalDeposits - spending);
  } catch (e) {
    console.error('Balance verification error:', e);
    return 0;
  }
}

async function verifyPteroUser(userId) {
  try {
    const response = await pteroFetch(`/users/${userId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.attributes || null;
  } catch (e) {
    return null;
  }
}

app.post('/api/servers/create', async (req, res) => {
  try {
    const { name, plan, userId, userEmail } = req.body;

    if (!name || !plan || !userId || !userEmail) {
      return res.status(400).json({ success: false, message: 'Server name, plan, user ID, and email are required' });
    }

    const tierConfig = TIER_LIMITS[plan];
    if (!tierConfig) {
      return res.status(400).json({ success: false, message: 'Invalid server plan' });
    }

    const pteroUser = await verifyPteroUser(userId);
    if (!pteroUser) {
      return res.status(403).json({ success: false, message: 'User not found on the panel' });
    }

    if (pteroUser.email.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'User verification failed' });
    }

    const requiredAmount = TIER_PRICES[plan] || 50;
    const balance = await verifyUserBalance(userEmail, requiredAmount);
    if (balance < requiredAmount) {
      return res.status(402).json({
        success: false,
        message: `Insufficient balance. You need KES ${requiredAmount} but have KES ${balance.toFixed(2)}. Please top up your wallet first.`,
      });
    }

    const allocationId = await findFreeAllocation(1);
    if (!allocationId) {
      return res.status(503).json({ success: false, message: 'No available ports. Please try again later or contact support.' });
    }

    console.log('Creating Pterodactyl server:', { name, plan, userId, allocationId, verifiedBalance: balance });

    const serverPayload = {
      name: name,
      user: parseInt(userId),
      egg: 15,
      docker_image: 'ghcr.io/parkervcp/yolks:nodejs_24',
      startup: 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; if [[ ! -z ${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then vars=$(echo ${CUSTOM_ENVIRONMENT_VARIABLES} | tr ";" "\\n"); for line in $vars; do export $line; done fi; /usr/local/bin/${CMD_RUN};',
      environment: {
        GIT_ADDRESS: '',
        BRANCH: '',
        USERNAME: '',
        ACCESS_TOKEN: '',
        CMD_RUN: 'npm start',
        AUTO_UPDATE: '0',
        NODE_PACKAGES: '',
        UNNODE_PACKAGES: '',
        CUSTOM_ENVIRONMENT_VARIABLES: '',
      },
      limits: {
        memory: tierConfig.memory,
        swap: tierConfig.swap,
        disk: tierConfig.disk,
        io: tierConfig.io,
        cpu: tierConfig.cpu,
      },
      feature_limits: {
        databases: tierConfig.databases,
        allocations: tierConfig.allocations,
        backups: tierConfig.backups,
      },
      allocation: {
        default: allocationId,
      },
      description: `WolfHost ${plan} Plan - Created via WolfHost Panel`,
      start_on_completion: false,
      external_id: `wolfhost-${userId}-${Date.now()}`,
    };

    const pteroResponse = await pteroFetch('/servers', {
      method: 'POST',
      body: JSON.stringify(serverPayload),
    });

    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Pterodactyl server create error:', JSON.stringify(pteroData));
      let errorMessage = 'Failed to create server on the panel';
      if (pteroData.errors && pteroData.errors.length > 0) {
        errorMessage = pteroData.errors.map(e => e.detail).join(', ');
      }
      return res.status(pteroResponse.status || 500).json({ success: false, message: errorMessage });
    }

    const serverAttrs = pteroData.attributes;
    console.log('Server created successfully:', serverAttrs.id, serverAttrs.identifier);

    recordSpending(userEmail, requiredAmount, `Server "${name}" (${plan} plan)`, serverAttrs.id);
    console.log(`Recorded spending: KES ${requiredAmount} for user ${userEmail}, server ${serverAttrs.id}`);

    return res.json({
      success: true,
      message: 'Server created successfully',
      server: {
        id: serverAttrs.id,
        identifier: serverAttrs.identifier,
        uuid: serverAttrs.uuid,
        name: serverAttrs.name,
        description: serverAttrs.description,
        plan: plan,
        status: serverAttrs.suspended ? 'suspended' : 'installing',
        node: serverAttrs.node,
        allocation: serverAttrs.allocation,
        limits: serverAttrs.limits,
        feature_limits: serverAttrs.feature_limits,
      },
    });
  } catch (error) {
    console.error('Server creation error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating server' });
  }
});

app.get('/api/servers', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const pteroResponse = await pteroFetch(`/users/${userId}?include=servers`);
    const pteroData = await pteroResponse.json();

    if (!pteroResponse.ok) {
      console.error('Pterodactyl servers fetch error:', JSON.stringify(pteroData));
      return res.json({ success: true, servers: [] });
    }

    const userServers = pteroData.attributes?.relationships?.servers?.data || [];
    const userEmail = pteroData.attributes?.email || '';

    if (userEmail && userServers.length > 0) {
      const existingSpending = loadSpending();
      const trackedServerIds = new Set(existingSpending.filter(r => r.email === userEmail.toLowerCase()).map(r => r.serverId));

      for (const s of userServers) {
        const sid = s.attributes.id.toString();
        if (!trackedServerIds.has(sid)) {
          const mem = s.attributes.limits?.memory || 0;
          const cpu = s.attributes.limits?.cpu || 0;
          let plan = 'Limited';
          if ((mem === 0 || mem > 100000) && cpu >= 400) plan = 'Admin';
          else if (mem === 0 || mem > 100000) plan = 'Unlimited';
          const cost = TIER_PRICES[plan] || 50;
          recordSpending(userEmail, cost, `Server "${s.attributes.name}" (${plan} plan)`, sid);
          console.log(`Auto-reconciled spending: KES ${cost} for server ${sid} (${s.attributes.name}), user ${userEmail}`);
        }
      }
    }

    const allocCache = {};

    const servers = await Promise.all(userServers.map(async (s) => {
      const attrs = s.attributes;
      let ip = '';
      let port = '';

      if (attrs.allocation && !allocCache[attrs.allocation]) {
        try {
          const allocRes = await pteroFetch(`/nodes/${attrs.node}/allocations?per_page=100`);
          const allocData = await allocRes.json();
          if (allocRes.ok && allocData.data) {
            allocData.data.forEach(a => {
              allocCache[a.attributes.id] = a.attributes;
            });
          }
        } catch (e) {}
      }

      if (allocCache[attrs.allocation]) {
        const alloc = allocCache[attrs.allocation];
        ip = alloc.alias || alloc.ip;
        port = alloc.port;
      }

      let plan = 'Limited';
      const mem = attrs.limits.memory;
      const cpu = attrs.limits.cpu;
      if ((mem === 0 || mem > 100000) && cpu >= 400) {
        plan = 'Admin';
      } else if (mem === 0 || mem > 100000) {
        plan = 'Unlimited';
      }

      const formatMem = (m) => {
        if (m === 0 || m > 100000) return 'Unlimited';
        if (m >= 1024) return `${Math.round(m / 1024)}GB`;
        return `${m}MB`;
      };

      const formatDisk = (d) => {
        if (d === 0 || d > 1000000) return 'Unlimited';
        if (d >= 1024) return `${Math.round(d / 1024)}GB`;
        return `${d}MB`;
      };

      let status = 'online';
      if (attrs.suspended) {
        status = 'suspended';
      } else if (attrs.status === 'installing') {
        status = 'installing';
      } else if (attrs.status === 'install_failed') {
        status = 'error';
      } else if (attrs.status === 'suspended') {
        status = 'suspended';
      }

      return {
        id: attrs.id.toString(),
        identifier: attrs.identifier,
        uuid: attrs.uuid,
        name: attrs.name,
        description: attrs.description || '',
        status,
        plan: plan,
        ip: ip ? `${ip}:${port}` : '',
        node: attrs.node,
        cpu: `${cpu}%`,
        ram: formatMem(mem),
        storage: formatDisk(attrs.limits.disk),
        uptime: '-',
      };
    }));

    return res.json({
      success: true,
      servers,
      total: servers.length,
    });
  } catch (error) {
    console.error('Servers fetch error:', error);
    return res.json({ success: true, servers: [] });
  }
});

app.delete('/api/servers/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { userId, userEmail } = req.query;

    if (!serverId) {
      return res.status(400).json({ success: false, message: 'Server ID is required' });
    }

    if (userId && userEmail) {
      const pteroUser = await verifyPteroUser(userId);
      if (!pteroUser || pteroUser.email.toLowerCase() !== userEmail.toLowerCase()) {
        return res.status(403).json({ success: false, message: 'User verification failed' });
      }

      const serverRes = await pteroFetch(`/servers/${serverId}`);
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.attributes && serverData.attributes.user !== parseInt(userId)) {
          return res.status(403).json({ success: false, message: 'You do not own this server' });
        }
      }
    }

    console.log('Deleting Pterodactyl server:', serverId);

    const pteroResponse = await pteroFetch(`/servers/${serverId}`, {
      method: 'DELETE',
    });

    if (pteroResponse.status === 204 || pteroResponse.ok) {
      console.log('Server deleted successfully:', serverId);
      return res.json({ success: true, message: 'Server deleted successfully' });
    }

    const pteroData = await pteroResponse.json().catch(() => ({}));
    console.error('Pterodactyl delete error:', JSON.stringify(pteroData));
    return res.status(pteroResponse.status || 500).json({
      success: false,
      message: pteroData.errors?.[0]?.detail || 'Failed to delete server',
    });
  } catch (error) {
    console.error('Server deletion error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting server' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'WolfHost API' });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paystack API server running on port ${PORT}`);
});
