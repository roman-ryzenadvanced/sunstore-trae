'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import CurrencyPicker from '@/components/CurrencyPicker';

type Gateway = 'tbank' | 'yookassa' | 'sberpay';

interface GatewayConfig {
  enabled: boolean;
  testMode: boolean;
  apiKey?: string;
  secretKey?: string;
  terminalKey?: string;
}

export default function PaymentGatewaySettings() {
  const [activeGateway, setActiveGateway] = useState<Gateway>('tbank');
  const [configs, setConfigs] = useState<Record<Gateway, GatewayConfig>>({
    tbank: { enabled: false, testMode: true },
    yookassa: { enabled: false, testMode: true },
    sberpay: { enabled: false, testMode: true }
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const gateways = [
    { id: 'tbank', name: 'T-Bank (Tinkoff)', logo: 'TB', popular: true },
    { id: 'yookassa', name: 'YooKassa (Yandex)', logo: 'YK', popular: false },
    { id: 'sberpay', name: 'SberPay', logo: 'SP', popular: true }
  ];

  const handleConfigChange = (gateway: Gateway, field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [gateway]: { ...prev[gateway], [field]: value }
    }));
  };

  const testGateway = async (gateway: Gateway) => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/test-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway, config: configs[gateway] })
      });
      
      const result = await response.json();
      setTestResult({ gateway, result });
    } catch (error) {
      setTestResult({ gateway, result: { error: 'Connection failed' } });
    } finally {
      setIsTesting(false);
    }
  };

  const saveSettings = async () => {
    await fetch('/api/admin/store-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentConfigs: configs })
    });
    
    alert('Payment gateway settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Payment Gateway Settings</h1>
        <p className="text-ink-2 mt-2">Configure and test payment providers for your store</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Available Gateways</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gateways.map(gateway => (
            <button
              key={gateway.id}
              onClick={() => setActiveGateway(gateway.id as Gateway)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                activeGateway === gateway.id
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-border hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-amber-500">{gateway.logo}</span>
                <div>
                  <div className="font-medium">{gateway.name}</div>
                  {gateway.popular && (
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Popular</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeGateway === 'tbank' && (
        <div className="bg-solar-50 p-6 rounded-xl mb-6">
          <h3 className="font-semibold mb-4">T-Bank Configuration</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label>Enable T-Bank</label>
              <input
                type="checkbox"
                checked={configs.tbank.enabled}
                onChange={(e) => handleConfigChange('tbank', 'enabled', e.target.checked)}
                className="w-5 h-5 accent-amber-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label>Test Mode (Sandbox)</label>
              <input
                type="checkbox"
                checked={configs.tbank.testMode}
                onChange={(e) => handleConfigChange('tbank', 'testMode', e.target.checked)}
                className="w-5 h-5 accent-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Terminal Key</label>
              <input
                type="password"
                value={configs.tbank.terminalKey || ''}
                onChange={(e) => handleConfigChange('tbank', 'terminalKey', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Secret Key</label>
              <input
                type="password"
                value={configs.tbank.secretKey || ''}
                onChange={(e) => handleConfigChange('tbank', 'secretKey', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => testGateway('tbank')}
              disabled={isTesting}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            {testResult?.gateway === 'tbank' && (
              <div className={`p-3 rounded ${testResult.result.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {testResult.result.error || 'Connection successful!'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={saveSettings}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}