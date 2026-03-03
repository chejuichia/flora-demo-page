# Order-to-Cash Rule Engine Architecture

## Context

The Flora demo currently embeds all business logic as ad-hoc functions and inline code in a single JSX file. As we build the real product, every new customer would require code changes for their specific rules (custom SKU mappings, substitution policies, validation thresholds, shipping logic, etc.), causing rule sprawl and making the system unmaintainable.

**Goal**: Abstract every rule, transformation, and validation in the demo into a universal, configuration-driven rule engine so that:
- Customer-specific behavior is a **config extension**, not a code change
- The processing pipeline is a **declarative DAG**, not hardcoded function calls
- New rule types compose from **5 universal primitives**, not bespoke functions

---

## Architecture: 3-Layer System

```
┌─────────────────────────────────────────────┐
│  CUSTOMER LAYER  (per-customer JSON config)  │  ← overrides & extensions
├─────────────────────────────────────────────┤
│  SEMANTIC LAYER  (default rules & fields)    │  ← universal O2C rules
├─────────────────────────────────────────────┤
│  PLATFORM LAYER  (engine + stage runners)    │  ← executes any config
└─────────────────────────────────────────────┘
```

**Platform Layer** — The engine. Reads pipeline configs, executes stages in dependency order, passes data between stages. Never changes per customer.

**Semantic Layer** — The O2C ontology + default rules. Defines what every entity, field, relationship, and state means in order-to-cash. The ontology is the shared knowledge model that both the AI and the rule engine reason against. Default configs (thresholds, field mappings, match types) are implementations of the ontology's rules. Ships with the product. Any customer gets these out of the box.

**Customer Layer** — Per-customer overrides. Customer-specific SKU cross-reference maps, substitution policies, catalog data, order history connections, custom validation rules. Merges on top of semantic layer. Customer configs extend the ontology (e.g., add custom fields, override term defaults) but cannot contradict its core structure.

---

## O2C Ontology (Semantic Layer Core)

The ontology is the domain knowledge model that lives inside the Semantic Layer. It defines what things *are*, how they *relate*, what *states* they can be in, and what *inferences* are valid. Both the AI (for extraction and reasoning) and the rule engine (for processing) reference this single ontology.

### Entity-Relationship Model

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   CUSTOMER   │──1:N──│      ORDER       │──1:N──│  LINE ITEM   │
│              │       │                  │       │              │
│ id           │       │ id               │       │ id           │
│ name         │       │ po_reference     │       │ sku          │
│ segment      │       │ order_date       │       │ description  │
│ region       │       │ input_channel    │       │ quantity     │
│ currency     │       │ status           │       │ uom          │
│ payment_terms│       │ sales_rep        │       │ unit_price   │
│ credit_limit │       │ memo             │       │ line_total   │
│ credit_hold  │       │ currency         │       │ notes        │
│ tax_exempt   │       │ subtotal         │       │              │
└──────┬───────┘       │ tax              │       └──────┬───────┘
       │               │ total            │              │
       │               └────────┬─────────┘              │
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   CONTRACT   │       │   FULFILLMENT    │       │   PRODUCT    │
│              │       │                  │       │   (Catalog)  │
│ id           │       │ ship_to_address  │       │ sku          │
│ customer_id  │       │ requested_date   │       │ name         │
│ effective    │       │ shipping_method  │       │ category     │
│ expiration   │       │ ship_group       │       │ price        │
│ pricing[]    │       │ carrier          │       │ uom          │
│ terms        │       │ tracking         │       │ stock        │
│ min_order    │       │ status           │       │ substitutes[]│
└──────────────┘       └──────────────────┘       │ hs_code      │
                                                  └──────────────┘
       ┌──────────────┐       ┌──────────────────┐
       │ ORDER HISTORY│       │   CREDIT ACCOUNT │
       │              │       │                  │
       │ customer_id  │       │ customer_id      │
       │ orders[]     │       │ credit_limit     │
       │ last_order   │       │ available_credit │
       │ total_orders │       │ credit_hold      │
       │ customer_    │       │ overdue_invoices[]│
       │   since      │       │ payment_terms    │
       └──────────────┘       └──────────────────┘
```

### Entity Definitions

```json
{
  "entities": {
    "customer": {
      "description": "The buyer placing the order. May be a company or individual. Identified by name, account number, or cross-referenced from order context.",
      "identity_resolution": "Matched by name (fuzzy), account number (exact), or email domain. Customer layer may define aliases.",
      "key_fields": {
        "id": { "type": "uuid", "semantic": "Internal unique identifier" },
        "name": { "type": "string", "semantic": "Legal or trading name of the buyer", "extractable": true },
        "segment": { "type": "enum", "values": ["enterprise", "mid_market", "smb", "retail"], "semantic": "Business tier for pricing and terms" },
        "region": { "type": "string", "semantic": "Geographic region for tax, currency, and fulfillment routing" },
        "default_currency": { "type": "currency_code", "semantic": "Customer's preferred transaction currency" },
        "payment_terms": { "type": "string", "semantic": "Agreed payment terms (e.g., Net 30, Net 60, COD)", "default": "Net 30" },
        "tax_exempt": { "type": "boolean", "semantic": "Whether customer is exempt from sales tax", "default": false }
      },
      "relationships": {
        "has_many": ["orders", "contracts", "item_xrefs"],
        "has_one": ["credit_account", "order_history"]
      }
    },
    "order": {
      "description": "A purchase request from a customer. Originates from any input channel (fax, email, chat, EDI, portal). Progresses through a lifecycle from raw input to fulfilled/invoiced.",
      "key_fields": {
        "id": { "type": "uuid", "semantic": "Internal unique identifier" },
        "po_reference": { "type": "string", "semantic": "Customer's purchase order number — their tracking ID, not ours", "extractable": true },
        "order_date": { "type": "date", "semantic": "Date the customer placed/sent the order", "extractable": true },
        "input_channel": { "type": "enum", "values": ["fax", "email", "chat", "excel", "pdf", "edi", "api", "portal"], "semantic": "How the order was received" },
        "status": { "type": "enum", "semantic": "Current lifecycle state (see State Machine)" },
        "memo": { "type": "text", "semantic": "AI-summarized action items from all notes, flags, and special instructions", "generated": true },
        "currency": { "type": "currency_code", "semantic": "Transaction currency (may differ from customer default)", "extractable": true }
      },
      "relationships": {
        "belongs_to": ["customer"],
        "has_many": ["line_items", "fulfillments", "flags", "events"]
      }
    },
    "line_item": {
      "description": "A single product line on an order. Links an extracted item to a catalog product through matching. Quantity and UoM may be converted. Price may come from catalog, contract, or PO.",
      "key_fields": {
        "id": { "type": "uuid", "semantic": "Internal line identifier" },
        "sku": { "type": "string", "semantic": "Product identifier — may be customer code (pre-xref), internal SKU (post-xref), or freetext", "extractable": true },
        "description": { "type": "string", "semantic": "Product description as stated by customer", "extractable": true },
        "quantity": { "type": "decimal", "semantic": "Amount ordered in the stated UoM. May need conversion to catalog UoM.", "extractable": true },
        "uom": { "type": "string", "semantic": "Unit of measure as stated by customer (e.g., cases, lbs, each). May differ from catalog UoM.", "extractable": true },
        "unit_price": { "type": "decimal", "semantic": "Per-unit price. Priority: contract price > PO price > catalog price", "extractable": true },
        "notes": { "type": "text", "semantic": "Line-level special instructions (substitution preferences, rush flags, etc.)", "extractable": true }
      },
      "derived_fields": {
        "catalog_sku": { "semantic": "Resolved internal SKU after xref and matching", "derived_from": "sku_matching stage" },
        "line_total": { "semantic": "quantity × unit_price", "formula": "quantity * unit_price" },
        "match_type": { "semantic": "How the SKU was resolved", "values": ["exact", "sku_partial", "xref", "substitution", "fuzzy", "none"] },
        "match_confidence": { "semantic": "AI/engine confidence in the match", "values": ["high", "medium", "low"] }
      },
      "relationships": {
        "belongs_to": ["order"],
        "references": ["product"]
      }
    },
    "product": {
      "description": "A catalog item available for sale. The source of truth for SKU, pricing, UoM, and stock levels.",
      "key_fields": {
        "sku": { "type": "string", "semantic": "Unique internal product identifier" },
        "name": { "type": "string", "semantic": "Canonical product name" },
        "category": { "type": "string", "semantic": "Product category for grouping and reporting" },
        "price": { "type": "decimal", "semantic": "List price per unit (may be overridden by contract)" },
        "uom": { "type": "string", "semantic": "Native unit of measure in the ERP/catalog" },
        "stock": { "type": "integer", "semantic": "Current available inventory in native UoM" },
        "substitutes": { "type": "array<sku>", "semantic": "Authorized substitute products when this item is OOS" },
        "hs_code": { "type": "string", "semantic": "Harmonized System code for cross-border tariff classification" }
      },
      "relationships": {
        "referenced_by": ["line_items"],
        "has_many": ["substitute_products"]
      }
    },
    "fulfillment": {
      "description": "A shipment or delivery group within an order. An order may have multiple fulfillments (split shipping).",
      "key_fields": {
        "ship_to_address": { "type": "address", "semantic": "Physical delivery destination", "extractable": true },
        "requested_date": { "type": "date", "semantic": "When the customer wants delivery. May be explicit, relative ('next Tuesday'), or vague ('ASAP').", "extractable": true },
        "shipping_method": { "type": "enum", "values": ["Standard Ground", "Express", "Freight LTL", "Will Call"], "semantic": "Shipping speed/method. May be inferred from notes (RUSH → Express)." },
        "ship_group": { "type": "string", "semantic": "Grouping label for split shipments (by address, urgency, or availability)" },
        "status": { "type": "enum", "values": ["pending", "shipped", "delivered", "backordered"], "semantic": "Fulfillment progress" }
      },
      "relationships": {
        "belongs_to": ["order"],
        "has_many": ["line_items"]
      }
    },
    "contract": {
      "description": "A pricing agreement between the company and a customer. Defines negotiated rates, terms, and policies that override catalog defaults.",
      "key_fields": {
        "id": { "type": "uuid", "semantic": "Contract identifier" },
        "effective_date": { "type": "date", "semantic": "When the contract starts" },
        "expiration_date": { "type": "date", "semantic": "When the contract expires" },
        "pricing": { "type": "array", "semantic": "Per-SKU contracted prices", "items": { "sku": "string", "contracted_price": "decimal", "min_qty": "integer" } },
        "terms": { "type": "string", "semantic": "Payment terms under this contract" },
        "min_order_value": { "type": "decimal", "semantic": "Minimum order value required under this contract" }
      },
      "relationships": {
        "belongs_to": ["customer"]
      }
    }
  }
}
```

### Order Lifecycle State Machine

Every order progresses through a defined lifecycle. Transitions are triggered by pipeline stages, human actions, or external events.

```
                    ┌─────────┐
        ┌───────────│  DRAFT  │───────────┐
        │           └────┬────┘           │
        │                │                │
        │         ┌──────▼──────┐         │
        │         │   PENDING   │         │
        │         │   REVIEW    │         │
        │         └──────┬──────┘         │
        │                │                │
   ┌────▼────┐    ┌──────▼──────┐         │
   │ ON HOLD │    │  APPROVED   │         │
   │ (credit)│    └──────┬──────┘         │
   └────┬────┘           │                │
        │         ┌──────▼──────┐   ┌─────▼─────┐
        └────────►│ FULFILLING  │   │ CANCELLED │
                  └──┬───────┬──┘   └───────────┘
                     │       │
          ┌──────────▼┐  ┌──▼──────────┐
          │ PARTIALLY │  │   SHIPPED   │
          │ FULFILLED │  └──────┬──────┘
          └─────┬─────┘        │
                │       ┌──────▼──────┐
                └──────►│  INVOICED   │
                        └──────┬──────┘
                        ┌──────▼──────┐
                        │   CLOSED    │
                        └─────────────┘
