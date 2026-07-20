import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export class SheetsService {
  private sheets: any;
  private spreadsheetId: string;
  private sheetName: string;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || '';
    this.sheetName = process.env.GOOGLE_SHEET_NAME || 'Orders';
    
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
      scopes: SCOPES
    });
    
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async syncOrder(order: any) {
    const values = this.formatOrderRow(order);
    
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A:N`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] }
    });
  }

  async syncInventoryUpdate(productId: string, quantity: number) {
    // Update inventory tracking sheet
    const values = [
      new Date().toISOString(),
      productId,
      quantity,
      'Order fulfilled'
    ];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Inventory!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] }
    });
  }

  private formatOrderRow(order: any) {
    return [
      order.id,
      new Date(order.createdAt).toISOString(),
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.totalAmount,
      order.currency,
      order.paymentMethod,
      order.status,
      order.items.map((i: any) => `${i.productName} x${i.quantity}`).join(', '),
      order.shippingAddress?.city || '',
      order.shippingAddress?.street || '',
      order.paymentId || '',
      order.notes || ''
    ];
  }

  async createSheetIfNotExists() {
    try {
      await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1`
      });
    } catch {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: this.sheetName }
            }
          }]
        }
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:N1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            'Order ID',
            'Date',
            'Customer Name',
            'Email',
            'Phone',
            'Total Amount',
            'Currency',
            'Payment Method',
            'Status',
            'Items',
            'City',
            'Address',
            'Payment ID',
            'Notes'
          ]]
        }
      });
    }
  }
}