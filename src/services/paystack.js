// src/services/paystack.js

const PAYSTACK_API_URL = 'https://api.paystack.co';

// Get API keys
const PAYSTACK_PUBLIC_KEY = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_demo';
const PAYSTACK_SECRET_KEY = import.meta.env?.VITE_PAYSTACK_SECRET_KEY || 'sk_test_demo';

console.log('Paystack MPESA Service Loaded');

export const paystackAPI = {
  /**
   * Initialize MPESA STK Push payment
   * @param {string} phone - Kenyan phone number (2547XXXXXXXX)
   * @param {number} amount - Amount in KES
   * @param {Object} metadata - Additional data
   * @returns {Promise}
   */
  initializeMpesaPayment: async (phone, amount, metadata = {}) => {
    try {
      console.log('📱 Initiating MPESA Payment:', { phone, amount });
      
      const amountInCents = Math.round(amount * 100);
      const callbackUrl = `${window.location.origin}/billing`;
      
      const response = await fetch(`${PAYSTACK_API_URL}/charge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `${phone}@mpesa.ke`, // Paystack requires email, so we use phone as email
          amount: amountInCents,
          currency: 'KES',
          mobile_money: {
            phone: phone,
            provider: 'mpesa' // For Kenya
          },
          metadata: {
            ...metadata,
            payment_type: 'mpesa_stk',
            phone_number: phone,
            country: 'KE'
          },
          callback_url: callbackUrl,
        }),
      });

      const data = await response.json();
      console.log('Paystack MPESA Response:', data);
      
      if (!response.ok) {
        let errorMessage = data.message || `MPESA payment failed (${response.status})`;
        
        if (response.status === 400 && data.message?.includes('phone')) {
          errorMessage = 'Invalid phone number. Please use a valid Safaricom number.';
        }
        
        throw new Error(errorMessage);
      }
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to initiate MPESA payment');
      }
      
      return {
        success: true,
        data: data.data,
        message: 'MPESA STK Push initiated. Check your phone to enter PIN.',
        reference: data.data.reference
      };
      
    } catch (error) {
      console.error('❌ MPESA Payment Error:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to initiate MPESA payment. Please try again.',
        error: error.message
      };
    }
  },

  /**
   * Initialize card payment (for other payment methods)
   */
  initializePayment: async (email, amount, metadata = {}) => {
    try {
      const amountInCents = Math.round(amount * 100);
      const callbackUrl = `${window.location.origin}/billing`;
      
      const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          amount: amountInCents,
          currency: 'KES',
          metadata: metadata,
          callback_url: callbackUrl,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Payment failed (${response.status})`);
      }
      
      if (!data.status) {
        throw new Error(data.message || 'Payment initialization failed');
      }
      
      return {
        success: true,
        data: data.data,
        message: data.message,
        reference: data.data.reference
      };
      
    } catch (error) {
      console.error('Payment Error:', error);
      return {
        success: false,
        message: error.message || 'Payment failed'
      };
    }
  },

  /**
   * Verify payment status
   */
  verifyPayment: async (reference) => {
    try {
      const response = await fetch(
        `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Verification failed (${response.status})`);
      }
      
      return {
        success: data.status === true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Verification Error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Check if Paystack supports MPESA
   */
  checkMpesaSupport: async () => {
    try {
      const response = await fetch(`${PAYSTACK_API_URL}/bank?currency=KES&country=kenya`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });
      
      const data = await response.json();
      const hasMpesa = data.data?.some(bank => 
        bank.name.toLowerCase().includes('mpesa') || 
        bank.slug === 'mpesa'
      );
      
      return {
        supported: hasMpesa,
        message: hasMpesa ? 'MPESA is supported' : 'MPESA not available',
        banks: data.data
      };
    } catch (error) {
      return {
        supported: false,
        message: error.message
      };
    }
  }
};

/**
 * Format Kenyan phone number
 */
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

/**
 * Validate Kenyan phone number
 */
export const validatePhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);
  return formatted.length === 12 && formatted.startsWith('2547');
};