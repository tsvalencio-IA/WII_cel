window.WiiSystem = {
    video: null,
    detector: null,
    canvas: null,
    ctx: null,
    activeGame: null,
    isBooted: false,
    currentPose: null,

    boot: async function() {
        const log = document.getElementById('status-log');
        try {
            log.innerText = "INICIALIZANDO CÂMERA...";
            this.video = document.getElementById('webcam-source');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            this.video.srcObject = stream;
            await new Promise(r => this.video.onloadedmetadata = r);

            log.innerText = "CARREGANDO SENSORES DE IA...";
            await tf.setBackend('webgl');
            this.detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
            );

            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.width ? this.canvas.getContext('2d') : null;
            this.resize();

            this.isBooted = true;
            WiiUI.showMenu();
            this.startGlobalLoop();
        } catch (e) {
            log.innerText = "ERRO FATAL: " + e.message;
            console.error(e);
        }
    },

    startGlobalLoop: function() {
        const run = async () => {
            if (this.video.readyState === 4) {
                const poses = await this.detector.estimatePoses(this.video);
                this.currentPose = poses.length > 0 ? poses[0] : null;
            }

            if (this.activeGame && this.ctx) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.activeGame.update(this.ctx, this.canvas.width, this.canvas.height, this.currentPose);
            }
            requestAnimationFrame(run);
        };
        run();
    },

    loadGame: function(gameId) {
        const game = WiiRouter.getGame(gameId);
        if (game) {
            WiiUI.transitionToGame();
            this.activeGame = game;
            this.activeGame.init();
        }
    },

    exitGame: function() {
        this.activeGame = null;
        WiiUI.showMenu();
    },

    resize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
};

window.addEventListener('resize', () => WiiSystem.resize());
