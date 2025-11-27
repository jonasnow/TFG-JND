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
  `idEquipo` int NOT NULL,
  `idTorneo` int NOT NULL,
  `posicion` int DEFAULT NULL,
  `puntosAcumulados` int DEFAULT NULL,
  `confirmacionAsistencia` enum('PENDIENTE','CONFIRMADA','RECHAZADA') NOT NULL,
  `confirmacionInscripcion` enum('PENDIENTE','CONFIRMADA','RECHAZADA') NOT NULL,
  `fechaInscripcion` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Equipo_Torneo`
--

INSERT INTO `Equipo_Torneo` (`idEquipo`, `idTorneo`, `posicion`, `puntosAcumulados`, `confirmacionAsistencia`, `confirmacionInscripcion`, `fechaInscripcion`) VALUES
(1, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:00:00'),
(2, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:01:00'),
(3, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:02:00'),
(4, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:03:00'),
(5, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:04:00'),
(6, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:05:00'),
(7, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:06:00'),
(8, 1, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:07:00'),
(1, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:08:00'),
(2, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:09:00'),
(3, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:10:00'),
(4, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:11:00'),
(5, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:12:00'),
(6, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:13:00'),
(7, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:14:00'),
(8, 2, NULL, 0, 'CONFIRMADA', 'CONFIRMADA', '2025-10-19 00:15:00');
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

(1, 'Draft', 4, 1), -- Magic: The Gathering
(2, 'Sealed', 4, 1),
(3, 'Standard', 2, 1),
(4, 'Modern', 2, 1),
(5, 'Pioneer', 2, 1),
(6, 'Commander', 4, 1),
(7, 'Pauper', 2, 1),

(8, 'Goat Format', 2, 3), -- Yu-Gi-Oh!
(9, 'Edison Format', 2, 3),
(10, 'Tengu Format', 2, 3),
(11, 'Wind-Up Format', 2, 3),
(12, 'HAT Format', 2, 3),
(13, 'Genesys Format', 2, 3),

(14, 'Standard', 2, 2), -- Pokémon TCG
(15, 'Expanded', 2, 2),
(16, 'Unlimited', 2, 2),
(17, 'Sealed', 2, 2),

(18, 'Classic Constructed', 2, 4), -- Flesh and Blood
(19, 'Blitz', 2, 4),
(20, 'Ultimate Pit Fight', 6, 4),
(21, 'Commoner', 2, 4),

(22, 'Standard', 2, 5), -- One Piece TCG
(23, 'Sealed', 2, 5),
(24, '5 Packs Battle', 2, 5),

(25, 'Core Constructed', 2, 6), -- Lorcana
(26, 'Infinity', 2, 6),
(27, 'Sealed', 2, 6),

(28, 'Premier', 2, 7), -- Star Wars Unlimited
(29, 'Sealed', 2, 7),
(30, 'Twin Suns', 4, 7),

(31, 'Base', 4, 8), -- Catán
(32, 'Clásico', 10, 9), -- Jungle Speed
(33, 'Clásico', 6, 10), -- Virus
(34, 'Base', 4, 11); -- Dominion

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
(1, 'Magic: The Gathering', 'TCG', 'Juego de cartas coleccionables competitivo de fantasía de Wizards of the Coast.'),
(2, 'Pokémon TCG', 'TCG', 'Juego de cartas coleccionables basado en el universo Pokémon.'),
(3, 'Yu-Gi-Oh!', 'TCG', 'Famoso juego de cartas coleccionables con invocaciones y duelos estratégicos.'),
(4, 'Flesh and Blood', 'TCG', 'Juego de cartas coleccionables centrado en combates uno contra uno.'),
(5, 'One Piece TCG', 'TCG', 'TCG competitivo basado en la serie One Piece.'),
(6, 'Lorcana', 'TCG', 'TCG coleccionable inspirado en personajes del universo Disney.'),
(7, 'Star Wars Unlimited', 'TCG', 'TCG de ritmo rápido ambientado en el universo Star Wars.'),
(8, 'Los Colonos de Catán', 'Juego de mesa', 'Clásico juego de estrategia donde los jugadores colonizan y comercian en una isla.'),
(9, 'Jungle Speed', 'Juego de mesa', 'Juego de reflejos y rapidez con un tótem central.'),
(10, 'Virus', 'Juego de mesa', 'Juego de cartas rápido y divertido donde debes evitar infectarte.'),
(11, 'Dominion', 'Juego de mesa', 'Juego de construcción de mazos pionero en su género.');

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
  `numeroTorneosObligatorios` int NOT NULL,
  `fechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Liga`
--

INSERT INTO `Liga` (`idLiga`, `nombre`, `idOrganizador`, `numeroParticipantesMax`, `numeroTorneos`, `fechaInicio`, `fechaFin`, `numeroTorneosObligatorios`, `fechaCreacion`) VALUES
(1, 'Liga Magic Noviembre 2025', 1, 8, 2, '2025-07-01', '2025-07-31', 1, '2025-10-19 00:16:00');

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
  `plazasMax` int NOT NULL,
  `estado` enum('PLANIFICADO','EN_CURSO','FINALIZADO','CANCELADO') NOT NULL,
  `premios` text,
  `idFormatoTorneo` int DEFAULT NULL,
  `idJuego` int DEFAULT NULL,
  `idFormatoJuego` int DEFAULT NULL,
  `fechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Torneo`
--

INSERT INTO `Torneo` 
(`idTorneo`, `idOrganizador`, `idLiga`, `nombre`, `descripcion`, `precioInscripcion`, `numeroRondas`, `duracionRondas`, `fechaHoraInicio`, `lugarCelebracion`, `plazasMax`, `estado`, `premios`, `idFormatoTorneo`, `idJuego`, `idFormatoJuego`, `fechaCreacion`) VALUES

(1, 1, NULL, 'Magic Autumn Cup', 'Torneo Magic formato Modern', 12.0, 5, 50, '2025-09-15 10:00:00', 'Centro Cultural A', 32, 'FINALIZADO', 'Sobres + Trofeo', 1, 1, 4, '2025-10-19 00:00:00'),
(2, 2, NULL, 'Yu-Gi-Oh! Old School Duel', 'Torneo formato Goat', 10.0, 4, 40, '2025-10-12 17:00:00', 'Sala de Juegos B', 24, 'FINALIZADO', 'Cartas promocionales', 1, 3, 8, '2025-10-19 00:01:00'),

(3, 3, NULL, 'Magic Winter Draft', 'Torneo formato Draft', 15.0, 3, 45, '2025-12-10 18:00:00', 'Club Recreativo C', 16, 'PLANIFICADO', 'Sobres Draft', 1, 1, 1, '2025-10-19 00:02:00'),
(4, 4, NULL, 'Magic Pioneer Showdown', 'Competitivo formato Pioneer', 20.0, 5, 55, '2026-01-20 10:00:00', 'Sala D', 32, 'PLANIFICADO', 'Trofeo + sobres', 1, 1, 5, '2025-10-19 00:03:00'),
(5, 5, NULL, 'Pokémon League Challenge', 'Torneo estándar', 10.0, 4, 40, '2026-02-14 10:00:00', 'Centro E', 32, 'PLANIFICADO', 'Cartas de Liga', 1, 2, 14, '2025-10-19 00:04:00'),
(6, 6, NULL, 'Pokémon Winter Cup', 'Torneo formato Expanded', 12.0, 5, 50, '2026-03-10 10:00:00', 'Sala F', 24, 'PLANIFICADO', 'Medallas', 1, 2, 15, '2025-10-19 00:05:00'),
(7, 7, NULL, 'Yu-Gi-Oh! Edison Clash', 'Torneo Edison', 10.0, 4, 40, '2026-01-12 16:00:00', 'Club G', 32, 'PLANIFICADO', 'Cartas exclusivas', 1, 3, 9, '2025-10-19 00:06:00'),
(8, 8, NULL, 'Yu-Gi-Oh! Genesis Cup', 'Formato Genesys', 15.0, 5, 55, '2026-02-05 10:00:00', 'Sala H', 24, 'PLANIFICADO', 'Tapete exclusivo', 1, 3, 13, '2025-10-19 00:07:00'),
(9, 1, NULL, 'FAB Classic Constructed Cup', 'Torneo competitivo', 20.0, 6, 55, '2026-01-18 10:00:00', 'Centro I', 32, 'PLANIFICADO', 'Premios en metálico', 1, 4, 18, '2025-10-19 00:08:00'),
(10, 2, NULL, 'FAB Blitz Brawl', 'Torneo Blitz', 12.0, 4, 40, '2026-02-08 11:00:00', 'Sala J', 16, 'PLANIFICADO', 'Cartas especiales', 1, 4, 19, '2025-10-19 00:09:00'),
(11, 3, NULL, 'One Piece Standard Clash', 'Competitivo estándar', 10.0, 5, 50, '2026-01-30 10:00:00', 'Club K', 32, 'PLANIFICADO', 'Sobres OP', 1, 5, 22, '2025-10-19 00:10:00'),
(12, 4, NULL, 'One Piece Sealed Event', 'Sellado con 6 boosters', 18.0, 4, 40, '2026-03-03 16:00:00', 'Sala L', 20, 'PLANIFICADO', 'Cartas promo', 1, 5, 23, '2025-10-19 00:11:00'),
(13, 5, NULL, 'Lorcana Core Constructed Challenge', 'Torneo competitivo', 10.0, 4, 40, '2026-01-12 10:00:00', 'Centro M', 32, 'PLANIFICADO', 'Premios mágicos', 1, 6, 25, '2025-10-19 00:12:00'),
(14, 6, NULL, 'Lorcana Infinity Cup', 'Torneo formato Infinity', 15.0, 5, 45, '2026-02-20 10:00:00', 'Sala N', 24, 'PLANIFICADO', 'Cartas raras', 1, 6, 26, '2025-10-19 00:13:00'),
(15, 7, NULL, 'SWU Premier Assault', 'Torneo Premier', 10.0, 5, 45, '2026-01-05 10:00:00', 'Sala O', 32, 'PLANIFICADO', 'Cartas premium', 1, 7, 28, '2025-10-19 00:14:00'),
(16, 8, NULL, 'SWU Twin Suns Battle', 'Formato Twin Suns', 12.0, 4, 60, '2026-02-10 17:00:00', 'Sala P', 20, 'PLANIFICADO', 'Tapetes SW', 1, 7, 30, '2025-10-19 00:15:00'),
(17, 1, NULL, 'Catán Winter Championship', 'Torneo del clásico Catán', 8.0, 3, 60, '2026-01-14 10:00:00', 'Centro Q', 16, 'PLANIFICADO', 'Juego Catán + expansión', 1, 8, 31, '2025-10-19 00:16:00'),
(18, 2, NULL, 'Jungle Speed Reflex Cup', 'Competición de reflejos', 5.0, 5, 15, '2026-02-12 10:00:00', 'Sala R', 20, 'PLANIFICADO', 'Edición limitada', 1, 9, 32, '2025-10-19 00:17:00'),
(19, 3, NULL, 'Virus Survival Event', 'Partidas eliminatorias de Virus', 6.0, 4, 20, '2026-01-25 17:00:00', 'Centro S', 24, 'PLANIFICADO', 'Barajas exclusivas', 1, 10, 33, '2025-10-19 00:18:00'),
(20, 4, NULL, 'Dominion Deckmaster Cup', 'Torneo de construcción de mazos', 7.0, 4, 30, '2026-03-01 10:00:00', 'Sala T', 16, 'PLANIFICADO', 'Expansiones Dominion', 1, 11, 34, '2025-10-19 00:19:00');

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
  `telefono` varchar(20) DEFAULT NULL,
  `fechaRegistro` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Usuario`
