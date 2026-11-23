-- SCRIPT DE TESTE - Sistema de atendimento (Neon / PostgreSQL 15+)
-- Dados de teste: CPFs 999999999xx e prefixo "TESTE".
-- Roda em transação e faz ROLLBACK no fim: nada fica gravado.
-- Resultado: tabela test_log (OK / FALHOU por teste).

BEGIN;

DROP TABLE IF EXISTS pg_temp.test_log;
DROP TABLE IF EXISTS pg_temp.test_ids;
CREATE TEMP TABLE test_log (ordem serial, teste text, resultado text);
CREATE TEMP TABLE test_ids (chave text PRIMARY KEY, id uuid);

-- Helper: executa um SQL que deve falhar com o SQLSTATE esperado.
DROP FUNCTION IF EXISTS pg_temp.esperar_erro(text, text, text);
CREATE FUNCTION pg_temp.esperar_erro(p_nome text, p_sql text, p_sqlstate text)
RETURNS void LANGUAGE plpgsql AS $f$
DECLARE v_state text; v_msg text;
BEGIN
  BEGIN
    EXECUTE p_sql;
    RAISE EXCEPTION '__sem_erro__';
  EXCEPTION WHEN OTHERS THEN
    v_state := SQLSTATE; v_msg := SQLERRM;
  END;
  IF v_msg = '__sem_erro__' THEN
    INSERT INTO test_log(teste, resultado) VALUES (p_nome, 'FALHOU - deveria dar erro e passou');
  ELSIF v_state = p_sqlstate THEN
    INSERT INTO test_log(teste, resultado) VALUES (p_nome, 'OK - bloqueado (' || v_state || ')');
  ELSE
    INSERT INTO test_log(teste, resultado) VALUES (p_nome, 'FALHOU - erro inesperado ' || v_state || ': ' || v_msg);
  END IF;
END $f$;

-- 1) FLUXO padrão: inserções válidas

DO $$
DECLARE
  v_pac uuid; v_pront uuid; v_enf uuid; v_med uuid; v_atend uuid;
  v_triagem uuid; v_consulta uuid; v_presc uuid; v_med1 uuid; v_med2 uuid;
  v_exame uuid; v_intern uuid; v_numero text;
