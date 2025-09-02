import React from 'react';

// Constantes e helpers
const CORMACK_OPTIONS = ['I', 'II', 'III', 'IV'];
const id = (name) => `tech_${name}`;

const TECH_LABELS = {
  geral: 'Anestesia Geral',
  raquianestesia: 'Raquianestesia',
  sedacao: 'Sedação',
  peridural: 'Peridural',
  periferico: 'Bloqueio periférico',
};
const TECH_KEYS = ['geral', 'raquianestesia', 'sedacao', 'peridural', 'periferico'];

// --- Helpers para ordenar pills e parâmetros ---
const getActiveInOrder = (d) => {
  const custom = Array.isArray(d.techOrder)
    ? d.techOrder.filter((k) => TECH_KEYS.includes(k) && d[k])
    : [];
  if (custom.length > 0) return custom;
  // fallback: todos ativos na ordem padrão
  return TECH_KEYS.filter((k) => d[k]);
};

// SaveButton próprio
const SaveButton = ({ section, hasChanges, isSaving, onSave, everSaved }) => {
  if (isSaving) {
    return (
      <button
        disabled
        className="px-3 py-1.5 bg-gray-400 text-white rounded text-sm flex items-center gap-1.5 w-full sm:w-auto"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
        Salvando...
      </button>
    );
  }

  if (!hasChanges && everSaved) {
    return (
      <button
        disabled
        className="px-3 py-1.5 bg-green-500 text-white rounded text-sm w-full sm:w-auto"
      >
        ✓ Salvo
      </button>
    );
  }

  if (hasChanges) {
    return (
      <button
        onClick={onSave}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 w-full sm:w-auto"
      >
        💾 Salvar {section}
      </button>
    );
  }

  return (
    <button
      disabled
      className="px-3 py-1.5 bg-gray-200 text-gray-500 rounded text-sm w-full sm:w-auto"
    >
      Salvar {section}
    </button>
  );
};

