-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: db
-- Tiempo de generación: 17-10-2025 a las 11:10:24
-- Versión del servidor: 8.0.43
-- Versión de PHP: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `testdb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Enfrentamiento`
--

CREATE TABLE `Enfrentamiento` (
  `idEnfrentamiento` int NOT NULL,
  `sitioAsignado` varchar(100) DEFAULT NULL,
  `numeroRonda` int NOT NULL,
  `resultado` varchar(100) DEFAULT NULL,
  `marcador` varchar(20) DEFAULT NULL,
  `idTorneo` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Enfrentamiento`
--

INSERT INTO `Enfrentamiento` (`idEnfrentamiento`, `sitioAsignado`, `numeroRonda`, `resultado`, `marcador`, `idTorneo`) VALUES
(1, 'Mesa 1', 1, 'Gana Ana', '2-1', 1),
(2, 'Mesa 2', 1, 'Gana Luis', '2-0', 1),
(3, 'Mesa 3', 1, 'Gana Carmen', '2-1', 1),
(4, 'Mesa 4', 1, 'Gana Javier', '2-0', 1),
(5, 'Mesa 1', 2, 'Gana Marta', '2-0', 1),
(6, 'Mesa 2', 2, 'Gana Raúl', '2-1', 1),
(7, 'Mesa 3', 2, 'Gana Elena', '2-1', 1),
(8, 'Mesa 4', 2, 'Gana Carlos', '2-0', 1),
(9, 'Mesa 1', 3, 'Gana Ana', '2-0', 1),
(10, 'Mesa 2', 3, 'Gana Luis', '2-1', 1),
(11, 'Mesa 3', 3, 'Gana Marta', '2-1', 1),
(12, 'Mesa 4', 3, 'Gana Raúl', '2-0', 1),
(13, 'Mesa 1', 1, 'Gana Ana', '2-0', 2),
(14, 'Mesa 2', 1, 'Gana Luis', '2-1', 2),
(15, 'Mesa 3', 1, 'Gana Marta', '2-0', 2),
(16, 'Mesa 4', 1, 'Gana Raúl', '2-1', 2),
(17, 'Mesa 1', 2, 'Gana Elena', '2-0', 2),
(18, 'Mesa 2', 2, 'Gana Carlos', '2-0', 2),
(19, 'Mesa 3', 2, 'Gana Javier', '2-1', 2),
(20, 'Mesa 4', 2, 'Gana Carmen', '2-0', 2),
(21, 'Mesa 1', 3, 'Gana Ana', '2-1', 2),
(22, 'Mesa 2', 3, 'Gana Luis', '2-0', 2),
(23, 'Mesa 3', 3, 'Gana Raúl', '2-1', 2),
(24, 'Mesa 4', 3, 'Gana Marta', '2-0', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Equipo`
--

CREATE TABLE `Equipo` (
  `idEquipo` int NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Equipo`
--

INSERT INTO `Equipo` (`idEquipo`, `nombre`) VALUES
(1, 'Ana Gómez Ruiz'),
(2, 'Luis Martínez López'),
(3, 'Carmen Santos Díaz'),
(4, 'Javier Morales Pérez'),
(5, 'Marta Rico Torres'),
(6, 'Raúl Castro Vega'),
(7, 'Elena Navarro Gil'),
(8, 'Carlos Herrera León'),
(9, 'Equipo Alpha'),
(10, 'Equipo Beta');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Equipo_Enfrentamiento`
--

CREATE TABLE `Equipo_Enfrentamiento` (
  `idEquipo` int NOT NULL,
  `idEnfrentamiento` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Equipo_Enfrentamiento`
--

INSERT INTO `Equipo_Enfrentamiento` (`idEquipo`, `idEnfrentamiento`) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(5, 3),
(6, 3),
(7, 4),
(8, 4),
(1, 5),
(3, 5),
(2, 6),
(4, 6),
(5, 7),
(7, 7),
(6, 8),
(8, 8),
(1, 9),
(5, 9),
(2, 10),
(6, 10),
(3, 11),
(7, 11),
(4, 12),
(8, 12),
(1, 13),
(2, 13),
(3, 14),
(4, 14),
(5, 15),
(6, 15),
(7, 16),
(8, 16),
(1, 17),
(3, 17),
(2, 18),
(4, 18),
(5, 19),
(7, 19),
(6, 20),
(8, 20),
(1, 21),
(5, 21),
(2, 22),
(6, 22),
(3, 23),
(7, 23),
(4, 24),
(8, 24);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Equipo_Torneo`
--

CREATE TABLE `Equipo_Torneo` (
  `idEquipoTorneo` int NOT NULL,
  `idEquipo` int NOT NULL,
  `idTorneo` int NOT NULL,
  `posicion` int DEFAULT NULL,
  `puntosAcumulados` int DEFAULT NULL,
  `confirmacionAsistencia` enum('PENDIENTE','CONFIRMADA','RECHAZADA') NOT NULL,
  `confirmacionInscripcion` enum('PENDIENTE','CONFIRMADA','RECHAZADA') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Equipo_Torneo`
--

INSERT INTO `Equipo_Torneo` (`idEquipoTorneo`, `idEquipo`, `idTorneo`, `posicion`, `puntosAcumulados`, `confirmacionAsistencia`, `confirmacionInscripcion`) VALUES
(1, 1, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(2, 2, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(3, 3, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(4, 4, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(5, 5, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(6, 6, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(7, 7, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(8, 8, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(9, 1, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(10, 2, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(11, 3, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(12, 4, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(13, 5, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(14, 6, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(15, 7, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA'),
(16, 8, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `FormatoJuego`
--

CREATE TABLE `FormatoJuego` (
  `idFormatoJuego` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `numMaxJugadores` int NOT NULL,
  `idJuego` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `FormatoJuego`
--

INSERT INTO `FormatoJuego` (`idFormatoJuego`, `nombre`, `numMaxJugadores`, `idJuego`) VALUES
(1, 'Standard', 2, 1),
(2, 'Draft', 2, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `FormatoTorneo`
--

CREATE TABLE `FormatoTorneo` (
  `idFormatoTorneo` int NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `FormatoTorneo`
--

INSERT INTO `FormatoTorneo` (`idFormatoTorneo`, `nombre`) VALUES
(1, 'Suizo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Juego`
--

CREATE TABLE `Juego` (
  `idJuego` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `descripcion` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Juego`
--

INSERT INTO `Juego` (`idJuego`, `nombre`, `categoria`, `descripcion`) VALUES
(1, 'Magic: The Gathering', 'Juego de cartas coleccionable', 'Juego de cartas coleccionables competitivo con distintos formatos.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Liga`
--

CREATE TABLE `Liga` (
  `idLiga` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `idOrganizador` int DEFAULT NULL,
  `numeroParticipantesMax` int NOT NULL,
  `numeroTorneos` int NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date NOT NULL,
  `numeroTorneosObligatorios` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Liga`
--

INSERT INTO `Liga` (`idLiga`, `nombre`, `idOrganizador`, `numeroParticipantesMax`, `numeroTorneos`, `fechaInicio`, `fechaFin`, `numeroTorneosObligatorios`) VALUES
(1, 'Liga Magic Julio 2025', 1, 8, 2, '2025-07-01', '2025-07-31', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Torneo`
--

CREATE TABLE `Torneo` (
  `idTorneo` int NOT NULL,
  `idOrganizador` int DEFAULT NULL,
  `idLiga` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `precioInscripcion` double NOT NULL,
  `numeroRondas` int NOT NULL,
  `duracionRondas` int NOT NULL,
  `fechaHoraInicio` datetime NOT NULL,
  `lugarCelebracion` varchar(150) NOT NULL,
  `estado` enum('PLANIFICADO','EN_CURSO','FINALIZADO','CANCELADO') NOT NULL,
  `premios` text,
  `idFormatoTorneo` int DEFAULT NULL,
  `idJuego` int DEFAULT NULL,
  `idFormatoJuego` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Torneo`
--

INSERT INTO `Torneo` (`idTorneo`, `idOrganizador`, `idLiga`, `nombre`, `descripcion`, `precioInscripcion`, `numeroRondas`, `duracionRondas`, `fechaHoraInicio`, `lugarCelebracion`, `estado`, `premios`, `idFormatoTorneo`, `idJuego`, `idFormatoJuego`) VALUES
(1, 1, 1, 'Torneo Draft Julio', 'Torneo de Magic formato Draft', 10, 3, 50, '2025-07-05 10:00:00', 'Tienda Planeswalker Madrid', 'FINALIZADO', '3 sobres de premio', 1, 1, 2),
(2, 1, 1, 'Torneo Standard Julio', 'Torneo de Magic formato Standard', 10, 3, 50, '2025-07-19 10:00:00', 'Tienda Planeswalker Madrid', 'FINALIZADO', '3 sobres de premio', 1, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Usuario`
--

CREATE TABLE `Usuario` (
  `idUsuario` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(150) NOT NULL,
  `localidad` varchar(100) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Usuario`
--

INSERT INTO `Usuario` (`idUsuario`, `nombre`, `apellidos`, `localidad`, `email`, `password_hash`, `telefono`) VALUES
(1, 'Ana', 'Gómez Ruiz', 'Madrid', 'ana@example.com', '$2b$12$ePczClYgGmgbOsm4YPv7LOOtPLfky.QkoAbBpt0AVy3xdNdywk3CS', '600111111'),
(2, 'Luis', 'Martínez López', 'Madrid', 'luis@example.com', '$2b$12$94r1E98Ds6V9S2HAP9LNGeP/In7yF8VfH9fuW2OF3CncaVk1jqR7m', '600222222'),
(3, 'Carmen', 'Santos Díaz', 'Madrid', 'carmen@example.com', '$2b$12$zuKk88Omgzxf964hdFJmsOdfR6XIVxgv/yUcLU4wtBNie.KAHejU.', '600333333'),
(4, 'Javier', 'Morales Pérez', 'Madrid', 'javier@example.com', '$2b$12$Otwy4MSvfWmGRdIkyQoG5usUrOIgYtKuPt59eyItuNua2HV/.cb3e', '600444444'),
(5, 'Marta', 'Rico Torres', 'Madrid', 'marta@example.com', '$2b$12$JN9j3rq3xp29Sa14FpsAM.7Df.rllg8l3K/ivI1QhaNb6HIQvL/WS', '600555555'),
(6, 'Raúl', 'Castro Vega', 'Madrid', 'raul@example.com', '$2b$12$tG3.LAqsWxBNU40TRa.JVucK1m.NMiNuonYjqN3MuZDu2SSxM9ZQu', '600666666'),
(7, 'Elena', 'Navarro Gil', 'Madrid', 'elena@example.com', '$2b$12$jRkcZwJLshjmWK8Pssx28uzCOMtLnTMd67FZ8JLt4tu5fQ3Siu3k.', '600777777'),
(8, 'Carlos', 'Herrera León', 'Madrid', 'carlos@example.com', '$2b$12$4cSYQ9DLSHnVuRkKjIOH1ekhghrC40lRy7WSe1JrTBgFYwYaqjc1W', '600888888');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Usuario_Equipo`
--

CREATE TABLE `Usuario_Equipo` (
  `idUsuario` int NOT NULL,
  `idEquipo` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Usuario_Equipo`
--

INSERT INTO `Usuario_Equipo` (`idUsuario`, `idEquipo`) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 6),
(7, 7),
(8, 8),
(1, 9),
(2, 9),
(3, 9),
(4, 9),
(5, 10),
(6, 10),
(7, 10),
(8, 10);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `Enfrentamiento`
--
ALTER TABLE `Enfrentamiento`
  ADD PRIMARY KEY (`idEnfrentamiento`),
  ADD KEY `idTorneo` (`idTorneo`);

--
-- Indices de la tabla `Equipo`
--
ALTER TABLE `Equipo`
  ADD PRIMARY KEY (`idEquipo`);

--
-- Indices de la tabla `Equipo_Enfrentamiento`
--
ALTER TABLE `Equipo_Enfrentamiento`
  ADD PRIMARY KEY (`idEquipo`,`idEnfrentamiento`),
  ADD KEY `idEnfrentamiento` (`idEnfrentamiento`);

--
-- Indices de la tabla `Equipo_Torneo`
--
ALTER TABLE `Equipo_Torneo`
  ADD PRIMARY KEY (`idEquipoTorneo`),
  ADD KEY `idEquipo` (`idEquipo`),
  ADD KEY `idTorneo` (`idTorneo`);

--
-- Indices de la tabla `FormatoJuego`
--
ALTER TABLE `FormatoJuego`
  ADD PRIMARY KEY (`idFormatoJuego`),
  ADD KEY `idJuego` (`idJuego`);

--
-- Indices de la tabla `FormatoTorneo`
--
ALTER TABLE `FormatoTorneo`
  ADD PRIMARY KEY (`idFormatoTorneo`);

--
-- Indices de la tabla `Juego`
--
ALTER TABLE `Juego`
  ADD PRIMARY KEY (`idJuego`);

--
-- Indices de la tabla `Liga`
--
ALTER TABLE `Liga`
  ADD PRIMARY KEY (`idLiga`),
  ADD KEY `idOrganizador` (`idOrganizador`);

--
-- Indices de la tabla `Torneo`
--
ALTER TABLE `Torneo`
  ADD PRIMARY KEY (`idTorneo`),
  ADD KEY `idOrganizador` (`idOrganizador`),
  ADD KEY `idFormatoTorneo` (`idFormatoTorneo`),
  ADD KEY `idJuego` (`idJuego`),
  ADD KEY `idFormatoJuego` (`idFormatoJuego`),
  ADD KEY `fk_torneo_liga` (`idLiga`);

--
-- Indices de la tabla `Usuario`
--
ALTER TABLE `Usuario`
  ADD PRIMARY KEY (`idUsuario`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `telefono` (`telefono`);

--
-- Indices de la tabla `Usuario_Equipo`
--
ALTER TABLE `Usuario_Equipo`
  ADD PRIMARY KEY (`idUsuario`,`idEquipo`),
  ADD KEY `idEquipo` (`idEquipo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `Enfrentamiento`
--
ALTER TABLE `Enfrentamiento`
  MODIFY `idEnfrentamiento` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `Equipo`
--
ALTER TABLE `Equipo`
  MODIFY `idEquipo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `Equipo_Torneo`
--
ALTER TABLE `Equipo_Torneo`
  MODIFY `idEquipoTorneo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `FormatoJuego`
--
ALTER TABLE `FormatoJuego`
  MODIFY `idFormatoJuego` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `FormatoTorneo`
--
ALTER TABLE `FormatoTorneo`
  MODIFY `idFormatoTorneo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `Juego`
--
ALTER TABLE `Juego`
  MODIFY `idJuego` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `Liga`
--
ALTER TABLE `Liga`
  MODIFY `idLiga` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `Torneo`
--
ALTER TABLE `Torneo`
  MODIFY `idTorneo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `Usuario`
--
ALTER TABLE `Usuario`
  MODIFY `idUsuario` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `Enfrentamiento`
--
ALTER TABLE `Enfrentamiento`
  ADD CONSTRAINT `Enfrentamiento_ibfk_1` FOREIGN KEY (`idTorneo`) REFERENCES `Torneo` (`idTorneo`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `Equipo_Enfrentamiento`
--
ALTER TABLE `Equipo_Enfrentamiento`
  ADD CONSTRAINT `Equipo_Enfrentamiento_ibfk_1` FOREIGN KEY (`idEquipo`) REFERENCES `Equipo` (`idEquipo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Equipo_Enfrentamiento_ibfk_2` FOREIGN KEY (`idEnfrentamiento`) REFERENCES `Enfrentamiento` (`idEnfrentamiento`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `Equipo_Torneo`
--
ALTER TABLE `Equipo_Torneo`
  ADD CONSTRAINT `Equipo_Torneo_ibfk_1` FOREIGN KEY (`idEquipo`) REFERENCES `Equipo` (`idEquipo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Equipo_Torneo_ibfk_2` FOREIGN KEY (`idTorneo`) REFERENCES `Torneo` (`idTorneo`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `FormatoJuego`
--
ALTER TABLE `FormatoJuego`
  ADD CONSTRAINT `FormatoJuego_ibfk_1` FOREIGN KEY (`idJuego`) REFERENCES `Juego` (`idJuego`);

--
-- Filtros para la tabla `Liga`
--
ALTER TABLE `Liga`
  ADD CONSTRAINT `Liga_ibfk_1` FOREIGN KEY (`idOrganizador`) REFERENCES `Usuario` (`idUsuario`);

--
-- Filtros para la tabla `Torneo`
--
ALTER TABLE `Torneo`
  ADD CONSTRAINT `fk_torneo_liga` FOREIGN KEY (`idLiga`) REFERENCES `Liga` (`idLiga`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Torneo_ibfk_1` FOREIGN KEY (`idOrganizador`) REFERENCES `Usuario` (`idUsuario`),
  ADD CONSTRAINT `Torneo_ibfk_2` FOREIGN KEY (`idFormatoTorneo`) REFERENCES `FormatoTorneo` (`idFormatoTorneo`),
  ADD CONSTRAINT `Torneo_ibfk_3` FOREIGN KEY (`idJuego`) REFERENCES `Juego` (`idJuego`),
  ADD CONSTRAINT `Torneo_ibfk_4` FOREIGN KEY (`idFormatoJuego`) REFERENCES `FormatoJuego` (`idFormatoJuego`);

--
-- Filtros para la tabla `Usuario_Equipo`
--
ALTER TABLE `Usuario_Equipo`
  ADD CONSTRAINT `Usuario_Equipo_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Usuario_Equipo_ibfk_2` FOREIGN KEY (`idEquipo`) REFERENCES `Equipo` (`idEquipo`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