BEGIN
  INSERT INTO paciente (nome, cpf, rg, data_nascimento, genero, telefone, endereco, nome_pai, nome_mae)
  VALUES ('TESTE Maria da Silva', '99999999901', '123456789', '1990-05-10', 'Feminino',
          '11999990000', 'Rua Teste, 100 - Sumaré, São Paulo', 'José da Silva', 'Ana da Silva')
  RETURNING id_paciente INTO v_pac;

  INSERT INTO prontuario (id_paciente, obs) VALUES (v_pac, 'Prontuário de teste')
  RETURNING id_prontuario INTO v_pront;

  INSERT INTO profissional (nome, cpf, telefone, cargo, registro_profissional, plantao, especialidade, perfil, usuario, senha_hash)
  VALUES ('TESTE Enfermeira Carla', '99999999911', '11988880000', 'Enfermeiro', 'COREN-TESTE-1', 'Noturno', NULL, 'Enfermagem', 'teste_enf', 'hash_teste')
  RETURNING id_profissional INTO v_enf;

  INSERT INTO profissional (nome, cpf, telefone, cargo, registro_profissional, plantao, especialidade, perfil, usuario, senha_hash)
  VALUES ('TESTE Dr. Paulo', '99999999912', '11977770000', 'Médico', 'CRM-TESTE-1', 'Diurno', 'Clínica Geral', 'Médico', 'teste_med', 'hash_teste')
  RETURNING id_profissional INTO v_med;

  INSERT INTO atendimento (id_paciente, motivo_atendimento)
  VALUES (v_pac, 'Dor de cabeça e febre')
  RETURNING id_atendimento, numero_atendimento INTO v_atend, v_numero;

  INSERT INTO triagem (id_atendimento, id_profissional, peso, altura, pressao_sistolica, pressao_diastolica,
                       temperatura, frequencia_cardiaca, classificacao_risco)
  VALUES (v_atend, v_enf, 70.50, 1.75, 120, 80, 38.5, 90, 'Urgente')
  RETURNING id_triagem INTO v_triagem;

  INSERT INTO queixa (id_triagem, sintomas, duracao_sintoma)
  VALUES (v_triagem, 'Cefaleia intensa e febre', '2 dias'),
         (v_triagem, 'Náusea', '1 dia');

  UPDATE atendimento SET status_atendimento = 'Triado' WHERE id_atendimento = v_atend;

  INSERT INTO consulta_medica (id_atendimento, id_profissional, diagnostico)
  VALUES (v_atend, v_med, 'Suspeita de virose')
  RETURNING id_consulta INTO v_consulta;

  UPDATE atendimento SET status_atendimento = 'Confirmado', id_profissional = v_med WHERE id_atendimento = v_atend;

  INSERT INTO exame (id_consulta, tipo) VALUES (v_consulta, 'Hemograma completo')
  RETURNING id_exame INTO v_exame;
  UPDATE exame SET status_exame = 'Concluído', data_realizacao = now() + interval '1 hour',
                   resultado = 'Dentro da normalidade' WHERE id_exame = v_exame;

  INSERT INTO prescricao (id_consulta, orientacoes) VALUES (v_consulta, 'Repouso e hidratação')
  RETURNING id_prescricao INTO v_presc;

  INSERT INTO medicacao (medicamento, principio_ativo, apresentacao, concentracao)
  VALUES ('TESTE Dipirona', 'Dipirona sódica', 'Comprimido', '500mg') RETURNING id_medicacao INTO v_med1;
  INSERT INTO medicacao (medicamento, principio_ativo, apresentacao, concentracao)
  VALUES ('TESTE Paracetamol', 'Paracetamol', NULL, NULL) RETURNING id_medicacao INTO v_med2;

  INSERT INTO prescricao_medicacao (id_prescricao, id_medicacao, dose, intervalo_horas, duracao_dias, via, observacao)
  VALUES (v_presc, v_med1, '1 comprimido', 6, 5, 'Oral', 'Se dor ou febre'),
         (v_presc, v_med2, '20 gotas', 8, NULL, 'Oral', NULL);

  INSERT INTO internacao (id_consulta, motivo, leito)
  VALUES (v_consulta, 'Observação por 24h', 'L-101') RETURNING id_internacao INTO v_intern;

  INSERT INTO test_ids VALUES ('paciente', v_pac), ('enfermeiro', v_enf), ('medico', v_med),
    ('atendimento', v_atend), ('triagem', v_triagem), ('consulta', v_consulta),
    ('prescricao', v_presc), ('medicacao1', v_med1), ('exame', v_exame), ('internacao', v_intern);

  INSERT INTO test_log(teste, resultado)
  VALUES ('1. Fluxo feliz completo', 'OK - todos os inserts passaram (numero_atendimento gerado: ' || v_numero || ')');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO test_log(teste, resultado) VALUES ('1. Fluxo feliz completo', 'FALHOU - ' || SQLSTATE || ': ' || SQLERRM);
END $$;


-- 2) TESTES NEGATIVOS: o banco deve rejeitar

SELECT pg_temp.esperar_erro('2.01 Segundo atendimento aberto p/ mesmo paciente',
  $q$INSERT INTO atendimento (id_paciente) SELECT id FROM test_ids WHERE chave='paciente'$q$, '23505');

SELECT pg_temp.esperar_erro('2.02 CPF de paciente duplicado',
  $q$INSERT INTO paciente (nome, cpf) VALUES ('TESTE Duplicado', '99999999901')$q$, '23505');

