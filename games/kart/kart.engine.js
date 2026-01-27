/**
 * =============================================================================
 * OTTO KART PRO - MÓDULO DE FÍSICA E RENDERIZAÇÃO PSEUDO-3D
 * ADAPTADO DO MOTOR DE FÍSICA "COMMERCIAL WII" (177)
 * =============================================================================
 */

(function() {
    // Pegamos os ajustes do arquivo de configuração
    const CONF = window.KART_TUNING;

    class KartGame {
        constructor() {
            this.id = 'kart';
            this.name = 'Otto Kart Pro';
            this.icon = '🏎️';
            
            // Estado do Jogador
            this.player = {
                x: 0,           // Posição lateral (-1.5 a 1.5)
                z: 0,           // Distância na volta
                totalZ: 0,      // Distância absoluta
                speed: 0,       // Velocidade atual
                steer: 0,       // Valor do volante suavizado
                lap: 1,
                rank: 1,
                visualTilt: 0   // Inclinação do carro
            };

            this.track = [];
            this.opponents = [];
            this.particles = [];
            this.frame = 0;
            this.mouseSteer = 0; // Fallback para PC sem câmera
        }

        init() {
            console.log("🏎️ Otto Kart: Engine Iniciada");
            this.generateTrack();
            this.createOpponents();
            
            this.player.x = 0;
            this.player.z = 0;
            this.player.totalZ = 0;
            this.player.speed = 0;
            this.player.lap = 1;
            this.particles = [];

            // Listener de mouse para teste no PC
            window.addEventListener('mousemove', (e) => {
                this.mouseSteer = (e.clientX / window.innerWidth - 0.5) * 2;
            });
        }

        generateTrack() {
            this.track = [];
            for (let i = 0; i < CONF.TRACK_SEGMENTS; i++) {
                // Curvatura procedural usando senos compostos (como no original funcional)
                const curve = (Math.sin(i * 0.001) * 1.5) + (Math.sin(i * 0.0003) * 0.5);
                this.track.push({ curve: curve * CONF.CURVE_INTENSITY });
            }
        }

        createOpponents() {
            this.opponents = [];
            const colors = ['#e74c3c', '#f1c40f', '#9b59b6', '#2ecc71'];
            for (let i = 0; i < 4; i++) {
                this.opponents.push({
                    id: i + 2,
                    x: (Math.random() - 0.5) * 1.2,
                    z: 500 + (i * 400),
                    speed: CONF.PLAYER_MAX_SPEED * (0.8 + Math.random() * 0.1),
                    color: colors[i]
                });
            }
        }

        update(ctx, w, h, pose) {
            this.frame++;
            this.processInput(pose);
            this.applyPhysics();
            this.render(ctx, w, h);
            
            // Retorna a velocidade para o HUD do Sistema
            return Math.floor(this.player.speed);
        }

        processInput(pose) {
            let targetSteer = 0;

            if (pose) {
                // Lógica de direção por Pose (Nariz ou Mãos)
                const nose = pose.keypoints.find(k => k.name === 'nose');
                if (nose && nose.score > 0.3) {
                    const screenPos = (nose.x / 640);
                    targetSteer = (screenPos - 0.5) * 3.5; 
                }
            } else {
                // Fallback Teclado/Mouse se não houver câmera
                targetSteer = -this.mouseSteer * 2.0;
            }

            // Inércia do volante (Suavização)
            const speedRatio = this.player.speed / CONF.PLAYER_MAX_SPEED;
            const inertia = 0.1 + (speedRatio * 0.05); // Mais rígido em alta velocidade
            this.player.steer += (targetSteer - this.player.steer) * inertia;
            this.player.steer = Math.max(-1.5, Math.min(1.5, this.player.steer));
        }

        applyPhysics() {
            const p = this.player;
            const isOffRoad = Math.abs(p.x) > 1.0;
            const grip = isOffRoad ? CONF.GRIP_OFFROAD : CONF.GRIP_ROAD;

            // Aceleração
            p.speed += CONF.ACCEL_RATE;
            if (p.speed > CONF.PLAYER_MAX_SPEED) p.speed = CONF.PLAYER_MAX_SPEED;
            
            // Atrito e Penalidade fora da pista
            if (isOffRoad) {
                p.speed *= 0.97;
                if (p.speed > 40 && window.WiiSystem.ctx) {
                    // Efeito de tremor leve (shake) implementado no original
                    this.player.x += (Math.random() - 0.5) * 0.05;
                }
            }

            // --- CÁLCULO DA CURVA E FORÇA CENTRÍFUGA (LÓGICA 177) ---
            const segIdx = Math.floor(p.z) % CONF.TRACK_SEGMENTS;
            const currentCurve = this.track[segIdx].curve;
            
            // A pista empurra o carro para fora
            const centrifugal = currentCurve * (p.speed / CONF.PLAYER_MAX_SPEED) * 0.08;
            
            // Movimentação lateral: Direção do Volante - Força da Pista
            p.x += (p.steer * 0.08 * grip) - centrifugal;

            // Atualiza distância
            p.z += p.speed * 0.1;
            p.totalZ += p.speed * 0.1;

            // Gerenciamento de Voltas
            if (p.z >= CONF.TRACK_SEGMENTS) {
                p.z -= CONF.TRACK_SEGMENTS;
                p.lap++;
                if (window.WiiSystem) window.WiiSystem.msg("VOLTA " + p.lap);
            }

            // Atualiza Oponentes (IA Simples)
            this.opponents.forEach(bot => {
                bot.z += bot.speed * 0.1;
                // IA tenta seguir a curva
                const botCurve = this.track[Math.floor(bot.z) % CONF.TRACK_SEGMENTS].curve;
                bot.x += (-botCurve * 0.02 - bot.x) * 0.05;
                
                if (bot.z >= CONF.TRACK_SEGMENTS) bot.z -= CONF.TRACK_SEGMENTS;
            });
        }

        render(ctx, w, h) {
            const horizon = h * 0.45;
            const p = this.player;

            // 1. Desenha Céu e Grama (Fundo)
            ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, w, horizon);
            ctx.fillStyle = "#2ecc71"; ctx.fillRect(0, horizon, w, h - horizon);

            // 2. Renderização da Pista (Painter's Algorithm - Do fundo para frente)
            const drawDistance = 200;
            const camZ = p.z;
            
            for (let n = drawDistance; n > 0; n--) {
                const zAbs = camZ + n;
                const segIdx = Math.floor(zAbs) % CONF.TRACK_SEGMENTS;
                const seg = this.track[segIdx];
                
                // Projeção de Perspectiva
                const scale = 1 / n;
                const x = (w / 2) + (seg.curve * w * scale * 40) - (p.x * w * scale * 1.5);
                const y = horizon + (h * scale * 0.8);
                const roadW = w * 1.8 * scale;

                // Cor alternada para sensação de velocidade (Zebras)
                const isDark = Math.floor(zAbs / 20) % 2 === 0;
                
                // Desenha Grama Lateral Dinâmica
                ctx.fillStyle = isDark ? "#27ae60" : "#2ecc71";
                ctx.fillRect(0, y, w, 6);

                // Desenha a Estrada
                ctx.fillStyle = isDark ? "#444" : "#555";
                this.drawTrapezoid(ctx, x, y, roadW, x, y + 8, roadW * 1.05);
                
                // Faixas Laterais (Zebras)
                ctx.fillStyle = isDark ? "#e74c3c" : "#fff";
                this.drawTrapezoid(ctx, x - roadW, y, roadW * 0.1, x - roadW * 1.05, y + 8, roadW * 0.1);
                this.drawTrapezoid(ctx, x + roadW, y, -roadW * 0.1, x + roadW * 1.05, y + 8, -roadW * 0.1);
            }

            // 3. Desenha Oponentes (Sprites)
            this.opponents.forEach(bot => {
                const relZ = bot.z - p.z;
                if (relZ > 0 && relZ < drawDistance) {
                    const scale = 1 / relZ;
                    const segIdx = Math.floor(bot.z) % CONF.TRACK_SEGMENTS;
                    const curveOffset = this.track[segIdx].curve * w * scale * 40;
                    
                    const bx = (w / 2) + curveOffset + ((bot.x - p.x) * w * scale * 1.5);
                    const by = horizon + (h * scale * 0.8);
                    const bSize = w * 0.15 * scale;
                    
                    this.drawKart(ctx, bx, by, bSize, bot.color, false);
                }
            });

            // 4. Desenha o Kart do Jogador (Fixo na frente)
            const playerSize = w * 0.006;
            this.drawKart(ctx, w/2, h * 0.88, playerSize, "#3498db", true);
        }

        drawTrapezoid(ctx, x1, y1, w1, x2, y2, w2) {
            ctx.beginPath();
            ctx.moveTo(x1 - w1, y1);
            ctx.lineTo(x1 + w1, y1);
            ctx.lineTo(x2 + w2, y2);
            ctx.lineTo(x2 - w2, y2);
            ctx.fill();
        }

        drawKart(ctx, x, y, s, color, isPlayer) {
            ctx.save();
            ctx.translate(x, y);
            if (isPlayer) {
                // Inclinação visual baseada no steering
                ctx.rotate(this.player.steer * 0.15);
                ctx.scale(s, s);
            } else {
                ctx.scale(s * 100, s * 100);
            }

            // Sombra
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.beginPath(); ctx.ellipse(0, 15, 45, 10, 0, 0, Math.PI*2); ctx.fill();

            // Pneus
            ctx.fillStyle = "#111";
            ctx.fillRect(-35, 5, 15, 20); ctx.fillRect(20, 5, 15, 20);
            
            // Corpo do Kart
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-25, 10); ctx.lineTo(25, 10);
            ctx.lineTo(15, -15); ctx.lineTo(-15, -15);
            ctx.fill();

            // Spoiler
            ctx.fillStyle = "#222";
            ctx.fillRect(-30, -25, 60, 8);
            
            // Capacete
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(0, -20, 10, 0, Math.PI*2); ctx.fill();

            ctx.restore();
        }
    }

    // Registro no Router
    const gameInstance = new KartGame();
    if (window.WiiRouter) {
        window.WiiRouter.register(gameInstance);
    }
})();