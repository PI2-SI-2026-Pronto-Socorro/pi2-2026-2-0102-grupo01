const formularioLogin = document.getElementById('formulario-login');
const campoUsuario = document.getElementById('usuario');
const campoSenha = document.getElementById('senha');

const API_URL = '/api';

const ENDPOINT_LOGIN = `${API_URL}/auth/login`;

let mensagemLogin = document.createElement('p');
mensagemLogin.className = 'aviso-login';
mensagemLogin.setAttribute('role', 'alert');
formularioLogin.appendChild(mensagemLogin);

formularioLogin.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!formularioLogin.reportValidity()) return;

    const botao = formularioLogin.querySelector('button[type="submit"]');

    const usuario = campoUsuario.value.trim();
    const senha = campoSenha.value;

    mensagemLogin.textContent = '';
    botao.disabled = true;
    botao.textContent = 'Entrando...';

    try {
        const resposta = await fetch(ENDPOINT_LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ usuario, senha })
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(dados.detail || 'Usuário ou senha inválidos.');
        }

        const perfil =
            dados.perfil ||
            dados.profissional?.perfil ||
            dados.usuario?.perfil;

        if (!perfil) {
            throw new Error('O perfil do profissional não foi informado.');
        }

        sessionStorage.setItem('perfilUsuario', perfil);
        sessionStorage.setItem('nomeUsuario', dados.profissional?.nome ?? '');

        if (dados.token) {
            sessionStorage.setItem('token', dados.token);
        }

        window.location.href = './index.html';

    } catch (erro) {
        mensagemLogin.textContent =
            erro.message || 'Não foi possível realizar o login.';

    } finally {
        botao.disabled = false;
        botao.textContent = 'Entrar';
    }
});