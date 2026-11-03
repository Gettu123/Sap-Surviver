import { CharacterProfile, PhaseConfig, Achievement } from '../types/game';

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'keyuser',
    name: 'Key User Sênior',
    role: 'Guardião dos Processos & Usuários',
    badge: 'PADRÃO EQUILIBRADO',
    color: '#35e0d0',
    avatarIcon: '👤',
    description: 'Equilíbrio perfeito entre velocidade de atendimento e resolução de incidentes. Especialista em desbloquear tabelas presas na SM12.',
    speed: 6.2,
    fireRate: 11, // frames between shots
    damageMultiplier: 1.0,
    pickupRadiusBonus: 10,
    specialSkill: 'SM12 Desbloquear (Limpa chamados comuns na tela)',
    quote: '"Se não tem evidência em anexo, o chamado nem existe."'
  },
  {
    id: 'consultor',
    name: 'Consultor SAP HCM',
    role: 'Mestre dos Esquemas & Regras PCR',
    badge: 'ALTA CADÊNCIA',
    color: '#c7ff62',
    avatarIcon: '💼',
    description: 'Tiros rápidos aplicando Notas SAP OSS. Movimentação ágil entre reuniões de alinhamento com clientes.',
    speed: 7.0,
    fireRate: 8,
    damageMultiplier: 0.9,
    pickupRadiusBonus: 5,
    specialSkill: 'Nota SAP OSS (Cria escudo imediato)',
    quote: '"Vou aplicar uma SAP Note direto em PRD e ver no que dá."'
  },
  {
    id: 'analista',
    name: 'Analista de DP / Folha',
    role: 'A Alma do Holerite & eSocial',
    badge: 'MAGNETISMO & DEFESA',
    color: '#ffad55',
    avatarIcon: '🧮',
    description: 'Imã para evidências e rubricas pendentes. Maior tolerância a estresse e disparos duplos de contracheque.',
    speed: 5.6,
    fireRate: 12,
    damageMultiplier: 1.25,
    pickupRadiusBonus: 28,
    specialSkill: 'Bônus de Evidências (Dobra pontuação e vida)',
    quote: '"Dia 5 tá chegando e o sindicato não vai esperar."'
  },
  {
    id: 'abaper',
    name: 'ABAPer Hardcore',
    role: 'Domador de Dumps & Debugger /h',
    badge: 'DANO MASSIVO',
    color: '#b88cff',
    avatarIcon: '💻',
    description: 'Disparos lentos mas devastadores de "COMMIT WORK AND WAIT". Ativa o debugger /h para congelar o tempo.',
    speed: 5.8,
    fireRate: 14,
    damageMultiplier: 1.8,
    pickupRadiusBonus: 8,
    specialSkill: 'Debug /h (Congela o fluxo do tempo por 5 segundos)',
    quote: '"Coloca um BREAK-POINT no loop da folha que eu resolvo."'
  }
];

