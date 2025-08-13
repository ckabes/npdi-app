import { NextRequest, NextResponse } from 'next/server';
import pubchemService from '@/lib/services/pubchemService';

interface RouteParams {
  params: {
    casNumber: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { casNumber } = params;
    
    if (!casNumber || !/^\d{1,7}-\d{2}-\d$/.test(casNumber)) {
      return NextResponse.json({
        message: 'Invalid CAS number format'
      }, { status: 400 });
    }

    console.log(`CAS lookup request for: ${casNumber}`);
    const enrichedData = await pubchemService.enrichTicketData(casNumber);
    
    return NextResponse.json({
      message: 'CAS lookup successful',
      data: enrichedData,
      casNumber
    });
    
  } catch (error: any) {
    console.error('CAS lookup error:', error);
    return NextResponse.json({ 
      message: 'Failed to lookup CAS number',
      error: error.message,
      casNumber: params.casNumber
    }, { status: 500 });
  }
}