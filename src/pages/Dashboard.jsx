import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserSurgeries, getActiveSurgeries, } from '../services/surgeryService';
import { getUserAnesthesias, getActiveAnesthesias,  } from '../services/anesthesiaService';
import { getDashboardStats, formatDashboardStats } from '../services/dashboardService';

import { 
  FileText, 
  Clock, 
  Users,
  LogOut,
  Stethoscope,
  DollarSign
} from 'lucide-react';

// Constantes fora do componente para não recriar a cada render
const GRADIENTS = {
  ficha: "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900",
  preAnest: "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900",
  srpa: "bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900",
  stats: "bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900",
  andamento: "bg-gradient-to-r from-violet-700 to-violet-900 hover:from-violet-800 hover:to-violet-950"
};

const DASHBOARD_LIST_LIMIT = 10;

const QUICK_ACTIONS = [
  { name: 'Nova Ficha Anestésica', description: 'Cadastrar ficha anestésica', href: '/newanesthesia', icon: FileText, gradientKey: 'ficha' },
  { name: 'Nova Avaliação Pré-Anestésica', description: 'Cadastro pré-anestésico', href: '/preanesthesia/new', icon: FileText, gradientKey: 'preAnest' },
  { name: 'Nova Ficha SRPA', description: 'Cadastrar ficha SRPA', href: '/srpa/new', icon: FileText, gradientKey: 'srpa' },
  { name: 'Ver Pacientes', description: 'Ver lista de pacientes', href: '/patients', icon: Clock, gradientKey: 'stats' },
  { name: 'Valores', description: 'Estatísticas para Anestesias', href: '/financial', icon: DollarSign, gradientKey: 'andamento' }
];