// Função de geração própria do componente
export const generateTechniqueText = (technique, admission) => {
  const texts = [];
  if (!technique) return '';

  // Ordem: respeita technique.techOrder quando presente; caso contrário, ordem padrão
  const order = Array.isArray(technique.techOrder)
    ? technique.techOrder.filter((k) => TECH_KEYS.includes(k) && technique[k])
    : TECH_KEYS.filter((k) => technique[k]);

  order.forEach((key) => {
    if (key === 'geral') {
      const hasEstablishedAirway = admission?.airway === 'protegida_artificialmente_iot' || admission?.airway === 'protegida_artificialmente_traqueostomia';
      if (hasEstablishedAirway) {
        texts.push(
          "Acoplo paciente à estação de anestesia mantendo parâmetros ventilatórios. Utilizo drogas descritas na seção de medicações para manutenção anestésica"
        );
      } else {
        const instrumento = technique.instrumentoAcesso || 'laringoscopia direta';
        const tot = technique.totNumber?.trim?.() || '7.0';
        const cormack = technique.cormack || 'I';
        const fixacao = technique.fixacao?.trim?.() || '21';
        texts.push(
          `Indução anestésica: a) Desnitrogenização com O₂ 100%; b) Drogas utilizadas conforme seção de medicamentos; c) Intubação orotraqueal com TOT n° ${tot} sob ${instrumento} (Cormack-Lehane ${cormack}); d) Tubo fixado a ${fixacao} cm na comissura labial. Manutenção com drogas descritas em seção de medicações, sob ventilação mecânica. Parâmetros ventilatórios e monitoração contínua mantidos; proteção ocular.`
        );
      }
    }
    if (key === 'raquianestesia') {
      const pos = technique.raquiPosicao; // 'sentado' | 'decubito' (decúbito lateral)
      const nivel = technique.raquiNivel === 'outro' ? (technique.raquiNivelOutro || '').trim() : technique.raquiNivel; // 'L2-L3' | 'L3-L4' | 'L4-L5' | 'L5-S1' | outro texto
      const agulhaTipo = technique.raquiAgulhaTipo; // 'Quincke' | 'Whitacre' | 'Sprotte'
      const agulhaGauge = technique.raquiAgulhaGauge; // '25G' | '26G' | '27G' | '29G'

      const parts = [];
      // Posição
      if (pos === 'sentado') {
        parts.push('posicionamento em sentado');
      } else if (pos === 'decubito') {
        parts.push('posicionamento em decúbito lateral');
      }
      // Antissepsia sempre presente
      parts.push('assepsia e antissepsia');
      // Nível + agulha (se disponíveis)
      const puncoes = [];
      if (nivel) puncoes.push(`punção ${nivel}`);
      if (agulhaTipo || agulhaGauge) {
        const agulha = `${agulhaTipo ? agulhaTipo : ''}${agulhaTipo && agulhaGauge ? ' ' : ''}${agulhaGauge ? agulhaGauge : ''}`.trim();
        if (agulha) puncoes.push(`com agulha ${agulha}`);
      }
      if (puncoes.length) parts.push(puncoes.join(' '));
      // LCR
      parts.push('LCR límpido');
      // Medicações
      parts.push('medicações conforme seção de medicamentos');

      if (pos || nivel || agulhaTipo || agulhaGauge) {
        // Texto detalhado (quando há pelo menos um parâmetro informado)
        texts.push(
          `Raquianestesia: ${parts.join('; ')}. Teste de bloqueio com estímulos térmicos e motores.`
        );
      } else {
        // Compat: mantém o texto padrão quando usuário não preencheu parâmetros
        texts.push(
          `Raquianestesia: a) Posicionamento em decúbito lateral; b) Assepsia e antissepsia; c) Punção única no espaço subaracnóide, LCR límpido; d) Medicações conforme seção de medicamentos. e) Teste de bloqueio com estímulos térmicos e motores.`
        );
      }
    }
    if (key === 'sedacao') {
      const nivel = technique.sedacaoNivel; // 'leve' | 'moderada' | 'profunda'
      const modo = technique.sedacaoModo;   // 'IV' | 'inalatoria' | 'combinada'
      const oxig = technique.sedacaoOxigenio; // 'baraka_mapleson_a' | 'cateter_nasal' | 'venturi_mask'
      const circuito = technique.sedacaoCircuito; // 'baraka_mapleson_a' | 'mascara_facial'

      const nivelTxt = nivel ? `Sedação ${nivel}` : 'Sedação';
      const modoLabelMap = { IV: 'IV', inalatoria: 'inalatória', combinada: 'combinada' };
      const modoTxt = modo ? `, ${modoLabelMap[modo] || modo}` : '';

      const parts = [`${nivelTxt}${modoTxt}, utilizando medicações descritas na seção de medicamentos`];

      if (modo === 'IV' || !modo) {
        let o2Txt = '';
        if (oxig === 'baraka_mapleson_a') o2Txt = 'suplementação de O₂ por sistema Baraka/Mapleson A';
        if (oxig === 'cateter_nasal') o2Txt = 'suplementação de O₂ por cateter nasal';
        if (oxig === 'venturi_mask') o2Txt = 'suplementação de O₂ por máscara de Venturi';
        if (o2Txt) parts.push(o2Txt);
      } else if (modo === 'inalatoria' || modo === 'combinada') {
        let circTxt = '';
        let o2Txt = '';
        if (circuito === 'baraka_mapleson_a') {
          circTxt = '';
          o2Txt = 'suplementação de O₂ por sistema Baraka/Mapleson A';
        }
        if (circuito === 'mascara_facial') {
          circTxt = 'por máscara facial';
          o2Txt = 'suplementação de O₂ por máscara facial';
        }
        if (circTxt) parts.push(circTxt);
        if (o2Txt) parts.push(o2Txt);
      }

      texts.push(parts.join(', ') + '.');
    }
    if (key === 'peridural') {
      const pos = technique.peridPosicao; // 'sentado' | 'decubito'
      const nivel = technique.peridNivel === 'outro' ? (technique.peridNivelOutro || '').trim() : technique.peridNivel; // níveis torácicos/lombares
      const gauge = technique.peridAgulhaGauge; // '17G' | '18G' | '20G'
      const ident = technique.peridIdentificacao; // 'Gutierrez' | 'Dogliotti'
      const cateter = (technique.peridCateterCm || '').trim(); // cm na pele

      const linhaA = [];
      // a) Posição
      if (pos === 'sentado') linhaA.push('Posiciono paciente sentado em mesa cirúrgica');
      else if (pos === 'decubito') linhaA.push('Posiciono paciente em decúbito lateral');
      else linhaA.push('Posiciono paciente');

      // b) Antissepsia
      const linhaB = 'Assepsia e antissepsia das mãos e dorso do paciente.';

      // c) Agulha, nível, confirmação
      const partsC = [];
      partsC.push(`Agulha ${gauge || '18G'} Tuohy, punção única.`);
      if (nivel) partsC.push(`Entre ${nivel}`);
      const identTxt = ident ? `confirmação de espaço peridural pela técnica de ${ident}` : '';
      if (identTxt) partsC.push(identTxt);
      const linhaC = partsC.join(' ');

      // d) Segurança + cateter + drogas
      const cateterTxt = cateter ? `Cateter inserido ${cateter} cm na pele.` : 'Cateter não inserido.';
      const linhaD = `Sem acidentes de punção, retorno de líquor ou sangue. Teste de injeção de adrenalina negativo. ${cateterTxt} Injeto drogas descritas na seção de medicamentos. Não observo deformação da bolha de ar à seringa.`;

      texts.push(
        `Peridural:` +
        `a) ${linhaA.join(' ')} b) ${linhaB} c) ${linhaC} d) ${linhaD}`
      );
    }

    if (key === 'periferico') {
      const guiaMap = {
        US: 'à ultrassonografia',
        neuro: 'à neuroestimulação',
        'US+neuro': 'à ultrassonografia e neuroestimulação',
        landmark: 'por Pontos de Referência Anatômicos'
      };
      const guiaTxt = guiaMap[technique.perifGuia] || 'à ultrassonografia';

      const joinList = (arr = []) => {
        const a = arr.filter(Boolean);
        if (a.length <= 1) return a.join('');
        if (a.length === 2) return a.join(' e ');
        return a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
      };

      const allSites = [];

      // Plexo braquial
      (technique.perifPlexoBraquial || []).forEach((s) => {
        const label = {
          interescalenica: 'interescalênica',
          supraclavicular: 'supraclavicular',
          infraclavicular: 'infraclavicular',
          axilar: 'axilar',
        }[s] || s;
        if (label) allSites.push(label);
      });

      (technique.perifMembroInferior || []).forEach((s) => {
        const label = {
          femoral: 'femoral',
          adutor: 'do canal adutor',
          sciatico_gluteo: 'ciático (glúteo)',
          sciatico_popliteo: 'ciático (poplíteo)',
        }[s] || s;
        if (label) allSites.push(label);
      });

      (technique.perifParedeToracAbd || []).forEach((s) => {
        const label = {
          tap: 'TAP',
          pecs1: 'PECS I',
          pecs2: 'PECS II',
          serratus: 'serrátil',
          paravertebral_toracico: 'paravertebral torácico',
        }[s] || s;
        if (label) allSites.push(label);
      });

      const outrosArr = Array.isArray(technique.perifOutros) ? technique.perifOutros : [];
      outrosArr.forEach((s) => {
        const label = { ilioinguinal: 'ílioinguinal/ílio-hipogástrico' }[s] || s;
        if (label && label !== 'outro') allSites.push(label);
      });
      const outroTexto = (technique.perifOutroTexto || '').trim();
      if (outroTexto) allSites.push(outroTexto);

      if (allSites.length) {
        const lista = joinList(allSites);
        texts.push(
          `Assepsia de região ${lista}. Visualização de estruturas nervosas ${guiaTxt}. Injeção de anestésico local conforme seção de medicações. Procedimento sem intercorrências.`
        );
      }
    }
  });

  // Apêndice opcional ao final quando houver ao menos uma técnica
  if (texts.length > 0) {
    texts.push('Revisão de posicionamento realizada');
  }
  return texts.join('\n');
};

