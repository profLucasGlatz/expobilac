import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCc_2ItItpmbyNbsGdtNgWlJPPpN7SMdQc",
  authDomain: "votacao-cosplay.firebaseapp.com",
  projectId: "votacao-cosplay",
  storageBucket: "votacao-cosplay.firebasestorage.app",
  messagingSenderId: "783225672775",
  appId: "1:783225672775:web:2c1501281bae05cf9b8d62",
  measurementId: "G-3SE6CZ8JBP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const botaoLogin = document.getElementById("loginGoogle");
const usuarioLogado = document.getElementById("usuarioLogado");

let usuarioAtual = null;

onAuthStateChanged(auth, (user) => {
    usuarioAtual = user;
});

botaoLogin.addEventListener("click", async () => {
    const email = resultado.user.email;

if (!email.endsWith("@escola.pr.gov.br")) {
    alert("Use seu e-mail da escola.");
    await signOut(auth);
    return;
}

document.getElementById("usuarioLogado").innerText =
    "Logado como: " + email;

  try {

    const resultado = await signInWithPopup(auth, provider);

    const email = resultado.user.email;

    usuarioLogado.innerText = "Logado como: " + email;

    console.log(email);

  } catch (erro) {

    console.error(erro);

    alert("Erro ao fazer login.");

  }

});

// Tornar a função acessível ao HTML
window.votar = async function (nome) {

    if (!usuarioAtual) {
    alert("Carregando autenticação, tente novamente.");
    return;
    }

    if (!usuarioAtual) {
    alert("Faça login com sua conta da escola.");
    return;
    }

    const email = usuarioAtual.email;

    // 2. valida domínio da escola
    if (!email.endsWith("@escola.pr.gov.br")) {
        alert("Use sua conta institucional (@escola).");
        return;
    }

    const votoRef = doc(db, "votos", email);

    try {

        // 3. verifica se já votou
        const votoExistente = await getDoc(votoRef);

        if (votoExistente.exists()) {
            alert("Você já votou!");
            return;
        }

        // 4. registra voto no participante
        const participanteRef = doc(db, "participantes", nome);

        await updateDoc(participanteRef, {
            votos: increment(1)
        }).catch(async () => {
            await setDoc(participanteRef, { votos: 1 });
        });

        // 5. salva que esse email já votou
        await setDoc(votoRef, {
            participante: nome,
            data: new Date().toISOString()
        });

        alert("Voto registrado com sucesso!");

    } catch (erro) {
        console.error(erro);
        alert("Erro ao registrar voto.");
    }
};
// Ranking em tempo real

onSnapshot(collection(db, "participantes"), (snapshot) => {

  let ranking = [];

  snapshot.forEach((documento) => {
    ranking.push({
      nome: documento.id,
      votos: documento.data().votos || 0
    });

    // atualiza contador no card
    const span = document.getElementById(documento.id);

    if (span) {
      span.innerText = (documento.data().votos || 0) + " votos";
    }
  });

  ranking.sort((a, b) => b.votos - a.votos);

  let html = "";

  ranking.forEach((item, posicao) => {

    let medalha = "";
    let classe = "";

    if (posicao === 0) {
      medalha = "🥇";
      classe = "primeiro";
    } else if (posicao === 1) {
      medalha = "🥈";
      classe = "segundo";
    } else if (posicao === 2) {
      medalha = "🥉";
      classe = "terceiro";
    }

    const nomeFormatado = item.nome
      .replaceAll("_", " ")
      .replace(/\b\w/g, l => l.toUpperCase());

    html += `
      <div class="ranking-card ${classe}" style="animation-delay: ${posicao * 80}ms">
        <div class="ranking-info">
          <span class="posicao">${medalha} ${posicao + 1}º</span>
          <span class="nome">${nomeFormatado}</span>
        </div>

        <div class="votos">
          ${item.votos}
          <small>votos</small>
        </div>
      </div>
    `;
  });

  document.getElementById("ranking").innerHTML = html;

});