--

INSERT INTO `Usuario` (`idUsuario`, `nombre`, `apellidos`, `localidad`, `email`, `password_hash`, `telefono`, `fechaRegistro`) VALUES
(1, 'Ana', 'Gómez Ruiz', 'Madrid', 'ana@example.com', '$2b$12$ePczClYgGmgbOsm4YPv7LOOtPLfky.QkoAbBpt0AVy3xdNdywk3CS', '600111111', '2025-10-19 00:00:00'),
(2, 'Luis', 'Martínez López', 'Madrid', 'luis@example.com', '$2b$12$94r1E98Ds6V9S2HAP9LNGeP/In7yF8VfH9fuW2OF3CncaVk1jqR7m', '600222222', '2025-10-19 00:00:00'),
(3, 'Carmen', 'Santos Díaz', 'Madrid', 'carmen@example.com', '$2b$12$zuKk88Omgzxf964hdFJmsOdfR6XIVxgv/yUcLU4wtBNie.KAHejU.', '600333333', '2025-10-19 00:00:00'),
(4, 'Javier', 'Morales Pérez', 'Madrid', 'javier@example.com', '$2b$12$Otwy4MSvfWmGRdIkyQoG5usUrOIgYtKuPt59eyItuNua2HV/.cb3e', '600444444', '2025-10-19 00:00:00'),
(5, 'Marta', 'Rico Torres', 'Madrid', 'marta@example.com', '$2b$12$JN9j3rq3xp29Sa14FpsAM.7Df.rllg8l3K/ivI1QhaNb6HIQvL/WS', '600555555', '2025-10-19 00:00:00'),
(6, 'Raúl', 'Castro Vega', 'Madrid', 'raul@example.com', '$2b$12$tG3.LAqsWxBNU40TRa.JVucK1m.NMiNuonYjqN3MuZDu2SSxM9ZQu', '600666666', '2025-10-19 00:00:00'),
(7, 'Elena', 'Navarro Gil', 'Madrid', 'elena@example.com', '$2b$12$jRkcZwJLshjmWK8Pssx28uzCOMtLnTMd67FZ8JLt4tu5fQ3Siu3k.', '600777777', '2025-10-19 00:00:00'),
(8, 'Carlos', 'Herrera León', 'Madrid', 'carlos@example.com', '$2b$12$4cSYQ9DLSHnVuRkKjIOH1ekhghrC40lRy7WSe1JrTBgFYwYaqjc1W', '600888888', '2025-10-19 00:00:00');

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
  ADD PRIMARY KEY (`idEquipo`, `idTorneo`),
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
