import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserSurgeries, getActiveSurgeries } from '../services/firestore';
import { 
  Plus, 
  FileText, 
  Clock, 
  BarChart3,
  Activity,
  Users,
  LogOut,
  Calendar,
  TrendingUp
} from 'lucide-react';



const Dashboard = () => {
  const { userProfile } = useAuth();
  
  const [recentSurgeries, setRecentSurgeries] = useState([]);
  const [activeSurgeries, setActiveSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    activeNow: 0,
    averageTime: '0min',
    uniquePatients: 0
  });


  // ===== ADICIONAR NO Dashboard.js =====

// Função para exibir procedimentos (adicionar antes do return do componente)
const getProcedureDisplay = (surgery) => {
    // Para cirurgia SUS
    if (surgery.proposedSurgery) {
      return surgery.proposedSurgery;
    }
    
    // Para cirurgia Convênio
    if (surgery.cbhpmProcedures && surgery.cbhpmProcedures.length > 0) {
      // Filtrar apenas procedimentos válidos (que têm procedimento preenchido)
      const validProcedures = surgery.cbhpmProcedures.filter(p => p.procedimento && p.procedimento.trim() !== '');
      
      if (validProcedures.length === 0) {
        return 'Procedimento não informado';
      }
      
      if (validProcedures.length === 1) {
        // Apenas um procedimento
        return validProcedures[0].procedimento;
      } else {
        // Múltiplos procedimentos: mostrar primeiro + contador
        const remaining = validProcedures.length - 1;
        return `${validProcedures[0].procedimento} (+${remaining} ${remaining === 1 ? 'outro' : 'outros'})`;
      }
    }
    
    return 'Procedimento não informado';
  };

  // Carregar dados reais do Firebase
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!userProfile?.uid) return;
      
      try {
        setLoading(true);
        console.log('🔍 Carregando dashboard para usuário:', userProfile.uid);
        
        // Carregar cirurgias recentes e ativas em paralelo
        const [recent, active] = await Promise.all([
          getUserSurgeries(userProfile.uid, 10),
          getActiveSurgeries(userProfile.uid)
        ]);
        
        console.log('📋 Cirurgias recentes encontradas:', recent);
        console.log('🔄 Cirurgias ativas encontradas:', active);
        
        setRecentSurgeries(recent);
        setActiveSurgeries(active);
        
        // Calcular estatísticas
        calculateStats(recent, active);
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userProfile]);

  // Calcular estatísticas baseadas nos dados reais
  const calculateStats = (recent, active) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Cirurgias deste mês
    const thisMonth = recent.filter(surgery => {
      const createdAt = surgery.createdAt?.seconds 
        ? new Date(surgery.createdAt.seconds * 1000)
        : new Date(surgery.createdAt);
      return createdAt >= startOfMonth;
    });
    
    // Pacientes únicos (aproximação pelo nome)
    const uniquePatients = new Set(
      recent.map(s => s.patientName).filter(Boolean)
    ).size;
    
    // Tempo médio (cirurgias finalizadas)
    const finishedSurgeries = recent.filter(s => s.status === 'completado');
    let averageMinutes = 0;
    
    if (finishedSurgeries.length > 0) {
      const totalMinutes = finishedSurgeries.reduce((sum, surgery) => {
        if (surgery.createdAt && surgery.finishedAt) {
          const start = surgery.createdAt.seconds 
            ? new Date(surgery.createdAt.seconds * 1000)
            : new Date(surgery.createdAt);
          const end = surgery.finishedAt.seconds
            ? new Date(surgery.finishedAt.seconds * 1000) 
            : new Date(surgery.finishedAt);
          return sum + Math.floor((end - start) / 1000 / 60);
        }
        return sum;
      }, 0);
      
      averageMinutes = Math.floor(totalMinutes / finishedSurgeries.length);
    }
    
    setStats({
      totalThisMonth: thisMonth.length,
      activeNow: active.length,
      averageTime: averageMinutes > 0 ? `${averageMinutes}min` : 'N/A',
      uniquePatients: uniquePatients
    });
  };

  // Formatar horário de criação
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calcular duração ou tempo decorrido
  const getDuration = (surgery) => {
    if (!surgery.createdAt) return 'N/A';
    
    const start = surgery.createdAt.seconds 
      ? new Date(surgery.createdAt.seconds * 1000)
      : new Date(surgery.createdAt);
    
    // AJUSTAR: usar completedAt em vez de finishedAt para consistência
    const end = surgery.completedAt 
      ? (surgery.completedAt.seconds 
          ? new Date(surgery.completedAt.seconds * 1000)
          : new Date(surgery.completedAt))
      : new Date();
    
    const diffMinutes = Math.floor((end - start) / 1000 / 60);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const quickActions = [
    {
      name: 'Iniciar Nova Cirurgia',
      description: 'Começar nova cirurgia em tempo real',
      href: '/new-surgery',
      icon: Plus,
      color: 'bg-primary-600 hover:bg-primary-700'
    },
    {
      name: 'Cirurgias em Andamento',
      description: 'Ver cirurgias ativas no momento',
      href: '/active-surgeries',
      icon: Activity,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      name: 'Ver Estatísticas',
      description: 'Relatórios e análises pessoais',
      href: '/statistics',
      icon: BarChart3,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
  ];

  const getStatusBadge = (status) => {
    if (status === 'completado') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Finalizada</span>;
    }
    if (status === 'em_andamento') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Em andamento</span>;
    }
    if (status === 'aguardando_finalizacao') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Aguardando</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Desconhecido</span>;
  };

  const getTypeBadge = (type) => {
    if (type === 'sus') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">SUS</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Convênio</span>;
  };

  // Estatísticas dinâmicas
  const statsData = [
    {
      name: 'Cirurgias este mês',
      value: stats.totalThisMonth.toString(),
      change: '',
      changeType: 'neutral',
      icon: FileText,
    },
    {
      name: 'Em andamento',
      value: stats.activeNow.toString(),
      change: '',
      changeType: 'neutral',
      icon: Clock,
    },
    {
      name: 'Tempo médio',
      value: stats.averageTime,
      change: '',
      changeType: 'neutral',
      icon: Activity,
    },
    {
      name: 'Pacientes únicos',
      value: stats.uniquePatients.toString(),
      change: '',
      changeType: 'neutral',
      icon: Users,
    },
  ];

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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat) => {
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
      )}

      {/* Recent Surgeries */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Cirurgias Recentes ({recentSurgeries.length})
          </h2>
          <Link
            to="/surgeries"
            className="text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            Ver todas
          </Link>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentSurgeries.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procedimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Início
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSurgeries.map((surgery) => (
                  <tr 
                    key={surgery.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.location.href = `/surgery/${surgery.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary-600 font-medium">
                      {surgery.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {surgery.patientName || 'Nome não informado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {surgery.proposedSurgery ||  getProcedureDisplay(surgery) || 'Procedimento não informado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(surgery.createdAt)}
                      <div className="text-xs text-gray-400">
                        {new Date(surgery.createdAt?.seconds ? surgery.createdAt.seconds * 1000 : surgery.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(surgery.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDuration(surgery)}
                      {surgery.type && (
                        <div className="mt-1">
                          {getTypeBadge(surgery.type)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma cirurgia encontrada</p>
            <Link 
              to="/new-surgery"
              className="mt-2 text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Criar primeira cirurgia
            </Link>
          </div>
        )}
      </div>

      <div className="card">
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userProfile?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userProfile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                CRM: {userProfile?.crm}
              </p>
            </div>
          </div>
          <button
            onClick={() => {/* logout function */}}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;