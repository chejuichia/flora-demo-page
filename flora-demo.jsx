import { useState, useRef, useCallback, useEffect, useMemo, Fragment } from "react";

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
  // Dairy & Produce (Fax sample)
  { sku: "YOG-OMB-6", name: "Organic Mixed Berry Yogurt Cups", category: "Dairy", price: 4.20, uom: "CASE", stock: 1800 },
  { sku: "TURK-GR1", name: "Free-Range Ground Turkey 1lb", category: "Meat", price: 6.90, uom: "CASE", stock: 0 },
  { sku: "TURK-GR3", name: "Free-Range Ground Turkey 3lb", category: "Meat", price: 14.50, uom: "CASE", stock: 280 },
  { sku: "SALSA-FRS-H", name: "Fresh Garden Salsa", category: "Condiments", price: 3.80, uom: "CASE", stock: 920 },
  { sku: "FF-FRZ-BROC-16", name: "Frozen Broccoli Florets 16oz", category: "Frozen", price: 3.40, uom: "BAG", stock: 1200 },
  { sku: "FF-CON-JALP-SLC", name: "Sliced Jalapeño Peppers", category: "Condiments", price: 2.90, uom: "JAR", stock: 760 },
  { sku: "FF-CON-JALP-DIC", name: "Diced Jalapeño Peppers", category: "Condiments", price: 2.90, uom: "JAR", stock: 640 },
  // Bulk Ingredients (Email sample)
  { sku: "FF-BLK-OATS-25", name: "Organic Rolled Oats 25kg", category: "Bulk", price: 28.50, uom: "BAG", stock: 320 },
  { sku: "WW-PEN-5K", name: "Whole Wheat Penne 8kg", category: "Bulk", price: 12.80, uom: "BAG", stock: 450 },
  { sku: "FF-BLK-SUGR-10", name: "Raw Cane Sugar 10kg", category: "Bulk", price: 15.40, uom: "BAG", stock: 580 },
  { sku: "FF-OIL-COCO-5L", name: "Coconut Oil Virgin 5L", category: "Oils", price: 22.60, uom: "BTL", stock: 210 },
  { sku: "FF-BAK-CHOC-BEL", name: "Dark Chocolate Chips Belgian 70% 1kg", category: "Baking", price: 11.90, uom: "BAG", stock: 180 },
  { sku: "FF-BAK-CHOC-REG", name: "Dark Chocolate Chips Regular 70% 1kg", category: "Baking", price: 8.40, uom: "BAG", stock: 340 },
  // Deli & Cheese (Chat sample)
  { sku: "FF-DIP-SPIN-400", name: "Spinach & Feta Dip 400g", category: "Dips", price: 4.80, uom: "TUB", stock: 380 },
  { sku: "FF-CHZ-SWIS-2K5", name: "Sliced Swiss Cheese 2.5kg bulk", category: "Cheese", price: 18.90, uom: "PK", stock: 120 },
];

// ─── Order History (mock) ────────────────────────────────────────────────────

const ORDER_HISTORY = {
  "Sunnyside Market": {
    customerSince: "2024-03-15",
    totalOrders: 8,
    lastOrder: {
      date: "2025-10-02",
      poRef: "SSM-10-2025-002",
      items: [
        { sku: "FF-SNK-CHIP-SEA", description: "Sea Salt Kettle Chips 200g", quantity: 40, uom: "BAG" },
        { sku: "FF-SNK-CHIP-BBQ", description: "BBQ Kettle Chips 200g", quantity: 36, uom: "BAG" },
        { sku: "FF-PRE-HUM-RST", description: "Roasted Red Pepper Hummus 300g", quantity: 48, uom: "TUB" },
        { sku: "FF-PRE-HUM-CLS", description: "Classic Hummus 300g", quantity: 80, uom: "TUB" },
        { sku: "FF-CON-MUST-350", description: "Whole Grain Mustard 350ml", quantity: 24, uom: "JAR" },
        { sku: "FF-BAK-CROS-6PK", description: "Butter Croissants 6-pack", quantity: 20, uom: "PK" },
        { sku: "FF-BAK-TORT-12", description: "Flour Tortillas 12-inch (12ct)", quantity: 30, uom: "PK" },
        { sku: "FF-BEV-SMTH-MNG", description: "Mango Smoothie 500ml", quantity: 100, uom: "BTL" },
        { sku: "FF-BEV-SMTH-BRY", description: "Mixed Berry Smoothie 500ml", quantity: 100, uom: "BTL" },
      ],
    },
  },
};

// ─── Customer Item Code Cross-Reference ──────────────────────────────────────

const CUSTOMER_ITEM_XREF = {
  "GreenHaven Market": {
    "GH-YOG-06": "YOG-OMB-6",
    "GH-TKY-01": "TURK-GR1",
    "GH-TKY-03": "TURK-GR3",
    "GH-SLSA-F": "SALSA-FRS-H",
    "GH-FRZ-BROC": "FF-FRZ-BROC-16",
    "GH-JAL-SL": "FF-CON-JALP-SLC",
    "GH-JAL-DC": "FF-CON-JALP-DIC",
  },
};

// ─── SKU Matching ────────────────────────────────────────────────────────────

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


// ─── Paste Placeholder ──────────────────────────────────────────────────────

const PASTE_PLACEHOLDER = `Sarah Pham (Sunnyside Market) Mar 3
9:12 AM Hi! This is Sarah from Sunnyside Market. Need to place our reorder for this week.
9:13 AM Sea salt kettle chips 200g – 48 bags
9:13 AM BBQ kettle chips 200g – 36 bags
9:14 AM FreshFoods Sales – Miguel Morning Sarah! Got it 👍 Let me start a list.
9:15 AM Sarah Pham Roasted red pepper hummus 300g – 60 tubs Is this the new recipe btw?
9:16 AM Miguel – FreshFoods Yes it is — same SKU but new batch since last month.
9:17 AM Sarah Pham Great thanks.
9:17 AM Classic hummus 300g – 80 tubs
9:18 AM Whole grain mustard 350ml – 24 jars
9:19 AM Also please double check packaging on the mustard. Last order had 3 broken jars.
9:20 AM Miguel – FreshFoods Oh no, sorry about that. I'll flag QA to double-check the packing.
9:21 AM Sarah Pham Thanks.
9:21 AM Butter croissants 6-pack – 40 packs
9:22 AM Flour tortillas 12-inch 12ct – 30 packs
9:23 AM Miguel – FreshFoods Got those.
9:24 AM Sarah Pham Mango smoothie 500ml – 120 bottles
9:24 AM Mixed berry smoothie 500ml – 120 bottles
9:25 AM Garlic herb hummus 300g – 60 tubs This was out of stock last time — please confirm availability
9:26 AM Miguel – FreshFoods Checking inventory now.
9:27 AM Miguel – FreshFoods Looks like garlic herb hummus is back in stock 👍
9:27 AM Sarah Pham Perfect.
9:28 AM Ship to: Sunnyside Market 72 Harvest Lane Portland OR
9:28 AM Miguel – FreshFoods Got it. Same delivery window as usual? Thursday morning?
9:29 AM Sarah Pham Yes Thursday works.
9:30 AM Miguel – FreshFoods Great. I'll send confirmation shortly.
9:30 AM Sarah Pham Thanks!`;

// ─── Sample Orders ──────────────────────────────────────────────────────────

