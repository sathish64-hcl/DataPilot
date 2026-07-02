# Spend-Aware AI Engine Hackathon Demo

## Idea

Spend-Aware AI Engine shows how an organization can reduce LLM token usage without depending on external AI gateways or observability tools.

The key message:

```text
The system thinks before it spends.
```

DataPilot Studio already knows how to run deterministic Snowflake SQL, inspect metadata, compare Native and AI workflows, and track LLM usage. Spend-Aware AI Engine adds an internal governance layer that estimates naive prompt cost, chooses a native-first execution path, trims context, and records avoided tokens.

## Demo Use Case

Use the Snowflake-backed Incident Command Center with:

```text
KAGGLE.INCIDENT_MGMT
```

Ask:

```text
Which applications violate SLA the most?
```

or:

```text
Which applications have the highest operational cost?
```

## What A Naive Copilot Would Do

A normal AI-first copilot may send too much context:

- Full incident schema
- Application, employee, change request, and incident table details
- Broad result samples
- Dashboard summaries
- User question
- Instructions for SQL, root cause, risk, remediation, and executive summary

That approach is expensive because the LLM receives database context that SQL can handle more reliably.

## What Spend-Aware AI Engine Does

1. Classifies the question as incident analytics.
2. Runs deterministic Snowflake SQL first.
3. Produces answer-shaped facts such as SLA breach counts, cost impact, or trends.
4. Builds a compact LLM context with only:
   - generated SQL
   - selected result rows
   - selected columns
   - native explanation
5. Reserves the LLM for business narrative, root-cause framing, and recommended actions.
6. Records:
   - naive prompt tokens
   - optimized prompt tokens
   - tokens avoided
   - estimated cost avoided
   - decision trace

## Semantic Table Resolver

Spend-Aware AI Engine becomes more powerful when Native can identify the right table without using an LLM.

DataPilot now includes a Semantic Table Resolver for the AI Analyst Studio. It expands business words and common abbreviations before SQL generation. For example:

```text
customer -> customer, cust, client, party
transaction -> transaction, txn, payment, sales
details -> details, dtl, data, profile, master
```

If a user asks:

```text
Customer data needs to be fetched
```

and the schema has:

```text
CUST_DETAILS
```

the resolver can rank `CUST_DETAILS` as the best candidate by matching the table abbreviation and related fields. The UI shows the matched concept, candidate table scores, confidence, and matched columns.

This helps reduce cost because DataPilot can resolve many table-selection problems natively and only ask the LLM when confidence is low.

The native generator also includes targeted business rules for common card/account questions. For example:

```text
how many debit cards has with chip and the credit limit on the card is more than 10k$ and the account is opened within last 10 years
```

When the resolver finds fields such as `CARD_TYPE`, `HAS_CHIP`, `CREDIT_LIMIT`, and `ACCT_OPEN_DATE`, Native generates a filtered `COUNT(*)` query instead of a generic table preview.

## Resolver Confidence Gate

The Semantic Table Resolver now returns a gate:

```text
native_ready
ai_schema_scan
needs_confirmation
```

When confidence is high, Native can generate SQL without spending LLM tokens.

When confidence is below the Native threshold, Native SQL generation is paused instead of producing a misleading query. In AI or Compare mode, DataPilot expands the schema context so the model can scan the available table and field list and pick from real candidates.

This creates a safer flow:

```text
High confidence:
  Native can generate SQL.

Medium / low confidence with AI enabled:
  AI scans the broader schema context and must choose real tables and fields.

Low confidence without AI:
  DataPilot asks the user to pick a table/view or switch to AI/Compare.
```

## SQL Validation Firewall

After SQL generation, DataPilot validates the query before treating it as executable:

- referenced tables must exist in the schema metadata
- qualified field references must exist on the referenced table
- invalid generated SQL is blocked before execution
- AI/Compare mode can attempt a repair using the real schema context

This prevents a common enterprise AI failure mode:

```text
The model generated a plausible-looking query against a table or column that does not exist.
```

The UI shows a SQL Validation Firewall card with pass/warning/blocked status, checked tables, checked fields, and missing references.

## Prompt Reuse Cache

DataPilot now stores exact prompt responses locally by operation, provider, model, and prompt payload.

