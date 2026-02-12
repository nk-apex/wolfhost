console.log('Paystack MPESA Service Loaded');

export const paystackAPI = {
  initializeMpesaPayment: async (phone, amount, metadata = {}) => {
    try {
      let userEmail = '';
      try {
        const storedUser = localStorage.getItem('current_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          userEmail = u.email || '';
        }
      } catch (e) {}

      console.log('Initiating MPESA Payment:', { phone, amount, userEmail });

      const response = await fetch('/api/mpesa/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, metadata, userEmail }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to initiate M-Pesa payment');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
        reference: data.reference,
      };
    } catch (error) {
      console.error('MPESA Payment Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to initiate M-Pesa payment. Please try again.',
        error: error.message,
      };
    }
  },

  verifyPayment: async (reference, userId) => {
    try {
      const url = userId ? `/api/mpesa/verify/${encodeURIComponent(reference)}?userId=${userId}` : `/api/mpesa/verify/${encodeURIComponent(reference)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      return {
        success: data.success,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Verification Error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  },

  initializeCardPayment: async (email, amount, callbackUrl, metadata = {}) => {
    try {
      console.log('Initiating Card Payment:', { email, amount });

      const response = await fetch('/api/card/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount, callbackUrl, metadata }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to initialize card payment');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
        authorizationUrl: data.authorizationUrl,
        reference: data.reference,
        accessCode: data.accessCode,
      };
    } catch (error) {
      console.error('Card Payment Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to initialize card payment. Please try again.',
        error: error.message,
      };
    }
  },

  verifyCardPayment: async (reference, userId) => {
    try {
      const url = userId ? `/api/card/verify/${encodeURIComponent(reference)}?userId=${userId}` : `/api/card/verify/${encodeURIComponent(reference)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      return {
        success: data.success,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Card Verification Error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  },

  submitOtp: async (otp, reference) => {
    try {
      const response = await fetch('/api/mpesa/submit-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, reference }),
      });

      const data = await response.json();

      return {
        success: data.success,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('OTP Submit Error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  },
};

export const formatPhoneNumber = (phone) => {
  let formatted = phone.toString().replace(/\D/g, '');

  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.substring(1);
  } else if (formatted.startsWith('+254')) {
    formatted = formatted.substring(1);
  } else if (!formatted.startsWith('254')) {
    formatted = '254' + formatted;
  }

  return formatted;
};

export const validatePhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);
  return formatted.length === 12 && formatted.startsWith('254');
};
