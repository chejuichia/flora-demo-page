import { useState, useRef, useCallback, useEffect } from "react";

// ─── Demo SKU Catalog Database ──────────────────────────────────────────────
// This simulates a real product catalog / ERP system that extracted items get matched against

const DEMO_CATALOG = [
  // Sauces & Condiments
  { sku: "FF-SAU-MARN-500", name: "Classic Marinara Sauce 500ml", category: "Sauces", price: 3.85, uom: "JAR", stock: 2400 },
  { sku: "FF-SAU-PEST-250", name: "Basil Pesto 250ml", category: "Sauces", price: 5.20, uom: "JAR", stock: 680 },
  { sku: "FF-SAU-ALFR-500", name: "Alfredo Cream Sauce 500ml", category: "Sauces", price: 4.40, uom: "JAR", stock: 1100 },
  { sku: "FF-SAU-BBQ-750", name: "Smoky BBQ Sauce 750ml", category: "Sauces", price: 4.90, uom: "BTL", stock: 920 },
  { sku: "FF-SAU-HOT-150", name: "Habanero Hot Sauce 150ml", category: "Sauces", price: 3.60, uom: "BTL", stock: 1540 },
  { sku: "FF-CON-MAYO-500", name: "Classic Mayonnaise 500ml", category: "Condiments", price: 3.20, uom: "JAR", stock: 1850 },
  { sku: "FF-CON-MUST-350", name: "Whole Grain Mustard 350ml", category: "Condiments", price: 3.75, uom: "JAR", stock: 760 },
  { sku: "FF-CON-KETCH-750", name: "Tomato Ketchup 750ml", category: "Condiments", price: 2.90, uom: "BTL", stock: 3200 },
  // Prepared Foods
  { sku: "FF-PRE-SOUP-TOM", name: "Roasted Tomato Soup 1L", category: "Soups", price: 4.50, uom: "CTN", stock: 640 },
  { sku: "FF-PRE-SOUP-BRC", name: "Broccoli Cheddar Soup 1L", category: "Soups", price: 5.10, uom: "CTN", stock: 380 },
  { sku: "FF-PRE-SOUP-CHK", name: "Chicken Noodle Soup 1L", category: "Soups", price: 4.80, uom: "CTN", stock: 520 },
  { sku: "FF-PRE-SOUP-MSH", name: "Wild Mushroom Soup 1L", category: "Soups", price: 5.40, uom: "CTN", stock: 290 },
  { sku: "FF-PRE-HUM-CLS", name: "Classic Hummus 300g", category: "Dips", price: 3.40, uom: "TUB", stock: 1200 },
  { sku: "FF-PRE-HUM-RST", name: "Roasted Red Pepper Hummus 300g", category: "Dips", price: 3.60, uom: "TUB", stock: 860 },
  { sku: "FF-PRE-HUM-GRL", name: "Garlic Herb Hummus 300g", category: "Dips", price: 3.60, uom: "TUB", stock: 0 },
  // Dressings & Vinaigrettes
  { sku: "FF-DRS-RANCH-500", name: "Buttermilk Ranch Dressing 500ml", category: "Dressings", price: 4.20, uom: "BTL", stock: 1400 },
  { sku: "FF-DRS-BALV-350", name: "Balsamic Vinaigrette 350ml", category: "Dressings", price: 4.80, uom: "BTL", stock: 980 },
  { sku: "FF-DRS-CAES-500", name: "Caesar Dressing 500ml", category: "Dressings", price: 4.50, uom: "BTL", stock: 1100 },
  { sku: "FF-DRS-ITAL-500", name: "Italian Herb Dressing 500ml", category: "Dressings", price: 3.90, uom: "BTL", stock: 740 },
  // Frozen
  { sku: "FF-FRZ-BURG-4PK", name: "Angus Beef Burger Patties 4-pack", category: "Frozen", price: 8.90, uom: "PK", stock: 560 },
  { sku: "FF-FRZ-CHKT-1KG", name: "Crispy Chicken Tenders 1kg", category: "Frozen", price: 9.40, uom: "BAG", stock: 420 },
  { sku: "FF-FRZ-PIZZ-MRG", name: "Margherita Pizza 12-inch", category: "Frozen", price: 7.80, uom: "EA", stock: 340 },
  { sku: "FF-FRZ-PIZZ-PEP", name: "Pepperoni Pizza 12-inch", category: "Frozen", price: 8.20, uom: "EA", stock: 480 },
  { sku: "FF-FRZ-FRIE-2KG", name: "Straight Cut Fries 2kg", category: "Frozen", price: 5.60, uom: "BAG", stock: 890 },
  { sku: "FF-FRZ-SPRL-1KG", name: "Spring Rolls Vegetable 1kg (20pc)", category: "Frozen", price: 7.20, uom: "BOX", stock: 310 },
  // Bakery
  { sku: "FF-BAK-BRWH-800", name: "Artisan White Bread 800g", category: "Bakery", price: 3.40, uom: "LOAF", stock: 600 },
  { sku: "FF-BAK-BRWW-800", name: "Whole Wheat Bread 800g", category: "Bakery", price: 3.80, uom: "LOAF", stock: 520 },
  { sku: "FF-BAK-BUNS-6PK", name: "Brioche Burger Buns 6-pack", category: "Bakery", price: 4.20, uom: "PK", stock: 680 },
  { sku: "FF-BAK-TORT-12", name: "Flour Tortillas 12-inch (12ct)", category: "Bakery", price: 3.90, uom: "PK", stock: 940 },
  { sku: "FF-BAK-CROS-6PK", name: "Butter Croissants 6-pack", category: "Bakery", price: 5.80, uom: "PK", stock: 220 },
  // Snacks
  { sku: "FF-SNK-CHIP-SEA", name: "Sea Salt Kettle Chips 200g", category: "Snacks", price: 3.20, uom: "BAG", stock: 1800 },
  { sku: "FF-SNK-CHIP-BBQ", name: "BBQ Kettle Chips 200g", category: "Snacks", price: 3.20, uom: "BAG", stock: 1600 },
  { sku: "FF-SNK-GRAN-MIX", name: "Trail Mix Granola Bar 6-pack", category: "Snacks", price: 4.50, uom: "BOX", stock: 720 },
  { sku: "FF-SNK-PRET-SAL", name: "Salted Pretzel Twists 300g", category: "Snacks", price: 2.80, uom: "BAG", stock: 1100 },
  // Beverages
  { sku: "FF-BEV-LEMO-1L", name: "Fresh Squeezed Lemonade 1L", category: "Beverages", price: 3.60, uom: "BTL", stock: 450 },
  { sku: "FF-BEV-ICET-1L", name: "Peach Iced Tea 1L", category: "Beverages", price: 3.40, uom: "BTL", stock: 580 },
  { sku: "FF-BEV-SMTH-MNG", name: "Mango Smoothie 500ml", category: "Beverages", price: 4.20, uom: "BTL", stock: 320 },
  { sku: "FF-BEV-SMTH-BRY", name: "Mixed Berry Smoothie 500ml", category: "Beverages", price: 4.20, uom: "BTL", stock: 0 },
];

