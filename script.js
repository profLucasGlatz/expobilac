import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, collection, onSnapshot, increment
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id", // <-- O erro acontece porque essa linha (ou todas) está faltando
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:123456:web:abcde123"
};

// Dentro do seu script.js:
window.votar = async function(idCandidato) {
  // 1. Verifica se o usuário está logado
  if (!usuarioAtual) {
    alert("Você precisa fazer login com o Google antes de votar!");
    return;
  }

  // 2. Desabilita os botões temporariamente para evitar cliques duplos (flooding)
  bloquearTodosOsBotoes(true, "Processando...");

  // Criando as referências dos documentos no banco de dados
  const userRef = doc(db, "usuarios_votos", usuarioAtual.uid);
  const candidatoRef = doc(db, "votos", idCandidato);

  try {
    // 3. Salva na coleção "usuarios_votos" que ESSE UID já votou
    await setDoc(userRef, { 
      votouEm: idCandidato,
      dataVoto: new Date()
    });

    // 4. Soma +1 no contador de votos do candidato escolhido
    await setDoc(candidatoRef, { 
      id: idCandidato,
      votos: increment(1) 
    }, { merge: true });

    // 5. Feedback de sucesso para o usuário
    alert("Seu voto foi computado com sucesso! Obrigado por participar.");
    marcarBotaoVotado(idCandidato);

  } catch (error) {
    console.error("Erro ao salvar voto:", error);
    alert("Houve um erro ao processar seu voto. Verifique se você já não votou antes.");
    
    // Se der erro, reavalia se ele já tinha votado para travar ou destravar os botões
    verificarSeJaVotou(usuarioAtual.uid);
  }
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Variável global para armazenar o usuário ativo
let usuarioAtual = null;

const btnLogin = document.getElementById("loginGoogle");
const txtUsuario = document.getElementById("usuarioLogado");

// Monitora o estado do login (se o usuário está logado ou não)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuarioAtual = user;
    btnLogin.style.display = "none";
    txtUsuario.textContent = `Olá, ${user.displayName}!`;
    
    // Verifica no banco se esse usuário já deixou o seu voto
    verificarSeJaVotou(user.uid);
  } else {
    usuarioAtual = null;
    btnLogin.style.display = "block";
    txtUsuario.textContent = "Faça login com o Google para poder votar.";
    bloquearTodosOsBotoes(true, "Faça login para votar");
  }
});

// Evento de clique do botão de Login
btnLogin.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Erro na autenticação:", error);
    alert("Falha ao entrar com o Google. Tente novamente.");
  }
});

// Função chamada pelo HTML via atributo 'onclick'
window.votar = async function(idCandidato) {
  if (!usuarioAtual) {
    alert("Você precisa fazer login antes de votar!");
    return;
  }

  // Desabilita os botões imediatamente para evitar cliques duplos
  bloquearTodosOsBotoes(true, "Processando...");

  const userRef = doc(db, "usuarios_votos", usuarioAtual.uid);
  const candidatoRef = doc(db, "votos", idCandidato);

  try {
    // 1. Registra o voto do usuário atrelado ao UID dele
    await setDoc(userRef, { 
      votouEm: idCandidato,
      dataVoto: new Date()
    });

    // 2. Incrementa o contador do candidato correspondente
    await setDoc(candidatoRef, { 
      id: idCandidato,
      votos: increment(1) 
    }, { merge: true });

    alert("Seu voto foi computado com sucesso! Obrigado por participar.");
    marcarBotaoVotado(idCandidato);

  } catch (error) {
    console.error("Erro ao salvar voto:", error);
    alert("Houve um erro ou você já computou seu voto anteriormente.");
    // Em caso de erro, reavalia o estado dos botões
    verificarSeJaVotou(usuarioAtual.uid);
  }
};

// Verifica diretamente no Firestore se o UID logado já realizou um voto
async function verificarSeJaVotou(uid) {
  const userRef = doc(db, "usuarios_votos", uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const dadosVoto = docSnap.data();
    marcarBotaoVotado(dadosVoto.votouEm);
  } else {
    // Se o usuário está logado e não votou, os botões ficam ativos
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
  bloquearTodosOsBotoes(true, "Votação Encerrada");
  
  // Localiza o botão específico do candidato escolhido para dar destaque
  const botoes = document.querySelectorAll(".card button");
  botoes.forEach(btn => {
    if (btn.getAttribute("onclick") === `votar('${idCandidato}')`) {
      btn.innerText = "✅ Seu Voto";
      btn.style.opacity = "1";
      btn.style.backgroundColor = "#28a745"; // Verde de sucesso
      btn.style.color = "#fff";
    }
  });
}


onSnapshot(collection(db, "votos"), (snap) => {
  const dados = [];
  
  // Resgata os votos do banco e atualiza os spans nos respectivos cards
  snap.forEach(d => {
    const item = d.data();
    dados.push(item);
    
    const spanVotos = document.getElementById(item.id);
    if (spanVotos) {
      spanVotos.textContent = `${item.votos || 0} ${item.votos === 1 ? 'voto' : 'votos'}`;
    }
  });

  // Ordena os candidatos por quantidade de votos decrescente
  dados.sort((a, b) => b.votos - a.votos);

  let html = "";
  dados.forEach((item, i) => {
    let medalha = "";
    if (i === 0) medalha = "🥇 ";
    else if (i === 1) medalha = "🥈 ";
    else if (i === 2) medalha = "🥉 ";

    // Formata o ID do candidato para exibição no ranking geral
    const nomeFormatado = item.id
      .replace(/^[a-z]+_/, "") // Remove o primeiro nome ("ana_", "vitor_")
      .replaceAll("_", " ")
      .replace(/\b\w/g, l => l.toUpperCase());

    html += `
      <div class="item-ranking" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>${medalha}${i + 1}º Personagem: ${nomeFormatado}</span>
        <strong>${item.votos || 0} votos</strong>
      </div>
    `;
  });
  
  document.getElementById("ranking").innerHTML = html;
});