const AnesthesiaDescriptionTechnique = ({
  data,
  onChange,
  onSave,
  hasChanges,
  isSaving,
  everSaved,
  suggestedTOT,
  admission,
  isChild
}) => {
  const activeInOrder = getActiveInOrder(data);
  const remaining = TECH_KEYS.filter((k) => !activeInOrder.includes(k));
  // Pills: ativos (ordem escolhida) primeiro, depois os demais
  const pillOrder = [...activeInOrder, ...remaining];
  // Parâmetros: só os ativos, na mesma ordem
  const paramsOrder = activeInOrder;

  return (
    <div className="bg-white border rounded-lg p-3 sm:p-4">
      <div className="flex items-center mb-3">
        <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Técnica Anestésica</h3>
      </div>
      
      <div className="space-y-4">
        {/* Pills das técnicas com ordem de seleção */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Técnicas</div>
          <div className="flex flex-wrap gap-2">
            {pillOrder.map((key) => {
              const active = !!data[key];
              const orderIndex = Array.isArray(data.techOrder) ? data.techOrder.indexOf(key) : -1;
              const orderBadge = active && orderIndex !== -1 ? orderIndex + 1 : null;
              return (
                <button
                  key={key}
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  onClick={() => {
                    const next = !active;
                    // alterna a flag
                    onChange(key, next);
                    // atualiza a ordem
                    let current = Array.isArray(data.techOrder) ? [...data.techOrder] : [];
                    if (next) {
                      if (!current.includes(key)) current.push(key);
                    } else {
                      current = current.filter(k => k !== key);
                    }
                    onChange('techOrder', current);
                  }}
                  className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center whitespace-nowrap truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {orderBadge ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-white/20 border border-white/30">
                        {orderBadge}
                      </span>
                    ) : (
                      <span className="inline-block w-5" aria-hidden></span>
                    )}
                    {TECH_LABELS[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parâmetros ordenados pela seleção */}
        {paramsOrder.map((key) => {
          if (key === 'geral') {
            return (
              <fieldset key={key} className="border rounded-md p-3">
                <legend className="text-xs font-medium text-gray-600 px-1">Parâmetros — Anestesia Geral</legend>
                {(() => {
                  const hasEstablishedAirway = admission?.airway === 'protegida_artificialmente_iot' || admission?.airway === 'protegida_artificialmente_traqueostomia';
                  if (hasEstablishedAirway) {
                    return (
                      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 text-blue-900 p-3">
                        <span aria-hidden>ℹ️</span>
                        <div className="text-sm">
                          Via aérea já garantida (IOT/Traqueostomia) conforme admissão. Os campos de intubação (TOT nº, Cormack, Fixação) foram ocultados. O texto gerado usará o resumo de acoplamento e manutenção.
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor={id('instrumentoAcesso')} className="block text-xs text-gray-600 mb-1">Instrumento de acesso</label>
                        <select
                          id={id('instrumentoAcesso')}
                          value={data.instrumentoAcesso || ''}
                          onChange={(e) => onChange('instrumentoAcesso', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        >
                          <option value="">Laringoscopia direta</option>
                          <option value="videolaringoscopia">Videolaringoscopia</option>
                          <option value="fibrobroncoscopia">Fibrobroncoscopia</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor={id('totNumber')} className="block text-xs text-gray-600 mb-1">TOT nº</label>
                        <input
                          id={id('totNumber')}
                          type="text"
                          inputMode="numeric"
                          value={data.totNumber || ''}
                          onChange={(e) => onChange('totNumber', e.target.value)}
                          placeholder={suggestedTOT}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor={id('cormack')} className="block text-xs text-gray-600 mb-1">Cormack-Lehane</label>
                        <select 
                          id={id('cormack')}
                          value={data.cormack || ''} 
                          onChange={(e) => onChange('cormack', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        >
                          <option value="">-</option>
                          {CORMACK_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={id('fixacao')} className="block text-xs text-gray-600 mb-1">Fixação (cm)</label>
                        <input
                          id={id('fixacao')}
                          type="text"
                          inputMode="numeric"
                          value={data.fixacao || ''}
                          onChange={(e) => onChange('fixacao', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  );
                })()}
              </fieldset>
            );
          }

          if (key === 'peridural') {
            return (
              <fieldset key={key} className="border rounded-md p-3">
                <legend className="text-xs font-medium text-gray-600 px-1">Parâmetros — Peridural</legend>

                {/* Sugerido: presets contextuais */}
                {isChild ? (
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-gray-600">Sugestão: pediátrico (mais comum)</p>
                    <button
                      type="button"
                      onClick={() => {
                        onChange('peridPosicao', 'sentado');
                        onChange('peridNivel', 'L4-L5');
                        onChange('peridAgulhaGauge', '20G');
                        onChange('peridIdentificacao', 'Dogliotti');
                        onChange('peridCateterCm', '4');
                      }}
                      className="px-2.5 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-xs text-gray-800"
                    >
                      Aplicar preset pediátrico
                    </button>
                  </div>
                ) : (
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-gray-600">Sugestão: adulto (mais comum)</p>
                    <button
                      type="button"
                      onClick={() => {
                        onChange('peridPosicao', 'sentado');
                        onChange('peridNivel', 'L3-L4');
                        onChange('peridAgulhaGauge', '18G');
                        onChange('peridIdentificacao', 'Dogliotti');
                        onChange('peridCateterCm', '6');
                      }}
                      className="px-2.5 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-xs text-gray-800"
                    >
                      Aplicar preset adulto
                    </button>
                  </div>
                )}

                {/* Posição */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Posição do paciente</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'sentado', label: 'Sentado' },
                      { key: 'decubito', label: 'Decúbito lateral' },
                    ].map(opt => {
                      const active = data.peridPosicao === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => onChange('peridPosicao', active ? '' : opt.key)}
                          className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center whitespace-nowrap truncate ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nível de punção */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={id('peridNivel')} className="block text-xs text-gray-600 mb-1">Nível de punção</label>
                    <select
                      id={id('peridNivel')}
                      value={data.peridNivel || ''}
                      onChange={(e) => onChange('peridNivel', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">-</option>
                      <option value="T5-T6">T5–T6</option>
                      <option value="T6-T7">T6–T7</option>
                      <option value="T7-T8">T7–T8</option>
                      <option value="T8-T9">T8–T9</option>
                      <option value="T9-T10">T9–T10</option>
                      <option value="L1-L2">L1–L2</option>
                      <option value="L2-L3">L2–L3</option>
                      <option value="L3-L4">L3–L4</option>
                      <option value="L4-L5">L4–L5</option>
                      <option value="outro">Outro…</option>
                    </select>
                  </div>
                  {data.peridNivel === 'outro' && (
                    <div>
                      <label htmlFor={id('peridNivelOutro')} className="block text-xs text-gray-600 mb-1">Especifique o nível</label>
                      <input
                        id={id('peridNivelOutro')}
                        type="text"
                        value={data.peridNivelOutro || ''}
                        onChange={(e) => onChange('peridNivelOutro', e.target.value)}
                        placeholder="ex.: T10–T11"
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}

                  {/* Agulha - tipo fixo + calibre */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Agulha</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value="Tuohy"
                        disabled
                        className="w-full border rounded px-2 py-1 text-sm bg-gray-100 text-gray-600"
                      />
                      <select
                        id={id('peridAgulhaGauge')}
                        value={data.peridAgulhaGauge || ''}
                        onChange={(e) => onChange('peridAgulhaGauge', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        <option value="">-</option>
                        <option value="20G">20G</option>
                        <option value="17G">17G</option>
                        <option value="18G">18G</option>
                      </select>
                    </div>
                  </div>

                  {/* Técnica de identificação */}
                  <div>
                    <label htmlFor={id('peridIdentificacao')} className="block text-xs text-gray-600 mb-1">Técnica de identificação</label>
                    <select
                      id={id('peridIdentificacao')}
                      value={data.peridIdentificacao || ''}
                      onChange={(e) => onChange('peridIdentificacao', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">-</option>
                      <option value="Dogliotti">Dogliotti</option>
                      <option value="Gutierrez">Gutierrez</option>
                    </select>
                  </div>

                  {/* Cateter (cm na pele) */}
                  <div>
                    <label htmlFor={id('peridCateterCm')} className="block text-xs text-gray-600 mb-1">Cateter (cm na pele)</label>
                    <input
                      id={id('peridCateterCm')}
                      type="text"
                      inputMode="numeric"
                      value={data.peridCateterCm || ''}
                      onChange={(e) => onChange('peridCateterCm', e.target.value)}
                      placeholder="ex.: 5–6"
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </fieldset>
            );
          }

          if (key === 'periferico') {
            return (
              <fieldset key={key} className="border rounded-md p-3">
                <legend className="text-xs font-medium text-gray-600 px-1">Parâmetros — Bloqueio periférico</legend>

                {/* Guia (opcional) */}
                <div className="mb-3">
                  <label htmlFor={id('perifGuia')} className="block text-xs text-gray-600 mb-1">Guia</label>
                  <select
                    id={id('perifGuia')}
                    value={data.perifGuia || ''}
                    onChange={(e) => onChange('perifGuia', e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="">Ultrassom</option>
                    <option value="neuro">Neuroestimulação</option>
                    <option value="US+neuro">US + Neuroestimulação</option>
                    <option value="landmark">Referências Anatômicos</option>
                  </select>
                </div>

                {/* Plexo braquial */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-600 mb-1">Plexo braquial</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2">
                    {[
                      { key: 'interescalenica', label: 'Interescalênica' },
                      { key: 'supraclavicular', label: 'Supraclavicular' },
                      { key: 'infraclavicular', label: 'Infraclavicular' },
                      { key: 'axilar', label: 'Axilar' },
                    ].map(opt => {
                      const arr = Array.isArray(data.perifPlexoBraquial) ? data.perifPlexoBraquial : [];
                      const active = arr.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            const curr = Array.isArray(data.perifPlexoBraquial) ? [...data.perifPlexoBraquial] : [];
                            const idx = curr.indexOf(opt.key);
                            if (idx === -1) curr.push(opt.key); else curr.splice(idx,1);
                            onChange('perifPlexoBraquial', curr);
                          }}
                          className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Membro inferior */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-600 mb-1">Membro inferior</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2">
                    {[
                      { key: 'femoral', label: 'Femoral' },
                      { key: 'adutor', label: 'Adutor do canal' },
                      { key: 'sciatico_gluteo', label: 'Ciático (glúteo)' },
                      { key: 'sciatico_popliteo', label: 'Ciático (poplíteo)' },
                    ].map(opt => {
                      const arr = Array.isArray(data.perifMembroInferior) ? data.perifMembroInferior : [];
                      const active = arr.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            const curr = Array.isArray(data.perifMembroInferior) ? [...data.perifMembroInferior] : [];
                            const idx = curr.indexOf(opt.key);
                            if (idx === -1) curr.push(opt.key); else curr.splice(idx,1);
                            onChange('perifMembroInferior', curr);
                          }}
                          className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Parede torácica/abdome */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-600 mb-1">Parede torácica / abdome</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2">
                    {[
                      { key: 'tap', label: 'TAP' },
                      { key: 'pecs1', label: 'PECS I' },
                      { key: 'pecs2', label: 'PECS II' },
                      { key: 'serratus', label: 'Serrátil' },
                      { key: 'paravertebral_toracico', label: 'Paravertebral torácico' },
                    ].map(opt => {
                      const arr = Array.isArray(data.perifParedeToracAbd) ? data.perifParedeToracAbd : [];
                      const active = arr.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            const curr = Array.isArray(data.perifParedeToracAbd) ? [...data.perifParedeToracAbd] : [];
                            const idx = curr.indexOf(opt.key);
                            if (idx === -1) curr.push(opt.key); else curr.splice(idx,1);
                            onChange('perifParedeToracAbd', curr);
                          }}
                          className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Outros */}
                <div className="mb-1">
                  <div className="text-xs font-medium text-gray-600 mb-1">Outros</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2 mb-2">
                    {[
                      { key: 'ilioinguinal', label: 'Ílioinguinal/Ílio-hipogástrico' },
                      { key: 'outro', label: 'Outro…' },
                    ].map(opt => {
                      const arr = Array.isArray(data.perifOutros) ? data.perifOutros : [];
                      const active = arr.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            const curr = Array.isArray(data.perifOutros) ? [...data.perifOutros] : [];
                            const idx = curr.indexOf(opt.key);
                            if (idx === -1) curr.push(opt.key); else curr.splice(idx,1);
                            onChange('perifOutros', curr);
                          }}
                          className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {Array.isArray(data.perifOutros) && data.perifOutros.includes('outro') && (
                    <div>
                      <label htmlFor={id('perifOutroTexto')} className="block text-xs text-gray-600 mb-1">Especifique (outro)</label>
                      <input
                        id={id('perifOutroTexto')}
                        type="text"
                        value={data.perifOutroTexto || ''}
                        onChange={(e) => onChange('perifOutroTexto', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Ex.: lateral femoral cutâneo, obturatório, safeno…"
                      />
                    </div>
                  )}
                </div>
              </fieldset>
            );
          }

          if (key === 'sedacao') {
            return (
              <fieldset key={key} className="border rounded-md p-3">
                <legend className="text-xs font-medium text-gray-600 px-1">Parâmetros — Sedação</legend>

                {/* Presets — Sedação */}
                {isChild ? (
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-gray-600">Sugestão: pediátrico (mais comum)</p>
                    <button
                      type="button"
                      onClick={() => {
                        onChange('sedacaoNivel', 'leve');
                        onChange('sedacaoModo', 'inalatoria');
                        onChange('sedacaoCircuito', 'baraka_mapleson_a');
                        onChange('sedacaoOxigenio', '');
                      }}
                      className="px-2.5 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-xs text-gray-800"
                    >
                      Aplicar preset pediátrico
                    </button>
                  </div>
                ) : (
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-gray-600">Sugestão: adulto (mais comum)</p>
                    <button
                      type="button"
                      onClick={() => {
                        onChange('sedacaoNivel', 'moderada');
                        onChange('sedacaoModo', 'IV');
                        onChange('sedacaoOxigenio', 'cateter_nasal');
                        onChange('sedacaoCircuito', '');
                      }}
                      className="px-2.5 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-xs text-gray-800"
                    >
                      Aplicar preset adulto
                    </button>
                  </div>
                )}

                {/* Nível de sedação */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Nível</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'leve', label: 'Leve' },
                      { key: 'moderada', label: 'Moderada' },
                      { key: 'profunda', label: 'Profunda' },
                    ].map(opt => {
                      const active = data.sedacaoNivel === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => onChange('sedacaoNivel', active ? '' : opt.key)}
                          className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center whitespace-nowrap truncate ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Modo de sedação */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Modo</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'IV', label: 'IV' },
                      { key: 'inalatoria', label: 'Inalatória' },
                      { key: 'combinada', label: 'Combinada' },
                    ].map(opt => {
                      const active = data.sedacaoModo === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            const next = active ? '' : opt.key;
                            onChange('sedacaoModo', next);
                            // Ajusta circuito ou oxigênio conforme regras
                            if (next === 'inalatoria' || next === 'combinada') {
                              onChange('sedacaoCircuito', isChild ? 'baraka_mapleson_a' : 'mascara_facial');
                              onChange('sedacaoOxigenio', ''); // não aplicável
                            } else if (next === 'IV' || next === '') {
                              onChange('sedacaoCircuito', ''); // não aplicável
                            }
                          }}
                          className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center whitespace-nowrap truncate ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Oxigênio (apenas quando modo = IV) */}
                {(data.sedacaoModo === 'IV' || !data.sedacaoModo) && (
                  <div className="mb-1">
                    <label className="block text-xs text-gray-600 mb-1">Oxigênio</label>
                    <div className="flex flex-wrap gap-2">
                      {(isChild
                        ? [{ key: 'baraka_mapleson_a', label: 'Baraka/Mapleson A' }]
                        : [
                            { key: 'cateter_nasal', label: 'Cateter nasal' },
                            { key: 'venturi_mask', label: 'Máscara de Venturi' },
                          ]
                      ).map(opt => {
                        const active = data.sedacaoOxigenio === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => onChange('sedacaoOxigenio', active ? '' : opt.key)}
                            className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center whitespace-nowrap truncate ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </fieldset>
            );
          }

          if (key === 'raquianestesia') {
            return (
              <fieldset key={key} className="border rounded-md p-3">
                <legend className="text-xs font-medium text-gray-600 px-1">Parâmetros — Raquianestesia</legend>
                {/* Sugerido pelo perfil etário */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-gray-600">
                    {isChild ? 'Sugestão: pediátrico (mais comum)' : 'Sugestão: adulto (mais comum)'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (isChild) {
                        onChange('raquiPosicao', 'sentado');
                        onChange('raquiAgulhaTipo', 'Quincke');
                        onChange('raquiAgulhaGauge', '27G');
                        onChange('raquiNivel', 'L4-L5');
                      } else {
                        onChange('raquiPosicao', 'sentado');
                        onChange('raquiAgulhaTipo', 'Quincke');
                        onChange('raquiAgulhaGauge', '27G');
                        onChange('raquiNivel', 'L3-L4');
                      }
                    }}
                    className="px-2.5 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-xs text-gray-800"
                  >
                    Aplicar preset {isChild ? 'pediátrico' : 'adulto'}
                  </button>
                </div>

                {/* Posição */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Posição do paciente</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'sentado', label: 'Sentado' },
                      { key: 'decubito', label: 'Decúbito lateral' },
                    ].map(opt => {
                      const active = data.raquiPosicao === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => onChange('raquiPosicao', active ? '' : opt.key)}
                          className={`px-4 rounded-full text-sm border transition select-none w-full sm:w-auto sm:min-w-[10rem] h-9 flex items-center justify-center whitespace-nowrap truncate ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nível de punção */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={id('raquiNivel')} className="block text-xs text-gray-600 mb-1">Nível de punção</label>
                    <select
                      id={id('raquiNivel')}
                      value={data.raquiNivel || ''}
                      onChange={(e) => onChange('raquiNivel', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">-</option>
                      <option value="L2-L3">L2–L3</option>
                      <option value="L3-L4">L3–L4</option>
                      <option value="L4-L5">L4–L5</option>
                      <option value="L5-S1">L5–S1</option>
                      <option value="outro">Outro…</option>
                    </select>
                  </div>
                  {data.raquiNivel === 'outro' && (
                    <div>
                      <label htmlFor={id('raquiNivelOutro')} className="block text-xs text-gray-600 mb-1">Especifique o nível</label>
                      <input
                        id={id('raquiNivelOutro')}
                        type="text"
                        value={data.raquiNivelOutro || ''}
                        onChange={(e) => onChange('raquiNivelOutro', e.target.value)}
                        placeholder="ex.: L1–L2"
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}

                  {/* Agulha - tipo */}
                  <div>
                    <label htmlFor={id('raquiAgulhaTipo')} className="block text-xs text-gray-600 mb-1">Agulha</label>
                    <select
                      id={id('raquiAgulhaTipo')}
                      value={data.raquiAgulhaTipo || ''}
                      onChange={(e) => onChange('raquiAgulhaTipo', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">-</option>
                      <option value="Quincke">Quincke</option>
                      <option value="Whitacre">Whitacre</option>
                      <option value="Sprotte">Sprotte</option>
                    </select>
                  </div>

                  {/* Agulha - Gauge */}
                  <div>
                    <label htmlFor={id('raquiAgulhaGauge')} className="block text-xs text-gray-600 mb-1">Calibre</label>
                    <select
                      id={id('raquiAgulhaGauge')}
                      value={data.raquiAgulhaGauge || ''}
                      onChange={(e) => onChange('raquiAgulhaGauge', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">-</option>
                      <option value="25G">25G</option>
                      <option value="26G">26G</option>
                      <option value="27G">27G</option>
                      <option value="29G">29G</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            );
          }

          return null;
        })}
      </div>
      
      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 sm:p-4 rounded select-text" aria-live="polite">
        {generateTechniqueText(data, admission) || 'Selecione a técnica anestésica...'}
      </div>

      <div className="mt-3 sm:mt-4">
        <SaveButton
          section="Técnica"
          hasChanges={hasChanges}
          isSaving={isSaving}
          onSave={onSave}
          everSaved={everSaved}
        />
      </div>
    </div>
  );
};

export default AnesthesiaDescriptionTechnique;