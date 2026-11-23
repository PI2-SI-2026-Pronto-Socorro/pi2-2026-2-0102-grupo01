const formCadastroProfissional = document.getElementById('form-cadastro-profissional');
const mensagemCadastroProfissional = document.getElementById('mensagem-cadastro-profissional');

function validarCPF(cpf) {
	const numeros = cpf.replace(/\D/g, '');

	if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
		return false;
	}

	let soma = 0;

	for (let i = 0; i < 9; i++) {
		soma += Number(numeros[i]) * (10 - i);
	}

	let digito = (soma * 10) % 11;
	if (digito === 10) digito = 0;

	if (digito !== Number(numeros[9])) {
		return false;
	}

	soma = 0;

	for (let i = 0; i < 10; i++) {
		soma += Number(numeros[i]) * (11 - i);
	}

	digito = (soma * 10) % 11;
	if (digito === 10) digito = 0;

	return digito === Number(numeros[10]);
}

if (formCadastroProfissional && mensagemCadastroProfissional) {
	formCadastroProfissional.addEventListener('submit', (event) => {
		event.preventDefault();

		const nome = document.getElementById('nome-profissional').value.trim();
		const cpf = document.getElementById('cpf-profissional').value.trim();
		const cargo = document.getElementById('cargo-profissional').value;
		const perfil = document.getElementById('perfil-profissional').value;
		const usuario = document.getElementById('usuario-profissional').value.trim();
		const senha = document.getElementById('senha-profissional').value;

		if (!nome || !cpf || !cargo || !perfil || !usuario || !senha) {
			mensagemCadastroProfissional.textContent = 'Preencha todos os campos obrigatórios.';
			mensagemCadastroProfissional.className = 'alert alert-danger';
			return;
		}

		if (nome.length < 3) {
			mensagemCadastroProfissional.textContent = 'Informe o nome completo do profissional.';
			mensagemCadastroProfissional.className = 'alert alert-danger';
			return;
		}

		if (!validarCPF(cpf)) {
			mensagemCadastroProfissional.textContent = 'Informe um CPF válido.';
			mensagemCadastroProfissional.className = 'alert alert-danger';
			return;
		}

		if (usuario.length < 3) {
			mensagemCadastroProfissional.textContent = 'O usuário deve ter pelo menos 3 caracteres.';
			mensagemCadastroProfissional.className = 'alert alert-danger';
			return;
		}

		if (senha.length < 6) {
			mensagemCadastroProfissional.textContent = 'A senha deve ter pelo menos 6 caracteres.';
			mensagemCadastroProfissional.className = 'alert alert-danger';
			return;
		}

		mensagemCadastroProfissional.textContent = 'Dados validados com sucesso. O cadastro efetivo depende da integração com a API.';
		mensagemCadastroProfissional.className = 'alert alert-info';
	});
}