#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG = require(path.join(ROOT, "js/catalog.js"));
const CONTENT = path.join(ROOT, "data/content");

const LANGS = ["pl", "de", "nl", "fr", "ja"];

function slugMap() {
  const map = new Map();
  for (const group of CATALOG) {
    for (const item of group.items) map.set(item.id, { ...item, group: group.groupKey });
  }
  return map;
}
const ITEMS = slugMap();

const families = {
  grp2D: {
    pl: "kod 2D",
    de: "2D-Code",
    nl: "2D-code",
    fr: "code 2D",
    ja: "2Dコード"
  },
  grpLinear: {
    pl: "kod liniowy",
    de: "linearer Code",
    nl: "lineaire code",
    fr: "code linéaire",
    ja: "リニアコード"
  },
  grpGS1: {
    pl: "format GS1 DataBar",
    de: "GS1 DataBar Format",
    nl: "GS1 DataBar-formaat",
    fr: "format GS1 DataBar",
    ja: "GS1 DataBar形式"
  },
  grpPostal: {
    pl: "kod pocztowy",
    de: "Postcode",
    nl: "postcode",
    fr: "code postal",
    ja: "郵便コード"
  },
  grpEan: {
    pl: "kod handlowy EAN/UPC",
    de: "EAN/UPC-Handelscode",
    nl: "EAN/UPC-retailcode",
    fr: "code commercial EAN/UPC",
    ja: "EAN/UPC小売コード"
  }
};

function term(id, name, lang, group) {
  const lower = id.toLowerCase();
  if (lang === "pl") {
    if (lower.includes("qr")) return `generator kodów QR`;
    if (lower.includes("ean")) return `generator ${name}`;
    return `generator kodów kreskowych`;
  }
  if (lang === "de") {
    if (lower.includes("qr")) return `${name} Generator`;
    if (lower.includes("ean")) return `${name} Generator`;
    return group === "grpLinear" ? `${name} Barcode Generator` : `${name} Generator`;
  }
  if (lang === "nl") {
    if (lower.includes("qr")) return `${name} QR-code generator`;
    if (group === "grpLinear") return `${name} streepjescode generator`;
    return `${name} generator`;
  }
  if (lang === "fr") {
    if (lower.includes("qr")) return `générateur ${name}`;
    return `générateur ${name}`;
  }
  if (lower.includes("qrcode") || lower.includes("qr")) return `${name} 作成`;
  if (id === "EAN13") return `JANコード 作成`;
  return `${name} 作成`;
}

function meta(lang, name, kw, family) {
  const m = {
    pl: `Utwórz ${name} w Barcode Studio. ${kw} z podglądem, ustawieniami druku, obsługą partii oraz eksportem PNG, SVG i PDF dla etykiet.`,
    de: `Erstelle ${name} in Barcode Studio. ${kw} mit Vorschau, Druckeinstellungen, Stapelverarbeitung und Export als PNG, SVG oder PDF.`,
    nl: `Maak ${name} in Barcode Studio. ${kw} met live voorbeeld, drukinstellingen, batchverwerking en export als PNG, SVG of PDF.`,
    fr: `Créez un ${name} dans Barcode Studio. ${kw} avec aperçu, réglages d’impression, traitement par lot et export PNG, SVG ou PDF.`,
    ja: `Barcode Studioで${name}を作成。${kw}、印刷設定、一括処理、PNG、SVG、PDF保存に対応します。`
  };
  return m[lang];
}

function lead(lang, name, kw, family) {
  const l = {
    pl: `Wygeneruj ${name} jako ${family}, sprawdź czytelność na żywo i przygotuj wynik do etykiet, dokumentów, opakowań lub integracji przez API.`,
    de: `Erstelle ${name} als ${family}, prüfe die Lesbarkeit direkt in der Vorschau und bereite die Ausgabe für Etiketten, Dokumente, Verpackungen oder API-Abläufe vor.`,
    nl: `Maak ${name} als ${family}, controleer de leesbaarheid direct in het voorbeeld en bereid uitvoer voor etiketten, documenten, verpakkingen of API-processen voor.`,
    fr: `Générez ${name} comme ${family}, contrôlez la lisibilité dans l’aperçu et préparez le résultat pour étiquettes, documents, emballages ou intégrations API.`,
    ja: `${name}を${family}として作成し、読み取りやすさをプレビューで確認して、ラベル、書類、包装、API連携に使える出力を準備できます。`
  };
  return l[lang];
}

