// Store listings in 9 languages for the App Store and Google Play.
// Run: node scripts/store-listings.mjs  →  store/listings.json + store/LISTINGS.md
// Fails if any field is over the store's limit, so it is safe to paste.
//
// Rules this copy follows:
// - No prices (they differ by country and will change), no other app names in keywords.
// - App Store text never mentions Android, and vice versa (Apple rejects other-platform mentions).
// - Claims match the app: 100+ styles, 100+ themes, 112 bios, 3 free styles, Lifetime Pro.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'shared/styles.json'), 'utf8'));
const style = (word, id) => {
  const found = catalogue.styles.find((item) => item.id === id);
  return [...word].map((ch) => found.mapping[ch] ?? ch).join('');
};

const LIMITS = { appName: 30, subtitle: 30, shortDescription: 80, description: 4000, keywords: 100 };

/** Sample words shown in the style they name. */
const samples = (cursive, bold, bubbles, gothic) =>
  `${style(cursive, 'script')}, ${style(bold, 'sans-bold')}, ${style(bubbles, 'circled')}, ${style(gothic, 'fraktur')}`;

const languages = {
  'en-GB': {
    label: 'English (UK) — also use for en-US',
    appName: 'Lyfstyle: Fonts Keyboard',
    subtitle: 'Cute fonts, themes & bios',
    shortDescription: '100+ fancy fonts, a keyboard for any app and 100+ themes.',
    keywords: 'fancy,text,cute,aesthetic,bio,cursive,style,symbols,kaomoji,emoji,themes,letters,caption,cool',
    intro: `Make every word stand out.\n\nLyfstyle turns your words into ${samples('cursive', 'bold', 'bubbles', 'gothic')} and ✨ sparkly ✨ text for bios, captions, names and chats. Type once, see every look, then copy and paste anywhere. Or switch to the Lyfstyle keyboard and type in style in any app.`,
    insideTitle: "WHAT'S INSIDE",
    bullets: [
      '100+ text styles in easy groups: cursive & cute, bold & clean, bubbles, gothic, glitch effects, emoji frames and kaomoji',
      'A keyboard that shows your chosen font right on the keys',
      '100+ keyboard themes: colours, textures and pictures – K-pop, pride, movies, music, art, nature and more',
      'Your own photo as the keyboard background',
      'Mix your own colours on a colour wheel',
      'Translate your message right in the keyboard',
      '112 ready-made bios and captions',
      'Tools: story cards, emoji letters, username ideas, text repeater and symbols',
    ],
    ios: 'Translating in the keyboard needs iOS 26 or later',
    android: 'Speak instead of typing with the 🎙 key',
    payTitle: 'PAY ONCE, KEEP FOREVER',
    payText: 'Script, Sans Bold and Sparkles are free. Lifetime Pro unlocks everything with one payment: no weekly subscription and no trial that renews by itself.',
    privacyTitle: 'PRIVATE BY DESIGN',
    privacyText: "No ads. No account. No tracking. Lyfstyle doesn't collect what you type. Password, email and number fields always get plain text.",
    paste: 'Styled letters are Unicode characters, so they work in Instagram, TikTok, WhatsApp, Snapchat, Discord and lots more. Some symbols can look a little different in some apps.',
  },
  'de-DE': {
    label: 'German',
    appName: 'Lyfstyle: Schriften Tastatur',
    subtitle: 'Coole Schriften, Themes, Bios',
    shortDescription: '100+ Schriften, Tastatur für jede App, 100+ Themes.',
    keywords: 'schrift,font,fonts,schön,aesthetic,bio,schreibschrift,fett,text,symbole,kaomoji,emoji,themes,stil',
    intro: `Lass jedes Wort auffallen.\n\nLyfstyle verwandelt deine Wörter in ${samples('verspielt', 'fett', 'Blasen', 'gotisch')} und ✨ glitzernden ✨ Text – für Bios, Captions, Namen und Chats. Einmal tippen, jeden Look sehen, kopieren und überall einfügen. Oder wechsle zur Lyfstyle-Tastatur und schreib in jeder App mit Style.`,
    insideTitle: 'DAS STECKT DRIN',
    bullets: [
      '100+ Textstile in übersichtlichen Gruppen: verspielt & süß, fett & klar, Blasen, Gotisch, Glitch-Effekte, Emoji-Rahmen und Kaomoji',
      'Eine Tastatur, die deine gewählte Schrift direkt auf den Tasten zeigt',
      '100+ Tastatur-Themes: Farben, Texturen und Bilder – K-Pop, Pride, Filme, Musik, Kunst, Natur und mehr',
      'Dein eigenes Foto als Tastatur-Hintergrund',
      'Mische deine eigenen Farben am Farbrad',
      'Übersetze deine Nachricht direkt in der Tastatur',
      '112 fertige Bios und Captions',
      'Tools: Story-Karten, Emoji-Buchstaben, Username-Ideen, Text-Wiederholer und Symbole',
    ],
    ios: 'Übersetzen in der Tastatur benötigt iOS 26 oder neuer',
    android: 'Sprich statt zu tippen – mit der 🎙-Taste',
    payTitle: 'EINMAL ZAHLEN, FÜR IMMER BEHALTEN',
    payText: 'Script, Sans Bold und Sparkles sind kostenlos. Lifetime Pro schaltet alles mit einer einzigen Zahlung frei: kein Wochen-Abo und keine Testphase, die sich von selbst verlängert.',
    privacyTitle: 'PRIVATSPHÄRE INKLUSIVE',
    privacyText: 'Keine Werbung. Kein Konto. Kein Tracking. Lyfstyle sammelt nicht, was du tippst. Passwort-, E-Mail- und Zahlenfelder bekommen immer normalen Text.',
    paste: 'Gestylte Buchstaben sind Unicode-Zeichen und funktionieren in Instagram, TikTok, WhatsApp, Snapchat, Discord und vielen anderen Apps. Manche Symbole sehen in einzelnen Apps etwas anders aus.',
  },
  'fr-FR': {
    label: 'French',
    appName: 'Lyfstyle : Clavier Polices',
    subtitle: 'Jolies polices, thèmes, bios',
    shortDescription: '100+ polices stylées, un clavier pour toutes les apps et 100+ thèmes.',
    keywords: 'police,écriture,jolie,aesthetic,bio,cursive,gras,texte,symboles,kaomoji,emoji,thèmes,lettres',
    intro: `Fais briller chaque mot.\n\nLyfstyle transforme tes mots en ${samples('cursive', 'gras', 'bulles', 'gothique')} et en texte ✨ pailleté ✨ pour tes bios, légendes, pseudos et discussions. Tape une fois, découvre tous les styles, copie et colle partout. Ou passe au clavier Lyfstyle et écris avec style dans n’importe quelle app.`,
    insideTitle: 'AU PROGRAMME',
    bullets: [
      '100+ styles de texte rangés par groupes : cursive et mignon, gras et net, bulles, gothique, effets glitch, cadres emoji et kaomoji',
      'Un clavier qui affiche ta police directement sur les touches',
      '100+ thèmes de clavier : couleurs, textures et images – K-pop, fierté, cinéma, musique, art, nature et plus',
      'Ta propre photo en fond de clavier',
      'Crée tes propres couleurs avec une roue chromatique',
      'Traduis ton message directement dans le clavier',
      '112 bios et légendes prêtes à l’emploi',
      'Outils : cartes story, lettres en emoji, idées de pseudo, répétiteur de texte et symboles',
    ],
    ios: 'La traduction dans le clavier nécessite iOS 26 ou une version ultérieure',
    android: 'Dicte au lieu de taper avec la touche 🎙',
    payTitle: 'PAIE UNE FOIS, GARDE-LE POUR TOUJOURS',
    payText: 'Script, Sans Bold et Sparkles sont gratuits. Lifetime Pro débloque tout en un seul paiement : pas d’abonnement hebdomadaire, pas d’essai qui se renouvelle tout seul.',
    privacyTitle: 'CONFIDENTIEL PAR NATURE',
    privacyText: 'Pas de pub. Pas de compte. Pas de pistage. Lyfstyle ne collecte pas ce que tu tapes. Les champs de mot de passe, d’e-mail et de chiffres restent toujours en texte normal.',
    paste: 'Les lettres stylées sont des caractères Unicode : elles fonctionnent sur Instagram, TikTok, WhatsApp, Snapchat, Discord et bien d’autres. Certains symboles peuvent s’afficher différemment selon l’app.',
  },
  'es-ES': {
    label: 'Spanish (Spain)',
    appName: 'Lyfstyle: Teclado de Letras',
    subtitle: 'Letras bonitas, temas y bios',
    shortDescription: '100+ letras bonitas, teclado para tus apps y 100+ temas.',
    keywords: 'fuentes,tipografía,bonitas,aesthetic,bio,cursiva,negrita,texto,símbolos,kaomoji,emoji,temas,estilo',
    intro: `Haz que cada palabra destaque.\n\nLyfstyle convierte tus palabras en ${samples('cursiva', 'negrita', 'burbujas', 'elegante')} y texto ✨ brillante ✨ para tu bio, tus pies de foto, tu nombre y tus chats. Escribe una vez, mira todos los estilos, copia y pega donde quieras. O cambia al teclado Lyfstyle y escribe con estilo en cualquier app.`,
    insideTitle: 'QUÉ INCLUYE',
    bullets: [
      '100+ estilos de texto en grupos claros: cursiva y cuqui, negrita y limpia, burbujas, gótica, efectos glitch, marcos con emoji y kaomoji',
      'Un teclado que muestra la letra que eliges en las propias teclas',
      '100+ temas de teclado: colores, texturas e imágenes – K-pop, orgullo, cine, música, arte, naturaleza y más',
      'Tu propia foto como fondo del teclado',
      'Crea tus propios colores con una rueda de color',
      'Traduce tu mensaje desde el teclado',
      '112 bios y pies de foto listos para usar',
      'Herramientas: tarjetas para stories, letras con emoji, ideas de usuario, repetidor de texto y símbolos',
    ],
    ios: 'La traducción en el teclado requiere iOS 26 o posterior',
    android: 'Dicta en vez de escribir con la tecla 🎙',
    payTitle: 'PAGA UNA VEZ, PARA SIEMPRE',
    payText: 'Script, Sans Bold y Sparkles son gratis. Lifetime Pro lo desbloquea todo con un único pago: sin suscripción semanal y sin pruebas que se renuevan solas.',
    privacyTitle: 'PRIVADO DE SERIE',
    privacyText: 'Sin anuncios. Sin cuenta. Sin rastreo. Lyfstyle no recoge lo que escribes. Los campos de contraseña, correo y números siempre reciben texto normal.',
    paste: 'Las letras con estilo son caracteres Unicode, así que funcionan en Instagram, TikTok, WhatsApp, Snapchat, Discord y muchas más. Algunos símbolos pueden verse distintos en algunas apps.',
  },
  'pt-BR': {
    label: 'Portuguese (Brazil)',
    appName: 'Lyfstyle: Teclado de Letras',
    subtitle: 'Letras fofas, temas e bios',
    shortDescription: '100+ letras lindas, teclado para qualquer app e 100+ temas.',
    keywords: 'fontes,letras,diferentes,fofas,aesthetic,bio,cursiva,negrito,símbolos,kaomoji,emoji,temas,nick',
    intro: `Faça cada palavra brilhar.\n\nO Lyfstyle transforma suas palavras em ${samples('cursiva', 'negrito', 'bolhas', 'estilosa')} e texto ✨ brilhante ✨ para bio, legendas, nomes e conversas. Digite uma vez, veja todos os estilos, copie e cole onde quiser. Ou troque para o teclado Lyfstyle e escreva com estilo em qualquer app.`,
    insideTitle: 'O QUE TEM DENTRO',
    bullets: [
      '100+ estilos de texto em grupos organizados: cursiva e fofa, negrito e clean, bolhas, gótica, efeitos glitch, molduras com emoji e kaomoji',
      'Um teclado que mostra a letra escolhida nas próprias teclas',
      '100+ temas de teclado: cores, texturas e imagens – K-pop, orgulho, filmes, música, arte, natureza e mais',
      'Sua própria foto como fundo do teclado',
      'Crie suas próprias cores numa roda de cores',
      'Traduza sua mensagem direto no teclado',
      '112 bios e legendas prontas',
      'Ferramentas: cards para stories, letras de emoji, ideias de nick, repetidor de texto e símbolos',
    ],
    ios: 'A tradução no teclado precisa do iOS 26 ou posterior',
    android: 'Fale em vez de digitar com a tecla 🎙',
    payTitle: 'PAGUE UMA VEZ, É SEU PARA SEMPRE',
    payText: 'Script, Sans Bold e Sparkles são grátis. O Lifetime Pro libera tudo com um único pagamento: sem assinatura semanal e sem teste que renova sozinho.',
    privacyTitle: 'PRIVACIDADE DE VERDADE',
    privacyText: 'Sem anúncios. Sem conta. Sem rastreamento. O Lyfstyle não coleta o que você digita. Campos de senha, e-mail e números sempre recebem texto normal.',
    paste: 'As letras estilizadas são caracteres Unicode, então funcionam no Instagram, TikTok, WhatsApp, Snapchat, Discord e muito mais. Alguns símbolos podem aparecer diferentes em alguns apps.',
  },
  'it-IT': {
    label: 'Italian',
    appName: 'Lyfstyle: Tastiera Font',
    subtitle: 'Font carini, temi e bio',
    shortDescription: '100+ font carini, una tastiera per ogni app e 100+ temi.',
    keywords: 'caratteri,scritte,carine,aesthetic,bio,corsivo,grassetto,testo,simboli,kaomoji,emoji,temi,stile',
    intro: `Fai risaltare ogni parola.\n\nLyfstyle trasforma le tue parole in ${samples('corsivo', 'grassetto', 'bolle', 'gotico')} e testo ✨ scintillante ✨ per bio, didascalie, nomi e chat. Scrivi una volta, guarda tutti gli stili, copia e incolla dove vuoi. Oppure passa alla tastiera Lyfstyle e scrivi con stile in qualsiasi app.`,
    insideTitle: 'COSA TROVI DENTRO',
    bullets: [
      '100+ stili di testo in gruppi ordinati: corsivo e carino, grassetto e pulito, bolle, gotico, effetti glitch, cornici emoji e kaomoji',
      'Una tastiera che mostra il font scelto direttamente sui tasti',
      '100+ temi per la tastiera: colori, texture e immagini – K-pop, pride, film, musica, arte, natura e altro',
      'La tua foto come sfondo della tastiera',
      'Crea i tuoi colori con la ruota dei colori',
      'Traduci il messaggio direttamente dalla tastiera',
      '112 bio e didascalie pronte',
      'Strumenti: card per le storie, lettere emoji, idee per username, ripetitore di testo e simboli',
    ],
    ios: 'La traduzione nella tastiera richiede iOS 26 o versioni successive',
    android: 'Detta invece di scrivere con il tasto 🎙',
    payTitle: 'PAGHI UNA VOLTA, TUO PER SEMPRE',
    payText: 'Script, Sans Bold e Sparkles sono gratis. Lifetime Pro sblocca tutto con un solo pagamento: niente abbonamento settimanale, niente prove che si rinnovano da sole.',
    privacyTitle: 'PRIVACY DI SERIE',
    privacyText: 'Niente pubblicità. Niente account. Niente tracciamento. Lyfstyle non raccoglie ciò che scrivi. I campi password, email e numeri ricevono sempre testo normale.',
    paste: 'Le lettere stilizzate sono caratteri Unicode: funzionano su Instagram, TikTok, WhatsApp, Snapchat, Discord e molte altre app. Alcuni simboli possono apparire diversi in certe app.',
  },
  'nl-NL': {
    label: 'Dutch',
    appName: 'Lyfstyle: Fonts Toetsenbord',
    subtitle: "Leuke fonts, thema's en bio's",
    shortDescription: "100+ leuke fonts, toetsenbord voor elke app en 100+ thema's.",
    keywords: 'lettertypes,letters,schattig,aesthetic,bio,sierlijk,vet,tekst,symbolen,kaomoji,emoji,thema,stijl',
    intro: `Laat elk woord opvallen.\n\nLyfstyle maakt van je woorden ${samples('sierlijk', 'vet', 'bubbels', 'gotisch')} en ✨ glinsterende ✨ tekst voor je bio, captions, namen en chats. Eén keer typen, elke stijl zien, kopiëren en overal plakken. Of schakel over naar het Lyfstyle-toetsenbord en typ in stijl in elke app.`,
    insideTitle: 'WAT ZIT ERIN',
    bullets: [
      '100+ tekststijlen in duidelijke groepen: sierlijk en schattig, vet en strak, bubbels, gotisch, glitch-effecten, emoji-kaders en kaomoji',
      'Een toetsenbord dat je gekozen lettertype op de toetsen laat zien',
      "100+ toetsenbordthema's: kleuren, texturen en afbeeldingen – K-pop, pride, films, muziek, kunst, natuur en meer",
      'Je eigen foto als achtergrond van het toetsenbord',
      'Meng je eigen kleuren met een kleurenwiel',
      'Vertaal je bericht direct in het toetsenbord',
      "112 kant-en-klare bio's en captions",
      'Tools: storykaarten, emoji-letters, ideeën voor gebruikersnamen, tekstherhaler en symbolen',
    ],
    ios: 'Vertalen in het toetsenbord vereist iOS 26 of nieuwer',
    android: 'Spreek in plaats van te typen met de 🎙-toets',
    payTitle: 'ÉÉN KEER BETALEN, VOOR ALTIJD VAN JOU',
    payText: 'Script, Sans Bold en Sparkles zijn gratis. Lifetime Pro ontgrendelt alles met één betaling: geen weekabonnement en geen proefperiode die vanzelf verlengt.',
    privacyTitle: 'PRIVACY STANDAARD',
    privacyText: 'Geen advertenties. Geen account. Geen tracking. Lyfstyle verzamelt niet wat je typt. Velden voor wachtwoorden, e-mail en cijfers krijgen altijd gewone tekst.',
    paste: 'Gestylde letters zijn Unicode-tekens, dus ze werken in Instagram, TikTok, WhatsApp, Snapchat, Discord en nog veel meer. Sommige symbolen zien er in bepaalde apps iets anders uit.',
  },
  'ja-JP': {
    label: 'Japanese',
    appName: 'Lyfstyle: フォント キーボード',
    subtitle: 'かわいい文字・着せ替え・プロフ',
    shortDescription: '100+種類のかわいいフォント、どのアプリでも使えるキーボード、100+のテーマ。',
    keywords: '文字,かわいい,おしゃれ,装飾,筆記体,太字,記号,顔文字,絵文字,着せ替え,プロフィール,ネーム,テキスト',
    intro: `言葉をもっとかわいく、もっと目立たせよう。\n\nLyfstyleなら、${samples('Cute', 'Bold', 'Bubble', 'Gothic')} や ✨ キラキラ ✨ の文字でプロフィール、キャプション、名前、チャットを飾れます。一度入力するだけで全スタイルをプレビューして、コピー＆ペースト。Lyfstyleキーボードに切り替えれば、どのアプリでもそのままおしゃれに入力できます。`,
    insideTitle: '主な機能',
    bullets: [
      '100+種類の文字スタイルをグループで整理：筆記体＆かわいい、太字＆シンプル、バブル、ゴシック、グリッチ、絵文字フレーム、顔文字',
      '選んだフォントがキーにそのまま表示されるキーボード',
      '100+種類の着せ替えテーマ：カラー、テクスチャ、イラスト（K-POP、プライド、映画、音楽、アート、自然など）',
      '自分の写真をキーボードの背景に',
      'カラーホイールで自分だけの配色を作成',
      'キーボードからメッセージを翻訳',
      'すぐ使えるプロフィール文・キャプション112種類',
      'ツール：ストーリー用カード、絵文字アート、ユーザー名アイデア、テキスト連打、記号',
    ],
    ios: 'キーボード内の翻訳にはiOS 26以降が必要です',
    android: '🎙キーで音声入力',
    payTitle: '買い切りでずっと使える',
    payText: 'Script、Sans Bold、Sparklesは無料。Lifetime Proなら1回の支払いですべて解放。週額サブスクも、自動更新される無料体験もありません。',
    privacyTitle: 'プライバシー重視',
    privacyText: '広告なし。アカウント不要。トラッキングなし。Lyfstyleは入力内容を収集しません。パスワード、メール、数字の入力欄では常に通常の文字になります。',
    paste: '装飾文字はUnicode文字なので、Instagram、TikTok、LINE、X、Discordなど多くのアプリで使えます。アプリによっては一部の記号の見た目が異なる場合があります。',
  },
  'ko-KR': {
    label: 'Korean',
    appName: 'Lyfstyle: 폰트 키보드',
    subtitle: '예쁜 글씨체, 테마, 프로필 문구',
    shortDescription: '예쁜 글씨체 100+가지, 모든 앱에서 쓰는 키보드, 테마 100+개.',
    keywords: '글씨체,예쁜글씨,특수문자,감성,필기체,굵은글씨,이모티콘,이모지,카오모지,테마,프로필,닉네임,꾸미기',
    intro: `모든 글자를 돋보이게.\n\nLyfstyle로 ${samples('Cute', 'Bold', 'Bubble', 'Gothic')}, ✨ 반짝이 ✨ 같은 글씨체를 프로필, 캡션, 닉네임, 채팅에 써 보세요. 한 번만 입력하면 모든 스타일을 미리 보고 복사해서 어디든 붙여 넣을 수 있어요. Lyfstyle 키보드로 바꾸면 어떤 앱에서든 바로 예쁘게 입력할 수 있어요.`,
    insideTitle: '주요 기능',
    bullets: [
      '보기 쉽게 그룹으로 정리한 글씨체 100+가지: 필기체·귀여운, 굵고 깔끔한, 버블, 고딕, 글리치 효과, 이모지 프레임, 카오모지',
      '고른 글씨체가 키에 그대로 보이는 키보드',
      '키보드 테마 100+개: 컬러, 텍스처, 이미지 – K-팝, 프라이드, 영화, 음악, 아트, 자연 등',
      '내 사진을 키보드 배경으로',
      '컬러 휠로 나만의 색 조합 만들기',
      '키보드에서 바로 메시지 번역',
      '바로 쓰는 프로필 문구·캡션 112개',
      '도구: 스토리 카드, 이모지 글자, 닉네임 아이디어, 텍스트 반복, 특수문자',
    ],
    ios: '키보드 번역은 iOS 26 이상에서 사용할 수 있어요',
    android: '🎙 키로 말해서 입력하기',
    payTitle: '한 번 결제, 평생 사용',
    payText: 'Script, Sans Bold, Sparkles는 무료예요. Lifetime Pro는 한 번 결제로 모든 기능을 열어 줘요. 주간 구독도, 자동으로 갱신되는 체험판도 없어요.',
    privacyTitle: '개인정보 보호',
    privacyText: '광고 없음. 계정 없음. 추적 없음. Lyfstyle은 입력한 내용을 수집하지 않아요. 비밀번호, 이메일, 숫자 입력란에는 항상 일반 글자가 입력돼요.',
    paste: '꾸민 글자는 유니코드 문자라서 인스타그램, 틱톡, 카카오톡, 디스코드 등 다양한 앱에서 쓸 수 있어요. 일부 앱에서는 기호가 다르게 보일 수 있어요.',
  },
};

