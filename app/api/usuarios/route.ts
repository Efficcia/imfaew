import { NextRequest, NextResponse } from 'next/server';
import { UsuarioModel } from '@/lib/models/usuario';
import { CreateUsuarioInput, UsuarioFilters, PaginationOptions, Usuario } from '@/lib/types/usuario';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: UsuarioFilters = {};
    const pagination: PaginationOptions = {};

    if (searchParams.get('email')) filters.email = searchParams.get('email')!;
    if (searchParams.get('nome')) filters.nome = searchParams.get('nome')!;
    if (searchParams.get('telefone')) filters.telefone = searchParams.get('telefone')!;
    if (searchParams.get('disparo_novo')) filters.disparo_novo = searchParams.get('disparo_novo') === 'true';
    if (searchParams.get('primeiro_deposito')) filters.primeiro_deposito = searchParams.get('primeiro_deposito') === 'true';
    
    if (searchParams.get('nascimento_inicio')) {
      filters.nascimento_inicio = new Date(searchParams.get('nascimento_inicio')!);
    }
    if (searchParams.get('nascimento_fim')) {
      filters.nascimento_fim = new Date(searchParams.get('nascimento_fim')!);
    }
    if (searchParams.get('created_at_inicio')) {
      filters.created_at_inicio = new Date(searchParams.get('created_at_inicio')!);
    }
    if (searchParams.get('created_at_fim')) {
      filters.created_at_fim = new Date(searchParams.get('created_at_fim')!);
    }

    if (searchParams.get('page')) pagination.page = parseInt(searchParams.get('page')!);
    if (searchParams.get('limit')) pagination.limit = parseInt(searchParams.get('limit')!);
    if (searchParams.get('orderBy')) pagination.orderBy = searchParams.get('orderBy') as keyof Usuario;
    if (searchParams.get('orderDirection')) pagination.orderDirection = searchParams.get('orderDirection') as 'ASC' | 'DESC';

    const result = await UsuarioModel.findAll(filters, pagination);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CreateUsuarioInput = await request.json();
    
    if (!data.email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const existingUser = await UsuarioModel.findByEmail(data.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário com este email já existe' },
        { status: 409 }
      );
    }

    const usuario = await UsuarioModel.create(data);
    
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}