const SAMPLE_ORDERS = [
  {
    id: "fax", label: "Blurry Fax PO", icon: "📠",
    description: "Handwritten PO with smudged quantities and corrections",
    image: "/samples/faxorder.png",
    content: `PURCHASE ORDER — FAX TRANSMISSION\nFrom: GreenHaven Market\nAttn: Sales Department\nDate: 04/26/2025\nPO#: GM-2025-1341\n\nPlease produce and ship the following to our warehouse at 2880 Logistics Rd, Dock 12, Dallas TX 75237:\n\n  250 cases   Organic Mixed Berry Yogurt Cups     (our item # GH-YOG-06)\n  160 cases   Free-Range Ground Turkey 1 lb packs  (our code: GH-TKY-01, ok to sub our code GH-TKY-03 if necessary)\n  400 cases   Fresh Garden Salsa                   (our item # GH-SLSA-F) — No cilantro in this batch please.\n  360 units   Frozen Broccoli Florets 16 oz bags   (please pack in the new 24-unit cases)\n  ??? cases   Sliced Jalapeño Peppers              (same diced jalapeños we ordered last month—Rick knows the size and pack)\n\nRUSH — need by 5/3 if possible. Call me at 972-555-0138 if any issues.\n\nColleen Rogers\n\n(handwritten note: "We're running low. Lets bump the turkey order to 160 cases. Thanks!")`,
  },
  {
    id: "email", label: "Buried Email Chain", icon: "✉️",
    description: "Order hidden in a 3-reply email thread",
    image: "/samples/emailchain.png",
    content: `Re: PO for December Restock\n\nFrom: Jen Carter <jen@freshfoods.co.uk>\nTo: sales\nDate: Tue, Nov 12, 7:36 AM\n\nHi team,\n\nHere's what we need for the December restock:\n\n- Organic rolled oats 25kg x 45 (updated qty).\n- Whole wheat penne 8kg x 60 (product code: WW-PEN-5K)\n- Raw cane sugar 10kg x 25\n- Coconut oil virgin 5L x 18\n- Dark chocolate chips 70% 1kg x 30 (Belgian if back in stock)\n\nDelivery to: Brighton Foods Ltd, Unit 12, South Downs Industrial Estate, Lewes Rd, Brighton BN2 4JF\n\nNeed by Dec 5th – Christmas production run.\n\nThanks! Jen\n\n---\n\nFrom: Tom Avery <tom@brightonfoodsale.co.uk>\nDate: Tue, Nov 12, 8:14 AM\n\nHi Jen,\n\nQuick checks:\n- Oats 25kg – confirmed 45 bags\n- Whole wheat penne WW-PEN-5K – confirmed\n- Coconut oil 5L – 18 confirmed\n- Dark choc chips – Belgian: 20 in stock, 10 arriving Mon, OK to split?\n- Raw cane sugar – confirmed\n\nETA for everything: Dec 4–5. Will send draft invoice later today. Cheers, Tom\n\n---\n\nFrom: Jen Carter\nDate: Tue, Nov 12, 8:27 AM\n\nPerfect. Yes please split the chocolate – Belgian 26 + regular 4.\n\nCan we get the invoice early? Accounts needs it by Friday. Thanks, Jen\n\n---\n\nFrom: Tom Avery\nDate: Tue, Nov 12, 9:45 AM\n\nDone – invoice #INV-77821 sent... ETA Dec 4\nBelgian 20 + Regular 10 confirmed.\n\nSee you Thursday for delivery. Tom`,
  },
  {
    id: "pdf", label: "Formal PDF PO", icon: "📑",
    description: "Structured PO with pricing table and totals",
    image: "/samples/pdforder.png",
    content: `PURCHASE ORDER\n\nPO Number: MBG-2025-00342\nDate: 2025-11-01\nVendor: FreshFoods Mfg\nPayment Terms: Net 30\n\nBILL TO:\nMaple & Birch Grocery\n200 Commonwealth Ave\nSuite 12\nBoston, MA 02116\nContact: David Chen\nTel: 617-555-0291\n\nSHIP TO:\nMaple & Birch Grocery\nDistribution Center\n88 Industrial Pkwy\nWoburn, MA 01801\nContact: Maria Lopez\nTel: 781-555-0184\n\nLine  Qty   UOM   Description                                          Unit $    Ext $\n1     200   JAR   Classic Marinara Sauce 500ml (FF-SAU-MARN-500)         $3.85     $770.00\n2     120   JAR   Basil Pesto 250ml (FF-SAU-PEST-250)                   $5.20     $624.00\n3     300   BTL   Tomato Ketchup 750ml (FF-CON-KETCH-750)               $2.90     $870.00\n4     150   BTL   Buttermilk Ranch Dressing 500ml (FF-DRS-RANCH-500)    $4.20     $630.00\n5     80    PK    Angus Beef Burger Patties 4-pack (FF-FRZ-BURG-4PK)   $8.90     $712.00\n\nSubtotal: $3,606.00\nTax (6.25%): $225.38\nFreight: $185.00\nTOTAL: $4,016.38\n\nNotes:\n- Line 1: Please confirm new label design is on these jars.\n- Partial shipments acceptable. Priority on lines 1, 3, and 5.\n- All items must ship by Nov 15, 2025.\n\nAuthorized by: David Chen, Procurement Manager`,
  },
  {
    id: "excel", label: "Messy Spreadsheet", icon: "📊",
    description: "Headerless Excel with notes in random cells",
    image: "/samples/excelorder.png",
    content: `Sunnyside Market - Monthly Reorder — Nov 2025\nContact: Sarah Pham, purchasing@sunnysidemarket.com\nVendor: FreshFoods Mfg\nDate: 2025-11-01\nBILL TO: Sunnyside Market\nPayment: Net 30\n\nLINE #  ITEM                              QTY #    UNIT PRICE\n1       sea salt kettle chips 200g         48 bags   $1.99\n2       BBQ kettle chips 200g              36 bags   $1.99\n3       roasted red pepper hummus 300g     60 tubs   CHECK: is this the new recipe?\n4       classic hummus 300g                80 tubs   $3.45\n5       whole grain mustard 350ml          24 jars   NOTE: last order of mustard had 3 broken jars - please double check packaging\n6       butter croissants 6-pack           24 pks    $2.69\n7       flour tortillas 12-inch 12ct       30 packs  $2.85\n8       mango smoothie 500ml               120 bottles\n9       mixed berry smoothie 500ml         120 bottles\n10      garlic herb hummus 300g            OUT OF STOCK LAST TIME — please confirm availability   120 tubs\n\nShip to: Sunnyside Market, 72 Harvest Lane, Portland OR 97205\nPreferred delivery: Nov 18-20\nFREIGHT: $185.00\nPO ref: SSM-11-2025-003\nTOTAL: $4,016.38`,
  },
  {
    id: "chat", label: "Chat Message", icon: "💬",
    description: "Casual text/WhatsApp style order",
    image: "/samples/textorder.png",
    content: `[Chat conversation — FreshFoods Order]\n\nCustomer: Hi, here's what I need for our deli restock:\n1. Classic Marinara Sauce, 500ml - 60 jars\n2. Roasted Red Pepper Hummus, 300g - 80 tubs\n3. Spinach & Feta Dip, 400g - 50 tubs\n4. Sliced Swiss Cheese (2.5kg bulk) - roughly 10kg\nIs all that in stock?\n\nAgent: Got it.\nAgent: Let me double check what's available.\nAgent: OK so marinara, hummus, & spinach dip are good to go, but we're short on the sliced swiss.\n\nCustomer: Would 12kg work to round out your order with the Swiss?\n\nAgent: 12kg works. We've been going through it faster lately.\n\nCustomer: Can we make it 70 jars of marinara total? Should be good with the hummus and dip.\n\nAgent: No problem, I'll make it 70 jars of marinara. I'll update the totals and email your PO shortly. Let me know if you need anything.`,
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
- If the customer explicitly authorizes a substitution (e.g. "ok to sub X if necessary"), capture it in the substitution field of the relevant line item. Only capture substitutions the customer explicitly mentions.
- If the order references customer-specific item codes or part numbers (e.g. "our item # GH-YOG-06", "our code: ABC-123"), extract them as the sku field. These may be customer codes rather than internal SKUs — downstream cross-referencing will resolve them.

Additionally, generate a "validation_items" array for any extracted field that is incomplete, ambiguous, or would need human confirmation before submitting to an ERP system. For each item, ALWAYS provide your best-effort assumption in "assumed_value" — what you would fill in if forced to guess. The human reviewer will verify or correct your assumption. Common cases include:
- Dates without a year (e.g. "Dec 5th" → assume the next upcoming Dec 5th, e.g. "2026-12-05")
- Vague delivery timing (e.g. "Thursday morning" → assume the next Thursday, provide ISO date; "ASAP" → assume tomorrow's date)
- Approximate quantities (e.g. "about 40" → assume 40; "15 or maybe 20" → assume 20, the higher value)
- Relative references (e.g. "same address as last time" → assumed_value: null, flag for lookup)
- Missing required fields (e.g. no PO number → assumed_value: null; no delivery address → assumed_value: null)
- Ambiguous product references (e.g. "the blue ones" → assumed_value: null, flag for clarification)

Respond with ONLY valid JSON in this exact structure, no markdown fences:
{
  "customer": {
    "name": "string",
    "contact_person": "string or null",
    "email": "string or null",
    "phone": "string or null"
  },
  "po_reference": "string or null",
  "order_date": "string or null — the date the order was placed or the document was created (e.g. email send date, PO date, conversation date). Use ISO format YYYY-MM-DD when possible.",
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
      "confidence": "high" | "medium" | "low",
      "substitution": { "original_sku": "string or null", "substitute_sku": "string or null", "condition": "string or null — e.g. 'if out of stock', 'if unavailable'" } or null
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
      "assumed_value": "string or null — your best-effort assumption for what this field should be (e.g. '2026-12-05' for 'Dec 5th', '40' for 'about 40'). null only when truly unknowable.",
      "issue": "incomplete_date" | "vague_timing" | "approximate_quantity" | "relative_reference" | "missing_field" | "ambiguous_product",
      "message": "string — human-readable explanation of the assumption made and what needs verifying",
      "suggested_action": "string — what the system would prompt the user to do"
    }
  ],
  "totals": {
    "subtotal": number or null,
    "tax": number or null,
    "freight": number or null,
    "total": number or null
  },
  "memo": "string — Summarize ALL notes, special instructions, flags, and action items from the order into a concise bulleted action list for the fulfillment team. Combine delivery notes, line item notes, corrections, and ambiguities into clear, de-duplicated action items. Use '• ' bullet prefix per line. Keep it short and actionable — e.g. '• Confirm new recipe for roasted red pepper hummus (line 3)' not raw dump of notes. Omit if no notes exist."
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
  orange: "#EA580C",
  orangeLight: "#FFF7ED",
  orangeBorder: "#FDBA74",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
  teal: "#0D9488",
  tealLight: "#F0FDFA",
  tealBorder: "#99F6E4",
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
    xref: { bg: T.purpleLight, color: T.purple, border: "#C4B5FD", icon: "🔗", label: "Cross-Referenced" },
    substitution: { bg: T.accentLight, color: T.accent, border: "#BFDBFE", icon: "⇄", label: "Substituted" },
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
      style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${validationWarning ? T.orangeBorder : T.border}`, padding: "16px 18px", position: "relative", cursor: onMouseEnter ? "default" : undefined, transition: "box-shadow 0.15s ease" }}
    >
      {validationWarning && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "10px 10px 0 0", background: `linear-gradient(90deg, #F97316, ${T.orange})` }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
        <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 600, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
        {validationWarning && <span style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: T.orangeLight, color: T.orange, border: `1px solid ${T.orangeBorder}` }}>NEEDS CONFIRM</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{value || "—"}</div>
      {sub && <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 3 }}>{sub}</div>}
      {validationWarning && <div style={{ fontSize: 11, color: T.orange, marginTop: 5, lineHeight: 1.4 }}>{validationWarning}</div>}
    </div>
  );
}

function StepCard({ number, title, description, status, badge, children }) {
  const statusColors = {
    complete: { bg: T.greenLight, color: T.green, border: T.greenBorder, icon: "✓" },
    active: { bg: T.accentLight, color: T.accent, border: "#BFDBFE", icon: "→" },
    locked: { bg: "#F5F5F4", color: T.textTertiary, border: T.border, icon: "🔒" },
    premium: { bg: T.orangeLight, color: T.orange, border: T.orangeBorder, icon: "★" },
  };
  const s = statusColors[status];
  const isPremium = status === "premium";
  return (
    <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${isPremium ? T.orangeBorder : status === "active" ? T.accent : T.border}`, overflow: "hidden", boxShadow: isPremium ? `0 0 0 1px ${T.orangeBorder}30, 0 4px 16px ${T.orange}08` : status === "active" ? `0 0 12px ${T.accent}25, 0 0 0 1px ${T.accent}40` : "none" }}>
      {isPremium && <div style={{ height: 2, background: `linear-gradient(90deg, #F97316, ${T.orange}, #F97316)` }} />}
      <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, borderBottom: children ? `1px solid ${T.borderLight}` : "none" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: s.color, flexShrink: 0 }}>
          {s.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, letterSpacing: "0.5px" }}>STEP {number}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{title}</span>
            {badge && (
              <span style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: `linear-gradient(135deg, #F97316, ${T.orange})`, color: "#fff", letterSpacing: "0.8px", textTransform: "uppercase" }}>{badge}</span>
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
      <div style={{ padding: "12px 16px", borderRadius: T.radiusSm, background: T.orangeLight, border: `1px solid ${T.orangeBorder}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🎯</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#9A3412", marginBottom: 3 }}>Best-effort assumptions — please verify</div>
          <div style={{ fontSize: 12, color: "#C2410C", lineHeight: 1.55 }}>
            Flora made its best guess for ambiguous or incomplete fields and pre-filled the draft. Review the assumed values below and correct anything that doesn&apos;t look right before submitting.
          </div>
        </div>
      </div>

      {/* Validation items */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${T.border}` }}>
            {["Issue", "Extracted", "Assumed Value", "Action"].map(h => (
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
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 600, color: T.orange }}>{issueLabels[item.issue] || item.issue}</span>
                </div>
              </td>
              <td style={{ padding: "10px 12px" }}>
                <code style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.text, background: T.orangeLight, padding: "2px 8px", borderRadius: 4, border: `1px solid ${T.orangeBorder}` }}>{item.extracted_value || "—"}</code>
              </td>
              <td style={{ padding: "10px 12px" }}>
                {item.assumed_value ? (
                  <code style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.green, background: T.greenLight, padding: "2px 8px", borderRadius: 4, border: `1px solid ${T.greenBorder}` }}>{item.assumed_value}</code>
                ) : (
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textTertiary }}>—</span>
                )}
              </td>
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

// ─── Draft NetSuite Sales Order Form ─────────────────────────────────────────
const CATALOG_BY_CATEGORY = (() => {
  const grouped = {};
  DEMO_CATALOG.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });
  return grouped;
})();

// Returns catalog items ranked by similarity to an extracted line item, highest score first
function rankCatalogForItem(extractedItem) {
  if (!extractedItem) return [];
  const desc = (extractedItem.description || "").toLowerCase();
  const sku = (extractedItem.sku || "").toLowerCase();
  const notes = (extractedItem.notes || "").toLowerCase();
  const combined = `${desc} ${sku} ${notes}`;

  return DEMO_CATALOG.map(product => {
    let score = 0;
    if (sku && product.sku.toLowerCase() === sku) {
      score = 100;
    } else if (sku && product.sku.toLowerCase().includes(sku.replace(/[^a-z0-9]/g, ""))) {
      score = 85;
    } else if (combined.includes(product.sku.toLowerCase())) {
      score = 90;
    } else {
      const productWords = product.name.toLowerCase().split(/[\s\-\/]+/).filter(w => w.length > 2);
      const matchedWords = productWords.filter(w => combined.includes(w));
      const ratio = productWords.length > 0 ? matchedWords.length / productWords.length : 0;
      score = Math.round(ratio * 75);
    }
    return { ...product, _score: score };
  })
  .filter(p => p._score >= 15)
  .sort((a, b) => b._score - a._score);
}

