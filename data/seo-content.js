// SEO content for per-symbology landing pages.
// The page builder (scripts/build-pages.mjs) merges this with the shared catalog
// and the app's HINTS_EN one-liners to produce a unique page per barcode type.
module.exports = {
  site: {
    name: "Barcode APIs",
    baseUrl: "https://barcodeapis.com",
    dir: "barcodes" // URL segment + output folder: /barcodes/<slug> (avoids the /barcode API path)
  },

  // Category-level context used to derive copy for types without a full override.
  categories: {
    grp2D: {
      label: "2D Code",
      lede: "a two-dimensional matrix symbology that stores data in both height and width, packing far more into a small area than a linear barcode.",
      uses: ["Product packaging & labels", "Marketing & mobile links", "Asset & inventory tracking", "Tickets & documents"]
    },
    grpLinear: {
      label: "Linear Barcode",
      lede: "a one-dimensional barcode that encodes data in the widths of parallel bars and spaces, read by virtually every laser and imaging scanner.",
      uses: ["Retail & point of sale", "Warehouse & inventory", "Asset labelling", "Shipping & logistics"]
    },
    grpGS1: {
      label: "GS1 DataBar",
      lede: "part of the GS1 DataBar family, a compact retail symbology that carries a GTIN plus optional GS1 Application Identifiers such as batch, expiry and weight.",
      uses: ["Fresh food & produce", "Coupons & loyalty", "Small retail items", "Regulated & variable-measure goods"]
    },
    grpPostal: {
      label: "Postal Code",
      lede: "a postal routing symbology, printed as height-modulated bars that automated mail-sorting equipment reads to route letters and parcels.",
      uses: ["Mail sorting & routing", "Parcel & courier labels", "Bulk mailings", "Address encoding"]
    },
    grpEan: {
      label: "Retail (EAN / UPC)",
      lede: "a retail point-of-sale symbology used on consumer products worldwide, encoding a globally unique product number that scans at any checkout.",
      uses: ["Retail checkout", "Product catalogues", "Inventory management", "Global trade items"]
    }
  },

  // Rich, hand-written copy for high-value types (real search demand).
  overrides: {
    qrcode: {
      about: "The QR Code is the world's most widely used 2D barcode. It encodes URLs, text, contact details, Wi-Fi credentials and more, and is readable instantly by any smartphone camera. Four error-correction levels let a QR Code stay scannable even when partly damaged or covered by a logo.",
      uses: ["Website & app links", "Restaurant & retail menus", "Wi-Fi and contact sharing", "Payments & tickets"]
    },
    datamatrix: {
      about: "Data Matrix is a high-density 2D code that stays readable at very small sizes, which makes it the standard for marking tiny electronic components, surgical instruments and pharmaceuticals. Strong Reed–Solomon error correction keeps it reliable even when part of the symbol is damaged.",
      uses: ["Electronics & component marking", "Medical devices & instruments", "Aerospace & automotive parts", "Direct part marking (DPM)"]
    },
    gs1datamatrix: {
      about: "GS1 Data Matrix is a Data Matrix carrying GS1 Application Identifiers — GTIN, batch/lot, expiry date and serial number — used for regulated product traceability. It is the required carrier for pharmaceutical serialisation schemes such as the EU FMD and US DSCSA.",
      uses: ["Pharmaceutical serialisation", "Medical device UDI", "Healthcare traceability", "Regulated supply chains"]
    },
    pdf417: {
      about: "PDF417 is a stacked linear 2D barcode that holds large amounts of data — hundreds of bytes — in a rectangular symbol. It is used on driver's licences, boarding passes and shipping labels where a lot of information must travel with the item.",
      uses: ["ID cards & driver's licences", "Airline boarding passes", "Shipping & postage labels", "Government documents"]
    },
    azteccode: {
      about: "Aztec Code is a compact 2D barcode that needs no surrounding quiet zone, so it packs into tight spaces. Its bullseye finder pattern makes it robust to read off screens, which is why it dominates rail and event ticketing.",
      uses: ["Train & transit tickets", "Event & boarding passes", "On-screen mobile tickets", "Compact labels"]
    },
    microqr: {
      about: "Micro QR is a smaller version of the QR Code with a single finder pattern instead of three, designed for very short data where space is scarce. It fits where a full QR Code would be too large, such as small electronic parts.",
      uses: ["Small electronic components", "Compact product marking", "Space-constrained labels", "Short IDs"]
    },
    maxicode: {
      about: "MaxiCode is a fixed-size 2D symbol built around a central bullseye, created by UPS for high-speed package sorting. Its structured message format carries destination and routing data that automated conveyors read at speed.",
      uses: ["Parcel sorting & routing", "Courier & logistics labels", "High-speed conveyors"]
    },
    CODE128: {
      about: "Code 128 is a compact, high-density linear barcode that encodes the full ASCII character set, making it a go-to choice for shipping, packaging and general-purpose labelling. It automatically switches between character sets to keep the symbol as short as possible.",
      uses: ["Shipping & packaging", "Warehouse & logistics", "Asset & inventory labels", "General-purpose IDs"]
    },
    CODE39: {
      about: "Code 39 is one of the oldest and most widely supported linear barcodes, encoding uppercase letters, digits and a handful of symbols. Its simplicity and universal scanner support keep it common in industrial, military and government use.",
      uses: ["Industrial & manufacturing", "Government & defence (MIL-STD)", "Inventory & asset tags", "Name badges"]
    },
    code93: {
      about: "Code 93 is a compact alphanumeric barcode designed as a denser, more secure successor to Code 39, adding two check characters for reliability. It packs the same data into a smaller symbol.",
      uses: ["Logistics & retail", "Automotive labelling", "Compact alphanumeric IDs"]
    },
    ITF: {
      about: "Interleaved 2 of 5 (ITF) is a numeric-only linear barcode that encodes digit pairs, giving it high density for numbers. It tolerates printing on corrugated cardboard, which makes it popular for shipping cartons.",
      uses: ["Shipping cartons & cases", "Warehouse packaging", "Numeric product codes"]
    },
    ITF14: {
      about: "ITF-14 encodes the 14-digit GTIN used to mark cartons and cases of retail goods. Printed with a heavy bearer bar, it is robust enough for direct printing on corrugated shipping boxes.",
      uses: ["Cartons & shipping cases", "Wholesale & distribution", "GTIN-14 case coding"]
    },
    codabar: {
      about: "Codabar is a self-checking linear barcode that encodes digits and a few symbols, long favoured where labels are produced without a computer. It remains common in libraries, blood banks and logistics.",
      uses: ["Libraries", "Blood banks & healthcare", "Photo labs & logistics"]
    },
    MSI: {
      about: "MSI Plessey is a numeric linear barcode used mainly for inventory control and marking storage-shelf locations in warehouses and retail. Optional check digits improve read reliability.",
      uses: ["Warehouse shelf marking", "Inventory control", "Numeric location codes"]
    },
    EAN13: {
      about: "EAN-13 is the 13-digit retail barcode found on consumer products across the world outside North America. It encodes a GTIN-13 that identifies the product globally and scans at any checkout. The final digit is a calculated check digit.",
      uses: ["Retail checkout worldwide", "Consumer product packaging", "Global trade item numbers", "Inventory & catalogues"]
    },
    EAN8: {
      about: "EAN-8 is the short, 8-digit version of EAN-13, used on small products where a full EAN-13 will not fit — think confectionery, cosmetics and small cans. It encodes a GTIN-8 that scans at retail checkouts.",
      uses: ["Small retail packaging", "Confectionery & cosmetics", "Compact product labels"]
    },
    UPC: {
      about: "UPC-A is the 12-digit retail barcode used across the United States and Canada, encoding a GTIN-12 that identifies a product at point of sale. It is the North American counterpart to EAN-13.",
      uses: ["Retail checkout (US & Canada)", "Consumer packaged goods", "Inventory & catalogues"]
    },
    UPCE: {
      about: "UPC-E is a compressed, six-digit form of UPC-A that suppresses zeros to fit on small packages such as cans, tubes and travel-size items. Scanners expand it back to the full 12-digit code.",
      uses: ["Small retail packaging", "Cans, tubes & cosmetics", "Space-constrained products"]
    },
    "gs1-128": {
      about: "GS1-128 is a Code 128 barcode that carries GS1 Application Identifiers — data such as batch number, expiry date, weight and serial number — in a standardised structure. It is the workhorse of shipping, logistics and the supply chain.",
      uses: ["Logistics & shipping units", "Batch & expiry tracking", "Supply-chain traceability", "SSCC pallet labels"]
    },
    databaromni: {
      about: "GS1 DataBar Omnidirectional encodes a 14-digit GTIN in a compact symbol that scans from any angle, designed for small or hard-to-mark retail items such as fresh produce and loose goods.",
      uses: ["Fresh produce & loose goods", "Small retail items", "Coupons", "Point of sale"]
    },
    databarexpanded: {
      about: "GS1 DataBar Expanded encodes a GTIN together with additional GS1 Application Identifiers such as weight, price and expiry, making it ideal for variable-measure and perishable retail goods.",
      uses: ["Variable-weight goods", "Perishables & deli", "Coupons & promotions", "Regulated retail items"]
    },
    isbn: {
      about: "The ISBN barcode encodes a book's International Standard Book Number as an EAN-13, letting retailers and libraries scan and track titles at point of sale. An optional add-on can carry price or currency information.",
      uses: ["Book retail & distribution", "Libraries & catalogues", "Publishing supply chain"]
    },
    issn: {
      about: "The ISSN barcode encodes the International Standard Serial Number of a magazine or journal as an EAN-13, with an optional two-digit add-on for the issue number. It identifies periodicals at retail.",
      uses: ["Magazine & journal retail", "Periodical distribution", "Newsstand inventory"]
    },
    pzn: {
      about: "PZN (Pharmazentralnummer) is the German pharmaceutical article number, printed as a Code 39 variant to identify medicines and pharmacy products in the German-speaking market.",
      uses: ["German pharmacy products", "Medicine identification", "Healthcare reimbursement"]
    },
    pharmacode: {
      about: "Pharmacode (Laetus code) is a robust binary barcode used for packaging control in the pharmaceutical industry. It is designed to be read reliably at high speed on the production line, even printed in colour.",
      uses: ["Pharmaceutical packaging control", "Production-line verification", "Carton & insert coding"]
    },
    gs1qrcode: {
      about: "GS1 QR Code is a QR Code that carries GS1 Application Identifiers, enabling one scan to serve both consumers (a web link) and the supply chain (GTIN, batch, expiry). It underpins GS1 Digital Link on-pack.",
      uses: ["Connected packaging", "GS1 Digital Link", "Consumer engagement + traceability"]
    }
  }
};
