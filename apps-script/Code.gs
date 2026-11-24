/**
 * Backend do site do chá de casa nova (Google Apps Script + Google Planilhas).
 *
 * Como instalar (passo a passo completo no README):
 * 1. Crie uma Planilha Google vazia > Extensões > Apps Script > cole este arquivo.
 * 2. Em Configurações do projeto > Propriedades do script, crie:
 *      ADMIN_SENHA       uma senha pro painel (obrigatória)
 *      EMAIL_AVISOS      e-mail que recebe cada confirmação/recado (opcional; padrão = dono da planilha)
 *      SITE_URL          endereço do site, ex.: https://usuario.github.io/casa (pra montar os links pessoais)
 *      CALLMEBOT_FONE    (opcional) seu WhatsApp com DDI, pra receber aviso no WhatsApp
 *      CALLMEBOT_APIKEY  (opcional) chave do CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/)
 *      DATA_EVENTO       (opcional) AAAA-MM-DD, pra lembrete automático por e-mail
 * 3. Rode a função "configurar" uma vez (cria as abas e o resumo diário).
 * 4. Implantar > Nova implantação > App da Web > Executar como: eu; Quem pode acessar: Qualquer pessoa.
 * 5. Copie a URL /exec e cole em API_URL no config.js do site e do painel.
 */

const ABAS = {
  Convidados: ["codigo", "nome", "telefone", "max_acompanhantes", "status", "respondido_em", "lembrete_enviado"],
  Confirmacoes: ["data", "codigo", "nome", "telefone", "vai", "acompanhantes", "total_pessoas"],
  Presentes: ["id", "tipo", "nome", "descricao", "valor", "link", "reservado_por", "telefone", "reservado_em", "cliques_pix", "link_cartao", "categoria"],
  Recados: ["id", "data", "nome", "texto", "cor", "imagem", "status", "coracoes"],
  Capsula: ["id", "data", "nome", "texto"],
  Conselhos: ["id", "data", "nome", "tema", "texto", "status"]
};

