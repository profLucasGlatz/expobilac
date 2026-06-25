import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, updateDoc, increment,
  collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  // ...sua config aqui...
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Votar ao clicar em um botão com data-nome="fulano"
document.querySelectorAll(".btn-votar").forEach(btn => {
  btn.addEventListener("click", async () => {
    // 🔒 Trava: já votou nesse navegador?
    if (localStorage.getItem("jaVotou") === "true") {
      alert("Você já votou neste navegador!");
      return;
    }

    const nome = btn.dataset.nome;
    const ref = doc(db, "votos", nome);

    try {
      await updateDoc(ref, { votos: increment(1) });
    } catch {
      await setDoc(ref, { nome, votos: 1 });
    }

    // ✅ Marca que já votou
    localStorage.setItem("jaVotou", "true");
    localStorage.setItem("votouEm", nome);

    alert("Voto computado! Obrigado por participar.");
  });
});


// Ranking ao vivo
onSnapshot(collection(db, "votos"), (snap) => {
  const dados = [];
  snap.forEach(d => dados.push(d.data()));
  dados.sort((a, b) => b.votos - a.votos);

  let html = "";
  dados.forEach((item, i) => {
    let medalha = "";
    if (i === 0) medalha = "🥇";
    else if (i === 1) medalha = "🥈";
    else if (i === 2) medalha = "🥉";

    const nomeFormatado = item.nome
      .replaceAll("_", " ")
      .replace(/\b\w/g, l => l.toUpperCase());

    html += `
      <div class="item-ranking">
        <span>${medalha} ${i + 1}º ${nomeFormatado}</span>
        <strong>${item.votos} votos</strong>
      </div>
    `;
  });
  document.getElementById("ranking").innerHTML = html;
});

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("jaVotou") === "true") {
    const nome = localStorage.getItem("votouEm");
    document.querySelectorAll(".btn-votar").forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    });
    const aviso = document.createElement("p");
    aviso.textContent = `✅ Você já votou em ${nome.replaceAll("_"," ")}.`;
    aviso.style.textAlign = "center";
    aviso.style.fontWeight = "bold";
    document.body.prepend(aviso);
  }
});
