import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('INVENTORY', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10000');
    const status = searchParams.get('status');
    const itemId = searchParams.get('itemId');
    const reason = searchParams.get('reason');

    const where: any = {};
    if (status) where.status = status;
    if (itemId) where.itemId = itemId;
    if (reason) where.reason = reason;

    const [returns, total] = await Promise.all([
      db.return.findMany({
        where,
        include: {
          item: {
            select: {
              name: true,
              reference: true,
              unit: true
            }
          },
          requester: {
            select: {
              name: true,
              email: true
            }
          },
          processor: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.return.count({ where })
    ]);

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('INVENTORY', 'create')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = accessCheck

    const body = await request.json();
    const { itemId, quantity, reason, condition, description } = body;

    if (!itemId || !quantity || !reason || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate return number
    const returnCount = await db.return.count();
    const returnNumber = `RET-${String(returnCount + 1).padStart(6, '0')}`;

    const newReturn = await db.return.create({
      data: {
        returnNumber,
        itemId,
        quantity: parseInt(quantity),
        reason,
        condition,
        description,
        requesterId: user.id
      },
      include: {
        item: {
          select: {
            name: true,
            reference: true,
            unit: true
          }
        },
        requester: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'CREATE_RETURN',
        entity: 'Return',
        entityId: newReturn.id,
        performedBy: session.user.id,
        details: `Created return ${returnNumber} for item ${newReturn.item.name}`
      }
    });

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create return' },
      { status: 500 }
    );
  }
}