import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = JSON.parse(__firebase_config);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'thiaguinho-wii-v5';

class WiiAuth {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.user = null;
        this.init();
    }

    async init() {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(this.auth, __initial_auth_token);
        } else {
            await signInAnonymously(this.auth);
        }

        onAuthStateChanged(this.auth, (user) => {
            this.user = user;
            if (user) {
                console.log("🎮 Console Online | UID:", user.uid);
                window.dispatchEvent(new CustomEvent('wii:auth_ready', { detail: user }));
                this.syncProfile();
            }
        });
    }

    async syncProfile() {
        if (!this.user) return;
        const userRef = doc(this.db, 'artifacts', appId, 'users', this.user.uid, 'profile', 'data');
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
            await setDoc(userRef, {
                name: "Mii " + this.user.uid.substring(0, 4),
                level: 1,
                joined: Date.now()
            });
        }
    }

    async saveScore(gameId, score) {
        if (!this.user) return;
        const scoreRef = doc(this.db, 'artifacts', appId, 'public', 'data', 'leaderboards', gameId, 'ranks', this.user.uid);
        await setDoc(scoreRef, {
            score: score,
            uid: this.user.uid,
            timestamp: Date.now()
        }, { merge: true });
    }
}

window.WiiFirebase = new WiiAuth();