export const PHASES: PhaseConfig[] = [
  {
    level: 1,
    title: 'Fase 1: Cadastro & Dados Mestres',
    subtitle: 'Infotipos 0000, 0001, 0002 e 0008',
    tcode: 'PA30',
    targetTickets: 12,
    bgGlowColor: 'rgba(53, 224, 208, 0.08)',
    enemySpeedMultiplier: 1.0,
    enemyHpMultiplier: 1.0,
    boss: {
      id: 'boss_cadastro',
      name: 'Analista Sem Documento',
      title: 'CHEFÃO: "DÁ PRA ADMITIR SEM CPF?"',
      hp: 20,
      width: 140,
      height: 70,
      color: '#ff6175',
      dialogIntro: '🚨 CHEFÃO: "Cadastra o diretor agora sem documento! Mês que vem ele entrega!"',
      dialogDefeated: '✅ INFOTIPOS SALVOS! Dados cadastrais validados no eSocial.'
    }
  },
  {
    level: 2,
    title: 'Fase 2: Remuneração & Benefícios',
    subtitle: 'Infotipos 0014, 0015 e Rubricas Extras',
    tcode: 'PA30 / T512W',
    targetTickets: 16,
    bgGlowColor: 'rgba(255, 173, 85, 0.08)',
    enemySpeedMultiplier: 1.2,
    enemyHpMultiplier: 1.3,
    boss: {
      id: 'boss_consultor_jr',
      name: 'Consultor Júnior em PRD',
      title: 'CHEFÃO: "ALTEREI A RUBRICA EM PRODUÇÃO"',
      hp: 32,
      width: 150,
      height: 75,
      color: '#ff9248',
      dialogIntro: '🚨 CHEFÃO: "Alterei o acumulador /101 direto em produção sem request!"',
      dialogDefeated: '✅ RUBRICAS REVERTIDAS! Provisões e adicionais recalculados.'
    }
  },
  {
    level: 3,
    title: 'Fase 3: Motor de Cálculo da Folha',
    subtitle: 'Processamento do Esquema BR00 e Regras PCR',
    tcode: 'PC00_M37_CALC',
    targetTickets: 20,
    bgGlowColor: 'rgba(184, 140, 255, 0.08)',
    enemySpeedMultiplier: 1.4,
    enemyHpMultiplier: 1.6,
    boss: {
      id: 'boss_st22_dump',
      name: 'ST22 ABAP DUMP: TIME_OUT',
      title: 'CHEFÃO: "COMPUTE_BCD_OVERFLOW IN CALC"',
      hp: 48,
      width: 165,
      height: 85,
      color: '#e056fd',
      dialogIntro: '🚨 CHEFÃO CRÍTICO: "RUNTIME ERROR ST22! Memória esgotada no cálculo!"',
      dialogDefeated: '✅ DUMP TRATADO! Esquema de cálculo finalizado sem estouro de pilha.'
    }
  },
  {
    level: 4,
    title: 'Fase 4: Contabilização Financeira',
    subtitle: 'Integração Folha -> FI / CO (RPCIPE00)',
    tcode: 'RPCIPE00 / OBYC',
    targetTickets: 24,
    bgGlowColor: 'rgba(255, 87, 87, 0.09)',
    enemySpeedMultiplier: 1.6,
    enemyHpMultiplier: 2.0,
    boss: {
      id: 'boss_contabilidade',
      name: 'Auditor dos Centavos',
      title: 'CHEFÃO: "FALTA 1 CENTAVO PRA BATER O BALANÇO"',
      hp: 65,
      width: 175,
      height: 90,
      color: '#ff4757',
      dialogIntro: '🚨 CHEFÃO: "O documento de FI não bateu por R$ 0,01! Ninguém vai embora!"',
      dialogDefeated: '✅ CENTAVO ENCONTRADO! Lote contábil gerado e liberado para pagamento.'
    }
  },
  {
    level: 5,
    title: 'Fase Final: O Fechamento Supremo',
    subtitle: 'Tudo ou Nada: A Folha Não Pode Parar!',
    tcode: 'SE38 / SM12 / PRD',
    targetTickets: 28,
    bgGlowColor: 'rgba(199, 255, 98, 0.12)',
    enemySpeedMultiplier: 1.8,
    enemyHpMultiplier: 2.5,
    boss: {
      id: 'boss_fechamento_supremo',
      name: 'FECHAMENTO DO MÊS 💣',
      title: 'CHEFÃO SUPREMO DA FOLHA DE PAGAMENTO',
      hp: 90,
      width: 200,
      height: 100,
      color: '#c7ff62',
      dialogIntro: '🚨 ALERTA GERAL: "O FECHAMENTO FINAL CHEGOU! 5000 HOLERITES EM JOGO!"',
      dialogDefeated: '🏆 HISTÓRICO! A FOLHA FOI FECHADA COM SUCESSO! SALÁRIOS NA CONTA!'
    }
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: 'Primeiro Chamado Resolvido',
    description: 'Elimine seu primeiro incidente no SAP.',
    icon: '🎫'
  },
  {
    id: 'evidence_master',
    title: 'Coletor de Evidências',
    description: 'Colete 10 evidências de chamado em uma mesma partida.',
    icon: '👻'
  },
  {
    id: 'sm12_hero',
    title: 'Mestre da SM12',
    description: 'Use a transação SM12 para desbloquear a tela e limpar incidentes.',
    icon: '🔓'
  },
  {
    id: 'coffee_addict',
    title: 'Cafeína Corporativa',
    description: 'Colete 3 Cafés Expressos para turbinar seus disparos.',
    icon: '☕'
  },
  {
    id: 'dump_slayer',
    title: 'Sobrevivente do ST22',
    description: 'Derrote o chefão DUMP ABAP sem reiniciar o servidor.',
    icon: '💥'
  },
  {
    id: 'penny_pincher',
    title: 'Bateu no Centavo',
    description: 'Alcance mais de 5.000 pontos em uma única partida.',
    icon: '🧮'
  },
  {
    id: 'survivor_legend',
    title: 'A Folha Não Parou!',
    description: 'Derrote o Fechamento do Mês e complete todas as 5 fases!',
    icon: '🏆'
  }
];

export const FUN_TIPS = [
  {
    icon: '⌁',
    title: 'DICA DO KEY USER',
    text: 'Antes de culpar o sistema, confira cadastro, regra, resultado da folha e contabilização.'
  },
  {
    icon: '🔓',
    title: 'TRANSAÇÃO SM12',
    text: 'Se o cálculo travou com "Tabela bloqueada por outro usuário", limpe as entradas de bloqueio na SM12!'
  },
  {
    icon: '☕',
    title: 'HORA DO CAFÉ',
    text: 'Nenhuma virada de folha de pagamento sobrevive sem garrafa térmica de café e pizza às 22h.'
  },
  {
    icon: '📑',
    title: 'EVIDÊNCIA É REI',
    text: '"Sem print do erro na tela do usuário, o chamado é automaticamente classificado como dúvida."'
  },
  {
    icon: '🐛',
    title: 'MISTÉRIO DO SAP',
    text: 'Se deu erro na folha, teste em QAS. Se funcionou em QAS, foi customização mal transportada para PRD!'
  }
];

export const FUN_QUOTES = [
  {
    quote: '“Na minha máquina estava funcionando...”',
    author: 'Frase oficial do início de todo incidente'
  },
  {
    quote: '“Mês passado estava calculando normal, ninguém mexeu em nada!”',
    author: 'Usuário que alterou tabela ontem às 18h'
  },
  {
    quote: '“Dá um /h e coloca um breakpoint no loop que a gente descobre.”',
    author: 'ABAPer salvando a sexta-feira'
  },
  {
    quote: '“A folha tem que fechar hoje senão o banco não processa o TED.”',
    author: 'Gerente de RH olhando para o relógio'
  },
  {
    quote: '“Falta bater só 1 centavo na conta de INSS da filial 02.”',
    author: 'Auditor às 23h45 do último dia útil'
  }
];
