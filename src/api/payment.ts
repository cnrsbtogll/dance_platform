import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePromise: Promise<Stripe | null> = loadStripe('YOUR_PUBLISHABLE_KEY');

type Currency = 'USD' | 'EUR' | 'TRY' | 'GBP';

interface PaymentResult {
  success: boolean;
  message?: string;
  error?: Error;
}

export const processPayment = async (amount: number, currency: Currency = 'USD'): Promise<PaymentResult> => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Failed to initialize Stripe');
    }
    
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
      }),
    });

    const session = await response.json();
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Payment Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown payment error')
    };
  }
}; 