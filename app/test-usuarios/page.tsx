'use client';

import { useState, useEffect } from 'react';
import { Usuario } from '@/lib/types/usuario';

export default function TestUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usuarios?limit=10');
      const data = await response.json();
      setUsuarios(data.usuarios);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/usuarios/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const testCampaign = async (type: string) => {
    try {
      const response = await fetch(`/api/usuarios/campanhas?type=${type}`);
      const data = await response.json();
      console.log(`Campanha ${type}:`, data);
      alert(`Campanha ${type}: ${data.count} usuários encontrados. Veja o console para detalhes.`);
    } catch (error) {
      console.error(`Erro na campanha ${type}:`, error);
    }
  };

  const markAction = async (action: string) => {
    if (!selectedEmail) {
      alert('Selecione um email primeiro');
      return;
    }

    try {
      const response = await fetch(`/api/usuarios/${encodeURIComponent(selectedEmail)}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      alert(data.message);
      loadUsuarios(); // Recarregar lista
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  };

  useEffect(() => {
    loadUsuarios();
    loadStats();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Teste - Sistema de Usuários</h1>
      
      {/* Estatísticas */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Estatísticas</h2>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.novos}</div>
              <div className="text-sm text-gray-600">Novos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.comPrimeiroDeposito}</div>
              <div className="text-sm text-gray-600">Com Depósito</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.comTelefone}</div>
              <div className="text-sm text-gray-600">Com Telefone</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.gerouPix}</div>
              <div className="text-sm text-gray-600">Gerou PIX</div>
            </div>
          </div>
        ) : (
          <div>Carregando estatísticas...</div>
        )}
      </div>

      {/* Testes de Campanha */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Testes de Campanha</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => testCampaign('24h')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Campanha 24h
          </button>
          <button 
            onClick={() => testCampaign('30d')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Campanha 30d
          </button>
          <button 
            onClick={() => testCampaign('45d')}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Campanha 45d
          </button>
          <button 
            onClick={() => testCampaign('birthday')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Aniversários
          </button>
        </div>
      </div>

      {/* Ações em Usuários */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Ações em Usuários</h2>
        <div className="mb-4">
          <select 
            value={selectedEmail} 
            onChange={(e) => setSelectedEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Selecione um usuário</option>
            {usuarios.map(user => (
              <option key={user.email} value={user.email}>
                {user.nome || user.email} - {user.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => markAction('mark_sent_24h')}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Marcar Envio 24h
          </button>
          <button 
            onClick={() => markAction('mark_sent_30d')}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Marcar Envio 30d
          </button>
          <button 
            onClick={() => markAction('mark_sent_45d')}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            Marcar Envio 45d
          </button>
          <button 
            onClick={() => markAction('mark_birthday_sent')}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
          >
            Marcar Aniversário
          </button>
          <button 
            onClick={() => markAction('mark_pix_generated')}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Marcar PIX Gerado
          </button>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Usuários</h2>
          <button 
            onClick={loadUsuarios}
            disabled={loading}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Recarregar'}
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Telefone</th>
                  <th className="px-4 py-2 text-left">Nascimento</th>
                  <th className="px-4 py-2 text-left">Novo</th>
                  <th className="px-4 py-2 text-left">Último Disparo</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(user => (
                  <tr key={user.email} className="border-t">
                    <td className="px-4 py-2">{user.nome || '-'}</td>
                    <td className="px-4 py-2 text-sm">{user.email}</td>
                    <td className="px-4 py-2">{user.telefone || '-'}</td>
                    <td className="px-4 py-2">
                      {user.nascimento ? new Date(user.nascimento).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-2">
                      {user.disparo_novo ? '✅' : '❌'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {user.last_sent_24h ? new Date(user.last_sent_24h).toLocaleString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}