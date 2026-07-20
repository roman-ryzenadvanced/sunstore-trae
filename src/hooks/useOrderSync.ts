import { useEffect } from 'react';
import { SheetsService } from '@/services/sheets';

export function useOrderSync(orderId: string | null, orderData: any) {
  useEffect(() => {
    if (orderId && orderData && orderData.status === 'paid') {
      const sync = async () => {
        try {
          const sheets = new SheetsService();
          await sheets.createSheetIfNotExists();
          await sheets.syncOrder(orderData);
          console.log('Order synced to Google Sheets:', orderId);
        } catch (error) {
          console.error('Failed to sync order to Sheets:', error);
        }
      };
      
      sync();
    }
  }, [orderId, orderData]);
}