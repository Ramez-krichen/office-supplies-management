import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const returnRecord = await prisma.return.findUnique({
      where: { id: params.id },
      include: {
        item: {
          select: {
            name: true,
            reference: true,
            unit: true,
            price: true
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
      }
    });

    if (!returnRecord) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    return NextResponse.json(returnRecord);
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, refundAmount, description } = body;

    const existingReturn = await prisma.return.findUnique({
      where: { id: params.id },
      include: {
        item: true
      }
    });

    if (!existingReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    const updateData: any = {
      status,
      processedBy: session.user.id,
      processedDate: new Date()
    };

    if (refundAmount !== undefined) {
      updateData.refundAmount = parseFloat(refundAmount);
    }

    if (description) {
      updateData.description = description;
    }

    // If approved and processed, update stock
    if (status === 'PROCESSED') {
      await prisma.item.update({
        where: { id: existingReturn.itemId },
        data: {
          currentStock: {
            increment: existingReturn.quantity
          }
        }
      });

      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          itemId: existingReturn.itemId,
          type: 'RETURN',
          quantity: existingReturn.quantity,
          reason: `Return processed: ${existingReturn.returnNumber}`,
          reference: existingReturn.returnNumber,
          userId: session.user.id
        }
      });
    }

    const updatedReturn = await prisma.return.update({
      where: { id: params.id },
      data: updateData,
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
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_RETURN',
        entity: 'Return',
        entityId: params.id,
        performedBy: session.user.id,
        details: `Updated return ${existingReturn.returnNumber} status to ${status}`
      }
    });

    return NextResponse.json(updatedReturn);
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Failed to update return' },
      { status: 500 }
    );
  }
}