const formularioBusca = document.getElementById('form-busca-atendimento');
const campoCpf = document.getElementById('cpf-atendimento');
const resultadoPaciente = document.getElementById('resultado-paciente');
const novaBuscaPaciente = criarControleDeBusca();

function mostrarErro(texto) {
  resultadoPaciente.innerHTML = '';
  const erro = document.createElement('p');
  erro.className = 'mensagem-erro';
  erro.setAttribute('role', 'alert');
  erro.textContent = texto;
  resultadoPaciente.appendChild(erro);
}

function mostrarAtendimentoAberto(card, atendimento) {
  const dados = document.createElement('div');

  const numero = document.createElement('p');
  numero.innerHTML = '<strong>Número:</strong> ';
  numero.append(atendimento.numero_atendimento);

  const chegada = document.createElement('p');
  chegada.innerHTML = '<strong>Chegada:</strong> ';
  chegada.append(formatarDataHora(atendimento.data_hora_chegada));

  const status = document.createElement('p');
  status.innerHTML = '<strong>Situação:</strong> ';
  status.append(atendimento.status_atendimento);

  const linkConsulta = document.createElement('a');
  linkConsulta.className = 'botao-principal';
  linkConsulta.href = `./h05-consultar-atendimento.html?numero=${encodeURIComponent(atendimento.numero_atendimento)}`;
  linkConsulta.textContent = 'Consultar atendimento';

  dados.append(numero, chegada, status, linkConsulta);
  
  card.appendChild(dados);
}

function mostrarFichaPaciente(paciente) {
  resultadoPaciente.replaceChildren();
  const card = document.createElement('article');
  card.className = 'card-paciente';

  const titulo = document.createElement('h2');
  titulo.textContent = paciente.nome;
  const cpfPaciente = document.createElement('p');
  cpfPaciente.textContent = `CPF: ${formatarCpf(paciente.cpf)}`;

  const mensagem = document.createElement('p');
  mensagem.className = 'mensagem-atendimento';

  // Paciente com atendimento em andamento: o back-end recusaria um novo, então não oferece o botão.
  if (!podeAbrirAtendimento(paciente.status)) {
    mensagem.textContent = `Este paciente já possui um atendimento em andamento (situação: ${paciente.status}).`;
    const linkConsulta = document.createElement('a');
    linkConsulta.className = 'botao-principal';
    linkConsulta.href = `./h05-consultar-atendimento.html?cpf=${encodeURIComponent(paciente.cpf ?? '')}`;
    linkConsulta.textContent = 'Consultar atendimento atual';
    card.append(titulo, cpfPaciente, mensagem, linkConsulta);
    resultadoPaciente.appendChild(card);
    return;
  }

  const botaoAbrir = document.createElement('button');
  botaoAbrir.className = 'botao-principal';
  botaoAbrir.type = 'button';
  botaoAbrir.textContent = 'Abrir atendimento';

  function mostrarFalha(texto) {
    mensagem.textContent = texto;
    mensagem.className = 'mensagem-atendimento mensagem-erro';
    botaoAbrir.disabled = false;
  }

  botaoAbrir.addEventListener('click', async () => {
    botaoAbrir.disabled = true;
    mensagem.className = 'mensagem-atendimento';
    mensagem.textContent = 'Abrindo atendimento...';

    let resposta;
    try {
      resposta = await fetch(`${API_URL}/atendimentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_paciente: paciente.id_paciente }),
      });
    } catch {
      mostrarFalha('Não foi possível conectar à API.');
      return;
    }

    const corpo = await lerJson(resposta);

    if (resposta.ok) {
      botaoAbrir.remove();
      if (!corpo) {
        // O atendimento foi criado, mas a resposta veio ilegível: orienta a conferir na consulta.
        mensagem.textContent = 'O atendimento foi aberto, mas não foi possível exibir os dados. Confira na consulta do atendimento.';
        mensagem.className = 'mensagem-atendimento mensagem-erro';
        const linkConsulta = document.createElement('a');
        linkConsulta.className = 'botao-principal';
        linkConsulta.href = `./h05-consultar-atendimento.html?cpf=${encodeURIComponent(paciente.cpf ?? '')}`;
        linkConsulta.textContent = 'Consultar atendimento';
        card.appendChild(linkConsulta);
        return;
      }
      mensagem.textContent = 'Atendimento aberto com sucesso.';
      mensagem.className = 'mensagem-atendimento sucesso';
      mostrarAtendimentoAberto(card, corpo);
      return;
    }

    mostrarFalha(corpo?.detail ?? 'Erro ao abrir atendimento.');
  });

  card.append(titulo, cpfPaciente, botaoAbrir, mensagem);
  resultadoPaciente.appendChild(card);
}

formularioBusca.addEventListener('submit', async (event) => {
  event.preventDefault();
  const cpf = campoCpf.value.replace(/\D/g, '');

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    mostrarErro('Informe um CPF válido com 11 números.');
    return;
  }

  // Uma busca nova invalida as anteriores: resposta atrasada de outro CPF não troca a ficha.
  const buscaAindaValida = novaBuscaPaciente();
  resultadoPaciente.innerHTML = '<p>Buscando paciente...</p>';

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/pacientes/${cpf}`);
  } catch {
    if (buscaAindaValida()) mostrarErro('Não foi possível conectar à API.');
    return;
  }
  const paciente = resposta.ok ? await lerJson(resposta) : null;
  if (!buscaAindaValida()) return;

  if (resposta.status === 404) {
    mostrarErro('Paciente não encontrado. Cadastre o paciente antes de abrir o atendimento.');
    return;
  }
  if (!resposta.ok || !paciente) {
    mostrarErro('Erro ao buscar paciente.');
    return;
  }

  mostrarFichaPaciente(paciente);
});

const cpfInicial = new URLSearchParams(window.location.search).get('cpf');
if (cpfInicial) {
  campoCpf.value = cpfInicial.replace(/\D/g, '');
  formularioBusca.requestSubmit();
}