SELECT pg_temp.esperar_erro('2.03 Prontuário duplicado p/ mesmo paciente',
  $q$INSERT INTO prontuario (id_paciente) SELECT id FROM test_ids WHERE chave='paciente'$q$, '23505');

SELECT pg_temp.esperar_erro('2.04 Segunda triagem no mesmo atendimento',
  $q$INSERT INTO triagem (id_atendimento, id_profissional, classificacao_risco)
     SELECT (SELECT id FROM test_ids WHERE chave='atendimento'), (SELECT id FROM test_ids WHERE chave='enfermeiro'), 'Urgente'$q$, '23505');

SELECT pg_temp.esperar_erro('2.05 Pressão sistólica < diastólica',
  $q$UPDATE triagem SET pressao_sistolica = 60, pressao_diastolica = 90
     WHERE id_triagem = (SELECT id FROM test_ids WHERE chave='triagem')$q$, '23514');

SELECT pg_temp.esperar_erro('2.06 Temperatura fora do limite (45.1)',
  $q$UPDATE triagem SET temperatura = 45.1 WHERE id_triagem = (SELECT id FROM test_ids WHERE chave='triagem')$q$, '23514');

SELECT pg_temp.esperar_erro('2.07 Peso negativo',
  $q$UPDATE triagem SET peso = -5 WHERE id_triagem = (SELECT id FROM test_ids WHERE chave='triagem')$q$, '23514');

SELECT pg_temp.esperar_erro('2.08 Classificação de risco inválida (enum)',
  $q$UPDATE triagem SET classificacao_risco = 'Qualquer Coisa'
     WHERE id_triagem = (SELECT id FROM test_ids WHERE chave='triagem')$q$, '22P02');

SELECT pg_temp.esperar_erro('2.09 Consulta com fim antes do início',
  $q$UPDATE consulta_medica SET data_hora_fim = data_hora_inicio - interval '1 hour'
     WHERE id_consulta = (SELECT id FROM test_ids WHERE chave='consulta')$q$, '23514');

SELECT pg_temp.esperar_erro('2.10 Exame realizado antes de solicitado',
  $q$UPDATE exame SET data_realizacao = data_solicitacao - interval '1 day'
     WHERE id_exame = (SELECT id FROM test_ids WHERE chave='exame')$q$, '23514');

SELECT pg_temp.esperar_erro('2.11 Segunda internação na mesma consulta',
  $q$INSERT INTO internacao (id_consulta, motivo) SELECT id, 'Outra' FROM test_ids WHERE chave='consulta'$q$, '23505');

SELECT pg_temp.esperar_erro('2.12 Intervalo de medicação = 0',
  $q$INSERT INTO prescricao_medicacao (id_prescricao, id_medicacao, dose, intervalo_horas)
     SELECT (SELECT id FROM test_ids WHERE chave='prescricao'),
            (SELECT id_medicacao FROM medicacao WHERE medicamento='TESTE Paracetamol'), '1', 0$q$, '23514');

SELECT pg_temp.esperar_erro('2.13 Duração de medicação negativa',
  $q$UPDATE prescricao_medicacao SET duracao_dias = -1
     WHERE id_prescricao = (SELECT id FROM test_ids WHERE chave='prescricao')$q$, '23514');

SELECT pg_temp.esperar_erro('2.14 Medicamento duplicado com NULLs (NULLS NOT DISTINCT)',
  $q$INSERT INTO medicacao (medicamento) VALUES ('TESTE Paracetamol')$q$, '23505');

SELECT pg_temp.esperar_erro('2.15 Atendimento com paciente inexistente (FK)',
  $q$INSERT INTO atendimento (id_paciente) VALUES (gen_random_uuid())$q$, '23503');

SELECT pg_temp.esperar_erro('2.16 Excluir paciente com prontuário (RESTRICT)',
  $q$DELETE FROM paciente WHERE id_paciente = (SELECT id FROM test_ids WHERE chave='paciente')$q$, '23503');

