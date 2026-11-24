/**
 * Deixa a planilha com as cores do site. Rode a função "estilizar" uma vez
 * (e de novo quando quiser reaplicar). Não mexe em nenhum dado.
 */
function estilizar() {
  const CORES = {
    Convidados: "#C42B34", Confirmacoes: "#9E9820", Presentes: "#FC8A2D",
    Recados: "#DF4C74", Capsula: "#9E9820", Conselhos: "#C42B34"
  };
  Object.keys(ABAS).forEach(nome => {
    const sh = aba_(nome), n = ABAS[nome].length, cor = CORES[nome] || "#C42B34";
    const linhas = sh.getMaxRows();
    sh.setTabColor(cor);
    sh.getBandings().forEach(b => b.remove());
    sh.getRange(1, 1, linhas, n)
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
      .setHeaderRowColor(cor).setFirstRowColor("#FFFDF7").setSecondRowColor("#FDF3D4");
    sh.getRange(1, 1, linhas, n).setFontFamily("Manrope").setFontColor("#2B211C").setVerticalAlignment("middle");
    sh.getRange(1, 1, 1, n).setFontColor("#FFFFFF").setFontWeight("bold");
    sh.setRowHeight(1, 34);
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, n);
    for (let c = 1; c <= n; c++) if (sh.getColumnWidth(c) < 90) sh.setColumnWidth(c, 90);
  });
  const p = aba_("Presentes"), iv = ABAS.Presentes.indexOf("valor") + 1;
  p.getRange(2, iv, p.getMaxRows() - 1, 1).setNumberFormat('"R$" #,##0.00');
}
