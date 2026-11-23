const formCadastroProfissional = document.getElementById('form-cadastro-profissional');
const mensagemCadastroProfissional = document.getElementById('mensagem-cadastro-profissional');

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
            mensagemCadastroProfissional.textContent =
                'Preencha todos os campos obrigatórios.';
            mensagemCadastroProfissional.className = 'alert alert-danger';
            return;
        }

        mensagemCadastroProfissional.textContent =
            'Validação inicial concluída. A integração com a API ainda precisa ser confirmada.';
        mensagemCadastroProfissional.className = 'alert alert-info';
    });
}