// ─── Cross-Reference Customer Codes ──────────────────────────────────────────

function crossReferenceCustomerCodes(extractedItems, customerName) {
  if (!customerName || !extractedItems) return { items: extractedItems || [], mappings: [] };
  const normalizedName = customerName.trim().toLowerCase();
  const xrefEntry = Object.entries(CUSTOMER_ITEM_XREF).find(([name]) => name.toLowerCase() === normalizedName);
  if (!xrefEntry) return { items: extractedItems, mappings: [] };
  const [, xrefMap] = xrefEntry;
  const mappings = [];

  const resolvedItems = extractedItems.map(item => {
    const extractedSku = (item.sku || "").trim();
    if (!extractedSku) return item;
    const match = Object.entries(xrefMap).find(([c]) => c.toLowerCase() === extractedSku.toLowerCase());
    if (!match) return item;
    const [customerCode, ourSku] = match;
    mappings.push({ customerCode, internalSku: ourSku, line: item.line });

    // Also resolve substitution SKUs if present
    let resolvedSub = item.substitution;
    if (resolvedSub) {
      const subOrig = Object.entries(xrefMap).find(([c]) => c.toLowerCase() === (resolvedSub.original_sku || "").toLowerCase());
      const subAlt = Object.entries(xrefMap).find(([c]) => c.toLowerCase() === (resolvedSub.substitute_sku || "").toLowerCase());
      resolvedSub = { ...resolvedSub, original_sku: subOrig ? subOrig[1] : resolvedSub.original_sku, substitute_sku: subAlt ? subAlt[1] : resolvedSub.substitute_sku };
    }
    return { ...item, sku: ourSku, _customerCode: customerCode, substitution: resolvedSub };
  });
  return { items: resolvedItems, mappings };
}

// ─── Substitution Logic ──────────────────────────────────────────────────────

function applySubstitutions(matchedItems) {
  return matchedItems.map(item => {
    const sub = item.substitution;
    if (!sub || !sub.substitute_sku) return item;
    const matchedProduct = item.match?.catalogItem;
    if (!matchedProduct || matchedProduct.stock > 0) return item; // only sub if OOS
    const subProduct = DEMO_CATALOG.find(p => p.sku.toLowerCase() === sub.substitute_sku.toLowerCase());
    if (!subProduct || subProduct.stock === 0) return item;
    return {
      ...item,
      match: { catalogItem: subProduct, score: 100, matchType: "substitution", confidence: "high" },
      _substitution: {
        originalSku: sub.original_sku || matchedProduct.sku,
        originalName: matchedProduct.name,
        originalStock: matchedProduct.stock,
        substituteSku: subProduct.sku,
        substituteName: subProduct.name,
        substituteStock: subProduct.stock,
        condition: sub.condition,
        customerAuthorized: true,
      },
    };
  });
}

// ─── Repeat Order Detection ──────────────────────────────────────────────────

function detectRepeatOrder(customerName, currentItems) {
  if (!customerName) return null;
  const normalizedName = customerName.trim().toLowerCase();
  const historyEntry = Object.entries(ORDER_HISTORY).find(([name]) => name.toLowerCase() === normalizedName);
  if (!historyEntry) return null;
  const [matchedName, history] = historyEntry;
  const prevItems = history.lastOrder.items;
  const diff = [];

  for (const curr of currentItems) {
    const catalogSku = curr.match?.catalogItem?.sku;
    if (!catalogSku) continue;
    const prev = prevItems.find(p => p.sku === catalogSku);
    if (prev) {
      if (curr.quantity !== prev.quantity) {
        diff.push({ type: curr.quantity > prev.quantity ? "qty_increased" : "qty_decreased", sku: catalogSku, description: curr.match?.catalogItem?.name || curr.description, prevQty: prev.quantity, currentQty: curr.quantity });
      } else {
        diff.push({ type: "unchanged", sku: catalogSku, description: curr.match?.catalogItem?.name || curr.description, quantity: curr.quantity });
      }
    } else {
      diff.push({ type: "new_item", sku: catalogSku, description: curr.match?.catalogItem?.name || curr.description, quantity: curr.quantity });
    }
  }
  for (const prev of prevItems) {
    if (!currentItems.some(c => c.match?.catalogItem?.sku === prev.sku)) {
      diff.push({ type: "removed", sku: prev.sku, description: prev.description, prevQty: prev.quantity });
    }
  }

  return { customerName: matchedName, customerSince: history.customerSince, totalOrders: history.totalOrders, lastOrderDate: history.lastOrder.date, lastOrderPO: history.lastOrder.poRef, diff };
}

const draftInputStyle = {
  width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
  fontSize: 13, fontFamily: T.font, color: T.text, background: "#fff",
  outline: "none", transition: "border-color 0.15s ease", boxSizing: "border-box",
};
const draftSelectStyle = { ...draftInputStyle, appearance: "auto" };
const draftLabelStyle = {
  fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, color: T.textTertiary,
  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5, display: "block",
};

