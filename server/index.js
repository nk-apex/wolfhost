import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

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
    const { phone, amount, metadata } = req.body;

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

    console.log('Sending to Paystack:', { phone: paystackPhone, amount: amountInCents, email: `${formattedPhone}@mpesa.ke` });

    const response = await paystackFetch('/charge', {
      method: 'POST',
      body: JSON.stringify({
        email: `${formattedPhone}@mpesa.ke`,
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
    const { perPage = 50, page = 1, status } = req.query;

    let path = `/transaction?perPage=${perPage}&page=${page}&currency=KES`;
    if (status) {
      path += `&status=${status}`;
    }

    const response = await paystackFetch(path);
    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(response.status || 400).json({
        success: false,
        message: data.message || 'Failed to fetch transactions',
      });
    }

    const transactions = (data.data || []).map((txn) => ({
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
    }));

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
    const response = await paystackFetch('/transaction?perPage=100&currency=KES&status=success');
    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.json({
        success: true,
        totalDeposits: 0,
        totalCount: 0,
        balance: 0,
      });
    }

    const transactions = data.data || [];
    const totalDeposits = transactions.reduce((sum, txn) => sum + (txn.amount / 100), 0);

    return res.json({
      success: true,
      totalDeposits,
      totalCount: transactions.length,
      balance: totalDeposits,
    });
  } catch (error) {
    console.error('Totals fetch error:', error);
    return res.json({
      success: true,
      totalDeposits: 0,
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

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paystack API server running on port ${PORT}`);
});
