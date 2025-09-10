export interface Usuario {
  email: string;
  telefone?: string;
  nascimento?: Date;
  primeiro_deposito?: boolean;
  disparo_novo?: boolean;
  created_at?: Date;
  ulitmo_deposito?: Date;
  nome?: string;
  gerou_pix?: Date;
  valor_total?: string;
  last_sent_24h?: Date;
  last_sent_30d?: Date;
  last_sent_45d?: Date;
  last_birthday_sent?: number;
}

export interface CreateUsuarioInput {
  email: string;
  telefone?: string;
  nascimento?: Date;
  primeiro_deposito?: boolean;
  disparo_novo?: boolean;
  nome?: string;
  valor_total?: string;
}

export interface UpdateUsuarioInput {
  telefone?: string;
  nascimento?: Date;
  primeiro_deposito?: boolean;
  disparo_novo?: boolean;
  ulitmo_deposito?: Date;
  nome?: string;
  gerou_pix?: Date;
  valor_total?: string;
  last_sent_24h?: Date;
  last_sent_30d?: Date;
  last_sent_45d?: Date;
  last_birthday_sent?: number;
}

export interface UsuarioFilters {
  email?: string;
  nome?: string;
  telefone?: string;
  disparo_novo?: boolean;
  primeiro_deposito?: boolean;
  nascimento_inicio?: Date;
  nascimento_fim?: Date;
  created_at_inicio?: Date;
  created_at_fim?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: keyof Usuario;
  orderDirection?: 'ASC' | 'DESC';
}