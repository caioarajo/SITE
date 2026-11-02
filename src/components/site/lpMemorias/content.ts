// Textos da página /lp-memorias, separados do layout para facilitar a revisão.

export const EVENT_TYPES = [
  "Casamentos",
  "Noivados",
  "15 anos",
  "Formaturas",
  "Bodas",
  "Batizados",
  "Aniversários",
  "Chás",
  "Corporativos",
];

export const STEPS = [
  {
    title: "Aponta a câmera",
    text: "O QR code fica nas mesas e no próprio telão. O convidado aponta o celular, como faz para pagar um PIX, e a página abre.",
  },
  {
    title: "Envia na hora",
    text: "Tira a foto ali mesmo ou escolhe da galeria. Sem aplicativo, sem cadastro e sem grupo de mensagens.",
  },
  {
    title: "Aparece no telão",
    text: "A foto passa pela aprovação e entra no telão em segundos. Depois da festa, tudo fica reunido no álbum de vocês.",
  },
];

export const FEATURE_GROUPS = [
  {
    title: "Para os convidados",
    items: [
      { title: "Sem aplicativo e sem cadastro", text: "Abre direto no navegador, em iPhone ou Android." },
      { title: "Foto na hora ou da galeria", text: "Uma de cada vez ou várias juntas, com progresso de cada envio." },
      { title: "Vídeos e recados", text: "Além das fotos, dá para mandar vídeo ou uma mensagem só de texto." },
      { title: "Nome e legenda opcionais", text: "Quem quiser assina a foto. Quem preferir, envia sem se identificar." },
      { title: "Fotos de iPhone sem dor de cabeça", text: "O formato HEIC é convertido automaticamente." },
      { title: "Envio que insiste", text: "Se a rede cair, o envio tenta de novo sozinho e não duplica a foto." },
      { title: "Galeria e curtidas", text: "Os convidados podem ver e curtir as fotos da festa, se vocês quiserem." },
    ],
  },
  {
    title: "No telão",
    items: [
      { title: "Tempo real", text: "Foto aprovada entra na tela em instantes, sem recarregar nada." },
      { title: "Três estilos de exibição", text: "Cinema, Mosaico e Polaroid. Dá para trocar durante a festa." },
      { title: "Com o nome do evento", text: "A tela leva o nome de vocês e o QR code, para mais gente participar." },
      { title: "Nomes e legendas sob controle", text: "Ligue ou desligue quando quiser e ajuste o tempo de cada foto." },
      { title: "Mostrar agora e fixar", text: "Uma foto especial entra na hora ou volta mais vezes ao longo da noite." },
      { title: "Pausa para os grandes momentos", text: "Na valsa ou nos discursos, o telão mostra uma mensagem no lugar das fotos." },
      { title: "Curtidas viram corações", text: "Cada curtida sobe em forma de coração pela tela." },
      { title: "Firme se a internet oscilar", text: "O telão segue com o que já tem e se reconecta sozinho." },
    ],
  },
  {
    title: "Na moderação",
    items: [
      { title: "Aprovação antes de exibir", text: "Nada vai para a tela sem passar pelo painel, se vocês preferirem assim." },
      { title: "Publicação automática", text: "Em eventos mais descontraídos, as fotos podem entrar direto." },
      { title: "Aprovação em lote", text: "Uma, várias ou todas as pendentes, com poucos toques, também pelo celular." },
      { title: "Ocultar é imediato", text: "Foto ocultada sai do telão na mesma hora." },
      { title: "Filtro de palavras", text: "Legendas com termos definidos por vocês ficam retidas para revisão." },
      { title: "Bloqueio de aparelho", text: "Quem insistir em enviar o que não deve sai da festa digital, sem constrangimento." },
      { title: "Encerrar ou trocar o link", text: "Os envios fecham quando vocês decidirem, e um link vazado pode ser trocado." },
    ],
  },
  {
    title: "Depois da festa e privacidade",
    items: [
      { title: "Baixar tudo de uma vez", text: "As fotos aprovadas saem em um único arquivo, na qualidade em que foram enviadas." },
      { title: "Números do evento", text: "Quantas fotos, quantos convidados participaram e quem mais enviou." },
      { title: "Link privado", text: "O endereço não é adivinhável e não aparece em buscadores." },
      { title: "Localização removida das fotos", text: "A versão das fotos exibida no telão e na galeria não carrega dados de GPS." },
      { title: "Controle do convidado", text: "Antes de entrar, o convidado lê o aviso de privacidade. E pode apagar o que enviou." },
      { title: "QR code para impressão", text: "Em PNG e SVG, em alta resolução, para cartões, placas e porta-copos." },
    ],
  },
];

