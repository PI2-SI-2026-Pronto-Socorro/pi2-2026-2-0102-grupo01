CREATE TYPE "public"."status_atendimento_enum" AS ENUM('Aberto', 'Triado', 'Confirmado', 'Encerrado', 'Cancelado');
CREATE TYPE "public"."classificacao_risco_enum" AS ENUM('Não Urgente', 'Pouco Urgente', 'Urgente', 'Muito Urgente', 'Emergência');
CREATE TYPE "public"."cargo_profissional_enum" AS ENUM('Médico', 'Enfermeiro', 'Técnico de Enfermagem', 'Recepcionista', 'Outro');
CREATE TYPE "public"."perfil_acesso_enum" AS ENUM('Recepção', 'Enfermagem', 'Médico');
CREATE TYPE "public"."status_exame_enum" AS ENUM('Solicitado', 'Em andamento', 'Concluído', 'Cancelado');
CREATE SEQUENCE "public"."seq_numero_atendimento" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE TABLE "paciente" (
        "id_paciente" uuid DEFAULT gen_random_uuid() NOT NULL,
        "nome" varchar(100) NOT NULL,
        "cpf" char(11),
        "rg" varchar(15),
        "data_nascimento" date,
        "genero" varchar(20),
        "telefone" varchar(15),
        "endereco" varchar(255),
        "nome_pai" varchar(100),
        "nome_mae" varchar(100),
        CONSTRAINT "pk_paciente" PRIMARY KEY("id_paciente"),
        CONSTRAINT "uk_paciente_cpf" UNIQUE("cpf")
);

CREATE TABLE "prontuario" (
        "id_prontuario" uuid DEFAULT gen_random_uuid() NOT NULL,
        "id_paciente" uuid NOT NULL,
        "data_abertura" timestamp with time zone DEFAULT now() NOT NULL,
        "obs" text,
        CONSTRAINT "pk_prontuario" PRIMARY KEY("id_prontuario"),
        CONSTRAINT "uk_prontuario_paciente" UNIQUE("id_paciente")
);

CREATE TABLE "profissional" (
        "id_profissional" uuid DEFAULT gen_random_uuid() NOT NULL,
        "nome" varchar(100) NOT NULL,
        "cpf" char(11) NOT NULL,
        "telefone" varchar(15),
        "cargo" "cargo_profissional_enum" NOT NULL,
        "registro_profissional" varchar(25),
        "plantao" varchar(50),
        "especialidade" varchar(80),
        "perfil" "perfil_acesso_enum" NOT NULL,
        "usuario" varchar(50) NOT NULL,
        "senha_hash" varchar(255) NOT NULL,
        CONSTRAINT "pk_profissional" PRIMARY KEY("id_profissional"),
        CONSTRAINT "uk_profissional_cpf" UNIQUE("cpf"),
        CONSTRAINT "uk_profissional_registro" UNIQUE("registro_profissional"),
        CONSTRAINT "uk_profissional_usuario" UNIQUE("usuario")
);

CREATE TABLE "atendimento" (
        "id_atendimento" uuid DEFAULT gen_random_uuid() NOT NULL,
        "id_paciente" uuid NOT NULL,
        "id_profissional" uuid,
        "data_hora_chegada" timestamp with time zone DEFAULT now() NOT NULL,
        "data_hora_saida" timestamp with time zone,
        "numero_atendimento" varchar(11) DEFAULT 'AT' || LPAD(nextval('seq_numero_atendimento')::text, 4, '0') NOT NULL,
        "status_atendimento" "status_atendimento_enum" DEFAULT 'Aberto' NOT NULL,
        "motivo_atendimento" varchar(255),
        CONSTRAINT "pk_atendimento" PRIMARY KEY("id_atendimento"),
        CONSTRAINT "uk_atendimento_numero" UNIQUE("numero_atendimento")
);

