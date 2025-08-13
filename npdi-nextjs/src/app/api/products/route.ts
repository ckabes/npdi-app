import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/config/database';
import ProductTicket from '@/lib/models/ProductTicket';
import pubchemService from '@/lib/services/pubchemService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();

    let ticketData = {
      ...body,
      createdBy: null, // Remove authentication requirement
      sbu: body.sbu || 'Life Science'
    };

    // Auto-populate from PubChem if CAS number provided
    if (ticketData.chemicalProperties?.casNumber && !ticketData.skipAutopopulate) {
      try {
        console.log('Auto-populating ticket data from PubChem...');
        const enrichedData = await pubchemService.enrichTicketData(ticketData.chemicalProperties.casNumber);
        
        // Merge PubChem data with provided data, giving priority to user input
        ticketData = {
          ...ticketData,
          productName: ticketData.productName || enrichedData.productName,
          chemicalProperties: {
            ...enrichedData.chemicalProperties,
            ...ticketData.chemicalProperties // User input takes priority
          },
          hazardClassification: {
            ...enrichedData.hazardClassification,
            ...ticketData.hazardClassification // User input takes priority
          },
          // No auto-generated SKUs for product managers - PMOps will assign
          // Add CorpBase data
          corpbaseData: enrichedData.corpbaseData || {}
        };
        
        console.log('Successfully enriched ticket with PubChem data');
      } catch (pubchemError: any) {
        console.warn('PubChem enrichment failed, proceeding with user data:', pubchemError.message);
        // Continue with user-provided data if PubChem fails
      }
    }

    console.log('Creating ticket with data:', JSON.stringify(ticketData, null, 2));
    const ticket = new ProductTicket(ticketData);
    await ticket.save();
    console.log('Ticket created successfully:', ticket._id);

    return NextResponse.json({
      message: 'Product ticket created successfully',
      ticket,
      autoPopulated: ticketData.chemicalProperties?.autoPopulated || false
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Create ticket error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    
    return NextResponse.json({ 
      message: 'Server error during ticket creation',
      error: error.message,
      validationErrors: error.errors || null
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sbu = searchParams.get('sbu');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    
    let filter: any = {};

    if (status) filter.status = status;
    if (sbu) filter.sbu = sbu;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { 'chemicalProperties.casNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const tickets = await ProductTicket.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProductTicket.countDocuments(filter);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Get tickets error:', error);
    return NextResponse.json({ 
      message: 'Server error while fetching tickets' 
    }, { status: 500 });
  }
}