For deterministic app operations, the cache key uses the stable system prompt and current user/schema payload. Prior chat memory is intentionally excluded so repeating the same question can hit cache instead of being treated as a different prompt after every turn.

When the same AI request is repeated:

```text
First run:
  Provider call is made.
  Tokens are recorded.
  Response is cached.

Second run:
  Prompt cache hit.
  No provider call.
  Provider tokens spent: 0.
```

Execution Footprint shows cache entries, hits, misses, saved tokens, and avoided cost.

## Token Budget Guardrails

DataPilot enforces a local token budget before provider calls are made. If projected usage exceeds the configured limit, the LLM call is blocked and the app falls back to native behavior where possible.

Default budget:

```text
100,000 tokens
```

Optional environment controls:

```powershell
$env:DATA_PILOT_AI_TOKEN_BUDGET = "100000"
$env:DATA_PILOT_AI_BUDGET_WARN_PCT = "0.8"
```

Execution Footprint shows budget, used tokens, remaining tokens, warning status, and blocked calls.

## Explainability Timeline

DataPilot also shows an Explainability Timeline for generated SQL and Compare pipelines.

The timeline answers:

```text
Why did the system choose this table?
Did Native proceed or did AI scan more schema?
Was the prompt served from cache?
Were token budget guardrails checked?
Did the SQL Validation Firewall pass or block the query?
Did AI need to repair the SQL?
Did execution return preview rows?
```

Timeline steps:

- Schema Scope
- Resolver Confidence Gate
- SQL Generation Path
- Cache and Budget Check
- SQL Validation Firewall
- Auto Repair Loop, when used
- Execution Preview

This makes the demo stronger because the audience can see that the organization is not blindly trusting generated SQL. DataPilot explains each control point before the query is used.

## Demo Flow

1. Open **Incident Command Center**.
2. Refresh the dashboard.
3. Set execution mode to **Compare** from the sidebar.
4. Run:

```text
Which applications violate SLA the most?
```

5. Show the Native and AI pipelines.
6. Show the **Spend-Aware AI Engine** panel:
   - naive prompt estimate
   - optimized prompt estimate
   - tokens avoided
   - decision trace
7. Open **AI Analyst Studio** in Compare mode and ask a natural-language SQL question.
8. Show **Explainability Timeline** beside the generated SQL:
   - resolver selected the schema scope
   - cache and budget were checked before provider use
   - SQL Validation Firewall validated real metadata
   - execution preview completed or was blocked safely
9. Open **Execution Footprint**.
10. Show cumulative Spend-Aware decisions and total avoided tokens.
11. Show **Prompt Reuse Cache** and explain that repeated prompts can return with zero provider tokens.
12. Show **Token Budget Guardrails** and explain how budget thresholds prevent uncontrolled token spend.

## Talk Track

```text
This is not just token tracking. This is token governance.

Instead of sending everything to an LLM, DataPilot asks: can Snowflake and native logic answer the factual part first?

For incident analytics, SQL is better at counts, rankings, SLA breaches, and cost aggregation. The LLM is better at explaining impact, risk, and next actions.

Spend-Aware AI Engine combines both. It uses native execution to gather facts, sends a much smaller context to the model, and records the avoided token spend.

For repeated questions, Prompt Reuse Cache avoids spending provider tokens at all. For runaway usage, Token Budget Guardrails stop calls before they exceed the configured budget.

Explainability Timeline ties those controls together. It shows the resolver, generation path, cache/budget check, SQL firewall, repair loop, and execution outcome in order.

That means we get the real power of LLMs without turning every database question into an expensive prompt.
```

## Why It Matters

- Reduces token cost before requests are made.
- Keeps sensitive enterprise data out of unnecessary prompts.
- Lowers hallucination risk because AI receives SQL-backed facts.
- Gives leaders a measurable cost-savings story.
- Gives engineers a self-contained implementation that does not rely on external tools.

## Future Extensions

- Add per-user or per-team token budgets.
- Add automatic model routing by task complexity.
- Add semantic prompt cache for repeated report/explanation requests.
- Add RAG context trimming for Document Hub.
- Add SQL validation before AI-generated queries are executed.
- Add exportable explainability timelines for audit reviews.
