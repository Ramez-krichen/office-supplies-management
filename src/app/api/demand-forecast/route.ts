import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control';

const prisma = new PrismaClient();

// Simple moving average forecasting algorithm
function calculateMovingAverage(data: number[], periods: number = 3): number {
  if (data.length < periods) return data.reduce((a, b) => a + b, 0) / data.length;
  const recent = data.slice(-periods);
  return recent.reduce((a, b) => a + b, 0) / periods;
}

// Linear trend forecasting
function calculateLinearTrend(data: number[]): number {
  if (data.length < 2) return data[0] || 0;
  
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y = data;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return Math.max(0, Math.round(slope * (n + 1) + intercept));
}

export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('REPORTS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const periodType = searchParams.get('periodType') || 'MONTHLY';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10000');

    const where: any = {};
    if (itemId) where.itemId = itemId;
    if (periodType) where.periodType = periodType;

    const [forecasts, total] = await Promise.all([
      prisma.demandForecast.findMany({
        where,
        include: {
          item: {
            select: {
              name: true,
              reference: true,
              unit: true
            }
          }
        },
        orderBy: { period: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.demandForecast.count({ where })
    ]);

    return NextResponse.json({
      forecasts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching demand forecasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demand forecasts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, periodType = 'MONTHLY', algorithm = 'MOVING_AVERAGE' } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Get historical data from stock movements and requests
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const historicalData = await prisma.stockMovement.findMany({
      where: {
        itemId,
        type: 'OUT',
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by period
    const periodData: { [key: string]: number } = {};
    
    historicalData.forEach(movement => {
      let periodKey: string;
      const date = movement.createdAt;
      
      switch (periodType) {
        case 'WEEKLY':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'QUARTERLY':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'YEARLY':
          periodKey = date.getFullYear().toString();
          break;
        default: // MONTHLY
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      periodData[periodKey] = (periodData[periodKey] || 0) + movement.quantity;
    });

    const demandHistory = Object.values(periodData);
    
    // Calculate forecast based on algorithm
    let predictedDemand: number;
    let confidence: number;
    
    switch (algorithm) {
      case 'LINEAR_TREND':
        predictedDemand = calculateLinearTrend(demandHistory);
        confidence = demandHistory.length >= 3 ? 0.7 : 0.5;
        break;
      default: // MOVING_AVERAGE
        predictedDemand = Math.round(calculateMovingAverage(demandHistory, 3));
        confidence = demandHistory.length >= 3 ? 0.8 : 0.6;
    }

    // Generate next period
    let nextPeriod: string;
    switch (periodType) {
      case 'WEEKLY':
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        nextWeek.setDate(nextWeek.getDate() - nextWeek.getDay());
        nextPeriod = nextWeek.toISOString().split('T')[0];
        break;
      case 'QUARTERLY':
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        const nextQuarter = currentQuarter === 4 ? 1 : currentQuarter + 1;
        const nextYear = currentQuarter === 4 ? now.getFullYear() + 1 : now.getFullYear();
        nextPeriod = `${nextYear}-Q${nextQuarter}`;
        break;
      case 'YEARLY':
        nextPeriod = (now.getFullYear() + 1).toString();
        break;
      default: // MONTHLY
        const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
        const nextMonthYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
        nextPeriod = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}`;
    }

    // Check if forecast already exists
    const existingForecast = await prisma.demandForecast.findUnique({
      where: {
        itemId_period_periodType: {
          itemId,
          period: nextPeriod,
          periodType
        }
      }
    });

    let forecast;
    if (existingForecast) {
      // Update existing forecast
      forecast = await prisma.demandForecast.update({
        where: { id: existingForecast.id },
        data: {
          predictedDemand,
          confidence,
          algorithm,
          factors: JSON.stringify({
            historicalPeriods: demandHistory.length,
            averageDemand: demandHistory.length > 0 ? demandHistory.reduce((a, b) => a + b, 0) / demandHistory.length : 0,
            trend: demandHistory.length >= 2 ? demandHistory[demandHistory.length - 1] - demandHistory[0] : 0
          })
        },
        include: {
          item: {
            select: {
              name: true,
              reference: true,
              unit: true
            }
          }
        }
      });
    } else {
      // Create new forecast
      forecast = await prisma.demandForecast.create({
        data: {
          itemId,
          period: nextPeriod,
          periodType,
          predictedDemand,
          confidence,
          algorithm,
          factors: JSON.stringify({
            historicalPeriods: demandHistory.length,
            averageDemand: demandHistory.length > 0 ? demandHistory.reduce((a, b) => a + b, 0) / demandHistory.length : 0,
            trend: demandHistory.length >= 2 ? demandHistory[demandHistory.length - 1] - demandHistory[0] : 0
          })
        },
        include: {
          item: {
            select: {
              name: true,
              reference: true,
              unit: true
            }
          }
        }
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_FORECAST',
        entity: 'DemandForecast',
        entityId: forecast.id,
        performedBy: session.user.id,
        details: `Generated ${algorithm} forecast for ${forecast.item.name} - Period: ${nextPeriod}, Predicted: ${predictedDemand}`
      }
    });

    return NextResponse.json(forecast, { status: 201 });
  } catch (error) {
    console.error('Error creating demand forecast:', error);
    return NextResponse.json(
      { error: 'Failed to create demand forecast' },
      { status: 500 }
    );
  }
}