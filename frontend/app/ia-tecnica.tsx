import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const CATEGORIAS = [
  { id: "diagnostico", icon: "search", label: "Diagnóstico", desc: "Identificar defeito" },
  { id: "testes", icon: "checklist", label: "Testes", desc: "Sugestão de testes" },
  { id: "codigos", icon: "error-outline", label: "Códigos", desc: "Códigos de erro" },
  { id: "biblioteca", icon: "menu-book", label: "Biblioteca", desc: "Consulta técnica" },
];

const EQUIPAMENTOS_COMUNS = [
  "Ar Condicionado Split",
  "Ar Condicionado Janela",
  "Geladeira",
  "Freezer",
  "Máquina de Lavar",
  "Micro-ondas",
  "Câmara Fria",
];

const DEFEITOS_COMUNS: { [key: string]: string[] } = {
  "Ar Condicionado Split": [
    "Não liga",
    "Não gela",
    "Gela pouco",
    "Barulho estranho",
    "Vazamento de água",
    "Mau cheiro",
    "Compressor não parte",
    "Placa queimada",
    "Sensor com defeito",
    "Gás vazando",
  ],
  "Ar Condicionado Janela": [
    "Não liga",
    "Não gela",
    "Gela pouco",
    "Barulho estranho",
    "Vazamento de água",
    "Mau cheiro",
    "Compressor não parte",
    "Capacitor queimado",
    "Ventilador travado",
    "Termostato com defeito",
  ],
  "Geladeira": [
    "Não liga",
    "Não gela",
    "Gela demais",
    "Barulho",
    "Vazamento",
    "Compressor não parte",
    "Degelo com problema",
    "Borracha danificada",
  ],
  "Freezer": [
    "Não liga",
    "Não congela",
    "Congela demais",
    "Barulho",
    "Vazamento",
    "Compressor não parte",
    "Acúmulo de gelo",
    "Tampa não veda",
  ],
  "Máquina de Lavar": [
    "Não liga",
    "Não centrifuga",
    "Não enche água",
    "Não drena",
    "Barulho na centrifugação",
    "Vazamento",
    "Placa com defeito",
    "Motor travado",
  ],
  "Micro-ondas": [
    "Não liga",
    "Não aquece",
    "Faz barulho",
    "Faíscas internas",
    "Painel não funciona",
    "Porta não trava",
    "Prato não gira",
  ],
  "Câmara Fria": [
    "Não liga",
    "Não gela",
    "Temperatura instável",
    "Compressor não parte",
    "Formação de gelo excessivo",
    "Vazamento de gás",
    "Porta com vedação ruim",
    "Ventilador parado",
  ],
  "default": [
    "Não liga",
    "Não funciona corretamente",
    "Barulho anormal",
    "Vazamento",
    "Superaquecimento",
    "Erro no display",
    "Componente queimado",
  ],
};

interface DiagnosticoInfo {
  causas: string[];
  solucoes: string[];
  ferramentas: string[];
  tempoEstimado: string;
  dificuldade: "Fácil" | "Médio" | "Difícil";
}

