'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CheckoutStep {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed';
}

export function useCheckoutState() {
  const [currentStep, setCurrentStep] = useState(0);
  const { currency, formatPrice } = useCurrency();
  const [formData, setFormData] = useState({
    shipping: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: ''
    },
    payment: {
      method: 'tbank',
      agreeTerms: false
    }
  });
  const [isRedirecting, setIsRedirecting] = useState(false);

  const steps: CheckoutStep[] = [
    { id: 1, name: 'Shipping', status: currentStep > 0 ? 'completed' : (currentStep === 0 ? 'active' : 'pending') },
    { id: 2, name: 'Payment', status: currentStep > 1 ? 'completed' : (currentStep === 1 ? 'active' : 'pending') },
    { id: 3, name: 'Review', status: currentStep > 2 ? 'completed' : (currentStep === 2 ? 'active' : 'pending') }
  ];

  const calculateIntegrityProgress = (): number => {
    let filled = 0;
    const total = 12; // 6 shipping fields + payment method + terms checkbox

    Object.values(formData.shipping).forEach(value => {
      if (value.trim()) filled++;
    });

    if (formData.payment.method) filled++;
    if (formData.payment.agreeTerms && currentStep === 2) filled++;

    return Math.round((filled / total) * 100);
  };

  const handleFieldChange = (step: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: { ...prev[step], [field]: value }
    }));
  };

  const proceedToPayment = async (orderId: string, amount: number) => {
    setIsRedirecting(true);

    try {
      const response = await fetch('/api/tbank/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          description: `Sunstore Order ${orderId}`,
          customerKey: formData.shipping.email
        })
      });

      const data = await response.json();

      if (data.Success && data.PaymentURL) {
        // Redirect to T-Bank payment page
        window.location.href = data.PaymentURL;
      } else {
        throw new Error(data.Message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment redirect failed:', error);
      alert('Failed to initialize payment. Please try again.');
      setIsRedirecting(false);
    }
  };

  const placeOrder = async () => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipping: formData.shipping,
        payment: formData.payment,
        currency
      })
    });

    const order = await response.json();
    
    if (formData.payment.method === 'tbank') {
      await proceedToPayment(order.id, order.total);
    } else {
      // Redirect to status page
      window.location.href = `/order/${order.id}/status`;
    }

    return order;
  };

  return {
    currentStep,
    setCurrentStep,
    steps,
    formData,
    handleFieldChange,
    calculateIntegrityProgress,
    placeOrder,
    isRedirecting,
    formatPrice,
    currency
  };
}