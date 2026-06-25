import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, increment,
  collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
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

provider.setCustomParameters({
  hd: "escola.pr.gov.br",
  prompt: "select_account"
});

const dominioPermitido = "@escola.pr.gov.br";

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const resultado = await signInWithPopup(auth, provider);
    const usuario = resultado.user;

    if (!usuario.email || !usuario.email.toLowerCase().endsWith(dominioPermitido)) {
      alert("Use apenas uma conta @escola.pr.gov.br para votar.");
      await signOut(auth);
      return;
    }

    alert("Login realizado com sucesso!");
  } catch (erro) {
    console.error("Erro no login:", erro);

    if (erro.code === "auth/popup-closed-by-user") {
      alert("Login cancelado.");
    } else if (erro.code === "auth/unauthorized-domain") {
      alert("Domínio do site não autorizado no Firebase.");
    } else if (erro.code === "auth/popup-blocked") {
      alert("O navegador bloqueou a janela de login.");
    } else {
      alert("Erro ao fazer login: " + erro.message);
    }
  }
});


// Mantém o texto atualizado mesmo se a página recarregar
onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioLogado.innerText = "Logado como: " + user.email;
  } else {
    usuarioLogado.innerText = "";
  }
});

// ---------- VOTAR ----------
window.votar = async function (nome) {
  const user = auth.currentUser;

  if (!user) {
    alert("Faça login com sua conta da escola.");
    return;
  }

  const email = user.email;
  if (!email.endsWith("@escola.pr.gov.br")) {
    alert("Use sua conta institucional.");
    return;
  }

  try {
    // 1) Verifica se este aluno já votou
    const votoRef = doc(db, "votos", email);
    const votoSnap = await getDoc(votoRef);

    if (votoSnap.exists()) {
      alert("Você já votou! Só é permitido um voto por aluno.");
      return;
    }

    // 2) Registra que este aluno votou (em quem)
    await setDoc(votoRef, {
      participante: nome,
      data: new Date().toISOString()
    });

    // 3) Incrementa o contador do participante
    //    (cria o documento se ainda não existir)
    const participanteRef = doc(db, "participantes", nome);
    const partSnap = await getDoc(participanteRef);

    if (partSnap.exists()) {
      await updateDoc(participanteRef, { votos: increment(1) });
    } else {
      await setDoc(participanteRef, { votos: 1 });
    }

    alert("Voto registrado com sucesso! 🎉");
  } catch (erro) {
    console.error(erro);
    alert("Erro ao registrar voto.");
  }
};

// ---------- RANKING EM TEMPO REAL ----------
onSnapshot(collection(db, "participantes"), (snapshot) => {
  let ranking = [];

  snapshot.forEach((documento) => {
    const votos = documento.data().votos || 0;
    ranking.push({ nome: documento.id, votos });

    // Atualiza contador dentro do card
    const span = document.getElementById(documento.id);
    if (span) {
      span.innerText = votos + " votos";
    }
  });

  ranking.sort((a, b) => b.votos - a.votos);

  let html = "";
  ranking.forEach((item, posicao) => {
    let medalha = "", classe = "";
    if (posicao === 0) { medalha = "🥇"; classe = "primeiro"; }
    else if (posicao === 1) { medalha = "🥈"; classe = "segundo"; }
    else if (posicao === 2) { medalha = "🥉"; classe = "terceiro"; }

    const nomeFormatado = item.nome
      .replaceAll("_", " ")
      .replace(/\b\w/g, l => l.toUpperCase());

    html += `
      <div class="rank-item ${classe}">
        <div class="rank-pos">${medalha} ${posicao + 1}º ${nomeFormatado}</div>
        <div class="rank-votos">${item.votos} votos</div>
      </div>
    `;
  });

  document.getElementById("ranking").innerHTML = html;
});