```

```json
{
  "order_states": {
    "draft": {
      "description": "AI has assembled a draft order from extracted data. Awaiting human review.",
      "entry_trigger": "draft_assembly stage completes",
      "valid_transitions": ["pending_review", "cancelled"],
      "allowed_actions": ["edit_fields", "add_line_items", "remove_line_items", "override_flags"]
    },
    "pending_review": {
      "description": "Draft has unresolved flags (low confidence matches, assumptions, missing fields). Requires human verification.",
      "entry_trigger": "validation stage produces flags with severity >= warning",
      "valid_transitions": ["approved", "on_hold", "cancelled"],
      "auto_transition": {
        "to": "approved",
        "condition": "all flags resolved or overridden AND no critical flags"
      }
    },
    "approved": {
      "description": "Order is verified and ready for fulfillment. All flags resolved.",
      "entry_trigger": "Human approves OR auto-transition from pending_review",
      "valid_transitions": ["fulfilling", "cancelled"],
      "side_effects": ["submit_to_erp", "reserve_inventory"]
    },
    "on_hold": {
      "description": "Order blocked by credit hold, compliance issue, or manual hold.",
      "entry_trigger": "credit_check raises critical flag OR manual hold",
      "valid_transitions": ["approved", "cancelled"],
      "requires": "credit_manager_approval OR hold_release"
    },
    "fulfilling": {
      "description": "Order is being picked, packed, and shipped.",
      "valid_transitions": ["shipped", "partially_fulfilled"]
    },
    "partially_fulfilled": {
      "description": "Some line items shipped, others backordered or pending.",
      "valid_transitions": ["shipped", "fulfilling"]
    },
    "shipped": {
      "description": "All items shipped to customer.",
      "valid_transitions": ["invoiced"]
    },
    "invoiced": {
      "description": "Invoice generated and sent to customer.",
      "valid_transitions": ["closed"]
    },
    "closed": {
      "description": "Payment received, order complete.",
      "terminal": true
    },
    "cancelled": {
      "description": "Order cancelled before fulfillment.",
      "terminal": true
    }
  }
}
```

### Field Semantics & Extraction Intelligence

Every extractable field carries semantic metadata that tells the AI *what it means*, *how to find it*, *what ambiguity looks like*, and *what to do when it's missing*.

```json
{
  "field_semantics": {
    "customer.name": {
      "semantic": "The buyer's business or personal name",
      "extraction_hints": ["letterhead", "from field", "account name", "bill-to section"],
      "ambiguity_signals": ["multiple names present", "name vs contact person confusion"],
      "validation": { "required": true },
      "ai_instruction": "Extract the company/business name, not the contact person. If both are present, the company name is the customer."
    },
    "order.po_reference": {
      "semantic": "The customer's internal purchase order number for their tracking",
      "extraction_hints": ["PO#", "Purchase Order", "Order #", "Reference", "Ref"],
      "ambiguity_signals": ["multiple reference numbers", "internal vs external PO confusion"],
      "validation": { "required": false, "flag_if_missing": { "type": "missing_field", "message": "No PO reference found — customer may need one for invoice matching" } },
      "ai_instruction": "This is the CUSTOMER'S reference number, not ours. Look for PO#, Purchase Order #, or Reference # on the document."
    },
    "order.order_date": {
      "semantic": "The date the customer placed or sent this order",
      "extraction_hints": ["date on letterhead", "email sent date", "fax timestamp", "order date field"],
      "ambiguity_signals": ["date format ambiguity (MM/DD vs DD/MM)", "multiple dates present", "relative dates"],
      "validation": { "required": true, "type": "date", "must_be": "past_or_today" },
      "transforms": {
        "relative_to_absolute": { "base": "document_date_or_today", "patterns": ["next {weekday}", "in {n} days", "end of month"] },
        "incomplete_to_assumed": { "patterns": ["March 15" → "2026-03-15 (assumed current year)"] }
      },
      "ai_instruction": "Extract the date the order was created/sent. If only a partial date (e.g., 'March 15' without year), assume current year and flag as incomplete_date."
    },
    "fulfillment.requested_date": {
      "semantic": "When the customer wants the order delivered or available",
      "extraction_hints": ["delivery date", "ship by", "need by", "required by", "ETA"],
      "ambiguity_signals": ["vague timing (ASAP, soon, next week)", "ship date vs delivery date confusion"],
      "validation": { "required": false, "type": "date", "must_be": "future_or_today" },
      "transforms": {
        "vague_to_assumed": {
          "ASAP": "today + 1 business day",
          "next week": "next Monday",
          "end of month": "last business day of current month",
          "soon": "today + 3 business days"
        }
      },
      "ai_instruction": "Extract the DELIVERY date (when customer wants to receive), not the ship date. If vague ('ASAP', 'next week'), extract the literal text and flag as vague_timing."
    },
    "line_item.quantity": {
      "semantic": "How many units the customer wants, in their stated unit of measure",
      "extraction_hints": ["qty", "quantity", "amount", "# of", "count"],
      "ambiguity_signals": ["approximate quantities ('about 50', '~100')", "range quantities ('50-60')", "implicit quantity (missing = assumed 1)"],
      "validation": { "required": true, "type": "number", "must_be": "positive" },
      "transforms": {
        "approximate_to_value": { "pattern": "~{n} or about {n} or approx {n}", "action": "use {n}, flag as approximate_quantity" },
        "range_to_value": { "pattern": "{low}-{high}", "action": "use {high}, flag as approximate_quantity" },
        "missing_to_default": { "action": "assume 1, flag as missing_field" }
      },
      "ai_instruction": "Extract the numeric quantity. If approximate ('about 50'), extract 50 and flag. If a range ('50-60'), extract the higher number and flag. If missing, assume 1 and flag."
    },
    "line_item.uom": {
      "semantic": "The unit of measure as stated by the customer. May not match catalog UoM.",
      "extraction_hints": ["unit", "UOM", "per", "each", "case", "lb", "kg"],
      "validation": { "required": false },
      "ai_instruction": "Extract the unit exactly as the customer stated it (e.g., 'cases', 'lbs', 'ea'). The system will handle conversion to the catalog's native UoM."
    },
    "line_item.notes": {
      "semantic": "Per-line special instructions from the customer",
      "extraction_hints": ["parenthetical notes", "asterisks", "footnotes", "annotations next to line items"],
      "contains_signals": {
        "substitution": ["ok to sub", "substitute", "alternative", "or equivalent"],
        "rush": ["RUSH", "urgent", "ASAP", "expedite", "priority"],
        "customer_code": ["our item #", "our code", "our SKU", "our part #"],
        "special_handling": ["fragile", "refrigerate", "keep frozen", "hazmat"]
      },
      "ai_instruction": "Capture any notes, annotations, or special instructions associated with this specific line item. These may contain substitution preferences, rush indicators, or handling instructions."
    },
    "fulfillment.shipping_method": {
      "semantic": "How the order should be shipped. May be explicitly stated or inferred from context.",
      "inference_rules": [
        { "signal": "RUSH|urgent|ASAP|expedite|priority ship", "infer": "Express", "confidence": "medium", "flag": true },
        { "signal": "freight|LTL|truck|pallet", "infer": "Freight LTL", "confidence": "high", "flag": false },
        { "signal": "pick up|will call|customer pickup", "infer": "Will Call", "confidence": "high", "flag": false },
        { "signal": "none detected", "infer": "Standard Ground", "confidence": "high", "flag": false }
      ],
      "ai_instruction": "If the shipping method is explicitly stated, extract it. If not, look for keywords like RUSH, freight, will call in notes. The system will infer the method and flag for review if it's an assumption."
    }
  }
}
```

### Inference & Derivation Rules

Defines what the AI and rule engine can *derive* from extracted data vs what must be *explicitly stated*. This is the knowledge that lets the system reason about orders.

```json
{
  "inference_types": {
    "identity_resolution": {
      "description": "Resolving who the customer is from partial or ambiguous input",
      "examples": [
        { "input": "GreenHaven Mkt", "resolution": "GreenHaven Market", "method": "fuzzy_name_match" },
        { "input": "Order from sarah@greenhaven.com", "resolution": "GreenHaven Market", "method": "email_domain_match" },
        { "input": "Account #GH-4521", "resolution": "GreenHaven Market", "method": "account_number_lookup" }
      ],
      "confidence": "varies",
      "flag_when": "confidence < high"
    },
    "reference_resolution": {
      "description": "Resolving references to external data (history, contracts, previous orders)",
      "examples": [
        { "input": "Same as last month", "resolution": "Pull last order for this customer and use as baseline", "method": "order_history_lookup" },
        { "input": "Per our contract pricing", "resolution": "Look up active contract for this customer", "method": "contract_lookup" },
        { "input": "Reorder PO-2025-0891", "resolution": "Pull specific historical PO and duplicate", "method": "po_reference_lookup" }
      ],
      "requires": "order_history OR contract data",
      "flag_when": "reference not found"
    },
    "temporal_resolution": {
      "description": "Converting relative or vague time references to absolute dates",
      "examples": [
        { "input": "next Tuesday", "resolution": "2026-03-10", "method": "relative_date_calc", "base": "order_date" },
        { "input": "March 15", "resolution": "2026-03-15", "method": "assume_current_year", "flag": "incomplete_date" },
        { "input": "ASAP", "resolution": "2026-03-04", "method": "vague_to_assumed", "flag": "vague_timing" },
        { "input": "end of Q1", "resolution": "2026-03-31", "method": "business_period_calc" }
      ]
    },
    "quantity_interpretation": {
      "description": "Interpreting non-exact quantity expressions",
      "examples": [
        { "input": "about 50 cases", "resolution": { "qty": 50, "uom": "cases" }, "flag": "approximate_quantity" },
        { "input": "50-60 units", "resolution": { "qty": 60, "uom": "units" }, "flag": "approximate_quantity", "note": "Use upper bound" },
        { "input": "a few pallets", "resolution": { "qty": 3, "uom": "pallets" }, "flag": "approximate_quantity" }
      ]
    },
    "intent_detection": {
      "description": "Detecting implicit customer intent from language patterns",
      "patterns": {
        "substitution_authorized": {
          "signals": ["ok to sub", "or equivalent", "or similar", "substitute if necessary"],
          "infers": "Customer authorizes product substitution for this line item"
        },
        "rush_order": {
          "signals": ["RUSH", "urgent", "ASAP", "expedite", "need it yesterday", "priority ship"],
          "infers": "Express shipping method, flag for review"
        },
        "repeat_order": {
          "signals": ["same as last", "usual order", "reorder", "standing order", "repeat"],
          "infers": "Pull from order history, diff against current request"
        },
        "partial_fulfillment_ok": {
          "signals": ["ship what's available", "backorder the rest", "partial ship ok"],
          "infers": "Split fulfillment by availability"
        },
        "price_reference": {
          "signals": ["per our agreement", "contract price", "as quoted", "at the agreed rate"],
          "infers": "Use contract pricing, not catalog pricing"
        }
      }
    }
  }
}
```

### Validation Taxonomy

Defines the complete hierarchy of what makes an order valid, flagged, or blocked. This is the ontology's knowledge about order quality.

```json
{
  "validation_hierarchy": {
    "critical": {
      "description": "Order cannot proceed. Requires resolution before draft.",
      "blocks": "draft_assembly",
      "examples": ["credit_hold", "no_customer_match", "all_items_unmatched"],
      "resolution": "Human must resolve or override with authorization"
    },
    "warning": {
      "description": "Order can proceed to draft but requires human review before approval.",
      "blocks": "auto_approval",
      "examples": ["low_confidence_match", "stock_warning", "price_discrepancy", "rush_assumption", "approximate_quantity"],
      "resolution": "Human reviews flag, confirms or corrects the value"
    },
    "info": {
      "description": "Informational. Order proceeds normally. Logged for awareness.",
      "blocks": "nothing",
      "examples": ["uom_converted", "contract_price_applied", "currency_converted", "repeat_order_detected"],
      "resolution": "No action needed — provides transparency into what the system did"
    }
  },
  "required_fields_for_approval": {
    "order": ["customer.name", "order_date"],
    "line_item": ["sku OR description (at least one)", "quantity"],
    "fulfillment": []
  },
  "required_fields_for_fulfillment": {
    "order": ["customer.name", "order_date", "po_reference"],
    "line_item": ["catalog_sku", "quantity", "uom", "unit_price"],
    "fulfillment": ["ship_to_address", "shipping_method"]
  }
}
```

### Prompt Generation from Ontology

The ontology enables **automatic extraction prompt generation** rather than hand-writing prompts. The AI's extraction instructions are derived from the entity definitions, field semantics, and inference rules.

```json
{
  "prompt_generation": {
    "strategy": "For each extractable field in the ontology, generate extraction instructions using the field's semantic description, extraction_hints, ambiguity_signals, and transforms. For each intent_detection pattern, include instructions to detect and tag those signals.",
    "template_structure": [
      "1. Entity extraction: Use entity definitions to tell AI what objects to extract",
      "2. Field-level instructions: Use field_semantics.ai_instruction for each field",
      "3. Ambiguity handling: Use ambiguity_signals to tell AI what to flag",
      "4. Intent detection: Use inference_types.intent_detection to tell AI what patterns to recognize",
      "5. Output schema: Derived from entity key_fields + derived_fields"
    ],
    "benefits": [
      "Adding a new field to the ontology automatically updates the extraction prompt",
      "Customer-layer field extensions automatically appear in extraction",
      "Consistent extraction behavior across all input channels",
      "Prompt changes are tracked as ontology version changes, not ad-hoc text edits"
    ]
  }
}
```

---

## Pipeline Schema (Declarative DAG)

Each stage declares its inputs, outputs, and dependencies. The engine resolves execution order automatically.

```
extraction
    ├── xref ─────────────┐
    │                     ├── sku_matching
    │                     │       ├── substitution
    │                     │       ├── repeat_order
    │                     │       └── uom_conversion
    │                     │               │
    │                     │       contract_pricing ──┐
    │                     │               │          │
    ├── credit_check ─────┤               │          │
    │                     │               │          │
    └── currency ─────────┤               │          │
                          │               │          │
                    draft_assembly ◄──────┘──────────┘
                          │
                    split_shipping
                          │
                    validation
