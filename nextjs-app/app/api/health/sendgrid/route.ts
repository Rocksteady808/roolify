import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  return NextResponse.json({
    status: apiKey ? 'configured' : 'missing',
    keyExists: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 5) || 'NOT_SET',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    availableSendGridVars: Object.keys(process.env).filter(k => k.includes('SENDGRID'))
  });
}

