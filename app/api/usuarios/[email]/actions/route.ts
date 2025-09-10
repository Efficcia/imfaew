import { NextRequest, NextResponse } from 'next/server';
import { UsuarioModel } from '@/lib/models/usuario';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const resolvedParams = await params;
    const email = decodeURIComponent(resolvedParams.email);
    const { action, data } = await request.json();
    
    switch (action) {
      case 'mark_sent_24h':
        await UsuarioModel.updateLastSent24h(email);
        break;
        
      case 'mark_sent_30d':
        await UsuarioModel.updateLastSent30d(email);
        break;
        
      case 'mark_sent_45d':
        await UsuarioModel.updateLastSent45d(email);
        break;
        
      case 'mark_birthday_sent':
        const year = data?.year || new Date().getFullYear();
        await UsuarioModel.updateLastBirthdaySent(email, year);
        break;
        
      case 'mark_pix_generated':
        await UsuarioModel.markPixGenerated(email);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ 
      message: `Ação '${action}' executada com sucesso para ${email}` 
    });
  } catch (error) {
    console.error('Erro ao executar ação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}