const headings = {
  pl: ["Czym jest {name}", "Jak {name} koduje dane", "Jakie dane można zapisać", "Gdzie używa się tego formatu", "Jak utworzyć kod w Barcode Studio", "Drukowanie i skanowanie", "Porównanie z pokrewnymi formatami"],
  de: ["Was ist {name}", "Wie {name} Daten codiert", "Welche Daten passen hinein", "Wo dieses Format eingesetzt wird", "So erstellst du den Code in Barcode Studio", "Druck und Scanqualität", "Vergleich mit verwandten Formaten"],
  nl: ["Wat is {name}", "Hoe {name} gegevens codeert", "Welke gegevens erin passen", "Waar dit formaat wordt gebruikt", "Zo maak je de code in Barcode Studio", "Afdrukken en scannen", "Vergelijking met verwante formaten"],
  fr: ["Qu’est-ce que {name}", "Comment {name} encode les données", "Quelles données peuvent être encodées", "Où utiliser ce format", "Créer le code dans Barcode Studio", "Impression et lecture", "Comparaison avec les formats proches"],
  ja: ["{name}とは", "{name}がデータを表す仕組み", "保存できるデータ", "主な利用場面", "Barcode Studioで作成する方法", "印刷と読み取りの要点", "近い形式との比較"]
};

