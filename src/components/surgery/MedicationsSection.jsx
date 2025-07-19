import React, { useState, useRef } from 'react';
import { Pill, Plus, Syringe, Edit3, Trash } from 'lucide-react';
import toast from 'react-hot-toast';

const MedicationsSection = ({ 
  medications = [], 
  surgery, // ADICIONAR esta prop
  onMedicationsChange,
  autoSave 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedMedId, setHighlightedMedId] = useState(null);
  const [selectedMedication, setSelectedMedication] = useState('');
  const [dose, setDose] = useState('');
  const [via, setVia] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeEditPopover, setActiveEditPopover] = useState(null);
  const [editDose, setEditDose] = useState('');
  const [editVia, setEditVia] = useState('');
  const [editTime, setEditTime] = useState('');
  const editButtonRefs = useRef({});
  const addButtonRef = useRef(null);
  const presetButtonRef = useRef(null);
  const [editPopoverPosition, setEditPopoverPosition] = useState({ top: 0, left: 0 });

  const getSurgeryBaseTime = () => {
    if (!surgery?.createdAt) {
      return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    let surgeryDate;
    if (surgery.createdAt.seconds) {
      // Firestore Timestamp
      surgeryDate = new Date(surgery.createdAt.seconds * 1000);
    } else if (typeof surgery.createdAt === 'string') {
      // ISO String
      surgeryDate = new Date(surgery.createdAt);
    } else {
      // Já é um objeto Date
      surgeryDate = new Date(surgery.createdAt);
    }
    
    return surgeryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Vias de administração disponíveis
  const viasAdministracao = [
    { code: 'EV', name: 'Endovenoso' },
    { code: 'IM', name: 'Intramuscular' },
    { code: 'IT', name: 'Intratecal' },
    { code: 'PD', name: 'Peridural' },
    { code: 'PN', name: 'Perineural' },
    { code: 'SC', name: 'Subcutâneo' },
    { code: 'SL', name: 'Sublingual' },
    { code: 'IN', name: 'Intranasal' },
    { code: 'TOP', name: 'Tópico' },
    { code: 'VO', name: 'Via Oral' },
    { code: 'VR', name: 'Via Respiratória' }
  ];

  // --- UI helpers ---
  const categoryColorMap = {
    'Hipnótico': 'bg-purple-100 text-purple-800',
    'Opioide': 'bg-pink-100 text-pink-800',
    'Bloqueador Neuromuscular': 'bg-red-100 text-red-800',
    'AINE': 'bg-yellow-100 text-yellow-800',
    'Antiemético': 'bg-green-100 text-green-800',
    'Corticoide': 'bg-amber-100 text-amber-800',
    'Antibiótico': 'bg-indigo-100 text-indigo-800',
    'Vasopressor': 'bg-orange-100 text-orange-800',
    // fallback colour
  };

  const getCategoryColor = (category) =>
    categoryColorMap[category] || 'bg-blue-100 text-blue-800';

  const getViaName = (code) => {
    const viaObj = viasAdministracao.find((v) => v.code === code);
    return viaObj ? viaObj.name : '';
  };

  // Sugestões automáticas de via baseadas na medicação
  const getSuggestedVia = (medicationName) => {
    const name = medicationName.toLowerCase();
    
    // Anestésicos endovenosos
    if (name.includes('propofol') || name.includes('etomidato') || name.includes('cetamina')) {
      return 'EV';
    }
    
    // Benzodiazepínicos - geralmente EV em anestesia
    if (name.includes('midazolam') || name.includes('diazepam')) {
      return 'EV';
    }
    
    // Opioides - contexto determina via
    if (name.includes('fentanil') || name.includes('remifentanil') || name.includes('sufentanil')) {
      return 'EV';
    }
    if (name.includes('morfina')) {
      return 'EV'; // Padrão EV, mas pode ser IT
    }
    
    // Bloqueadores neuromusculares - sempre EV
    if (name.includes('rocurônio') || name.includes('atracúrio') || name.includes('vecurônio') || 
        name.includes('cisatracúrio') || name.includes('pancurônio') || name.includes('succinilcolina')) {
      return 'EV';
    }
    
    // Vasopressores/Inotrópicos - sempre EV
    if (name.includes('noradrenalina') || name.includes('adrenalina') || name.includes('fenilefrina') ||
        name.includes('efedrina') || name.includes('dopamina') || name.includes('dobutamina') ||
        name.includes('vasopressina') || name.includes('nitroprusseto') || name.includes('nitroglicerina')) {
      return 'EV';
    }
    
    // Anestésicos locais - dependem do contexto
    if (name.includes('pesada') || name.includes('isobárica')) {
      if (name.includes('sem vasoconstritor')) {
        return 'IT'; // Sem vaso geralmente é para neuroeixo
      }
      return 'PN'; // Com vaso geralmente é para bloqueios
    }
    if (name.includes('lidocaína')) {
      if (name.includes('adrenalina')) {
        return 'PN'; // Com adrenalina geralmente bloqueios/infiltração
      }
      return 'EV'; // Lidocaína sem adrenalina pode ser EV
    }
    
    // Antieméticos - geralmente EV
    if (name.includes('ondansetrona') || name.includes('metoclopramida') || name.includes('droperidol') ||
        name.includes('dimenidrinato') || name.includes('bromoprida')) {
      return 'EV';
    }
    
    // Corticoides - geralmente EV
    if (name.includes('dexametasona')) {
      return 'EV';
    }
    
    // Analgésicos não-opioides
    if (name.includes('dipirona') || name.includes('paracetamol')) {
      return 'EV';
    }
    if (name.includes('cetorolaco') || name.includes('cetoprofeno') || name.includes('tenoxicam') || 
        name.includes('dexketoprofeno')) {
      return 'EV';
    }
    
    // Antibióticos - geralmente EV
    if (name.includes('cefazolina') || name.includes('cefuroxima') || name.includes('ceftriaxona') ||
        name.includes('clindamicina') || name.includes('vancomicina') || name.includes('metronidazol') ||
        name.includes('gentamicina') || name.includes('ciprofloxacino')) {
      return 'EV';
    }
    
    // Reversores - sempre EV
    if (name.includes('neostigmina') || name.includes('sugammadex') || name.includes('atropina')) {
      return 'EV';
    }
    
    // Alfa-2 agonistas
    if (name.includes('dexmedetomidina')) {
      return 'EV';
    }
    
    // Anestésicos inalatórios - via inalatória não está na lista, usar EV como padrão
    if (name.includes('sevoflurano') || name.includes('desflurano') || name.includes('oxigênio') || name.includes('comprimido') || name.includes('isoflurano')) {
      return 'VR'; // Placeholder, idealmente seria "INAL"
    }
    
    // Padrão para medicações não categorizadas
    return 'EV';
  };
  const medicationPresets = [
    {
      name: 'Anestesia Geral',
      icon: '💉',
      medications: [
        { name: 'Propofol', dose: '200mg', via: 'EV', category: 'Hipnótico' },
        { name: 'Fentanil', dose: '250mcg', via: 'EV', category: 'Opioide' },
        { name: 'Rocurônio', dose: '50mg', via: 'EV', category: 'Bloqueador Neuromuscular' },
        { name: 'Oxigênio', dose: '1L/min', via: 'VR', category: 'Gases Frescos' },
        { name: 'Ar Comprimido', dose: '1L/min', via: 'VR', category: 'Gases Frescos' },
        { name: 'Sevoflurano', dose: '10mL/', via: 'VR', category: 'Anestésicos Inalatórios' }
      ]
    },
    {
      name: 'Profilaxia Dor e NVPO',
      icon: '🛡️',
      medications: [
        { name: 'Dipirona', dose: '2g', via: 'EV', category: 'Analgésico' },
        { name: 'Cetoprofeno', dose: '100mg', via: 'EV', category: 'AINE' },
        { name: 'Dimenidrinato', dose: '30mg', via: 'EV', category: 'Antiemético' },
        { name: 'Metoclopramida', dose: '10mg', via: 'EV', category: 'Antiemético' },
        { name: 'Ondansetrona', dose: '8mg', via: 'EV', category: 'Antiemético' },
        { name: 'Dexametasona', dose: '10mg', via: 'EV', category: 'Corticoide' }
      ]
    },
    {
      name: 'Raquianestesia - Pesada',
      icon: '💊',
      medications: [
        { name: 'Bupivacaína Pesada', dose: '15mg', via: 'IT', category: 'Anestésico Local' },
        { name: 'Morfina', dose: '80mcg', via: 'IT', category: 'Opioide' },
        { name: 'Oxigênio', dose: '3L/min', via: 'VR', category: 'Gases Frescos' }
      ]
    },
    {
        name: 'Raquianestesia - Isobárica',
        icon: '💊',
        medications: [
          { name: 'Bupivacaína Isobárica', dose: '15mg', via: 'IT', category: 'Anestésico Local' },
          { name: 'Morfina', dose: '80mcg', via: 'IT', category: 'Opioide' },
          { name: 'Oxigênio', dose: '3L/min', via: 'VR', category: 'Gases Frescos' }
        ]
    },
    {
        name: 'Anestesia Peridural',
        icon: '💉',
        medications: [
          { name: 'Levobupivacaína', dose: '20ml', via: 'PD', category: 'Anestésico Local' },
          { name: 'Fentanil', dose: '100mcg', via: 'PD', category: 'Opioide' },
          { name: 'Morfina', dose: '2mg', via: 'PD', category: 'Opioide' },
          { name: 'Oxigênio', dose: '3L/min', via: 'VR', category: 'Gases Frescos' }
        ]
    },
    {
        name: 'Sedação Ambulatorial',
        icon: '💉',
        medications: [
        { name: 'Propofol', dose: '70mg', via: 'EV', category: 'Hipnótico' },
        { name: 'Fentanil', dose: '50mcg', via: 'EV', category: 'Opioide' },
        { name: 'Oxigênio', dose: '3L/min', via: 'VR', category: 'Gases Frescos' }
        ]
    },
    {
        name: 'Bloqueio Periférico',
        icon: '🧠',
        medications: [
          { name: 'Levoupivacaína', dose: '50mg', via: 'PN', category: 'Anestésico Local' },
          { name: 'Lidocaína', dose: '100mg', via: 'PN', category: 'Anestésico Local' },
          { name: 'Oxigênio', dose: '3L/min', via: 'VR', category: 'Gases Frescos' }
        ]
    },
    {
        name: 'Indução Rápida (RSI)',
        icon: '⚡',
        medications: [
          { name: 'Etomidato', dose: '20mg', via: 'EV', category: 'Indutor Hipnótico' },
          { name: 'Succinilcolina', dose: '100mg', via: 'EV', category: 'Bloqueador Neuromuscular' },
          { name: 'Fentanil', dose: '100mcg', via: 'EV', category: 'Opioide' },
          { name: 'Lidocaína', dose: '1mg/kg', via: 'EV', category: 'Anestésico Local' },
          { name: 'Oxigênio', dose: '1L/min', via: 'VR', category: 'Gases Frescos' }
        ]
    }
  ];

  // Lista de todas as medicações com suas categorias
  const allMedications = [
    // Anestésicos Inalatórios
    { name: 'Sevoflurano', category: 'Anestésico Inalatório' },
    { name: 'Desflurano', category: 'Anestésico Inalatório' },
    { name: 'Isoflurano', category: 'Anestésico Inalatório' },
    { name: 'Óxido nitroso', category: 'Anestésico Inalatório' },
    { name: 'Oxigênio',  category: 'Gases Frescos' },
    { name: 'Ar Comprimido', category: 'Gases Frescos' },
    
    // Anestésicos Endovenosos
    { name: 'Propofol', category: 'Hipnótico' },
    { name: 'Etomidato', category: 'Hipnótico' },
    { name: 'Cetamina', category: 'Hipnótico' },
    { name: 'Midazolam', category: 'Benzodiazepínico' },
    { name: 'Dexmedetomidina', category: 'Alfa-2 Agonista' },
    { name: 'Diazepam', category: 'Benzodiazepínico' },
    { name: 'Haloperidol', category: 'Neuroléptico' },
    
    // Bloqueadores Neuromusculares
    { name: 'Succinilcolina', category: 'Bloqueador Neuromuscular' },
    { name: 'Rocurônio', category: 'Bloqueador Neuromuscular' },
    { name: 'Vecurônio', category: 'Bloqueador Neuromuscular' },
    { name: 'Cisatracúrio', category: 'Bloqueador Neuromuscular' },
    { name: 'Atracúrio', category: 'Bloqueador Neuromuscular' },
    { name: 'Pancurônio', category: 'Bloqueador Neuromuscular' },
    
    // Vasopressores / Hipotensores
    { name: 'Noradrenalina', category: 'Vasopressor' },
    { name: 'Fenilefrina', category: 'Vasopressor' },
    { name: 'Efedrina', category: 'Vasopressor' },
    { name: 'Adrenalina', category: 'Vasopressor' },
    { name: 'Dopamina', category: 'Vasopressor' },
    { name: 'Dobutamina', category: 'Inotrópico' },
    { name: 'Vasopressina', category: 'Vasopressor' },
    { name: 'Nitroprusseto de Sódio', category: 'Hipotensor' },
    { name: 'Nitroglicerina', category: 'Hipotensor' },
    { name: 'Metaraminol', category: 'Vasopressor' },
    
    // Analgésicos Opioides
    { name: 'Fentanil', category: 'Opioide' },
    { name: 'Remifentanil', category: 'Opioide' },
    { name: 'Sufentanil', category: 'Opioide' },
    { name: 'Morfina', category: 'Opioide' },
    { name: 'Tramadol', category: 'Opioide' },
    
    // Analgésicos Não-opioides
    { name: 'Dipirona', category: 'Analgésico' },
    { name: 'Paracetamol', category: 'Analgésico' },
    { name: 'Cetorolaco', category: 'AINE' },
    { name: 'Dexketoprofeno', category: 'AINE' },
    { name: 'Cetoprofeno', category: 'AINE' },
    { name: 'Tenoxicam', category: 'AINE' },
    
    // Antieméticos
    { name: 'Ondansetrona', category: 'Antiemético' },
    { name: 'Dexametasona', category: 'Corticoide' },
    { name: 'Droperidol', category: 'Antiemético' },
    { name: 'Metoclopramida', category: 'Antiemético' },
    { name: 'Dimenidrinato', category: 'Antiemético' },
    { name: 'Escopolamina', category: 'Antiemético' },
    { name: 'Bromoprida', category: 'Antiemético' },
    
    // Antibióticos
    { name: 'Cefazolina', category: 'Antibiótico' },
    { name: 'Cefalotina', category: 'Antibiótico' },
    { name: 'Cefuroxima', category: 'Antibiótico' },
    { name: 'Ceftriaxona', category: 'Antibiótico' },
    { name: 'Clindamicina', category: 'Antibiótico' },
    { name: 'Vancomicina', category: 'Antibiótico' },
    { name: 'Metronidazol', category: 'Antibiótico' },
    { name: 'Gentamicina', category: 'Antibiótico' },
    { name: 'Ciprofloxacino', category: 'Antibiótico' },
    { name: 'Ampicilina', category: 'Antibiótico' },

    // Anticonvulsivantes
    { name: 'Fenitoína', category: 'Anticonvulsivante' },
    { name: 'Fenobarbital', category: 'Anticonvulsivante' },

    // Antiarritmicos
    { name: 'Amiodarona', category: 'Antiarritmico' },

    //Miscelânia
    { name: 'Clonidina', category: 'Alfa-2 Agonista' },
    { name: 'Ocitocina', category: 'Hormonal' },
    { name: 'Flumazenil', category: 'Reversor' },
    { name: 'Naloxona', category: 'Reversor' },
    { name: 'Esmolol', category: 'Betabloqueador' },
    { name: 'Metoprolol', category: 'Betabloqueador' },
    { name: 'Bisoprolol', category: 'Betabloqueador' },
    { name: 'Hidralazina', category: 'Hipotensor' },
    { name: 'Salbutamol (inalado)', category: 'Beta-2 Agonista' },
    { name: 'Hidrocortisona', category: 'Corticoide' },
    { name: 'Sulfato de Magnésio', category: 'Hidroeletrolítico' },
    { name: 'Prometazina', category: 'Antialérgico' },
    { name: 'Gluconato de Cálcio 10%', category: 'Hidroeletrolítico' },
    { name: 'Bicarbonato de Sódio 8,4%', category: 'Hidroeletrolítico' },
    { name: 'Cloreto de Sódio 0,9%', category: 'Cristalóide' },
    { name: 'Ringer Lactato', category: 'Cristalóide' },
    { name: 'Concentrado de Hemácias', category: 'Hemoderivados' },
    { name: 'Plaquetas', category: 'Hemoderivados' },
    { name: 'Plasma Fresco Congelado', category: 'Hemoderivados' },

    


    // Reversores
    { name: 'Neostigmina', category: 'Colinérgico' },
    { name: 'Atropina', category: 'Anticolinérgico' },
    { name: 'Sugammadex', category: 'Reversor' },
    
    // Anestésicos Locais
    { name: 'Lidocaína + adrenalina', category: 'Anestésico Local' },
    { name: 'Bupivacaína + adrenalina', category: 'Anestésico Local' },
    { name: 'Ropivacaína + adrenalina', category: 'Anestésico Local' },
    { name: 'Lidocaína', category: 'Anestésico Local' },
    { name: 'Bupivacaína', category: 'Anestésico Local' },
    { name: 'Bupivacaína Pesada', category: 'Anestésico Local' },
    { name: 'Bupivacaína Isobárica', category: 'Anestésico Local' },
    { name: 'Ropivacaína', category: 'Anestésico Local' },
    { name: 'Mepivacaína', category: 'Anestésico Local' },
    { name: 'Prilocaína', category: 'Anestésico Local' },
    { name: 'Levobupivacaína', category: 'Anestésico Local' },
    { name: 'Levobupivacaína + adrenalina', category: 'Anestésico Local' }
  ];

  // Filtrar medicações baseado na busca
  const filteredMedications = allMedications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  // Adicionar preset de medicações
  const addPreset = async (preset) => {
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const timestamp = new Date().toISOString();
    
    const newMedications = preset.medications.map((med, index) => ({
      id: Date.now() + index,
      name: med.name,
      dose: med.dose,
      via: med.via,
      category: med.category,
      time: getSurgeryBaseTime(),
      timestamp: timestamp
    }));

    const updatedMedications = [...medications, ...newMedications];
    onMedicationsChange(updatedMedications);
    
    if (autoSave) {
      await autoSave({ medications: updatedMedications });
    }
    
    toast.success(`${preset.name} adicionado (${newMedications.length} medicações)`);
  };

  // Iniciar edição de medicação (removido)

  // Salvar edição
  const saveEdit = async (medId) => {
    if (!editDose || !editDose.trim()) {
      toast.error('Dose não pode estar vazia');
      return;
    }
    if (!editVia || !editVia.trim()) {
      toast.error('Via não pode estar vazia');
      return;
    }

    const updatedMedications = medications.map(med =>
      med.id === medId
        ? { ...med, dose: editDose.trim(), via: editVia.trim(), time: editTime }
        : med
    );

    onMedicationsChange(updatedMedications);
    setHighlightedMedId(medId);
    setTimeout(() => setHighlightedMedId(null), 2000);
    setEditDose('');
    setEditVia('');
    setEditTime('');

    if (autoSave) {
      await autoSave({ medications: updatedMedications });
    }

    toast.success('Medicação atualizada');
  };

  // Adicionar medicação individual
  const addMedication = async () => {
    const medicationName = selectedMedication || searchTerm;
    
    if (!medicationName || !medicationName.trim()) {
      toast.error('Selecione uma medicação');
      return;
    }
    
    if (!dose || !dose.trim()) {
      toast.error('Informe a dose');
      return;
    }

    if (!via || !via.trim()) {
      toast.error('Selecione a via de administração');
      return;
    }

    const medicationData = allMedications.find(med => 
      med.name.toLowerCase() === medicationName.toLowerCase()
    );

    const newMed = {
      id: Date.now(),
      name: medicationName,
      dose: dose.trim(),
      via: via.trim(),
      category: medicationData?.category || 'Personalizada',
      time: getSurgeryBaseTime(),
      timestamp: new Date().toISOString()
    };

    const updatedMedications = [...medications, newMed];
    onMedicationsChange(updatedMedications);
    setHighlightedMedId(newMed.id);
    setTimeout(() => setHighlightedMedId(null), 2000);
    setSearchTerm('');
    setSelectedMedication('');
    setDose('');
    setVia('');
    setShowSuggestions(false);
    
    if (autoSave) {
      await autoSave({ medications: updatedMedications });
    }
    
    toast.success(`${medicationName} adicionado`);
  };

  // Selecionar medicação da lista
  const selectMedication = (medication) => {
    setSelectedMedication(medication.name);
    setSearchTerm(medication.name);
    setVia(getSuggestedVia(medication.name)); // Auto-sugerir via
    setShowSuggestions(false);
  };

  // Remover medicação
  const removeMedication = async (medId) => {
    const updatedMedications = medications.filter(med => med.id !== medId);
    onMedicationsChange(updatedMedications);
    
    if (autoSave) {
      await autoSave({ medications: updatedMedications });
    }
  };

  // Ordenar cronologicamente pela timestamp; se não existir ordenar alfabeticamente
  const orderedMedications = [...medications].sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    }
    return a.name.localeCompare(b.name);
  });

  // Agrupar medicações por tipo de via de administração
  const groupedMedications = viasAdministracao
    .map(via => ({
      viaCode: via.code,
      viaName: via.name,
      medications: orderedMedications.filter(med => (med.via || 'EV') === via.code)
    }))
    .filter(group => group.medications.length > 0);

  return (
    <div className="space-y-6">
      {/* Medicações aplicadas */}
      <div>
        <div className="flex flex-col gap-2 mb-3">
          <h3 className="text-lg font-medium text-gray-900">
            Medicações Aplicadas ({medications.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              ref={addButtonRef}
              onClick={() => {
                if (addButtonRef.current) {
                  const rect = addButtonRef.current.getBoundingClientRect();
                  setEditPopoverPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: Math.min(rect.left + window.scrollX, window.innerWidth - 340),
                  });
                }
                setActiveEditPopover('add');
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors w-fit"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
            <button
              ref={presetButtonRef}
              onClick={() => {
                if (presetButtonRef.current) {
                  const rect = presetButtonRef.current.getBoundingClientRect();
                  setEditPopoverPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: Math.min(rect.left + window.scrollX, window.innerWidth - 420),
                  });
                }
                setActiveEditPopover('preset');
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors w-fit"
            >
              <Syringe className="w-4 h-4" />
              Presets de Anestesia
            </button>
          </div>
        </div>

        {groupedMedications.length > 0 ? (
          groupedMedications.map(group => (
            <div key={group.viaCode} className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {group.viaCode} - {group.viaName}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-gray-700 border border-gray-300 rounded-md">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold">Medicação</th>
                      <th className="px-2 py-1 text-left font-semibold">Dose</th>
                      <th className="px-2 py-1 text-left font-semibold">Hora</th>
                      <th className="px-2 py-1 text-left font-semibold">Categoria</th>
                      <th className="px-2 py-1 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.medications.map((med) => (
                      <tr
                        key={med.id}
                        className={`border-t border-gray-200 ${highlightedMedId === med.id ? 'bg-yellow-100 transition-colors duration-300' : ''}`}
                      >
                        <td className="px-2 py-1 font-medium">{med.name}</td>
                        <td className="px-2 py-1">{med.dose}</td>
                        <td className="px-2 py-1">{med.time}</td>
                        <td className="px-2 py-1">
                          <span className={`inline-block px-2 py-0.5 rounded ${getCategoryColor(med.category)}`}>
                            {med.category}
                          </span>
                        </td>
                        <td className="px-2 py-1">
                          <div className="relative flex gap-1 items-center">
                            <button
                              ref={(el) => (editButtonRefs.current[med.id] = el)}
                              onClick={() => {
                                const rect = editButtonRefs.current[med.id].getBoundingClientRect();
                                setEditPopoverPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  left: Math.min(rect.left + window.scrollX, window.innerWidth - 280),
                                });
                                setEditDose(med.dose);
                                setEditTime(med.time || '');
                                setEditVia(med.via || '');
                                setActiveEditPopover(activeEditPopover === med.id ? null : med.id);
                              }}
                              className="p-1 bg-gray-500 text-white rounded hover:bg-gray-200"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeMedication(med.id)}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-200"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 px-4 text-gray-600 bg-gray-50 border border-dashed border-gray-300 rounded-md">
            <Pill className="h-10 w-10 mx-auto mb-3 text-primary-400" />
            <h4 className="text-md font-semibold mb-2">Nenhuma medicação registrada</h4>
            <p className="text-sm mb-3">
              Você pode começar adicionando medicações manualmente com o botão <strong>"Adicionar"</strong>,
              ou utilizar um dos <strong>"Presets de Anestesia"</strong> com medicações sugeridas para o caso.
            </p>
          </div>
        )}
      </div>
    {/* Edit Popover - Rendered at the end of component */}
    {activeEditPopover && activeEditPopover !== 'add' && activeEditPopover !== 'preset' && (
      <div
        className="fixed z-50 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3"
        style={{ top: editPopoverPosition.top, left: editPopoverPosition.left }}
      >
        <div className="absolute -top-2 left-8 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />
        <label className="block text-xs text-gray-700 mb-1">Dose</label>
        <input
          type="text"
          value={editDose}
          onChange={(e) => setEditDose(e.target.value)}
          className="w-full px-2 py-1 border rounded text-xs mb-2"
        />
        <label className="block text-xs text-gray-700 mb-1">Hora</label>
        <input
          type="time"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          className="w-full px-2 py-1 border rounded text-xs mb-2"
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => {
              saveEdit(activeEditPopover);
              setActiveEditPopover(null);
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full transition-colors"
          >
            Salvar
          </button>
          <button
            onClick={() => setActiveEditPopover(null)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )}
    {activeEditPopover === 'add' && (
      <div
        className="fixed z-50 w-[320px] bg-white border border-gray-200 rounded-md shadow-lg p-4"
        style={{
          top: editPopoverPosition.top || 100,
          left: editPopoverPosition.left || 20
        }}
      >
        <div className="absolute -top-2 left-10 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />
        <label className="block text-xs text-gray-700 mb-1">Medicação</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedMedication('');
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Digite o nome da medicação..."
          className="w-full px-2 py-1 border rounded text-xs mb-2"
        />
        {showSuggestions && searchTerm && filteredMedications.length > 0 && (
          <div className="border rounded bg-white shadow-sm max-h-40 overflow-y-auto text-xs mb-2">
            {filteredMedications.map((medication, index) => (
              <button
                key={index}
                onClick={() => selectMedication(medication)}
                className="block w-full text-left px-2 py-1 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                {medication.name} <span className="text-gray-400">({medication.category})</span>
              </button>
            ))}
          </div>
        )}

        <label className="block text-xs text-gray-700 mb-1">Dose</label>
        <input
          type="text"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          placeholder="Ex: 2mg, 1g"
          className="w-full px-2 py-1 border rounded text-xs mb-2"
        />

        <label className="block text-xs text-gray-700 mb-1">Via</label>
        <select
          value={via}
          onChange={(e) => setVia(e.target.value)}
          className="w-full px-2 py-1 border rounded text-xs mb-3 bg-white"
        >
          <option value="">Selecione a via...</option>
          {viasAdministracao.map(viaOption => (
            <option key={viaOption.code} value={viaOption.code}>
              {viaOption.code} - {viaOption.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              addMedication();
              setActiveEditPopover(null);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1 rounded-full transition-colors"
          >
            Adicionar
          </button>
          <button
            onClick={() => setActiveEditPopover(null)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )}
    {activeEditPopover === 'preset' && (
      <div
        className="fixed z-50 w-[400px] bg-white border border-gray-200 rounded-md shadow-lg p-4"
        style={{
          top: editPopoverPosition.top || 120,
          left: editPopoverPosition.left || 40
        }}
      >
        <div className="absolute -top-2 left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />
        <h4 className="text-sm font-semibold mb-2">Escolha um Preset</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {medicationPresets.map((preset, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-blue-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">{preset.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800 text-xs">{preset.name}</span>
                  <div className="text-[10px] text-gray-500 space-y-0.5 mt-1">
                    {preset.medications.map((m, i) => (
                      <div key={i}>
                        {m.name} {m.dose} <span className="text-gray-400">({m.via})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  addPreset(preset);
                  setActiveEditPopover(null);
                }}
                className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
              >
                Adicionar
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={() => setActiveEditPopover(null)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    )}
  </div>
  );
};

export default MedicationsSection;