function matchSkuToCatalog(extractedItem) {
  const desc = (extractedItem.description || "").toLowerCase();
  const sku = (extractedItem.sku || "").toLowerCase();
  const notes = (extractedItem.notes || "").toLowerCase();
  const combined = `${desc} ${sku} ${notes}`;

  let bestMatch = null;
  let bestScore = 0;
  let matchType = "none";

  for (const product of DEMO_CATALOG) {
    let score = 0;
    let type = "fuzzy";

    // Exact SKU match
    if (sku && product.sku.toLowerCase() === sku) {
      score = 100;
      type = "exact";
    }
    // Partial SKU match
    else if (sku && product.sku.toLowerCase().includes(sku.replace(/[^a-z0-9]/g, ""))) {
      score = 85;
      type = "sku_partial";
    }
    // SKU mentioned in description
    else if (combined.includes(product.sku.toLowerCase())) {
      score = 90;
      type = "exact";
    }
    // Keyword matching
    else {
      const productWords = product.name.toLowerCase().split(/[\s\-\/]+/).filter(w => w.length > 2);
      const matchedWords = productWords.filter(w => combined.includes(w));
      const ratio = matchedWords.length / productWords.length;
      score = Math.round(ratio * 75);
      if (score > 40) type = "fuzzy";
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
      matchType = type;
    }
  }

  if (bestScore < 25) return null;

  return {
    catalogItem: bestMatch,
    score: bestScore,
    matchType,
    confidence: bestScore >= 85 ? "high" : bestScore >= 55 ? "medium" : "low",
  };
}


// ─── Sample Orders ──────────────────────────────────────────────────────────

const SAMPLE_ORDERS = [
  {
    id: "fax", label: "Blurry Fax PO", icon: "📠",
    description: "Handwritten PO with smudged quantities and corrections",
    content: `PURCHASE ORDER — FAX TRANSMISSION\nFrom: Rosie's Diner\nTo: FreshFoods Manufacturing - Orders Dept\nDate: 11/14/2025\nPO#: RD-2025-0847\n\nPlease ship the following to our restaurant at 318 Magnolia Ave, Savannah GA 31401:\n\n  40 jars   Classic Marinara Sauce 500ml     (your part# FF-SAU-MARN-500)\n  24 btl    Balsamic Vinaigrette 350ml       (or your house brand equivalent)\n  60 tubs   Classic Hummus 300g              (I think your SKU is FF-PRE-HUM-CLS??)\n  12 boxes  Straight Cut Fries 2kg           (we usually order the 2kg bags)\n  ???       That mushroom soup we got last time - Carlos at the kitchen knows which one\n\nRUSH — need by 11/22 if possible. Call me at 912-555-0173 if any questions.\n\nSignature: R. Gutierrez\n(handwritten note at bottom: "Actually make the marinara 60 jars not 40 — sorry!")`,
  },
  {
    id: "email", label: "Buried Email Chain", icon: "✉️",
    description: "Order hidden in a 3-reply email thread",
    content: `---------- Forwarded message ----------\nFrom: Jennifer Walsh <j.walsh@harborgrille.com>\nTo: orders@freshfoods.com\nDate: Mon, Oct 28, 2025 at 3:42 PM\nSubject: Re: Re: Re: Next month's order + that other thing\n\nHi FreshFoods team,\n\nSorry for the late reply — was out with flu last week.\n\nRe: the invoice dispute on order #HG-9921, I'll loop in our accounts payable, please disregard my earlier email about that.\n\nANYWAY the actual reason I'm writing — here's what we need for the December restock:\n\n- Roasted Tomato Soup 1L x 80 cartons\n- Chicken Noodle Soup 1L x 60 (NOT the broccoli cheddar you sent last time, the CHICKEN NOODLE, product code should be FF-PRE-SOUP-CHK)\n- Caesar Dressing 500ml x 48\n- Brioche Burger Buns 6-pack x 100\n- Garlic Herb Hummus 300g — actually skip this one for now, I need to check with the kitchen first\n- Pepperoni Pizza 12-inch x 72 (if you have the pepperoni back in stock, otherwise the margherita is fine)\n\nDelivery to: Harbor Grille, 45 Wharf Street, Portland ME 04101\n\nNeed this by Dec 5th at the latest — we're prepping for holiday catering season.\n\nCan you also send me the updated price list when you get a chance? No rush on that.\n\nCheers,\nJen\n\nP.S. The tomato soup — actually make that 100 cartons, we're running lower than I thought.`,
  },
  {
    id: "pdf", label: "Formal PDF PO", icon: "📑",
    description: "Structured PO with pricing table and totals",
    content: `═══════════════════════════════════════════════════════════════\n                        PURCHASE ORDER\n═══════════════════════════════════════════════════════════════\n PO Number:    MBG-2025-00342        Date:       2025-11-01\n Vendor:       FreshFoods Mfg        Payment:    Net 30\n═══════════════════════════════════════════════════════════════\n\n BILL TO:                          SHIP TO:\n Maple & Birch Grocery             Maple & Birch Grocery\n 200 Commonwealth Ave              Distribution Center\n Suite 12                          88 Industrial Pkwy\n Boston, MA 02116                  Woburn, MA 01801\n \n Contact: David Chen               Contact: Maria Lopez\n Tel: 617-555-0291                 Tel: 781-555-0184\n\n═══════════════════════════════════════════════════════════════\n LINE | QTY  | UOM  | ITEM / DESCRIPTION              | UNIT $   | EXT $\n═══════════════════════════════════════════════════════════════\n  1   | 200  | JAR  | Classic Marinara Sauce 500ml     | $3.85    | $770.00\n      |      |      | SKU: FF-SAU-MARN-500              |          |\n  2   | 120  | JAR  | Basil Pesto 250ml               | $5.20    | $624.00\n      |      |      | SKU: FF-SAU-PEST-250              |          |\n  3   | 300  | BTL  | Tomato Ketchup 750ml             | $2.90    | $870.00\n      |      |      | SKU: FF-CON-KETCH-750             |          |\n  4   | 150  | BTL  | Buttermilk Ranch Dressing 500ml  | $4.20    | $630.00\n      |      |      | SKU: FF-DRS-RANCH-500             |          |\n  5   | 80   | PK   | Angus Beef Burger Patties 4-pack | $8.90    | $712.00\n      |      |      | SKU: FF-FRZ-BURG-4PK              |          |\n═══════════════════════════════════════════════════════════════\n                                     SUBTOTAL:    $3,606.00\n                                     TAX (6.25%): $225.38\n                                     FREIGHT:     $185.00\n                                     TOTAL:       $4,016.38\n═══════════════════════════════════════════════════════════════\n\n NOTES:\n - Line 1: Please confirm new label design is on these jars.\n - Partial shipments acceptable. Priority on lines 1, 3, and 5.\n - All items must ship by Nov 15, 2025.\n\n Authorized by: David Chen, Procurement Manager`,
  },
  {
    id: "excel", label: "Messy Spreadsheet", icon: "📊",
    description: "Headerless Excel with notes in random cells",
    content: `[Exported from customer's Excel — no column headers, merged cells, notes in random cells]\n\nSunnyside Market - Monthly Reorder — Nov 2025\nContact: Sarah Pham, purchasing@sunnysidemarket.com\n\nsea salt kettle chips 200g,,,,48 bags\nBBQ kettle chips 200g,,,,36 bags\n,,, (this row intentionally blank - ignore)\nroasted red pepper hummus 300g,,,,60 tubs,, "CHECK: is this the new recipe?"\nclassic hummus 300g,,,,80 tubs\nwhole grain mustard 350ml,,,,24 jars\n,,,NOTE: last order of mustard had 3 broken jars - please double check packaging\nbutter croissants 6-pack,,,,40 packs\nflour tortillas 12-inch 12ct,,,,30 packs\n,,,\nmango smoothie 500ml,,,,120 bottles\nmixed berry smoothie 500ml,,,,120 bottles  \ngarlic herb hummus 300g,,,,60 tubs,,  "OUT OF STOCK LAST TIME — please confirm availability"\n\nShip to: Sunnyside Market, 72 Harvest Lane, Portland OR 97205\nPreferred delivery: Nov 18-20\nPO ref: SSM-11-2025-003`,
  },
  {
    id: "chat", label: "Chat Message", icon: "💬",
    description: "Casual text/WhatsApp style order",
    content: `Hey! It's Mike from The Corner Kitchen. Need to place an order with FreshFoods for this week:\n\nThe usual sauces - 20 jars of the marinara and 10 of the pesto\nAlso 30 bottles of ranch dressing and 15 of the Italian herb\nCan we get like 24 or maybe 30 packs of the burger patties? Whatever you have in stock\nOh and we're almost out of the chicken tenders - the 1kg bags. Need about 40 bags\n\nActually wait - make the marinara 25 jars not 20\n\nSame delivery address. Can you get it here by Thursday morning before we open? We open at 6am so anytime before that works\n\nPayment on account as usual\n\nThanks!!`,
  },
];