const paragraphSets = {
  pl: [
    "{kw} pomaga przygotować {name} bez instalowania specjalistycznego programu. Format należy do grupy {family}, dlatego dobrze sprawdza się tam, gdzie ważna jest zgodność ze skanerami, powtarzalny wygląd oraz kontrola wymiarów. W praktyce użytkownik wpisuje dane, obserwuje podgląd i od razu widzi, czy symbol zachowuje właściwe proporcje do etykiety albo dokumentu.",
    "Najważniejsze jest nie tylko samo utworzenie grafiki. Trzeba dobrać rozmiar modułu, margines, kontrast oraz ewentualny tekst czytelny dla człowieka. Barcode Studio pozwala testować te ustawienia przed eksportem, więc plik PNG, SVG lub PDF można wstawić do szablonu bez dodatkowego rysowania.",
    "Dane zapisane w {name} powinny pasować do reguł wybranej symbologii. Niektóre formaty akceptują tekst, inne tylko cyfry, parzystą liczbę znaków albo strukturę GS1 z identyfikatorami aplikacji. Jeżeli kod trafia na produkt, paczkę lub dokument urzędowy, warto zachować oryginalny numer i osobno sprawdzić cyfrę kontrolną.",
    "W środowisku produkcyjnym liczy się powtarzalność. Ten sam ciąg danych powinien zawsze dawać przewidywalny symbol, a eksport wektorowy ułatwia druk w różnych rozmiarach. Przy partiach etykiet można przygotować listę w CSV, wygenerować wiele kodów naraz i zachować jednolity styl na całej serii.",
    "Typowy proces jest prosty: wybierz {name}, wklej dane, sprawdź komunikat poprawności i ustaw rozmiar zgodny z miejscem na etykiecie. Następnie pobierz PNG do szybkiego użycia, SVG do składu lub PDF do arkusza wydruku. Przy integracjach można użyć endpointu REST, aby generować obraz kodu z adresu URL.",
    "Przed użyciem na większą skalę zrób próbny wydruk. Tło powinno być jasne, elementy symbolu ostre, a margines wolny od ramek, tekstu i grafiki. Skaner należy przetestować w warunkach zbliżonych do rzeczywistych: na papierze, opakowaniu, ekranie lub materiale, na którym kod będzie używany.",
    "{name} warto porównywać z formatami pokrewnymi pod kątem pojemności, miejsca i wymagań skanera. Jeżeli potrzebna jest większa gęstość, czasem lepszy będzie format 2D. Jeżeli priorytetem jest zgodność z kasami lub magazynem, klasyczny kod liniowy może być bezpieczniejszym wyborem."
  ],
  de: [
    "{kw} hilft, {name} ohne Spezialsoftware vorzubereiten. Das Format gehört zur Gruppe {family} und eignet sich, wenn Scanner-Kompatibilität, klare Geometrie und kontrollierte Abmessungen wichtig sind. Du gibst die Daten ein, prüfst die Vorschau und erkennst sofort, ob das Symbol zur Etikettfläche oder zum Dokument passt.",
    "Entscheidend ist nicht nur die Grafikdatei. Modulgröße, Rand, Kontrast und gegebenenfalls Klartext müssen zusammenpassen. Barcode Studio macht diese Einstellungen vor dem Export sichtbar, damit PNG, SVG oder PDF direkt in Layouts, Druckvorlagen oder interne Systeme übernommen werden können.",
    "Die Daten für {name} müssen den Regeln der jeweiligen Symbologie folgen. Einige Formate erlauben Text, andere nur Ziffern, gerade Zeichenanzahlen oder strukturierte GS1-Daten mit Application Identifiers. Bei Produkt-, Paket- oder Behördenkennzeichnung sollte die Originalnummer unverändert bleiben und die Prüfziffer separat kontrolliert werden.",
    "In betrieblichen Abläufen zählt Wiederholbarkeit. Derselbe Datenwert soll immer ein vorhersehbares Symbol erzeugen, und Vektorexport erleichtert den Druck in mehreren Größen. Für Etikettenserien kann eine CSV-Liste eingelesen werden, sodass viele Codes mit einheitlichem Stil entstehen.",
    "Der Arbeitsablauf bleibt übersichtlich: {name} auswählen, Daten einfügen, Validierung prüfen und die Größe an die verfügbare Fläche anpassen. Danach eignet sich PNG für schnelle Nutzung, SVG für Satzprogramme und PDF für Druckbögen. Für Integrationen liefert der REST-Endpunkt das Codebild direkt über eine URL.",
    "Vor dem produktiven Einsatz ist ein Probedruck sinnvoll. Der Hintergrund sollte hell sein, die Kanten müssen scharf bleiben und der Rand darf nicht durch Text, Linien oder Grafiken gestört werden. Teste mit demselben Scanner und unter ähnlichem Licht, wie später am Arbeitsplatz.",
    "{name} sollte gegen verwandte Formate nach Datendichte, Platzbedarf und Scanneranforderungen abgewogen werden. Für mehr Inhalt kann ein 2D-Format geeigneter sein. Für Kassen, Lager oder etablierte Lieferketten bleibt ein linearer Standard oft die robustere Wahl."
  ],
  nl: [
    "{kw} helpt om {name} te maken zonder aparte desktopsoftware. Het formaat hoort bij {family} en is geschikt wanneer scannercompatibiliteit, vaste geometrie en controle over afmetingen belangrijk zijn. Je voert de gegevens in, bekijkt het voorbeeld en ziet direct of het symbool op het etiket of document past.",
    "Het gaat niet alleen om een afbeelding. Modulegrootte, marge, contrast en eventueel leesbare tekst moeten samen kloppen. Barcode Studio toont deze instellingen vóór de export, zodat PNG, SVG of PDF direct bruikbaar is in een ontwerp, labeltemplate of intern systeem.",
    "De gegevens voor {name} moeten passen bij de regels van de symbologie. Sommige formaten accepteren tekst, andere alleen cijfers, een even aantal tekens of GS1-structuur met Application Identifiers. Bij producten, pakketten of officiële documenten moet het originele nummer exact behouden blijven.",
    "In operationele processen telt herhaalbaarheid. Dezelfde gegevens moeten steeds hetzelfde symbool opleveren, en vectoruitvoer maakt afdrukken op meerdere formaten betrouwbaarder. Voor reeksen etiketten kun je CSV gebruiken, zodat veel codes met dezelfde stijl worden gemaakt.",
    "De workflow is overzichtelijk: kies {name}, plak de gegevens, controleer de validatie en stel de maat af op de beschikbare ruimte. Gebruik PNG voor snel plaatsen, SVG voor vormgeving en PDF voor printvellen. Voor integraties kan de REST-endpoint direct een code-afbeelding leveren via een URL.",
    "Maak vóór grootschalig gebruik altijd een proefdruk. De achtergrond moet licht zijn, randen moeten scherp blijven en de vrije marge mag niet worden gevuld met tekst, lijnen of illustraties. Test met dezelfde scanner en vergelijkbare omstandigheden als op de werkplek.",
    "{name} vergelijk je het best met verwante formaten op gegevensdichtheid, benodigde ruimte en scannereisen. Voor meer inhoud kan een 2D-formaat beter zijn. Voor kassa, magazijn of bestaande logistieke afspraken is een lineaire standaard vaak de veiligere keuze."
  ],
  fr: [
    "{kw} permet de préparer {name} sans logiciel spécialisé. Ce format appartient à la famille {family} et convient lorsque la compatibilité lecteur, la géométrie et les dimensions doivent rester maîtrisées. Vous saisissez les données, vérifiez l’aperçu et voyez immédiatement si le symbole tient sur l’étiquette ou le document.",
    "Le résultat ne se limite pas à une image. Taille du module, marge, contraste et texte lisible doivent fonctionner ensemble. Barcode Studio rend ces paramètres visibles avant l’export afin que le PNG, le SVG ou le PDF puisse rejoindre une maquette, un modèle d’étiquette ou un système interne.",
    "Les données destinées à {name} doivent respecter les règles de la symbologie. Certains formats acceptent du texte, d’autres uniquement des chiffres, un nombre pair de caractères ou une structure GS1 avec Application Identifiers. Pour un produit, un colis ou un document réglementé, le numéro source doit rester exact.",
    "Dans un flux professionnel, la répétabilité compte. La même valeur doit produire un symbole prévisible, et l’export vectoriel facilite l’impression à différentes tailles. Pour des séries d’étiquettes, un fichier CSV permet de générer de nombreux codes avec un style cohérent.",
    "Le parcours reste direct : choisissez {name}, collez les données, contrôlez la validation et ajustez la taille à l’espace disponible. Le PNG convient à un usage rapide, le SVG à la mise en page, et le PDF aux planches d’impression. Pour une intégration, l’endpoint REST renvoie l’image du code via une URL.",
    "Avant une utilisation en volume, réalisez une impression test. Le fond doit rester clair, les bords doivent être nets et la zone libre ne doit pas recevoir de texte, de traits ou d’illustrations. Testez avec le même lecteur et dans des conditions proches de l’usage réel.",
    "{name} se compare aux formats proches selon la densité, l’espace disponible et les exigences du lecteur. Si davantage de contenu doit être encodé, un format 2D peut être plus adapté. Pour caisse, stock ou chaîne logistique établie, un standard linéaire reste souvent le choix le plus sûr."
  ],
  ja: [
    "{kw}は、専用ソフトを用意しなくても{name}を作成できるようにする機能です。この形式は{family}に属し、スキャナー互換性、形状の安定性、印刷サイズの管理が重要な場面に向いています。データを入力するとプレビューで確認でき、ラベルや書類に収まるかをすぐ判断できます。",
    "必要なのは画像を作ることだけではありません。モジュールの大きさ、余白、コントラスト、人が読める文字の表示を用途に合わせて整える必要があります。Barcode Studioでは出力前に設定を確認できるため、PNG、SVG、PDFをそのままレイアウトや社内システムに組み込めます。",
    "{name}に入れるデータは、選んだシンボル体系の規則に合わせる必要があります。文字列を扱える形式もあれば、数字のみ、偶数桁、GS1のApplication Identifiersを使う構造が必要な形式もあります。商品、荷物、公的な書類では元の番号を変えず、チェック桁も確認します。",
    "業務で使う場合は再現性が重要です。同じデータから常に同じ形のシンボルを作れること、複数サイズでも崩れないことが信頼につながります。CSVを使えば、多数のラベルを同じ設定でまとめて作成できます。",
    "作成手順はシンプルです。{name}を選び、データを貼り付け、検証表示を確認し、ラベルの空きスペースに合わせてサイズを調整します。PNGは素早い配置に、SVGは制作データに、PDFは印刷用シートに適しています。REST APIを使えばURLから画像を生成できます。",
    "大量に使う前には必ず試し刷りを行います。背景は明るく、エッジは鮮明にし、周囲の余白に文字や線を入れないことが重要です。実際に使うスキャナー、紙、包装材、照明条件で読み取りを確認してください。",
    "{name}は、近い形式と比べてデータ量、必要な面積、読み取り機器の条件を見て選びます。より多くの情報を入れるなら2D形式が適する場合があります。小売、倉庫、物流の既存運用では、広く使われるリニア形式が安定した選択になることもあります。"
  ]
};

