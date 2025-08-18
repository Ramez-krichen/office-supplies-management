import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAndNotifyMultipleManagers } from '@/lib/manager-assignment'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkAndNotifyMultipleManagers()

    return NextResponse.json({
      success: result.success,
      notificationsCreated: result.notificationsCreated,
      departmentsChecked: result.departmentsChecked,
      message: result.message
    })
  } catch (error) {
    console.error('Error checking manager notifications:', error)
    return NextResponse.json(
      { error: 'Failed to check manager notifications' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkAndNotifyMultipleManagers()

    return NextResponse.json({
      success: result.success,
      notificationsCreated: result.notificationsCreated,
      departmentsChecked: result.departmentsChecked,
      message: result.message
    })
  } catch (error) {
    console.error('Error checking manager notifications:', error)
    return NextResponse.json(
      { error: 'Failed to check manager notifications' },
      { status: 500 }
    )
  }
}
