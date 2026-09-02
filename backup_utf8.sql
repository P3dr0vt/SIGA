-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: siga_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Alocacoes`
--

DROP TABLE IF EXISTS `Alocacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Alocacoes` (
  `id_alocacao` int NOT NULL AUTO_INCREMENT,
  `id_instrutor` int NOT NULL,
  `id_sala` int NOT NULL,
  `id_turma` int NOT NULL,
  `turno` enum('Manh├ú','Tarde','Noite') NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `criado_por_perfil` enum('admin','instrutor') NOT NULL DEFAULT 'admin',
  `criado_por_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_alocacao`),
  KEY `fk_aloc_instrutor` (`id_instrutor`),
  KEY `fk_aloc_sala` (`id_sala`),
  KEY `fk_aloc_turma` (`id_turma`),
  CONSTRAINT `fk_aloc_instrutor` FOREIGN KEY (`id_instrutor`) REFERENCES `Instrutores` (`id_instrutor`) ON DELETE CASCADE,
  CONSTRAINT `fk_aloc_sala` FOREIGN KEY (`id_sala`) REFERENCES `Salas` (`id_sala`) ON DELETE CASCADE,
  CONSTRAINT `fk_aloc_turma` FOREIGN KEY (`id_turma`) REFERENCES `Turmas` (`id_turma`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Alocacoes`
--