const Dashboard = () => {
  const { userProfile, logout, currentUserId } = useAuth();
  
  const [recentSurgeries, setRecentSurgeries] = useState([]);
  const [recentAneshesia, setRecentAnesthesia] = useState([]);
  
  const [dashboardStats, setDashboardStats] = useState({
    anesthesias: { current: 0, previous: 0, total: 0 },
    patients: { current: 0, previous: 0, total: 0 },
    surgeries: { current: 0, previous: 0, total: 0 }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUserId) return;
    
      try {
        setLoading(true);
    
        const [recentAnesthesias, recentSurgeriesRes, stats] = await Promise.all([
          getUserAnesthesias(currentUserId, DASHBOARD_LIST_LIMIT),
          getUserSurgeries(currentUserId, DASHBOARD_LIST_LIMIT),
          getDashboardStats(currentUserId) // Nova função
        ]);
    
        setRecentAnesthesia(recentAnesthesias);
        setRecentSurgeries(recentSurgeriesRes);
        setDashboardStats(formatDashboardStats(stats)); // Com formatação
    
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUserId]);

  // Navegação
  const navigate = useNavigate();
  const navigateToAnesthesia = useCallback((anesthesia) => {
    if (anesthesia?.patientId && anesthesia?.surgeryId && anesthesia?.id) {
      navigate(`/patients/${anesthesia.patientId}/surgeries/${anesthesia.surgeryId}/anesthesia/${anesthesia.id}`);
    }
  }, [navigate]);

  const navigateToSurgery = useCallback((surgery) => {
    if (surgery?.patientId && surgery?.id) {
      navigate(`/patients/${surgery.patientId}/surgeries/${surgery.id}/surgery`);
    }
  }, [navigate]);

  // Função utilitária para parse de timestamp, extraída para fora do getElapsedTime
  const parseTimestamp = (ts) => {
    if (!ts) return null;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    if (typeof ts.toDate === 'function') return ts.toDate();
    return new Date(ts);
  };

  // Status badges
  const getStatusBadge = (status) => {
    const statusMap = {
      'Concluída': { label: 'Finalizada', class: 'bg-green-100 text-green-800' },
      'Em andamento': { label: 'Em Andamento', class: 'bg-blue-100 text-blue-800' },
      'Agendada': { label: 'Agendada', class: 'bg-yellow-100 text-yellow-800' },
    };
    
    const statusInfo = statusMap[status] || { label: 'Desconhecido', class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Type badges
  const getTypeBadge = (procedureType, insuranceName) => {
    if (procedureType === 'sus') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          SUS
        </span>
      );
    }
    
    const displayName = insuranceName || 'Convênio';
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        {displayName}
      </span>
    );
  };

  // Listas derivadas memorizadas para reduzir custo por render
  const recentAneshesiaDerived = useMemo(() => {
    return (recentAneshesia || [])
      .map((a) => {
        const code = a?.code || a.surgeryId || 'Código não informado';
        const procedure = (() => {
          if (!a || !a.procedureType) return 'Procedimento não informado';
          if (a.procedureType === 'sus') return a.proposedSurgery || 'Procedimento não informado';
          if (a.procedureType === 'convenio' && Array.isArray(a.cbhpmProcedures) && a.cbhpmProcedures.length > 0) {
            const valid = a.cbhpmProcedures.filter(p => p.procedimento && p.porte_anestesico && !isNaN(parseInt(p.porte_anestesico)));
            if (valid.length === 0) return 'Procedimento não informado';
            valid.sort((x, y) => parseInt(y.porte_anestesico) - parseInt(x.porte_anestesico));
            return valid[0].procedimento;
          }
          return 'Procedimento não informado';
        })();
        const ts = a.anesthesiaStart || a.createdAt;
        const dateObj = ts?.seconds ? new Date(ts.seconds * 1000) : (ts ? new Date(ts) : null);
        const timeStr = dateObj ? dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const dateStr = dateObj ? dateObj.toLocaleDateString('pt-BR') : '';
        const start = dateObj;
        const end = a?.anesthesiaEnd ? (a.anesthesiaEnd.seconds ? new Date(a.anesthesiaEnd.seconds * 1000) : new Date(a.anesthesiaEnd)) : null;
        let duration = '00:00';
        if (start) {
          const endUse = end || start;
          const diff = Math.max(0, Math.floor((endUse - start) / 1000 / 60));
          const hh = String(Math.floor(diff / 60)).padStart(2, '0');
          const mm = String(diff % 60).padStart(2, '0');
          duration = `${hh}:${mm}`;
        }
        return { ...a, _code: code, _procedure: procedure, _timeStr: timeStr, _dateStr: dateStr, _duration: duration, _start: start };
      })
      .sort((x, y) => (y._start?.getTime() || 0) - (x._start?.getTime() || 0));
  }, [recentAneshesia]);

  const recentSurgeriesDerived = useMemo(() => {
    return (recentSurgeries || [])
      .map((s) => {
        const code = s.code || s.id;
        let scheduled = 'Data não disponível';
        if (s.surgeryDate) {
          const [year, month, day] = s.surgeryDate.split('-');
          scheduled = `${day}/${month}/${year}`;
        } else if (s.createdAt?.seconds) {
          scheduled = new Date(s.createdAt.seconds * 1000).toLocaleDateString('pt-BR');
        }
        const procedure = (() => {
          if (!s || !s.procedureType) return 'Procedimento não informado';
          if (s.procedureType === 'sus') return s.proposedSurgery || 'Procedimento não informado';
          if (s.procedureType === 'convenio' && Array.isArray(s.cbhpmProcedures) && s.cbhpmProcedures.length > 0) {
            const valid = s.cbhpmProcedures.filter(p => p.procedimento && p.porte_anestesico && !isNaN(parseInt(p.porte_anestesico)));
            if (valid.length === 0) return 'Procedimento não informado';
            valid.sort((x, y) => parseInt(y.porte_anestesico) - parseInt(x.porte_anestesico));
            return valid[0].procedimento;
          }
          return 'Procedimento não informado';
        })();
        let sortDate = null;
        if (s.surgeryDate) {
          const [year, month, day] = s.surgeryDate.split('-');
          sortDate = new Date(`${year}-${month}-${day}`);
        } else if (s.createdAt?.seconds) {
          sortDate = new Date(s.createdAt.seconds * 1000);
        }
        return { ...s, _code: code, _scheduled: scheduled, _procedure: procedure, _sortDate: sortDate };
      })
      .sort((x, y) => (y._sortDate?.getTime() || 0) - (x._sortDate?.getTime() || 0));
  }, [recentSurgeries]);

  // Estatísticas memorizadas
  const statsData = useMemo(() => ([
    { 
      name: 'Anestesias', 
      current: dashboardStats.anesthesias.current,
      previous: dashboardStats.anesthesias.previous,
      total: dashboardStats.anesthesias.total,
      change: dashboardStats.anesthesias.change,
      trend: dashboardStats.anesthesias.trend,
      icon: Stethoscope 
    },
    { 
      name: 'Pacientes', 
      current: dashboardStats.patients.current,
      previous: dashboardStats.patients.previous,
      total: dashboardStats.patients.total,
      change: dashboardStats.patients.change,
      trend: dashboardStats.patients.trend,
      icon: Users 
    }
    // Removemos cirurgias por redundância
  ]), [dashboardStats]);

  const skeletonRowsThree = useMemo(() => [1,2,3], []);
  const skeletonCardsFour = useMemo(() => [1,2,3,4], []);

  // Componente QuickActionCard (memoizado)
  const QuickActionCard = React.memo(({ title, description, href, Icon, gradient }) => {
    return (
      <Link
        to={href}
        className={`p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 block w-full text-white ${gradient}`}
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <Icon className="h-8 w-8 text-white" />
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {description && <p className="text-xs opacity-80">{description}</p>}
        </div>
      </Link>
    );
  });

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.name}
            title={action.name}
            description={action.description}
            href={action.href}
            Icon={action.icon}
            gradient={GRADIENTS[action.gradientKey]}
          />
        ))}
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
          {skeletonCardsFour.map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-3 sm:p-4 animate-pulse">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.trend === 'up';

            return (
              <div
                key={stat.name}
                className="bg-white border border-gray-200 rounded-md p-3 sm:p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600 truncate">{stat.name}</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">{stat.current}</p>
                  </div>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                </div>

                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mês anterior:</span>
                    <span className="font-medium">{stat.previous}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-medium">{stat.total}</span>
                  </div>

                  {stat.change !== 0 && (
                    <div
                      className={`flex justify-between items-center pt-1.5 mt-1.5 border-t ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs">Variação:</span>
                      <span className="text-[10px] sm:text-xs font-medium">
                        {isPositive ? '+' : ''}{stat.change}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Anesthesias */}
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            Anestesias Recentes ({Math.min(DASHBOARD_LIST_LIMIT, dashboardStats.anesthesias.total)}/{dashboardStats.anesthesias.total})
          </h2>
          <Link
            to="/patients"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Ver pacientes
          </Link>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {skeletonRowsThree.map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentAneshesiaDerived.length > 0 ? (
          <>
            {/* Tabela para desktop */}
            <div className="hidden md:block overflow-hidden">
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
                  {recentAneshesiaDerived.map((anesthesia) => (
                    <tr 
                      key={anesthesia.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigateToAnesthesia(anesthesia)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-medium">
                        {anesthesia._code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {anesthesia.patientName || 'Nome não informado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div
                          className="max-w-xs truncate"
                          title={anesthesia._procedure}
                        >
                          {anesthesia._procedure}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {anesthesia._timeStr}
                        <div className="text-xs text-gray-400">
                          {anesthesia._dateStr}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(anesthesia.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {anesthesia._duration}
                        {anesthesia.procedureType && (
                          <div className="mt-1">
                            {getTypeBadge(anesthesia.procedureType, anesthesia.insuranceName)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para mobile */}
            <div className="block md:hidden space-y-4">
              {recentAneshesiaDerived.map((anesthesia) => (
                <div
                  key={anesthesia.id}
                  className="p-4 border rounded-lg shadow-sm bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigateToAnesthesia(anesthesia)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-base font-semibold text-gray-900">
                        {anesthesia.patientName || 'Nome não informado'}
                      </div>
                      <div className="text-sm font-mono text-blue-600">
                        {anesthesia._code}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 truncate" title={anesthesia._procedure}>
                      {anesthesia._procedure}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-500">
                        {anesthesia._timeStr}
                        <div className="text-xs text-gray-400">
                          {anesthesia._dateStr}
                        </div>
                      </div>
                      {getStatusBadge(anesthesia.status)}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-500">
                        Duração: {anesthesia._duration}
                      </div>
                      {anesthesia.procedureType && getTypeBadge(anesthesia.procedureType, anesthesia.insuranceName)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Stethoscope className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma anestesia encontrada</p>
            <Link 
              to="/newanesthesia"
              className="mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Criar primeira anestesia
            </Link>
          </div>
        )}
      </div>

      {/* Cirurgias Recentes */}
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            Cirurgias Recentes ({Math.min(DASHBOARD_LIST_LIMIT, dashboardStats.anesthesias.total)}/{dashboardStats.anesthesias.total})
          </h2>
          <Link
            to="/patients"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Ver pacientes
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {skeletonRowsThree.map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentSurgeriesDerived.length > 0 ? (
          <>
            {/* Tabela para desktop */}
            <div className="hidden md:block overflow-hidden">
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
                      Programada para
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSurgeriesDerived.map((surgery) => (
                    <tr
                      key={surgery.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigateToSurgery(surgery)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-medium">
                        {surgery._code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {surgery.patientName || 'Nome não informado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div
                          className="max-w-xs truncate"
                          title={surgery._procedure}
                        >
                          {surgery._procedure}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {surgery._scheduled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(surgery.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para mobile */}
            <div className="block md:hidden space-y-4">
              {recentSurgeriesDerived.map((surgery) => (
                <div
                  key={surgery.id}
                  className="p-4 border rounded-lg shadow-sm bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigateToSurgery(surgery)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-base font-semibold text-gray-900">
                        {surgery.patientName || 'Nome não informado'}
                      </div>
                      <div className="text-sm font-mono text-blue-600">
                        {surgery._code}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 truncate" title={surgery._procedure}>
                      {surgery._procedure}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-500">
                        {surgery._scheduled}
                      </div>
                      {getStatusBadge(surgery.status)}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      {surgery.procedureType && getTypeBadge(surgery.procedureType, surgery.insuranceName)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Stethoscope className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma cirurgia encontrada</p>
            <Link
              to="/surgeries/new-patient"
              className="mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Criar primeira cirurgia
            </Link>
          </div>
        )}
      </div>

      {/* User Profile Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userProfile?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {userProfile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500">
                CRM: {userProfile?.crm}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;