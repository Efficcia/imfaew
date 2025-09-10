interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function KPICard({ title, value, subtitle, trend }: KPICardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-sm font-medium text-gray-500 truncate">
              {title}
            </div>
          </div>
        </div>
        <div className="mt-1 text-3xl font-semibold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>
        {subtitle && (
          <div className="mt-1 text-sm text-gray-600">
            {subtitle}
          </div>
        )}
        {trend && (
          <div className="mt-2 flex items-center text-sm">
            <span className={`${trend.isPositive ? 'text-green-600' : 'text-red-600'} font-medium`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="ml-1 text-gray-500">vs. mês anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}