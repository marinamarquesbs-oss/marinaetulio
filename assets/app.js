/* Site do chá de casa nova — lógica da página.
   Fala com a planilha (Google Apps Script) quando CASA.API_URL está preenchido;
   sem ele, roda em modo demonstração guardando tudo só neste navegador. */
(function () {
  "use strict";
  const C = window.CASA || {};
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const brl = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const DEMO = !C.API_URL;
  document.documentElement.classList.add("js");

  /* ---------------- armazenamento local seguro ---------------- */
  const ls = {
    get(k, d) { try { const v = localStorage.getItem("casa:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("casa:" + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------------- API ---------------- */
  const api = {
    async get(action, params = {}) {
      if (DEMO) return demo.get(action, params);
      const u = new URL(C.API_URL);
      u.searchParams.set("action", action);
      Object.entries(params).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
      const r = await fetch(u.toString());
      const j = await r.json();
      if (!j.ok) throw new Error(j.erro || "Erro");
      return j;
    },
    async post(body) {
      if (DEMO) return demo.post(body);
      // text/plain evita a checagem extra de CORS do navegador com o Apps Script
      const r = await fetch(C.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.erro || "Erro");
      return j;
    }
  };
  const demo = {
    gifts() { return ls.get("gifts-v2", null) || JSON.parse(JSON.stringify(C.presentesExemplo || [])); },
    msgs() { return ls.get("msgs", null) || JSON.parse(JSON.stringify(C.recadosExemplo || [])); },
    async get(action, p) {
      if (action === "bootstrap") {
        const guest = p.code ? { nome: "Convidado de exemplo", max: 2 } : null;
        return { ok: true, presentes: demo.gifts(), recados: demo.msgs(), convidado: guest, capsula: { qtd: ls.get("capsula", []).length }, conselhos: C.conselhosExemplo || [] };
      }
      return { ok: true };
    },
    async post(b) {
      await new Promise(r => setTimeout(r, 400));
      if (b.action === "reservar") {
        const g = demo.gifts(); const it = g.find(x => x.id === b.id);
        if (!it || it.reservado) throw new Error("Esse presente acabou de ser reservado por outra pessoa.");
        it.reservado = true; ls.set("gifts-v2", g); return { ok: true };
      }
      if (b.action === "recado") return { ok: true, pendente: true };
      if (b.action === "curtir") { const m = demo.msgs(); const it = m.find(x => x.id === b.id); if (it) it.coracoes = (it.coracoes || 0) + 1; ls.set("msgs", m); return { ok: true }; }
      if (b.action === "rsvp") return { ok: true };
      if (b.action === "capsula") { const r = ls.get("capsula", []); r.push({ nome: b.nome, texto: b.texto, data: new Date().toISOString() }); ls.set("capsula", r); return { ok: true, capsula: { qtd: r.length } }; }
      if (b.action === "conselho") return { ok: true, pendente: true };
      return { ok: true };
    }
  };

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3600); }

  /* ---------------- entrada ---------------- */
  function initEntrada() {
    const c = C.casal || {};
    $("#nome1").textContent = c.nome1 || ""; $("#nome2").textContent = c.nome2 || "";
    $("#monoFoot").textContent = c.monograma || "";
    { const md = $("#monoDoor"), partes = String(c.monograma || "").split("&").map(x => x.trim()).filter(Boolean); md.textContent = "";
      md.setAttribute("aria-label", c.monograma || "");
      if (partes.length === 2) md.append(el("span", "mo-l", partes[0]), el("span", "mo-e", "&"), el("span", "mo-l", partes[1]));
      else md.textContent = c.monograma || ""; }
    const capa = $("#capaFoto");
    if (C.fotos && C.fotos.capa) capa.style.backgroundImage = "url(" + JSON.stringify(C.fotos.capa) + ")"; else capa.classList.add("ph");
    if (DEMO) { const f = el("div", "demo-flag", "Prévia com dados de exemplo"); document.body.appendChild(f); }

    const stage = $("#doorStage");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let opened = false;
    document.body.classList.add("trancada");
    function open() {
      if (opened) return; opened = true;
      document.body.classList.remove("trancada");
      if (reduce) { stage.classList.add("open", "gone"); return; }
      stage.classList.add("turning");
      setTimeout(() => stage.classList.add("open"), 650);
      setTimeout(() => stage.classList.add("gone"), 2400);
    }
    // Navegadores só deixam tocar som depois de um toque: o toque na porta abre a casa e liga a música.
    // A porta começa sempre trancada. Tocar no cadeado, na porta ou no botão gira a chave,
    // abre a porta e solta a música no mesmo toque (navegadores só liberam som depois de um toque).
    const entrar = () => { musica.tocar(); open(); };
    $("#doorOpen").addEventListener("click", entrar);
    document.querySelectorAll(".door").forEach(d => d.addEventListener("click", entrar));
    if (location.hash.length > 1) open();
    const primeiroToque = e => {
      if (e.target.closest && e.target.closest("#musica")) return;
      musica.tocar(true); window.removeEventListener("pointerdown", primeiroToque); window.removeEventListener("keydown", primeiroToque);
    };
    window.addEventListener("pointerdown", primeiroToque); window.addEventListener("keydown", primeiroToque);
    countdown();
  }
  function countdown() {
    const box = $("#countdown"); box.textContent = "";
    const d = C.evento && C.evento.data ? new Date(C.evento.data) : null;
    if (!d || isNaN(d)) { box.appendChild(el("span", "breve", "Data em breve. Guarde um espaço na agenda!")); return; }
    const render = () => {
      const ms = d - new Date(); box.textContent = "";
      if (ms <= 0) { box.appendChild(el("span", "breve", "É hoje! Ou já foi, e foi lindo.")); return; }
      const parts = [["dias", Math.floor(ms / 864e5)], ["horas", Math.floor(ms / 36e5) % 24], ["min", Math.floor(ms / 6e4) % 60]];
      parts.forEach(([l, v]) => { const w = el("div"); w.append(el("b", "", String(v).padStart(2, "0")), el("small", "", l)); box.appendChild(w); });
    };
    render(); setInterval(render, 30000);
  }

  /* ---------------- história ---------------- */
  const PASTEIS = ["var(--azul)", "var(--rosa)", "var(--manteiga)", "var(--salvia)", "var(--lilas)"];
  const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  function initHistoria() {
    const box = $("#capitulos");
    const g = C.gratidao;
    if (g && (g.paragrafos || []).length) {
      const sec = el("div", "gratidao");
      if (g.versiculo) {
        const v = el("figure", "grat-vers"); v.style.margin = "0";
        // cruz em traço fino, só um detalhe
        v.insertAdjacentHTML("afterbegin", '<svg class="grat-cruz" viewBox="0 0 24 40" aria-hidden="true"><path d="M12 1v38M4 11h16"/></svg>');
        v.append(el("blockquote", "", "“" + g.versiculo + "”"), el("figcaption", "", g.referencia || ""));
        sec.appendChild(v);
      }
      const t = el("div", "grat-txt");
      t.appendChild(el("h3", "", g.titulo || "Gratidão"));
      g.paragrafos.forEach(p => {
        // Deus e Nossa Senhora em destaque: parágrafo maior e os nomes em negrito
        const par = el("p");
        p.split(/(Deus|Nossa Senhora)/).forEach(pedaco => par.appendChild(/^(Deus|Nossa Senhora)$/.test(pedaco) ? el("strong", "", pedaco) : document.createTextNode(pedaco)));
        if (/^Obrigado, Deus/.test(p)) { par.className = "grat-deus grat-destaque"; par.insertAdjacentHTML("afterbegin", '<svg class="grat-mini-cruz" viewBox="0 0 12 16" aria-hidden="true"><path d="M6 1v14M2 5h8"/></svg>'); }
        if (/Nossa Senhora/.test(p)) { par.className = "grat-maria grat-destaque"; par.insertAdjacentHTML("afterbegin", '<svg class="grat-estrelas" viewBox="0 0 64 12" aria-hidden="true"><path d="M8 2l1.2 3 3 .2-2.3 2 .8 3L8 8.6 5.3 10.2l.8-3-2.3-2 3-.2zM32 2l1.2 3 3 .2-2.3 2 .8 3L32 8.6l-2.7 1.6.8-3-2.3-2 3-.2zM56 2l1.2 3 3 .2-2.3 2 .8 3L56 8.6l-2.7 1.6.8-3-2.3-2 3-.2z"/></svg>'); }
        if (/^Aos nossos pais/.test(p) && (g.pais || []).length) {
          par.className = "grat-pais";
          const nomes = el("p", "grat-nomes");
          g.pais.forEach((casal, k) => { if (k) nomes.appendChild(el("span", "sep", "·")); nomes.appendChild(el("span", "", casal.join(" & "))); });
          t.appendChild(nomes);
        }
        t.appendChild(par);
      });
      const c = C.casal || {}; t.appendChild(el("p", "grat-assina", (c.nome1 || "") + " & " + (c.nome2 || "")));
      sec.appendChild(t);
      box.parentNode.insertBefore(sec, box);
    }
    (C.historia || []).forEach((c, i) => {
      const art = el("article", "cap");
      const f = el("div", "cap-foto");
      if (c.foto) { const img = el("img"); img.src = c.foto; img.alt = c.titulo; img.loading = "lazy"; f.appendChild(img); }
      else if (c.ilustracao === "match") {
        // sem foto juntos ainda: um celular com a primeira conversa
        f.classList.add("ilu-match");
        const cel = el("div", "cel"), tela = el("div", "cel-tela");
        tela.append(el("div", "cel-topo", "Deu match! ♥"));
        [["eu", "Oi! Tudo bem?"], ["ele", "Oi! Tudo ótimo, e com você?"], ["eu", "Melhor agora 😊"], ["ele", "Bora marcar alguma coisa?"]].forEach(([q, t], k) => {
          const b = el("div", "bolha " + q, t); b.style.animationDelay = (0.4 + k * 0.5) + "s"; tela.appendChild(b);
        });
        cel.appendChild(tela); f.appendChild(cel);
        ["♥", "♥", "♥"].forEach((h, k) => { const s = el("span", "cor-flutua", h); s.style.left = (18 + k * 30) + "%"; s.style.animationDelay = k * 1.1 + "s"; f.appendChild(s); });
      }
      else { f.classList.add("ph"); f.style.background = "linear-gradient(150deg," + PASTEIS[i % 5] + "," + PASTEIS[(i + 2) % 5] + ")"; f.appendChild(el("span", "", "foto do capítulo " + (i + 1))); }
      const t = el("div", "cap-txt");
      t.append(el("p", "cap-num", "Capítulo " + (ROMANOS[i] || i + 1)), el("h3", "", c.titulo));
      if (c.quando) t.appendChild(el("p", "cap-quando", c.quando));
      t.appendChild(el("p", "t", c.texto));
      art.append(f, t); box.appendChild(art);
    });
  }

  /* ---------------- evento ---------------- */
  function initEvento() {
    const e = C.evento || {};
    $("#eventoTitulo").textContent = "O " + (e.formato || "almoço").toLowerCase();
    const ficha = $("#ficha");
    const d = e.data ? new Date(e.data) : null;
    const quando = d && !isNaN(d) ? d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
    const rows = [
      ["Quando", quando],
      ["Horário", e.horario],
      ["Onde", [e.local, e.endereco].filter(Boolean).join(" · ")],
      ["Tem brincadeira?", e.brincadeiras],
    ];
    if (e.prazoConfirmacao) rows.push(["Confirme até", new Date(e.prazoConfirmacao + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })]);
    rows.forEach(([k, v]) => {
      const w = el("div"); w.appendChild(el("dt", "", k));
      const dd = el("dd"); if (v) dd.textContent = v; else dd.appendChild(el("span", "tbd", "em breve"));
      w.appendChild(dd); ficha.appendChild(w);
    });
    const mapa = $("#mapa");
    const q = e.mapsQuery || e.endereco;
    if (q && !DEMO) {
      const f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=" + encodeURIComponent(q) + "&output=embed";
      f.loading = "lazy"; f.title = "Mapa do local"; f.referrerPolicy = "no-referrer-when-downgrade";
      mapa.appendChild(f);
    } else {
      const ph = el("div", "map-ph");
      ph.append(el("b", "", "O mapa aparece aqui"), el("span", "", q ? q : "Assim que o endereço estiver definido."));
      if (q) { const a = el("a", "btn ghost", "Abrir no Google Maps"); a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); a.target = "_blank"; a.rel = "noopener"; ph.appendChild(a); }
      mapa.appendChild(ph);
    }
  }

  /* ---------------- Pix ---------------- */
  function semAcento(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 .\-]/g, ""); }
  function crc16(str) {
    let crc = 0xffff; const bytes = new TextEncoder().encode(str);
    for (const b of bytes) { crc ^= b << 8; for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff; }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }
  function pixPayload(valor, txid) {
    const p = C.pix || {};
    const f = (id, v) => id + String(new TextEncoder().encode(v).length).padStart(2, "0") + v;
    const gui = f("00", "br.gov.bcb.pix") + f("01", p.chave);
    let s = f("00", "01") + f("26", gui) + f("52", "0000") + f("53", "986") +
      (valor ? f("54", Number(valor).toFixed(2)) : "") + f("58", "BR") +
      f("59", semAcento(p.nome || "CASAL").slice(0, 25)) + f("60", semAcento(p.cidade || "BRASIL").slice(0, 15)) +
      f("62", f("05", (txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***")) + "6304";
    return s + crc16(s);
  }
  function renderPix(container, valor, titulo, txid) {
    container.textContent = "";
    const p = C.pix || {};
    const qr = el("div", "qr"); const info = el("div");
    info.appendChild(el("h3", "", titulo || "Pix pra casa nova"));
    if (!p.chave) {
      qr.appendChild(el("span", "fechado", "QR em breve"));
      info.appendChild(el("p", "", "A chave Pix ainda vai ser cadastrada."));
      container.append(qr, info); return;
    }
    const code = pixPayload(valor, txid);
    try { new QRCode(qr, { text: code, width: 400, height: 400, correctLevel: QRCode.CorrectLevel.M }); }
    catch (e) { qr.appendChild(el("span", "fechado", "Use o copia e cola")); }
    info.appendChild(el("p", "", valor ? "Valor: " + brl(valor) + ". Abra o app do banco e escaneie, ou use o Pix copia e cola." : "Escolha o valor no app do banco. Pode escanear ou usar o copia e cola."));
    const c = el("code", "", code); info.appendChild(c);
    const ac = el("div", "acoes");
    const b1 = el("button", "btn", "Copiar Pix copia e cola"); b1.type = "button";
    b1.addEventListener("click", () => copiar(code, c));
    const b2 = el("button", "btn ghost", "Copiar só a chave"); b2.type = "button";
    b2.addEventListener("click", () => copiar(p.chave, c));
    ac.append(b1, b2); info.appendChild(ac);
    container.append(qr, info);
  }
  function copiar(txt, fallbackEl) {
    const ok = () => toast("Copiado! Agora é só colar no app do banco.");
    try {
      navigator.clipboard.writeText(txt).then(ok, () => selecionar(fallbackEl));
    } catch (e) { selecionar(fallbackEl); }
  }
  function selecionar(n) { const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Texto selecionado: copie com Ctrl+C ou segurando o dedo."); }

  /* ---------------- cartão de crédito ----------------
     Usa o link de pagamento do próprio presente (linkCartao) ou o link geral de valor aberto (CASA.cartao.link). */
  function botaoCartao(p, valor) {
    const link = (p && p.linkCartao) || (C.cartao && C.cartao.link) || "";
    const aberto = !(p && p.linkCartao);
    const txt = "Pagar no cartão" + (valor ? " (" + brl(valor) + ")" : "");
    if (/^https:\/\//.test(link)) {
      const a = el("a", "btn ghost", txt); a.href = link; a.target = "_blank"; a.rel = "noopener";
      if (aberto && valor) a.addEventListener("click", () => toast("Na página de pagamento, digite o valor de " + brl(valor) + "."));
      return a;
    }
    const b = el("button", "btn ghost", txt); b.type = "button";
    b.addEventListener("click", () => toast("O pagamento no cartão vai ser liberado em breve. Por enquanto, use o Pix."));
    return b;
  }

  /* ---------------- presentes ---------------- */
  let presentes = [], filtro = "item"; const abertos = new Set();
  function renderPresentes() {
    const box = $("#presentes"), pixBox = $("#pixBox");
    box.textContent = "";
    if (filtro === "pix") { box.hidden = true; pixBox.hidden = false; renderPix(pixBox, null, "Pix ou cartão, valor livre", "CASANOVA"); const ac = pixBox.querySelector(".acoes"); if (ac) ac.appendChild(botaoCartao(null, null)); return; }
    box.hidden = false; pixBox.hidden = true;
    let lista = presentes.filter(p => (p.tipo || "item") === filtro);
    if (!lista.length) { box.appendChild(el("p", "mural-vazio", "Em breve!")); return; }
    const cats = filtro === "item" ? [...new Set(lista.map(p => p.categoria || "Outros"))] : [];
    const grupos = cats.length > 1 ? cats : [null];
    grupos.forEach(g => {
    const sub = g ? lista.filter(p => (p.categoria || "Outros") === g) : lista.slice();
    let alvo = box;
    if (g) {
      const det = el("details", "cat"); det.open = abertos.has(g);
      det.addEventListener("toggle", () => { det.open ? abertos.add(g) : abertos.delete(g); });
      const livres = sub.filter(p => !p.reservado).length;
      const sm = el("summary");
      sm.append(el("span", "cat-nome", g), el("span", "cat-qtd", livres ? livres + (livres > 1 ? " disponíveis" : " disponível") : "tudo reservado"));
      det.appendChild(sm);
      alvo = el("div", "cat-itens"); det.appendChild(alvo);
      box.appendChild(det);
    }
    sub.sort((a, b) => (a.reservado ? 1 : 0) - (b.reservado ? 1 : 0));
    sub.forEach((p, i) => {
      const card = el("article", "gift" + (p.reservado ? " reservado" : ""));
      const ico = el("div", "ico", (p.nome || "?").trim().charAt(0).toUpperCase()); ico.style.background = PASTEIS[i % 5];
      card.appendChild(ico);
      if (p.reservado) card.appendChild(el("span", "selo", "Reservado"));
      card.appendChild(el("h3", "", p.nome));
      if (p.descricao) card.appendChild(el("p", "", p.descricao));
      if (p.valor) card.appendChild(el("div", "preco", (p.tipo === "cota" ? "cota de " : "") + brl(p.valor)));
      const ac = el("div", "acoes");
      if (p.tipo === "cota") {
        const b = el("button", "btn", "Presentear com Pix"); b.type = "button";
        b.addEventListener("click", () => abrirCota(p)); ac.appendChild(b);
      } else if (!p.reservado) {
        const b = el("button", "btn", "Vou dar esse"); b.type = "button";
        b.addEventListener("click", () => abrirReserva(p)); ac.appendChild(b);
      }
      if (p.link && /^https:\/\//.test(p.link) && !p.reservado) {
        const a = el("a", "btn ghost", "Ver na loja"); a.href = p.link; a.target = "_blank"; a.rel = "noopener"; ac.appendChild(a);
      }
      if (ac.childNodes.length) card.appendChild(ac);
      alvo.appendChild(card);
    });
    });
  }
  function initFiltros() {
    document.querySelectorAll(".filtros button").forEach(b => b.addEventListener("click", () => {
      filtro = b.dataset.f;
      document.querySelectorAll(".filtros button").forEach(x => x.setAttribute("aria-selected", x === b ? "true" : "false"));
      renderPresentes();
    }));
  }
  function dialogo(build) {
    const d = el("dialog"); build(d, () => { d.close(); d.remove(); });
    d.addEventListener("close", () => d.remove());
    document.body.appendChild(d); d.showModal(); return d;
  }
  function abrirReserva(p) {
    dialogo((d, fechar) => {
      d.append(el("h3", "", p.nome), el("p", "", "Ao reservar, ele sai da lista pra ninguém repetir. Depois você escolhe: comprar na loja ou mandar o valor por Pix."));
      const f = el("form");
      const l1 = el("label", "", "Seu nome"); l1.htmlFor = "res-nome";
      const i1 = el("input"); i1.id = "res-nome"; i1.required = true; i1.maxLength = 80; i1.value = ls.get("nome", "");
      const l2 = el("label", "", "Telefone (opcional)"); l2.htmlFor = "res-tel";
      const i2 = el("input"); i2.id = "res-tel"; i2.inputMode = "tel"; i2.maxLength = 20; i2.value = ls.get("tel", "");
      const msg = el("p", "form-msg"); msg.setAttribute("role", "status");
      const ac = el("div", "acoes");
      const cancel = el("button", "btn ghost", "Cancelar"); cancel.type = "button"; cancel.addEventListener("click", fechar);
      const ok = el("button", "btn", "Reservar"); ok.type = "submit";
      ac.append(cancel, ok); f.append(l1, i1, l2, i2, msg, ac); d.appendChild(f);
      f.addEventListener("submit", async ev => {
        ev.preventDefault();
        if (!i1.value.trim()) { msg.textContent = "Escreva seu nome pra gente saber quem agradecer."; return; }
        ok.disabled = true; ok.textContent = "Reservando…";
        try {
          await api.post({ action: "reservar", id: p.id, nome: i1.value.trim(), telefone: i2.value.trim() });
          ls.set("nome", i1.value.trim()); if (i2.value.trim()) ls.set("tel", i2.value.trim());
          p.reservado = true; renderPresentes(); fechar();
          posReserva(p, i1.value.trim());
        } catch (e) { msg.textContent = e.message || "Não deu certo agora. Tente de novo em instantes."; ok.disabled = false; ok.textContent = "Reservar"; await carregar(); }
      });
    });
  }
  /* Depois de reservar: agradecimento + escolha entre comprar na loja ou mandar o valor por Pix */
  function posReserva(p, nome) {
    const primeiro = nome.split(" ")[0];
    const c = C.casal || {};
    dialogo((d, fechar) => {
      d.classList.add("obrigado-dlg");
      d.append(
        el("p", "ob-kicker", "Reservado pra você"),
        el("h3", "", "Obrigado, " + primeiro + "."),
        el("p", "ob-texto", "Uma casa vira lar aos poucos: com cada objeto que chega, cada pessoa que entra e cada lembrança que fica. Quando a gente usar " + artigo(p.nome) + ", vai lembrar de você e desse carinho que chegou antes mesmo da festa."),
        el("p", "ob-texto", "Obrigado por fazer parte do começo da nossa história nessa casa. Ela já tem um pedacinho seu."),
        el("p", "ob-assina", (c.nome1 || "") + " & " + (c.nome2 || ""))
      );
      const esc = el("div", "ob-escolha");
      esc.appendChild(el("p", "ob-pergunta", "Como prefere presentear? Na loja, no Pix ou no cartão (dá pra parcelar)."));
      const ac = el("div", "acoes");
      if (p.link && /^https:\/\//.test(p.link)) {
        const a = el("a", "btn", "Comprar na loja"); a.href = p.link; a.target = "_blank"; a.rel = "noopener"; ac.appendChild(a);
      }
      const bp = el("button", "btn" + (p.link ? " ghost" : ""), "Mandar " + (p.valor ? brl(p.valor) + " " : "o valor ") + "por Pix"); bp.type = "button";
      const pixArea = el("div", "pix-box"); pixArea.hidden = true; pixArea.style.border = "0"; pixArea.style.padding = "0"; pixArea.style.marginTop = "16px";
      bp.addEventListener("click", () => { pixArea.hidden = false; renderPix(pixArea, p.valor, p.nome, "PRES" + p.id); bp.hidden = true; });
      ac.appendChild(bp);
      ac.appendChild(botaoCartao(p, p.valor));
      esc.append(ac, pixArea);
      if (!p.link) esc.appendChild(el("p", "ob-nota", "Se preferir comprar numa loja, fique à vontade. O importante é o carinho."));
      d.appendChild(esc);
      const fim = el("div", "acoes"); const b = el("button", "btn ghost", "Fechar"); b.type = "button"; b.addEventListener("click", fechar);
      fim.appendChild(b); d.appendChild(fim);
    });
  }
  function artigo(nome) {
    const n = String(nome || "").trim(); if (!n) return "esse presente";
    const pl = /s$/i.test(n.split(" ")[0]);
    const fem = /a$/i.test(n.split(" ")[0].replace(/s$/i, ""));
    return (fem ? (pl ? "as " : "a ") : (pl ? "os " : "o ")) + n.charAt(0).toLowerCase() + n.slice(1);
  }
  function abrirCota(p) {
    dialogo((d, fechar) => {
      const box = el("div", "pix-box"); box.style.border = "0"; box.style.padding = "0";
      d.appendChild(box);
      renderPix(box, p.valor, p.nome, "COTA" + p.id);
      const cart = el("div", "acoes"); cart.style.justifyContent = "flex-start";
      cart.append(el("span", "ob-nota", "Prefere cartão?"), botaoCartao(p, p.valor)); d.appendChild(cart);
      const ac = el("div", "acoes"); const b = el("button", "btn ghost", "Fechar"); b.type = "button"; b.addEventListener("click", fechar);
      ac.appendChild(b); d.appendChild(ac);
      if (!DEMO) api.post({ action: "cotaAberta", id: p.id }).catch(() => {});
    });
  }

  /* ---------------- geladeira ---------------- */
  const CORES = [["#FCE9AB", "#C42B34"], ["#fbd3dc", "#9E9820"], ["#fdd6ad", "#C42B34"], ["#e6e3b6", "#FC8A2D"], ["#f8ddc9", "#DF4C74"]];
  let corSel = 0, imagemData = null;
  function renderMural(recados) {
    const m = $("#mural"); m.textContent = "";
    if (!recados.length) { m.appendChild(el("p", "mural-vazio", "A geladeira ainda está vazia. Seja o primeiro post-it!")); return; }
    const curtidos = ls.get("curtidos", []);
    recados.forEach((r, i) => {
      const c = CORES[(r.cor != null ? r.cor : i) % CORES.length];
      const p = el("figure", "postit"); p.style.margin = "0"; p.style.background = c[0]; p.style.setProperty("--ima", c[1]);
      p.style.setProperty("--rot", ((i * 37) % 7 - 3) + "deg");
      if (r.imagem && /^https:\/\//.test(r.imagem)) { const im = el("img"); im.src = r.imagem; im.alt = "Imagem enviada por " + (r.nome || "convidado"); im.loading = "lazy"; p.appendChild(im); }
      p.appendChild(el("blockquote", "", r.texto)).style.margin = "0";
      p.appendChild(el("figcaption", "de", "— " + (r.nome || "alguém querido")));
      const h = el("button", "heart"); h.type = "button";
      const liked = curtidos.includes(r.id);
      h.setAttribute("aria-pressed", liked ? "true" : "false");
      h.setAttribute("aria-label", "Curtir recado de " + (r.nome || "convidado"));
      h.textContent = "♥ " + (r.coracoes || 0);
      h.addEventListener("click", async () => {
        const cur = ls.get("curtidos", []);
        if (cur.includes(r.id)) return;
        r.coracoes = (r.coracoes || 0) + 1; h.textContent = "♥ " + r.coracoes; h.setAttribute("aria-pressed", "true");
        cur.push(r.id); ls.set("curtidos", cur);
        try { await api.post({ action: "curtir", id: r.id }); } catch (e) {}
      });
      p.appendChild(h);
      m.appendChild(p);
    });
  }
  function initRecadoForm() {
    const cores = $("#cores");
    CORES.forEach((c, i) => {
      const b = el("button"); b.type = "button"; b.style.background = c[0]; b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", i === 0 ? "true" : "false"); b.setAttribute("aria-label", "Cor " + (i + 1));
      b.addEventListener("click", () => { corSel = i; cores.querySelectorAll("button").forEach((x, j) => x.setAttribute("aria-checked", j === i ? "true" : "false")); });
      cores.appendChild(b);
    });
    $("#r-nome").value = ls.get("nome", "");
    $("#r-foto").addEventListener("change", async e => {
      const file = e.target.files[0]; if (!file) return;
      try { imagemData = await prepararImagem(file); const pv = $("#r-prev"); pv.src = imagemData; pv.hidden = false; }
      catch (err) { $("#recadoMsg").textContent = err.message; imagemData = null; }
    });
    $("#recadoForm").addEventListener("submit", async e => {
      e.preventDefault();
      const nome = $("#r-nome").value.trim(), texto = $("#r-texto").value.trim(), msg = $("#recadoMsg");
      if (!nome || !texto) { msg.textContent = "Preencha seu nome e o recado."; return; }
      const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Colando…";
      try {
        await api.post({ action: "recado", nome, texto, cor: corSel, imagem: imagemData });
        ls.set("nome", nome);
        e.target.reset(); imagemData = null; $("#r-prev").hidden = true; $("#r-nome").value = nome;
        msg.textContent = "Recebido! Seu post-it aparece na geladeira assim que a gente ler.";
      } catch (err) { msg.textContent = err.message || "Não consegui enviar agora. Tente de novo."; }
      btn.disabled = false; btn.textContent = "Colar na geladeira";
    });
  }
  function prepararImagem(file) {
    return new Promise((res, rej) => {
      if (!/^image\//.test(file.type)) return rej(new Error("Escolha um arquivo de imagem ou GIF."));
      if (file.type === "image/gif") {
        if (file.size > 2.5e6) return rej(new Error("Esse GIF é grande demais. Tente um com menos de 2,5 MB."));
        const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error("Não consegui ler o arquivo.")); fr.readAsDataURL(file); return;
      }
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1000, s = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas"); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
        res(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => rej(new Error("Não consegui abrir essa imagem."));
      img.src = url;
    });
  }

  /* ---------------- RSVP ---------------- */
  const codigo = new URLSearchParams(location.search).get("c") || "";
  let convidado = null;
  function initRsvp() {
    const e = C.evento || {};
    const prazo = e.prazoConfirmacao ? new Date(e.prazoConfirmacao + "T23:59:59") : null;
    const form = $("#rsvpForm");
    if (prazo && new Date() > prazo) {
      form.textContent = ""; form.appendChild(el("p", "fechado", "As confirmações já fecharam. Se ainda precisar falar com a gente, chama no WhatsApp!"));
      return;
    }
    if (prazo) $("#rsvpLead").textContent = "Confirme até " + prazo.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }) + ", pra gente saber quantos pratos colocar na mesa.";
    const nome = $("#v-nome"), tel = $("#v-tel"), sel = $("#v-acomp"), nomes = $("#acompNomes");
    nome.value = ls.get("nome", ""); tel.value = ls.get("tel", "");
    const setMax = max => {
      sel.textContent = "";
      for (let i = 0; i <= max; i++) { const o = el("option", "", i === 0 ? "Só eu" : "+" + i); o.value = i; sel.appendChild(o); }
    };
    setMax(3);
    sel.addEventListener("change", () => {
      nomes.textContent = "";
      for (let i = 1; i <= +sel.value; i++) {
        const l = el("label", "", "Nome do acompanhante " + i); l.htmlFor = "ac-" + i;
        const inp = el("input"); inp.id = "ac-" + i; inp.maxLength = 80; inp.className = "acomp";
        nomes.append(l, inp);
      }
    });
    document.querySelectorAll('input[name="vai"]').forEach(r => r.addEventListener("change", () => { $("#acompWrap").hidden = $("#vai-nao").checked; }));

    if (C.whatsapp) {
      const z = $("#rsvpZap"); z.hidden = false;
      const upd = () => { z.href = "https://wa.me/" + C.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent((($("#vai-nao").checked) ? "Oi! Infelizmente não vou conseguir ir ao chá de casa nova. " : "Oi! Confirmo presença no chá de casa nova! ") + (nome.value ? "Aqui é " + nome.value + "." : "")); };
      upd(); form.addEventListener("input", upd); form.addEventListener("change", upd);
    }

    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const msg = $("#rsvpMsg");
      const vai = $("#vai-sim").checked;
      const digits = tel.value.replace(/\D/g, "");
      if (!nome.value.trim()) { msg.textContent = "Escreva seu nome."; nome.focus(); return; }
      if (digits.length < 10) { msg.textContent = "Coloque o telefone com DDD, pra gente conseguir te avisar."; tel.focus(); return; }
      const acomp = vai ? [...nomes.querySelectorAll(".acomp")].map(i => i.value.trim()) : [];
      const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Enviando…";
      try {
        await api.post({ action: "rsvp", codigo, nome: nome.value.trim(), telefone: tel.value.trim(), vai, acompanhantes: acomp });
        ls.set("nome", nome.value.trim()); ls.set("tel", tel.value.trim());
        agradecer(nome.value.trim().split(" ")[0], vai, acomp.length);
      } catch (e) { msg.textContent = e.message || "Não consegui enviar agora. Tente de novo."; btn.disabled = false; btn.textContent = "Confirmar"; }
    });
  }
  function aplicarConvidado(g) {
    if (!g) return;
    convidado = g;
    const cv = $("#convite"); cv.hidden = false; cv.textContent = "Oi, " + g.nome.split(" ")[0] + "! Esse convite é seu.";
    if (!$("#v-nome").value) $("#v-nome").value = g.nome;
    if (g.telefone && !$("#v-tel").value) $("#v-tel").value = g.telefone;
    const sel = $("#v-acomp"); sel.textContent = "";
    for (let i = 0; i <= (g.max || 0); i++) { const o = el("option", "", i === 0 ? "Só eu" : "+" + i); o.value = i; sel.appendChild(o); }
    if (!g.max) $("#acompWrap").hidden = true;
    if (g.status === "sim" || g.status === "nao") $("#rsvpMsg").textContent = "Você já respondeu" + (g.status === "sim" ? " que vem. Oba!" : " que não vem.") + " Se mudou de ideia, é só enviar de novo.";
  }
  function agradecer(primeiro, vai, n) {
    $("#rsvpForm").hidden = true;
    const o = $("#obrigado"); o.hidden = false; o.textContent = "";
    primeiro = String(primeiro || "").replace(/^./, ch => ch.toUpperCase());
    if (vai) {
      o.append(el("h3", "", "Que alegria, " + primeiro + "!"),
        el("p", "", n ? "Sua presença e a de mais " + n + " já estão guardadas no nosso coração. Tem lugar à mesa, prato separado e um abraço apertado esperando por cada um." : "Sua presença já está guardada no nosso coração. Tem lugar à mesa, prato separado e um abraço apertado esperando por você."),
        el("p", "", "Uma casa só vira lar quando as pessoas que a gente ama passam pela porta. E saber que você vai estar com a gente nesse dia deixa tudo ainda mais especial."),
        el("p", "", "Perto do dia a gente te manda um lembrete no WhatsApp. Até lá, que tal deixar um post-it com carinho na nossa geladeira?"));
      const a = el("a", "btn", "Deixar meu recado ♥"); a.href = "#geladeira"; o.appendChild(a);
    } else {
      o.append(el("h3", "", "Que pena, " + primeiro + "!"), el("p", "", "Obrigado por avisar. Vamos sentir sua falta, mas a casa vai continuar de portas abertas pra você."));
      const a = el("a", "btn", "Mandar um recado mesmo assim"); a.href = "#geladeira"; o.appendChild(a);
    }
  }

  /* ---------------- álbum ---------------- */
  function initAlbum() {
    const g = $("#galeria");
    if (C.posFesta && (C.galeria || []).length) {
      $("#albumLead").textContent = "Obrigado por ter vindo. Esse dia já mora na nossa memória (e nesse álbum).";
      C.galeria.forEach((src, i) => { const im = el("img"); im.src = src; im.alt = "Foto do chá " + (i + 1); im.loading = "lazy"; g.appendChild(im); });
    } else {
      g.className = "tv"; g.appendChild(el("span", "", "Em cartaz depois do almoço: o álbum do dia"));
    }
  }

  /* ---------------- planta ativa ---------------- */
  function initPlanta() {
    const links = document.querySelectorAll(".planta [data-room]");
    // A planta agora é um cômodo do site: os dois andares aparecem lado a lado e marcam o último cômodo visitado.
    const set = () => {};
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && set(e.target.dataset.room)), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("section.room").forEach(s => io.observe(s));
    set("entrada");
  }

  /* ---------------- cápsula do tempo ---------------- */
  function dataAbertura() {
    const cfg = C.capsula || {};
    if (cfg.abre) return new Date(cfg.abre + "T12:00:00-03:00");
    const ev = C.evento && C.evento.data ? new Date(C.evento.data) : null;
    if (ev && !isNaN(ev)) { const d = new Date(ev); d.setFullYear(d.getFullYear() + 1); return d; }
    return null;
  }
  function renderCapsula(info) {
    info = info || {};
    const qtd = info.qtd || 0;
    $("#capQtd").textContent = qtd;
    $("#capLbl").textContent = qtd === 1 ? "mensagem guardada" : "mensagens guardadas";
    const papeis = $("#capPapeis"); papeis.textContent = "";
    for (let k = 0; k < Math.min(qtd, 18); k++) { const p = el("i"); p.style.background = CORES[k % CORES.length][0]; p.style.transform = "rotate(" + ((k * 47) % 50 - 25) + "deg)"; papeis.appendChild(p); }
    const abre = dataAbertura(), lbl = $("#capAbre");
    const aberta = info.aberta || (abre && new Date() >= abre);
    if (aberta) {
      lbl.textContent = "A cápsula foi aberta! Leia as mensagens abaixo.";
      $("#capForm").hidden = true;
      const box = $("#cartas"); box.hidden = false; box.textContent = "";
      (info.mensagens || []).forEach((m, k) => {
        const c = el("figure", "carta"); c.style.margin = "0";
        c.append(el("blockquote", "", m.texto), el("figcaption", "", "— " + m.nome + (m.data ? ", " + new Date(m.data).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "")));
        box.appendChild(c);
      });
    } else if (abre) {
      const dias = Math.ceil((abre - new Date()) / 864e5);
      lbl.textContent = "Abre em " + abre.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) + " · faltam " + dias + " dias";
    } else {
      lbl.textContent = "Abre no primeiro aniversário da casa";
    }
  }
  function initCapsula() {
    const SUG = ["Daqui a um ano, aposto que…", "Eu desejo pra essa casa…", "Quando vocês lerem isso, espero que…", "Minha previsão pro primeiro ano:"];
    const sug = $("#capSug"), ta = $("#cap-texto");
    SUG.forEach(t => { const b = el("button", "", t); b.type = "button"; b.addEventListener("click", () => { ta.value = t + " "; ta.focus(); }); sug.appendChild(b); });
    $("#cap-nome").value = ls.get("nome", "");
    $("#capForm").addEventListener("submit", async e => {
      e.preventDefault();
      const texto = ta.value.trim(), nome = $("#cap-nome").value.trim(), msg = $("#capMsg");
      if (!texto || !nome) { msg.textContent = "Escreva a mensagem e seu nome."; return; }
      const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Lacrando…";
      try {
        const j = await api.post({ action: "capsula", texto, nome });
        ls.set("nome", nome); ta.value = "";
        renderCapsula(j.capsula);
        msg.textContent = "Lacrada! Daqui a um ano a gente lê, prometido.";
        const pote = document.querySelector(".cap-pote"); pote.classList.remove("selou"); void pote.offsetWidth; pote.classList.add("selou");
      } catch (err) { msg.textContent = err.message || "Não consegui guardar agora. Tente de novo."; }
      btn.disabled = false; btn.textContent = "Lacrar na cápsula";
    });
    renderCapsula({ qtd: 0 });
  }

  /* ---------------- conselhos ---------------- */
  const TEMAS = ["Rotina", "Dinheiro", "Briga boa", "Cozinha", "Amor"];
  let temaSel = TEMAS[0];
  function renderConselhos(lista) {
    const box = $("#consCards"); box.textContent = "";
    if (!lista.length) { box.appendChild(el("p", "mural-vazio", "Ainda sem conselhos. Ensina a gente alguma coisa!")); return; }
    lista.forEach((c, k) => {
      const card = el("figure", "cons-card"); card.style.margin = "0";
      card.append(el("span", "cons-tema", c.tema || "Conselho"), el("blockquote", "", c.texto), el("figcaption", "", c.nome));
      box.appendChild(card);
    });
  }
  function initConselhos() {
    const t = $("#consTemas");
    TEMAS.forEach((tema, k) => {
      const b = el("button", "", tema); b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", k === 0 ? "true" : "false");
      b.addEventListener("click", () => { temaSel = tema; t.querySelectorAll("button").forEach(x => x.setAttribute("aria-checked", x === b ? "true" : "false")); });
      t.appendChild(b);
    });
    $("#cons-nome").value = ls.get("nome", "");
    $("#consForm").addEventListener("submit", async e => {
      e.preventDefault();
      const texto = $("#cons-texto").value.trim(), nome = $("#cons-nome").value.trim(), msg = $("#consMsg");
      if (!texto || !nome) { msg.textContent = "Escreva o conselho e seu nome."; return; }
      const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true;
      try {
        await api.post({ action: "conselho", texto, nome, tema: temaSel });
        ls.set("nome", nome); $("#cons-texto").value = "";
        msg.textContent = "Recebido! Ele aparece aqui assim que a gente ler.";
      } catch (err) { msg.textContent = err.message || "Não consegui enviar agora."; }
      btn.disabled = false;
    });
  }

  /* ---------------- música ----------------
     Com CASA.musica (um .mp3), toca o arquivo. Sem ele, toca uma caixinha de música original feita no próprio navegador. */
  const musica = (function () {
    let tocando = false, audio = null, ctx = null, master = null, timer = null, passo = 0;
    const b = $("#musica"), lbl = b.querySelector(".lbl");
    b.hidden = false;
    // melodia original em compasso de valsa (notas em semitons a partir de Dó 4; null = pausa)
    const MEL = [7, null, 12, 11, 12, 14, 16, null, 14, 12, 11, 12, 9, null, 7, 9, 11, 12, 14, null, 12, 11, 9, 7,
                 7, null, 12, 11, 12, 14, 16, null, 19, 17, 16, 14, 12, null, 16, 14, 12, 11, 12, null, null, null, null, null];
    const BAIXO = [0, 0, 0, -3, -3, -3, -7, -7, -7, -5, -5, -5, 0, 0, 0, -3, -3, -3, -7, -7, -5, -5, 0, 0];
    const hz = n => 261.63 * Math.pow(2, n / 12);
    function nota(n, t, vol, dur) {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o2.type = "triangle"; o.frequency.value = hz(n); o2.frequency.value = hz(n) * 2;
      const g2 = ctx.createGain(); g2.gain.value = 0.18;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    function agendar() {
      const BEAT = 0.36, ate = ctx.currentTime + 1.2;
      while (agendar.t < ate) {
        const m = MEL[passo % MEL.length]; if (m != null) nota(m, agendar.t, 0.22, 1.6);
        if (passo % 2 === 0) nota(BAIXO[(passo / 2) % BAIXO.length] - 12, agendar.t, 0.12, 1.2);
        agendar.t += BEAT; passo++;
      }
    }
    function iniciarSynth() {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return Promise.reject();
      if (!ctx) {
        ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5;
        const eco = ctx.createDelay(); eco.delayTime.value = 0.27; const fb = ctx.createGain(); fb.gain.value = 0.28;
        master.connect(ctx.destination); master.connect(eco); eco.connect(fb); fb.connect(eco); fb.connect(ctx.destination);
      }
      return ctx.resume().then(() => { master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.4); agendar.t = ctx.currentTime + 0.1; agendar(); timer = setInterval(agendar, 400); });
    }
    function ui(on) { tocando = on; b.setAttribute("aria-pressed", on ? "true" : "false"); lbl.textContent = on ? "Pausar música" : "Tocar música"; }
    function tocar(automatico) {
      if (tocando) return;
      if (automatico && ls.get("semMusica", false)) return;
      // tenta o arquivo de música; se ele não existir ainda, cai na caixinha de música
      const p = C.musica && !tocar.semArquivo
        ? (audio || (audio = Object.assign(new Audio(C.musica), { loop: true, volume: 0.6 }))).play().catch(() => { tocar.semArquivo = true; audio = null; return iniciarSynth(); })
        : iniciarSynth();
      Promise.resolve(p).then(() => ui(true)).catch(() => {});
    }
    function pausar() {
      if (audio) audio.pause();
      if (ctx) { clearInterval(timer); master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2); }
      ui(false);
    }
    b.addEventListener("click", () => { if (tocando) { pausar(); ls.set("semMusica", true); } else { ls.set("semMusica", false); tocar(); } });
    document.addEventListener("visibilitychange", () => { if (document.hidden && tocando) { pausar(); musica.volta = true; } else if (!document.hidden && musica.volta) { musica.volta = false; tocar(); } });
    return { tocar, pausar };
  })();

  /* ---------------- dados ---------------- */
  async function carregar() {
    try {
      const j = await api.get("bootstrap", { code: codigo || null });
      presentes = j.presentes || []; renderPresentes();
      renderMural(j.recados || []);
      aplicarConvidado(j.convidado);
      renderCapsula(j.capsula); renderConselhos(j.conselhos || []);
    } catch (e) {
      $("#presentes").textContent = ""; $("#presentes").appendChild(el("p", "mural-vazio", "Não consegui carregar a lista agora. Recarregue a página."));
      renderMural([]);
    }
  }

  initEntrada(); initHistoria(); initEvento(); initFiltros(); initRecadoForm(); initRsvp(); initAlbum(); initPlanta(); initCapsula(); initConselhos();
  carregar();
})();
