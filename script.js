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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tornar a função acessível ao HTML
window.votar = async function(nome) {

  const jaVotou = localStorage.getItem("votacaoCosplay");

  if (jaVotou) {
    alert("Você já registrou seu voto.");
    return;
  }

  const participanteRef = doc(db, "participantes", nome);

  try {

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

    localStorage.setItem("votacaoCosplay", "sim");

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
      votos: documento.data().votos
    });

  });

  ranking.sort((a, b) => b.votos - a.votos);

  let html = "";

  ranking.forEach((item, posicao) => {

    let medalha = "";

    if (posicao === 0) medalha = "🥇";
    else if (posicao === 1) medalha = "🥈";
    else if (posicao === 2) medalha = "🥉";

    html += `
      <div class="ranking-item">
        ${medalha} ${posicao + 1}º - ${item.nome}
        (${item.votos} votos)
      </div>
    `;

  });

  document.getElementById("ranking").innerHTML = html;

});