CREATE TABLE "triagem" (
        "id_triagem" uuid DEFAULT gen_random_uuid() NOT NULL,
        "id_atendimento" uuid NOT NULL,
        "id_profissional" uuid NOT NULL,
        "peso" numeric(5, 2),
        "altura" numeric(3, 2),
        "pressao_sistolica" smallint,
        "pressao_diastolica" smallint,
        "temperatura" numeric(4, 1),
        "frequencia_cardiaca" smallint,
        "classificacao_risco" "classificacao_risco_enum" NOT NULL,
        "data_hora_triagem" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "pk_triagem" PRIMARY KEY("id_triagem"),
        CONSTRAINT "uk_triagem_atendimento" UNIQUE("id_atendimento"),
        CONSTRAINT "ck_triagem_peso" CHECK ("triagem"."peso" > 0 AND "triagem"."peso" < 500),
        CONSTRAINT "ck_triagem_altura" CHECK ("triagem"."altura" > 0 AND "triagem"."altura" < 3),
        CONSTRAINT "ck_triagem_temperatura" CHECK ("triagem"."temperatura" BETWEEN 25 AND 45),
        CONSTRAINT "ck_triagem_freq" CHECK ("triagem"."frequencia_cardiaca" BETWEEN 0 AND 300),
        CONSTRAINT "ck_triagem_pressao" CHECK ("triagem"."pressao_sistolica" >= "triagem"."pressao_diastolica")
);

CREATE TABLE "queixa" (
        "id_queixa" uuid DEFAULT gen_random_uuid() NOT NULL,
        "id_triagem" uuid NOT NULL,
        "sintomas" text NOT NULL,
        "duracao_sintoma" varchar(50),
        CONSTRAINT "pk_queixa" PRIMARY KEY("id_queixa")
);

CREATE TABLE "consulta_medica" (
        "id_consulta" uuid DEFAULT gen_random_uuid() NOT NULL,
        "id_atendimento" uuid NOT NULL,
        "id_profissional" uuid NOT NULL,
        "data_hora_inicio" timestamp with time zone DEFAULT now() NOT NULL,
        "data_hora_fim" timestamp with time zone,
        "diagnostico" text,
        CONSTRAINT "pk_consulta_medica" PRIMARY KEY("id_consulta"),
        CONSTRAINT "ck_consulta_periodo" CHECK ("consulta_medica"."data_hora_fim" IS NULL OR "consulta_medica"."data_hora_fim" >= "consulta_medica"."data_hora_inicio")
);

CREATE TABLE "internacao" (
        "id_internacao" uuid DEFAULT gen_random_uuid() NOT NULL,
        "id_consulta" uuid NOT NULL,
        "data_hora_indicacao" timestamp with time zone DEFAULT now() NOT NULL,
        "motivo" varchar(255) NOT NULL,
        "leito" varchar(20),
        CONSTRAINT "pk_internacao" PRIMARY KEY("id_internacao"),
        CONSTRAINT "uk_internacao_consulta" UNIQUE("id_consulta")
);

CREATE TABLE "exame" (
        "id_exame" uuid DEFAULT gen_random_uuid() NOT NULL,
        "id_consulta" uuid NOT NULL,
        "tipo" varchar(80) NOT NULL,
        "data_solicitacao" timestamp with time zone DEFAULT now() NOT NULL,
        "data_realizacao" timestamp with time zone,
        "resultado" text,
        "status_exame" "status_exame_enum" DEFAULT 'Solicitado' NOT NULL,
        CONSTRAINT "pk_exame" PRIMARY KEY("id_exame"),
        CONSTRAINT "ck_exame_periodo" CHECK ("exame"."data_realizacao" IS NULL OR "exame"."data_realizacao" >= "exame"."data_solicitacao")
);

CREATE TABLE "prescricao" (
        "id_prescricao" uuid DEFAULT gen_random_uuid() NOT NULL,
        "id_consulta" uuid NOT NULL,
        "data_hora" timestamp with time zone DEFAULT now() NOT NULL,
        "orientacoes" text,
        CONSTRAINT "pk_prescricao" PRIMARY KEY("id_prescricao")
);

CREATE TABLE "medicacao" (
        "id_medicacao" uuid DEFAULT gen_random_uuid() NOT NULL,
        "medicamento" varchar(100) NOT NULL,
        "principio_ativo" varchar(100),
        "apresentacao" varchar(50),
        "concentracao" varchar(50),
        CONSTRAINT "pk_medicacao" PRIMARY KEY("id_medicacao"),
        CONSTRAINT "uk_medicacao_remedio" UNIQUE NULLS NOT DISTINCT("medicamento","apresentacao","concentracao")
);

