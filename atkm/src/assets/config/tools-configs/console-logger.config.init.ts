const colors = {
  // Rouges et roses
  red: "E81123",          // Rouge vif
  darkred: "8B0000",      // Rouge foncé
  crimson: "DC143C",      // Rouge cramoisi
  salmon: "FA8072",       // Saumon
  lightcoral: "F08080",   // Corail clair
  pink: "FFC0CB",         // Rose
  hotpink: "FF69B4",      // Rose vif
  deeppink: "FF1493",     // Rose profond
  // Jaunes et oranges
  yellow: "FFFF30",       // Jaune lumineux
  gold: "FFD700",         // Or
  lightgoldenrod: "FAFAD2", // Or pâle
  orange: "FFA500",       // Orange
  darkorange: "FF8C00",   // Orange foncé
  coral: "FF7F50",        // Corail
  tomato: "FF6347",       // Tomate
  peachpuff: "FFDAB9",    // Pêche
  // Verts
  green: "16c60c",        // Vert lumineux
  lime: "32CD32",         // Vert citron
  forestgreen: "228B22",  // Vert forêt
  darkgreen: "006400",    // Vert foncé
  palegreen: "98FB98",    // Vert pâle
  lightgreen: "90EE90",   // Vert clair
  mediumseagreen: "3CB371", // Vert mer moyenne
  greenflash: "16c60c",   // Vert flash
  // Bleus
  cyan: "00FFFF",         // Cyan
  cyan2: "00CED1",        // Cyan foncé
  teal: "008080",         // Sarcelle
  blue: "0078D7",         // Bleu vif
  royalblue: "4169E1",    // Bleu royal
  navy: "000080",         // Bleu marine
  dodgerblue: "1E90FF",   // Bleu dodger
  skyblue: "87CEEB",      // Bleu ciel
  deepskyblue: "00BFFF",  // Bleu ciel profond
  powderblue: "B0E0E6",   // Bleu poudre
  // Violets et pourpres
  magenta: "FF00FF",      // Magenta
  purple: "800080",       // Violet
  mediumorchid: "BA55D3", // Orchidée moyenne
  darkorchid: "9932CC",   // Orchidée foncée
  indigo: "4B0082",       // Indigo
  violet: "EE82EE",       // Violet clair
  plum: "DDA0DD",         // Prune
  lavender: "E6E6FA",     // Lavande
  // Blancs, gris et noirs
  white: "FFFFFF",        // Blanc pur
  lightgray: "D3D3D3",    // Gris clair
  gray: "808080",         // Gris
  darkgray: "A9A9A9",     // Gris foncé
  black: "000000",        // Noir
  // Marrons et tons chauds
  brown: "A52A2A",        // Marron
  chocolate: "D2691E",    // Chocolat
  sienna: "A0522D",       // Sienne
  saddlebrown: "8B4513",  // Marron selle
  sandybrown: "F4A460",   // Marron sable
  goldenrod: "DAA520",    // Tige dorée
  // Tons pastel
  mintcream: "F5FFFA",    // Crème de menthe
  honeydew: "F0FFF0",     // Miellat
  aliceblue: "F0F8FF",    // Bleu Alice
  seashell: "FFF5EE",     // Coquille
  linen: "FAF0E6",        // Lin
  beige: "F5F5DC",        // Beige
  lightcyan: "E0FFFF",    // Cyan clair
  palegoldenrod: "EEE8AA" // Or pâle
};
const symbols = {
  // Flèches
  leftArrow: "\u{2190}", // ← Flèche gauche
  upArrow: "\u{2191}", // ↑ Flèche haut
  rightArrow: "\u{2192}", // → Flèche droite
  downArrow: "\u{2193}", // ↓ Flèche bas
  leftRightArrow: "\u{2194}", // ↔ Flèche gauche-droite
  upDownArrow: "\u{2195}", // ↕ Flèche haut-bas
  longLeftArrow: "\u{27F5}", // ⟵ Flèche longue gauche
  longRightArrow: "\u{27F6}", // ⟶ Flèche longue droite
  longLeftRightArrow: "\u{27F7}", // ⟷ Flèche longue gauche-droite
  curvedRightArrow: "\u{21AA}", // ↪ Flèche incurvée droite
  curvedLeftArrow: "\u{21A9}", // ↩ Flèche incurvée gauche
  doubleRightArrow: "\u{21D2}", // ⇒ Double flèche droite
  doubleLeftArrow: "\u{21D0}", // ⇐ Double flèche gauche
  // Étoiles
  filledStar: "\u{2605}", // ★ Étoile pleine
  emptyStar: "\u{2606}", // ☆ Étoile vide
  smallBlackStar: "\u{2726}", // ✦ Petite étoile noire
  smallWhiteStar: "\u{2727}", // ✧ Petite étoile blanche
  shootingStar: "\u{1F320}", // 🌠 Étoile filante
  sparkles: "\u{2728}", // ✨ Étincelles
  // Symboles mathématiques
  plusMinus: "\u{00B1}", // ± Plus ou moins
  multiplication: "\u{00D7}", // × Multiplication
  division: "\u{00F7}", // ÷ Division
  squareRoot: "\u{221A}", // √ Racine carrée
  cubeRoot: "\u{221B}", // ∛ Racine cubique
  fourthRoot: "\u{221C}", // ∜ Racine quatrième
  infinity: "\u{221E}", // ∞ Infini
  notEqual: "\u{2260}", // ≠ Différent
  lessThanOrEqual: "\u{2264}", // ≤ Inférieur ou égal
  greaterThanOrEqual: "\u{2265}", // ≥ Supérieur ou égal
  proportionalTo: "\u{221D}", // ∝ Proportionnel à
  approximatelyEqual: "\u{2248}", // ≈ Approximativement égal
  integral: "\u{222B}", // ∫ Intégrale
  summation: "\u{2211}", // ∑ Somme
  pi: "\u{03C0}", // π Pi
  // Points et marques
  bullet: "\u{2022}", // • Point (bullet)
  bulletPoint: "\u{2023}", // ‣ Pointe (bullet)
  smallCircle: "\u{25E6}", // ◦ Cercle petit
  triangleBullet: "\u{2023}", // ‣ Triangle bullet
  diamondBullet: "\u{2764}", // ❥ Diamant bullet
  // Carrés et cercles
  blackSquare: "\u{25A0}", // ■ Carré noir
  whiteSquare: "\u{25A1}", // □ Carré blanc
  blackCircle: "\u{25CF}", // ● Cercle noir
  whiteCircle: "\u{25CB}", // ○ Cercle blanc
  blackTriangle: "\u{25B2}", // ▲ Triangle noir
  whiteTriangle: "\u{25B3}", // △ Triangle blanc
  blackDiamond: "\u{25C6}", // ◆ Losange noir
  whiteDiamond: "\u{25C7}", // ◇ Losange blanc
  // Flèches de texte
  wideRightArrow: "\u{2794}", // ➔ Flèche large droite
  thinRightArrow: "\u{279C}", // ➜ Flèche droite fine
  blackRightArrow: "\u{27A4}", // ➤ Flèche noire droite
  // Symboles divers utiles
  checkbox: "\u{2611}", // ☑ Case cochée
  warning: "\u{26A0}", // ⚠ Attention (warning)
  redCross: "\u{274C}", // ❌ Croix rouge
  check: "\u{2714}", // ✔ Check
  cross: "\u{2716}", // ✖ Croix
  envelope: "\u{2709}", // ✉ Enveloppe
  telephone: "\u{260E}", // ☎ Téléphone
  // Symboles météo et nature
  sun: "\u{2600}", // ☀ Soleil
  cloud: "\u{2601}", // ☁ Nuage
  umbrella: "\u{2602}", // ☂ Parapluie
  snowman: "\u{2603}", // ☃ Bonhomme de neige
  thunderstorm: "\u{26C8}", // ⛈ Orage
  rain: "\u{1F327}", // 🌧 Pluie
  snowflake: "\u{2744}", // ❄ Flocon de neige
  crescentMoon: "\u{1F319}", // 🌙 Lune croissante
  // Cartes et échecs
  heart: "\u{2665}", // ♥ Cœur
  spade: "\u{2660}", // ♠ Pique
  club: "\u{2663}", // ♣ Trèfle
  diamond: "\u{2666}", // ♦ Carreau
  king: "\u{265A}", // ♚ Roi
  queen: "\u{265B}", // ♛ Reine
  rook: "\u{265C}", // ♜ Tour
  bishop: "\u{265D}", // ♝ Fou
  knight: "\u{265E}", // ♞ Cavalier
  pawn: "\u{265F}", // ♟ Pion
  // Autres symboles
  skullAndCrossbones: "\u{2620}", // ☠ Tête de mort
  yinYang: "\u{262F}", // ☯ Yin et Yang
  anchor: "\u{2693}", // ⚓ Ancre
  scissors: "\u{2702}", // ✂ Ciseaux
  pencil: "\u{270F}", // ✏ Crayon
  hourglass: "\u{231B}", // ⌛ Sablier plein
  hourglassEmpty: "\u{23F3}", // ⏳ Sablier vide
  recycle: "\u{267B}", // ♻ Recyclage
  radioactive: "\u{2622}", // ☢ Radioactif
  biohazard: "\u{2623}", // ☣ Biohazard
  copyright: "\u{00A9}", // © Copyright
  trademark: "\u{2122}", // ™ Marque déposée
  registered: "\u{00AE}", // ® Enregistré
  euro: "\u{20AC}", // € Euro
  dollar: "\u{24}", // $ Dollar
  pound: "\u{00A3}", // £ Livre sterling
  yen: "\u{00A5}", // ¥ Yen
  section: "\u{00A7}" // § Section
};
