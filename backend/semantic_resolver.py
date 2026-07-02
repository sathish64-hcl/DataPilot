import re
from collections import defaultdict


BUSINESS_GLOSSARY = {
    "customer": ["customer", "customers", "cust", "client", "clients", "consumer", "party", "buyer"],
    "account": ["account", "accounts", "acct", "acc", "ledger"],
    "transaction": ["transaction", "transactions", "txn", "txns", "payment", "payments", "purchase", "sales", "sale"],
    "order": ["order", "orders", "ord", "booking", "request"],
    "invoice": ["invoice", "invoices", "inv", "bill", "billing"],
    "product": ["product", "products", "prod", "item", "sku", "catalog"],
    "employee": ["employee", "employees", "emp", "staff", "worker", "associate", "user"],
    "application": ["application", "applications", "app", "apps", "service", "system"],
    "incident": ["incident", "incidents", "inc", "ticket", "tickets", "issue", "issues", "case", "cases"],
    "change": ["change", "changes", "chg", "release", "deployment", "deploy"],
    "claim": ["claim", "claims", "clm"],
    "policy": ["policy", "policies", "pol"],
    "lead": ["lead", "leads", "prospect", "prospects"],
    "campaign": ["campaign", "campaigns", "camp", "marketing"],
    "shipment": ["shipment", "shipments", "ship", "delivery", "deliveries", "logistics"],
    "warehouse": ["warehouse", "warehouses", "wh", "whse"],
    "payment": ["payment", "payments", "pay", "paid", "pmt"],
    "card": ["card", "cards", "debit", "credit", "chip", "plastic", "pan"],
    "credit_limit": ["credit_limit", "limit", "limits", "credit", "creditlimit", "card_limit"],
    "amount": ["amount", "amt", "cost", "price", "revenue", "balance", "spend"],
    "date": ["date", "dt", "time", "timestamp", "created", "updated", "modified", "opened", "open", "closed"],
    "status": ["status", "state", "stage", "flag", "active", "inactive"],
    "location": ["location", "loc", "address", "city", "state", "country", "region"],
    "contact": ["contact", "email", "phone", "mobile", "address"],
    "details": ["detail", "details", "dtl", "data", "profile", "master", "info", "information", "record", "records"],
    "history": ["history", "hist", "log", "logs", "event", "events", "activity", "audit"],
    "summary": ["summary", "sum", "aggregate", "agg", "snapshot", "metric", "metrics", "kpi"],
}

CONFIDENCE_THRESHOLDS = {
    "native": 70,
    "ai_schema_scan": 35,
}

GENERIC_QUERY_WORDS = {
    "show", "fetch", "get", "give", "list", "find", "need", "needs", "data", "table", "tables",
    "field", "fields", "column", "columns", "record", "records", "details", "detail", "all", "the",
    "from", "for", "with", "and", "or", "of", "in", "to", "by", "me", "please",
}


def _tokens(value: str):
    normalized = re.sub(r"([a-z])([A-Z])", r"\1_\2", value or "")
    normalized = re.sub(r"([A-Za-z])([0-9])", r"\1_\2", normalized)
    normalized = re.sub(r"([0-9])([A-Za-z])", r"\1_\2", normalized)
    parts = re.split(r"[^A-Za-z0-9]+", normalized.upper())
    return [part.lower() for part in parts if part]


def _singular(token: str):
    if token.endswith("ies") and len(token) > 4:
        return token[:-3] + "y"
    if token.endswith("s") and len(token) > 3:
        return token[:-1]
    return token


def _glossary_lookup():
    lookup = {}
    for concept, aliases in BUSINESS_GLOSSARY.items():
        expanded = set(aliases + [concept])
        for alias in list(expanded):
            expanded.add(_singular(alias))
        for alias in expanded:
            lookup[alias.lower()] = concept
    return lookup


GLOSSARY_LOOKUP = _glossary_lookup()