const EXTRACTION_PROMPT = `You are an order extraction AI. Given the raw order text below, extract all structured data into JSON format.

CRITICAL EXTRACTION RULES:
- Extract data EXACTLY as stated in the source. Do NOT infer, assume, or add information that isn't explicitly written.
- For dates: extract the EXACT text used. If the source says "Dec 5th" extract "Dec 5th" — do NOT add a year. If it says "Thursday morning" extract "Thursday morning". If it says "Nov 18-20" extract "Nov 18-20". Never fabricate precision that isn't in the source.
- For quantities: if the customer said "like 24 or maybe 30" or "about 40", extract the quantity but note the ambiguity. Extract the FINAL quantities if corrected.
- For addresses: if they say "same delivery address" or "same as last time", extract that exact phrase — do NOT invent an address.
- Skip items that were explicitly cancelled or put on hold
- Flag any ambiguities or items that need clarification
- If pricing is present, include it. If not, omit price fields.

Additionally, generate a "validation_items" array for any extracted field that is incomplete, ambiguous, or would need human confirmation before submitting to an ERP system. Common cases include:
- Dates without a year (e.g. "Dec 5th" — which year?)
- Vague delivery timing (e.g. "Thursday morning", "ASAP", "by end of week")
- Approximate quantities (e.g. "about 40", "15 or maybe 20")
- Relative references (e.g. "same address as last time", "the usual")
- Missing required fields (e.g. no PO number, no delivery address)
- Ambiguous product references (e.g. "the blue ones", "same one we got last time")

Respond with ONLY valid JSON in this exact structure, no markdown fences:
{
  "customer": {
    "name": "string",
    "contact_person": "string or null",
    "email": "string or null",
    "phone": "string or null"
  },
  "po_reference": "string or null",
  "delivery": {
    "address": "string or null",
    "requested_date": "string or null",
    "notes": "string or null"
  },
  "line_items": [
    {
      "line": 1,
      "description": "string",
      "sku": "string or null",
      "quantity": number,
      "uom": "string",
      "unit_price": number or null,
      "ext_price": number or null,
      "notes": "string or null",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "flags": [
    {
      "type": "ambiguity" | "correction" | "out_of_stock_risk" | "anomaly" | "skipped_item",
      "message": "string"
    }
  ],
  "validation_items": [
    {
      "field": "string (e.g. 'delivery.requested_date', 'line_items[2].quantity', 'delivery.address')",
      "extracted_value": "string — the exact text extracted from the source",
      "issue": "incomplete_date" | "vague_timing" | "approximate_quantity" | "relative_reference" | "missing_field" | "ambiguous_product",
      "message": "string — human-readable explanation of what needs confirming",
      "suggested_action": "string — what the system would prompt the user to do"
    }
  ],
  "totals": {
    "subtotal": number or null,
    "tax": number or null,
    "freight": number or null,
    "total": number or null
  }
}

ORDER TEXT:
`;

// ─── Styles (CSS-in-JS tokens) ─────────────────────────────────────────────

const T = {
  bg: "#FAFAF9",
  surface: "#FFFFFF",
  surfaceHover: "#F5F5F4",
  border: "#E7E5E4",
  borderLight: "#F5F5F4",
  text: "#1C1917",
  textSecondary: "#57534E",
  textTertiary: "#A8A29E",
  accent: "#2563EB",
  accentLight: "#EFF6FF",
  accentDark: "#1D4ED8",
  green: "#059669",
  greenLight: "#ECFDF5",
  greenBorder: "#A7F3D0",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  amberBorder: "#FDE68A",
  red: "#DC2626",
  redLight: "#FEF2F2",
  redBorder: "#FECACA",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
  radius: 10,
  radiusSm: 6,
  radiusLg: 14,
  font: "'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
};

// ─── Subcomponents ──────────────────────────────────────────────────────────

