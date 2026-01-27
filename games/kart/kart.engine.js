(function() {
    const CONFIG = window.KART_TUNING;

    class KartGame {
        constructor() {
            this.id = 'kart';
            this.name = 'Otto Kart Pro';
            this.icon = '🏎️';
            this.player = { x: 0, z: 0, speed: 0, lap: 1, rank: 1 };
            this.track = [];
            this.opponents = [];
        }

        init() {
            console.log("🏁 Kart Engine: Warm up!");
            this.generateTrack();
            this.player = { x: 0, z: 0, speed: 0, lap: 1, rank: 1 };
            this.opponents = [
                { id: 1, x: -0.5, z: 500, speed: 0, color: '#e74c3c' },
                { id: 2, x: 0.5, z: 800, speed: 0, color: '#f1c40f' }
            ];
        }

        generateTrack() {
            this.track = [];
            for (let n = 0; n < CONFIG.TRACK_SEGMENTS; n++) {
                this.track.push({
                    curve: Math.sin(n / 400) * CONFIG.CURVE_INTENSITY,
                    z: n
                });
            }
        }

        update(ctx, w, h, pose) {
            this.processInput(pose, w);
            this.applyPhysics();
            this.render(ctx, w, h);
            
            // Atualiza HUD Global
            const hud = document.getElementById('global-score');
            if(hud) hud.innerText = Math.floor(this.player.speed).toString().padStart(5, '0');
        }

        processInput(pose, w) {
            if (!pose) {
                this.player.targetX = 0;
                return;
            }

            // Controle via nariz (inclinação da cabeça)
            const nose = pose.keypoints.find(k => k.name === 'nose');
            if (nose && nose.score > 0.3) {
                const screenPos = (nose.x / 640); // Normalizado
                const steer = (screenPos - 0.5) * 2; // -1 a 1
                this.player.targetX = -steer * 2.5; 
            }
        }

        applyPhysics() {
            // Aceleração Constante (Arcade)
            const isOffRoad = Math.abs(this.player.x) > 1.0;
            const grip = isOffRoad ? CONFIG.GRIP_OFFROAD : CONFIG.GRIP_ROAD;
            
            this.player.speed += CONFIG.ACCEL_RATE;
            if(this.player.speed > CONFIG.PLAYER_MAX_SPEED) this.player.speed = CONFIG.PLAYER_MAX_SPEED;
            if(isOffRoad) this.player.speed *= 0.96; // Punição na grama

            this.player.x += (this.player.targetX - this.player.x) * grip;
            this.player.z += this.player.speed * 0.1;

            // Loop da pista
            if(this.player.z >= CONFIG.TRACK_SEGMENTS) {
                this.player.z = 0;
                this.player.lap++;
            }
        }

        render(ctx, w, h) {
            const horizon = h * 0.45;
            
            // Céu
            ctx.fillStyle = "#87CEEB";
            ctx.fillRect(0, 0, w, horizon);

            // Grama
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(0, horizon, w, h - horizon);

            // Renderização da Pista (Raycasting Simplificado)
            const drawDistance = 300;
            const camZ = this.player.z;

            for(let n = drawDistance; n > 0; n--) {
                const segIdx = Math.floor(camZ + n) % CONFIG.TRACK_SEGMENTS;
                const seg = this.track[segIdx];
                
                const scale = 1 / n;
                const nextScale = 1 / (n + 1);

                const x = (w / 2) + (seg.curve * w * scale) - (this.player.x * w * scale);
                const y = horizon + (h * scale * 0.8);
                const roadW = w * 0.8 * scale;

                const isDark = Math.floor((camZ + n) / 10) % 2 === 0;
                ctx.fillStyle = isDark ? "#555" : "#666";
                
                // Desenha trapézio da estrada
                ctx.beginPath();
                ctx.moveTo(x - roadW, y);
                ctx.lineTo(x + roadW, y);
                ctx.lineTo(x + roadW * 1.1, y + 5);
                ctx.lineTo(x - roadW * 1.1, y + 5);
                ctx.fill();
            }

            // Sprite do Player
            this.drawPlayer(ctx, w, h);
        }

        drawPlayer(ctx, w, h) {
            const px = w / 2;
            const py = h * 0.85;
            
            ctx.fillStyle = "#3498db";
            // Corpo simples do Kart
            ctx.fillRect(px - 30, py, 60, 20);
            ctx.fillStyle = "#111";
            ctx.fillRect(px - 35, py + 15, 15, 10);
            ctx.fillRect(px + 20, py + 15, 15, 10);
        }
    }

    // Registro no Router Global
    const instance = new KartGame();
    if (window.WiiRouter) {
        window.WiiRouter.register(instance);
    } else {
        // Fallback se o router carregar depois
        window.addEventListener('load', () => window.WiiRouter.register(instance));
    }
})();
