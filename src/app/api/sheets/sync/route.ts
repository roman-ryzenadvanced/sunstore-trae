import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/services/sheets';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const { orderId } = await request.json();
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  try {
    const sheets = new SheetsService();
    await sheets.createSheetIfNotExists();
    await sheets.syncOrder(order);
    
    return NextResponse.json({ success: true, synced: true });
  } catch (error) {
    console.error('Sheet sync failed:', error);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}