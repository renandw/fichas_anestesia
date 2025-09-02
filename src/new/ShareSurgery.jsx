import React, { useState, useEffect } from 'react';
import { Share2, Users, X, Search, UserPlus, Loader, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { shareSurgery } from '../services/surgeryService';

const ShareSurgery = ({ surgery, onShareComplete, onSkip }) => {
  const { getOtherUsers, currentUserId, userName } = useAuth();
  
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [creatorName, setCreatorName] = useState('');

  // Buscar usuários reais do Firebase
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Buscando outros usuários no Firebase...');
      const users = await getOtherUsers();
      
      console.log('✅ Usuários encontrados:', users.length);
      setAvailableUsers(users);
      
      // Se não há outros usuários, mostrar informação útil
      if (users.length === 0) {
        console.log('ℹ️ Nenhum outro usuário encontrado no sistema');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar usuários:', err);
      setError('Erro ao carregar lista de usuários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Quando os usuários e o createdBy estiverem disponíveis, buscar nome do criador
    const createdBy = surgery.metadata?.createdBy;
    if (availableUsers.length > 0 && createdBy) {
      const creatorUser = availableUsers.find(u => (u.id || u.uid) === createdBy);
      if (creatorUser) {
        setCreatorName(creatorUser.name);
      }
    }
  }, [availableUsers, surgery.metadata?.createdBy]);

  // Filtrar usuários baseado na busca e critérios de elegibilidade
  const alreadyShared = surgery.sharedWith || [];
  const createdBy = surgery.metadata?.createdBy;
  const filteredUsers = availableUsers.filter(user => {
    const userId = user.id || user.uid;
    const isSearchMatch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const isValid =
      userId !== currentUserId &&
      userId !== createdBy &&
      !alreadyShared.includes(userId);
    return isSearchMatch && isValid;
  });

  // Alternar seleção de usuário
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Selecionar todos os usuários filtrados
  const selectAllFiltered = () => {
    const filteredIds = filteredUsers.map(user => user.id || user.uid);
    setSelectedUsers(prev => {
      const newSelection = [...new Set([...prev, ...filteredIds])];
      return newSelection;
    });
  };

  // Desselecionar todos
  const clearSelection = () => {
    setSelectedUsers([]);
  };

  // Compartilhar cirurgia - INTEGRADO COM FIREBASE
  const handleShare = async () => {
    if (selectedUsers.length === 0) return;

    // Remover o próprio usuário, o criador da cirurgia e usuários já compartilhados
    const alreadyShared = surgery.sharedWith || [];
    const createdBy = surgery.metadata?.createdBy;
    const filteredUsers = selectedUsers.filter(
      id => id !== currentUserId && id !== createdBy && !alreadyShared.includes(id)
    );

    if (filteredUsers.length === 0) {
      setError("Selecione ao menos um usuário válido para compartilhar.");
      return;
    }

    // DEBUG logs antes da chamada ao serviço
    console.log('DEBUG -> patientId:', surgery.patientId);
    console.log('DEBUG -> surgeryId:', surgery.id);
    console.log('DEBUG -> selectedUsers:', selectedUsers);
    console.log('DEBUG -> filteredUsers:', filteredUsers);
    console.log('DEBUG -> currentUserId:', currentUserId);

    // Validação para evitar chamadas com IDs indefinidos
    if (!surgery.patientId || !surgery.id) {
      console.error('❌ ID do paciente ou da cirurgia está indefinido!', {
        patientId: surgery.patientId,
        surgeryId: surgery.id
      });
      setError('Erro: cirurgia inválida ou paciente não definido.');
      return;
    }

    setIsSharing(true);
    setError(null);
    
    try {
      console.log('🔗 Compartilhando cirurgia no Firebase...');
      console.log('Cirurgia:', surgery.id);
      console.log('Paciente:', surgery.patientId);
      console.log('Usuários selecionados:', selectedUsers);
      console.log('Usuários filtrados para compartilhar:', filteredUsers);
      
      // Chamar serviço real do Firebase
      await shareSurgery(
        surgery.patientId,
        surgery.id,
        filteredUsers,
        currentUserId
      );
      
      // Criar objeto cirurgia atualizado
      const updatedSurgery = {
        ...surgery,
        sharedWith: Array.from(new Set([...(surgery.sharedWith || []), ...filteredUsers])),
        metadata: {
          ...surgery.metadata,
          sharedAt: new Date().toISOString(),
          sharedBy: currentUserId
        }
      };
      
      console.log('✅ Cirurgia compartilhada com sucesso');
      onShareComplete(updatedSurgery, filteredUsers);
      
    } catch (err) {
      console.error('❌ Erro ao compartilhar cirurgia:', err);
      setError('Erro ao compartilhar cirurgia. Tente novamente.');
    } finally {
      setIsSharing(false);
    }
  };

  // Continuar sem compartilhar
  const handleSkip = () => {
    console.log('⏭️ Continuando sem compartilhar');
    onSkip();
  };

  const getStatusColor = (status) => {
    return status === 'online' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Nunca visto';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-full sm:max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Share2 className="w-3 h-3 text-purple-600" />
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-600">
            Selecione anestesistas para compartilhar esta cirurgia
          </p>
        </div>
      </div>

      {/* Resumo da cirurgia */}
      <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
        <h4 className="font-medium text-purple-900 mb-2">Cirurgia a ser compartilhada:</h4>
        <div className="text-sm space-y-1">
          <p><strong>Código:</strong> {surgery.code || 'N/A'}</p>
          <p><strong>Procedimento:</strong> {surgery.procedimento || surgery.proposedSurgery || 'Não especificado'}</p>
          <p><strong>Tipo:</strong> {surgery.procedureType === 'sus' ? 'SUS' : 'Convênio'}</p>
          <p><strong>Hospital:</strong> {surgery.hospital}</p>
          <p><strong>Cirurgião:</strong> {surgery.mainSurgeon}</p>
          <p>
            <strong>Criada por:</strong>{" "}
            {creatorName ||
              (surgery.metadata?.createdBy === currentUserId
                ? "Você"
                : surgery.metadata?.createdBy)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="w-6 h-6 text-purple-600 animate-spin mb-3" />
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : availableUsers.length === 0 ? (
        /* Interface especial para quando há apenas um usuário no sistema */
        <div className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Você é o único usuário no sistema
          </h4>
          
          <p className="text-gray-600 mb-6">
            Para compartilhar cirurgias, é necessário que outros anestesistas se cadastrem no sistema.
          </p>

          {/* Botão de ação primário quando não há usuários */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:flex-row">
            <button
              onClick={handleSkip}
              className="w-full sm:w-auto flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center gap-2 font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              Continuar sem Compartilhar
            </button>
            
            <p className="text-xs text-gray-500 sm:self-center">
              Você pode compartilhar esta cirurgia posteriormente através do menu de ações
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Busca e controles - quando há usuários disponíveis */}
          <div className="mb-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, email ou especialidade..."
                className="w-full sm:max-w-md pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={selectAllFiltered}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Selecionar todos
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Limpar seleção
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                {selectedUsers.length} de {filteredUsers.length} selecionados
              </div>
            </div>
          </div>

          {/* Lista de usuários */}
          <div className="max-h-[50vh] sm:max-h-64 overflow-y-auto border border-gray-200 rounded-lg mb-6">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Users className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p>
                  {searchTerm 
                    ? 'Nenhum usuário encontrado para esta busca'
                    : 'Todos os usuários elegíveis já compartilham esta cirurgia ou são o criador.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const userId = user.id || user.uid;
                  return (
                    <div
                      key={userId}
                      onClick={() => toggleUserSelection(userId)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedUsers.includes(userId) ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(userId)}
                            onChange={() => toggleUserSelection(userId)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                              {user.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">{user.specialty || 'Anestesiologia'}</p>
                            {user.status === 'offline' && user.lastSeen && (
                              <>
                                <span className="text-gray-300">•</span>
                                <p className="text-xs text-gray-500">
                                  Visto {formatLastSeen(user.lastSeen)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Usuários selecionados (preview) */}
          {selectedUsers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Usuários selecionados ({selectedUsers.length}):
              </h4>
              <div className="flex flex-wrap gap-1">
                {selectedUsers.map(userId => {
                  const user = availableUsers.find(u => (u.id || u.uid) === userId);
                  return user ? (
                    <span
                      key={userId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200"
                    >
                      {user.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUserSelection(userId);
                        }}
                        className="hover:bg-purple-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Botões de ação quando há usuários disponíveis */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:flex-row">
            {/* Botão principal - Compartilhar */}
            <button
              onClick={handleShare}
              disabled={selectedUsers.length === 0 || isSharing || isLoading}
              className="w-full sm:w-auto flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isSharing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Compartilhando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Compartilhar com {selectedUsers.length} {selectedUsers.length === 1 ? 'usuário' : 'usuários'}
                </>
              )}
            </button>
            
            {/* Botão secundário - Continuar sem compartilhar */}
            <button
              onClick={handleSkip}
              disabled={isSharing}
              className="w-full sm:w-auto flex-1 bg-transparent text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Continuar sem compartilhar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareSurgery;