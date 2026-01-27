window.WiiUI = {
    showMenu: function() {
        document.getElementById('boot-screen').classList.add('hidden');
        document.getElementById('wii-menu').classList.remove('hidden');
        document.getElementById('game-canvas').style.display = 'none';
        document.getElementById('game-overlay').classList.add('hidden');
        this.renderChannels();
        this.startTime();
    },

    transitionToGame: function() {
        document.getElementById('wii-menu').classList.add('hidden');
        document.getElementById('game-canvas').style.display = 'block';
        document.getElementById('game-overlay').classList.remove('hidden');
    },

    renderChannels: function() {
        const grid = document.getElementById('menu-grid');
        grid.innerHTML = '';
        
        const games = WiiRouter.listGames();
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `
                <div class="channel-icon">${game.icon}</div>
                <div class="channel-title">${game.name}</div>
            `;
            card.onclick = () => WiiSystem.loadGame(game.id);
            grid.appendChild(card);
        });

        // Preencher espaços vazios estilo Wii
        for(let i = games.length; i < 12; i++) {
            const empty = document.createElement('div');
            empty.className = 'channel-card opacity-30 cursor-default';
            grid.appendChild(empty);
        }
    },

    startTime: function() {
        const el = document.getElementById('system-time');
        setInterval(() => {
            const now = new Date();
            el.innerText = now.getHours().toString().padStart(2,'0') + ":" + 
                           now.getMinutes().toString().padStart(2,'0');
        }, 1000);
    }
};

window.addEventListener('wii:auth_ready', (e) => {
    const user = e.detail;
    document.getElementById('user-initial').innerText = user.uid.charAt(0).toUpperCase();
    document.getElementById('user-name').innerText = "Mii " + user.uid.substring(0,5);
});