const uses = {
  pl: ["etykiety produktów i opakowań", "magazyn oraz inwentaryzacja", "dokumenty, bilety i formularze", "wydruk partii z arkusza CSV", "integracje przez API", "kontrola jakości skanowania"],
  de: ["Produktetiketten und Verpackungen", "Lager und Inventur", "Dokumente, Tickets und Formulare", "Seriendruck aus CSV-Daten", "API-Integrationen", "Qualitätsprüfung beim Scannen"],
  nl: ["productetiketten en verpakkingen", "magazijn en inventaris", "documenten, tickets en formulieren", "batchafdruk vanuit CSV", "API-integraties", "controle van scanbaarheid"],
  fr: ["étiquettes produit et emballages", "stock et inventaire", "documents, billets et formulaires", "impression par lot depuis CSV", "intégrations API", "contrôle de la lisibilité"],
  ja: ["商品ラベルと包装", "在庫管理と棚卸し", "書類、チケット、フォーム", "CSVからの一括印刷", "API連携", "読み取り品質の確認"]
};

const faq = {
  pl: [
    ["Czy {kw} działa w przeglądarce", "Tak. Barcode Studio tworzy {name} bez instalowania programu, a wynik można pobrać jako PNG, SVG lub PDF."],
    ["Jakie dane mogę wpisać", "Wpisz dane zgodne z regułami formatu {name}. Jeżeli standard wymaga cyfr, długości albo struktury GS1, zachowaj dokładny zapis źródłowy."],
    ["Czy mogę wygenerować wiele kodów naraz", "Tak. Tryb partii pozwala wkleić listę lub wczytać CSV i pobrać serię kodów w ZIP albo PDF."],
    ["Czy taki kod nadaje się do druku", "Tak, ale przed produkcją warto zrobić próbny wydruk i sprawdzić skanowanie na docelowym materiale."],
    ["Kiedy wybrać SVG zamiast PNG", "SVG jest najlepsze do składu i skalowania, a PNG sprawdza się przy szybkim użyciu w dokumentach lub aplikacjach."],
    ["Czy mogę użyć API", "Tak. Endpoint REST pozwala tworzyć obraz kodu z parametrów w adresie URL, co ułatwia integrację z własnym systemem."]
  ],
  de: [
    ["Funktioniert {kw} im Browser", "Ja. Barcode Studio erstellt {name} ohne Installation, danach kann die Ausgabe als PNG, SVG oder PDF gespeichert werden."],
    ["Welche Daten kann ich eingeben", "Die Daten müssen zu den Regeln von {name} passen. Wenn Ziffern, Länge oder GS1-Struktur gefordert sind, sollte der Quellwert unverändert bleiben."],
    ["Kann ich viele Codes gleichzeitig erstellen", "Ja. Im Stapelmodus lassen sich Listen einfügen oder CSV-Dateien laden und anschließend als ZIP oder PDF ausgeben."],
    ["Eignet sich der Code für den Druck", "Ja, ein Probedruck mit anschließendem Scan auf dem Zielmaterial ist vor der Seriennutzung sinnvoll."],
    ["Wann ist SVG besser als PNG", "SVG eignet sich für Layout und Skalierung, PNG für schnelle Nutzung in Dokumenten oder Anwendungen."],
    ["Kann ich eine API verwenden", "Ja. Der REST-Endpunkt erzeugt das Codebild aus URL-Parametern und lässt sich in eigene Systeme integrieren."]
  ],
  nl: [
    ["Werkt {kw} in de browser", "Ja. Barcode Studio maakt {name} zonder installatie en laat je het resultaat opslaan als PNG, SVG of PDF."],
    ["Welke gegevens kan ik invoeren", "De gegevens moeten voldoen aan de regels van {name}. Als cijfers, lengte of GS1-structuur nodig zijn, behoud dan de exacte bronwaarde."],
    ["Kan ik veel codes tegelijk maken", "Ja. In batchmodus kun je een lijst plakken of CSV laden en daarna ZIP of PDF downloaden."],
    ["Is de code geschikt voor drukwerk", "Ja, maar maak vóór seriegebruik een proefdruk en test met het doelmateriaal en de scanner."],
    ["Wanneer kies ik SVG in plaats van PNG", "SVG is geschikt voor opmaak en schalen, PNG voor snel gebruik in documenten of applicaties."],
    ["Kan ik een API gebruiken", "Ja. De REST-endpoint maakt een code-afbeelding uit URL-parameters en past in eigen systemen."]
  ],
  fr: [
    ["{kw} fonctionne-t-il dans le navigateur", "Oui. Barcode Studio crée {name} sans installation, puis le résultat peut être enregistré en PNG, SVG ou PDF."],
    ["Quelles données saisir", "Les données doivent respecter les règles de {name}. Si le format impose des chiffres, une longueur ou une structure GS1, conservez la valeur source exacte."],
    ["Puis-je générer plusieurs codes à la fois", "Oui. Le mode lot accepte une liste collée ou un fichier CSV, puis produit un ZIP ou une feuille PDF."],
    ["Le code convient-il à l’impression", "Oui, mais une impression test suivie d’une lecture sur le support final reste recommandée avant la production."],
    ["Quand choisir SVG plutôt que PNG", "SVG convient à la mise en page et au redimensionnement, tandis que PNG suffit pour une utilisation rapide dans des documents ou applications."],
    ["Puis-je utiliser une API", "Oui. L’endpoint REST génère l’image du code à partir de paramètres dans l’URL pour l’intégration dans vos systèmes."]
  ],
  ja: [
    ["{kw}はブラウザーで使えますか", "はい。Barcode Studioは{name}をインストール不要で作成し、PNG、SVG、PDFとして保存できます。"],
    ["どのようなデータを入力できますか", "{name}の規則に合うデータを入力します。数字、桁数、GS1構造が必要な場合は元の値を正確に保ってください。"],
    ["複数のコードをまとめて作れますか", "はい。一括モードではリスト貼り付けやCSV読み込みを使い、ZIPまたはPDFで保存できます。"],
    ["印刷に使えますか", "使えます。ただし本番前に試し刷りを行い、実際の素材とスキャナーで読み取り確認をしてください。"],
    ["PNGではなくSVGを選ぶ場面は", "SVGは拡大縮小や制作データに向き、PNGは文書やアプリへ素早く配置する用途に向いています。"],
    ["APIで使えますか", "はい。REST APIはURLパラメータからコード画像を生成でき、自社システムへ組み込めます。"]
  ]
};

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function buildSections(lang, count, vars) {
  const hs = headings[lang];
  const ps = paragraphSets[lang];
  return Array.from({ length: count }, (_, index) => ({
    h2: fill(hs[index % hs.length], vars),
    html: `<p>${fill(ps[index % ps.length], vars)}</p><p>${fill(ps[(index + 1) % ps.length], vars)}</p><p>${fill(ps[(index + 2) % ps.length], vars)}</p><p>${fill(ps[(index + 3) % ps.length], vars)}</p><p>${fill(ps[(index + 4) % ps.length], vars)}</p>`
  }));
}

