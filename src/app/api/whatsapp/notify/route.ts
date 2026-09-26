import { NextResponse } from 'next/server';
import { notifyCustomerOS, type OSStatusType } from '@/lib/whatsapp-vps';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerPhone,
      customerName,
      osNumber,
      osId,
      status,
      equipmentBrand,
      equipmentModel,
      amount,
    } = body;

    if (!customerPhone || !customerName) {
      return NextResponse.json(
        { error: 'customerPhone e customerName são obrigatórios' },
        { status: 400 },
      );
    }

    const result = await notifyCustomerOS({
      customerPhone,
      customerName,
      osNumber: osNumber || osId,
      osId,
      status: (status as OSStatusType) || 'created',
      equipmentBrand,
      equipmentModel,
      amount,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