function description(lang, platform) {
  const bullets = [...lang.bullets, platform === 'ios' ? lang.ios : lang.android].map((line) => `• ${line}`).join('\n');
  return [lang.intro, `${lang.insideTitle}\n${bullets}`, `${lang.payTitle}\n${lang.payText}`, `${lang.privacyTitle}\n${lang.privacyText}`, lang.paste].join('\n\n');
}

// Apple counts characters; count by code point so emoji and styled letters count as one.
const length = (text) => [...text].length;
const problems = [];
const output = {};
for (const [code, lang] of Object.entries(languages)) {
  const listing = {
    label: lang.label,
    appName: lang.appName,
    subtitle: lang.subtitle,
    shortDescription: lang.shortDescription,
    keywords: lang.keywords,
    appStoreDescription: description(lang, 'ios'),
    playDescription: description(lang, 'android'),
  };
  const check = (field, value, limit) => {
    if (length(value) > limit) problems.push(`${code} ${field}: ${length(value)}/${limit}`);
  };
  check('appName', listing.appName, LIMITS.appName);
  check('subtitle', listing.subtitle, LIMITS.subtitle);
  check('shortDescription', listing.shortDescription, LIMITS.shortDescription);
  check('keywords', listing.keywords, LIMITS.keywords);
  check('appStoreDescription', listing.appStoreDescription, LIMITS.description);
  check('playDescription', listing.playDescription, LIMITS.description);
  if (/\s,|,\s/.test(listing.keywords)) problems.push(`${code} keywords: no spaces around commas`);
  if (/android|google/i.test(listing.appStoreDescription)) problems.push(`${code}: App Store text mentions Android`);
  output[code] = listing;
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

fs.mkdirSync(path.join(root, 'store'), { recursive: true });
fs.writeFileSync(path.join(root, 'store/listings.json'), `${JSON.stringify(output, null, 2)}\n`);

const md = [
  '# Lyfstyle store listings',
  '',
  'Generated by `node scripts/store-listings.mjs` (edit the script, not this file). Every field is within the store limits:',
  'name 30, subtitle 30 (App Store), short description 80 (Play), description 4000, keywords 100 (App Store, comma-separated, no spaces).',
  '',
  'Where each field goes:',
  '- **App Store Connect** → App Store tab → language menu → Name, Subtitle, Description (App Store version), Keywords.',
  '- **Play Console** → Grow → Store presence → Main store listing → Manage translations → App name, Short description, Full description (Play version).',
  '',
];
for (const [code, listing] of Object.entries(output)) {
  md.push(`## ${listing.label} (${code})`, '');
  md.push(`**App name** (${length(listing.appName)}/30): ${listing.appName}`, '');
  md.push(`**Subtitle — App Store** (${length(listing.subtitle)}/30): ${listing.subtitle}`, '');
  md.push(`**Short description — Play** (${length(listing.shortDescription)}/80): ${listing.shortDescription}`, '');
  md.push(`**Keywords — App Store** (${length(listing.keywords)}/100):`, '', '```', listing.keywords, '```', '');
  md.push(`**Description — App Store** (${length(listing.appStoreDescription)}/4000):`, '', '```', listing.appStoreDescription, '```', '');
  md.push(`**Full description — Play** (${length(listing.playDescription)}/4000):`, '', '```', listing.playDescription, '```', '');
}
fs.writeFileSync(path.join(root, 'store/LISTINGS.md'), md.join('\n'));
console.log(Object.entries(output).map(([code, l]) => `${code}: name ${length(l.appName)}, subtitle ${length(l.subtitle)}, short ${length(l.shortDescription)}, keywords ${length(l.keywords)}, description ${length(l.playDescription)}`).join('\n'));
