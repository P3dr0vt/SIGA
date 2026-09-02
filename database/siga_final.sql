-- SIGA - Sistema Integrado de Gestão de Alocação (VERSÃO 4 - CORRIGIDA)
-- Execute este arquivo no MySQL Workbench

DROP DATABASE IF EXISTS siga_db;
CREATE DATABASE siga_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE siga_db;

-- 1. INSTRUTORES
CREATE TABLE Instrutores (
    id_instrutor INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USUÁRIOS
CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    perfil ENUM('admin', 'instrutor', 'tv') NOT NULL DEFAULT 'instrutor',
    primeiro_acesso TINYINT(1) DEFAULT 1,
    id_instrutor_vinculado INT DEFAULT NULL,
    CONSTRAINT fk_user_instrutor FOREIGN KEY (id_instrutor_vinculado) 
        REFERENCES Instrutores(id_instrutor) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. SALAS
CREATE TABLE Salas (
    id_sala INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    bloco VARCHAR(50) NOT NULL DEFAULT 'A',
    tipo ENUM('SALA', 'LABORATORIO') NOT NULL DEFAULT 'SALA'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Notificacoes (
    id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
    id_instrutor INT NOT NULL,
    mensagem TEXT NOT NULL,
    lida TINYINT(1) DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_instrutor FOREIGN KEY (id_instrutor) 
        REFERENCES Instrutores(id_instrutor) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TURMAS
CREATE TABLE Turmas (
    id_turma INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    turno ENUM('Manhã', 'Tarde', 'Noite') NOT NULL DEFAULT 'Manhã',
    UNIQUE KEY unique_turma_turno (nome, turno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. ALOCAÇÕES
CREATE TABLE Alocacoes (
    id_alocacao INT AUTO_INCREMENT PRIMARY KEY,
    id_instrutor INT NOT NULL,
    id_sala INT NOT NULL,
    id_turma INT NOT NULL,
    turno ENUM('Manhã', 'Tarde', 'Noite') NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    criado_por_perfil ENUM('admin', 'instrutor') NOT NULL DEFAULT 'admin',
    criado_por_usuario INT NULL,
    CONSTRAINT fk_aloc_instrutor FOREIGN KEY (id_instrutor) 
        REFERENCES Instrutores(id_instrutor) ON DELETE CASCADE,
    CONSTRAINT fk_aloc_sala FOREIGN KEY (id_sala) 
        REFERENCES Salas(id_sala) ON DELETE CASCADE,
    CONSTRAINT fk_aloc_turma FOREIGN KEY (id_turma) 
        REFERENCES Turmas(id_turma) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- DADOS INICIAIS
-- ==========================================================

-- Admin (primeiro_acesso = 0 pois é conta do sistema)
INSERT INTO Usuarios (email, senha, nome, perfil, primeiro_acesso)
VALUES ('admin@senai.com', 'admin123', 'Administrador SIGA', 'admin', 0);

-- Monitor TV
INSERT INTO Usuarios (email, senha, nome, perfil, primeiro_acesso)
VALUES ('tv@senai.com', 'tv123', 'Monitor Entrada', 'tv', 0);

-- Instrutores de exemplo
INSERT INTO Instrutores (nome, matricula) VALUES
('Carlos Alberto', '1001'),
('Maria Fernanda', '1002'),
('João Pedro', '1003'),
('Ana Beatriz', '1004');

-- Usuários vinculados aos instrutores
-- Login: matrícula (ex: 1001) | Senha inicial: a própria matrícula | primeiro_acesso=1 (força troca de senha)
INSERT INTO Usuarios (email, senha, nome, perfil, primeiro_acesso, id_instrutor_vinculado) VALUES
('1001@senai.com', '1001', 'Carlos Alberto',  'instrutor', 1, 1),
('1002@senai.com', '1002', 'Maria Fernanda',  'instrutor', 1, 2),
('1003@senai.com', '1003', 'João Pedro',      'instrutor', 1, 3),
('1004@senai.com', '1004', 'Ana Beatriz',     'instrutor', 1, 4);

-- Salas de exemplo
INSERT INTO Salas (nome, bloco) VALUES
('Sala 101', 'A'),
('Sala 102', 'A'),
('Sala 103', 'A'),
('Sala 201', 'B'),
('Sala 202', 'B'),
('Sala 301', 'C'),
('Robótica 01', 'ROBOTICA'),
('Robótica 02', 'ROBOTICA'),
('Robótica 03', 'ROBOTICA'),
('Robótica 04', 'ROBOTICA');

-- Turmas de exemplo
INSERT INTO Turmas (nome, turno) VALUES
('Aprendizagem Industrial', 'Manhã'),
('Técnico em Automação', 'Tarde'),
('Técnico em Mecatrônica', 'Noite'),
('Robótica Avançada', 'Manhã'),
('Técnico em Informática', 'Tarde');

-- Exemplo de turma com mesmo nome em turnos diferentes
INSERT INTO Turmas (nome, turno) VALUES
('Aprendizagem Industrial', 'Tarde');

SELECT 'Banco de dados SIGA criado com sucesso!' AS status;