const DIAGNOSTICOS: { [key: string]: { [key: string]: DiagnosticoInfo } } = {
  "Ar Condicionado Split": {
    "Não liga": {
      causas: [
        "Disjuntor desarmado ou fusível queimado",
        "Cabo de força danificado",
        "Placa eletrônica queimada",
        "Capacitor do compressor em curto",
        "Transformador da placa com defeito",
      ],
      solucoes: [
        "Verificar disjuntor e religá-lo",
        "Testar cabo de força com multímetro (continuidade)",
        "Inspecionar placa visualmente (componentes queimados)",
        "Medir tensão na entrada da placa (220V ou 127V)",
        "Substituir capacitor se estiver estufado",
        "Trocar placa eletrônica se necessário",
      ],
      ferramentas: ["Multímetro", "Chave Phillips", "Alicate"],
      tempoEstimado: "30-60 min",
      dificuldade: "Médio",
    },
    "Não gela": {
      causas: [
        "Gás refrigerante insuficiente (vazamento)",
        "Compressor com defeito (não comprime)",
        "Filtro secador obstruído",
        "Válvula de expansão travada",
        "Sensor de temperatura com defeito",
        "Ventilador da evaporadora parado",
      ],
      solucoes: [
        "Verificar pressão do gás com manifold",
        "Testar amperagem do compressor (deve estar dentro da faixa)",
        "Verificar se há gelo no filtro secador (indica obstrução)",
        "Limpar filtros de ar da evaporadora",
        "Testar sensor com multímetro (resistência vs temperatura)",
        "Verificar ventilador (motor e capacitor)",
        "Se gás baixo: localizar vazamento, soldar e recarregar",
      ],
      ferramentas: ["Manifold", "Multímetro", "Detector de vazamento", "Balança de gás", "Bomba de vácuo"],
      tempoEstimado: "1-3 horas",
      dificuldade: "Difícil",
    },
    "Gela pouco": {
      causas: [
        "Carga de gás baixa (vazamento parcial)",
        "Filtros de ar sujos/obstruídos",
        "Ambiente muito quente ou mal isolado",
        "Compressor com perda de eficiência",
        "Serpentina suja (evaporadora ou condensadora)",
      ],
      solucoes: [
        "Limpar filtros de ar",
        "Limpar serpentina da condensadora (unidade externa)",
        "Verificar pressão do gás",
        "Verificar se o ambiente está vedado",
        "Checar se o BTU é adequado para o ambiente",
      ],
      ferramentas: ["Manifold", "Lavadora de alta pressão", "Termômetro"],
      tempoEstimado: "30-90 min",
      dificuldade: "Fácil",
    },
    "Barulho estranho": {
      causas: [
        "Ventilador da condensadora com folga",
        "Compressor com vibração excessiva",
        "Peças soltas na unidade externa",
        "Rolamento do motor desgastado",
        "Hélice rachada ou desbalanceada",
      ],
      solucoes: [
        "Apertar parafusos da estrutura",
        "Verificar fixação do compressor (coxins)",
        "Inspecionar hélice do ventilador",
        "Substituir rolamento se necessário",
        "Colocar borrachas anti-vibração",
      ],
      ferramentas: ["Chave de fenda", "Chave Allen", "Nível"],
      tempoEstimado: "20-45 min",
      dificuldade: "Fácil",
    },
    "Vazamento de água": {
      causas: [
        "Dreno entupido",
        "Mangueira de dreno desconectada",
        "Bandeja de drenagem rachada",
        "Excesso de umidade no ambiente",
        "Instalação com inclinação incorreta",
      ],
      solucoes: [
        "Desobstruir dreno com ar comprimido ou arame",
        "Reconectar mangueira de dreno",
        "Verificar inclinação da evaporadora (leve caída para trás)",
        "Limpar bandeja de drenagem",
        "Aplicar selante se houver rachadura",
      ],
      ferramentas: ["Compressor de ar", "Nível", "Arame flexível"],
      tempoEstimado: "15-30 min",
      dificuldade: "Fácil",
    },
    "Compressor não parte": {
      causas: [
        "Capacitor de partida queimado",
        "Relé de partida com defeito",
        "Protetor térmico atuado",
        "Compressor travado mecanicamente",
        "Tensão de alimentação baixa",
      ],
      solucoes: [
        "Medir capacitor (capacitância e ESR)",
        "Testar relé de partida",
        "Aguardar protetor térmico resfriar e testar novamente",
        "Verificar tensão na tomada",
        "Testar enrolamentos do compressor (ohms)",
        "Se travado: tentar partida forçada ou substituir",
      ],
      ferramentas: ["Multímetro", "Capacímetro", "Amperímetro alicate"],
      tempoEstimado: "30-60 min",
      dificuldade: "Médio",
    },
    "Placa queimada": {
      causas: [
        "Surto de tensão (raio/oscilação)",
        "Curto-circuito em componente",
        "Umidade na placa",
        "Componente de potência sobrecarregado",
      ],
      solucoes: [
        "Inspecionar placa visualmente (trilhas queimadas, capacitores estufados)",
        "Testar fusível da placa",
        "Verificar se há curto nos relés",
        "Substituir placa compatível",
        "Instalar protetor de surto na alimentação",
      ],
      ferramentas: ["Multímetro", "Ferro de solda", "Lupa"],
      tempoEstimado: "45-90 min",
      dificuldade: "Difícil",
    },
    "Gás vazando": {
      causas: [
        "Conexão flare mal apertada",
        "Furo na serpentina (corrosão)",
        "Solda com defeito",
        "Vibração causando trinca na tubulação",
      ],
      solucoes: [
        "Localizar vazamento com detector eletrônico ou espuma",
        "Reapertar conexões flare com torquímetro",
        "Soldar ponto de vazamento com solda prata",
        "Fazer vácuo e recarregar gás na quantidade correta",
        "Testar estanqueidade com nitrogênio",
      ],
      ferramentas: ["Detector de vazamento", "Manifold", "Maçarico", "Solda prata", "Bomba de vácuo", "Balança", "Nitrogênio"],
      tempoEstimado: "2-4 horas",
      dificuldade: "Difícil",
    },
  },
  "Ar Condicionado Janela": {
    "Não liga": {
      causas: [
        "Disjuntor desarmado",
        "Cabo de força danificado",
        "Seletor de velocidade queimado",
        "Capacitor em curto",
        "Termostato com defeito",
      ],
      solucoes: [
        "Verificar disjuntor",
        "Testar cabo de força",
        "Testar seletor de velocidade (continuidade)",
        "Medir capacitor",
        "Testar termostato",
      ],
      ferramentas: ["Multímetro", "Chave Phillips"],
      tempoEstimado: "20-40 min",
      dificuldade: "Fácil",
    },
    "Não gela": {
      causas: [
        "Gás insuficiente",
        "Compressor com defeito",
        "Filtro de ar muito sujo",
        "Serpentina congelada",
        "Termostato descalibrado",
      ],
      solucoes: [
        "Limpar filtro de ar",
        "Verificar pressão do gás",
        "Testar compressor (amperagem)",
        "Verificar se serpentina está congelando (indica gás baixo)",
        "Calibrar ou trocar termostato",
      ],
      ferramentas: ["Manifold", "Multímetro", "Amperímetro"],
      tempoEstimado: "1-2 horas",
      dificuldade: "Médio",
    },
  },
  "Geladeira": {
    "Não liga": {
      causas: [
        "Tomada sem energia",
        "Cabo de força danificado",
        "Termostato com defeito",
        "Relé/protetor térmico queimado",
        "Compressor travado",
      ],
      solucoes: [
        "Verificar energia na tomada",
        "Testar cabo de força",
        "Testar termostato (girar e ouvir click)",
        "Substituir relé PTC ou protetor térmico",
        "Testar enrolamentos do compressor",
      ],
      ferramentas: ["Multímetro", "Chave Phillips"],
      tempoEstimado: "20-45 min",
      dificuldade: "Médio",
    },
    "Não gela": {
      causas: [
        "Gás vazando",
        "Compressor sem compressão",
        "Filtro secador obstruído",
        "Tubo capilar entupido",
        "Timer de degelo travado",
        "Ventilador interno parado",
      ],
      solucoes: [
        "Verificar se compressor está ligando e esquentando",
        "Testar pressão do gás",
        "Verificar se há gelo apenas no início da serpentina (indica obstrução)",
        "Testar timer de degelo",
        "Verificar ventilador do freezer",
      ],
      ferramentas: ["Manifold", "Multímetro", "Amperímetro"],
      tempoEstimado: "1-3 horas",
      dificuldade: "Difícil",
    },
  },
  "Freezer": {
    "Não congela": {
      causas: [
        "Gás insuficiente",
        "Compressor com defeito",
        "Termostato descalibrado",
        "Vedação da tampa comprometida",
        "Serpentina com gelo excessivo",
      ],
      solucoes: [
        "Verificar pressão do gás",
        "Testar compressor",
        "Verificar borracha da tampa",
        "Fazer degelo manual se necessário",
        "Calibrar termostato",
      ],
      ferramentas: ["Manifold", "Multímetro", "Termômetro"],
      tempoEstimado: "1-2 horas",
      dificuldade: "Médio",
    },
  },
};

