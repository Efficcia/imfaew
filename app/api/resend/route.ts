import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { notification_id, user_id } = await request.json();

    if (!notification_id || !user_id) {
      return NextResponse.json({ error: 'Missing notification_id or user_id' }, { status: 400 });
    }

    const db = getDb();

    const [notificationResult, userResult] = await Promise.all([
      db.query('SELECT * FROM notifications_sent WHERE id = $1', [notification_id]),
      db.query('SELECT * FROM users WHERE id = $1', [user_id])
    ]);

    if (notificationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notification = notificationResult.rows[0];
    const user = userResult.rows[0];

    let resendResult = { success: false, stored: false };

    if (process.env.RESEND_WEBHOOK_URL) {
      try {
        const webhookPayload = {
          notification_id: notification_id,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email
          },
          notification_type: notification.notification_type,
          context: notification.context
        };

        const webhookResponse = await fetch(process.env.RESEND_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        });

        if (webhookResponse.ok) {
          resendResult.success = true;
        } else {
          console.error('Webhook failed:', webhookResponse.status, await webhookResponse.text());
        }
      } catch (error) {
        console.error('Error calling webhook:', error);
      }
    } else {
      resendResult = { success: true, stored: true };
    }

    await db.query(
      'INSERT INTO resend_requests (notification_id, user_id, requested_at, context) VALUES ($1, $2, NOW(), $3)',
      [notification_id, user_id, JSON.stringify({
        webhook_url: process.env.RESEND_WEBHOOK_URL || null,
        success: resendResult.success,
        stored: resendResult.stored
      })]
    );

    return NextResponse.json(resendResult);
  } catch (error) {
    console.error('Error processing resend:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}