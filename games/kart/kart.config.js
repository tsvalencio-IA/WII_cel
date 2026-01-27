 * =============================================================================
 * ARQUIVO DE AJUSTES HUMANOS - OTTO KART PRO
 * =============================================================================
 * Localização: /games/kart/kart.config.js
 * Objetivo: Permitir ajustes de "feeling" sem alterar a física core.
 * =============================================================================
 */

window.KART_TUNING = {
    // --- FÍSICA DO JOGADOR ---
    PLAYER_MAX_SPEED: 260,    // Velocidade máxima em linha reta
    ACCEL_RATE: 0.65,         // Quão rápido o kart ganha velocidade
    GRIP_ROAD: 0.12,          // Aderência no asfalto (0.1 a 0.2 recomendado)
    GRIP_OFFROAD: 0.03,       // Aderência na grama (baixa para dificultar retorno)
    
    // --- INTELIGÊNCIA ARTIFICIAL (OPONENTES) ---
    AI_SPEED_LIMIT: 0.90,     // Oponentes correm a 90% da velocidade máxima do player
    AI_AGGRESSIVENESS: 0.7,   // Tendência de tentar ocupar o centro da pista
    AI_ERROR_RATE: 0.04,      // Chance de "escorregar" em curvas fechadas
    
    // --- CONFIGURAÇÃO DA PISTA ---
    TOTAL_LAPS: 3,            // Número de voltas para vencer
    TRACK_SEGMENTS: 8000,     // Extensão total da pista
    CURVE_INTENSITY: 2.2,     // Multiplicador de força das curvas
    
    // --- FEEDBACK VISUAL ---
    FOV_INTENSITY: 1.5,       // Distorção de velocidade (Field of View)
    SHAKE_ON_GRASS: true      // Ativar trepidação ao sair da pista
};