const SUGESTOES_TESTES: { [key: string]: string[] } = {
  "Não liga": [
    "1. Verificar tensão na tomada com multímetro",
    "2. Testar fusível/disjuntor do circuito",
    "3. Verificar cabo de força (continuidade)",
    "4. Medir tensão na entrada do equipamento",
    "5. Testar placa eletrônica/termostato",
    "6. Verificar capacitor (visual + capacímetro)",
  ],
  "Não gela": [
    "1. Verificar se compressor está ligando (vibração + aquecimento)",
    "2. Medir amperagem do compressor (comparar com plaqueta)",
    "3. Verificar pressão do gás com manifold",
    "4. Testar sensor de temperatura (resistência)",
    "5. Verificar ventilador evaporador",
    "6. Checar filtro secador (temperatura na entrada/saída)",
  ],
  "Gela pouco": [
    "1. Limpar filtros de ar",
    "2. Verificar pressão do gás (pode estar baixo)",
    "3. Limpar serpentina condensadora",
    "4. Medir temperatura de saída do ar",
    "5. Verificar se ambiente está vedado",
  ],
  "Barulho estranho": [
    "1. Identificar origem do barulho (compressor, ventilador, estrutura)",
    "2. Verificar fixação de parafusos e suportes",
    "3. Inspecionar hélice do ventilador",
    "4. Verificar coxins do compressor",
    "5. Testar rolamentos do motor",
  ],
  "Vazamento de água": [
    "1. Verificar dreno (desobstruir com ar/arame)",
    "2. Checar mangueira de drenagem",
    "3. Verificar inclinação do equipamento",
    "4. Inspecionar bandeja de drenagem",
    "5. Verificar vedação das conexões",
  ],
  "Compressor não parte": [
    "1. Medir tensão de alimentação",
    "2. Testar capacitor de partida (capacímetro)",
    "3. Verificar relé de partida (continuidade)",
    "4. Testar protetor térmico",
    "5. Medir resistência dos enrolamentos (C-S, C-R, S-R)",
    "6. Verificar se compressor está travado (tentar partida forçada)",
  ],
  "Vazamento": [
    "1. Inspeção visual em conexões e soldas",
    "2. Aplicar espuma/sabão nas conexões",
    "3. Usar detector eletrônico de vazamento",
    "4. Pressurizar com nitrogênio para teste",
    "5. Verificar serpentina (corrosão)",
  ],
  "default": [
    "1. Inspeção visual completa do equipamento",
    "2. Teste de continuidade nos componentes principais",
    "3. Medição de tensão e corrente",
    "4. Verificar todas as conexões elétricas",
    "5. Testar componentes individuais com multímetro",
  ],
};