function DraftSalesOrder({ draftOrder, setDraftOrder, catalog, onHighlight, extractionData, validationItems, repeatOrderInfo, xrefMappings, isUserUpload }) {
  const updateHeader = (field, value) => setDraftOrder(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
  const updateShipping = (field, value) => setDraftOrder(prev => ({ ...prev, shipping: { ...prev.shipping, [field]: value } }));
  const updateLineItem = (id, field, value) => setDraftOrder(prev => ({
    ...prev,
    lineItems: prev.lineItems.map(li => li.id !== id ? li : { ...li, [field]: value }),
  }));
  const handleSkuChange = (id, newSku) => {
    const catItem = catalog.find(c => c.sku === newSku);
    setDraftOrder(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(li => li.id !== id ? li : {
        ...li, catalogSku: newSku, description: catItem?.name || "", rate: catItem?.price || 0, uom: catItem?.uom || "",
      }),
    }));
  };

  // Ranked catalog suggestions per line item (only semantically similar SKUs)
  const suggestionsPerLine = useMemo(() => {
    return draftOrder.lineItems.map((_, i) => {
      const origItem = extractionData?.line_items?.[i];
      return rankCatalogForItem(origItem);
    });
  }, [extractionData?.line_items]);

  // Highlight helpers
  const hl = (terms) => onHighlight?.(terms);
  const clearHl = () => onHighlight?.([]);

  // Flag lookup: map validation field paths to draft field keys
  const flaggedFields = useMemo(() => {
    const map = {};
    if (validationItems && validationItems.length > 0) {
      for (const item of validationItems) {
        const f = item.field || "";
        if (f.includes("po_reference")) map.poNumber = item;
        if (f.includes("requested_date") || f.includes("delivery_date")) map.deliveryDate = item;
        if (f.includes("address")) map.shipTo = item;
        if (f.includes("customer") && !f.includes("contact")) map.customer = item;
        const lm = f.match(/line_items\[(\d+)\]/);
        if (lm) { if (!map.lineItems) map.lineItems = {}; map.lineItems[parseInt(lm[1], 10)] = item; }
      }
    }
    // Client-side flag: shipping method inferred from rush keywords
    const allNotes = [extractionData?.delivery?.notes, ...(extractionData?.line_items || []).map(li => li.notes)].filter(Boolean).join(" ");
    const rushMatch = allNotes.match(/\b(RUSH|urgent|expedit(?:e|ed)?|ASAP)\b/i);
    if (rushMatch) {
      map.shippingMethod = { field: "delivery.method", assumed_value: "Express", extracted_value: rushMatch[0], message: `Shipping set to Express based on "${rushMatch[0]}" note — verify` };
    }
    return map;
  }, [validationItems, extractionData]);

  const flagStyle = (base, key) => {
    const flag = typeof key === "number" ? flaggedFields.lineItems?.[key] : flaggedFields[key];
    if (!flag) return base;
    return { ...base, borderColor: T.amberBorder, background: T.amberLight };
  };

  const FieldFlag = ({ fieldKey }) => {
    const flag = typeof fieldKey === "number" ? flaggedFields.lineItems?.[fieldKey] : flaggedFields[fieldKey];
    if (!flag) return null;
    const assumed = flag.assumed_value;
    return (
      <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.4 }}>
        {assumed ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, color: T.amber }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>Assumed <strong style={{ color: T.text }}>{assumed}</strong> from &ldquo;{flag.extracted_value}&rdquo; &mdash; <span style={{ textDecoration: "underline", cursor: "default" }}>verify</span></span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: T.amber }}>⚠️ {flag.message}</div>
        )}
      </div>
    );
  };

  const subtotal = draftOrder.lineItems.reduce((sum, li) => sum + (li.quantity || 0) * (li.rate || 0), 0);
  const tax = subtotal * draftOrder.taxRate;
  const total = subtotal + tax + (draftOrder.shippingCost || 0);
  const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.border}`, padding: "20px 22px" }}>

      {/* ERP Form Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.text }}>Sales Order</span>
          <span style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: T.accentLight, color: T.accent, border: "1px solid #BFDBFE", letterSpacing: "0.5px" }}>DRAFT</span>
          {repeatOrderInfo && (
            <span style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: T.tealLight, color: T.teal, border: `1px solid ${T.tealBorder}`, letterSpacing: "0.5px" }}>🔄 RETURNING CUSTOMER — {repeatOrderInfo.totalOrders} PREVIOUS ORDERS</span>
          )}
        </div>
        <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textTertiary }}>SO-{new Date().getFullYear()}-DRAFT</span>
      </div>

      {/* Catalog connection banner for user uploads */}
      {isUserUpload && (
        <div style={{
          padding: "14px 16px", borderRadius: T.radius,
          background: T.accentLight, border: `1px solid #BFDBFE`,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>&#128218;</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
              SKUs shown are extracted as-is — your catalog isn't connected yet
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
              In production, Flora maps every line item to your ERP catalog, auto-matches SKUs, resolves ambiguities, and fills pricing. We connect to your systems and go live in under 2 weeks.
            </div>
          </div>
        </div>
      )}

      {/* ── Primary Information ── */}
      <div>
        <div style={{ ...draftLabelStyle, marginBottom: 10, fontSize: 10 }}>Primary Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div onMouseEnter={() => hl([extractionData?.customer?.name, extractionData?.customer?.contact_person, extractionData?.customer?.email, extractionData?.customer?.phone].filter(Boolean))} onMouseLeave={clearHl}>
            <label style={draftLabelStyle}>Customer</label>
            <input style={flagStyle(draftInputStyle, "customer")} value={draftOrder.header.customer} onChange={e => updateHeader("customer", e.target.value)} />
            <FieldFlag fieldKey="customer" />
          </div>
          <div onMouseEnter={() => { const d = extractionData?.order_date; if (!d) return clearHl(); const terms = [d]; const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) { const [, yyyy, mm, dd] = m; terms.push(`${mm}/${dd}/${yyyy}`, `${parseInt(mm)}/${parseInt(dd)}/${yyyy}`, `${mm}-${dd}-${yyyy}`); } hl(terms.filter(Boolean)); }} onMouseLeave={clearHl}>
            <label style={draftLabelStyle}>Date</label>
            <input type="date" style={draftInputStyle} value={draftOrder.header.date} onChange={e => updateHeader("date", e.target.value)} />
          </div>
          <div onMouseEnter={() => hl([extractionData?.po_reference].filter(Boolean))} onMouseLeave={clearHl}>
            <label style={draftLabelStyle}>PO Number</label>
            <input style={flagStyle(draftInputStyle, "poNumber")} value={draftOrder.header.poNumber} onChange={e => updateHeader("poNumber", e.target.value)} placeholder="Customer PO #" />
            <FieldFlag fieldKey="poNumber" />
          </div>
          <div>
            <label style={draftLabelStyle}>Status</label>
            <div style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.greenBorder}`, background: T.greenLight, fontSize: 12, fontWeight: 600, color: T.green }}>Pending Approval</div>
          </div>
          <div>
            <label style={draftLabelStyle}>Terms</label>
            <select style={draftSelectStyle} value={draftOrder.header.terms} onChange={e => updateHeader("terms", e.target.value)}>
              {["Net 30", "Net 60", "Due on Receipt", "2% 10 Net 30"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={draftLabelStyle}>Sales Rep</label>
            <input style={draftInputStyle} value={draftOrder.header.salesRep} onChange={e => updateHeader("salesRep", e.target.value)} placeholder="Assign rep..." />
          </div>
        </div>
        <div style={{ marginTop: 12 }} onMouseEnter={() => {
          const terms = [];
          if (extractionData?.delivery?.notes) terms.push(extractionData.delivery.notes);
          (extractionData?.line_items || []).forEach(item => { if (item.notes) terms.push(item.notes); });
          (extractionData?.flags || []).forEach(f => { if (f.message) terms.push(f.message); });
          hl(terms);
        }} onMouseLeave={clearHl}>
          <label style={draftLabelStyle}>Memo</label>
          <textarea style={{ ...draftInputStyle, resize: "vertical", minHeight: 38, lineHeight: 1.5 }} rows={draftOrder.header.memo ? Math.min(draftOrder.header.memo.split("\n").length + 1, 6) : 1} value={draftOrder.header.memo} onChange={e => updateHeader("memo", e.target.value)} placeholder="Internal order notes..." />
        </div>
      </div>

      {/* ── Shipping ── */}
      <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 16 }}>
        <div style={{ ...draftLabelStyle, marginBottom: 10, fontSize: 10 }}>Shipping</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridRow: "span 2" }} onMouseEnter={() => { const addr = extractionData?.delivery?.address; if (!addr) return clearHl(); const parts = addr.split(/,\s*/).filter(p => p.length > 3); hl(parts.length > 0 ? parts : [addr]); }} onMouseLeave={clearHl}>
            <label style={draftLabelStyle}>Ship To</label>
            <textarea style={{ ...flagStyle(draftInputStyle, "shipTo"), resize: "vertical", minHeight: 68 }} value={draftOrder.shipping.shipTo} onChange={e => updateShipping("shipTo", e.target.value)} rows={3} />
            <FieldFlag fieldKey="shipTo" />
          </div>
          <div onMouseEnter={() => hl([extractionData?.delivery?.requested_date].filter(Boolean))} onMouseLeave={clearHl}>
            <label style={draftLabelStyle}>Requested Delivery</label>
            <input type="date" style={flagStyle(draftInputStyle, "deliveryDate")} value={draftOrder.shipping.requestedDate} onChange={e => updateShipping("requestedDate", e.target.value)} />
            <FieldFlag fieldKey="deliveryDate" />
          </div>
          <div onMouseEnter={() => { if (flaggedFields.shippingMethod) hl(["RUSH", "rush", "urgent", "URGENT", "ASAP", "expedite"]); }} onMouseLeave={clearHl}>
            <label style={draftLabelStyle}>Shipping Method</label>
            <select style={flagStyle(draftSelectStyle, "shippingMethod")} value={draftOrder.shipping.shippingMethod} onChange={e => updateShipping("shippingMethod", e.target.value)}>
              {["Standard Ground", "Express", "Freight LTL", "Will Call"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <FieldFlag fieldKey="shippingMethod" />
          </div>
        </div>
      </div>

      {/* ── Line Items ── */}
      <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 16 }}>
        <div style={{ ...draftLabelStyle, marginBottom: 10, fontSize: 10 }}>Items</div>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: `2px solid ${T.border}` }}>
                  {["#", "Item / SKU", "Description", "Qty", "UoM", "Rate", "Amount"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draftOrder.lineItems.map((li, i) => {
                  const origItem = extractionData?.line_items?.[i];
                  const lineFlag = flaggedFields.lineItems?.[i];
                  return (
                  <Fragment key={li.id}>
                  <tr
                    className="flora-hover-row"
                    style={{ borderBottom: lineFlag ? "none" : `1px solid ${T.borderLight}`, background: lineFlag ? T.amberLight : (i % 2 === 1 ? "#FAFAF9" : "transparent"), transition: "background 0.1s ease" }}
                  >
                    <td style={{ padding: "8px 10px", color: T.textTertiary, fontFamily: T.fontMono, fontSize: 11, width: 32 }}>{li.id}</td>
                    <td style={{ padding: "8px 6px", minWidth: 200 }} onMouseEnter={() => hl([origItem?.sku, li.catalogSku, origItem?.description].filter(Boolean))} onMouseLeave={clearHl}>
                      {isUserUpload ? (
                        <div>
                          <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSecondary, padding: "5px 8px", background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${T.borderLight}` }}>
                            {origItem?.sku || <span style={{ color: T.textTertiary, fontStyle: "italic" }}>Pending catalog match</span>}
                          </div>
                        </div>
                      ) : (
                        <>
                          <select style={{ ...draftSelectStyle, fontSize: 11, padding: "5px 6px" }} value={li.catalogSku} onChange={e => handleSkuChange(li.id, e.target.value)}>
                            <option value="">-- Select Item --</option>
                            {(() => {
                              const suggestions = suggestionsPerLine[i] || [];
                              if (suggestions.length > 0) {
                                const skus = new Set(suggestions.map(s => s.sku));
                                const extra = li.catalogSku && !skus.has(li.catalogSku) ? catalog.find(c => c.sku === li.catalogSku) : null;
                                return (
                                  <>
                                    {extra && <option key={extra.sku} value={extra.sku}>{extra.sku} — {extra.name}</option>}
                                    {suggestions.map(c => <option key={c.sku} value={c.sku}>{c.sku} — {c.name}</option>)}
                                  </>
                                );
                              }
                              return Object.entries(CATALOG_BY_CATEGORY).map(([cat, items]) => (
                                <optgroup key={cat} label={cat}>
                                  {items.map(c => <option key={c.sku} value={c.sku}>{c.sku} — {c.name}</option>)}
                                </optgroup>
                              ));
                            })()}
                          </select>
                          {li._customerCode && <div style={{ fontSize: 9, color: T.purple, marginTop: 2, fontFamily: T.fontMono }}>🔗 {li._customerCode}</div>}
                          {li._substitution && <div style={{ fontSize: 9, color: T.accent, marginTop: 2, fontFamily: T.fontMono }}>⇄ from {li._substitution.originalSku}</div>}
                        </>
                      )}
                    </td>
                    <td style={{ padding: "8px 6px", minWidth: 160 }} onMouseEnter={() => hl([origItem?.description, li.description].filter(Boolean))} onMouseLeave={clearHl}>
                      <input style={{ ...draftInputStyle, fontSize: 12, padding: "5px 8px" }} value={li.description} onChange={e => updateLineItem(li.id, "description", e.target.value)} />
                    </td>
                    <td style={{ padding: "8px 6px", width: 80 }} onMouseEnter={() => hl([origItem?.quantity != null ? String(origItem.quantity) : null, lineFlag?.extracted_value].filter(Boolean))} onMouseLeave={clearHl}>
                      <input type="number" min="0" style={{ ...draftInputStyle, fontSize: 12, padding: "5px 8px", fontFamily: T.fontMono, textAlign: "right", minWidth: 60, ...(lineFlag ? { borderColor: T.amberBorder, background: T.amberLight } : {}) }} value={li.quantity} onChange={e => updateLineItem(li.id, "quantity", parseFloat(e.target.value) || 0)} />
                      {repeatOrderInfo && (() => {
                        const d = repeatOrderInfo.diff.find(d => d.sku === li.catalogSku);
                        if (!d || d.type === "unchanged") return null;
                        if (d.type === "new_item") return <div style={{ fontSize: 9, color: T.accent, marginTop: 1, textAlign: "right", fontFamily: T.fontMono }}>✦ new</div>;
                        if (d.type === "qty_increased") return <div style={{ fontSize: 9, color: T.teal, marginTop: 1, textAlign: "right", fontFamily: T.fontMono }}>↑ {d.prevQty}</div>;
                        if (d.type === "qty_decreased") return <div style={{ fontSize: 9, color: T.amber, marginTop: 1, textAlign: "right", fontFamily: T.fontMono }}>↓ {d.prevQty}</div>;
                        return null;
                      })()}
                    </td>
                    <td style={{ padding: "8px 10px", fontFamily: T.fontMono, fontSize: 11, color: T.textSecondary, whiteSpace: "nowrap" }} onMouseEnter={() => hl([origItem?.uom].filter(Boolean))} onMouseLeave={clearHl}>{li.uom || "—"}</td>
                    <td style={{ padding: "8px 6px", width: 95 }} onMouseEnter={() => hl([origItem?.unit_price != null ? String(origItem.unit_price) : null].filter(Boolean))} onMouseLeave={clearHl}>
                      <input type="number" min="0" step="0.01" style={{ ...draftInputStyle, fontSize: 12, padding: "5px 8px", fontFamily: T.fontMono, textAlign: "right", minWidth: 70 }} value={li.rate} onChange={e => updateLineItem(li.id, "rate", parseFloat(e.target.value) || 0)} />
                    </td>
                    <td style={{ padding: "8px 10px", fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.text, textAlign: "right", width: 90 }} onMouseEnter={() => hl([origItem?.ext_price != null ? String(origItem.ext_price) : null].filter(Boolean))} onMouseLeave={clearHl}>
                      ${fmt((li.quantity || 0) * (li.rate || 0))}
                    </td>
                  </tr>
                  {lineFlag && (
                    <tr style={{ background: T.amberLight, borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: "0 10px 8px" }}></td>
                      <td colSpan={6} style={{ padding: "0 6px 8px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5, fontSize: 11, lineHeight: 1.3 }}>
                          <span style={{ color: T.amber, flexShrink: 0 }}>⚠️</span>
                          {lineFlag.assumed_value ? (
                            <span style={{ color: T.amber }}>Assumed <strong style={{ color: T.text }}>{lineFlag.assumed_value}</strong> from &ldquo;{lineFlag.extracted_value}&rdquo; &mdash; <span style={{ textDecoration: "underline", cursor: "default" }}>verify</span></span>
                          ) : (
                            <span style={{ color: T.amber }}>{lineFlag.message}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ borderTop: `2px solid ${T.border}`, padding: "14px 16px", display: "flex", justifyContent: "flex-end", gap: 24, background: "#F8FAFC" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Subtotal</div>
              <div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 600, color: T.text }}>${fmt(subtotal)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tax (6.25%)</div>
              <div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 600, color: T.text }}>${fmt(tax)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Shipping</div>
              <input type="number" min="0" step="0.01" style={{ ...draftInputStyle, width: 90, fontSize: 13, padding: "4px 8px", fontFamily: T.fontMono, textAlign: "right", fontWeight: 600 }} value={draftOrder.shippingCost} onChange={e => setDraftOrder(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Total</div>
              <div style={{ fontFamily: T.fontMono, fontSize: 18, fontWeight: 800, color: T.accent }}>${fmt(total)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Repeat Order Intelligence Card ──────────────────────────────────────────

function RepeatOrderCard({ repeatOrderInfo }) {
  if (!repeatOrderInfo) return null;
  const { customerName, customerSince, totalOrders, lastOrderDate, lastOrderPO, diff } = repeatOrderInfo;
  const changes = diff.filter(d => d.type !== "unchanged");

  const badgeStyles = {
    qty_increased: { bg: T.tealLight, color: T.teal, border: T.tealBorder, icon: "↑", label: "Qty Up" },
    qty_decreased: { bg: T.amberLight, color: T.amber, border: T.amberBorder, icon: "↓", label: "Qty Down" },
    new_item: { bg: T.accentLight, color: T.accent, border: "#BFDBFE", icon: "✦", label: "New" },
    removed: { bg: "#FEF2F2", color: T.red, border: "#FECACA", icon: "✕", label: "Dropped" },
  };

  return (
    <div style={{ background: T.tealLight, borderRadius: T.radiusLg, border: `1px solid ${T.tealBorder}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔄</span>
          <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.teal, letterSpacing: "0.3px" }}>Repeat Order Intelligence</span>
        </div>
        <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: T.surface, color: T.teal, border: `1px solid ${T.tealBorder}` }}>{changes.length} change(s) from last order</span>
      </div>

      {/* Customer Context */}
      <div style={{ display: "flex", gap: 20, padding: "10px 14px", background: T.surface, borderRadius: T.radiusSm, border: `1px solid ${T.tealBorder}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer Since</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{new Date(customerSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Previous Orders</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{totalOrders}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Order</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{new Date(lastOrderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
          <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, marginTop: 1 }}>{lastOrderPO}</div>
        </div>
      </div>

      {/* Diff Table */}
      {changes.length > 0 && (
        <div style={{ border: `1px solid ${T.tealBorder}`, borderRadius: T.radiusSm, overflow: "hidden", background: T.surface }}>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.tealBorder}`, background: T.tealLight }}>
                {["Change", "Item", "Qty"].map(h => (
                  <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {changes.map((d, i) => {
                const badge = badgeStyles[d.type];
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: "8px 10px", width: 80 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 999, fontSize: 10, fontWeight: 700, fontFamily: T.fontMono, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 12, color: T.text, fontWeight: 500 }}>{d.description}</td>
                    <td style={{ padding: "8px 10px", fontFamily: T.fontMono, fontSize: 12, textAlign: "right", whiteSpace: "nowrap" }}>
                      {d.type === "removed" ? (
                        <span style={{ color: T.red }}>{d.prevQty} → 0</span>
                      ) : d.type === "new_item" ? (
                        <span style={{ fontWeight: 600, color: T.accent }}>{d.currentQty != null ? d.currentQty : d.quantity}</span>
                      ) : (
                        <span><span style={{ color: T.textTertiary }}>{d.prevQty}</span> <span style={{ color: T.textTertiary }}>→</span> <span style={{ fontWeight: 600, color: T.text }}>{d.currentQty}</span></span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
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
  // Allow short numeric terms (quantities, prices) but require word boundaries to avoid false matches
  const escaped = terms
    .filter(t => t && (t.length > 2 || /^\d/.test(t)))
    .map(t => {
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return t.length <= 2 ? `\\b${esc}\\b` : esc;
    })
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

function ResultsView({ data, onHighlight, onGetStarted, onTryOwn, isUserUpload }) {
  if (!data) return null;
  const { customer, po_reference, order_date, delivery, line_items, flags, totals, validation_items, memo: extractedMemo } = data;
  const hl = (terms) => onHighlight?.(terms);
  const clearHl = () => onHighlight?.([]);

  // Step 1: Cross-reference customer codes to internal SKUs
  const { items: resolvedItems, mappings: xrefMappings } = useMemo(
    () => crossReferenceCustomerCodes(line_items || [], customer?.name),
    [line_items, customer?.name]
  );

  // Step 2: Match to catalog (using resolved SKUs), then apply substitutions
  const matchedItems = useMemo(() => {
    const rawMatched = resolvedItems.map(item => {
      const match = matchSkuToCatalog(item);
      // Tag cross-referenced items with xref match type
      if (item._customerCode && match && match.matchType === "exact") match.matchType = "xref";
      return { ...item, match };
    });
    return applySubstitutions(rawMatched);
  }, [resolvedItems]);

  // Step 3: Detect repeat order
  const repeatOrderInfo = useMemo(
    () => detectRepeatOrder(customer?.name, matchedItems),
    [customer?.name, matchedItems]
  );

  const matchStats = {
    exact: matchedItems.filter(i => i.match?.matchType === "exact").length,
    xref: matchedItems.filter(i => i.match?.matchType === "xref").length,
    substitutions: matchedItems.filter(i => i._substitution).length,
    fuzzy: matchedItems.filter(i => i.match && !["exact", "xref", "substitution"].includes(i.match.matchType)).length,
    unmatched: matchedItems.filter(i => !i.match).length,
    stockWarnings: matchedItems.filter(i => i.match?.catalogItem?.stock === 0 || (i.match?.catalogItem && i.quantity > i.match.catalogItem.stock)).length,
  };

  const valItems = validation_items || [];

  // ── Draft Sales Order state ──
  const [draftOrder, setDraftOrder] = useState(null);
  const draftInitialized = useRef(false);
  const [showPipeline, setShowPipeline] = useState(false);

  useEffect(() => {
    if (!draftInitialized.current && matchedItems.length > 0) {
      draftInitialized.current = true;
      const today = new Date().toISOString().split("T")[0];

      // Helper: find assumed_value for a validation field path
      const assumed = (fieldPath) => valItems.find(v => v.field?.includes(fieldPath))?.assumed_value || "";

      // Helper: parse a date string to ISO YYYY-MM-DD, returns "" if unparseable
      const toISO = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
      };

      // Use extracted order_date, falling back to today
      const orderDate = toISO(order_date) || today;

      // Best-effort parse of requested date to ISO format
      // If a validation item exists with an assumed_value, prefer it (the raw date may parse
      // to a nonsensical year, e.g. "5/3" → 2001-05-03, while assumed_value is "2025-05-03")
      const assumedDate = toISO(assumed("requested_date"));
      const rawDate = toISO(delivery?.requested_date);
      const reqDate = assumedDate || rawDate;

      setDraftOrder({
        header: {
          customer: customer?.name || assumed("customer") || "",
          date: orderDate,
          poNumber: po_reference || assumed("po_reference") || "",
          terms: "Net 30",
          salesRep: "",
          memo: extractedMemo || "",
        },
        shipping: {
          shipTo: delivery?.address || assumed("address") || "",
          requestedDate: reqDate,
          shippingMethod: (() => {
            const allNotes = [delivery?.notes, delivery?.method, extractedMemo, ...(line_items || []).map(li => li.notes)].join(" ").toLowerCase();
            if (/\brush\b|urgent|expedit|asap|priority\s*ship/i.test(allNotes)) return "Express";
            if (/freight|ltl|truck/i.test(allNotes)) return "Freight LTL";
            return "Standard Ground";
          })(),
        },
        lineItems: matchedItems.map((item, i) => {
          const cat = item.match?.catalogItem;
          // Check for assumed quantity on this line item
          const lineAssumed = valItems.find(v => v.field === `line_items[${i}].quantity`);
          const qty = item.quantity || (lineAssumed?.assumed_value ? parseFloat(lineAssumed.assumed_value) : 0);
          return {
            id: i + 1,
            catalogSku: cat?.sku || "",
            description: cat?.name || item.description,
            quantity: qty,
            uom: cat?.uom || item.uom || "",
            rate: cat?.price || item.unit_price || 0,
            _substitution: item._substitution || null,
            _customerCode: item._customerCode || null,
          };
        }),
        shippingCost: totals?.freight || 0,
        taxRate: 0.0625,
      });
    }
  }, [matchedItems]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Draft Sales Order (hero content at top) ── */}
      {draftOrder && (
        <DraftSalesOrder
          draftOrder={draftOrder}
          setDraftOrder={setDraftOrder}
          catalog={DEMO_CATALOG}
          onHighlight={onHighlight}
          extractionData={{ customer, po_reference, order_date, delivery, line_items: matchedItems, flags }}
          validationItems={valItems}
          repeatOrderInfo={repeatOrderInfo}
          xrefMappings={xrefMappings}
          isUserUpload={isUserUpload}
        />
      )}

      {/* ── Repeat Order Intelligence ── */}
      {repeatOrderInfo && <RepeatOrderCard repeatOrderInfo={repeatOrderInfo} />}

      {/* ── "See how Flora did it" expandable section ── */}
      <div>
        <button
          onClick={() => setShowPipeline(prev => !prev)}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "14px 18px",
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
            cursor: "pointer", fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.textSecondary,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
        >
          <span style={{ transform: showPipeline ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", fontSize: 11, lineHeight: 1 }}>&#9654;</span>
          See how Flora did it
          <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: T.surfaceHover, color: T.textTertiary, border: `1px solid ${T.border}`, marginLeft: "auto" }}>3 steps</span>
        </button>

        {showPipeline && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12, animation: "offade 0.2s ease" }}>

            <StepCard number="1" title="Extract Order Data" description="AI parsed raw input into structured line items, customer info, and delivery details." status="complete">
              {/* Info tiles */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
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
                    {totals.freight != null && <div style={{ textAlign: "right" }}><div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textTertiary, textTransform: "uppercase" }}>Freight</div><div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 600 }}>${totals.freight.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
                    {totals.total != null && <div style={{ textAlign: "right" }}><div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.accent, textTransform: "uppercase", fontWeight: 700 }}>Total</div><div style={{ fontFamily: T.fontMono, fontSize: 18, fontWeight: 800, color: T.accent }}>${totals.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
                  </div>
                )}
              </div>

              {/* Flags */}
              {flags && flags.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Flags & Ambiguities</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {flags.map((flag, i) => {
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
            </StepCard>

            <StepCard number="2" title="Match to Product Catalog" description={(() => {
              const parts = [];
              if (matchStats.xref > 0) parts.push(`${matchStats.xref} cross-referenced`);
              if (matchStats.exact > 0) parts.push(`${matchStats.exact} exact`);
              if (matchStats.fuzzy > 0) parts.push(`${matchStats.fuzzy} fuzzy`);
              if (matchStats.substitutions > 0) parts.push(`${matchStats.substitutions} substituted`);
              const resolved = matchStats.exact + matchStats.fuzzy + matchStats.xref + matchStats.substitutions;
              return `${resolved} of ${matchedItems.length} items matched (${parts.join(", ")}). ${matchStats.unmatched > 0 ? `${matchStats.unmatched} need manual review.` : "All items resolved."}`;
            })()} status="active">

              {/* Cross-Reference Banner */}
              {xrefMappings && xrefMappings.length > 0 && (
                <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: T.radiusSm, background: T.purpleLight, border: `1px solid #C4B5FD`, fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, color: T.purple }}>
                    <span>🔗</span> Customer Code Cross-Reference — {xrefMappings.length} item(s) resolved
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {xrefMappings.map((m, i) => (
                      <div key={i} style={{ fontFamily: T.fontMono, fontSize: 11, color: T.purple, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: T.textTertiary }}>{m.customerCode}</span>
                        <span style={{ color: T.textTertiary }}>→</span>
                        <span style={{ fontWeight: 600 }}>{m.internalSku}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Substitution Banner */}
              {matchStats.substitutions > 0 && (
                <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: T.radiusSm, background: T.accentLight, border: `1px solid #BFDBFE`, fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, color: T.accent }}>
                    <span>⇄</span> Substitution Applied
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {matchedItems.filter(item => item._substitution).map((item, i) => (
                      <div key={i} style={{ fontFamily: T.fontMono, fontSize: 11, color: T.accent, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, color: T.red }}>{item._substitution.originalSku}</span>
                        <span style={{ color: T.textTertiary }}>(out of stock)</span>
                        <span style={{ color: T.textTertiary }}>→</span>
                        <span style={{ fontWeight: 600, color: T.green }}>{item._substitution.substituteSku}</span>
                        <span style={{ color: T.textTertiary }}>({item._substitution.substituteStock} in stock)</span>
                        {item._substitution.customerAuthorized && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "#DBEAFE", color: T.accent, fontWeight: 600 }}>customer authorized</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

            <StepCard number="3" title="Flag for Human Review" description={`${valItems.length} field(s) need human confirmation before this order can be submitted. Flora never guesses — it asks.`} status="premium" badge="Premium">
              <ValidationPanel items={valItems} onHighlight={onHighlight} />
            </StepCard>

          </div>
        )}
      </div>

      {/* Try your own order */}
      {onTryOwn && (
        <button onClick={onTryOwn} style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "18px 20px",
          borderRadius: T.radius, background: T.accentLight, border: `1px solid #BFDBFE`,
          cursor: "pointer", fontFamily: T.font, transition: "all 0.15s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#DBEAFE"; e.currentTarget.style.borderColor = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.accentLight; e.currentTarget.style.borderColor = "#BFDBFE"; }}
        >
          <span style={{ fontSize: 18 }}>&#9889;</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.accent }}>Try Flora AI with your own order</div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>Paste your own PO text or upload a file to see it processed</div>
          </div>
          <span style={{ fontSize: 16, color: T.accent, marginLeft: "auto" }}>→</span>
        </button>
      )}

      {/* CTA */}
      <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.accent}`, padding: 28, position: "relative", overflow: "hidden", boxShadow: `0 0 0 1px ${T.accent}10` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.accentDark})` }} />
        <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>
            Now imagine this on every order, every day
          </div>
          <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
            You just saw extraction, catalog matching, and smart validation on a single order. In production, Flora processes hundreds per day — learning your customers' patterns, auto-resolving ambiguities, and drafting directly into your ERP.
          </div>
          <button
            onClick={onGetStarted}
            style={{ padding: "14px 40px", borderRadius: T.radius, background: T.accent, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: `0 1px 3px ${T.accent}40`, transition: "all 0.15s ease", fontFamily: T.font }}
            onMouseEnter={e => { e.target.style.background = T.accentDark; e.target.style.boxShadow = `0 4px 12px ${T.accent}30`; }}
            onMouseLeave={e => { e.target.style.background = T.accent; e.target.style.boxShadow = `0 1px 3px ${T.accent}40`; }}
          >
            Book a Demo with Your Team →
          </button>
          <p style={{ fontSize: 12, color: T.textTertiary, marginTop: 12 }}>
            30-minute walkthrough. Bring your ops team. We'll use your real orders.
          </p>
        </div>
      </div>
    </div>
  );
}


// ─── Main App ───────────────────────────────────────────────────────────────

export default function FloraDemo() {
  const [activeTab, setActiveTab] = useState("samples");
  const [hoveredSample, setHoveredSample] = useState(null);
  const [showTryOwn, setShowTryOwn] = useState(false);
  const [tryOwnMode, setTryOwnMode] = useState(null); // "paste" | "upload"
  const [showQualify, setShowQualify] = useState(false);
  const [qualifyAnswers, setQualifyAnswers] = useState({ volume: "", erp: "", pain: "" });
  const [pasteText, setPasteText] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileData, setUploadedFileData] = useState(null); // { base64, mediaType }
  const [isUserUpload, setIsUserUpload] = useState(false);
  const [showBottomTryOwn, setShowBottomTryOwn] = useState(false);
  const [bottomTryOwnMode, setBottomTryOwnMode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingSource, setProcessingSource] = useState("");
  const [processingImage, setProcessingImage] = useState(null);
  const [rawInputText, setRawInputText] = useState("");
  const fileInputRef = useRef(null);
  const rawInputScrollRef = useRef(null);
  const [highlightTerms, setHighlightTerms] = useState([]);

  // Load Calendly widget script
  useEffect(() => {
    if (document.querySelector('script[src*="calendly.com"]')) return;
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    document.head.appendChild(s);
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const openCalendly = () => {
    const q = qualifyAnswers;
    const params = new URLSearchParams({
      utm_source: "flora_demo",
      utm_content: [q.volume, q.erp, q.pain].filter(Boolean).join(" | "),
    });
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: `https://calendly.com/juichia1982/30min?${params.toString()}`,
      });
    }
    setShowQualify(false);
    setQualifyAnswers({ volume: "", erp: "", pain: "" });
  };

  const handleGetStarted = () => setShowQualify(true);

  const extractOrder = useCallback(async (text, source, image, fileData) => {
    setIsProcessing(true);
    setResult(null);
    setError(null);
    setProcessingSource(source);
    setProcessingImage(image || null);
    setRawInputText(text);
    try {
      let messageContent;
      if (fileData) {
        const block = fileData.mediaType === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: fileData.mediaType, data: fileData.base64 } }
          : { type: "image", source: { type: "base64", media_type: fileData.mediaType, data: fileData.base64 } };
        messageContent = [block, { type: "text", text: EXTRACTION_PROMPT + "\n[See attached document]" }];
      } else {
        messageContent = EXTRACTION_PROMPT + text;
      }
      const response = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: messageContent }],
        }),
      });
      if (!response.ok) {
        let errMsg = `API error: ${response.status}`;
        try {
          const errData = await response.json();
          const errType = errData?.error?.type || "";
          if (response.status === 429 || errType === "rate_limit_error") {
            errMsg = "We've hit our API rate limit. Please wait a minute and try again.";
          } else if (response.status === 529 || errType === "overloaded_error") {
            errMsg = "The AI service is temporarily overloaded. Please try again in a few moments.";
          } else if (errType === "authentication_error" || response.status === 401) {
            errMsg = "API authentication failed — the demo API key may have expired or been revoked.";
          } else if (errType === "permission_error" || response.status === 403) {
            errMsg = "API access denied — the demo may have exhausted its API credits. Please contact us.";
          } else if (errType === "invalid_request_error" || response.status === 400) {
            errMsg = "Invalid request sent to the AI service. Please try a different input.";
          } else if (errData?.error?.message) {
            errMsg = errData.error.message;
          }
        } catch {}
        throw new Error(errMsg);
      }
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
    setUploadedFileData(null);
    try {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setUploadedFileData({ base64, mediaType: file.type });
        setUploadedText(file.type === "application/pdf"
          ? `PDF uploaded: ${file.name} — Ready to process`
          : `Image uploaded: ${file.name} — Ready to process`);
      } else {
        setUploadedText(await file.text());
      }
    } catch { setError("Could not read file."); }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProcessingSource("");
    setProcessingImage(null);
    setRawInputText("");
    setHighlightTerms([]);
    setPasteText("");
    setUploadedText("");
    setUploadedFileName("");
    setUploadedFileData(null);
    setShowTryOwn(false);
    setTryOwnMode(null);
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
        @keyframes ofpulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.75); } }
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
        <button onClick={handleGetStarted} style={{
          ...btnBase, padding: "8px 20px", borderRadius: T.radiusSm,
          background: T.accent, color: "#fff", fontWeight: 600, fontSize: 13,
          boxShadow: `0 1px 2px ${T.accent}30`,
        }}
          onMouseEnter={e => { e.target.style.background = T.accentDark; }}
          onMouseLeave={e => { e.target.style.background = T.accent; }}
        >Get Started with Flora</button>
      </header>

      {/* ── Qualifying Modal ── */}
      {showQualify && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20, animation: "offade 0.2s ease",
        }} onClick={e => { if (e.target === e.currentTarget) setShowQualify(false); }}>
          <div style={{
            background: T.surface, borderRadius: T.radiusLg,
            border: `1px solid ${T.border}`, width: "100%", maxWidth: 480,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            animation: "offade 0.25s ease",
          }}>
            {/* Modal header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                Get Started with Flora
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
                Help us prepare a walkthrough tailored to your operation.
              </div>
            </div>

            {/* Questions */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Q1: Order volume */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 6, fontFamily: T.fontMono, letterSpacing: "0.3px" }}>
                  How many orders does your team process per week?
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Under 100", "100–300", "300–500", "500–1,000", "1,000+"].map(opt => (
                    <button key={opt} onClick={() => setQualifyAnswers(a => ({ ...a, volume: opt }))} style={{
                      ...btnBase, padding: "8px 14px", borderRadius: T.radiusSm, fontSize: 12, fontWeight: 600,
                      background: qualifyAnswers.volume === opt ? T.accentLight : T.bg,
                      color: qualifyAnswers.volume === opt ? T.accent : T.textSecondary,
                      border: `1px solid ${qualifyAnswers.volume === opt ? T.accent : T.border}`,
                    }}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q2: ERP system */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 6, fontFamily: T.fontMono, letterSpacing: "0.3px" }}>
                  Which ERP system do you use?
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["NetSuite", "SAP", "Dynamics 365", "Sage", "QuickBooks", "Other"].map(opt => (
                    <button key={opt} onClick={() => setQualifyAnswers(a => ({ ...a, erp: opt }))} style={{
                      ...btnBase, padding: "8px 14px", borderRadius: T.radiusSm, fontSize: 12, fontWeight: 600,
                      background: qualifyAnswers.erp === opt ? T.accentLight : T.bg,
                      color: qualifyAnswers.erp === opt ? T.accent : T.textSecondary,
                      border: `1px solid ${qualifyAnswers.erp === opt ? T.accent : T.border}`,
                    }}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q3: Primary pain */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 6, fontFamily: T.fontMono, letterSpacing: "0.3px" }}>
                  What's your biggest order entry challenge?
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Manual re-keying takes too long", "Order errors & mis-ships", "Can't scale without adding headcount", "Too many order formats & channels"].map(opt => (
                    <button key={opt} onClick={() => setQualifyAnswers(a => ({ ...a, pain: opt }))} style={{
                      ...btnBase, padding: "8px 14px", borderRadius: T.radiusSm, fontSize: 12, fontWeight: 600,
                      background: qualifyAnswers.pain === opt ? T.accentLight : T.bg,
                      color: qualifyAnswers.pain === opt ? T.accent : T.textSecondary,
                      border: `1px solid ${qualifyAnswers.pain === opt ? T.accent : T.border}`,
                    }}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: "16px 24px 20px", borderTop: `1px solid ${T.borderLight}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowQualify(false)} style={{
                ...btnBase, padding: "10px 20px", borderRadius: T.radiusSm,
                background: T.bg, color: T.textSecondary, fontSize: 13, fontWeight: 600,
                border: `1px solid ${T.border}`,
              }}>Cancel</button>
              <button onClick={openCalendly}
                disabled={!qualifyAnswers.volume || !qualifyAnswers.erp || !qualifyAnswers.pain}
                style={{
                  ...btnBase, padding: "10px 24px", borderRadius: T.radiusSm,
                  background: (qualifyAnswers.volume && qualifyAnswers.erp && qualifyAnswers.pain) ? T.accent : "#E7E5E4",
                  color: (qualifyAnswers.volume && qualifyAnswers.erp && qualifyAnswers.pain) ? "#fff" : T.textTertiary,
                  fontSize: 13, fontWeight: 700,
                  cursor: (qualifyAnswers.volume && qualifyAnswers.erp && qualifyAnswers.pain) ? "pointer" : "not-allowed",
                }}>
                Book Your Walkthrough →
              </button>
            </div>
          </div>
        </div>
      )}

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
            <>
            <div className="flora-split-panel" style={{
              maxWidth: 1400, margin: "0 auto", padding: "16px 24px 40px",
              display: "grid",
              gridTemplateColumns: rawInputText ? "minmax(0, 2fr) minmax(0, 3fr)" : "1fr",
              gap: 24,
              alignItems: "start",
            }}>
              {/* ── Left Panel: Original Input (only for sample orders) ── */}
              {rawInputText && (
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
                    {processingImage && (
                      <div style={{ padding: 8, background: "#F8F8F6", borderBottom: `1px solid ${T.borderLight}` }}>
                        <img src={processingImage} alt={processingSource} style={{ width: "100%", display: "block", borderRadius: 4 }} />
                      </div>
                    )}
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
                      <span style={{ fontWeight: 600, color: T.textSecondary }}>This is exactly what Flora received.</span> Every field on the right was extracted from this {processingImage ? "document" : "raw text"} — nothing added, nothing assumed.
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* ── Right Panel: Automation Pipeline ── */}
              <div style={{ maxWidth: rawInputText ? "none" : 920, margin: rawInputText ? 0 : "0 auto", width: "100%" }}>
                <ResultsView data={result} onHighlight={setHighlightTerms} onGetStarted={handleGetStarted} onTryOwn={isUserUpload ? null : () => setShowTryOwn(true)} isUserUpload={isUserUpload} />
              </div>
            </div>

            {/* ── Try Flora AI with Your Order Form ── */}
            {showTryOwn && (
            <div style={{
              maxWidth: 720, margin: "0 auto", padding: "0 24px 80px",
              animation: "offade 0.4s ease",
            }}>
                <div style={{
                  borderRadius: T.radiusLg, background: T.surface,
                  border: `1px solid ${T.border}`, overflow: "hidden",
                  animation: "offade 0.2s ease",
                }}>
                  {/* Header */}
                  <div style={{
                    padding: "16px 20px", borderBottom: `1px solid ${T.borderLight}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>&#9889;</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Try Flora AI with Your Order</span>
                    </div>
                    <button onClick={() => { setShowTryOwn(false); setTryOwnMode(null); }} style={{
                      ...btnBase, padding: "4px 10px", borderRadius: T.radiusSm,
                      background: T.surfaceHover, color: T.textTertiary, fontSize: 12, fontWeight: 600,
                    }}>Close</button>
                  </div>

                  {/* Mode selection */}
                  {!tryOwnMode && (
                    <div style={{ padding: 20, display: "flex", gap: 12 }}>
                      <button onClick={() => setTryOwnMode("paste")} style={{
                        ...btnBase, flex: 1, padding: "24px 16px", borderRadius: T.radius,
                        border: `1px solid ${T.border}`, background: T.bg,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                        transition: "all 0.15s ease",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentLight; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}
                      >
                        <span style={{ fontSize: 24 }}>&#9999;&#65039;</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Paste Text</span>
                        <span style={{ fontSize: 11, color: T.textTertiary, lineHeight: 1.4, textAlign: "center" }}>Paste an email, chat, or PO text</span>
                      </button>
                      <button onClick={() => setTryOwnMode("upload")} style={{
                        ...btnBase, flex: 1, padding: "24px 16px", borderRadius: T.radius,
                        border: `1px solid ${T.border}`, background: T.bg,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                        transition: "all 0.15s ease",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentLight; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}
                      >
                        <span style={{ fontSize: 24 }}>&#128193;</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Upload File</span>
                        <span style={{ fontSize: 11, color: T.textTertiary, lineHeight: 1.4, textAlign: "center" }}>TXT, CSV, Excel, PDF, or image</span>
                      </button>
                    </div>
                  )}

                  {/* Paste mode */}
                  {tryOwnMode === "paste" && (
                    <div style={{ padding: 20 }}>
                      <button onClick={() => setTryOwnMode(null)} style={{
                        ...btnBase, padding: "4px 0", marginBottom: 12,
                        background: "none", color: T.textTertiary, fontSize: 12, fontWeight: 600,
                      }}>← Back</button>
                      <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                        placeholder={PASTE_PLACEHOLDER}
                        style={{
                          width: "100%", minHeight: 180, padding: 16,
                          borderRadius: T.radius, border: `1px solid ${T.border}`,
                          background: T.bg, color: T.text,
                          fontFamily: T.fontMono, fontSize: 13, lineHeight: 1.7,
                          resize: "vertical", marginBottom: 12,
                        }}
                        onFocus={e => e.target.style.borderColor = T.accent}
                        onBlur={e => e.target.style.borderColor = T.border}
                      />
                      <button onClick={() => { if (pasteText.trim()) { setShowTryOwn(false); setTryOwnMode(null); setIsUserUpload(true); extractOrder(pasteText, "Pasted text"); } }}
                        disabled={!pasteText.trim()}
                        style={{ ...btnBase, width: "100%", padding: 14, borderRadius: T.radius, background: pasteText.trim() ? T.accent : "#E7E5E4", color: pasteText.trim() ? "#fff" : T.textTertiary, fontWeight: 700, fontSize: 14, cursor: pasteText.trim() ? "pointer" : "not-allowed" }}
                      >Prepare ERP Draft →</button>
                    </div>
                  )}

                  {/* Upload mode */}
                  {tryOwnMode === "upload" && (
                    <div style={{ padding: 20 }}>
                      <button onClick={() => setTryOwnMode(null)} style={{
                        ...btnBase, padding: "4px 0", marginBottom: 12,
                        background: "none", color: T.textTertiary, fontSize: 12, fontWeight: 600,
                      }}>← Back</button>
                      <div onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.accent; }}
                        onDragLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                        onDrop={e => {
                          e.preventDefault(); e.currentTarget.style.borderColor = T.border;
                          const f = e.dataTransfer.files?.[0];
                          if (f && fileInputRef.current) { const dt = new DataTransfer(); dt.items.add(f); fileInputRef.current.files = dt.files; handleFileUpload({ target: fileInputRef.current }); }
                        }}
                        style={{
                          padding: "36px 24px", borderRadius: T.radius,
                          border: `2px dashed ${T.border}`, background: T.bg,
                          cursor: "pointer", textAlign: "center", marginBottom: 12,
                        }}
                      >
                        <input ref={fileInputRef} type="file" accept=".txt,.csv,.json,.xlsx,.xls,.pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} style={{ display: "none" }} />
                        <div style={{ fontSize: 32, marginBottom: 8 }}>&#128194;</div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 4 }}>
                          {uploadedFileName || "Drop a file here, or click to browse"}
                        </div>
                        <div style={{ fontSize: 12, color: T.textTertiary }}>TXT, CSV, Excel, PDF, and image files</div>
                      </div>
                      {uploadedText && (
                        <div style={{ animation: "offade 0.2s ease" }}>
                          <div style={{ background: T.bg, borderRadius: T.radius, border: `1px solid ${T.border}`, maxHeight: 160, overflow: "auto", marginBottom: 12 }}>
                            <pre style={{ padding: 14, fontFamily: T.fontMono, fontSize: 12, color: T.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                              {uploadedText.slice(0, 2000)}{uploadedText.length > 2000 && "\n… (truncated)"}
                            </pre>
                          </div>
                          <button onClick={() => { if (uploadedText.trim()) { setShowTryOwn(false); setTryOwnMode(null); setIsUserUpload(true); extractOrder(uploadedFileData ? "" : uploadedText, uploadedFileName, null, uploadedFileData); } }}
                            style={{ ...btnBase, width: "100%", padding: 14, borderRadius: T.radius, background: T.accent, color: "#fff", fontWeight: 700, fontSize: 14 }}
                            onMouseEnter={e => { e.target.style.background = T.accentDark; }}
                            onMouseLeave={e => { e.target.style.background = T.accent; }}
                          >Prepare ERP Draft →</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>
            )}
            </>
          )}
        </div>
      ) : (

      /* Input State */
      <>
        {/* Full-width Hero with background image */}
        <section style={{
          width: "100%",
          minHeight: 340,
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}>
          <div style={{
            textAlign: "left",
            maxWidth: 920,
            margin: "0 auto",
            width: "100%",
            padding: "80px 20px 60px",
            position: "relative",
            zIndex: 1,
          }}>
            <p style={{
              fontSize: 14, fontWeight: 600, color: T.accent,
              letterSpacing: "0.3px", marginBottom: 12,
            }}>
              Flora Order Intelligence
            </p>
            <h1 style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.8px", marginBottom: 16, color: T.text, maxWidth: 600 }}>
              Scale order volume with instant, AI-powered order processing
            </h1>
            <p style={{ fontSize: 16, color: T.textSecondary, maxWidth: 520, lineHeight: 1.65 }}>
              Flora reads orders from any channel and format, matches items to your catalog, and delivers verified, ERP-ready sales orders — without the re-keying.
            </p>
          </div>
        </section>

        {/* Section nav */}
        <nav style={{
          borderBottom: `1px solid ${T.border}`,
          background: T.bg,
          position: "sticky", top: 56, zIndex: 40,
        }}>
          <div style={{
            maxWidth: 920, margin: "0 auto", padding: "0 20px",
            display: "flex", gap: 0, overflow: "auto",
          }}>
            {[
              { label: "Try Flora", id: "try-flora" },
              { label: "Features", id: "features" },
              { label: "Value", id: "value" },
              { label: "Integrations", id: "integrations" },
              { label: "Get Started", id: "get-started" },
            ].map(item => (
              <a key={item.id} href={`#${item.id}`}
                onClick={e => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                style={{
                  ...btnBase, padding: "14px 20px",
                  fontSize: 13, fontWeight: 600, color: T.textSecondary,
                  textDecoration: "none", whiteSpace: "nowrap",
                  borderBottom: "2px solid transparent",
                  transition: "color 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={e => { e.target.style.color = T.accent; e.target.style.borderBottomColor = T.accent; }}
                onMouseLeave={e => { e.target.style.color = T.textSecondary; e.target.style.borderBottomColor = "transparent"; }}
              >{item.label}</a>
            ))}
          </div>
        </nav>

        {/* Content below hero — centered narrow layout */}
        <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px 80px" }}>

            {/* Try Flora section */}
            <div id="try-flora" style={{ marginBottom: 24, scrollMarginTop: 120 }}>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.3px", marginBottom: 8 }}>
                  See Flora in action
                </h2>
                <p style={{ fontSize: 14, color: T.textSecondary, maxWidth: 480, lineHeight: 1.6 }}>
                  Pick a sample order below to watch Flora process it in real time
                </p>
              </div>
            </div>

            {/* Sample Order Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 12 }}>
              {SAMPLE_ORDERS.map(s => (
                <button key={s.id}
                  onClick={() => { setIsUserUpload(false); extractOrder(s.content, s.label, s.image); }}
                  onMouseEnter={() => setHoveredSample(s.id)}
                  onMouseLeave={() => setHoveredSample(null)}
                  style={{
                    ...btnBase, padding: 0, borderRadius: T.radius, textAlign: "left",
                    border: `1px solid ${hoveredSample === s.id ? T.accent : T.border}`,
                    background: T.surface,
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    position: "relative", transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
                    boxShadow: hoveredSample === s.id ? `0 4px 12px ${T.accent}25` : `0 1px 3px rgba(0,0,0,0.04)`,
                    transform: hoveredSample === s.id ? "translateY(-2px)" : "none",
                  }}>
                  {s.image ? (
                    <div style={{ width: "100%", height: 100, overflow: "hidden", borderBottom: `1px solid ${T.borderLight}`, background: "#F5F5F4" }}>
                      <img src={s.image} alt={s.label} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", opacity: 0.85 }} />
                    </div>
                  ) : (
                    <div style={{ padding: "14px 14px 0" }}>
                      <span style={{ fontSize: 22 }}>{s.icon}</span>
                    </div>
                  )}
                  <div style={{ padding: s.image ? "10px 14px 6px" : "8px 14px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: T.textTertiary, lineHeight: 1.4 }}>{s.description}</span>
                  </div>
                  {/* Persistent action label */}
                  <div style={{
                    padding: "8px 14px 12px",
                    marginTop: "auto",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: hoveredSample === s.id ? T.accent : T.textTertiary,
                      transition: "color 0.15s ease",
                    }}>
                      Process this order
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: hoveredSample === s.id ? T.accent : T.textTertiary,
                      transition: "color 0.15s ease, transform 0.15s ease",
                      transform: hoveredSample === s.id ? "translateX(2px)" : "none",
                      display: "inline-block",
                    }}>→</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Features */}
            <div id="features" style={{ marginTop: 56, scrollMarginTop: 120 }}>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.3px", marginBottom: 8 }}>
                  Explore what's possible with Flora
                </h2>
                <p style={{ fontSize: 14, color: T.textSecondary, maxWidth: 480, lineHeight: 1.6 }}>
                  What Flora does with every order
                </p>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
              }}>
                {[
                  {
                    icon: "\uD83D\uDCE8",
                    title: "Multi-format intake",
                    desc: "Reads orders from email, PDF, spreadsheet, chat, or image — no templates, no formatting requirements.",
                  },
                  {
                    icon: "\uD83D\uDD17",
                    title: "Customer code cross-referencing",
                    desc: "Maps your customers' item codes to your internal SKUs automatically. No manual lookup tables.",
                  },
                  {
                    icon: "\u2696\uFE0F",
                    title: "Smart validation",
                    desc: "Flags vague dates, approximate quantities, and missing fields — makes its best guess, but always asks before submitting.",
                  },
                  {
                    icon: "\uD83D\uDD04",
                    title: "Repeat order intelligence",
                    desc: "Recognizes returning customers and shows what changed — new items, quantity shifts, dropped products — at a glance.",
                  },
                  {
                    icon: "\uD83D\uDCCB",
                    title: "Fulfillment-ready memo",
                    desc: "Distills scattered notes and special instructions into a clean action list your warehouse team can act on immediately.",
                  },
                  {
                    icon: "\u26A1",
                    title: "ERP-ready draft in seconds",
                    desc: "Generates a complete sales order — customer, line items, matched SKUs, pricing, shipping — ready to review and book.",
                  },
                ].map(f => (
                  <div key={f.title} style={{ padding: "20px 0" }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div id="value" style={{ marginTop: 48, scrollMarginTop: 120 }}>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.3px", marginBottom: 8 }}>
                  The impact of automating order entry
                </h2>
                <p style={{ fontSize: 14, color: T.textSecondary, maxWidth: 480, lineHeight: 1.6 }}>
                  What teams see after switching to Flora
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>
                {[
                  { value: "60-80%", label: "Reduction in manual order entry", context: "Avg. across teams processing 200\u20131,000 orders/week" },
                  { value: "$250K+", label: "Annual labor cost savings", context: "For a 10-person order desk handling 500 orders/week" },
                  { value: "$200K+", label: "Prevented error & chargeback costs", context: "Based on industry avg. 2\u20135% order error rate" },
                  { value: "<10%", label: "Of orders need human review", context: "After 30 days of learning your catalog" },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: "20px 16px", borderRadius: T.radius, background: T.surface, border: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: T.fontMono, fontSize: 24, fontWeight: 800, color: T.accent, marginBottom: 4 }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: T.textSecondary, fontWeight: 500, marginBottom: 6 }}>{stat.label}</div>
                    <div style={{ fontSize: 11, color: T.textTertiary, lineHeight: 1.4 }}>{stat.context}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration context */}
            <div id="integrations" style={{ marginTop: 24, scrollMarginTop: 120 }}>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.3px", marginBottom: 8 }}>
                  Fits your stack. Not the other way around.
                </h2>
                <p style={{ fontSize: 14, color: T.textSecondary, maxWidth: 480, lineHeight: 1.6 }}>
                  Flora connects to your existing ERP and email systems. No rip-and-replace.
                </p>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}>
                {[
                  { label: "ERP Systems", items: "SAP, NetSuite, Dynamics, Sage" },
                  { label: "Order Channels", items: "Email, Portal, Chat, Web Forms" },
                  { label: "File Formats", items: "PDF, Excel, CSV, Images, Text" },
                  { label: "Connectivity", items: "REST API, SFTP, Webhooks" },
                ].map(group => (
                  <div key={group.label} style={{
                    padding: "16px 14px", borderRadius: T.radiusSm,
                    background: T.surface, border: `1px solid ${T.border}`,
                  }}>
                    <div style={{
                      fontFamily: T.fontMono, fontSize: 13, fontWeight: 800,
                      color: T.accent, letterSpacing: "0.5px",
                      textTransform: "uppercase", marginBottom: 6,
                    }}>
                      {group.label}
                    </div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                      {group.items}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust signals */}
              <div style={{
                marginTop: 20, paddingTop: 16,
                borderTop: `1px solid ${T.border}`,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}>
                {[
                  { icon: "\uD83C\uDFED", label: "Mid-market manufacturers", desc: "Built for teams processing 300–500 orders/week" },
                  { icon: "\uD83D\uDD12", label: "SOC 2 compliant", desc: "Enterprise-grade security and data handling" },
                  { icon: "\uD83D\uDCE6", label: "Multi-channel intake", desc: "Email, fax, portal, chat — one workflow" },
                  { icon: "\u26A1", label: "Live in under 2 weeks", desc: "Fast onboarding with your real orders" },
                ].map(item => (
                  <div key={item.label} style={{ padding: "12px 0" }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>{item.icon} <span style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{item.label}</span></div>
                    <div style={{ fontSize: 12, color: T.textTertiary, lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div id="get-started" style={{
              marginTop: 40, scrollMarginTop: 120,
              padding: "32px 20px",
              borderRadius: T.radiusLg,
              background: T.accentLight,
              border: `1px solid #BFDBFE`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                Ready to stop re-keying orders?
              </div>
              <p style={{ fontSize: 14, color: T.textSecondary, marginBottom: 20, maxWidth: 420 }}>
                See Flora process your real orders in a 30-minute walkthrough with your team.
              </p>
              <button onClick={handleGetStarted} style={{
                ...btnBase, padding: "14px 36px", borderRadius: T.radius,
                background: T.accent, color: "#fff", fontWeight: 700, fontSize: 14,
                boxShadow: `0 1px 3px ${T.accent}40`,
              }}
                onMouseEnter={e => { e.target.style.background = T.accentDark; e.target.style.boxShadow = `0 4px 12px ${T.accent}30`; }}
                onMouseLeave={e => { e.target.style.background = T.accent; e.target.style.boxShadow = `0 1px 3px ${T.accent}40`; }}
              >Get Started with Flora →</button>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #BFDBFE" }}>
                {!showBottomTryOwn ? (
                  <button onClick={() => setShowBottomTryOwn(true)} style={{
                    ...btnBase, display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 16px", borderRadius: T.radius,
                    background: "rgba(255,255,255,0.6)", border: `1px solid #BFDBFE`,
                    fontSize: 13, fontWeight: 600, color: T.accent,
                    transition: "all 0.15s ease",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = T.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                  >
                    <span style={{ fontSize: 14 }}>&#9889;</span>
                    Or try Flora with your own order →
                  </button>
                ) : (
                  <div style={{ animation: "offade 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>&#9889; Try with your own order</span>
                      <button onClick={() => { setShowBottomTryOwn(false); setBottomTryOwnMode(null); }} style={{
                        ...btnBase, padding: "2px 8px", borderRadius: T.radiusSm,
                        background: "rgba(255,255,255,0.6)", color: T.textTertiary, fontSize: 11, fontWeight: 600,
                      }}>Close</button>
                    </div>
                    {!bottomTryOwnMode ? (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setBottomTryOwnMode("paste")} style={{
                          ...btnBase, flex: 1, padding: "16px 12px", borderRadius: T.radius,
                          border: `1px solid #BFDBFE`, background: "rgba(255,255,255,0.6)",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          transition: "all 0.15s ease",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = T.accent; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                        >
                          <span style={{ fontSize: 20 }}>&#9999;&#65039;</span>
                          <span style={{ fontWeight: 700, fontSize: 12, color: T.text }}>Paste Text</span>
                        </button>
                        <button onClick={() => setBottomTryOwnMode("upload")} style={{
                          ...btnBase, flex: 1, padding: "16px 12px", borderRadius: T.radius,
                          border: `1px solid #BFDBFE`, background: "rgba(255,255,255,0.6)",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          transition: "all 0.15s ease",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = T.accent; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                        >
                          <span style={{ fontSize: 20 }}>&#128193;</span>
                          <span style={{ fontWeight: 700, fontSize: 12, color: T.text }}>Upload File</span>
                        </button>
                      </div>
                    ) : bottomTryOwnMode === "paste" ? (
                      <div>
                        <textarea
                          value={pasteText}
                          onChange={e => setPasteText(e.target.value)}
                          placeholder={PASTE_PLACEHOLDER}
                          style={{ width: "100%", minHeight: 100, padding: 12, borderRadius: T.radius, border: `1px solid #BFDBFE`, background: "#fff", fontFamily: T.fontMono, fontSize: 12, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = T.accent}
                          onBlur={e => e.target.style.borderColor = "#BFDBFE"}
                        />
                        <button onClick={() => { if (pasteText.trim()) { setShowBottomTryOwn(false); setBottomTryOwnMode(null); setIsUserUpload(true); extractOrder(pasteText, "Pasted text"); } }}
                          disabled={!pasteText.trim()}
                          style={{ ...btnBase, width: "100%", marginTop: 8, padding: 12, borderRadius: T.radius, background: pasteText.trim() ? T.accent : "#CBD5E1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: pasteText.trim() ? "pointer" : "not-allowed" }}
                        >Prepare ERP Draft →</button>
                      </div>
                    ) : (
                      <div>
                        <label style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 20,
                          borderRadius: T.radius, border: `2px dashed #BFDBFE`, background: "#fff",
                          cursor: "pointer", transition: "all 0.15s ease",
                        }}>
                          <span style={{ fontSize: 24 }}>&#128193;</span>
                          <span style={{ fontSize: 12, color: T.textSecondary }}>{uploadedFileName || "Drop a file here, or click to browse"}</span>
                          <input type="file" accept=".txt,.csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileUpload} />
                        </label>
                        {uploadedText && (
                          <button onClick={() => { if (uploadedText.trim()) { setShowBottomTryOwn(false); setBottomTryOwnMode(null); setIsUserUpload(true); extractOrder(uploadedFileData ? "" : uploadedText, uploadedFileName, null, uploadedFileData); } }}
                            style={{ ...btnBase, width: "100%", marginTop: 8, padding: 12, borderRadius: T.radius, background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13 }}
                          >Prepare ERP Draft →</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
        </main>
      </>
      )}
    </div>
  );
}
