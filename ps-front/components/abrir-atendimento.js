const formularioBusca = document.getElementById('form-busca-atendimento');
const campoCpf = document.getElementById('cpf-atendimento');
const resultadoPaciente = document.getElementById('resultado-paciente');

function formatarCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

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

  const botaoAbrir = document.createElement('button');
  botaoAbrir.className = 'botao-principal';
  botaoAbrir.type = 'button';
  botaoAbrir.textContent = 'Abrir atendimento';

  const mensagem = document.createElement('p');
  mensagem.className = 'mensagem-atendimento';

  botaoAbrir.addEventListener('click', async () => {
    botaoAbrir.disabled = true;
    mensagem.className = 'mensagem-atendimento';
    mensagem.textContent = 'Abrindo atendimento...';

    let resposta;
    try {
      resposta = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_paciente: paciente.id_paciente }),
      });
    } catch {
      mensagem.textContent = 'Não foi possível conectar à API.';
      mensagem.classList.add('mensagem-erro');
      botaoAbrir.disabled = false;
      return;
    }

    if (resposta.ok) {
      const atendimento = await resposta.json();
      botaoAbrir.remove();
      mensagem.textContent = 'Atendimento aberto com sucesso.';
      mensagem.classList.add('sucesso');
      mostrarAtendimentoAberto(card, atendimento);
      return;
    }

    const erro = await resposta.json().catch(() => null);
    mensagem.textContent = erro?.detail ?? 'Erro ao abrir atendimento.';
    mensagem.classList.add('mensagem-erro');
    botaoAbrir.disabled = false;
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

  resultadoPaciente.innerHTML = '<p>Buscando paciente...</p>';

  let resposta;
  try {
    resposta = await fetch(`/api/pacientes/${cpf}`);
  } catch {
    mostrarErro('Não foi possível conectar à API.');
    return;
  }

  if (resposta.status === 404) {
    mostrarErro('Paciente não encontrado. Cadastre o paciente antes de abrir o atendimento.');
    return;
  }
  if (!resposta.ok) {
    mostrarErro('Erro ao buscar paciente.');
    return;
  }

  mostrarFichaPaciente(await resposta.json());
});

const cpfInicial = new URLSearchParams(window.location.search).get('cpf');
if (cpfInicial) {
  campoCpf.value = cpfInicial.replace(/\D/g, '');
  formularioBusca.requestSubmit();
}
