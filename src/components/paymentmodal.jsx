import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, CreditCard, Wallet, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { paystackAPI } from '../services/paystack';
import LoadingSpinner from './LoadingSpinner';

const PaymentModal = ({ isOpen, onClose, invoice, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('mpesa'); // Default to MPESA
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState(invoice?.amount || 100);
  const [step, setStep] = useState('select');
  const [error, setError] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState('');

  const handleMpesaPayment = async () => {
    // Validate Kenyan phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }

    // Format phone number
    let formattedPhone = phoneNumber.trim();
    
    // Remove spaces and dashes
    formattedPhone = formattedPhone.replace(/\s+/g, '').replace(/-/g, '');
    
    // Add 254 prefix if needed
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    if (formattedPhone.length !== 12) {
      setError('Please enter a valid Kenyan phone number (10 digits)');
      return;
    }

    if (customAmount < 100) {
      setError('Minimum amount is KES 100');
      return;
    }

    setError('');
    setLoading(true);
    setMpesaStatus('Initiating MPESA STK Push...');

    try {
      const amount = invoice ? invoice.amount : customAmount;
      
      console.log('Initiating MPESA payment:', {
        phone: formattedPhone,
        amount: amount,
        formattedPhone: formattedPhone
      });

      // For now, we'll use Paystack's mobile money
      // In a real implementation, you'd use a dedicated MPESA API
      const metadata = {
        invoice_id: invoice?.id || 'wallet_topup',
        phone_number: formattedPhone,
        payment_method: 'mpesa',
        type: invoice ? 'invoice_payment' : 'wallet_topup',
        timestamp: new Date().toISOString(),
      };

      const response = await paystackAPI.initializeMpesaPayment(
        formattedPhone,
        amount,
        metadata
      );

      if (response.success) {
        setMpesaStatus('STK Push sent to your phone. Please enter your MPESA PIN to complete payment.');
        setStep('mpesa_pending');
        
        // Start polling for payment confirmation
        pollForPayment(response.data.reference);
      } else {
        throw new Error(response.message || 'Failed to initiate MPESA payment');
      }
    } catch (error) {
      console.error('MPESA payment error:', error);
      setError(error.message || 'Failed to initiate MPESA payment. Please try again.');
      setLoading(false);
    }
  };

  const pollForPayment = async (reference) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 30 seconds
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Payment timeout. Please check your phone and try again.');
        setLoading(false);
        setStep('select');
        return;
      }
      
      attempts++;
      
      try {
        const result = await paystackAPI.verifyPayment(reference);
        
        if (result.success && result.data.status === 'success') {
          // Payment successful
          setMpesaStatus('✅ Payment confirmed!');
          setStep('success');
          onPaymentSuccess(result.data);
          setLoading(false);
        } else if (result.data.status === 'pending') {
          // Still pending, continue polling
          setMpesaStatus('Waiting for payment confirmation... (' + attempts + '/30)');
          setTimeout(poll, 1000);
        } else {
          // Payment failed
          setError('Payment failed or was cancelled');
          setLoading(false);
          setStep('select');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setTimeout(poll, 1000);
      }
    };
    
    poll();
  };

  const handleCardPayment = async () => {
    // ... existing card payment logic ...
  };

  const handlePayment = () => {
    if (paymentMethod === 'mpesa') {
      handleMpesaPayment();
    } else {
      handleCardPayment();
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl border border-primary/30 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              {invoice ? `Pay Invoice ${invoice.id}` : 'Add Funds to Wallet'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          {step === 'select' && (
            <>
              {!invoice && (
                <div className="mb-6">
                  <label className="block text-sm font-mono text-gray-400 mb-3">
                    Select Amount (KES)
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCustomAmount(amt)}
                        className={`p-3 rounded-lg border font-mono transition-all ${
                          customAmount === amt
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-700 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      >
                        KES {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 font-mono">KES</span>
                    <input
                      type="number"
                      min="100"
                      step="1"
                      value={customAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 100) {
                          setCustomAmount(value);
                        }
                      }}
                      className="w-full pl-12 p-3 bg-black/50 border border-gray-700 rounded-lg font-mono focus:border-primary focus:outline-none"
                      placeholder="Enter amount"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Minimum amount: KES 100
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-mono text-gray-400 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'mpesa'
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-gray-700 hover:border-green-500/50 hover:bg-green-500/5'
                    }`}
                  >
                    <Smartphone size={24} />
                    <span className="text-sm font-mono">MPESA</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5'
                    }`}
                  >
                    <CreditCard size={24} />
                    <span className="text-sm font-mono">Card</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'mpesa' ? (
                <div className="mb-6">
                  <label className="block text-sm font-mono text-gray-400 mb-2">
                    MPESA Phone Number
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Phone size={20} className="text-green-400" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 p-3 bg-black/50 border border-gray-700 rounded-lg font-mono focus:border-green-500 focus:outline-none"
                      placeholder="0712345678"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter your Safaricom number. You'll receive an STK push to enter your PIN.
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-mono text-gray-400 mb-2">
                    Email for receipt
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-black/50 border border-gray-700 rounded-lg font-mono focus:border-primary focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 p-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading || 
                    (paymentMethod === 'mpesa' ? !phoneNumber : !email) || 
                    customAmount < 100}
                  className={`flex-1 p-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    paymentMethod === 'mpesa' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-primary hover:bg-primary/80 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    `Pay KES ${(invoice?.amount || customAmount).toLocaleString()}`
                  )}
                </button>
              </div>

              {paymentMethod === 'mpesa' && (
                <div className="mt-4 p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
                  <p className="text-xs text-green-400 text-center">
                    💡 You'll receive an STK push on your phone. Enter your MPESA PIN to complete payment.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 'mpesa_pending' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">MPESA Payment Initiated</h3>
              <div className="bg-black/50 rounded-lg p-4 mb-6">
                <p className="text-gray-300 mb-2">{mpesaStatus}</p>
                <p className="text-sm text-gray-400">
                  Amount: <span className="font-bold text-green-400">KES {(invoice?.amount || customAmount).toLocaleString()}</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Phone: <span className="font-mono">{phoneNumber}</span>
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-150"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-300"></div>
                </div>
                <p className="text-sm text-gray-500">
                  Waiting for payment confirmation...
                </p>
                <button
                  onClick={() => {
                    setStep('select');
                    setLoading(false);
                  }}
                  className="text-sm text-gray-400 hover:text-white mt-4"
                >
                  Cancel payment
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
              <p className="text-gray-400 mb-6">
                Your MPESA payment has been confirmed.
              </p>
              <div className="bg-black/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Amount:</span>
                  <span className="font-bold text-green-400 text-lg">
                    KES {(invoice?.amount || customAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Phone:</span>
                  <span className="font-mono text-sm">{phoneNumber}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors w-full"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;