import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, collection, onSnapshot, increment
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Suas credenciais oficiais do Firebase
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


window.votar = async function(idCandidato) {
  // 🔒 Trava: já votou neste navegador?
  if (localStorage.getItem("jaVotouCosplay") === "true") {
    alert("Você já votou nesta edição do festival!");
    return;
  }

  // Bloqueia temporariamente para evitar cliques duplos rápidos
  bloquearTodosOsBotoes(true, "Processando...");

  const candidatoRef = doc(db, "votos", idCandidato);

  try {
    // Soma +1 no candidato escolhido diretamente no Firestore
    await setDoc(candidatoRef, { 
      id: idCandidato,
      votos: increment(1) 
    }, { merge: true });

    // ✅ Salva localmente no navegador que o usuário já votou
    localStorage.setItem("jaVotouCosplay", "true");
    localStorage.setItem("votouNoCosplay", idCandidato);

    alert("Seu voto foi computado com sucesso! Obrigado por participar.");
    marcarBotaoVotado(idCandidato);

  } catch (error) {
    console.error("Erro ao salvar voto:", error);
    alert("Houve um erro ao processar seu voto. Tente novamente.");
    verificarSeJaVotou();
  }
};

// Função que checa o localStorage assim que a página abre
function verificarSeJaVotou() {
  if (localStorage.getItem("jaVotouCosplay") === "true") {
    const idVotado = localStorage.getItem("votouNoCosplay");
    marcarBotaoVotado(idVotado);
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
    
    // Atualiza o contador de votos embaixo do card de cada participante
    const spanVotos = document.getElementById(item.id);
    if (spanVotos) {
      spanVotos.textContent = `${item.votos || 0} ${item.votos === 1 ? 'voto' : 'votos'}`;
    }
  });

  // Ordena o Ranking do mais votado para o menos votado
  dados.sort((a, b) => b.votos - a.votos);

  let html = "";
  dados.forEach((item, i) => {
    let medalha = "";
    if (i === 0) medalha = "🥇 ";
    else if (i === 1) medalha = "🥈 ";
    else if (i === 2) medalha = "🥉 ";

    // Transforma "ana_ravena" em "Ravena" para o ranking
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

// Executa a checagem assim que o script carrega
verificarSeJaVotou();