CREATE TABLE "prescricao_medicacao" (
        "id_prescricao" uuid NOT NULL,
        "id_medicacao" uuid NOT NULL,
        "dose" varchar(50) NOT NULL,
        "intervalo_horas" smallint NOT NULL,
        "duracao_dias" smallint,
        "via" varchar(30),
        "observacao" varchar(255),
        CONSTRAINT "pk_prescricao_medicacao" PRIMARY KEY("id_prescricao","id_medicacao"),
        CONSTRAINT "ck_presmed_intervalo" CHECK ("prescricao_medicacao"."intervalo_horas" > 0 AND "prescricao_medicacao"."intervalo_horas" <= 168),
        CONSTRAINT "ck_presmed_duracao" CHECK ("prescricao_medicacao"."duracao_dias" IS NULL OR "prescricao_medicacao"."duracao_dias" > 0)
);

ALTER TABLE "prontuario" ADD CONSTRAINT "fk_prontuario_paciente" FOREIGN KEY ("id_paciente") REFERENCES "public"."paciente"("id_paciente") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "atendimento" ADD CONSTRAINT "fk_atendimento_paciente" FOREIGN KEY ("id_paciente") REFERENCES "public"."paciente"("id_paciente") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "atendimento" ADD CONSTRAINT "fk_atendimento_profissional" FOREIGN KEY ("id_profissional") REFERENCES "public"."profissional"("id_profissional") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "triagem" ADD CONSTRAINT "fk_triagem_atendimento" FOREIGN KEY ("id_atendimento") REFERENCES "public"."atendimento"("id_atendimento") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "triagem" ADD CONSTRAINT "fk_triagem_profissional" FOREIGN KEY ("id_profissional") REFERENCES "public"."profissional"("id_profissional") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "queixa" ADD CONSTRAINT "fk_queixa_triagem" FOREIGN KEY ("id_triagem") REFERENCES "public"."triagem"("id_triagem") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "consulta_medica" ADD CONSTRAINT "fk_consulta_atendimento" FOREIGN KEY ("id_atendimento") REFERENCES "public"."atendimento"("id_atendimento") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "consulta_medica" ADD CONSTRAINT "fk_consulta_profissional" FOREIGN KEY ("id_profissional") REFERENCES "public"."profissional"("id_profissional") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "internacao" ADD CONSTRAINT "fk_internacao_consulta" FOREIGN KEY ("id_consulta") REFERENCES "public"."consulta_medica"("id_consulta") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "exame" ADD CONSTRAINT "fk_exame_consulta" FOREIGN KEY ("id_consulta") REFERENCES "public"."consulta_medica"("id_consulta") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "prescricao" ADD CONSTRAINT "fk_prescricao_consulta" FOREIGN KEY ("id_consulta") REFERENCES "public"."consulta_medica"("id_consulta") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "prescricao_medicacao" ADD CONSTRAINT "fk_presmed_prescricao" FOREIGN KEY ("id_prescricao") REFERENCES "public"."prescricao"("id_prescricao") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "prescricao_medicacao" ADD CONSTRAINT "fk_presmed_medicacao" FOREIGN KEY ("id_medicacao") REFERENCES "public"."medicacao"("id_medicacao") ON DELETE restrict ON UPDATE no action;
CREATE UNIQUE INDEX "uk_atendimento_em_andamento" ON "atendimento" USING btree ("id_paciente") WHERE "atendimento"."status_atendimento" NOT IN ('Encerrado', 'Cancelado');
CREATE INDEX "idx_atendimento_paciente" ON "atendimento" USING btree ("id_paciente");
CREATE INDEX "idx_atendimento_profissional" ON "atendimento" USING btree ("id_profissional");
CREATE INDEX "idx_triagem_profissional" ON "triagem" USING btree ("id_profissional");
CREATE INDEX "idx_queixa_triagem" ON "queixa" USING btree ("id_triagem");
CREATE INDEX "idx_consulta_atendimento" ON "consulta_medica" USING btree ("id_atendimento");
CREATE INDEX "idx_consulta_profissional" ON "consulta_medica" USING btree ("id_profissional");
CREATE INDEX "idx_exame_consulta" ON "exame" USING btree ("id_consulta");
CREATE INDEX "idx_prescricao_consulta" ON "prescricao" USING btree ("id_consulta");
CREATE INDEX "idx_presmed_medicacao" ON "prescricao_medicacao" USING btree ("id_medicacao");