LOCK TABLES `Alocacoes` WRITE;
/*!40000 ALTER TABLE `Alocacoes` DISABLE KEYS */;
INSERT INTO `Alocacoes` VALUES (12,54,22,41,'Tarde','2026-06-03','2026-08-28','admin',1),(15,43,14,45,'Tarde','2026-06-03','2026-06-03','admin',1),(21,40,17,47,'Tarde','2026-06-03','2026-06-16','admin',1),(22,37,17,47,'Tarde','2026-06-17','2026-07-08','admin',1),(23,40,17,47,'Tarde','2026-07-09','2026-07-16','admin',1),(24,63,28,48,'Tarde','2026-06-03','2026-06-18','admin',1),(25,61,28,48,'Tarde','2026-06-22','2026-07-16','admin',1),(26,52,30,49,'Tarde','2026-06-03','2026-12-11','admin',1),(27,61,19,58,'Manh├ú','2026-06-12','2026-08-28','admin',1),(29,53,16,53,'Manh├ú','2026-06-12','2026-06-26','admin',1),(30,40,17,57,'Manh├ú','2026-06-12','2026-12-11','admin',1),(31,45,26,56,'Manh├ú','2026-06-12','2026-12-11','admin',1),(33,49,16,53,'Manh├ú','2026-06-29','2026-12-17','admin',1),(34,60,13,31,'Noite','2026-06-12','2026-12-10','admin',1),(35,43,14,32,'Noite','2026-06-12','2026-08-27','admin',1),(36,55,28,23,'Noite','2026-06-12','2026-08-27','admin',1),(37,38,33,55,'Manh├ú','2026-06-12','2026-12-11','admin',1),(38,56,18,40,'Tarde','2026-06-16','2026-08-17','admin',1),(39,44,16,43,'Tarde','2026-06-16','2026-08-28','admin',1),(40,42,21,46,'Tarde','2026-06-03','2026-06-15','admin',1),(42,42,26,46,'Tarde','2026-06-16','2026-07-06','admin',1),(43,38,14,45,'Tarde','2026-06-16','2026-07-17','admin',1),(44,56,21,26,'Noite','2026-06-16','2026-08-28','admin',1),(45,44,23,25,'Noite','2026-06-16','2026-08-28','admin',1),(46,57,19,28,'Noite','2026-06-16','2026-08-28','admin',1),(48,59,35,54,'Manh├ú','2026-06-16','2026-10-01','admin',1),(49,50,35,42,'Tarde','2026-06-16','2026-08-28','admin',1),(50,37,35,59,'Noite','2026-06-16','2026-07-14','admin',1),(55,64,11,34,'Tarde','2026-06-17','2026-06-17','admin',1),(56,64,18,33,'Noite','2026-06-16','2026-06-16','admin',1),(57,64,18,33,'Noite','2026-06-18','2026-08-26','admin',1),(59,64,29,33,'Noite','2026-06-17','2026-06-17','admin',1),(60,64,21,34,'Tarde','2026-06-19','2026-06-22','admin',1),(61,64,11,34,'Tarde','2026-06-18','2026-06-18','admin',1),(62,49,18,52,'Manh├ú','2026-06-19','2026-06-19','admin',1);
/*!40000 ALTER TABLE `Alocacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Instrutores`
--

DROP TABLE IF EXISTS `Instrutores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Instrutores` (
  `id_instrutor` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `matricula` varchar(20) NOT NULL,
  PRIMARY KEY (`id_instrutor`),
  UNIQUE KEY `matricula` (`matricula`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Instrutores`
--

LOCK TABLES `Instrutores` WRITE;
/*!40000 ALTER TABLE `Instrutores` DISABLE KEYS */;
INSERT INTO `Instrutores` VALUES (37,'ANDERSON','9116879'),(38,'ANDR├ë','9116867'),(39,'BRUNA','9116424'),(40,'BRUNO','9117421'),(41,'CARLOS','9107560'),(42,'CYNTHIA','9117757'),(43,'DANIEL','9114483'),(44,'EDILAINE','9113217'),(45,'FABIO','9114592'),(46,'XISTO','9115928'),(47,'FAGNER','9112860'),(48,'FL├üVIA','9111529'),(49,'FL├üVIO','9114126'),(50,'FRANCIS','9113405'),(51,'FRED','9115496'),(52,'IGOR','9115384'),(53,'├ìTALO','9117473'),(54,'JEAN','9116272'),(55,'JONATHAN','9116325'),(56,'JOS├ë FL├üVIO','9113559'),(57,'LEANDRO','9115893'),(58,'LUCAS','9115894'),(59,'MARCOS','9115257'),(60,'RODOLFO','9116000'),(61,'SILAS','91177295'),(62,'TALLES','9111731'),(63,'SAMUEL','9116326'),(64,'ALEXANDRE','9116899');
/*!40000 ALTER TABLE `Instrutores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notificacoes`
--

DROP TABLE IF EXISTS `Notificacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notificacoes` (
  `id_notificacao` int NOT NULL AUTO_INCREMENT,
  `id_instrutor` int NOT NULL,
  `mensagem` text NOT NULL,
  `lida` tinyint(1) DEFAULT '0',
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificacao`),
  KEY `fk_notif_instrutor` (`id_instrutor`),
  CONSTRAINT `fk_notif_instrutor` FOREIGN KEY (`id_instrutor`) REFERENCES `Instrutores` (`id_instrutor`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notificacoes`
--

LOCK TABLES `Notificacoes` WRITE;
/*!40000 ALTER TABLE `Notificacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `Notificacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Salas`
--

DROP TABLE IF EXISTS `Salas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Salas` (
  `id_sala` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `bloco` varchar(50) NOT NULL DEFAULT 'A',
  `tipo` enum('SALA','LABORATORIO') NOT NULL DEFAULT 'SALA',
  PRIMARY KEY (`id_sala`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Salas`
--

LOCK TABLES `Salas` WRITE;
/*!40000 ALTER TABLE `Salas` DISABLE KEYS */;
INSERT INTO `Salas` VALUES (7,'Rob??tica 01','ROBOTICA','SALA'),(8,'Rob??tica 02','ROBOTICA','SALA'),(9,'Rob??tica 03','ROBOTICA','SALA'),(10,'Rob??tica 04','ROBOTICA','SALA'),(11,'Lab El├⌐trica Predial','A','LABORATORIO'),(13,'102','C','SALA'),(14,'103','C','SALA'),(16,'101','B','SALA'),(17,'102','B','SALA'),(18,'103','B','SALA'),(19,'104','B','SALA'),(21,'203','B','SALA'),(22,'204','B','SALA'),(23,'205','B','SALA'),(24,'PLANTA PILOTO DE MINERA├ç├âO','C','LABORATORIO'),(25,'LAB. MINERALOGIA (101)','C','LABORATORIO'),(26,'LAB. INFORM├üTICA (105)','A','LABORATORIO'),(27,'LAB. INFORM├üTICA (106)','A','LABORATORIO'),(28,'LAB. AUTOMA├ç├âO (107)','A','LABORATORIO'),(29,'LAB. INFORM├üTICA(108)','A','LABORATORIO'),(30,'LAB. INFORM├üTICA (104)','B','LABORATORIO'),(31,'LAB. BIOTECNOLOGIA','A','LABORATORIO'),(32,'LAB. QU├ìMICA','A','LABORATORIO'),(33,'104','C','SALA'),(34,'202','B','SALA'),(35,'201','B','SALA');
/*!40000 ALTER TABLE `Salas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Transferencias_Pendentes`
--

DROP TABLE IF EXISTS `Transferencias_Pendentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Transferencias_Pendentes` (
  `id_transferencia` int NOT NULL AUTO_INCREMENT,
  `id_alocacao_original` int NOT NULL,
  `id_instrutor_origem` int NOT NULL,
  `id_instrutor_destino` int NOT NULL,
  `data_inicio_transferencia` date NOT NULL,
  `data_fim_transferencia` date NOT NULL,
  `status` enum('pendente','aceita','rejeitada') NOT NULL DEFAULT 'pendente',
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_transferencia`),
  KEY `fk_trans_aloc` (`id_alocacao_original`),
  KEY `fk_trans_inst_origem` (`id_instrutor_origem`),
  KEY `fk_trans_inst_destino` (`id_instrutor_destino`),
  CONSTRAINT `fk_trans_aloc` FOREIGN KEY (`id_alocacao_original`) REFERENCES `Alocacoes` (`id_alocacao`) ON DELETE CASCADE,
  CONSTRAINT `fk_trans_inst_destino` FOREIGN KEY (`id_instrutor_destino`) REFERENCES `Instrutores` (`id_instrutor`) ON DELETE CASCADE,
  CONSTRAINT `fk_trans_inst_origem` FOREIGN KEY (`id_instrutor_origem`) REFERENCES `Instrutores` (`id_instrutor`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Transferencias_Pendentes`
--

LOCK TABLES `Transferencias_Pendentes` WRITE;
/*!40000 ALTER TABLE `Transferencias_Pendentes` DISABLE KEYS */;
/*!40000 ALTER TABLE `Transferencias_Pendentes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Turmas`
--

DROP TABLE IF EXISTS `Turmas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Turmas` (
  `id_turma` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `turno` enum('Manh├ú','Tarde','Noite') NOT NULL DEFAULT 'Manh├ú',
  PRIMARY KEY (`id_turma`),
  UNIQUE KEY `unique_turma_turno` (`nome`,`turno`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Turmas`
--

LOCK TABLES `Turmas` WRITE;
/*!40000 ALTER TABLE `Turmas` DISABLE KEYS */;
INSERT INTO `Turmas` VALUES (52,'AI - MANUT. MEC. MAQUINAS (VALE)','Manh├ú'),(53,'AI - MANUT. MEC. MAQUINAS (VALLOUREC)','Manh├ú'),(34,'MANUT. ELETROMEC├éNICA (GEOSOL)','Tarde'),(44,'T├ëC. ADMINISTRA├ç├âO','Tarde'),(43,'T├ëC. BIOTECNOLOGIA','Tarde'),(56,'T├ëC. COMPUTA├ç├âO GR├üFICA','Manh├ú'),(46,'T├ëC. COMPUTA├ç├âO GR├üFICA','Tarde'),(49,'T├ëC. DESENVOLVIMENTO DE SISTEMAS','Tarde'),(54,'T├ëC. ELETROMEC├éNICA (ANGLOGOLD)','Manh├ú'),(40,'T├ëC. ELETROMEC├éNICA (ANGLOGOLD)','Tarde'),(59,'T├ëC. ELETROMEC├éNICA (Geosol)','Noite'),(57,'T├ëC. ELETR├öNICA','Manh├ú'),(47,'T├ëC. ELETR├öNICA','Tarde'),(41,'T├ëC. ELETROT├ëCNICA','Tarde'),(58,'T├ëC. INFORM├üTICA PARA INTERNET','Manh├ú'),(48,'T├ëC. MECATR├öNICA','Tarde'),(55,'T├ëC. MINERA├ç├âO (ANGLOGOLD)','Manh├ú'),(45,'T├ëC. MINERA├ç├âO (VALE)','Tarde'),(42,'T├ëC. SEGURAN├çA DO TRABALHO','Tarde'),(22,'T├ëCNICO EM ADMINISTRA├ç├âO','Noite'),(23,'T├ëCNICO EM AUTOMA├ç├âO INDUSTRIAL','Noite'),(29,'T├ëCNICO EM AUTOMA├ç├âO INDUSTRIAL (EaD)','Noite'),(27,'T├ëCNICO EM DESIGN GR├üFICO','Noite'),(30,'T├ëCNICO EM ELETROT├ëCNICA','Noite'),(28,'T├ëCNICO EM INFORM├üTICA PARA INTERNET','Noite'),(26,'T├ëCNICO EM MEC├éNICA','Noite'),(33,'T├ëCNICO EM MECATR├öNICA','Noite'),(32,'T├ëCNICO EM MINERA├ç├âO (TEC+)','Noite'),(31,'T├ëCNICO EM MINERA├ç├âO (VALE)','Noite'),(25,'T├ëCNICO EM QU├ìMICA','Noite');
/*!40000 ALTER TABLE `Turmas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Usuarios`
--

DROP TABLE IF EXISTS `Usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `perfil` enum('admin','instrutor','tv') NOT NULL DEFAULT 'instrutor',
  `primeiro_acesso` tinyint(1) DEFAULT '1',
  `id_instrutor_vinculado` int DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_user_instrutor` (`id_instrutor_vinculado`),
  CONSTRAINT `fk_user_instrutor` FOREIGN KEY (`id_instrutor_vinculado`) REFERENCES `Instrutores` (`id_instrutor`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Usuarios`
--

LOCK TABLES `Usuarios` WRITE;
/*!40000 ALTER TABLE `Usuarios` DISABLE KEYS */;
INSERT INTO `Usuarios` VALUES (1,'admin@senai.com','admin123','Administrador SIGA','admin',0,NULL),(2,'tv@senai.com','tv123','Monitor Entrada','tv',0,NULL),(39,'9116879@senai.com','9116879','ANDERSON','instrutor',1,37),(40,'9116867@senai.com','9116867','ANDR├ë','instrutor',1,38),(41,'9116424@senai.com','9116424','BRUNA','instrutor',1,39),(42,'9117421@senai.com','9117421','BRUNO','instrutor',1,40),(43,'9107560@senai.com','9107560','CARLOS','instrutor',1,41),(44,'9117757@senai.com','9117757','CYNTHIA','instrutor',1,42),(45,'9114483@senai.com','9114483','DANIEL','instrutor',1,43),(46,'9113217@senai.com','9113217','EDILAINE','instrutor',1,44),(47,'9114592@senai.com','9114592','FABIO','instrutor',1,45),(48,'9115928@senai.com','9115928','XISTO','instrutor',1,46),(49,'9112860@senai.com','9112860','FAGNER','instrutor',1,47),(50,'9111529@senai.com','9111529','FL├üVIA','instrutor',1,48),(51,'9114126@senai.com','9114126','FL├üVIO','instrutor',1,49),(52,'9113405@senai.com','9113405','FRANCIS','instrutor',1,50),(53,'9115496@senai.com','9115496','FRED','instrutor',1,51),(54,'9115384@senai.com','9115384','IGOR','instrutor',1,52),(55,'9117473@senai.com','9117473','├ìTALO','instrutor',1,53),(56,'9116272@senai.com','9116272','JEAN','instrutor',1,54),(57,'9116325@senai.com','9116325','JONATHAN','instrutor',1,55),(58,'9113559@senai.com','9113559','JOS├ë FL├üVIO','instrutor',1,56),(59,'9115893@senai.com','9115893','LEANDRO','instrutor',1,57),(60,'9115894@senai.com','9115894','LUCAS','instrutor',1,58),(61,'9115257@senai.com','9115257','MARCOS','instrutor',1,59),(62,'9116000@senai.com','9116000','RODOLFO','instrutor',1,60),(63,'91177295@senai.com','91177295','SILAS','instrutor',1,61),(64,'9111731@senai.com','9111731','TALLES','instrutor',1,62),(65,'9116326@senai.com','9116326','SAMUEL','instrutor',1,63),(66,'9116899@senai.com','9116899','ALEXANDRE','instrutor',1,64);
/*!40000 ALTER TABLE `Usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-29 16:53:29
