import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  FileText, 
  Clock, 
  BarChart3,
  Activity,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { userProfile } = useAuth();

  // Dados mockados para demonstração
  const stats = [
    {
      name: 'Fichas este mês',
      value: '23',
      change: '+12%',
      changeType: 'increase',
      icon: FileText,
    },
    {
      name: 'Rascunhos',
      value: '3',
      change: '',
      changeType: 'neutral',
      icon: Clock,
    },
    {
      name: 'Tempo médio',
      value: '45min',
      change: '-5min',
      changeType: 'decrease',
      icon: Activity,
    },
    {
      name: 'Pacientes',
      value: '18',
      change: '+8%',
      changeType: 'increase',
      icon: Users,
    },
  ];

  const recentForms = [
    {
      id: 1,
      patient: 'Maria Silva',
      procedure: 'Laparoscopia',
      date: '2025-07-04',
      status: 'completed',
      type: 'sus'
    },
    {
      id: 2,
      patient: 'João Santos',
      procedure: 'Herniorrafia',
      date: '2025-07-03',
      status: 'draft',
      type: 'convenio'
    },
    {
      id: 3,
      patient: 'Ana Costa',
      procedure: 'Colecistectomia',
      date: '2025-07-03',
      status: 'completed',
      type: 'convenio'
    },
  ];

  const quickActions = [
    {
      name: 'Nova Ficha SUS',
      description: 'Iniciar ficha para paciente SUS',
      href: '/new-form?type=sus',
      icon: Plus,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Nova Ficha Convênio',
      description: 'Iniciar ficha para convênio/particular',
      href: '/new-form?type=convenio',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Ver Estatísticas',
      description: 'Relatórios e análises',
      href: '/statistics',
      icon: BarChart3,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
  ];

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Concluída</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Rascunho</span>;
  };

  const getTypeBadge = (type) => {
    if (type === 'sus') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">SUS</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Convênio</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, Dr. {userProfile?.name?.split(' ')[0] || 'Usuário'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              to={action.href}
              className={`${action.color} text-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 block`}
            >
              <div className="flex items-center">
                <Icon className="h-8 w-8" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium">{action.name}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    {stat.change && (
                      <p className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'increase' ? 'text-green-600' : 
                        stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Forms */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Fichas Recentes</h2>
          <Link
            to="/forms"
            className="text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            Ver todas
          </Link>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Procedimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentForms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {form.patient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form.procedure}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(form.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(form.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(form.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;