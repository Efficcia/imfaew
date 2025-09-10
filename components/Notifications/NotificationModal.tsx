'use client';

import { useState, useEffect } from 'react';
import { NotificationRow, NotificationDetail } from '@/lib/queries';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationModalProps {
  notification: NotificationRow;
  onClose: () => void;
}

export default function NotificationModal({ notification, onClose }: NotificationModalProps) {
  const [detail, setDetail] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      try {
        const response = await fetch(`/api/notifications/${notification.notification_id}`);
        const data = await response.json();
        setDetail(data);
      } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [notification.notification_id]);


  const getTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'welcome': 'Boas-vindas',
      'deposit_reminder': 'Lembrete de Depósito', 
      'promotion': 'Promoção',
      'birthday': 'Aniversário',
      'reactivation': 'Reativação'
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gray-800 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.403"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Detalhes da Mensagem WhatsApp
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Informações completas da notificação
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 max-h-[calc(90vh-200px)] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Carregando detalhes...</p>
              </div>
            ) : detail ? (
              <div className="space-y-8">
                {/* User Info Card */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
                      {detail.name ? detail.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{detail.name || 'Nome não informado'}</h4>
                      <p className="text-gray-600">ID: {detail.user_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center p-4 bg-white rounded-xl shadow-sm">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <div className="text-sm text-gray-600">WhatsApp</div>
                        <div className="font-medium text-gray-900">{detail.phone || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-white rounded-xl shadow-sm">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="text-sm text-gray-600">Tipo</div>
                        <div className="font-medium text-gray-900">{getTypeLabel(detail.notification_type)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status da Entrega
                    </h4>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-600">Status</span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          detail.provider_status === 'delivered' ? 'bg-green-100 text-green-800' :
                          detail.provider_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {detail.provider_status || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-600">Provedor</span>
                        <span className="font-medium text-gray-900">{detail.provider || 'N/A'}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-600">Enviado em</span>
                        <span className="font-medium text-gray-900">
                          {detail.sent_at && !isNaN(new Date(detail.sent_at).getTime()) 
                            ? format(new Date(detail.sent_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            : 'Data inválida'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m13 0H9" />
                      </svg>
                      Contexto da Mensagem
                    </h4>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                        {JSON.stringify(detail.context, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Recent Events */}
                {detail.recent_events && detail.recent_events.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Últimos 5 Eventos do Usuário
                    </h4>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {detail.recent_events.map((event, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-gray-900">{event.event_type}</span>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                              {event.event_at && !isNaN(new Date(event.event_at).getTime())
                                ? format(new Date(event.event_at), 'dd/MM HH:mm', { locale: ptBR })
                                : 'Data inválida'
                              }
                            </span>
                          </div>
                          <pre className="text-xs text-gray-600 overflow-auto bg-white p-2 rounded">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar</h3>
                <p className="text-red-500">Erro ao carregar detalhes da notificação</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}