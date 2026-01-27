window.WiiRouter = {
    games: {},

    register: function(gameInstance) {
        console.log(`📦 Modulo Instalado: ${gameInstance.name}`);
        this.games[gameInstance.id] = gameInstance;
        // Se o menu já estiver pronto, atualiza
        if(window.WiiUI && window.WiiUI.renderChannels) {
            window.WiiUI.renderChannels();
        }
    },

    getGame: function(id) {
        return this.games[id] || null;
    },

    listGames: function() {
        return Object.values(this.games).map(g => ({
            id: g.id,
            name: g.name,
            icon: g.icon
        }));
    }
};
