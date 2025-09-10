import { NextRequest, NextResponse } from 'next/server';
import { UsuarioModel } from '@/lib/models/usuario';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campaignType = searchParams.get('type') as '24h' | '30d' | '45d' | 'birthday';
    
    if (!campaignType || !['24h', '30d', '45d', 'birthday'].includes(campaignType)) {
      return NextResponse.json(
        { error: 'Tipo de campanha inválido. Use: 24h, 30d, 45d ou birthday' },
        { status: 400 }
      );
    }

    const usuarios = await UsuarioModel.getUsuariosForCampaign(campaignType);
    
    return NextResponse.json({
      type: campaignType,
      count: usuarios.length,
      usuarios
    });
  } catch (error) {
    console.error('Erro ao buscar usuários para campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}