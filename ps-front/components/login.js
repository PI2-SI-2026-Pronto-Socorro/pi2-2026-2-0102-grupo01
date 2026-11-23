const formularioLogin = document.getElementById('formulario-login');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');

const API_URL = '/api';

// ENDPOINT PROVISÓRIO: Ivan deverá confirmar a rota na integração.
const ENDPOINT_LOGIN = `${API_URL}/auth/login`;

let mensagemLogin = document.createElement('p');
mensagemLogin.className = 'aviso-login';
mensagemLogin.setAttribute('role', 'alert');
formularioLogin.appendChild(mensagemLogin);

formularioLogin.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!formularioLogin.reportValidity()) return;

    const botao = formularioLogin.querySelector('button[type="submit"]');

    const email = campoEmail.value.trim();
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
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.message || 'E-mail ou senha inválidos.');
        }

        const perfil =
            dados.perfil ||
            dados.profissional?.perfil ||
            dados.usuario?.perfil;

        if (!perfil) {
            throw new Error('O perfil do profissional não foi informado.');
        }

        sessionStorage.setItem('perfilUsuario', perfil);

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