for (const lang of LANGS) {
  fs.mkdirSync(path.join(CONTENT, lang), { recursive: true });
  for (const [id, item] of ITEMS) {
    const en = JSON.parse(fs.readFileSync(path.join(CONTENT, `${id}.json`), "utf8"));
    const name = item.name;
    const family = families[item.group]?.[lang] || families.grpLinear[lang];
    const kw = term(id, name, lang, item.group);
    const vars = { name, family, kw };
    const sectionCount = Array.isArray(en.sections) ? en.sections.length : 7;
    const useCount = Array.isArray(en.uses) ? en.uses.length : 6;
    const faqCount = Array.isArray(en.faq) ? en.faq.length : 6;
    const secondarySeed = [
      kw,
      lang === "pl" ? `${name} online` : lang === "de" ? `${name} erstellen` : lang === "nl" ? `${name} maken` : lang === "fr" ? `${name} en ligne` : `${name} 生成`,
      `${name} PNG SVG PDF`,
      lang === "pl" ? `${name} etykiety` : lang === "de" ? `${name} Etiketten` : lang === "nl" ? `${name} etiketten` : lang === "fr" ? `${name} étiquettes` : `${name} ラベル`,
      lang === "pl" ? `${name} API` : lang === "de" ? `${name} API` : lang === "nl" ? `${name} API` : lang === "fr" ? `${name} API` : `${name} API`
    ];
    const secondary = Array.from({ length: en.secondaryKeywords.length || 3 }, (_, index) => secondarySeed[index % secondarySeed.length]);
    const localized = {
      id,
      title: `${kw} | Barcode Studio`,
      metaDescription: meta(lang, name, kw, family),
      primaryKeyword: kw,
      secondaryKeywords: secondary,
      lead: lead(lang, name, kw, family),
      sections: buildSections(lang, sectionCount, vars),
      uses: Array.from({ length: useCount }, (_, index) => uses[lang][index % uses[lang].length]),
      faq: Array.from({ length: faqCount }, (_, index) => {
        const pair = faq[lang][index % faq[lang].length];
        return { q: fill(pair[0], vars), a: fill(pair[1], vars) };
      })
    };
    fs.writeFileSync(path.join(CONTENT, lang, `${id}.json`), `${JSON.stringify(localized, null, 1)}\n`);
  }
}

console.log(`Normalized ${LANGS.length * ITEMS.size} localized content files.`);
