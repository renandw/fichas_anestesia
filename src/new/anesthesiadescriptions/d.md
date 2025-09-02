Cerne da aplicação:
Objetivo principal: Auxiliar anestesiologistas a criar descrições anestésicas padronizadas e completas através de um wizard em 4 etapas.
Como funciona:

Wizard em 4 etapas sequenciais:

Monitorização: Seleção dos equipamentos de monitoramento utilizados
Admissão: Condições do paciente ao chegar na sala (ventilação, hemodinâmica, consciência, acessos venosos)
Tipo de Anestesia: Escolha e configuração das técnicas anestésicas (geral, raqui, peridural, sedação, etc.)
Finalização: Condições de término e destino do paciente

2. Inteligência adaptativa:
Cálculos automáticos baseados em dados do paciente:

getSuggestedTOT(): Calcula diâmetro do tubo orotraqueal usando fórmulas específicas

Para < 1 ano: TOT 3.0
Para < 12 anos: (idade/4) + 3.5
Para adultos: 7.0 (feminino) ou 7.5 (masculino)


getSuggestedFixationCm(): Calcula profundidade de fixação (TOT × 3 para pediátricos, valores fixos para adultos)

Diferenciação etária automática:

isPediatric: Determina se paciente < 12 anos
isYoungChild: Identifica se ≤ 5 anos
getPediatricAgeGroup(): Categoriza em recém-nascido/pré-escolar/escolar/adolescente
formatPatientAge(): Formata idade em anos/meses/dias conforme faixa etária

Adaptações condicionais:

Templates de sedação diferentes para crianças ≤ 5 anos vs adultos
Campos de consciência específicos (adulto vs pediátrico)
Cálculos de peso e dosagens adaptados à idade

3. Geração automática de texto médico:
Funções geradoras especializadas:

generateMonitoringText(): Converte checkboxes em lista formatada ("Monitorização: cardioscopia, oximetria, PANI.")
generateAdmissionText(): Transforma dados estruturados em narrativa de admissão
generateAnesthesiaTypeText(): Gera descrições técnicas específicas por tipo de anestesia
generateCompletionText(): Cria texto de finalização padronizado

Sistema de templates por tipo:

Anestesia geral: Template com desnitrogenização, drogas, intubação, parâmetros ventilatórios
Raquianestesia: Template com posicionamento, assepsia, punção, teste de bloqueio
Peridural: Template com técnica de Doglioti, testes específicos
Sedação: Templates diferentes para adultos (cateter nasal) vs pediátricos (sistema Baraka)

Montagem final:

generateFullPreviewFromData(): Concatena todas as seções em sequência
getFinalText(): Retorna versão manual editada ou gerada automaticamente
Preserva formatação médica com quebras de linha e estrutura padronizada

Mapeamento de dados estruturados para linguagem natural:

Converte códigos (vm_invasiva → "ventilação mecânica invasiva")
Formata dosagens e unidades automaticamente
Aplica terminologia médica consistente

Controles de qualidade:

Sistema de finalização (trava edições)
Backup entre texto automático vs manual
Validações de completude