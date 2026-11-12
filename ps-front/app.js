(() => {
  const formulario = document.getElementById('form-busca');
  const resultado = document.getElementById('resultado');
  const novaBusca = criarControleDeBusca();

  function montarCardPaciente(paciente) {
    const card = document.createElement('div');
    card.className = 'card-paciente';

    const tag = document.createElement('span');
    tag.className = 'tag-card';
    tag.textContent = 'Paciente encontrado';
    card.appendChild(tag);

    const titulo = document.createElement('h3');
    titulo.textContent = paciente.nome;
    card.appendChild(titulo);

    const dados = document.createElement('div');
    dados.className = 'dados-paciente';

    const campos = [
      ['CPF', formatarCpf(paciente.cpf)],
      ['Nascimento', formatarData(paciente.data_nascimento)],
      ['Telefone', paciente.telefone ?? '—'],
      ['Gênero', paciente.genero ?? '—'],
      ['Status', paciente.status ?? 'Sem atendimento'],
    ];

    campos.forEach(([label, valor]) => {
      const item = document.createElement('div');

      const legenda = document.createElement('span');
      legenda.textContent = label;

      const valorElemento = document.createElement('strong');
      valorElemento.textContent = valor;

      item.appendChild(legenda);
      item.appendChild(valorElemento);
      dados.appendChild(item);
    });

    card.appendChild(dados);
    return card;
  }

  if (formulario && resultado) {
    formulario.addEventListener('submit', async (event) => {
      event.preventDefault();

      const cpfDigitado = document.getElementById('cpf').value.replace(/\D/g, '');

      if (cpfDigitado.length !== 11 || /^(\d)\1{10}$/.test(cpfDigitado)) {
        resultado.innerHTML = '<p class="mensagem-erro">Digite um CPF válido.</p>';
        return;
      }

      const buscaAindaValida = novaBusca();
      resultado.innerHTML = '<p>Buscando...</p>';

      let resposta;
      try {
        resposta = await fetch(`${API_URL}/pacientes/${cpfDigitado}`);
      } catch {
        if (buscaAindaValida()) resultado.innerHTML = '<p>Não foi possível conectar à API.</p>';
        return;
      }
      const paciente = resposta.ok ? await lerJson(resposta) : null;
      if (!buscaAindaValida()) return; // resposta de uma busca antiga, chegou atrasada

      if (resposta.ok) {
        if (!paciente) {
          resultado.innerHTML = '<p>Erro ao ler os dados do paciente.</p>';
          return;
        }
        resultado.innerHTML = '';
        if (cadastroRecente === cpfDigitado) {
          const aviso = document.createElement('p');
          aviso.className = 'mensagem-sucesso';
          aviso.setAttribute('role', 'status');
          aviso.textContent = 'Paciente cadastrado com sucesso.';
          resultado.appendChild(aviso);
          cadastroRecente = null;
        }
        resultado.appendChild(montarCardPaciente(paciente));

        // Só oferece abrir atendimento se o paciente não tiver um em andamento.
        const acao = document.createElement('a');
        acao.className = 'botao-principal';
        if (podeAbrirAtendimento(paciente.status)) {
          acao.href = `./h04-abrir-atendimento.html?cpf=${cpfDigitado}`;
          acao.textContent = 'Abrir atendimento';
        } else {
          acao.href = `./h05-consultar-atendimento.html?cpf=${cpfDigitado}`;
          acao.textContent = 'Consultar atendimento atual';
        }
        resultado.appendChild(acao);
        return;
      }

      if (resposta.status !== 404) {
        resultado.innerHTML = '<p>Erro ao buscar paciente.</p>';
        return;
      }

      resultado.innerHTML = `
        <div class="caixa-vazia">
          <p>CPF não encontrado na base atual.</p>
          <button type="button" class="botao-principal" id="botao-cadastrar">Cadastrar</button>
        </div>
      `;

      document.getElementById('botao-cadastrar').addEventListener('click', () => {
        window.location.href = `./h03-cadastrar-paciente.html?cpf=${cpfDigitado}`;
      });
    });

    const parametros = new URLSearchParams(window.location.search);
    const cpfInicial = parametros.get('cpf');
    // Vindo do cadastro (H03) com ?cadastrado=1, mostra a confirmação junto do paciente.
    let cadastroRecente = parametros.get('cadastrado') === '1' ? (cpfInicial ?? '').replace(/\D/g, '') : null;
    if (cpfInicial) {
      document.getElementById('cpf').value = cpfInicial;
      formulario.requestSubmit();
    }
  }
})();
