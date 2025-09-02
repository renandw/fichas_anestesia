import React, { useState, useEffect } from 'react';
import { 
  FileText,
  Edit3,
  Save,
  X,
  Stethoscope,
  Syringe,
  Activity,
  Brain,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

const DescriptionSection = ({ surgery, onDataChange, autoSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(surgery?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Templates de anestesia predefinidos
  const anesthesiaTemplates = {
    geral: {
      name: 'Anestesia Geral',
      icon: Brain,
      color: 'bg-blue-500 hover:bg-blue-600',
      template: ` Anestesia Geral Balanceada	
      1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
	2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
	3.	Indução anestésica: a) Desnitrogenização com O₂ 100%; b) Drogas utilizadas conforme seção de medicamentos.; c) Intubação orotraqueal com TOT n° 7,5 sob laringoscopia direta (Cormack-Lehane II).; d) Tubo fixado a 21 cm na comissura labial.
	4.	Manutenção com drogas descritas em seção de medicações, sob ventilação mecânica. Parâmetros ventilatórios e monitoração contínua mantidos.
	5.	Revisado posicionamento do paciente e proteção ocular.
	6.	Ao término da cirurgia: aspiração das vias aéreas, suspensão dos agentes anestésicos, reversão do bloqueio neuromuscular conforme protocolo.
	7.	Paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável. Extubação realizada sem intercorrências.
	8.	Encaminhado à RPA/UTI em boas condições clínicas.`
    },
    raquidiana: {
      name: 'Raquianestesia',
      icon: Syringe,
      color: 'bg-green-500 hover:bg-green-600',
      template: `Técnica anestésica: Raquianestesia.
1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
3. Raquianestesia: a) Posiciono paciente sentado em mesa cirúrgica b) Assepsia e antissepsia das mãos e dorso do paciente.; c) Agulha 27G, Quincke, punção única. Entre L3-L4. Punção de espaço subaracnóide sem intercorrências
d) LCR límpido, sem alterações. e) Injeto medicações conforme seção de medicamentos.
4- Testo bloqueio com estímulos térmicos e motores.
5- Reviso posicionamento.
6- Ao término da cirurgia, paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável
7- Encaminhado à RPA/UTI em boas condições clínicas.`
    },
    peridural: {
      name: 'Peridural',
      icon: Activity,
      color: 'bg-purple-500 hover:bg-purple-600',
      template: `Técnica anestésica: Anestesia peridural.
1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
3. Peridural: a) Posiciono paciente sentado em mesa cirúrgica b) Assepsia e antissepsia das mãos e dorso do paciente.; c) Agulha 18G Tuohy, punção única. Entre T5-T6, confirmação de espaço peridural pela tecníca de Doglioti.
d) Sem acidentes de punção, retorno de líquor ou sangue. Teste de injeção de adrenalina negativo. Injeto drogas descritas na seção de medicamentos. Não observo deformação da bolha de ar à seringa.
5. Reviso posicionamento.
6. Ao término da cirurgia, paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável
7. Encaminhado à RPA/UTI em boas condições clínicas.`
    },
    local: {
      name: 'Anestesia Local',
      icon: Stethoscope,
      color: 'bg-orange-500 hover:bg-orange-600',
      template: `Técnica anestésica: Anestesia local.
1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
3. Injeção local de drogas conforme seção de medicação.
4. Reviso posicionamento.
5. Ao término da cirurgia, paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável
6. Encaminhado à RPA/UTI em boas condições clínicas.
`
    },
    sedacao: {
      name: 'Sedação',
      icon: Heart,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      template: ` Sedação:
      1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
	2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
	3.	Sedação consciente com medicações descritas
 a. Suplementação de O₂ via cateter nasal. 
 b. Drogas utilizadas conforme seção de medicamentos.
	4.	Reviso posicionamento do paciente
	5.	Paciente permaneceu sem depressão respiratória e hemodinâmicamente estável
	6.	Ao término da cirurgia: Paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável. Extubação realizada sem intercorrências.
	7.	Encaminhado à RPA/UTI em boas condições clínicas.`
    },
    plexo: {
        name: 'Bloqueio de Plexo Braquial + Sedação',
        icon: Heart,
        color: 'bg-indigo-500 hover:bg-indigo-600',
        template: ` Bloqueio de Plexo Braquial:
        1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
      2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
      3.	Sedação consciente com medicações descritas; a. Suplementação de O₂ via cateter nasal. b. Drogas utilizadas conforme seção de medicamentos.
      4.	Assepsia de região interescalênica e axilar. Visualização de estruturas nervosas à ultrassonografia. Injeção de anestésico local conforme seção de medicação
      5.    Procedimento sem intercorrências;
      6.    Reviso posicionamento do paciente;
      7.	Paciente permaneceu sem depressão respiratória e hemodinâmicamente estável;
      8.	Ao término da cirurgia: Paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável. Extubação realizada sem intercorrências.
      9.	Encaminhado à RPA/UTI em boas condições clínicas.`
      },
    plexogeral: {
        name: 'Bloqueio de Plexo Braquial + Geral',
        icon: Heart,
        color: 'bg-indigo-500 hover:bg-indigo-600',
        template: ` Bloqueio de Plexo Braquial + Anestesia Geral:
      1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
      2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
      3.	Sedação consciente com medicações descritas; a. Suplementação de O₂ via cateter nasal. b. Drogas utilizadas conforme seção de medicamentos.
      4.	Assepsia de região interescalênica e axilar. Visualização de estruturas nervosas à ultrassonografia. Injeção de anestésico local conforme seção de medicação
      5.    Procedimento sem intercorrências;
      6.	Indução anestésica: a) Desnitrogenização com O₂ 100%; b) Drogas utilizadas conforme seção de medicamentos.; c) Intubação orotraqueal com TOT n° 7,5 sob laringoscopia direta (Cormack-Lehane II).; d) Tubo fixado a 21 cm na comissura labial.
	  7.	Manutenção com drogas descritas em seção de medicações, sob ventilação mecânica. Parâmetros ventilatórios e monitoração contínua mantidos.
	  8.	Revisado posicionamento do paciente e proteção ocular.
	  9.	Ao término da cirurgia: aspiração das vias aéreas, suspensão dos agentes anestésicos, reversão do bloqueio neuromuscular conforme protocolo.
      10.	Encaminhado à RPA/UTI em boas condições clínicas.`
      },
    raquigeral: {
        name: 'Raquianestesia + Geral',
        icon: Heart,
        color: 'bg-indigo-500 hover:bg-indigo-600',
        template: ` Raquianestesia + Anestesia Geral:
      1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
      2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
      3.	Sedação consciente com medicações descritas; a. Suplementação de O₂ via cateter nasal. b. Drogas utilizadas conforme seção de medicamentos.
      4.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
      5.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
      6.    Raquianestesia: a) Posiciono paciente sentado em mesa cirúrgica b) Assepsia e antissepsia das mãos e dorso do paciente.; c) Agulha 27G, Quincke, punção única. Entre L3-L4. Punção de espaço subaracnóide sem intercorrências
      d)    LCR límpido, sem alterações. e) Injeto medicações conforme seção de medicamentos.
      7.	Indução anestésica: a) Desnitrogenização com O₂ 100%; b) Drogas utilizadas conforme seção de medicamentos.; c) Intubação orotraqueal com TOT n° 7,5 sob laringoscopia direta (Cormack-Lehane II).; d) Tubo fixado a 21 cm na comissura labial.
	  8.	Manutenção com drogas descritas em seção de medicações, sob ventilação mecânica. Parâmetros ventilatórios e monitoração contínua mantidos.
	  9.	Revisado posicionamento do paciente e proteção ocular.
	  10.	Ao término da cirurgia: aspiração das vias aéreas, suspensão dos agentes anestésicos, reversão do bloqueio neuromuscular conforme protocolo.
      11.	Encaminhado à RPA/UTI em boas condições clínicas.`
      },
    perigeral: {
        name: 'Peridural + Geral',
        icon: Heart,
        color: 'bg-indigo-500 hover:bg-indigo-600',
        template: ` Peridural + Anestesia Geral:
      1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
      2.	Monitorização padrão iniciada (ECG, oximetria, PNI, capnografia). Acesso venoso periférico em MSD verificado e pérvio.
      3.	Sedação consciente com medicações descritas; a. Suplementação de O₂ via cateter nasal. b. Drogas utilizadas conforme seção de medicamentos.
      3.    Peridural: a) Posiciono paciente sentado em mesa cirúrgica b) Assepsia e antissepsia das mãos e dorso do paciente.; c) Agulha 18G Tuohy, punção única. Entre T5-T6, confirmação de espaço peridural pela tecníca de Doglioti.
      d)    Sem acidentes de punção, retorno de líquor ou sangue. Teste de injeção de adrenalina negativo. Injeto drogas descritas na seção de medicamentos. Não observo deformação da bolha de ar à seringa.
      4.    Reviso posicionamento.
      5.	Indução anestésica: a) Desnitrogenização com O₂ 100%; b) Drogas utilizadas conforme seção de medicamentos.; c) Intubação orotraqueal com TOT n° 7,5 sob laringoscopia direta (Cormack-Lehane II).; d) Tubo fixado a 21 cm na comissura labial.
	  6.	Manutenção com drogas descritas em seção de medicações, sob ventilação mecânica. Parâmetros ventilatórios e monitoração contínua mantidos.
	  7.	Revisado posicionamento do paciente e proteção ocular.
	  8.	Ao término da cirurgia: aspiração das vias aéreas, suspensão dos agentes anestésicos, reversão do bloqueio neuromuscular conforme protocolo.
      9.	Encaminhado à RPA/UTI em boas condições clínicas.`
      },
    sedacaopediatrica: {
        name: 'Sedação Pediátrica',
        icon: Heart,
        color: 'bg-indigo-500 hover:bg-indigo-600',
        template: ` Sedação:
        1.	Paciente admitido em sala cirúrgica. Realizada checagem da via aérea e funcionamento da estação de anestesia. Anamnese e exame físico realizados.
      2.	Monitorização padrão iniciada (ECG, oximetria, PNI). Acesso venoso periférico em MSD verificado e pérvio.
      3.	Sedação sob sistema Baraka Mapleson A com medicações descritas na seção de medicações.
      4.	Reviso posicionamento do paciente
      5.	Paciente permaneceu sem depressão respiratória e hemodinâmicamente estável
      6.	Ao término da cirurgia: Paciente com respiração espontânea, ativo e reativo, boa mecânica ventilatória e oximetria estável.
      7.	Encaminhado à RPA em boas condições clínicas.`
      }    
  };

  // Atualizar estado local quando surgery muda, exceto se estiver editando
  useEffect(() => {
    if (!isEditing) {
      setDescription(surgery?.description || '');
    }
  }, [surgery?.description, isEditing]);

  // AutoSave com debounce
  const handleAutoSave = async (newDescription) => {
    // Limpar timeout anterior
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Criar novo timeout
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        const updatedData = { description: newDescription };
        
        // Salvar no Firebase
        await autoSave(updatedData);
        
        // Atualizar estado local do SurgeryDetail
        if (onDataChange) {
          onDataChange(updatedData);
        }
        
        console.log('✅ Descrição salva automaticamente');
      } catch (error) {
        console.error('❌ Erro no AutoSave da descrição:', error);
        toast.error('Erro ao salvar descrição automaticamente');
      } finally {
        setIsSaving(false);
      }
    }, 3000); // Debounce de 3 segundos

    setSaveTimeout(timeout);
  };

  const handleDescriptionChange = (e) => {
    const newValue = e.target.value;
    setDescription(newValue);
    
    // Trigger AutoSave se estiver editando
    if (isEditing) {
      handleAutoSave(newValue);
    }
  };

  const applyTemplate = (templateKey) => {
    const template = anesthesiaTemplates[templateKey];
    if (template) {
      setDescription(template.template);
      
      // AutoSave imediato após aplicar template
      handleAutoSave(template.template);
      
      toast.success(`Template "${template.name}" aplicado`);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Restaurar valor original
    setDescription(surgery?.description || '');
    setIsEditing(false);
    
    // Limpar timeout se houver
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = { description };
      
      await autoSave(updatedData);
      
      if (onDataChange) {
        onDataChange(updatedData);
      }
      
      toast.success('Descrição salva com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar descrição:', error);
      toast.error('Erro ao salvar descrição. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    // Modo visualização
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Descrição do Procedimento Anestésico
          </h3>
          <button
            onClick={handleEdit}
            className="btn-secondary flex items-center"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar
          </button>
        </div>

        {/* Conteúdo */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-primary-600 mr-2" />
            <h4 className="font-medium text-gray-900">Descrição Técnica</h4>
          </div>
          
          {description ? (
            <div className="whitespace-pre-wrap text-sm text-gray-900 bg-white p-4 rounded border">
              {description}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma descrição adicionada ainda</p>
              <button
                onClick={handleEdit}
                className="mt-2 text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Adicionar descrição
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modo edição
  return (
    <div className="space-y-6">
      {/* Header do modo edição */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Descrição do Procedimento Anestésico
        </h3>
        <div className="flex items-center space-x-2">
          {isSaving && (
            <span className="text-sm text-gray-500 flex items-center">
              <div className="loading-spinner mr-2"></div>
              Salvando...
            </span>
          )}
          <button
            onClick={handleCancel}
            className="btn-secondary flex items-center"
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center"
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </button>
        </div>
      </div>

      {/* Templates rápidos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Templates Rápidos</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(anesthesiaTemplates).map(([key, template]) => {
            const Icon = template.icon;
            return (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                className={`${template.color} text-white p-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2`}
                disabled={isSaving}
              >
                <Icon className="h-6 w-6" />
                <span>{template.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Clique em um template para aplicar um modelo predefinido. Você pode editá-lo depois.
        </p>
      </div>

      {/* Editor de texto */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Descrição Técnica</h4>
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Digite a descrição técnica do procedimento anestésico..."
          className="input-field resize-none"
          rows={15}
          disabled={isSaving}
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            Use os templates acima para acelerar o preenchimento ou digite livremente.
          </p>
          {!isSaving && description !== (surgery?.description || '') && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Alterações serão salvas automaticamente
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DescriptionSection;