def _expand_query_terms(question: str):
    direct_tokens = [_singular(token) for token in _tokens(question)]
    phrase = re.sub(r"[^a-z0-9]+", "_", (question or "").lower()).strip("_")
    concepts = set()
    expanded = set(direct_tokens)
    for alias, concept in GLOSSARY_LOOKUP.items():
        if "_" in alias and alias in phrase:
            concepts.add(concept)
            expanded.add(alias)
            expanded.add(concept)
            expanded.update(BUSINESS_GLOSSARY.get(concept, []))
    for token in direct_tokens:
        concept = GLOSSARY_LOOKUP.get(token)
        if concept:
            concepts.add(concept)
            expanded.add(concept)
            expanded.update(BUSINESS_GLOSSARY.get(concept, []))
    return {
        "tokens": sorted(set(direct_tokens)),
        "concepts": sorted(concepts),
        "expanded_terms": sorted({_singular(term.lower()) for term in expanded if term}),
    }


def _row_value(row, key):
    return row.get(key) or row.get(key.lower()) or row.get(key.upper()) or ""


def resolve_semantic_schema(question: str, schema_rows: list, selected_table: str = "", limit: int = 5):
    query = _expand_query_terms(question)
    expanded_terms = set(query["expanded_terms"])
    concepts = set(query["concepts"])
    selected = (selected_table or "").upper()

    tables = defaultdict(lambda: {"columns": [], "column_types": {}})
    for row in schema_rows or []:
        table = str(_row_value(row, "TABLE_NAME")).upper()
        column = str(_row_value(row, "COLUMN_NAME")).upper()
        dtype = str(_row_value(row, "DATA_TYPE")).upper()
        if not table or not column:
            continue
        tables[table]["columns"].append(column)
        tables[table]["column_types"][column] = dtype

    scored = []
    for table, payload in tables.items():
        table_tokens = [_singular(token) for token in _tokens(table)]
        score = 0
        reasons = []

        for token in table_tokens:
            concept = GLOSSARY_LOOKUP.get(token)
            if token in expanded_terms:
                score += 36
                reasons.append(f"table token '{token}' matched the user request")
            if concept and concept in concepts:
                score += 42
                reasons.append(f"table token '{token}' maps to business concept '{concept}'")

        matched_columns = []
        for column in payload["columns"]:
            column_tokens = [_singular(token) for token in _tokens(column)]
            column_score = 0
            for token in column_tokens:
                concept = GLOSSARY_LOOKUP.get(token)
                if token in expanded_terms:
                    column_score += 8
                if concept and concept in concepts:
                    column_score += 12
            if column_score:
                score += min(column_score, 28)
                matched_columns.append(column)

        if selected and table == selected:
            score += 12
            reasons.append("currently selected table")

        if matched_columns:
            reasons.append(f"matched columns: {', '.join(matched_columns[:6])}")

        if not score:
            continue

        confidence = "High" if score >= 70 else "Medium" if score >= 35 else "Low"
        scored.append({
            "table": table,
            "score": score,
            "confidence": confidence,
            "matched_columns": matched_columns[:10],
            "columns": payload["columns"],
            "reasons": reasons[:5],
        })

    scored.sort(key=lambda item: (-item["score"], item["table"]))
    top = scored[:limit]
    best_score = top[0]["score"] if top else 0
    gate = "native_ready" if best_score >= CONFIDENCE_THRESHOLDS["native"] else "ai_schema_scan" if best_score >= CONFIDENCE_THRESHOLDS["ai_schema_scan"] else "needs_confirmation"
    return {
        "query_tokens": query["tokens"],
        "expanded_terms": query["expanded_terms"][:40],
        "concepts": query["concepts"],
        "top_matches": top,
        "best_table": top[0]["table"] if top else selected,
        "confidence": top[0]["confidence"] if top else "Low",
        "best_score": best_score,
        "gate": gate,
        "thresholds": CONFIDENCE_THRESHOLDS,
    }


def semantic_summary_text(resolution: dict):
    if not resolution or not resolution.get("top_matches"):
        return ""
    lines = [
        "Semantic Resolver:",
        f"Expanded business concepts: {', '.join(resolution.get('concepts') or ['none'])}",
    ]
    for match in resolution.get("top_matches", [])[:5]:
        columns = ", ".join(match.get("matched_columns", [])[:6]) or "table name only"
        reason = "; ".join(match.get("reasons", [])[:3])
        lines.append(
            f"Candidate {match['table']}: score={match['score']}, confidence={match['confidence']}, "
            f"matched={columns}. {reason}"
        )
    return "\n".join(lines)
