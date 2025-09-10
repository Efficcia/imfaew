import { requireAuth } from '@/lib/auth';
import { getDashboardKPIs, getNotificationsChartData } from '@/lib/queries';
import Header from '@/components/Header';
import KPICard from '@/components/Dashboard/KPICard';
import NotificationsChart from '@/components/Dashboard/NotificationsChart';

export default async function DashboardPage() {
  await requireAuth();
  
  const [kpis, chartData] = await Promise.all([
    getDashboardKPIs(),
    getNotificationsChartData()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Visão geral dos seus disparos e usuários</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total de Usuários</p>
                  <p className="text-3xl font-bold text-gray-900">{kpis.totalUsers.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-700 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
              </div>
            </div>
            

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Notificações Hoje</p>
                  <p className="text-3xl font-bold text-gray-900">{kpis.notificationsToday}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12V9a4 4 0 118 0m-4 8a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          <div className="mb-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gray-100 rounded-lg mr-4">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12V9a4 4 0 118 0m-4 8a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Comunicação</h3>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">WhatsApp Hoje</span>
                    <span className="text-2xl font-bold text-gray-800">{kpis.whatsappMessagesToday}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{kpis.notificationsToday}</div>
                    <div className="text-sm text-gray-600">Total Hoje</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <NotificationsChart data={chartData} />
          </div>
        </div>
      </main>
    </div>
  );
}