```

```json
{
  "pipeline": "order_processing",
  "stages": [
    {
      "id": "extraction",
      "type": "ai_extraction",
      "depends_on": [],
      "config_ref": "extraction_config"
    },
    {
      "id": "xref",
      "type": "resolve",
      "depends_on": ["extraction"],
      "config_ref": "xref_config",
      "skip_when": "no_customer_xref_map"
    },
    {
      "id": "sku_matching",
      "type": "score",
      "depends_on": ["xref"],
      "config_ref": "matching_config"
    },
    {
      "id": "substitution",
      "type": "resolve",
      "depends_on": ["sku_matching"],
      "config_ref": "substitution_config",
      "skip_when": "no_substitution_data"
    },
    {
      "id": "repeat_order",
      "type": "detect",
      "depends_on": ["sku_matching"],
      "config_ref": "repeat_order_config",
      "skip_when": "no_order_history"
    },
    {
      "id": "uom_conversion",
      "type": "resolve",
      "depends_on": ["sku_matching"],
      "config_ref": "uom_config"
    },
    {
      "id": "contract_pricing",
      "type": "detect",
      "depends_on": ["sku_matching"],
      "config_ref": "contract_pricing_config",
      "skip_when": "no_customer_contract"
    },
    {
      "id": "credit_check",
      "type": "threshold",
      "depends_on": ["extraction"],
      "config_ref": "credit_check_config",
      "skip_when": "no_erp_connection"
    },
    {
      "id": "currency",
      "type": "resolve",
      "depends_on": ["extraction"],
      "config_ref": "currency_config",
      "skip_when": "single_currency"
    },
    {
      "id": "draft_assembly",
      "type": "default",
      "depends_on": ["sku_matching", "substitution", "repeat_order", "uom_conversion", "contract_pricing", "credit_check", "currency"],
      "config_ref": "draft_config"
    },
    {
      "id": "split_shipping",
      "type": "detect",
      "depends_on": ["draft_assembly"],
      "config_ref": "split_shipping_config",
      "skip_when": "single_shipment"
    },
    {
      "id": "validation",
      "type": "threshold",
      "depends_on": ["draft_assembly", "split_shipping"],
      "config_ref": "validation_config"
    }
  ]
}
```

---

## 5 Universal Rule Types

Every rule in the system is one of these five primitives:

### 1. `score` — Rank candidates against a target

Used for: SKU matching, fuzzy product lookup, customer name matching

```json
{
  "rule_type": "score",
  "id": "sku_match",
  "input_field": "extracted.sku",
  "candidates_source": "catalog",
  "tiers": [
    { "method": "exact",        "field": "sku",  "score": 100 },
    { "method": "normalized",   "field": "sku",  "score": 85, "normalize": "strip_special" },
    { "method": "contains",     "field": "combined_text", "score": 90 },
    { "method": "keyword_ratio","field": "name", "score_multiplier": 75, "min_word_length": 3 }
  ],
  "min_threshold": 25,
  "confidence_bands": {
    "high": { "min": 85 },
    "medium": { "min": 55 },
    "low": { "min": 0 }
  },
  "output": "match"
}
```

### 2. `resolve` — Map one identifier to another using a lookup

Used for: Customer code cross-reference, substitution, UOM normalization

```json
{
  "rule_type": "resolve",
  "id": "customer_xref",
  "description": "Map customer-specific item codes to internal SKUs",
  "lookup_source": "customer_xref_map",
  "lookup_key": "extracted.sku",
  "lookup_match": "case_insensitive",
  "on_match": {
    "set_field": "resolved_sku",
    "tag_metadata": "_customerCode",
    "preserve_original": true
  },
  "on_no_match": "passthrough",
  "also_resolve": ["substitution.original_sku", "substitution.substitute_sku"]
}
```

```json
{
  "rule_type": "resolve",
  "id": "substitution",
  "description": "Swap OOS items to customer-authorized substitutes",
  "conditions": [
    { "field": "match.catalogItem.stock", "op": "eq", "value": 0 },
    { "field": "substitution.substitute_sku", "op": "exists" }
  ],
  "lookup_source": "catalog",
  "lookup_key": "substitution.substitute_sku",
  "additional_condition": { "field": "lookup_result.stock", "op": "gt", "value": 0 },
  "on_match": {
    "replace_match": true,
    "set_match_type": "substitution",
    "tag_metadata": "_substitution",
    "metadata_fields": ["originalSku", "originalName", "originalStock", "substituteSku", "substituteName", "substituteStock", "condition", "customerAuthorized"]
  },
  "on_no_match": "passthrough"
}
```

### 3. `detect` — Pattern-match against historical or reference data

Used for: Repeat order detection, anomaly detection, fraud signals

```json
{
  "rule_type": "detect",
  "id": "repeat_order",
  "description": "Detect returning customers and diff against last order",
  "match_source": "order_history",
  "match_key": "customer.name",
  "match_method": "case_insensitive",
  "on_match": {
    "diff_against": "last_order.items",
    "diff_key": "sku",
    "diff_fields": ["quantity"],
    "diff_types": {
      "qty_increased": { "condition": "current > previous" },
      "qty_decreased": { "condition": "current < previous" },
      "unchanged": { "condition": "current == previous" },
      "new_item": { "condition": "not_in_previous" },
      "removed": { "condition": "not_in_current" }
    },
    "output_fields": ["customerSince", "totalOrders", "lastOrderDate", "lastOrderPO", "diff"]
  },
  "on_no_match": "skip"
}
```

### 4. `threshold` — Flag values that exceed/fall-below limits

Used for: Validation flags, stock warnings, price anomalies, quantity checks

```json
{
  "rule_type": "threshold",
  "id": "validation_flags",
  "rules": [
    {
      "id": "low_confidence_match",
      "field": "match.confidence",
      "op": "in",
      "values": ["low", "medium"],
      "flag": { "type": "review", "severity": "warning", "message": "Low confidence match — verify product" }
    },
    {
      "id": "stock_warning",
      "field": "match.catalogItem.stock",
      "op": "lt",
      "reference_field": "quantity",
      "flag": { "type": "stock", "severity": "warning", "message": "Ordered qty exceeds available stock" }
    },
    {
      "id": "rush_shipping",
      "scan_fields": ["delivery.notes", "line_items[*].notes", "memo"],
      "pattern": "\\b(RUSH|urgent|expedit(?:e|ed)?|ASAP|priority\\s*ship)\\b",
      "pattern_flags": "i",
      "flag": { "type": "assumption", "field": "shippingMethod", "assumed_value": "Express", "message": "Shipping set to Express based on \"{match}\" — verify" }
    }
  ]
}
```

### 5. `default` — Set field values with fallback chains

Used for: Draft assembly, field mapping, default values

```json
{
  "rule_type": "default",
  "id": "draft_assembly",
  "field_mappings": {
    "header.customer": { "source": ["extracted.customer.name", "validation.assumed.customer"], "fallback": "" },
    "header.date": { "source": ["extracted.order_date"], "transform": "to_iso_date", "fallback": "today" },
    "header.poNumber": { "source": ["extracted.po_reference", "validation.assumed.po_reference"], "fallback": "" },
    "header.terms": { "source": ["extracted.terms"], "fallback": "Net 30" },
    "header.memo": { "source": ["extracted.memo"], "fallback": "" },
    "shipping.shipTo": { "source": ["extracted.delivery.address", "validation.assumed.address"], "fallback": "" },
    "shipping.requestedDate": { "source": ["validation.assumed.requested_date", "extracted.delivery.requested_date"], "transform": "to_iso_date", "fallback": "" },
    "shipping.shippingMethod": { "source": ["inferred.shippingMethod"], "fallback": "Standard Ground" }
  },
  "line_item_mappings": {
    "catalogSku": { "source": ["match.catalogItem.sku"], "fallback": "" },
    "description": { "source": ["match.catalogItem.name", "extracted.description"], "fallback": "" },
    "quantity": { "source": ["extracted.quantity", "validation.assumed.quantity"], "transform": "to_number", "fallback": 0 },
    "uom": { "source": ["match.catalogItem.uom", "extracted.uom"], "fallback": "" },
    "rate": { "source": ["match.catalogItem.price", "extracted.unit_price"], "fallback": 0 }
  },
  "computed_fields": {
    "subtotal": { "formula": "sum(lineItems, qty * rate)" },
    "tax": { "formula": "subtotal * tax_rate", "params": { "tax_rate": 0.0625 } },
    "total": { "formula": "subtotal + tax + shipping_cost" }
  }
}
```

---

---

## 8 NetSuite Order Automation Features

All 8 features expressed using the 5 universal rule types. Features #1, #4, #8 are already shown above. The remaining 5 are defined below.

### Feature #2: Split Shipping / Partial Fulfillment (`detect`)

Detects mixed urgency, multiple ship-to addresses, or "ship what's available" cues and pre-assigns ship groups on the draft.

```json
{
  "rule_type": "detect",
  "id": "split_shipping",
  "description": "Detect split shipment signals and assign ship groups",
  "detectors": [
    {
      "id": "multi_address",
      "description": "Multiple ship-to addresses in the order",
      "scan_fields": ["line_items[*].notes", "delivery.notes", "memo"],
      "patterns": ["ship\\s+to\\s+(?:different|separate|another)\\s+(?:address|location)", "deliver\\s+to\\s+(?:warehouse|store|location)\\s+#?\\d+"],
      "on_detect": {
        "tag": "_shipGroup",
        "action": "group_by_address",
        "flag": { "type": "split_ship", "message": "Multiple ship-to addresses detected — verify ship groups" }
      }
    },
    {
      "id": "partial_fulfillment",
      "description": "Ship available now, backorder the rest",
      "scan_fields": ["line_items[*].notes", "delivery.notes", "memo"],
      "patterns": ["ship\\s+(?:what(?:'s)?\\s+)?available", "backorder\\s+(?:the\\s+)?rest", "partial\\s+(?:ship|fulfil)"],
      "on_detect": {
        "tag": "_partialFulfillment",
        "action": "split_by_availability",
        "check_field": "match.catalogItem.stock",
        "groups": {
          "ship_now": { "condition": "stock >= quantity" },
          "backorder": { "condition": "stock < quantity" }
        },
        "flag": { "type": "split_ship", "message": "Partial fulfillment requested — {n} items backordered" }
      }
    },
    {
      "id": "mixed_urgency",
      "description": "Some items rush, others standard",
      "scan_fields": ["line_items[*].notes"],
      "per_item": true,
      "patterns": ["\\brush\\b|urgent|expedit|asap|priority"],
      "on_detect": {
        "tag": "_urgencyGroup",
        "action": "group_by_urgency",
        "groups": {
          "rush": { "condition": "pattern_matched" },
          "standard": { "condition": "no_match" }
        },
        "flag": { "type": "split_ship", "message": "Mixed urgency — {rush_count} rush items, {standard_count} standard" }
      }
    }
  ]
}
```

### Feature #3: Contract Pricing & Price Discrepancies (`detect` + `threshold`)

Compares PO prices against the customer's contract/negotiated pricing. Flags mismatches and auto-applies the correct rate.

```json
{
  "rule_type": "detect",
  "id": "contract_pricing",
  "description": "Compare order prices against customer contract pricing",
  "match_source": "customer_contracts",
  "match_key": "customer.name",
  "match_method": "case_insensitive",
  "on_match": {
    "per_line_item": true,
    "lookup_key": "catalogSku",
    "compare_fields": [
      {
        "extracted": "unit_price",
        "contract": "contracted_price",
        "tolerance_pct": 1.0,
        "actions": {
          "within_tolerance": { "action": "passthrough" },
          "extracted_higher": {
            "action": "auto_correct",
            "set_field": "rate",
            "to": "contract.contracted_price",
            "tag": "_priceCorrection",
            "flag": { "type": "price_discrepancy", "severity": "info", "message": "PO price ${extracted} corrected to contract price ${contract} for {sku}" }
          },
          "extracted_lower": {
            "action": "flag_only",
            "tag": "_priceDiscrepancy",
            "flag": { "type": "price_discrepancy", "severity": "warning", "message": "PO price ${extracted} is below contract ${contract} for {sku} — verify if negotiated discount" }
          },
          "no_contract_price": {
            "action": "flag_only",
            "flag": { "type": "price_discrepancy", "severity": "info", "message": "No contract price on file for {sku} — using catalog price" }
          }
        }
      }
    ],
    "output_fields": ["contractId", "effectiveDate", "expirationDate", "corrections", "discrepancies"]
  },
  "on_no_match": "skip"
}
```

### Feature #5: Unit of Measure Conversions (`resolve`)

Detects UoM mismatches between what the customer ordered and the ERP's native unit, applies conversion factors.

```json
{
  "rule_type": "resolve",
  "id": "uom_conversion",
  "description": "Convert customer UoM to ERP native UoM",
  "per_line_item": true,
  "input_fields": {
    "ordered_uom": "extracted.uom",
    "ordered_qty": "extracted.quantity",
    "catalog_uom": "match.catalogItem.uom"
  },
  "condition": { "field": "ordered_uom", "op": "neq_normalized", "reference_field": "catalog_uom" },
  "conversion_table": "uom_conversions",
  "conversion_lookup": {
    "from": "ordered_uom",
    "to": "catalog_uom",
    "sku_specific_override": "match.catalogItem.sku"
  },
  "on_match": {
    "set_fields": {
      "quantity": { "formula": "ordered_qty * conversion_factor" },
      "uom": { "value": "catalog_uom" }
    },
    "tag_metadata": "_uomConversion",
    "metadata_fields": ["originalQty", "originalUom", "convertedQty", "convertedUom", "conversionFactor"],
    "flag": { "type": "conversion", "severity": "info", "message": "Converted {originalQty} {originalUom} → {convertedQty} {convertedUom} (factor: {conversionFactor})" }
  },
  "on_no_match": {
    "action": "flag",
    "flag": { "type": "conversion", "severity": "warning", "message": "UoM mismatch: customer ordered in {ordered_uom}, catalog expects {catalog_uom} — no conversion factor found" }
  }
}
```

**Semantic layer default conversion table:**

```json
{
  "uom_conversions": {
    "canonical_units": {
      "weight": { "base": "lb", "conversions": { "kg": 2.20462, "oz": 0.0625, "g": 0.00220462 } },
      "volume": { "base": "gal", "conversions": { "L": 0.264172, "qt": 0.25, "pt": 0.125, "fl_oz": 0.0078125 } },
      "length": { "base": "ft", "conversions": { "m": 3.28084, "in": 0.0833333, "cm": 0.0328084 } }
    },
    "pack_conversions": {
      "case_to_each": { "default": 12, "sku_overrides": { "YOG-OMB-6": 6, "TURK-GR1": 4 } },
      "pallet_to_case": { "default": 48 },
      "dozen_to_each": { "factor": 12 }
    },
    "aliases": {
      "ea": "each", "cs": "case", "pk": "pack", "bx": "box", "dz": "dozen",
      "lbs": "lb", "kgs": "kg", "pcs": "each", "ct": "each"
    }
  }
}
```

### Feature #6: Credit Hold / Payment Terms Enforcement (`threshold`)

Cross-checks customer account status at order time. Surfaces warnings before the draft is created.

```json
{
  "rule_type": "threshold",
  "id": "credit_check",
  "description": "Check customer credit status and enforce payment terms",
  "data_source": "erp_customer_account",
  "lookup_key": "customer.name",
  "rules": [
    {
      "id": "credit_hold",
      "field": "account.credit_hold",
      "op": "eq",
      "value": true,
      "flag": { "type": "credit", "severity": "critical", "message": "⚠ CREDIT HOLD — Customer account is on credit hold. Order requires credit manager approval.", "block_draft": true }
    },
    {
      "id": "credit_limit_exceeded",
      "field": "account.available_credit",
      "op": "lt",
      "reference_field": "computed.estimated_total",
      "flag": { "type": "credit", "severity": "warning", "message": "Order total ${estimated_total} exceeds available credit ${available_credit} (limit: ${credit_limit})" }
    },
    {
      "id": "overdue_invoices",
      "field": "account.overdue_invoice_count",
      "op": "gt",
      "value": 0,
      "flag": { "type": "credit", "severity": "warning", "message": "{overdue_count} overdue invoice(s) totaling ${overdue_amount} — payment terms may need review" }
    },
    {
      "id": "terms_mismatch",
      "field": "extracted.terms",
      "op": "neq",
      "reference_field": "account.payment_terms",
      "flag": { "type": "terms", "severity": "info", "message": "PO requests \"{extracted_terms}\" but account is set to \"{account_terms}\"", "auto_correct": true, "correct_to": "account.payment_terms" }
    }
  ]
}
```

### Feature #7: Multi-Currency / Cross-Border Orders (`resolve`)

Detects foreign currency, applies exchange rates, flags duties/tariffs, and converts to base currency.

```json
{
  "rule_type": "resolve",
  "id": "currency_conversion",
  "description": "Detect and convert foreign currency orders",
  "input_fields": {
    "order_currency": "extracted.currency",
    "base_currency": "config.base_currency"
  },
  "condition": { "field": "order_currency", "op": "neq", "reference_field": "base_currency" },
  "lookup_source": "exchange_rates",
  "lookup_key": "order_currency",
  "on_match": {
    "set_fields": {
      "line_items[*].rate": { "formula": "original_rate * exchange_rate" },
      "line_items[*]._originalRate": { "value": "original_rate" },
      "line_items[*]._originalCurrency": { "value": "order_currency" },
      "header.currency": { "value": "base_currency" },
      "header._exchangeRate": { "value": "exchange_rate" },
      "header._exchangeRateDate": { "value": "rate_date" }
    },
    "tag_metadata": "_currencyConversion",
    "flag": { "type": "currency", "severity": "info", "message": "Converted from {order_currency} to {base_currency} at rate {exchange_rate} ({rate_date})" }
  },
  "on_no_match": {
    "action": "flag",
    "flag": { "type": "currency", "severity": "warning", "message": "Currency \"{order_currency}\" detected but no exchange rate available — prices not converted" }
  },
  "cross_border_rules": {
    "detect_country": { "scan_fields": ["delivery.address", "customer.address"] },
    "duty_check": {
      "condition": "destination_country != origin_country",
      "lookup_source": "tariff_schedule",
      "per_line_item": true,
      "lookup_key": "match.catalogItem.hs_code",
      "flag": { "type": "duties", "severity": "info", "message": "Cross-border order — estimated duty {duty_pct}% on {sku} (HS: {hs_code})" }
    }
  }
}
```

**Semantic layer defaults:**

```json
{
  "currency_config": {
    "base_currency": "USD",
    "exchange_rate_source": "erp_daily_rates",
    "fallback_source": "ecb_reference_rates",
    "rate_staleness_threshold_hours": 24,
    "supported_currencies": ["USD", "CAD", "EUR", "GBP", "MXN", "JPY", "AUD"],
    "rounding": { "precision": 2, "method": "half_up" }
  }
}
```

---

## Shipping Method Inference (as a `threshold` + `default` combo)

```json
{
  "rule_type": "default",
  "id": "shipping_inference",
  "field": "shipping.shippingMethod",
  "cascade": [
    { "scan_fields": ["delivery.notes", "delivery.method", "memo", "line_items[*].notes"],
      "pattern": "\\brush\\b|urgent|expedit|asap|priority\\s*ship",
      "pattern_flags": "i",
      "value": "Express" },
    { "scan_fields": ["delivery.notes", "delivery.method"],
      "pattern": "freight|ltl|truck",
      "pattern_flags": "i",
      "value": "Freight LTL" },
    { "value": "Standard Ground" }
  ]
}
```

---

## Customer Layer: Config Override Semantics

Customer configs merge on top of the semantic layer using these rules:

| Override Type | Behavior | Example |
|---|---|---|
| `add_lookup` | Add entries to a lookup table | Add customer SKU cross-ref mappings |
| `add_rules` | Append rules to a stage | Add customer-specific validation rules |
| `override_param` | Change a parameter value | Change tax rate from 6.25% to 8.5% |
| `override_cascade` | Replace a cascade list | Custom shipping method keywords |
| `add_candidates` | Add items to a candidate pool | Add customer-specific catalog items |
| `disable_stage` | Skip a pipeline stage | Disable repeat order detection |

**Example customer config:**

```json
{
  "customer_id": "greenhaven-market",
  "customer_name": "GreenHaven Market",
  "overrides": [
    {
      "type": "add_lookup",
      "stage": "xref",
      "table": "customer_xref_map",
      "entries": {
        "GH-YOG-06": "YOG-OMB-6",
        "GH-TKY-01": "TURK-GR1",
        "GH-TKY-03": "TURK-GR3",
        "GH-SLSA-F": "SALSA-FRS-H",
        "GH-FRZ-BROC": "FF-FRZ-BROC-16"
      }
    },
    {
      "type": "override_param",
      "stage": "draft_assembly",
      "param": "computed_fields.tax.params.tax_rate",
      "value": 0.0725
    },
    {
      "type": "add_rules",
      "stage": "validation",
      "rules": [
        {
          "id": "greenhaven_min_order",
          "field": "computed.subtotal",
          "op": "lt",
          "value": 500,
          "flag": { "type": "policy", "severity": "warning", "message": "Order below $500 minimum for GreenHaven" }
        }
      ]
    }
  ]
}
```

---

## Complete Rule Inventory — All 8 NetSuite Features + Demo Logic

### The 8 NetSuite Order Automation Features

| # | Feature | Rule Type(s) | Config ID | Stage | Status |
|---|---|---|---|---|---|
| 1 | **Substitution Logic** — OOS swap with customer auth | `resolve` | `substitution` | `substitution` | ✅ In demo |
| 2 | **Split Shipping / Partial Fulfillment** — multi-address, mixed urgency, ship-available | `detect` | `split_shipping` | `split_shipping` | ⬜ New |
| 3 | **Contract Pricing & Price Discrepancies** — PO price vs contract rate | `detect` + `threshold` | `contract_pricing` | `contract_pricing` | ⬜ New |
| 4 | **Repeat/Standing Order Detection** — history diff, "same as last month" | `detect` | `repeat_order` | `repeat_order` | ✅ In demo |
| 5 | **UoM Conversions** — cases↔eaches, kg↔lb, with per-SKU factors | `resolve` | `uom_conversion` | `uom_conversion` | ⬜ New |
| 6 | **Credit Hold / Payment Terms** — credit limit, overdue invoices, terms mismatch | `threshold` | `credit_check` | `credit_check` | ⬜ New |
| 7 | **Multi-Currency / Cross-Border** — FX rates, duty/tariff flags | `resolve` | `currency_conversion` | `currency` | ⬜ New |
| 8 | **Customer Item Codes → Internal SKUs** — cross-reference map | `resolve` | `customer_xref` | `xref` | ✅ In demo |

### Additional Demo Logic (migrated to config)

| Demo Function/Logic | Rule Type | Config ID | Stage |
|---|---|---|---|
| `matchSkuToCatalog()` — tiered scoring | `score` | `sku_match` | `sku_matching` |
| Draft useEffect — field mapping | `default` | `draft_assembly` | `draft_assembly` |
| Draft useEffect — shipping inference | `default` | `shipping_inference` | `draft_assembly` |
| Draft useEffect — totals calculation | `default` | `draft_totals` | `draft_assembly` |
| `flaggedFields` — API validation items | `threshold` | `api_validation_flags` | `validation` |
| `flaggedFields` — rush keyword detection | `threshold` | `rush_shipping_flag` | `validation` |
| Confidence band assignment (>=85/>=55/<55) | `score` param | (within `sku_match`) | `sku_matching` |
| Min match threshold (score < 25 = no match) | `score` param | (within `sku_match`) | `sku_matching` |
| Tax rate (6.25%) | `default` param | (within `draft_totals`) | `draft_assembly` |
| Default terms ("Net 30") | `default` fallback | (within `draft_assembly`) | `draft_assembly` |
| Default shipping ("Standard Ground") | `default` fallback | (within `shipping_inference`) | `draft_assembly` |

---

## Validation Issue Types (Semantic Layer Defaults)

Standardized issue taxonomy that ships with the product:

```json
{
  "issue_types": {
    "incomplete_date":      { "icon": "calendar",   "label": "Incomplete Date" },
    "vague_timing":         { "icon": "clock",      "label": "Vague Timing" },
    "approximate_quantity": { "icon": "hash",       "label": "Approximate Qty" },
    "relative_reference":   { "icon": "link",       "label": "Relative Reference" },
    "missing_field":        { "icon": "circle",     "label": "Missing Field" },
    "ambiguous_product":    { "icon": "question",   "label": "Ambiguous Product" },
    "assumption":           { "icon": "alert",      "label": "AI Assumption" },
    "stock_warning":        { "icon": "package",    "label": "Stock Warning" },
    "policy":               { "icon": "shield",     "label": "Policy Violation" },
    "split_ship":           { "icon": "truck",      "label": "Split Shipment" },
    "price_discrepancy":    { "icon": "dollar",     "label": "Price Discrepancy" },
    "conversion":           { "icon": "scale",      "label": "UoM Conversion" },
    "credit":               { "icon": "credit_card","label": "Credit/Terms" },
    "terms":                { "icon": "document",   "label": "Terms Mismatch" },
    "currency":             { "icon": "globe",      "label": "Currency Conversion" },
    "duties":               { "icon": "customs",    "label": "Duties/Tariffs" }
  }
}
```

---

## Flag Types (Extraction-Level)

```json
{
  "flag_types": {
    "ambiguity":        { "icon": "warning",   "label": "Ambiguity" },
    "correction":       { "icon": "pencil",    "label": "Correction" },
    "out_of_stock_risk":{ "icon": "package",   "label": "Stock Risk" },
    "anomaly":          { "icon": "search",    "label": "Anomaly" },
    "skipped_item":     { "icon": "skip",      "label": "Skipped" }
  }
}
```

---

## Match Type Registry (Semantic Layer)

```json
{
  "match_types": {
    "exact":        { "icon": "check",   "color": "green",  "label": "Exact Match" },
    "sku_partial":  { "icon": "approx",  "color": "blue",   "label": "Partial SKU" },
    "xref":         { "icon": "link",    "color": "purple", "label": "Cross-Referenced" },
    "substitution": { "icon": "swap",    "color": "blue",   "label": "Substituted" },
    "fuzzy":        { "icon": "tilde",   "color": "amber",  "label": "Fuzzy Match" },
    "contract":     { "icon": "file",    "color": "green",  "label": "Contract Price" },
    "uom_converted":{ "icon": "scale",   "color": "purple", "label": "UoM Converted" },
    "none":         { "icon": "question","color": "red",    "label": "No Match" }
  }
}
```

---

## Implementation Approach

### Phase 1: Core Engine (Foundation)
- Build the pipeline executor that reads stage DAGs and runs them in dependency order
- Implement the 5 rule type runners (`score`, `resolve`, `detect`, `threshold`, `default`)
- Define the config schema (JSON Schema for validation)
- Build the `skip_when` condition evaluator for optional stages

### Phase 2: Config Migration (3 demo features)
- Convert the 3 implemented features (#1 Substitution, #4 Repeat Order, #8 Customer Codes) + all demo logic into JSON configs
- Use the rule inventory table above as the migration checklist
- Validate that the config-driven pipeline produces identical output to the current demo

### Phase 3: New NetSuite Features (5 remaining)
- **#5 UoM Conversions** — Build conversion table schema, alias resolution, per-SKU override support
- **#3 Contract Pricing** — Build contract lookup, price comparison with tolerance, auto-correct logic
- **#6 Credit Hold** — Build ERP account status check, credit limit comparison, overdue invoice surfacing
- **#7 Multi-Currency** — Build exchange rate lookup, line-item price conversion, cross-border duty detection
- **#2 Split Shipping** — Build multi-address detection, partial fulfillment grouping, mixed urgency splitting
- Each feature requires: config schema, stage runner, test cases, UI indicators

### Phase 4: Customer Config Layer
- Build config merge engine (add_lookup, override_param, add_rules, etc.)
- Build customer config storage and retrieval
- Test with GreenHaven Market config (xref map) and Sunnyside Market config (order history)

### Phase 5: Analytics & Reporting Foundation
- Implement pipeline event bus — every stage emits structured events on execution
- Build order fact and line-item fact writers (populate after each order completes)
- Build daily/weekly aggregation jobs for forecasting signals (SKU velocity, customer frequency, seasonal patterns)
- Build reporting query layer — pre-defined report templates against the fact tables
- Build dashboard views: automation rate, processing time, flag volume, match quality

### Phase 6: Forecasting & Intelligence
- Implement demand signal computation (SKU velocity, stockout forecast, repeat order baselines)
- Build risk signal computation (credit risk trends, price drift detection)
- Build proactive alerts (predicted stockouts, overdue customer reorder, stale price lists)
- Customer ordering pattern analysis for sales team insights

### Phase 7: Config Management
- Admin UI for editing customer configs (visual rule builder)
- Config versioning and audit trail
- Config testing/simulation (run a sample order through a config before deploying)
- Analytics dashboard for rule effectiveness (which rules fire, which get overridden by humans)

---

## Analytics, Forecasting & Reporting Foundation

The pipeline architecture is designed so every stage emits structured events that feed analytics, forecasting, and reporting without additional instrumentation.

### Pipeline Event Bus

Every stage execution emits a structured event. These events are the single source of truth for all downstream analytics.

```json
{
  "event_schema": {
    "event_id": "uuid",
    "order_id": "uuid",
    "customer_id": "string",
    "stage_id": "string",
    "rule_id": "string",
    "timestamp": "iso8601",
    "event_type": "stage_started | rule_fired | rule_skipped | flag_raised | value_set | match_scored | transform_applied",
    "payload": {},
    "duration_ms": "number"
  }
}
```

**Key event types emitted by each rule type:**

| Rule Type | Events Emitted | Analytics Use |
|---|---|---|
| `score` | `match_scored` (candidate, score, tier, confidence) | Match quality distribution, catalog coverage gaps |
| `resolve` | `transform_applied` (from → to, lookup source) | Xref hit rates, substitution frequency, UoM conversion volume |
| `detect` | `pattern_detected` (pattern_id, match data) | Repeat order rates, split ship frequency, anomaly trends |
| `threshold` | `flag_raised` (rule_id, severity, field, value) | Flag volume by type, auto-resolution rates, review burden |
| `default` | `value_set` (field, source, was_fallback) | Field completeness rates, extraction quality, fallback frequency |

### Order Analytics Dimensions & Measures

Structured data model for querying order intelligence. Every completed order writes a **fact record** with these dimensions and measures.

```json
{
  "order_fact": {
    "dimensions": {
      "order_id": "uuid",
      "customer_id": "string",
      "customer_name": "string",
      "customer_segment": "string",
      "order_date": "date",
      "input_channel": "fax | email | chat | excel | pdf | edi | api",
      "region": "string",
      "currency": "string",
      "sales_rep": "string"
    },
    "measures": {
      "line_item_count": "int",
      "total_value": "decimal",
      "processing_time_ms": "int",
      "human_touch_required": "boolean",
      "auto_resolution_count": "int",
      "flag_count": "int",
      "flag_count_by_severity": { "critical": "int", "warning": "int", "info": "int" }
    },
    "enrichment_facts": {
      "xref_mappings_applied": "int",
      "substitutions_applied": "int",
      "uom_conversions_applied": "int",
      "price_corrections_applied": "int",
      "currency_conversions_applied": "int",
      "is_repeat_order": "boolean",
      "repeat_order_diff_count": "int",
      "is_split_shipment": "boolean",
      "ship_group_count": "int",
      "credit_hold_triggered": "boolean",
      "match_confidence_avg": "decimal",
      "match_confidence_distribution": { "high": "int", "medium": "int", "low": "int", "none": "int" }
    }
  }
}
```

### Line Item Analytics

Per-line-item fact records for SKU-level intelligence:

```json
{
  "line_item_fact": {
    "dimensions": {
      "order_id": "uuid",
      "sku": "string",
      "category": "string",
      "customer_id": "string"
    },
    "measures": {
      "quantity_ordered": "decimal",
      "quantity_in_base_uom": "decimal",
      "unit_price": "decimal",
      "line_total": "decimal",
      "match_type": "exact | sku_partial | xref | substitution | fuzzy | none",
      "match_score": "int",
      "match_confidence": "high | medium | low",
      "was_substituted": "boolean",
      "was_xref_resolved": "boolean",
      "was_uom_converted": "boolean",
      "was_price_corrected": "boolean",
      "had_stock_warning": "boolean",
      "stock_at_order_time": "int"
    }
  }
}
```

### Forecasting Signals

The pipeline captures signals that feed demand forecasting and trend analysis. These are computed from the event stream and order facts.

```json
{
  "forecasting_signals": {
    "demand_signals": {
      "sku_velocity": {
        "description": "Units ordered per SKU per time period",
        "source": "line_item_fact",
        "aggregation": "sum(quantity_in_base_uom) group by sku, period",
        "periods": ["daily", "weekly", "monthly"]
      },
      "customer_order_frequency": {
        "description": "Days between orders per customer",
        "source": "order_fact",
        "aggregation": "avg(days_since_last_order) group by customer_id",
        "use": "Predict next order date, trigger proactive outreach"
      },
      "repeat_order_baseline": {
        "description": "Typical order composition for repeat customers",
        "source": "repeat_order detect events",
        "aggregation": "mode(sku_list, quantities) group by customer_id",
        "use": "Pre-populate expected orders, flag deviations"
      },
      "seasonal_patterns": {
        "description": "SKU demand by month/quarter",
        "source": "line_item_fact",
        "aggregation": "sum(quantity) group by sku, month",
        "use": "Inventory planning, seasonal stocking recommendations"
      },
      "substitution_demand": {
        "description": "How often substitutes are triggered per SKU",
        "source": "substitution resolve events",
        "aggregation": "count group by original_sku, substitute_sku, period",
        "use": "Identify chronic stockout SKUs, optimize substitute pairings"
      }
    },
    "risk_signals": {
      "stockout_forecast": {
        "description": "Predicted stockout date based on order velocity vs current stock",
        "inputs": ["sku_velocity", "current_stock"],
        "formula": "current_stock / avg_daily_velocity",
        "alert_threshold_days": 7
      },
      "credit_risk_trend": {
        "description": "Customer payment behavior over time",
        "source": "credit_check threshold events",
        "aggregation": "trend(overdue_amount, overdue_count) group by customer_id",
        "use": "Proactive credit limit adjustments"
      },
      "price_drift": {
        "description": "Trend of PO prices vs contract prices over time",
        "source": "contract_pricing detect events",
        "aggregation": "avg(price_delta_pct) group by customer_id, sku, period",
        "use": "Identify stale price lists, trigger contract renegotiation"
      }
    }
  }
}
```

### Reporting Views

Pre-defined report templates built from the analytics data model. Each report is a query against order/line-item facts + events.

```json
{
  "reports": {
    "operational": [
      {
        "id": "automation_rate",
        "title": "Order Automation Rate",
        "description": "% of orders processed without human intervention",
        "metric": "count(orders where human_touch_required = false) / count(orders)",
        "breakdowns": ["by_channel", "by_customer", "by_period"]
      },
      {
        "id": "processing_time",
        "title": "Order Processing Time",
        "description": "Average time from receipt to draft-ready",
        "metric": "avg(processing_time_ms)",
        "breakdowns": ["by_channel", "by_complexity", "by_period"]
      },
      {
        "id": "flag_volume",
        "title": "Review Flag Analysis",
        "description": "Volume and distribution of flags requiring human review",
        "metric": "count(flags) group by type, severity",
        "breakdowns": ["by_customer", "by_stage", "by_period"],
        "use": "Identify which rules generate the most manual work → optimize or retrain"
      },
      {
        "id": "match_quality",
        "title": "Catalog Match Quality",
        "description": "Distribution of match confidence across orders",
        "metric": "distribution(match_confidence)",
        "breakdowns": ["by_customer", "by_match_type"],
        "use": "Identify customers with poor catalog coverage → update xref maps"
      }
    ],
    "financial": [
      {
        "id": "order_value_trend",
        "title": "Order Value Trends",
        "description": "Total and average order value over time",
        "metric": "sum(total_value), avg(total_value)",
        "breakdowns": ["by_customer", "by_region", "by_period"]
      },
      {
        "id": "price_correction_impact",
        "title": "Price Correction Impact",
        "description": "Revenue impact of auto-correcting PO prices to contract rates",
        "metric": "sum(price_delta * quantity)",
        "breakdowns": ["by_customer", "by_sku"]
      },
      {
        "id": "currency_exposure",
        "title": "Foreign Currency Exposure",
        "description": "Order volume by currency with FX impact",
        "metric": "sum(total_value) group by original_currency",
        "breakdowns": ["by_customer", "by_period"]
      }
    ],
    "intelligence": [
      {
        "id": "customer_ordering_patterns",
        "title": "Customer Ordering Patterns",
        "description": "Order frequency, basket composition, and trend analysis per customer",
        "signals": ["customer_order_frequency", "repeat_order_baseline", "sku_velocity"],
        "use": "Sales team insights, proactive reorder suggestions"
      },
      {
        "id": "substitution_effectiveness",
        "title": "Substitution Effectiveness",
        "description": "Which substitutions are accepted vs rejected by customers",
        "metric": "acceptance_rate group by original_sku, substitute_sku",
        "use": "Optimize substitute pairings in catalog config"
      },
      {
        "id": "catalog_gap_analysis",
        "title": "Catalog Gap Analysis",
        "description": "Items frequently ordered but not in catalog, or with low match scores",
        "metric": "count(match_type = 'none' or match_confidence = 'low') group by extracted_description",
        "use": "Catalog expansion priorities"
      }
    ]
  }
}
```

### Data Retention & Aggregation Policy

```json
{
  "data_retention": {
    "raw_events": { "retention": "90 days", "storage": "event_store" },
    "order_facts": { "retention": "indefinite", "storage": "analytics_db" },
    "line_item_facts": { "retention": "indefinite", "storage": "analytics_db" },
    "hourly_aggregates": { "retention": "1 year", "storage": "analytics_db" },
    "daily_aggregates": { "retention": "indefinite", "storage": "analytics_db" },
    "forecasting_models": { "retention": "indefinite", "versioned": true }
  }
}
```

---

## Key Design Principles

1. **No code for customer rules** — Every customer-specific behavior is JSON config, never a code change
2. **Composable primitives** — The 5 rule types combine to express any O2C logic
3. **Declarative pipeline** — Stage order is resolved from `depends_on`, not hardcoded
4. **Graceful degradation** — Stages with `skip_when` conditions are skipped cleanly when data isn't available
5. **Metadata preservation** — Every transformation tags its output with metadata (`_customerCode`, `_substitution`) so the UI can show provenance
6. **Semantic defaults** — The product ships with sensible defaults (Net 30 terms, 6.25% tax, Standard Ground shipping) that any customer inherits automatically
7. **Analytics-first pipeline** — Every stage emits structured events; analytics, forecasting, and reporting are built on the event stream, not bolted on after the fact
8. **Dimensional data model** — Order and line-item facts use a star schema with standardized dimensions, enabling arbitrary slicing without schema changes
