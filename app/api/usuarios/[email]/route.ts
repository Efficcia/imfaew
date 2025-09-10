import { NextRequest, NextResponse } from 'next/server';
import { UsuarioModel } from '@/lib/models/usuario';
import { UpdateUsuarioInput } from '@/lib/types/usuario';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const resolvedParams = await params;
    const email = decodeURIComponent(resolvedParams.email);
    const usuario = await UsuarioModel.findByEmail(email);
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const resolvedParams = await params;
    const email = decodeURIComponent(resolvedParams.email);
    const data: UpdateUsuarioInput = await request.json();
    
    const usuario = await UsuarioModel.update(email, data);
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const resolvedParams = await params;
    const email = decodeURIComponent(resolvedParams.email);
    const deleted = await UsuarioModel.delete(email);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}