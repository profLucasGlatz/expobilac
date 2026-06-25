import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, collection, onSnapshot, increment
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ✅ Suas credenciais oficiais inseridas corretamente
const firebaseConfig = {
  apiKey: "AIzaSyCc_2ItItpmbyNbsGdtNgWlJPPpN7SMdQc",
  authDomain: "votacao-cosplay.firebaseapp.com",
  projectId: "votacao-cosplay",
  storageBucket: "votacao-cosplay.firebasestorage.app",
  messagingSenderId: "783225672775",
  appId: "1:783225672775:web:2c1501281bae05cf9b8d62",
  measurementId: "G-3SE6CZ8JBP"
};

// Inicializando as ferramentas do Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Variável global para saber quem está logado
let usuarioAtual = null;


const btnLogin = document.getElementById("loginGoogle");
const txtUsuario = document.getElementById("usuarioLogado");

// Monitora se o usuário entrou ou saiu
onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuarioAtual = user;
    if (btnLogin) btnLogin.style.display = "none";
    if (txtUsuario) txtUsuario.textContent = `Olá, ${user.displayName}!`;
    
    // Verifica no banco se esse usuário já votou
    verificarSeJaVotou(user.uid);
  } else {
    usuarioAtual = null;
    if (btnLogin) btnLogin.style.display = "block";
    if (txtUsuario) txtUsuario.textContent = "Faça login com o Google para poder votar.";
    bloquearTodosOsBotoes(true, "Faça login para votar");
  }
});

// Evento do botão de login
if (btnLogin) {
  btnLogin.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Falha ao entrar com o Google. Verifique se a janela pop-up não foi bloqueada.");
    }
  });
}

// Definir como window.votar resolve o erro "votar is not defined" no seu HTML
window.votar = async function(idCandidato) {
  if (!usuarioAtual) {
    alert("Você precisa fazer login com o Google antes de votar!");
    return;
  }

  // Bloqueia temporariamente para evitar cliques duplos rápidos
  bloquearTodosOsBotoes(true, "Processando...");

  const userRef = doc(db, "usuarios_votos", usuarioAtual.uid);
  const candidatoRef = doc(db, "votos", idCandidato);

  try {
    // 1. Salva que o usuário (UID) já escolheu alguém
    await setDoc(userRef, { 
      votouEm: idCandidato,
      dataVoto: new Date()
    });

    // 2. Soma +1 no candidato escolhido
    await setDoc(candidatoRef, { 
      id: idCandidato,
      votos: increment(1) 
    }, { merge: true });

    alert("Seu voto foi computado com sucesso!");
    marcarBotaoVotado(idCandidato);

  } catch (error) {
    console.error("Erro ao salvar voto:", error);
    alert("Houve um erro ou você já votou nesta conta.");
    verificarSeJaVotou(usuarioAtual.uid);
  }
};

// Verifica no Firestore se o UID logado já tem registro de voto
async function verificarSeJaVotou(uid) {
  const userRef = doc(db, "usuarios_votos", uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const dadosVoto = docSnap.data();
    marcarBotaoVotado(dadosVoto.votouEm);
  } else {
    bloquearTodosOsBotoes(false);
  }
}

function bloquearTodosOsBotoes(bloquear, textoAlterado = null) {
  document.querySelectorAll(".card button").forEach(btn => {
    btn.disabled = bloquear;
    btn.style.opacity = bloquear ? "0.5" : "1";
    btn.style.cursor = bloquear ? "not-allowed" : "pointer";
    if (textoAlterado && bloquear) {
      btn.innerText = textoAlterado;
    } else if (!bloquear) {
      btn.innerText = "⭐ Votar";
    }
  });
}

function marcarBotaoVotado(idCandidato) {
  bloquearTodosOsBotoes(true, "Votação Concluída");
  
  const botoes = document.querySelectorAll(".card button");
  botoes.forEach(btn => {
    if (btn.getAttribute("onclick") === `votar('${idCandidato}')`) {
      btn.innerText = "✅ Seu Voto";
      btn.style.opacity = "1";
      btn.style.backgroundColor = "#28a745";
      btn.style.color = "#fff";
    }
  });
}



onSnapshot(collection(db, "votos"), (snap) => {
  const dados = [];
  
  snap.forEach(d => {
    const item = d.data();
    dados.push(item);
    
    // Atualiza o contador ("0 votos") embaixo de cada card de cosplay
    const spanVotos = document.getElementById(item.id);
    if (spanVotos) {
      spanVotos.textContent = `${item.votos || 0} ${item.votos === 1 ? 'voto' : 'votos'}`;
    }
  });

  // Ordena do mais votado para o menos votado
  dados.sort((a, b) => b.votos - a.votos);

  let html = "";
  dados.forEach((item, i) => {
    let medalha = "";
    if (i === 0) medalha = "🥇 ";
    else if (i === 1) medalha = "🥈 ";
    else if (i === 2) medalha = "🥉 ";

    // Transforma "ana_ravena" em "Ravena" para exibir bonito no ranking
    const nomeFormatado = item.id
      .replace(/^[a-z]+_/, "") 
      .replaceAll("_", " ")
      .replace(/\b\w/g, l => l.toUpperCase());

    html += `
      <div class="item-ranking" style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px; border-bottom: 1px dashed #ccc;">
        <span>${medalha}${i + 1}º ${nomeFormatado}</span>
        <strong>${item.votos || 0} votos</strong>
      </div>
    `;
  });
  
  const divRanking = document.getElementById("ranking");
  if (divRanking) divRanking.innerHTML = html;
});