const CODIGOS_ERRO: { [key: string]: { codigo: string; descricao: string; solucao: string }[] } = {
  "Ar Condicionado Split": [
    { codigo: "E1", descricao: "Erro no sensor de temperatura interno", solucao: "Verificar/substituir sensor da evaporadora" },
    { codigo: "E2", descricao: "Erro no sensor de temperatura externo", solucao: "Verificar/substituir sensor da condensadora" },
    { codigo: "E3", descricao: "Erro de comunicação entre placas", solucao: "Verificar cabo de comunicação entre unidades" },
    { codigo: "E4", descricao: "Erro no sensor de descarga", solucao: "Verificar sensor na linha de descarga do compressor" },
    { codigo: "E5", descricao: "Sobrecarga no compressor", solucao: "Verificar carga de gás, ventilação da condensadora" },
    { codigo: "E6", descricao: "Erro no motor do ventilador", solucao: "Verificar motor e capacitor do ventilador" },
    { codigo: "F1", descricao: "Proteção por alta pressão", solucao: "Limpar condensadora, verificar ventilador externo" },
    { codigo: "F2", descricao: "Proteção por baixa pressão", solucao: "Verificar carga de gás, possível vazamento" },
    { codigo: "F3", descricao: "Proteção por alta temperatura do compressor", solucao: "Verificar ventilação, carga de gás" },
    { codigo: "H1", descricao: "Modo degelo ativo", solucao: "Normal - aguardar ciclo de degelo finalizar" },
    { codigo: "H6", descricao: "Compressor travado/bloqueado", solucao: "Verificar compressor, pode necessitar substituição" },
    { codigo: "P0", descricao: "Módulo IPM com defeito", solucao: "Substituir placa inversora" },
    { codigo: "U8", descricao: "Ventilador externo parado", solucao: "Verificar motor e capacitor do ventilador externo" },
  ],
  "Geladeira": [
    { codigo: "F1/SH", descricao: "Sensor do freezer aberto/curto", solucao: "Substituir sensor de temperatura do freezer" },
    { codigo: "F2/rE", descricao: "Sensor do refrigerador com defeito", solucao: "Substituir sensor de temperatura do refrigerador" },
    { codigo: "F3/rd", descricao: "Sensor de degelo com defeito", solucao: "Verificar/substituir sensor de degelo" },
    { codigo: "F4", descricao: "Ventilador do freezer travado", solucao: "Verificar motor do ventilador, possível gelo bloqueando" },
    { codigo: "F5", descricao: "Erro no compressor", solucao: "Verificar compressor e componentes de partida" },
  ],
  "Máquina de Lavar": [
    { codigo: "E1/F1", descricao: "Erro na entrada de água", solucao: "Verificar torneira, mangueira e válvula de entrada" },
    { codigo: "E2/F2", descricao: "Erro na drenagem", solucao: "Verificar bomba de drenagem e mangueira de saída" },
    { codigo: "E3/UE", descricao: "Desbalanceamento na centrifugação", solucao: "Redistribuir roupas, verificar amortecedores" },
    { codigo: "E4/dE", descricao: "Erro na trava da porta", solucao: "Verificar trava/sensor da porta" },
    { codigo: "E5/PE", descricao: "Erro no sensor de nível", solucao: "Verificar pressostato e mangueira" },
    { codigo: "E7/IE", descricao: "Erro no motor", solucao: "Verificar motor, placa inversora, conexões" },
  ],
  "Micro-ondas": [
    { codigo: "E-01", descricao: "Erro no sensor de temperatura", solucao: "Verificar/substituir sensor" },
    { codigo: "E-02", descricao: "Magnetron com defeito", solucao: "Substituir magnetron (atenção: alta tensão!)" },
    { codigo: "E-03", descricao: "Erro no painel/teclado", solucao: "Verificar membrana do teclado, substituir se necessário" },
    { codigo: "E-05", descricao: "Porta não fecha corretamente", solucao: "Verificar switches da porta (door switches)" },
  ],
  "default": [
    { codigo: "E0", descricao: "Erro genérico de comunicação", solucao: "Verificar conexões e cabos" },
    { codigo: "E1", descricao: "Erro de sensor", solucao: "Verificar sensores de temperatura" },
    { codigo: "E2", descricao: "Erro de sobrecarga", solucao: "Verificar componentes de potência" },
    { codigo: "E3", descricao: "Erro de alimentação", solucao: "Verificar tensão de entrada" },
  ],
};

