import { NextRequest, NextResponse } from 'next/server';
import { TBankService } from '@/services/tbank';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderId, amount, description, customerKey } = body;
  
  const tbank = new TBankService(body.storeId || 'default');
  const result = await tbank.createPayment(orderId, amount, description, customerKey);
  
  if (result.Success && result.PaymentURL) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'pending_payment', paymentId: result.PaymentId }
    });
  }
  
  return NextResponse.json(result);
}