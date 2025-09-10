import { getDb } from '../db';
import { Usuario, CreateUsuarioInput, UpdateUsuarioInput, UsuarioFilters, PaginationOptions } from '../types/usuario';

export class UsuarioModel {
  static async findAll(
    filters: UsuarioFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ usuarios: Usuario[]; total: number; page: number; totalPages: number }> {
    const db = getDb();
    const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.email) {
      whereClause += ` AND email ILIKE $${paramIndex}`;
      params.push(`%${filters.email}%`);
      paramIndex++;
    }

    if (filters.nome) {
      whereClause += ` AND nome ILIKE $${paramIndex}`;
      params.push(`%${filters.nome}%`);
      paramIndex++;
    }

    if (filters.telefone) {
      whereClause += ` AND telefone ILIKE $${paramIndex}`;
      params.push(`%${filters.telefone}%`);
      paramIndex++;
    }

    if (filters.disparo_novo !== undefined) {
      whereClause += ` AND disparo_novo = $${paramIndex}`;
      params.push(filters.disparo_novo);
      paramIndex++;
    }

    if (filters.primeiro_deposito !== undefined) {
      whereClause += ` AND primeiro_deposito = $${paramIndex}`;
      params.push(filters.primeiro_deposito);
      paramIndex++;
    }

    if (filters.nascimento_inicio) {
      whereClause += ` AND nascimento >= $${paramIndex}`;
      params.push(filters.nascimento_inicio);
      paramIndex++;
    }

    if (filters.nascimento_fim) {
      whereClause += ` AND nascimento <= $${paramIndex}`;
      params.push(filters.nascimento_fim);
      paramIndex++;
    }

    if (filters.created_at_inicio) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(filters.created_at_inicio);
      paramIndex++;
    }

    if (filters.created_at_fim) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(filters.created_at_fim);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM usuarios ${whereClause}`;
    const dataQuery = `
      SELECT * FROM usuarios 
      ${whereClause} 
      ORDER BY ${orderBy} ${orderDirection} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params.slice(0, -2)),
      db.query(dataQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      usuarios: dataResult.rows,
      total,
      page,
      totalPages
    };
  }

  static async findByEmail(email: string): Promise<Usuario | null> {
    const db = getDb();
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async create(data: CreateUsuarioInput): Promise<Usuario> {
    const db = getDb();
    const now = new Date();
    
    const query = `
      INSERT INTO usuarios (
        email, telefone, nascimento, primeiro_deposito, disparo_novo, 
        nome, valor_total, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      data.email,
      data.telefone || null,
      data.nascimento || null,
      data.primeiro_deposito || null,
      data.disparo_novo || null,
      data.nome || null,
      data.valor_total || '0',
      now
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async update(email: string, data: UpdateUsuarioInput): Promise<Usuario | null> {
    const db = getDb();
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    values.push(email);
    const query = `
      UPDATE usuarios 
      SET ${updateFields.join(', ')} 
      WHERE email = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(email: string): Promise<boolean> {
    const db = getDb();
    const result = await db.query('DELETE FROM usuarios WHERE email = $1', [email]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async updateLastSent24h(email: string): Promise<void> {
    const db = getDb();
    await db.query(
      'UPDATE usuarios SET last_sent_24h = NOW() WHERE email = $1',
      [email]
    );
  }

  static async updateLastSent30d(email: string): Promise<void> {
    const db = getDb();
    await db.query(
      'UPDATE usuarios SET last_sent_30d = NOW() WHERE email = $1',
      [email]
    );
  }

  static async updateLastSent45d(email: string): Promise<void> {
    const db = getDb();
    await db.query(
      'UPDATE usuarios SET last_sent_45d = NOW() WHERE email = $1',
      [email]
    );
  }

  static async updateLastBirthdaySent(email: string, year: number): Promise<void> {
    const db = getDb();
    await db.query(
      'UPDATE usuarios SET last_birthday_sent = $1 WHERE email = $2',
      [year, email]
    );
  }

  static async markPixGenerated(email: string): Promise<void> {
    const db = getDb();
    await db.query(
      'UPDATE usuarios SET gerou_pix = NOW() WHERE email = $1',
      [email]
    );
  }

  static async getUsuariosForCampaign(campaignType: '24h' | '30d' | '45d' | 'birthday'): Promise<Usuario[]> {
    const db = getDb();
    let query = '';

    switch (campaignType) {
      case '24h':
        query = `
          SELECT * FROM usuarios 
          WHERE disparo_novo = true 
          AND (last_sent_24h IS NULL OR last_sent_24h < NOW() - INTERVAL '24 hours')
          ORDER BY created_at DESC
        `;
        break;
      
      case '30d':
        query = `
          SELECT * FROM usuarios 
          WHERE ulitmo_deposito IS NOT NULL 
          AND ulitmo_deposito < NOW() - INTERVAL '30 days'
          AND (last_sent_30d IS NULL OR last_sent_30d < NOW() - INTERVAL '30 days')
          ORDER BY ulitmo_deposito DESC
        `;
        break;
      
      case '45d':
        query = `
          SELECT * FROM usuarios 
          WHERE ulitmo_deposito IS NOT NULL 
          AND ulitmo_deposito < NOW() - INTERVAL '45 days'
          AND (last_sent_45d IS NULL OR last_sent_45d < NOW() - INTERVAL '45 days')
          ORDER BY ulitmo_deposito DESC
        `;
        break;
      
      case 'birthday':
        const currentYear = new Date().getFullYear();
        query = `
          SELECT * FROM usuarios 
          WHERE nascimento IS NOT NULL 
          AND EXTRACT(MONTH FROM nascimento) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(DAY FROM nascimento) = EXTRACT(DAY FROM NOW())
          AND (last_birthday_sent IS NULL OR last_birthday_sent < $1)
          ORDER BY nascimento
        `;
        
        const result = await db.query(query, [currentYear]);
        return result.rows;
    }

    const result = await db.query(query);
    return result.rows;
  }

  static async getStats(): Promise<{
    total: number;
    novos: number;
    comPrimeiroDeposito: number;
    comTelefone: number;
    gerouPix: number;
  }> {
    const db = getDb();
    
    const queries = [
      'SELECT COUNT(*) as total FROM usuarios',
      'SELECT COUNT(*) as novos FROM usuarios WHERE disparo_novo = true',
      'SELECT COUNT(*) as primeiro_deposito FROM usuarios WHERE primeiro_deposito = true',
      'SELECT COUNT(*) as com_telefone FROM usuarios WHERE telefone IS NOT NULL AND telefone != \'\'',
      'SELECT COUNT(*) as gerou_pix FROM usuarios WHERE gerou_pix IS NOT NULL'
    ];

    const results = await Promise.all(queries.map(query => db.query(query)));

    return {
      total: parseInt(results[0].rows[0].total),
      novos: parseInt(results[1].rows[0].novos),
      comPrimeiroDeposito: parseInt(results[2].rows[0].primeiro_deposito),
      comTelefone: parseInt(results[3].rows[0].com_telefone),
      gerouPix: parseInt(results[4].rows[0].gerou_pix)
    };
  }
}