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

const firebaseConfig = {
  apiKey: "AIzaSyCc_2ItItpmbyNbsGdtNgWlJPPpN7SMdQc",
  authDomain: "votacao-cosplay.firebaseapp.com",
  projectId: "votacao-cosplay",
  storageBucket: "votacao-cosplay.firebasestorage.app",
  messagingSenderId: "783225672775",
  appId: "1:783225672775:web:2c1501281bae05cf9b8d62",
  measurementId: "G-3SE6CZ8JBP"
};

if (!localStorage.getItem("userId")) {
  localStorage.setItem("userId", crypto.randomUUID());
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tornar a função acessível ao HTML
window.votar = async function(nome) {

  const userId = localStorage.getItem("userId");

  const votoRef = doc(db, "votos", userId);

  try {

    const votoExistente = await getDoc(votoRef);

    if (votoExistente.exists()) {
      alert("Você já votou!");
      return;
    }

    const participanteRef = doc(db, "participantes", nome);

    const participante = await getDoc(participanteRef);

    if (participante.exists()) {
      await updateDoc(participanteRef, {
        votos: increment(1)
      });
    } else {
      await setDoc(participanteRef, {
        votos: 1
      });
    }

    await setDoc(votoRef, {
      participante: nome,
      data: new Date()
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

    const nome = documento.id;
    const votos = documento.data().votos || 0;

    ranking.push({
      nome: nome,
      votos: votos
    });

    // Atualiza o contador do card
    const span = document.getElementById(nome);

    if (span) {
      span.innerText = votos + " votos";
    }

  });

  ranking.sort((a, b) => b.votos - a.votos);

  let html = "";

  ranking.forEach((item, posicao) => {

    let medalha = "";
    let classe = "";

    if (posicao === 0) {
      medalha = "🥇";
      classe = "ouro";
    }
    else if (posicao === 1) {
      medalha = "🥈";
      classe = "prata";
    }
    else if (posicao === 2) {
      medalha = "🥉";
      classe = "bronze";
    }

    const nomeFormatado = item.nome
      .replaceAll("_", " ")
      .replace(/\b\w/g, letra => letra.toUpperCase());

    html += `
      <div class="ranking-item ${classe}">
        <span>${medalha} ${posicao + 1}º - ${nomeFormatado}</span>
        <strong>${item.votos} votos</strong>
      </div>
    `;
  });

  document.getElementById("ranking").innerHTML = html;

});