function ConfidencePill({ level }) {
  const map = {
    high: { bg: T.greenLight, color: T.green, border: T.greenBorder, label: "High" },
    medium: { bg: T.amberLight, color: T.amber, border: T.amberBorder, label: "Medium" },
    low: { bg: T.redLight, color: T.red, border: T.redBorder, label: "Low" },
  };
  const s = map[level] || map.medium;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontFamily: T.fontMono, letterSpacing: "0.3px" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

function MatchBadge({ type }) {
  const map = {
    exact: { bg: T.greenLight, color: T.green, border: T.greenBorder, icon: "✓", label: "Exact Match" },
    sku_partial: { bg: T.accentLight, color: T.accent, border: "#BFDBFE", icon: "≈", label: "SKU Match" },
    fuzzy: { bg: T.amberLight, color: T.amber, border: T.amberBorder, icon: "~", label: "Fuzzy Match" },
    none: { bg: T.redLight, color: T.red, border: T.redBorder, icon: "?", label: "No Match" },
  };
  const s = map[type] || map.none;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontFamily: T.fontMono }}>
      <span style={{ fontSize: 12, fontWeight: 800 }}>{s.icon}</span>
      {s.label}
    </span>
  );
}

function FlagRow({ flag, onMouseEnter, onMouseLeave }) {
  const icons = { ambiguity: "⚠️", correction: "✏️", out_of_stock_risk: "📦", anomaly: "🔍", skipped_item: "⏭️" };
  return (
    <div
      className="flora-hover-row"
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", borderRadius: T.radiusSm, background: T.amberLight, border: `1px solid ${T.amberBorder}`, cursor: "default", transition: "box-shadow 0.15s ease" }}
    >
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icons[flag.type] || "⚠️"}</span>
      <div>
        <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.5px" }}>{flag.type.replace(/_/g, " ")}</span>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2, lineHeight: 1.5 }}>{flag.message}</div>
      </div>
    </div>
  );
}

function InfoTile({ label, value, sub, icon, validationWarning, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className="flora-hover-tile"
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${validationWarning ? "#FDBA74" : T.border}`, padding: "16px 18px", position: "relative", cursor: onMouseEnter ? "default" : undefined, transition: "box-shadow 0.15s ease" }}
    >
      {validationWarning && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "10px 10px 0 0", background: "linear-gradient(90deg, #F97316, #EA580C)" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
        <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 600, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
        {validationWarning && <span style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "#FFF7ED", color: "#EA580C", border: "1px solid #FDBA74" }}>NEEDS CONFIRM</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{value || "—"}</div>
      {sub && <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 3 }}>{sub}</div>}
      {validationWarning && <div style={{ fontSize: 11, color: "#EA580C", marginTop: 5, lineHeight: 1.4 }}>{validationWarning}</div>}
    </div>
  );
}

function StepCard({ number, title, description, status, badge, children }) {
  const statusColors = {
    complete: { bg: T.greenLight, color: T.green, border: T.greenBorder, icon: "✓" },
    active: { bg: T.accentLight, color: T.accent, border: "#BFDBFE", icon: "→" },
    locked: { bg: "#F5F5F4", color: T.textTertiary, border: T.border, icon: "🔒" },
    premium: { bg: "#FFF7ED", color: "#EA580C", border: "#FDBA74", icon: "★" },
  };
  const s = statusColors[status];
  const isPremium = status === "premium";
  return (
    <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${isPremium ? "#FDBA74" : status === "active" ? T.accent : T.border}`, overflow: "hidden", boxShadow: isPremium ? "0 0 0 1px #FDBA7430, 0 4px 16px #EA580C08" : status === "active" ? `0 0 0 1px ${T.accent}20` : "none" }}>
      {isPremium && <div style={{ height: 2, background: "linear-gradient(90deg, #F97316, #EA580C, #F97316)" }} />}
      <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, borderBottom: children ? `1px solid ${T.borderLight}` : "none" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: s.color, flexShrink: 0 }}>
          {s.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.5px" }}>STEP {number}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{title}</span>
            {badge && (
              <span style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "linear-gradient(135deg, #F97316, #EA580C)", color: "#fff", letterSpacing: "0.8px", textTransform: "uppercase" }}>{badge}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>{description}</div>
        </div>
      </div>
      {children && <div style={{ padding: "16px 22px" }}>{children}</div>}
    </div>
  );
}

