/* =========================================================
   CONFIGURAÇÃO DO SITE — é só editar este arquivo.
   Tudo que estiver marcado [PREENCHER] ainda falta.
   ========================================================= */
window.CASA = {
  casal: { nome1: "Marina", nome2: "Marco Túlio", monograma: "M & MT" },

  // Endereço da planilha/automação (Google Apps Script). Vazio = modo demonstração.
  API_URL: "",

  evento: {
    data: "2027-02-13T13:00:00-03:00", // [PREENCHER] ex.: "2027-01-23T12:30:00-03:00". Vazio mostra "data em breve".
    formato: "Almoço",
    horario: "a partir das 13h", // [PREENCHER] ex.: "a partir das 12h30"
    local: "Nossa casa nova",
    endereco: "Rua Jordânia, 1665, Casa 5, Bloco 1, Pedra Azul, Contagem (MG)", // endereço completo (aparece no site)
    mapsQuery: "Rua Jordânia, 1665, Pedra Azul, Contagem, MG", // texto pra busca no Google Maps (normalmente o endereço)
    brincadeiras: "Claro que tem! Vai ter brincadeira de chá, com prenda, risada e muita torcida. Só pedimos uma coisa: deixa a vergonha do lado de fora da porta.",
    prazoConfirmacao: "2027-02-03" // [PREENCHER] ex.: "2027-01-10". Depois dessa data o formulário fecha.
  },

  whatsapp: "5531988385571", // número do casal com DDI, só dígitos. Ex.: "5531999999999"

  pix: {
    chave: "70415824699",  // chave Pix (CPF, só números)
    nome: "Marina",        // nome do recebedor (até 25 letras, sem acento)
    cidade: "BELO HORIZONTE" // cidade do recebedor (até 15 letras, sem acento)
  },

  // Cartão de crédito: link de pagamento com valor aberto (ex.: Mercado Pago "Link de pagamento" ou InfinitePay).
  // Cada presente também pode ter o seu próprio link com valor fixo (coluna link_cartao na planilha).
  cartao: { link: "" },     // [PREENCHER]

  musica: "assets/musica.mp3", // a música de entrada (Jorge Ben Jor). Enquanto o arquivo não existir, toca a caixinha de música.

  // Depois da festa: true mostra a galeria de fotos do evento.
  posFesta: false,
  galeria: [],             // ex.: ["assets/fotos/festa1.jpg", ...]

  fotos: {
    capa: "assets/fotos/capa.jpg"
  },

  // Texto de gratidão que abre a sala, antes dos capítulos. Editem à vontade.
  gratidao: {
    versiculo: "Se o Senhor não edificar a casa, em vão trabalham os que a edificam.",
    referencia: "Salmos 127:1",
    titulo: "Antes de tudo, gratidão",
    pais: [["Shirlene", "Wanderson"], ["Iranã", "Francisco"]],
    paragrafos: [
      "Antes de contar a nossa história, a gente precisa agradecer a quem escreveu cada capítulo dela.",
      "Obrigado, Deus, por ter cruzado os nossos caminhos quando a gente menos esperava, por cuidar de cada detalhe e por nos dar muito mais do que um dia pedimos. Essa casa é fruto da Sua bondade, de muito trabalho e de muita fé.",
      "E obrigado, Nossa Senhora Aparecida, nossa mãe, por passar à frente de cada passo nosso, por interceder por nós nos dias difíceis e por cobrir esse sonho com o Seu manto. Foi de mãos dadas com a senhora que a gente chegou até aqui.",
      "Aos nossos pais, Shirlene e Wanderson, Iranã e Francisco: antes de existir essa casa, existiram vocês. Vocês foram a nossa primeira casa, o primeiro colo, o abraço que esperava a gente depois de um dia difícil. Abriram mão de tantos sonhos pra que os nossos coubessem no mundo, e oraram por nós em tantas noites que a gente nem ficou sabendo.",
      "Cada parede daqui carrega um pouquinho do que vocês plantaram: a fé, o cuidado, o jeito de receber bem quem chega. Se hoje a gente tem coragem de começar um lar, é porque aprendeu com vocês o que é amor de verdade. Obrigado por tudo, por tanto e por sempre. Essa casa também é de vocês, e aqui sempre vai ter lugar à mesa, café passado e um abraço apertado esperando.",
      "Obrigado também à nossa família e aos amigos que torceram, ajudaram e vibraram com cada conquista. Vocês fazem parte de cada tijolo dessa história.",
      "Que essa casa seja sempre lugar de paz, de mesa cheia, de portas abertas e de muito amor. E que Deus continue sendo o alicerce de tudo o que a gente construir aqui dentro."
    ]
  },

  // Nossa história em capítulos. Textos são rascunhos: editem à vontade.
  historia: [
    { titulo: "Do match ao réveillon", quando: "", foto: "assets/fotos/reveillon.jpg",
      texto: "Um aplicativo, uma conversa que não acabava e aquela sensação de que ia dar em alguma coisa. Com duas semanas de conversa, a gente fez o que ninguém sensato faria: viajou junto no ano novo. Foram 9 dias de viagem, e a gente voltou sabendo que era pra valer. A decisão mais imprudente e mais certa das nossas vidas." },
    { titulo: "No Topo do Mundo", quando: "13 de fevereiro de 2026", foto: "assets/fotos/topo-do-mundo.jpg",
      texto: "O pedido de namoro veio em 13 de fevereiro, lá no alto, no restaurante Topo do Mundo, com a cidade inteira brilhando lá embaixo e as alianças na mão. E a data não foi à toa: 13 é Galo. O sim veio mais rápido que a sobremesa." },
    { titulo: "São Thomé das Letras", quando: "", foto: "assets/fotos/sao-thome.jpg",
      texto: "Pedra, pôr do sol e um céu que não cabia na foto. Foi lá que a gente começou a sonhar com um lugar só nosso." },
    { titulo: "Ouro Preto", quando: "", foto: "assets/fotos/ouro-preto.jpg",
      texto: "Ladeiras, igrejas barrocas e perna doendo. Descobrimos que somos ótimos de viagem e péssimos de subida." },
    { titulo: "Na arquibancada", quando: "", foto: "assets/fotos/arquibancada.jpg",
      texto: "Tem coisa que a gente divide sem discutir: o hambúrguer, o sofá e o Galo. Ganhando ou perdendo, a gente grita junto." },
    { titulo: "A primeira casa", quando: "", foto: "",
      texto: "E agora ele existe: nossa primeira casa juntos, nossa de verdade. Só falta encher de gente querida. Ou seja, falta você." }
  ],

  // Usado só no modo demonstração (sem API_URL). Com a planilha, os presentes vêm da aba "Presentes".
  // Cápsula do tempo: abre no 1º aniversário da casa. Vazio = um ano depois da data do evento.
  capsula: { abre: "" },     // ex.: "2027-12-05"

  conselhosExemplo: [
    { tema: "Briga boa", texto: "Nunca durmam brigados. Se precisar, briguem de pijama, mas façam as pazes.", nome: "Exemplo" },
    { tema: "Cozinha", texto: "Quem cozinha não lava a louça. Essa regra salva casamentos.", nome: "Exemplo" }
  ],

  // Lista base. Com a planilha ligada, os presentes vêm da aba "Presentes" (e este bloco é ignorado).
  presentesExemplo: [
    { id: "p1", tipo: "item", categoria: "Cozinha", nome: "Jogo de panelas antiaderente", descricao: "5 peças, pro dia a dia", valor: 450, link: "" },
    { id: "p2", tipo: "item", categoria: "Cozinha", nome: "Panela de pressão", descricao: "4,5 litros, pro feijão de toda semana", valor: 180, link: "" },
    { id: "p3", tipo: "item", categoria: "Cozinha", nome: "Frigideira grande", descricao: "Antiaderente, 28 cm", valor: 120, link: "" },
    { id: "p4", tipo: "item", categoria: "Cozinha", nome: "Jogo de facas", descricao: "Com cepo", valor: 180, link: "" },
    { id: "p5", tipo: "item", categoria: "Cozinha", nome: "Tábuas de corte", descricao: "Kit de bambu", valor: 80, link: "" },
    { id: "p6", tipo: "item", categoria: "Cozinha", nome: "Kit utensílios de silicone", descricao: "Espátulas, conchas e pegadores", valor: 110, link: "" },
    { id: "p7", tipo: "item", categoria: "Cozinha", nome: "Potes herméticos", descricao: "Kit de vidro pra organizar a despensa", valor: 150, link: "" },
    { id: "p8", tipo: "item", categoria: "Cozinha", nome: "Refratários de vidro", descricao: "Kit com tampa, do forno pra mesa", valor: 130, link: "" },
    { id: "p9", tipo: "item", categoria: "Cozinha", nome: "Formas de bolo e pudim", descricao: "Pro bolo de domingo", valor: 90, link: "" },
    { id: "p10", tipo: "item", categoria: "Cozinha", nome: "Escorredor de louça", descricao: "Inox, de bancada", valor: 120, link: "" },
    { id: "p11", tipo: "item", categoria: "Cozinha", nome: "Lixeira de cozinha", descricao: "Inox, com pedal", valor: 140, link: "" },
    { id: "p12", tipo: "item", categoria: "Cozinha", nome: "Garrafa térmica", descricao: "Pro café passado ficar quentinho", valor: 90, link: "" },
    { id: "p13", tipo: "item", categoria: "Cozinha", nome: "Porta-temperos giratório", descricao: "Com potes", valor: 80, link: "" },
    { id: "p14", tipo: "item", categoria: "Cozinha", nome: "Panos de prato", descricao: "Kit com 6", valor: 60, link: "" },
    { id: "p15", tipo: "item", categoria: "Cozinha", nome: "Kit ralador, peneiras e escorredor", descricao: "O básico que ninguém lembra de comprar", valor: 70, link: "" },
    { id: "p16", tipo: "item", categoria: "Eletros", nome: "Air fryer", descricao: "Pra batata frita sem culpa", valor: 400, link: "" },
    { id: "p17", tipo: "item", categoria: "Eletros", nome: "Micro-ondas", descricao: "Pra esquentar a marmita", valor: 650, link: "" },
    { id: "p18", tipo: "item", categoria: "Eletros", nome: "Liquidificador", descricao: "Pra vitamina de domingo", valor: 200, link: "" },
    { id: "p19", tipo: "item", categoria: "Eletros", nome: "Batedeira", descricao: "Pra bolo de aniversário", valor: 300, link: "" },
    { id: "p20", tipo: "item", categoria: "Eletros", nome: "Cafeteira elétrica", descricao: "Café é item de primeira necessidade", valor: 200, link: "" },
    { id: "p21", tipo: "item", categoria: "Eletros", nome: "Panela elétrica de arroz", descricao: "Arroz soltinho sem vigiar o fogão", valor: 180, link: "" },
    { id: "p22", tipo: "item", categoria: "Eletros", nome: "Sanduicheira e grill", descricao: "Pro misto quente da madrugada", valor: 150, link: "" },
    { id: "p23", tipo: "item", categoria: "Eletros", nome: "Mixer de mão", descricao: "Com copo e batedor", valor: 180, link: "" },
    { id: "p24", tipo: "item", categoria: "Eletros", nome: "Processador de alimentos", descricao: "Pica, rala e fatia", valor: 300, link: "" },
    { id: "p25", tipo: "item", categoria: "Eletros", nome: "Chaleira elétrica", descricao: "Pro chá e pro café coado", valor: 140, link: "" },
    { id: "p26", tipo: "item", categoria: "Eletros", nome: "Purificador de água", descricao: "Água gelada direto da torneira", valor: 700, link: "" },
    { id: "p27", tipo: "item", categoria: "Eletros", nome: "Aspirador de pó vertical", descricao: "Pra casa ficar brilhando", valor: 450, link: "" },
    { id: "p28", tipo: "item", categoria: "Eletros", nome: "Robô aspirador", descricao: "O sonho de qualquer casa", valor: 1200, link: "" },
    { id: "p29", tipo: "item", categoria: "Eletros", nome: "Ferro de passar", descricao: "A vapor", valor: 180, link: "" },
    { id: "p30", tipo: "item", categoria: "Eletros", nome: "Ventilador de coluna", descricao: "Pro calor de BH", valor: 250, link: "" },
    { id: "p31", tipo: "item", categoria: "Mesa posta", nome: "Aparelho de jantar", descricao: "20 peças", valor: 350, link: "" },
    { id: "p32", tipo: "item", categoria: "Mesa posta", nome: "Faqueiro", descricao: "24 peças, inox", valor: 200, link: "" },
    { id: "p33", tipo: "item", categoria: "Mesa posta", nome: "Jogo de taças", descricao: "6 taças de vinho", valor: 160, link: "" },
    { id: "p34", tipo: "item", categoria: "Mesa posta", nome: "Jogo de copos", descricao: "12 copos de vidro", valor: 90, link: "" },
    { id: "p35", tipo: "item", categoria: "Mesa posta", nome: "Jogo de xícaras", descricao: "6 xícaras de café com pires", valor: 80, link: "" },
    { id: "p36", tipo: "item", categoria: "Mesa posta", nome: "Jogo americano e guardanapos", descricao: "6 lugares", valor: 100, link: "" },
    { id: "p37", tipo: "item", categoria: "Mesa posta", nome: "Travessas de servir", descricao: "Kit pra receber a família", valor: 150, link: "" },
    { id: "p38", tipo: "item", categoria: "Mesa posta", nome: "Toalha de mesa", descricao: "8 lugares", valor: 120, link: "" },
    { id: "p39", tipo: "item", categoria: "Mesa posta", nome: "Jarra de vidro", descricao: "Pro suco do almoço", valor: 60, link: "" },
    { id: "p40", tipo: "item", categoria: "Mesa posta", nome: "Tábua de frios", descricao: "Pro queijo e vinho com os amigos", valor: 120, link: "" },
    { id: "p41", tipo: "item", categoria: "Quarto", nome: "Jogo de cama queen", descricao: "Percal 200 fios", valor: 280, link: "" },
    { id: "p42", tipo: "item", categoria: "Quarto", nome: "Segundo jogo de cama", descricao: "Pra dia de lavar o outro", valor: 250, link: "" },
    { id: "p43", tipo: "item", categoria: "Quarto", nome: "Edredom queen", descricao: "Pras noites frias de Minas", valor: 300, link: "" },
    { id: "p44", tipo: "item", categoria: "Quarto", nome: "Travesseiros", descricao: "Par, viscoelástico", valor: 250, link: "" },
    { id: "p45", tipo: "item", categoria: "Quarto", nome: "Protetor de colchão", descricao: "Impermeável", valor: 150, link: "" },
    { id: "p46", tipo: "item", categoria: "Quarto", nome: "Manta pra cama", descricao: "Pro pé da cama ficar bonito", valor: 180, link: "" },
    { id: "p47", tipo: "item", categoria: "Quarto", nome: "Cabides", descricao: "Kit com 50, de veludo", valor: 80, link: "" },
    { id: "p48", tipo: "item", categoria: "Quarto", nome: "Organizadores de armário", descricao: "Colmeias e caixas", valor: 90, link: "" },
    { id: "p49", tipo: "item", categoria: "Quarto", nome: "Abajur", descricao: "Luz quentinha pra ler antes de dormir", valor: 150, link: "" },
    { id: "p50", tipo: "item", categoria: "Banheiro", nome: "Jogo de toalhas", descricao: "4 peças, banho e rosto", valor: 200, link: "" },
    { id: "p51", tipo: "item", categoria: "Banheiro", nome: "Toalhas de lavabo", descricao: "Pras visitas", valor: 80, link: "" },
    { id: "p52", tipo: "item", categoria: "Banheiro", nome: "Tapetes de banheiro", descricao: "Kit com 2, antiderrapante", valor: 80, link: "" },
    { id: "p53", tipo: "item", categoria: "Banheiro", nome: "Kit acessórios de bancada", descricao: "Saboneteira, porta-escovas e dispenser", valor: 120, link: "" },
    { id: "p54", tipo: "item", categoria: "Banheiro", nome: "Cesto de roupa suja", descricao: "Com tampa", valor: 120, link: "" },
    { id: "p55", tipo: "item", categoria: "Sala", nome: "Tapete pra sala", descricao: "Neutro, 2 x 1,5 m", valor: 400, link: "" },
    { id: "p56", tipo: "item", categoria: "Sala", nome: "Almofadas", descricao: "Kit com 4, capas e enchimento", valor: 150, link: "" },
    { id: "p57", tipo: "item", categoria: "Sala", nome: "Manta pro sofá", descricao: "Pro filme de domingo", valor: 120, link: "" },
    { id: "p58", tipo: "item", categoria: "Sala", nome: "Cortina", descricao: "Pra janela da sala", valor: 300, link: "" },
    { id: "p59", tipo: "item", categoria: "Sala", nome: "Luminária de chão", descricao: "Pro cantinho da leitura", valor: 280, link: "" },
    { id: "p60", tipo: "item", categoria: "Sala", nome: "Espelho decorativo", descricao: "Pra sala parecer ainda maior", valor: 350, link: "" },
    { id: "p61", tipo: "item", categoria: "Sala", nome: "Porta-retratos", descricao: "Kit com 3, pras nossas fotos", valor: 80, link: "" },
    { id: "p62", tipo: "item", categoria: "Sala", nome: "Vasos decorativos", descricao: "Pra estante e a mesa", valor: 100, link: "" },
    { id: "p63", tipo: "item", categoria: "Sala", nome: "Caixa de som bluetooth", descricao: "Pra música nunca faltar", valor: 400, link: "" },
    { id: "p64", tipo: "item", categoria: "Limpeza e lavanderia", nome: "Varal de chão", descricao: "Retrátil", valor: 150, link: "" },
    { id: "p65", tipo: "item", categoria: "Limpeza e lavanderia", nome: "Tábua de passar", descricao: "Com suporte pro ferro", valor: 180, link: "" },
    { id: "p66", tipo: "item", categoria: "Limpeza e lavanderia", nome: "Balde com mop giratório", descricao: "Limpeza sem esforço", valor: 120, link: "" },
    { id: "p67", tipo: "item", categoria: "Limpeza e lavanderia", nome: "Kit vassoura, rodo e pá", descricao: "O começo de tudo", valor: 80, link: "" },
    { id: "p68", tipo: "item", categoria: "Limpeza e lavanderia", nome: "Lixeiras pra casa", descricao: "Kit com 3", valor: 120, link: "" },
    { id: "p69", tipo: "item", categoria: "Limpeza e lavanderia", nome: "Escada dobrável", descricao: "3 degraus, pra trocar lâmpada", valor: 200, link: "" },
    { id: "p70", tipo: "item", categoria: "Limpeza e lavanderia", nome: "Caixa de ferramentas", descricao: "Pra pendurar os quadros", valor: 150, link: "" },
    { id: "p71", tipo: "item", categoria: "Terraço", nome: "Kit churrasco", descricao: "Faca, garfo e pegador", valor: 150, link: "" },
    { id: "p72", tipo: "item", categoria: "Terraço", nome: "Tábua de carne", descricao: "Grande, de madeira", valor: 100, link: "" },
    { id: "p73", tipo: "item", categoria: "Terraço", nome: "Cooler", descricao: "Pra cerveja estar sempre gelada", valor: 200, link: "" },
    { id: "p74", tipo: "item", categoria: "Terraço", nome: "Copos de chopp", descricao: "Kit com 6", valor: 90, link: "" },
    { id: "p75", tipo: "item", categoria: "Terraço", nome: "Cordão de luz", descricao: "Pras noites no terraço", valor: 90, link: "" },
    { id: "p76", tipo: "item", categoria: "Terraço", nome: "Par de cadeiras de área externa", descricao: "Pro pôr do sol lá em cima", valor: 600, link: "" },
    { id: "p77", tipo: "item", categoria: "Terraço", nome: "Rede", descricao: "Pra preguiça de domingo", valor: 180, link: "" },
    { id: "p78", tipo: "item", categoria: "Terraço", nome: "Vasos grandes", descricao: "Pras plantas do terraço", valor: 150, link: "" },
    { id: "c79", tipo: "cota", nome: "Primeira compra do mercado", descricao: "Pra encher a despensa", valor: 100, link: "" },
    { id: "c80", tipo: "cota", nome: "Jantar a dois", descricao: "Pra comemorar a casa nova", valor: 150, link: "" },
    { id: "c81", tipo: "cota", nome: "Plantas pra casa", descricao: "Verde em todos os cômodos", valor: 60, link: "" },
    { id: "c82", tipo: "cota", nome: "Quadro pra sala", descricao: "Pra parede ganhar personalidade", valor: 120, link: "" },
    { id: "c83", tipo: "cota", nome: "Ingresso pro Galo", descricao: "Programa de casal garantido", valor: 80, link: "" },
    { id: "c84", tipo: "cota", nome: "Viagem pro casal", descricao: "Pra próxima aventura a dois", valor: 200, link: "" },
    { id: "c85", tipo: "cota", nome: "Primeira pizza na casa nova", descricao: "Pra estrear a mesa", valor: 60, link: "" },
    { id: "c86", tipo: "cota", nome: "Móveis do terraço", descricao: "Pra lá em cima ficar pronto pra receber", valor: 250, link: "" }
  ],
  recadosExemplo: [
    { id: "r1", nome: "Exemplo", texto: "Que essa casa seja cheia de risada, comida boa e gente querida!", coracoes: 4, cor: 0 },
    { id: "r2", nome: "Exemplo", texto: "Já quero conhecer a varanda. Levo o vinho!", coracoes: 2, cor: 2 }
  ]
};
