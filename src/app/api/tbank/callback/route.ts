import { NextRequest, NextResponse } from 'next/server';
import { TBankService } from '@/services/tbank';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const tbank = new TBankService('default');
  const isValid = await tbank.verifyCallback(body);
  
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid callback' }, { status: 400 });
  }
  
  const orderId = body.OrderId;
  const status = body.Status; // CONFIRMED, REJECTED, CANCELED
  
  await prisma.order.update({
    where: { id: orderId },
    data: { status: status.toLowerCase() === 'confirmed' ? 'paid' : 'cancelled' }
  });
  
  return NextResponse.json({ Success: true });
}