function ValidationPanel({ items, onHighlight }) {
  if (!items || items.length === 0) return null;
  const hl = (terms) => onHighlight?.(terms);
  const clearHl = () => onHighlight?.([]);

  const issueIcons = {
    incomplete_date: "📅",
    vague_timing: "🕐",
    approximate_quantity: "🔢",
    relative_reference: "🔗",
    missing_field: "⭕",
    ambiguous_product: "❓",
  };

  const issueLabels = {
    incomplete_date: "Incomplete Date",
    vague_timing: "Vague Timing",
    approximate_quantity: "Approximate Qty",
    relative_reference: "Relative Reference",
    missing_field: "Missing Field",
    ambiguous_product: "Ambiguous Product",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Explanation banner */}
      <div style={{ padding: "12px 16px", borderRadius: T.radiusSm, background: "#FFF7ED", border: "1px solid #FDBA74", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🎯</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#9A3412", marginBottom: 3 }}>Literal extraction — nothing assumed</div>
          <div style={{ fontSize: 12, color: "#C2410C", lineHeight: 1.55 }}>
            Flora extracts data exactly as written in the source. When a field is incomplete or ambiguous, it flags it for confirmation rather than guessing. This prevents errors that silently propagate into your ERP.
          </div>
        </div>
      </div>

      {/* Validation items */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${T.border}` }}>
            {["Issue", "Extracted Value", "Problem", "Action Required"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}
              className="flora-hover-row"
              onMouseEnter={() => hl([item.extracted_value].filter(Boolean))}
              onMouseLeave={clearHl}
              style={{ borderBottom: `1px solid ${T.borderLight}`, cursor: "default", transition: "background 0.1s ease" }}
            >
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>{issueIcons[item.issue] || "⚠️"}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 600, color: "#EA580C" }}>{issueLabels[item.issue] || item.issue}</span>
                </div>
              </td>
              <td style={{ padding: "10px 12px" }}>
                <code style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.text, background: "#FFF7ED", padding: "2px 8px", borderRadius: 4, border: "1px solid #FDBA74" }}>{item.extracted_value}</code>
              </td>
              <td style={{ padding: "10px 12px", fontSize: 12, color: T.textSecondary, lineHeight: 1.5, maxWidth: 220 }}>{item.message}</td>
              <td style={{ padding: "10px 12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: T.radiusSm, background: T.accentLight, border: "1px solid #BFDBFE", fontSize: 11, fontWeight: 600, color: T.accent, cursor: "default" }}>
                  {item.suggested_action}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "60px 20px" }}>
      <div style={{ position: "relative", width: 48, height: 48 }}>
        <div style={{ position: "absolute", inset: 0, border: `3px solid ${T.borderLight}`, borderTopColor: T.accent, borderRadius: "50%", animation: "ofspin 0.8s linear infinite" }} />
        <div style={{ position: "absolute", inset: 8, border: `2px solid ${T.borderLight}`, borderBottomColor: T.accentDark, borderRadius: "50%", animation: "ofspin 1.2s linear infinite reverse" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.accent, letterSpacing: "0.5px", marginBottom: 4 }}>EXTRACTING ORDER DATA</div>
        <div style={{ fontSize: 13, color: T.textTertiary }}>Analyzing structure, identifying line items, resolving ambiguities…</div>
      </div>
    </div>
  );
}


// ─── Highlighted Raw Input ───────────────────────────────────────────────

function HighlightedRawInput({ text, terms, scrollRef }) {
  const firstHighlightRef = useRef(null);
  const hasScrolled = useRef(false);

  // Auto-scroll to first highlight when terms change
  useEffect(() => {
    hasScrolled.current = false;
  }, [terms.join(",")]);

  useEffect(() => {
    if (terms.length > 0 && firstHighlightRef.current && scrollRef?.current && !hasScrolled.current) {
      hasScrolled.current = true;
      const container = scrollRef.current;
      const el = firstHighlightRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop - containerRect.height / 3;
      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    }
  });

  if (!terms || terms.length === 0) {
    return (
      <pre style={{
        padding: 18, fontFamily: T.fontMono, fontSize: 12, lineHeight: 1.7,
        color: T.textSecondary, whiteSpace: "pre-wrap", wordBreak: "break-word",
        margin: 0, background: "transparent",
      }}>{text}</pre>
    );
  }

  // Build case-insensitive regex from terms, escaping special chars
  const escaped = terms
    .filter(t => t && t.length > 2)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length); // longest first to avoid partial matches

  if (escaped.length === 0) {
    return (
      <pre style={{
        padding: 18, fontFamily: T.fontMono, fontSize: 12, lineHeight: 1.7,
        color: T.textSecondary, whiteSpace: "pre-wrap", wordBreak: "break-word",
        margin: 0, background: "transparent",
      }}>{text}</pre>
    );
  }

  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const matchRegex = new RegExp(`^(${escaped.join("|")})$`, "i"); // for testing individual parts
  const parts = text.split(regex);
  let highlightIndex = 0;

  return (
    <pre style={{
      padding: 18, fontFamily: T.fontMono, fontSize: 12, lineHeight: 1.7,
      color: T.textSecondary, whiteSpace: "pre-wrap", wordBreak: "break-word",
      margin: 0, background: "transparent", transition: "color 0.15s ease",
    }}>
      {parts.map((part, i) => {
        const isMatch = part.length > 0 && matchRegex.test(part);
        if (isMatch) {
          const isFirst = highlightIndex === 0;
          highlightIndex++;
          return (
            <mark
              key={i}
              ref={isFirst ? firstHighlightRef : undefined}
              style={{
                background: "#DBEAFE",
                color: T.accent,
                fontWeight: 600,
                borderRadius: 3,
                padding: "1px 2px",
                boxShadow: "0 0 0 1px #93C5FD",
                transition: "all 0.2s ease",
              }}
            >{part}</mark>
          );
        }
        return <span key={i} style={{ opacity: terms.length > 0 ? 0.45 : 1, transition: "opacity 0.2s ease" }}>{part}</span>;
      })}
    </pre>
  );
}


// ─── Results View ───────────────────────────────────────────────────────────

function ResultsView({ data, onHighlight }) {
  if (!data) return null;
  const { customer, po_reference, delivery, line_items, flags, totals, validation_items } = data;
  const hl = (terms) => onHighlight?.(terms);
  const clearHl = () => onHighlight?.([]);

  // Run SKU matching against demo catalog
  const matchedItems = (line_items || []).map(item => ({
    ...item,
    match: matchSkuToCatalog(item),
  }));

  const matchStats = {
    exact: matchedItems.filter(i => i.match?.matchType === "exact").length,
    fuzzy: matchedItems.filter(i => i.match && i.match.matchType !== "exact").length,
    unmatched: matchedItems.filter(i => !i.match).length,
    stockWarnings: matchedItems.filter(i => i.match?.catalogItem?.stock === 0 || (i.match?.catalogItem && i.quantity > i.match.catalogItem.stock)).length,
  };

  const valItems = validation_items || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Automation Pipeline ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Automation Pipeline</div>

        <StepCard number="1" title="Extract Order Data" description="AI parsed raw input into structured line items, customer info, and delivery details." status="complete" />

        <StepCard number="2" title="Match to Product Catalog" description={`Matched ${matchStats.exact + matchStats.fuzzy} of ${matchedItems.length} items to your catalog. ${matchStats.unmatched > 0 ? `${matchStats.unmatched} need manual review.` : "All items resolved."}`} status="active">
          {/* SKU Matching Results Table */}
          <div style={{ overflowX: "auto", margin: "0 -22px", padding: "0 22px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {["Extracted Item", "Matched Catalog SKU", "Catalog Name", "Match", "Stock"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matchedItems.map((item, i) => {
                  const m = item.match;
                  const outOfStock = m?.catalogItem?.stock === 0;
                  const lowStock = m?.catalogItem && item.quantity > m.catalogItem.stock && m.catalogItem.stock > 0;
                  return (
                    <tr key={i}
                      className="flora-hover-row"
                      onMouseEnter={() => hl([item.description, item.sku, item.notes].filter(Boolean))}
                      onMouseLeave={clearHl}
                      style={{ borderBottom: `1px solid ${T.borderLight}`, cursor: "default", transition: "background 0.1s ease" }}
                    >
                      <td style={{ padding: "10px 12px", maxWidth: 200 }}>
                        <div style={{ fontWeight: 500, color: T.text, fontSize: 13 }}>{item.description}</div>
                        {item.sku && <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textTertiary, marginTop: 2 }}>{item.sku}</div>}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {m ? <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.accent }}>{m.catalogItem.sku}</span> : <span style={{ color: T.textTertiary, fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: T.textSecondary, maxWidth: 220 }}>
                        {m ? m.catalogItem.name : <span style={{ fontStyle: "italic", color: T.textTertiary }}>No catalog match</span>}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <MatchBadge type={m ? m.matchType : "none"} />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {m ? (
                          <span style={{
                            fontFamily: T.fontMono, fontSize: 12, fontWeight: 600,
                            color: outOfStock ? T.red : lowStock ? T.amber : T.green,
                          }}>
                            {outOfStock ? "OUT OF STOCK" : `${m.catalogItem.stock.toLocaleString()} ${m.catalogItem.uom}`}
                            {lowStock && " ⚠️"}
                          </span>
                        ) : <span style={{ color: T.textTertiary }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {matchStats.stockWarnings > 0 && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: T.radiusSm, background: T.amberLight, border: `1px solid ${T.amberBorder}`, fontSize: 12, color: T.amber, fontWeight: 500 }}>
              ⚠️ {matchStats.stockWarnings} item(s) have stock availability concerns — Flora would flag these before ERP submission.
            </div>
          )}
        </StepCard>

        <StepCard number="3" title="Validate & Confirm Data" description={`${valItems.length} field(s) need human confirmation before this order can be submitted. Flora never guesses — it asks.`} status="premium" badge="Premium">
          <ValidationPanel items={valItems} onHighlight={onHighlight} />
        </StepCard>

        <StepCard number="4" title="Draft Sales Order in ERP" description="Auto-create a sales order in NetSuite, SAP, Dynamics, or QuickBooks with matched SKUs, quantities, and pricing." status="locked" />
        <StepCard number="5" title="Confirm & Submit" description="One-click approval or straight-through processing for high-confidence orders from trusted customers." status="locked" />
      </div>

      {/* ── Extracted Data Details ── */}
      <div style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "1px", marginTop: 8 }}>Extraction Details</div>

      {/* Info tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        <InfoTile icon="🏢" label="Customer" value={customer?.name} sub={customer?.contact_person}
          onMouseEnter={() => hl([customer?.name, customer?.contact_person, customer?.email, customer?.phone].filter(Boolean))}
          onMouseLeave={clearHl}
        />
        <InfoTile icon="📋" label="PO Reference" value={po_reference}
          validationWarning={valItems.find(v => v.field?.includes("po_reference"))?.message}
          onMouseEnter={() => hl([po_reference].filter(Boolean))}
          onMouseLeave={clearHl}
        />
        <InfoTile icon="📅" label="Delivery Date" value={delivery?.requested_date}
          validationWarning={valItems.find(v => v.field?.includes("requested_date"))?.message}
          onMouseEnter={() => hl([delivery?.requested_date].filter(Boolean))}
          onMouseLeave={clearHl}
        />
        <InfoTile icon="📍" label="Ship To" value={delivery?.address}
          validationWarning={valItems.find(v => v.field?.includes("address"))?.message}
          onMouseEnter={() => {
            const addr = delivery?.address;
            if (!addr) return clearHl();
            // Split address into meaningful chunks for better matching
            const parts = addr.split(/,\s*/).filter(p => p.length > 3);
            hl(parts.length > 0 ? parts : [addr]);
          }}
          onMouseLeave={clearHl}
        />
      </div>

      {/* Line Items Table */}
      <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "1px" }}>Extracted Line Items</span>
          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textTertiary }}>{line_items?.length || 0} items</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {["#", "Description", "SKU", "Qty", "UoM", "Unit $", "Ext $", "Confidence"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {line_items?.map((item, i) => (
                <tr key={i}
                  className="flora-hover-row"
                  onMouseEnter={() => hl([item.description, item.sku, item.notes].filter(Boolean))}
                  onMouseLeave={clearHl}
                  style={{ borderBottom: `1px solid ${T.borderLight}`, background: i % 2 === 1 ? "#FAFAF9" : "transparent", cursor: "default", transition: "background 0.1s ease" }}
                >
                  <td style={{ padding: "12px 14px", color: T.textTertiary, fontFamily: T.fontMono, fontSize: 11 }}>{item.line}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 500, color: T.text, maxWidth: 260 }}>
                    {item.description}
                    {item.notes && <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 3, fontStyle: "italic" }}>{item.notes}</div>}
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: T.fontMono, fontSize: 11, color: T.accent, fontWeight: 500 }}>{item.sku || "—"}</td>
                  <td style={{ padding: "12px 14px", fontFamily: T.fontMono, fontWeight: 700, color: T.text }}>{item.quantity}</td>
                  <td style={{ padding: "12px 14px", color: T.textSecondary, fontSize: 12 }}>{item.uom}</td>
                  <td style={{ padding: "12px 14px", fontFamily: T.fontMono, fontSize: 12, color: T.textSecondary }}>{item.unit_price != null ? `$${item.unit_price.toFixed(2)}` : "—"}</td>
                  <td style={{ padding: "12px 14px", fontFamily: T.fontMono, fontSize: 12, color: T.text, fontWeight: 500 }}>{item.ext_price != null ? `$${item.ext_price.toFixed(2)}` : "—"}</td>
                  <td style={{ padding: "12px 14px" }}><ConfidencePill level={item.confidence} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totals?.total != null && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: 28 }}>
            {totals.subtotal != null && <div style={{ textAlign: "right" }}><div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, textTransform: "uppercase" }}>Subtotal</div><div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 600 }}>${totals.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
            {totals.tax != null && <div style={{ textAlign: "right" }}><div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, textTransform: "uppercase" }}>Tax</div><div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 600 }}>${totals.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
            {totals.total != null && <div style={{ textAlign: "right" }}><div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.accent, textTransform: "uppercase", fontWeight: 700 }}>Total</div><div style={{ fontFamily: T.fontMono, fontSize: 18, fontWeight: 800, color: T.accent }}>${totals.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
          </div>
        )}
      </div>

      {/* Flags */}
      {flags && flags.length > 0 && (
        <div>
          <div style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Flags & Ambiguities</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {flags.map((flag, i) => {
              // Extract key phrases from flag message for highlighting
              const words = flag.message.match(/"[^"]+"|'[^']+'|\b[A-Z][\w-]+\b|\b\d+\s*\w+/g) || [];
              const terms = words.map(w => w.replace(/^["']|["']$/g, "")).filter(w => w.length > 2);
              return <FlagRow key={i} flag={flag}
                onMouseEnter={() => hl(terms)}
                onMouseLeave={clearHl}
              />;
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.accent}`, padding: 28, position: "relative", overflow: "hidden", boxShadow: `0 0 0 1px ${T.accent}10` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.accentDark})` }} />
        <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>
            See what happens when this runs on autopilot
          </div>
          <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
            You just saw extraction, catalog matching, and smart validation. Flora also learns your customers' ordering patterns, auto-resolves ambiguities from order history, and drafts directly into your ERP — with every incomplete field flagged, never assumed.
          </div>
          <button
            style={{ padding: "14px 40px", borderRadius: T.radius, background: T.accent, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: `0 1px 3px ${T.accent}40`, transition: "all 0.15s ease", fontFamily: T.font }}
            onMouseEnter={e => { e.target.style.background = T.accentDark; e.target.style.boxShadow = `0 4px 12px ${T.accent}30`; }}
            onMouseLeave={e => { e.target.style.background = T.accent; e.target.style.boxShadow = `0 1px 3px ${T.accent}40`; }}
          >
            Start 14-Day Free Trial →
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Main App ───────────────────────────────────────────────────────────────

export default function FloraDemo() {
  const [activeTab, setActiveTab] = useState("samples");
  const [selectedSample, setSelectedSample] = useState(null);
  const [pasteText, setPasteText] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingSource, setProcessingSource] = useState("");
  const [rawInputText, setRawInputText] = useState("");
  const fileInputRef = useRef(null);
  const rawInputScrollRef = useRef(null);
  const [highlightTerms, setHighlightTerms] = useState([]);

  const extractOrder = useCallback(async (text, source) => {
    setIsProcessing(true);
    setResult(null);
    setError(null);
    setProcessingSource(source);
    setRawInputText(text);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: EXTRACTION_PROMPT + text }],
        }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const rawText = data.content.map(i => (i.type === "text" ? i.text : "")).filter(Boolean).join("\n");
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(cleaned));
    } catch (err) {
      setError(err.message || "Failed to extract order data.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setResult(null);
    setError(null);
    try {
      if (file.type.startsWith("image/")) {
        setUploadedText(`[IMAGE: ${file.name}] — In production, OCR extracts text from images. For this demo, paste the order text or try a sample.`);
      } else if (file.type === "application/pdf") {
        setUploadedText(`[PDF: ${file.name}] — In production, PDFs are parsed server-side. For this demo, paste the content as text or try a sample.`);
      } else {
        setUploadedText(await file.text());
      }
    } catch { setError("Could not read file."); }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProcessingSource("");
    setRawInputText("");
    setHighlightTerms([]);
    setSelectedSample(null);
    setPasteText("");
    setUploadedText("");
    setUploadedFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const tabs = [
    { id: "samples", label: "Sample Orders", icon: "📋" },
    { id: "paste", label: "Paste / Type", icon: "✏️" },
    { id: "upload", label: "Upload File", icon: "📁" },
  ];

  const btnBase = { border: "none", cursor: "pointer", fontFamily: T.font, transition: "all 0.15s ease" };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes ofspin { to { transform: rotate(360deg); } }
        @keyframes offade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${T.accent}; color: #fff; }
        textarea:focus, input:focus { outline: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        @media (max-width: 900px) {
          .flora-split-panel {
            grid-template-columns: 1fr !important;
          }
          .flora-left-panel {
            position: relative !important;
            top: 0 !important;
          }
          .flora-left-panel > div {
            max-height: 300px !important;
          }
        }
        .flora-hover-row:hover {
          background: ${T.accentLight} !important;
        }
        .flora-hover-tile:hover {
          box-shadow: 0 0 0 1px ${T.accent}40;
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        padding: "14px 24px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,250,249,0.88)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: T.text, letterSpacing: "-0.3px" }}>Flora</span>
          <span style={{ fontSize: 11, color: T.textTertiary, fontWeight: 500, letterSpacing: "0.3px", borderLeft: `1px solid ${T.border}`, paddingLeft: 8 }}>Order Intelligence</span>
        </div>
        <button style={{
          ...btnBase, padding: "8px 20px", borderRadius: T.radiusSm,
          background: T.accent, color: "#fff", fontWeight: 600, fontSize: 13,
          boxShadow: `0 1px 2px ${T.accent}30`,
        }}
          onMouseEnter={e => { e.target.style.background = T.accentDark; }}
          onMouseLeave={e => { e.target.style.background = T.accent; }}
        >Start Free Trial</button>
      </header>

      {/* ── Main ── */}

      {/* Results State — full-width two-panel layout */}
      {(result || isProcessing || error) ? (
        <div style={{ animation: "offade 0.3s ease" }}>
          {/* Top bar */}
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: isProcessing ? T.amber : error ? T.red : T.green }} />
              <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.textSecondary }}>
                {isProcessing ? "Processing" : error ? "Error" : "Processed"}: {processingSource}
              </span>
            </div>
            {!isProcessing && (
              <button onClick={handleReset} style={{
                ...btnBase, padding: "7px 18px", borderRadius: T.radiusSm,
                background: T.surface, border: `1px solid ${T.border}`,
                color: T.textSecondary, fontWeight: 600, fontSize: 12,
              }}
                onMouseEnter={e => { e.target.style.borderColor = T.accent; e.target.style.color = T.accent; }}
                onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.textSecondary; }}
              >← Try Another</button>
            )}
          </div>

          {isProcessing && (
            <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px" }}>
              <LoadingSpinner />
            </div>
          )}
          {error && (
            <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px" }}>
              <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: T.radius, padding: 20, color: T.red, fontSize: 14 }}>{error}</div>
            </div>
          )}

          {result && (
            <div className="flora-split-panel" style={{
              maxWidth: 1400, margin: "0 auto", padding: "16px 24px 80px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
              gap: 24,
              alignItems: "start",
            }}>
              {/* ── Left Panel: Original Input ── */}
              <div className="flora-left-panel" style={{ position: "sticky", top: 72 }}>
                <div style={{
                  background: T.surface, borderRadius: T.radiusLg,
                  border: `1px solid ${T.border}`, overflow: "hidden",
                  maxHeight: "calc(100vh - 100px)",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Panel header */}
                  <div style={{
                    padding: "14px 18px",
                    borderBottom: `1px solid ${T.borderLight}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexShrink: 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>
                        {processingSource === "Blurry Fax PO" ? "📠" :
                         processingSource === "Buried Email Chain" ? "✉️" :
                         processingSource === "Formal PDF PO" ? "📑" :
                         processingSource === "Messy Spreadsheet" ? "📊" :
                         processingSource === "Chat Message" ? "💬" : "📄"}
                      </span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Original Input
                      </span>
                    </div>
                    <span style={{
                      fontFamily: T.fontMono, fontSize: 10, fontWeight: 600,
                      padding: "3px 8px", borderRadius: 999,
                      background: T.surfaceHover, color: T.textTertiary,
                      border: `1px solid ${T.border}`,
                    }}>
                      {processingSource}
                    </span>
                  </div>
                  {/* Raw content */}
                  <div ref={rawInputScrollRef} style={{ overflow: "auto", flex: 1 }}>
                    <HighlightedRawInput text={rawInputText} terms={highlightTerms} scrollRef={rawInputScrollRef} />
                  </div>
                  {/* Panel footer */}
                  <div style={{
                    padding: "10px 18px",
                    borderTop: `1px solid ${T.borderLight}`,
                    background: T.surfaceHover,
                    flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 11, color: T.textTertiary, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: T.textSecondary }}>This is exactly what Flora received.</span> Every field on the right was extracted from this raw text — nothing added, nothing assumed.
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right Panel: Automation Pipeline ── */}
              <div>
                <ResultsView data={result} onHighlight={setHighlightTerms} />
              </div>
            </div>
          )}
        </div>
      ) : (

      /* Input State — centered narrow layout */
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px 80px" }}>
          <>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 14px", borderRadius: 999,
                background: T.accentLight, border: `1px solid #BFDBFE`,
                fontFamily: T.fontMono, fontSize: 11, fontWeight: 600,
                color: T.accent, letterSpacing: "0.5px", marginBottom: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "ofspin 3s linear infinite" }} />
                LIVE DEMO
              </div>
              <h1 style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.8px", marginBottom: 14, color: T.text }}>
                Messy order in.<br />
                <span style={{ color: T.accent }}>Structured data out.</span>
              </h1>
              <p style={{ fontSize: 16, color: T.textSecondary, maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
                See AI extract clean, catalog-matched order data from any format — fax, email, spreadsheet, or a quick chat message.
              </p>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex", gap: 2, background: T.surface,
              borderRadius: T.radius, padding: 3,
              border: `1px solid ${T.border}`, marginBottom: 20,
            }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  ...btnBase, flex: 1, padding: "11px 16px", borderRadius: 8,
                  background: activeTab === tab.id ? T.accentLight : "transparent",
                  color: activeTab === tab.id ? T.accent : T.textTertiary,
                  fontWeight: 600, fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  border: activeTab === tab.id ? `1px solid #BFDBFE` : "1px solid transparent",
                }}>
                  <span style={{ fontSize: 14 }}>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ animation: "offade 0.2s ease" }}>

              {/* Samples */}
              {activeTab === "samples" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 10, marginBottom: 20 }}>
                    {SAMPLE_ORDERS.map(s => (
                      <button key={s.id} onClick={() => { setSelectedSample(s.id); setResult(null); setError(null); }} style={{
                        ...btnBase, padding: "18px 14px", borderRadius: T.radius, textAlign: "left",
                        border: selectedSample === s.id ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                        background: selectedSample === s.id ? T.accentLight : T.surface,
                        display: "flex", flexDirection: "column", gap: 8,
                      }}>
                        <span style={{ fontSize: 22 }}>{s.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: selectedSample === s.id ? T.accent : T.text }}>{s.label}</span>
                        <span style={{ fontSize: 12, color: T.textTertiary, lineHeight: 1.4 }}>{s.description}</span>
                      </button>
                    ))}
                  </div>
                  {selectedSample && (
                    <div style={{ animation: "offade 0.2s ease" }}>
                      <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, marginBottom: 14, maxHeight: 280, overflow: "auto" }}>
                        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.borderLight}`, position: "sticky", top: 0, background: T.surface, zIndex: 1 }}>
                          <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Raw Input Preview</span>
                        </div>
                        <pre style={{ padding: 16, fontFamily: T.fontMono, fontSize: 12, color: T.textSecondary, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {SAMPLE_ORDERS.find(s => s.id === selectedSample)?.content}
                        </pre>
                      </div>
                      <button onClick={() => { const s = SAMPLE_ORDERS.find(x => x.id === selectedSample); if (s) extractOrder(s.content, s.label); }}
                        style={{ ...btnBase, width: "100%", padding: 16, borderRadius: T.radius, background: T.accent, color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: `0 1px 3px ${T.accent}30` }}
                        onMouseEnter={e => { e.target.style.background = T.accentDark; }}
                        onMouseLeave={e => { e.target.style.background = T.accent; }}
                      >Extract & Match to Catalog →</button>
                    </div>
                  )}
                </div>
              )}

              {/* Paste */}
              {activeTab === "paste" && (
                <div>
                  <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                    placeholder={"Paste an order email, chat message, or any unstructured text…\n\nExample: \"Hey, need 50 units of Widget A and 30 of Widget B to 123 Main St by Friday. PO# 12345.\""}
                    style={{
                      width: "100%", minHeight: 220, padding: 20,
                      borderRadius: T.radius, border: `1px solid ${T.border}`,
                      background: T.surface, color: T.text,
                      fontFamily: T.fontMono, fontSize: 13, lineHeight: 1.7,
                      resize: "vertical", marginBottom: 14,
                    }}
                    onFocus={e => e.target.style.borderColor = T.accent}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                  <button onClick={() => { if (pasteText.trim()) extractOrder(pasteText, "Pasted text"); }}
                    disabled={!pasteText.trim()}
                    style={{ ...btnBase, width: "100%", padding: 16, borderRadius: T.radius, background: pasteText.trim() ? T.accent : "#E7E5E4", color: pasteText.trim() ? "#fff" : T.textTertiary, fontWeight: 700, fontSize: 14, cursor: pasteText.trim() ? "pointer" : "not-allowed" }}
                  >Extract & Match to Catalog →</button>
                </div>
              )}

              {/* Upload */}
              {activeTab === "upload" && (
                <div>
                  <div onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.accent; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                    onDrop={e => {
                      e.preventDefault(); e.currentTarget.style.borderColor = T.border;
                      const f = e.dataTransfer.files?.[0];
                      if (f && fileInputRef.current) { const dt = new DataTransfer(); dt.items.add(f); fileInputRef.current.files = dt.files; handleFileUpload({ target: fileInputRef.current }); }
                    }}
                    style={{
                      padding: "48px 24px", borderRadius: T.radius,
                      border: `2px dashed ${T.border}`, background: T.surface,
                      cursor: "pointer", textAlign: "center", marginBottom: 14,
                    }}
                  >
                    <input ref={fileInputRef} type="file" accept=".txt,.csv,.json,.xlsx,.xls,.pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} style={{ display: "none" }} />
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: T.text, marginBottom: 4 }}>
                      {uploadedFileName || "Drop a file here, or click to browse"}
                    </div>
                    <div style={{ fontSize: 13, color: T.textTertiary }}>TXT, CSV, Excel, PDF, and image files</div>
                  </div>
                  {uploadedText && (
                    <div style={{ animation: "offade 0.2s ease" }}>
                      <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, maxHeight: 180, overflow: "auto", marginBottom: 14 }}>
                        <pre style={{ padding: 16, fontFamily: T.fontMono, fontSize: 12, color: T.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {uploadedText.slice(0, 2000)}{uploadedText.length > 2000 && "\n… (truncated)"}
                        </pre>
                      </div>
                      <button onClick={() => { if (uploadedText.trim()) extractOrder(uploadedText, uploadedFileName); }}
                        style={{ ...btnBase, width: "100%", padding: 16, borderRadius: T.radius, background: T.accent, color: "#fff", fontWeight: 700, fontSize: 14 }}
                        onMouseEnter={e => { e.target.style.background = T.accentDark; }}
                        onMouseLeave={e => { e.target.style.background = T.accent; }}
                      >Extract & Match to Catalog →</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>
              {[
                { value: "< 3s", label: "Avg extraction time" },
                { value: "97.2%", label: "Field accuracy" },
                { value: "38", label: "Demo catalog SKUs" },
                { value: "0", label: "Setup required" },
              ].map(stat => (
                <div key={stat.label} style={{ padding: "20px 16px", borderRadius: T.radius, background: T.surface, border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 24, fontWeight: 800, color: T.accent, marginBottom: 4 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: T.textTertiary }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </>
      </main>
      )}
    </div>
  );
}
