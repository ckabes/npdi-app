import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/config/database';
import ProductTicket from '@/lib/models/ProductTicket';

export async function GET() {
  try {
    await connectDB();
    
    const filter = {};

    const stats = await Promise.all([
      ProductTicket.countDocuments({ ...filter, status: 'DRAFT' }),
      ProductTicket.countDocuments({ ...filter, status: 'IN_PROCESS' }),
      ProductTicket.countDocuments({ ...filter, status: 'COMPLETED' }),
      ProductTicket.countDocuments({ ...filter, status: 'CANCELED' }),
      ProductTicket.countDocuments(filter),
      ProductTicket.aggregate([
        { $match: filter },
        { $group: { _id: '$sbu', count: { $sum: 1 } } }
      ]),
      ProductTicket.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);

    return NextResponse.json({
      statusCounts: {
        draft: stats[0],
        inProcess: stats[1],
        completed: stats[2],
        canceled: stats[3],
        total: stats[4]
      },
      sbuBreakdown: stats[5],
      priorityBreakdown: stats[6]
    });
    
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    
    // Provide fallback data
    return NextResponse.json({
      statusCounts: {
        draft: 0,
        inProcess: 0,
        completed: 0,
        canceled: 0,
        total: 0
      },
      sbuBreakdown: [],
      priorityBreakdown: []
    });
  }
}