const BIBLIOTECA_TECNICA: { [key: string]: { titulo: string; conteudo: string }[] } = {
  "Ar Condicionado Split": [
    {
      titulo: "Tabela de Pressões (R-410A)",
      conteudo: "• 25°C ambiente: Alta ~25 bar / Baixa ~8 bar\n• 30°C ambiente: Alta ~28 bar / Baixa ~9 bar\n• 35°C ambiente: Alta ~32 bar / Baixa ~10 bar\n• 40°C ambiente: Alta ~36 bar / Baixa ~11 bar\n\nSuperaquecimento ideal: 5-8°C\nSubresfriamento ideal: 5-8°C",
    },
    {
      titulo: "Tabela de Pressões (R-22)",
      conteudo: "• 25°C ambiente: Alta ~14 bar / Baixa ~4.5 bar\n• 30°C ambiente: Alta ~16 bar / Baixa ~5 bar\n• 35°C ambiente: Alta ~18 bar / Baixa ~5.5 bar\n\nSuperaquecimento ideal: 7-10°C\nSubresfriamento ideal: 5-8°C",
    },
    {
      titulo: "Capacitores Comuns por BTU",
      conteudo: "• 7.000 BTU: 15-20 µF (ventilador: 1.5-2.5 µF)\n• 9.000 BTU: 20-25 µF (ventilador: 1.5-2.5 µF)\n• 12.000 BTU: 25-35 µF (ventilador: 2-3 µF)\n• 18.000 BTU: 35-45 µF (ventilador: 3-4 µF)\n• 24.000 BTU: 45-60 µF (ventilador: 4-5 µF)\n• 30.000 BTU: 50-70 µF (ventilador: 5-6 µF)",
    },
    {
      titulo: "Amperagem Típica por BTU",
      conteudo: "• 7.000 BTU (220V): 3-4A\n• 9.000 BTU (220V): 4-5A\n• 12.000 BTU (220V): 5-7A\n• 18.000 BTU (220V): 8-10A\n• 24.000 BTU (220V): 10-13A\n• 30.000 BTU (220V): 13-16A\n\nSe amperagem > 20% acima: possível problema mecânico",
    },
    {
      titulo: "Carga de Gás por BTU (R-410A)",
      conteudo: "• 7.000 BTU: 500-700g\n• 9.000 BTU: 700-900g\n• 12.000 BTU: 900-1200g\n• 18.000 BTU: 1200-1600g\n• 24.000 BTU: 1600-2100g\n\nSempre consultar plaqueta do fabricante!\nAdicionar ~20g por metro extra de tubulação",
    },
    {
      titulo: "Procedimento de Vácuo",
      conteudo: "1. Conectar manifold e bomba de vácuo\n2. Abrir válvulas de alta e baixa\n3. Ligar bomba de vácuo\n4. Aguardar até -755 mmHg (mínimo 30 min)\n5. Fechar válvulas e desligar bomba\n6. Aguardar 10 min e verificar se pressão mantém\n7. Se subir: há vazamento - localizar e corrigir\n8. Se mantiver: sistema estanque - carregar gás",
    },
  ],
  "Ar Condicionado Janela": [
    {
      titulo: "Tabela de Pressões (R-22)",
      conteudo: "• 25°C ambiente: Alta ~14 bar / Baixa ~4.5 bar\n• 30°C ambiente: Alta ~16 bar / Baixa ~5 bar\n• 35°C ambiente: Alta ~18 bar / Baixa ~5.5 bar",
    },
    {
      titulo: "Capacitores Comuns",
      conteudo: "• 7.500 BTU: 15-20 µF + 2.5 µF (ventilador)\n• 10.000 BTU: 20-25 µF + 3 µF (ventilador)\n• 12.000 BTU: 25-30 µF + 3-4 µF (ventilador)\n• 18.000 BTU: 35-40 µF + 4-5 µF (ventilador)\n• 21.000 BTU: 40-50 µF + 5 µF (ventilador)",
    },
    {
      titulo: "Dicas de Instalação",
      conteudo: "• Inclinação: 1-2cm para fora (drenagem)\n• Folga lateral: mínimo 15cm cada lado\n• Altura ideal: 1.5m do chão\n• Suporte: verificar capacidade de peso\n• Vedação: usar espuma expansiva nas laterais\n• Dreno: não obstruir saída de água traseira",
    },
  ],
  "Geladeira": [
    {
      titulo: "Tabela de Pressões (R-134a)",
      conteudo: "• Baixa: 0.5-2 bar (evaporador)\n• Alta: 8-14 bar (condensador)\n• Vácuo ideal: -755 mmHg por 20 min\n\nTemperatura do freezer: -18°C a -22°C\nTemperatura do refrigerador: 2°C a 8°C",
    },
    {
      titulo: "Carga de Gás Típica (R-134a)",
      conteudo: "• Geladeira pequena (240L): 80-120g\n• Geladeira média (350L): 100-150g\n• Geladeira grande (450L+): 130-180g\n• Freezer horizontal: 100-200g\n\nSempre consultar plaqueta do fabricante!",
    },
    {
      titulo: "Teste de Enrolamentos do Compressor",
      conteudo: "Terminais: C (comum), S (start), R (run)\n\nMedições esperadas:\n• C-R: 5-15 ohms (enrolamento principal)\n• C-S: 15-40 ohms (enrolamento de partida)\n• S-R: soma de C-R + C-S\n• Qualquer terminal para carcaça: infinito (∞)\n\nSe houver leitura para carcaça = curto (compressor queimado)",
    },
  ],
  "Freezer": [
    {
      titulo: "Temperaturas de Operação",
      conteudo: "• Freezer doméstico: -18°C a -25°C\n• Freezer comercial: -18°C a -22°C\n• Câmara fria (resfriados): 0°C a 5°C\n• Câmara fria (congelados): -18°C a -25°C\n\nVariação aceitável: ±2°C",
    },
    {
      titulo: "Carga de Gás",
      conteudo: "• Freezer horizontal 300L: 120-160g (R-134a)\n• Freezer horizontal 500L: 150-200g (R-134a)\n• Freezer vertical 250L: 100-140g (R-134a)\n\nSempre consultar plaqueta!",
    },
  ],
  "default": [
    {
      titulo: "Multímetro - Funções Básicas",
      conteudo: "• DCV: Tensão contínua (baterias, placas)\n• ACV: Tensão alternada (tomadas: 127V/220V)\n• Ω: Resistência (sensores, enrolamentos)\n• Continuidade: Teste de fios e fusíveis (bip)\n• A/mA: Corrente (amperagem do compressor)\n\nSempre começar na escala mais alta!",
    },
    {
      titulo: "Segurança Elétrica",
      conteudo: "• Sempre desligar disjuntor antes de trabalhar\n• Usar EPI (luvas, óculos)\n• Descarregar capacitores antes de manusear\n• Nunca trabalhar em micro-ondas energizado\n• Verificar aterramento do equipamento\n• Usar multímetro para confirmar ausência de tensão",
    },
    {
      titulo: "Gases Refrigerantes Comuns",
      conteudo: "• R-22: Ar condicionado antigo (sendo descontinuado)\n• R-410A: Ar condicionado moderno (inverter)\n• R-134a: Geladeiras e freezers domésticos\n• R-404A: Câmaras frias comerciais\n• R-600a: Geladeiras novas (inflamável!)\n\nNunca misturar gases diferentes!\nSempre usar o gás indicado na plaqueta",
    },
  ],
};