SELECT pg_temp.esperar_erro('2.17 CPF de profissional duplicado',
  $q$INSERT INTO profissional (nome, cpf, cargo, perfil, usuario, senha_hash)
     VALUES ('TESTE Clone', '99999999911', 'Médico', 'Médico', 'teste_clone', 'x')$q$, '23505');

SELECT pg_temp.esperar_erro('2.18 Usuário de profissional duplicado',
  $q$INSERT INTO profissional (nome, cpf, cargo, perfil, usuario, senha_hash)
     VALUES ('TESTE Clone', '99999999913', 'Médico', 'Médico', 'teste_med', 'x')$q$, '23505');


-- 3) Encerrar atendimento e abrir um novo

DO $$
DECLARE v_pac uuid; v_atend uuid; v_numero text;
BEGIN
  SELECT id INTO v_pac FROM test_ids WHERE chave = 'paciente';
  UPDATE atendimento SET status_atendimento = 'Encerrado', data_hora_saida = now()
   WHERE id_atendimento = (SELECT id FROM test_ids WHERE chave = 'atendimento');

  INSERT INTO atendimento (id_paciente, motivo_atendimento) VALUES (v_pac, 'Retorno')
  RETURNING id_atendimento, numero_atendimento INTO v_atend, v_numero;

  INSERT INTO test_log(teste, resultado)
  VALUES ('3. Novo atendimento após encerrar o anterior', 'OK - criado ' || v_numero);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO test_log(teste, resultado) VALUES ('3. Novo atendimento após encerrar o anterior', 'FALHOU - ' || SQLERRM);
END $$;


-- 4) Contagem de registros de teste (compara com o esperado) + resultado final

INSERT INTO test_log(teste, resultado)
SELECT '4. Contagem ' || t,
       CASE WHEN c = esperado THEN 'OK (' || c || ')'
            ELSE 'FALHOU - esperado ' || esperado || ', veio ' || c END
FROM (
  SELECT 'paciente' t, count(*) c, 1 esperado FROM paciente WHERE cpf = '99999999901'
  UNION ALL SELECT 'prontuario', count(*), 1 FROM prontuario WHERE id_paciente IN (SELECT id FROM test_ids WHERE chave='paciente')
  UNION ALL SELECT 'profissional', count(*), 2 FROM profissional WHERE cpf LIKE '999999999%'
  UNION ALL SELECT 'atendimento', count(*), 2 FROM atendimento WHERE id_paciente IN (SELECT id FROM test_ids WHERE chave='paciente')
  UNION ALL SELECT 'triagem', count(*), 1 FROM triagem WHERE id_atendimento IN (SELECT id FROM test_ids WHERE chave='atendimento')
  UNION ALL SELECT 'queixa', count(*), 2 FROM queixa WHERE id_triagem IN (SELECT id FROM test_ids WHERE chave='triagem')
  UNION ALL SELECT 'consulta_medica', count(*), 1 FROM consulta_medica WHERE id_consulta IN (SELECT id FROM test_ids WHERE chave='consulta')
  UNION ALL SELECT 'exame', count(*), 1 FROM exame WHERE id_consulta IN (SELECT id FROM test_ids WHERE chave='consulta')
  UNION ALL SELECT 'prescricao', count(*), 1 FROM prescricao WHERE id_consulta IN (SELECT id FROM test_ids WHERE chave='consulta')
  UNION ALL SELECT 'medicacao', count(*), 2 FROM medicacao WHERE medicamento LIKE 'TESTE%'
  UNION ALL SELECT 'prescricao_medicacao', count(*), 2 FROM prescricao_medicacao WHERE id_prescricao IN (SELECT id FROM test_ids WHERE chave='prescricao')
  UNION ALL SELECT 'internacao', count(*), 1 FROM internacao WHERE id_consulta IN (SELECT id FROM test_ids WHERE chave='consulta')
) x;

SELECT ordem, teste, resultado FROM test_log ORDER BY ordem;

ROLLBACK;