/* ---------------- utilidades ---------------- */
function props_() { return PropertiesService.getScriptProperties(); }
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function aba_(nome) {
  let sh = ss_().getSheetByName(nome);
  if (!sh) { sh = ss_().insertSheet(nome); sh.appendRow(ABAS[nome]); sh.setFrozenRows(1); sh.getRange(1, 1, 1, ABAS[nome].length).setFontWeight("bold"); }
  return sh;
}
function linhas_(nome) {
  const sh = aba_(nome), v = sh.getDataRange().getValues(), cab = v.shift();
  return v.map((r, i) => { const o = { _linha: i + 2 }; cab.forEach((c, j) => (o[c] = r[j])); return o; });
}
function setCampo_(nome, linha, campo, valor) {
  const col = ABAS[nome].indexOf(campo) + 1;
  aba_(nome).getRange(linha, col).setValue(valor);
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function limpa_(s, max) { return String(s == null ? "" : s).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max || 200); }
function id_() { return Utilities.getUuid().slice(0, 8); }
function avisar_(assunto, texto) {
  try {
    const email = props_().getProperty("EMAIL_AVISOS") || Session.getEffectiveUser().getEmail();
    if (email) MailApp.sendEmail(email, assunto, texto);
  } catch (e) { console.warn(e); }
  try {
    const fone = props_().getProperty("CALLMEBOT_FONE"), key = props_().getProperty("CALLMEBOT_APIKEY");
    if (fone && key) UrlFetchApp.fetch("https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(fone) + "&text=" + encodeURIComponent(assunto + "\n" + texto) + "&apikey=" + encodeURIComponent(key), { muteHttpExceptions: true });
  } catch (e) { console.warn(e); }
}
function adminOk_(senha) { const s = props_().getProperty("ADMIN_SENHA"); return s && senha === s; }

/* ---------------- leitura pública ---------------- */
function doGet(e) {
  try {
    const a = (e.parameter.action || "bootstrap");
    if (a === "bootstrap") return json_(Object.assign({ ok: true }, bootstrap_(e.parameter.code)));
    return json_({ ok: false, erro: "Ação desconhecida" });
  } catch (err) { return json_({ ok: false, erro: "Erro no servidor" }); }
}
function bootstrap_(codigo) {
  const presentes = linhas_("Presentes").filter(p => p.id && p.nome).map(p => ({
    id: String(p.id), tipo: p.tipo === "cota" ? "cota" : "item", categoria: p.categoria || "", nome: p.nome, descricao: p.descricao,
    valor: Number(p.valor) || 0, link: p.link, linkCartao: /^https:\/\//.test(p.link_cartao || "") ? p.link_cartao : "", reservado: p.tipo !== "cota" && !!p.reservado_por
  }));
  const recados = linhas_("Recados").filter(r => r.status === "aprovado").map(r => ({
    id: String(r.id), nome: r.nome, texto: r.texto, cor: Number(r.cor) || 0, imagem: r.imagem || "", coracoes: Number(r.coracoes) || 0
  })).reverse();
  let convidado = null;
  if (codigo) {
    const g = linhas_("Convidados").find(c => String(c.codigo).toUpperCase() === String(codigo).toUpperCase());
    if (g) convidado = { nome: g.nome, max: Number(g.max_acompanhantes) || 0, status: g.status || "" };
  }
  return { presentes, recados, convidado, capsula: capsula_(), conselhos: linhas_("Conselhos").filter(c => c.status === "aprovado").map(c => ({ nome: c.nome, tema: c.tema, texto: c.texto })).reverse() };
}
function capsulaAberta_() {
  const abre = props_().getProperty("CAPSULA_ABRE"); // AAAA-MM-DD
  if (abre) return new Date() >= new Date(abre + "T12:00:00-03:00");
  const ev = props_().getProperty("DATA_EVENTO");
  if (!ev) return false;
  const d = new Date(ev + "T12:00:00-03:00"); d.setFullYear(d.getFullYear() + 1);
  return new Date() >= d;
}
function capsula_() {
  const todas = linhas_("Capsula").filter(c => c.id);
  const aberta = capsulaAberta_();
  return { qtd: todas.length, aberta, mensagens: aberta ? todas.map(c => ({ nome: c.nome, texto: c.texto, data: c.data })) : [] };
}
function capsulaNova_(b) {
  const nome = limpa_(b.nome, 60), texto = limpa_(b.texto, 600);
  if (!nome || !texto) throw erro_("Escreva a mensagem e seu nome.");
  if (capsulaAberta_()) throw erro_("A cápsula já foi aberta!");
  aba_("Capsula").appendRow([id_(), new Date(), nome, texto]);
  return { ok: true, capsula: capsula_() };
}
function conselho_(b) {
  const nome = limpa_(b.nome, 60), texto = limpa_(b.texto, 300), tema = limpa_(b.tema, 20);
  if (!nome || !texto) throw erro_("Escreva o conselho e seu nome.");
  aba_("Conselhos").appendRow([id_(), new Date(), nome, tema, texto, "pendente"]);
  avisar_("💡 Novo conselho de " + nome + " esperando aprovação", texto);
  return { ok: true, pendente: true };
}

/* ---------------- escrita ---------------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const b = JSON.parse(e.postData.contents || "{}");
    lock.waitLock(15000);
    switch (b.action) {
      case "rsvp": return json_(rsvp_(b));
      case "reservar": return json_(reservar_(b));
      case "cotaAberta": return json_(cotaAberta_(b));
      case "recado": return json_(recado_(b));
      case "curtir": return json_(curtir_(b));
      case "capsula": return json_(capsulaNova_(b));
      case "conselho": return json_(conselho_(b));
      case "admin": return json_(admin_(b));
    }
    return json_({ ok: false, erro: "Ação desconhecida" });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, erro: err && err.publico ? err.message : "Não deu certo agora. Tente de novo em instantes." });
  } finally { try { lock.releaseLock(); } catch (e) {} }
}
function erro_(msg) { const e = new Error(msg); e.publico = true; return e; }

function rsvp_(b) {
  const nome = limpa_(b.nome, 80), tel = limpa_(b.telefone, 20), codigo = limpa_(b.codigo, 20).toUpperCase();
  if (!nome || tel.replace(/\D/g, "").length < 10) throw erro_("Preencha nome e telefone com DDD.");
  const prazo = props_().getProperty("PRAZO_CONFIRMACAO");
  if (prazo && new Date() > new Date(prazo + "T23:59:59-03:00")) throw erro_("As confirmações já fecharam.");
  let acomp = (Array.isArray(b.acompanhantes) ? b.acompanhantes : []).map(x => limpa_(x, 80));
  const g = codigo ? linhas_("Convidados").find(c => String(c.codigo).toUpperCase() === codigo) : null;
  if (g) acomp = acomp.slice(0, Number(g.max_acompanhantes) || 0); else acomp = acomp.slice(0, 3);
  const vai = !!b.vai;
  const total = vai ? 1 + acomp.length : 0;
  aba_("Confirmacoes").appendRow([new Date(), codigo, nome, "'" + tel, vai ? "sim" : "não", acomp.join(", "), total]);
  if (g) { setCampo_("Convidados", g._linha, "status", vai ? "sim" : "nao"); setCampo_("Convidados", g._linha, "respondido_em", new Date()); }
  avisar_(vai ? "✅ " + nome + " confirmou presença" : "❌ " + nome + " não vai",
    (vai ? "Total de pessoas: " + total + (acomp.length ? " (" + acomp.join(", ") + ")" : "") : "Respondeu que não vai.") + "\nTelefone: " + tel + "\n\nResumo: " + resumo_());
  return { ok: true };
}
function reservar_(b) {
  const nome = limpa_(b.nome, 80); if (!nome) throw erro_("Escreva seu nome.");
  const p = linhas_("Presentes").find(x => String(x.id) === String(b.id));
  if (!p) throw erro_("Esse presente não existe mais.");
  if (p.tipo !== "cota" && p.reservado_por) throw erro_("Esse presente acabou de ser reservado por outra pessoa.");
  setCampo_("Presentes", p._linha, "reservado_por", nome);
  setCampo_("Presentes", p._linha, "telefone", "'" + limpa_(b.telefone, 20));
  setCampo_("Presentes", p._linha, "reservado_em", new Date());
  avisar_("🎁 " + nome + " reservou: " + p.nome, "Telefone: " + limpa_(b.telefone, 20));
  return { ok: true };
}
function cotaAberta_(b) {
  const p = linhas_("Presentes").find(x => String(x.id) === String(b.id));
  if (p) setCampo_("Presentes", p._linha, "cliques_pix", (Number(p.cliques_pix) || 0) + 1);
  return { ok: true };
}
function recado_(b) {
  const nome = limpa_(b.nome, 60), texto = limpa_(b.texto, 400);
  if (!nome || !texto) throw erro_("Preencha seu nome e o recado.");
  let imagem = "";
  if (b.imagem && /^data:image\/(jpeg|png|gif|webp);base64,/.test(b.imagem)) {
    const [meta, dados] = b.imagem.split(",");
    const tipo = meta.match(/data:(.*);base64/)[1];
    const bytes = Utilities.base64Decode(dados);
    if (bytes.length > 3e6) throw erro_("A imagem é grande demais.");
    const pasta = pastaFotos_();
    const f = pasta.createFile(Utilities.newBlob(bytes, tipo, "recado-" + Date.now()));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    imagem = "https://drive.google.com/thumbnail?id=" + f.getId() + "&sz=w1000";
  }
  aba_("Recados").appendRow([id_(), new Date(), nome, texto, Number(b.cor) || 0, imagem, "pendente", 0]);
  avisar_("📝 Novo recado de " + nome + " esperando aprovação", texto + "\n\nAprove no painel: " + (props_().getProperty("SITE_URL") || "") + "/admin.html");
  return { ok: true, pendente: true };
}
function pastaFotos_() {
  const id = props_().getProperty("PASTA_FOTOS");
  if (id) try { return DriveApp.getFolderById(id); } catch (e) {}
  const p = DriveApp.createFolder("Chá de casa nova - fotos dos recados");
  props_().setProperty("PASTA_FOTOS", p.getId());
  return p;
}
function curtir_(b) {
  const r = linhas_("Recados").find(x => String(x.id) === String(b.id) && x.status === "aprovado");
  if (r) setCampo_("Recados", r._linha, "coracoes", (Number(r.coracoes) || 0) + 1);
  return { ok: true };
}

/* ---------------- painel ---------------- */
function admin_(b) {
  if (!adminOk_(b.senha)) throw erro_("Senha incorreta.");
  const site = (props_().getProperty("SITE_URL") || "").replace(/\/$/, "");
  switch (b.op) {
    case "tudo":
      return {
        ok: true, site,
        convidados: linhas_("Convidados").filter(c => c.codigo),
        confirmacoes: linhas_("Confirmacoes"),
        presentes: linhas_("Presentes").filter(p => p.id),
        recados: linhas_("Recados").filter(r => r.id).reverse(),
        conselhos: linhas_("Conselhos").filter(c => c.id).reverse(),
        capsula: linhas_("Capsula").filter(c => c.id).map(c => ({ id: c.id, data: c.data, nome: c.nome })),
        resumo: resumo_()
      };
    case "moderar": {
      const r = linhas_("Recados").find(x => String(x.id) === String(b.id));
      if (!r) throw erro_("Recado não encontrado.");
      if (b.status === "apagar") aba_("Recados").deleteRow(r._linha);
      else setCampo_("Recados", r._linha, "status", b.status === "aprovado" ? "aprovado" : "recusado");
      return { ok: true };
    }
    case "moderarConselho": {
      const c = linhas_("Conselhos").find(x => String(x.id) === String(b.id));
      if (!c) throw erro_("Conselho não encontrado.");
      if (b.status === "apagar") aba_("Conselhos").deleteRow(c._linha);
      else setCampo_("Conselhos", c._linha, "status", b.status === "aprovado" ? "aprovado" : "recusado");
      return { ok: true };
    }
    case "apagarCapsula": {
      const c = linhas_("Capsula").find(x => String(x.id) === String(b.id));
      if (c) aba_("Capsula").deleteRow(c._linha);
      return { ok: true };
    }
    case "convidado": {
      const nome = limpa_(b.nome, 80); if (!nome) throw erro_("Nome obrigatório.");
      const codigo = (nome.split(" ")[0].normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 6) + Math.random().toString(36).slice(2, 6)).toUpperCase();
      aba_("Convidados").appendRow([codigo, nome, "'" + limpa_(b.telefone, 20), Number(b.max) || 0, "", "", ""]);
      return { ok: true, codigo };
    }
    case "apagarConvidado": {
      const g = linhas_("Convidados").find(c => String(c.codigo) === String(b.codigo));
      if (g) aba_("Convidados").deleteRow(g._linha);
      return { ok: true };
    }
    case "lembrete": {
      const g = linhas_("Convidados").find(c => String(c.codigo) === String(b.codigo));
      if (g) setCampo_("Convidados", g._linha, "lembrete_enviado", new Date());
      return { ok: true };
    }
    case "presente": {
      const p = b.presente || {};
      const linha = [p.id || id_(), p.tipo === "cota" ? "cota" : "item", limpa_(p.nome, 80), limpa_(p.descricao, 160), Number(p.valor) || 0, /^https:\/\//.test(p.link || "") ? limpa_(p.link, 500) : ""];
      const ex = p.id && linhas_("Presentes").find(x => String(x.id) === String(p.id));
      const lc = /^https:\/\//.test(p.linkCartao || "") ? limpa_(p.linkCartao, 500) : "";
      const cat = limpa_(p.categoria || "", 40);
      if (ex) { aba_("Presentes").getRange(ex._linha, 1, 1, linha.length).setValues([linha]); setCampo_("Presentes", ex._linha, "link_cartao", lc); setCampo_("Presentes", ex._linha, "categoria", cat); }
      else aba_("Presentes").appendRow(linha.concat(["", "", "", 0, lc, cat]));
      return { ok: true };
    }
    case "apagarPresente": {
      const ex = linhas_("Presentes").find(x => String(x.id) === String(b.id));
      if (ex) aba_("Presentes").deleteRow(ex._linha);
      return { ok: true };
    }
    case "liberarPresente": {
      const ex = linhas_("Presentes").find(x => String(x.id) === String(b.id));
      if (ex) ["reservado_por", "telefone", "reservado_em"].forEach(c => setCampo_("Presentes", ex._linha, c, ""));
      return { ok: true };
    }
  }
  throw erro_("Operação desconhecida.");
}

/* ---------------- resumo e lembretes automáticos ---------------- */
function resumo_() {
  const conf = {};
  linhas_("Confirmacoes").forEach(c => { conf[String(c.telefone).replace(/\D/g, "") || c.nome] = c; }); // última resposta de cada pessoa
  let pessoas = 0, sim = 0, nao = 0;
  Object.values(conf).forEach(c => { if (c.vai === "sim") { sim++; pessoas += Number(c.total_pessoas) || 1; } else nao++; });
  const pend = linhas_("Recados").filter(r => r.status === "pendente").length;
  const reserv = linhas_("Presentes").filter(p => p.tipo !== "cota" && p.reservado_por).length;
  return sim + " confirmações (" + pessoas + " pessoas), " + nao + " não vão, " + pend + " recados esperando, " + reserv + " presentes reservados.";
}
function resumoDiario() {
  const pend = linhas_("Recados").filter(r => r.status === "pendente").length;
  const site = (props_().getProperty("SITE_URL") || "").replace(/\/$/, "");
  let extra = "";
  const data = props_().getProperty("DATA_EVENTO");
  if (data) {
    const dias = Math.ceil((new Date(data + "T12:00:00-03:00") - new Date()) / 864e5);
    if (dias === 7 || dias === 2) extra = "\n\nFaltam " + dias + " dias! Hora de mandar o lembrete no WhatsApp: abra o painel, aba Lembretes, e toque em cada convidado.";
  }
  if (!pend && !extra) return;
  avisar_("🏠 Resumo do chá de casa nova", resumo_() + extra + "\n\nPainel: " + site + "/admin.html");
}
function configurar() {
  Object.keys(ABAS).forEach(aba_);
  const s1 = ss_().getSheetByName("Página1") || ss_().getSheetByName("Sheet1");
  if (s1 && ss_().getSheets().length > 1) ss_().deleteSheet(s1);
  ScriptApp.getProjectTriggers().forEach(t => t.getHandlerFunction() === "resumoDiario" && ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("resumoDiario").timeBased().everyDays(1).atHour(9).create();
  pastaFotos_();
  MailApp.getRemainingDailyQuota(); // pede a permissão de e-mail já na configuração
  // Primeira vez: preenche a aba Presentes com a lista base (só se ela estiver vazia).
  const ab = aba_("Presentes");
  if (ab.getLastRow() < 2) {
    const linhas = PRESENTES_BASE.map(([id, tipo, nome, descricao, valor, categoria]) => [id, tipo, nome, descricao, valor, "", "", "", "", 0, "", categoria]);
    ab.getRange(2, 1, linhas.length, linhas[0].length).setValues(linhas);
  }
}

// Lista base de presentes (a mesma de presentes-base.csv). Depois de importada, edite pelo painel ou pela planilha.
const PRESENTES_BASE = [
  ["p1", "item", "Jogo de panelas antiaderente", "5 peças, pro dia a dia", 450, "Cozinha"],
  ["p2", "item", "Panela de pressão", "4,5 litros, pro feijão de toda semana", 180, "Cozinha"],
  ["p3", "item", "Frigideira grande", "Antiaderente, 28 cm", 120, "Cozinha"],
  ["p4", "item", "Jogo de facas", "Com cepo", 180, "Cozinha"],
  ["p5", "item", "Tábuas de corte", "Kit de bambu", 80, "Cozinha"],
  ["p6", "item", "Kit utensílios de silicone", "Espátulas, conchas e pegadores", 110, "Cozinha"],
  ["p7", "item", "Potes herméticos", "Kit de vidro pra organizar a despensa", 150, "Cozinha"],
  ["p8", "item", "Refratários de vidro", "Kit com tampa, do forno pra mesa", 130, "Cozinha"],
  ["p9", "item", "Formas de bolo e pudim", "Pro bolo de domingo", 90, "Cozinha"],
  ["p10", "item", "Escorredor de louça", "Inox, de bancada", 120, "Cozinha"],
  ["p11", "item", "Lixeira de cozinha", "Inox, com pedal", 140, "Cozinha"],
  ["p12", "item", "Garrafa térmica", "Pro café passado ficar quentinho", 90, "Cozinha"],
  ["p13", "item", "Porta-temperos giratório", "Com potes", 80, "Cozinha"],
  ["p14", "item", "Panos de prato", "Kit com 6", 60, "Cozinha"],
  ["p15", "item", "Kit ralador, peneiras e escorredor", "O básico que ninguém lembra de comprar", 70, "Cozinha"],
  ["p16", "item", "Air fryer", "Pra batata frita sem culpa", 400, "Eletros"],
  ["p17", "item", "Micro-ondas", "Pra esquentar a marmita", 650, "Eletros"],
  ["p18", "item", "Liquidificador", "Pra vitamina de domingo", 200, "Eletros"],
  ["p19", "item", "Batedeira", "Pra bolo de aniversário", 300, "Eletros"],
  ["p20", "item", "Cafeteira elétrica", "Café é item de primeira necessidade", 200, "Eletros"],
  ["p21", "item", "Panela elétrica de arroz", "Arroz soltinho sem vigiar o fogão", 180, "Eletros"],
  ["p22", "item", "Sanduicheira e grill", "Pro misto quente da madrugada", 150, "Eletros"],
  ["p23", "item", "Mixer de mão", "Com copo e batedor", 180, "Eletros"],
  ["p24", "item", "Processador de alimentos", "Pica, rala e fatia", 300, "Eletros"],
  ["p25", "item", "Chaleira elétrica", "Pro chá e pro café coado", 140, "Eletros"],
  ["p26", "item", "Purificador de água", "Água gelada direto da torneira", 700, "Eletros"],
  ["p27", "item", "Aspirador de pó vertical", "Pra casa ficar brilhando", 450, "Eletros"],
  ["p28", "item", "Robô aspirador", "O sonho de qualquer casa", 1200, "Eletros"],
  ["p29", "item", "Ferro de passar", "A vapor", 180, "Eletros"],
  ["p30", "item", "Ventilador de coluna", "Pro calor de BH", 250, "Eletros"],
  ["p31", "item", "Aparelho de jantar", "20 peças", 350, "Mesa posta"],
  ["p32", "item", "Faqueiro", "24 peças, inox", 200, "Mesa posta"],
  ["p33", "item", "Jogo de taças", "6 taças de vinho", 160, "Mesa posta"],
  ["p34", "item", "Jogo de copos", "12 copos de vidro", 90, "Mesa posta"],
  ["p35", "item", "Jogo de xícaras", "6 xícaras de café com pires", 80, "Mesa posta"],
  ["p36", "item", "Jogo americano e guardanapos", "6 lugares", 100, "Mesa posta"],
  ["p37", "item", "Travessas de servir", "Kit pra receber a família", 150, "Mesa posta"],
  ["p38", "item", "Toalha de mesa", "8 lugares", 120, "Mesa posta"],
  ["p39", "item", "Jarra de vidro", "Pro suco do almoço", 60, "Mesa posta"],
  ["p40", "item", "Tábua de frios", "Pro queijo e vinho com os amigos", 120, "Mesa posta"],
  ["p41", "item", "Jogo de cama queen", "Percal 200 fios", 280, "Quarto"],
  ["p42", "item", "Segundo jogo de cama", "Pra dia de lavar o outro", 250, "Quarto"],
  ["p43", "item", "Edredom queen", "Pras noites frias de Minas", 300, "Quarto"],
  ["p44", "item", "Travesseiros", "Par, viscoelástico", 250, "Quarto"],
  ["p45", "item", "Protetor de colchão", "Impermeável", 150, "Quarto"],
  ["p46", "item", "Manta pra cama", "Pro pé da cama ficar bonito", 180, "Quarto"],
  ["p47", "item", "Cabides", "Kit com 50, de veludo", 80, "Quarto"],
  ["p48", "item", "Organizadores de armário", "Colmeias e caixas", 90, "Quarto"],
  ["p49", "item", "Abajur", "Luz quentinha pra ler antes de dormir", 150, "Quarto"],
  ["p50", "item", "Jogo de toalhas", "4 peças, banho e rosto", 200, "Banheiro"],
  ["p51", "item", "Toalhas de lavabo", "Pras visitas", 80, "Banheiro"],
  ["p52", "item", "Tapetes de banheiro", "Kit com 2, antiderrapante", 80, "Banheiro"],
  ["p53", "item", "Kit acessórios de bancada", "Saboneteira, porta-escovas e dispenser", 120, "Banheiro"],
  ["p54", "item", "Cesto de roupa suja", "Com tampa", 120, "Banheiro"],
  ["p55", "item", "Tapete pra sala", "Neutro, 2 x 1,5 m", 400, "Sala"],
  ["p56", "item", "Almofadas", "Kit com 4, capas e enchimento", 150, "Sala"],
  ["p57", "item", "Manta pro sofá", "Pro filme de domingo", 120, "Sala"],
  ["p58", "item", "Cortina", "Pra janela da sala", 300, "Sala"],
  ["p59", "item", "Luminária de chão", "Pro cantinho da leitura", 280, "Sala"],
  ["p60", "item", "Espelho decorativo", "Pra sala parecer ainda maior", 350, "Sala"],
  ["p61", "item", "Porta-retratos", "Kit com 3, pras nossas fotos", 80, "Sala"],
  ["p62", "item", "Vasos decorativos", "Pra estante e a mesa", 100, "Sala"],
  ["p63", "item", "Caixa de som bluetooth", "Pra música nunca faltar", 400, "Sala"],
  ["p64", "item", "Varal de chão", "Retrátil", 150, "Limpeza e lavanderia"],
  ["p65", "item", "Tábua de passar", "Com suporte pro ferro", 180, "Limpeza e lavanderia"],
  ["p66", "item", "Balde com mop giratório", "Limpeza sem esforço", 120, "Limpeza e lavanderia"],
  ["p67", "item", "Kit vassoura, rodo e pá", "O começo de tudo", 80, "Limpeza e lavanderia"],
  ["p68", "item", "Lixeiras pra casa", "Kit com 3", 120, "Limpeza e lavanderia"],
  ["p69", "item", "Escada dobrável", "3 degraus, pra trocar lâmpada", 200, "Limpeza e lavanderia"],
  ["p70", "item", "Caixa de ferramentas", "Pra pendurar os quadros", 150, "Limpeza e lavanderia"],
  ["p71", "item", "Kit churrasco", "Faca, garfo e pegador", 150, "Terraço"],
  ["p72", "item", "Tábua de carne", "Grande, de madeira", 100, "Terraço"],
  ["p73", "item", "Cooler", "Pra cerveja estar sempre gelada", 200, "Terraço"],
  ["p74", "item", "Copos de chopp", "Kit com 6", 90, "Terraço"],
  ["p75", "item", "Cordão de luz", "Pras noites no terraço", 90, "Terraço"],
  ["p76", "item", "Par de cadeiras de área externa", "Pro pôr do sol lá em cima", 600, "Terraço"],
  ["p77", "item", "Rede", "Pra preguiça de domingo", 180, "Terraço"],
  ["p78", "item", "Vasos grandes", "Pras plantas do terraço", 150, "Terraço"],
  ["c79", "cota", "Primeira compra do mercado", "Pra encher a despensa", 100, ""],
  ["c80", "cota", "Jantar a dois", "Pra comemorar a casa nova", 150, ""],
  ["c81", "cota", "Plantas pra casa", "Verde em todos os cômodos", 60, ""],
  ["c82", "cota", "Quadro pra sala", "Pra parede ganhar personalidade", 120, ""],
  ["c83", "cota", "Ingresso pro Galo", "Programa de casal garantido", 80, ""],
  ["c84", "cota", "Viagem pro casal", "Pra próxima aventura a dois", 200, ""],
  ["c85", "cota", "Primeira pizza na casa nova", "Pra estrear a mesa", 60, ""],
  ["c86", "cota", "Móveis do terraço", "Pra lá em cima ficar pronto pra receber", 250, ""]
];