export default function IATecnicaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [categoria, setCategoria] = useState<string | null>(null);
  const [equipamento, setEquipamento] = useState<string | null>(null);
  const [defeito, setDefeito] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [codigoBusca, setCodigoBusca] = useState("");

  const resetar = () => {
    setCategoria(null);
    setEquipamento(null);
    setDefeito(null);
    setBusca("");
    setCodigoBusca("");
  };

  const voltarUmPasso = () => {
    if (defeito) {
      setDefeito(null);
    } else if (equipamento) {
      setEquipamento(null);
    } else {
      setCategoria(null);
    }
  };

  const getDefeitos = () => {
    if (!equipamento) return [];
    return DEFEITOS_COMUNS[equipamento] || DEFEITOS_COMUNS["default"];
  };

  const getTestes = () => {
    if (!defeito) return SUGESTOES_TESTES["default"];
    return SUGESTOES_TESTES[defeito] || SUGESTOES_TESTES["default"];
  };

  const getDiagnostico = (): DiagnosticoInfo | null => {
    if (!equipamento || !defeito) return null;
    const equipDiag = DIAGNOSTICOS[equipamento];
    if (!equipDiag) return null;
    return equipDiag[defeito] || null;
  };

  const getCodigos = () => {
    if (!equipamento) return [];
    const codigos = CODIGOS_ERRO[equipamento] || CODIGOS_ERRO["default"];
    if (codigoBusca) {
      return codigos.filter(
        (c) =>
          c.codigo.toLowerCase().includes(codigoBusca.toLowerCase()) ||
          c.descricao.toLowerCase().includes(codigoBusca.toLowerCase())
      );
    }
    return codigos;
  };

  const getBiblioteca = () => {
    if (!equipamento) return [];
    return BIBLIOTECA_TECNICA[equipamento] || BIBLIOTECA_TECNICA["default"];
  };

  const renderDiagnostico = () => {
    const diag = getDiagnostico();

    if (!diag) {
      // Fallback: mostrar testes genéricos
      return (
        <>
          <Text className="text-foreground text-base font-semibold mb-3">Possíveis Causas e Testes</Text>
          <Text className="text-muted text-xs mb-4">
            Diagnóstico detalhado não disponível para esta combinação. Veja os testes sugeridos:
          </Text>
          {getTestes().map((teste, i) => (
            <View
              key={i}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>{i + 1}</Text>
              </View>
              <Text className="text-foreground text-sm ml-3 flex-1">{teste}</Text>
            </View>
          ))}
        </>
      );
    }

    return (
      <>
        {/* Dificuldade e Tempo */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
            <Text className="text-muted text-xs">Dificuldade</Text>
            <Text style={{ color: diag.dificuldade === "Fácil" ? colors.success : diag.dificuldade === "Médio" ? colors.warning : colors.error, fontWeight: "700", fontSize: 14, marginTop: 4 }}>
              {diag.dificuldade}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
            <Text className="text-muted text-xs">Tempo Estimado</Text>
            <Text className="text-foreground font-bold text-sm mt-1">{diag.tempoEstimado}</Text>
          </View>
        </View>

        {/* Causas */}
        <Text className="text-foreground text-base font-semibold mb-2">Possíveis Causas</Text>
        {diag.causas.map((causa, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8, paddingLeft: 4 }}>
            <MaterialIcons name="warning" size={16} color={colors.warning} style={{ marginTop: 2 }} />
            <Text className="text-foreground text-sm ml-2 flex-1">{causa}</Text>
          </View>
        ))}

        {/* Soluções */}
        <Text className="text-foreground text-base font-semibold mb-2 mt-4">Soluções Passo a Passo</Text>
        {diag.solucoes.map((sol, i) => (
          <View
            key={i}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.success + "20", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.success, fontWeight: "700", fontSize: 11 }}>{i + 1}</Text>
            </View>
            <Text className="text-foreground text-sm ml-3 flex-1">{sol}</Text>
          </View>
        ))}

        {/* Ferramentas */}
        <Text className="text-foreground text-base font-semibold mb-2 mt-4">Ferramentas Necessárias</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {diag.ferramentas.map((ferr, i) => (
            <View key={i} style={{ backgroundColor: colors.primary + "15", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{ferr}</Text>
            </View>
          ))}
        </View>
      </>
    );
  };

  const renderCodigos = () => {
    const codigos = getCodigos();
    return (
      <>
        <Text className="text-foreground text-base font-semibold mb-3">Códigos de Erro - {equipamento}</Text>
        <TextInput
          value={codigoBusca}
          onChangeText={setCodigoBusca}
          placeholder="Buscar código (ex: E1, F2...)"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
            fontSize: 14,
          }}
        />
        {codigos.length === 0 ? (
          <Text className="text-muted text-sm text-center mt-4">Nenhum código encontrado.</Text>
        ) : (
          codigos.map((cod, i) => (
            <View
              key={i}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View style={{ backgroundColor: colors.error + "20", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: colors.error, fontWeight: "800", fontSize: 14 }}>{cod.codigo}</Text>
                </View>
                <Text className="text-foreground text-sm font-semibold ml-3 flex-1">{cod.descricao}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <MaterialIcons name="build" size={14} color={colors.success} style={{ marginTop: 2 }} />
                <Text style={{ color: colors.success, fontSize: 13, marginLeft: 6, flex: 1 }}>{cod.solucao}</Text>
              </View>
            </View>
          ))
        )}
      </>
    );
  };

  const renderBiblioteca = () => {
    const items = getBiblioteca();
    return (
      <>
        <Text className="text-foreground text-base font-semibold mb-3">Biblioteca Técnica - {equipamento}</Text>
        {items.map((item, i) => (
          <View
            key={i}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <MaterialIcons name="menu-book" size={18} color={colors.primary} />
              <Text className="text-foreground font-bold text-sm ml-2">{item.titulo}</Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 20, fontFamily: "monospace" }}>
              {item.conteudo}
            </Text>
          </View>
        ))}
      </>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => (categoria ? voltarUmPasso() : router.back())} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">IA Técnica</Text>
        {categoria && (
          <Pressable onPress={resetar} style={({ pressed }) => [{ marginLeft: "auto", opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="refresh" size={22} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {!categoria ? (
          <>
            <Text className="text-muted text-sm mb-4">Selecione o tipo de consulta:</Text>
            {CATEGORIAS.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategoria(cat.id)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed ? colors.border : colors.surface,
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}
              >
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcons name={cat.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text className="text-foreground font-bold text-base">{cat.label}</Text>
                  <Text className="text-muted text-sm mt-1">{cat.desc}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
              </Pressable>
            ))}
          </>
        ) : !equipamento ? (
          <>
            <Text className="text-foreground text-base font-semibold mb-3">Tipo de Equipamento</Text>
            {EQUIPAMENTOS_COMUNS.map((eq) => (
              <Pressable
                key={eq}
                onPress={() => setEquipamento(eq)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed ? colors.border : colors.surface,
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}
              >
                <Text className="text-foreground text-sm font-medium flex-1">{eq}</Text>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </>
        ) : !defeito && (categoria === "diagnostico" || categoria === "testes") ? (
          <>
            <Text className="text-foreground text-base font-semibold mb-1">{equipamento}</Text>
            <Text className="text-muted text-sm mb-4">Selecione o problema:</Text>
            {getDefeitos().map((d) => (
              <Pressable
                key={d}
                onPress={() => setDefeito(d)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed ? colors.border : colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text className="text-foreground text-sm font-medium">{d}</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            {/* Header com seleção atual */}
            <View style={{ backgroundColor: colors.primary + "10", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primary + "30" }}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                {equipamento} {defeito ? `- ${defeito}` : ""}
              </Text>
            </View>

            {/* Conteúdo baseado na categoria */}
            {categoria === "diagnostico" ? renderDiagnostico() : null}
            {categoria === "testes" ? (
              <>
                <Text className="text-foreground text-base font-semibold mb-3">Testes Recomendados</Text>
                {getTestes().map((teste, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcons name="check-circle" size={16} color={colors.primary} />
                    </View>
                    <Text className="text-foreground text-sm ml-3 flex-1">{teste}</Text>
                  </View>
                ))}
              </>
            ) : null}
            {categoria === "codigos" ? renderCodigos() : null}
            {categoria === "biblioteca" ? renderBiblioteca() : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
