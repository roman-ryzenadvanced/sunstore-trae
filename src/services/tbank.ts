import crypto from 'crypto';

interface TBankPaymentRequest {
  Amount: number;
  OrderId: string;
  Description: string;
  CustomerKey: string;
  DATA: Record<string, string>;
}

interface TBankPaymentResponse {
  Success: boolean;
  Message?: string;
  PaymentId?: string;
  PaymentURL?: string;
  ErrorCode?: string;
}

export class TBankService {
  private terminalKey: string;
  private secret: string;
  private testMode: boolean;
  private apiUrl: string;

  constructor(storeId: string) {
    this.terminalKey = process.env.TBANK_TERMINAL_KEY || '';
    this.secret = process.env.TBANK_SECRET || '';
    this.testMode = process.env.TBANK_TEST_MODE === 'true';
    this.apiUrl = this.testMode 
      ? 'https://securepay.tinkoff.ru/v2/' 
      : 'https://securepay.tinkoff.ru/v2/';
  }

  async createPayment(orderId: string, amount: number, description: string, customerKey: string): Promise<TBankPaymentResponse> {
    const params: TBankPaymentRequest = {
      Amount: Math.round(amount * 100), // копейки
      OrderId: orderId,
      Description: description,
      CustomerKey: customerKey,
      DATA: {
        Email: customerKey,
        Phone: '',
      }
    };

    const response = await fetch(`${this.apiUrl}Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        TerminalKey: this.terminalKey,
        Token: this.generateToken(params)
      })
    });

    const data = await response.json();
    
    return {
      Success: data.Success || false,
      Message: data.Message,
      PaymentId: data.PaymentId,
      PaymentURL: data.PaymentURL,
      ErrorCode: data.ErrorCode
    };
  }

  async getPaymentStatus(orderId: string): Promise<any> {
    const params = { OrderId: orderId, TerminalKey: this.terminalKey };
    
    const response = await fetch(`${this.apiUrl}GetState`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        Token: this.generateToken(params)
      })
    });

    return response.json();
  }

  private generateToken(params: any): string {
    const password = this.secret;
    // T-Bank spec: Token and TerminalKey must be excluded from the hash
    const filtered = Object.entries(params)
      .filter(([key, value]) => value !== null && value !== undefined && key !== 'Token' && key !== 'TerminalKey')
      .sort(([a], [b]) => a.localeCompare(b));

    const concatenated = filtered.map(([, value]) => String(value)).join('');
    const raw = `${concatenated}${password}`;

    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async verifyCallback(params: any): Promise<boolean> {
    const receivedToken = params.Token;
    // Recompute over the callback payload excluding Token/TerminalKey, then compare
    const calculatedToken = this.generateToken(params);

    if (!receivedToken || !calculatedToken) return false;
    const a = Buffer.from(receivedToken);
    const b = Buffer.from(calculatedToken);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}