const formCadastroProfissional = document.getElementById('form-cadastro-profissional');
const mensagemCadastroProfissional = document.getElementById('mensagem-cadastro-profissional');

if (formCadastroProfissional && mensagemCadastroProfissional) {
  formCadastroProfissional.addEventListener('submit', async (event) => {
    event.preventDefault();
    mensagemCadastroProfissional.className = 'alert';
    mensagemCadastroProfissional.textContent = '';

    const dados = {
      nome: document.getElementById('nome-profissional').value.trim(),
      cpf: document.getElementById('cpf-profissional').value.replace(/\D/g, ''),
      cargo: document.getElementById('cargo-profissional').value,
      telefone: document.getElementById('telefone-profissional').value.trim(),
      registro_profissional: document.getElementById('registro-profissional').value.trim(),
      especialidade: document.getElementById('especialidade-profissional').value.trim(),
      plantao: document.getElementById('plantao-profissional').value.trim(),
      perfil: document.getElementById('perfil-profissional').value,
      usuario: document.getElementById('usuario-profissional').value.trim(),
      senha: document.getElementById('senha-profissional').value,
    };

    if (!dados.nome || !dados.cpf || !dados.cargo || !dados.perfil || !dados.usuario || !dados.senha) {
      mensagemCadastroProfissional.textContent = 'Preencha todos os campos obrigatórios.';
      mensagemCadastroProfissional.className = 'alert alert-danger';
      return;
    }
    if (dados.nome.length < 3) {
      mensagemCadastroProfissional.textContent = 'Informe o nome completo do profissional.';
      mensagemCadastroProfissional.className = 'alert alert-danger';
      return;
    }
    if (!cpfComDigitosValidos(dados.cpf)) {
      mensagemCadastroProfissional.textContent = 'Informe um CPF válido.';
      mensagemCadastroProfissional.className = 'alert alert-danger';
      return;
    }
    if (dados.usuario.length < 3) {
      mensagemCadastroProfissional.textContent = 'O usuário deve ter pelo menos 3 caracteres.';
      mensagemCadastroProfissional.className = 'alert alert-danger';
      return;
    }
    if (dados.senha.length < 8 || dados.senha.length > 72 || !/\p{L}/u.test(dados.senha) || !/\d/.test(dados.senha)) {
      mensagemCadastroProfissional.textContent = 'A senha deve ter de 8 a 72 caracteres e conter letras e números.';
      mensagemCadastroProfissional.className = 'alert alert-danger';
      return;
    }

    const botao = formCadastroProfissional.querySelector('[type="submit"]');
    botao.disabled = true;
    mensagemCadastroProfissional.textContent = 'Cadastrando profissional...';

    let resposta;
    try {
      resposta = await fetch(`${API_URL}/profissionais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
    } catch {
      mensagemCadastroProfissional.textContent = 'Não foi possível conectar à API.';
      mensagemCadastroProfissional.className = 'alert alert-danger';
      botao.disabled = false;
      return;
    }

    const resultado = await lerJson(resposta);
    if (!resposta.ok) {
      mensagemCadastroProfissional.textContent = resultado?.detail ?? 'Não foi possível cadastrar o profissional.';
      mensagemCadastroProfissional.className = 'alert alert-danger';
      botao.disabled = false;
      return;
    }

    mensagemCadastroProfissional.textContent = 'Profissional cadastrado com sucesso.';
    mensagemCadastroProfissional.className = 'alert alert-success';
    formCadastroProfissional.reset();
    botao.disabled = false;
  });
}
