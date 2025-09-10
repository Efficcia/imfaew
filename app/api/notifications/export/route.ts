import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const search = searchParams.get('search');

  try {
    const db = getDb();
    
    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (type) {
      whereConditions.push(`notification_type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (from) {
      whereConditions.push(`sent_at >= $${paramIndex}`);
      params.push(from);
      paramIndex++;
    }

    if (to) {
      whereConditions.push(`sent_at <= $${paramIndex}`);
      params.push(to);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await db.query(`
      SELECT 
        name,
        email,
        phone,
        notification_type,
        provider,
        provider_status,
        sent_at
      FROM view_notifications
      ${whereClause}
      ORDER BY sent_at DESC
    `, params);

    const csvHeaders = [
      'Nome',
      'Email',
      'Telefone',
      'Tipo de Notificação',
      'Provedor',
      'Status',
      'Data de Envio'
    ].join(',');

    const csvRows = result.rows.map(row => [
      `"${row.name || ''}"`,
      `"${row.email || ''}"`,
      `"${row.phone || ''}"`,
      `"${row.notification_type || ''}"`,
      `"${row.provider || ''}"`,
      `"${row.provider_status || ''}"`,
      `"${format(new Date(row.sent_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}"`
    ].join(','));

    const csv = [csvHeaders, ...csvRows].join('\n');

    const response = new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="notifications-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

    return response;
  } catch (error) {
    console.error('Error exporting notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}