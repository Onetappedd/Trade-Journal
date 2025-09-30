/**
 * SnapTrade Brokers Endpoint
 * Lists supported brokers with names and logos
 */

import { NextRequest, NextResponse } from 'next/server';
import { listAllBrokerages } from '@/lib/snaptrade';

export async function GET(request: NextRequest) {
  try {
    // Get all brokerages from SnapTrade
    const brokerages = await listAllBrokerages();

    // Filter to only active/supported brokerages
    const supportedBrokerages = brokerages.filter((b: any) => !b.disabled);

    return NextResponse.json({
      success: true,
      data: {
        brokers: supportedBrokerages,
        total: supportedBrokerages.length
      }
    });

  } catch (error: any) {
    console.error('Brokers fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch brokers',
      details: error.message 
    }, { status: 500 });
  }
}
