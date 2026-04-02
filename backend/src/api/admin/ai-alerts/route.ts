import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AIAlert } from '@/lib/models/AIAlert';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Fetch recent sentiment alerts
    const alerts = await AIAlert.find({ 
      type: 'sentiment_risk' 
    })
    .sort({ createdAt: -1 })
    .limit(50);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('[AdminAIAlerts] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { alertId: string; acknowledged: boolean };
    const { alertId, acknowledged } = body;
    await connectDB();

    const alert = await AIAlert.findByIdAndUpdate(
      alertId,
      { 
        acknowledged, 
        acknowledgedBy: decoded.userId,
        acknowledgedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('[AdminAIAlerts] PATCH Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
