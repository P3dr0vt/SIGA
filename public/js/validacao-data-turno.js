// Função auxiliar para validar data retroativa
// Permite até 1 dia anterior a hoje
// Bloqueia apenas datas com mais de 1 dia de atraso
function validarDataRetroativaPorTurno(dataInicioStr, turnoSelecionado) {
  // Criar data de referência (hoje à 00:00)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Criar data limite (1 dia anterior a hoje)
  const limiteRetroativo = new Date(hoje);
  limiteRetroativo.setDate(limiteRetroativo.getDate() - 1);
  
  const dataInicio = new Date(dataInicioStr);
  dataInicio.setHours(0, 0, 0, 0);
  
  // Se a data é anterior ao limite (mais de 1 dia atrás), é retroativa
  if (dataInicio < limiteRetroativo) {
    return { valido: false, mensagem: 'Não é permitido registrar alocações com mais de 1 dia de atraso.' };
  }
  
  // Até 1 dia anterior e datas futuras são permitidas
  return { valido: true };
}