export const PLANS = [
  {
    key: "Álbum dos Convidados",
    intro: "Para reunir as fotos de todos os convidados em um só lugar, sem correr atrás de ninguém.",
    highlight: false,
    items: [
      "Galeria privada do evento",
      "QR code exclusivo para imprimir",
      "Envio de fotos, vídeos e recados pelo celular",
      "Moderação das publicações",
      "Download das fotos aprovadas",
      "Funciona em qualquer celular",
      "Atendimento pelo WhatsApp",
    ],
    bonuses: ["Modelos de cartão com QR code", "Desafios de fotos para convidados"],
  },
  {
    key: "Telão ao Vivo",
    intro: "Tudo do Álbum, com as fotos aparecendo no telão durante a festa. É o momento em que todo mundo quer participar.",
    highlight: true,
    items: [
      "Tudo do Álbum dos Convidados",
      "Fotos no telão em tempo real",
      "Três estilos de exibição",
      "Tela com o nome do evento e QR code",
      "Pausa para os grandes momentos",
      "Curtidas e recados na tela",
    ],
    bonuses: [],
  },
];

export const CHALLENGES = [
  "Uma foto com alguém que você acabou de conhecer",
  "O passo de dança mais ousado da pista",
  "A mesa mais animada da festa",
  "O detalhe da decoração que você mais amou",
  "Uma selfie com quem te apresentou aos noivos",
  "O abraço mais apertado da noite",
  "O brinde mais bonito",
  "Alguém chorando de rir",
];

export const FAQS = [
  {
    question: "Precisa baixar algum aplicativo?",
    answer: "Não. O convidado aponta a câmera para o QR code e a página abre no navegador do celular. Também não há cadastro.",
  },
  {
    question: "Funciona em iPhone e Android?",
    answer: "Sim, nos dois. As fotos em HEIC, formato padrão do iPhone, são convertidas automaticamente.",
  },
  {
    question: "Posso usar em outros eventos?",
    answer: "Sim. A LP Memórias foi pensada para casamentos, mas atende qualquer celebração em que os convidados tiram fotos: 15 anos, formaturas, bodas, batizados, aniversários e eventos corporativos.",
  },
  {
    question: "Qual a diferença entre o Álbum dos Convidados e o Telão ao Vivo?",
    answer: "O Álbum reúne as fotos em uma galeria privada para vocês baixarem. O Telão ao Vivo inclui tudo isso e exibe as fotos em um telão, TV ou projetor durante a festa.",
  },
  {
    question: "Como funciona o telão?",
    answer: "Um computador com internet, ligado ao telão, TV ou projetor, abre a página do evento em tela cheia. A partir daí, as fotos aprovadas entram sozinhas.",
  },
  {
    question: "E se alguém enviar uma foto inadequada?",
    answer: "Com a aprovação ligada, nada aparece no telão antes de passar pelo painel. Se algo já exibido precisar sair, basta ocultar e a foto some na hora. Também é possível bloquear um aparelho.",
  },
  {
    question: "E se a internet do local for ruim?",
    answer: "O envio tenta de novo automaticamente quando a conexão volta, e o telão se reconecta sozinho. Mesmo assim, vale verificar a internet do local antes do evento, porque ela influencia a velocidade das fotos.",
  },
  {
    question: "E se meus convidados não souberem usar?",
    answer: "São poucos toques e a tela é bem direta. Quem paga um PIX por QR code já sabe fazer. O próprio telão também mostra o QR code durante a festa.",
  },
  {
    question: "Quem pode ver as fotos?",
    answer: "Só quem tem o link do evento. Vocês escolhem se os convidados podem ver a galeria. O endereço não aparece em buscadores e cada convidado pode apagar o que enviou.",
  },
  {
    question: "Por quanto tempo as fotos ficam disponíveis?",
    answer: "O prazo é combinado na contratação. Vocês podem baixar todas as fotos aprovadas de uma vez para guardar.",
  },
];
