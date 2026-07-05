# Clipchamp Demo Voice-Over Prompt - Data Pilot Studio

Use this as the Clipchamp production prompt or as the source script for text-to-speech.  
Style: confident enterprise product demo, clear pacing, natural pauses, no hype-heavy language.  
Voice: professional, warm, technical but accessible.  
Pacing: medium-slow. Pause briefly before and after generated SQL, charts, and Document Hub answers.  
Pronunciation notes: say SQL as "S Q L"; say LLM as "L L M"; say Snowflake normally; say KAGGLE as "kaggle".

## Production Prompt

Create a product-demo voice-over for Data Pilot Studio. The video is a raw 12 to 13 minute screen recording that may be trimmed later to 5 to 7 minutes. The narration should follow the visible application flow exactly. Do not mention judges. Speak to a general technical and business audience.

### 0:00 - Platform Overview
Visual: Left navigation at the top of the app.

Narration:
Data Pilot Studio brings data analysis, operations, governance, and AI assistance into one live application. The left navigation includes AI analyst workflows, SQL tuning, table intelligence, search, anomaly detection, freshness, cost analytics, document hub, query log, AI usage governance, and a client-specific Incident Command Center.

### 0:30 - Database Settings
Visual: Database Settings modal, Database Platform options, Snowflake authentication methods.

Narration:
Database settings are separate from AI configuration. The platform selector shows mock mode, Snowflake, Redshift, and PostgreSQL style targets. For this demo, Snowflake is used as the live connection. Snowflake authentication supports password, SSO through an external browser, and token-based authentication.

### 1:00 - Snowflake Session
Visual: Snowflake / Session section in the left pane.

Narration:
After connecting, the user chooses Snowflake role and warehouse once from the left pane. That session context is shared across the application, while each workflow can still select database, schema, table, view, column, and date fields as needed.

### 1:25 - AI Configuration
Visual: AI Configuration section in the left pane.

Narration:
AI configuration is provider agnostic. The user can choose OpenAI, Azure OpenAI, Anthropic Claude, Google Gemini, Snowflake Cortex, Ollama, or a custom OpenAI-compatible endpoint. The API key and optional base URL are configured here, and Test Connection confirms readiness before AI workflows run. The platform also checks prompt reuse cache and token budget guardrails before sending work to a model, so repeated prompts can avoid extra tokens and over-budget requests can be stopped early.

### 1:55 - Native, AI, And Compare Modes
Visual: Execution Mode selector.

Narration:
Native mode runs Python and Snowflake SQL without an LLM. AI mode adds reasoning, SQL generation, explanations, and recommendations through the configured model. Compare mode runs both pipelines independently and shows which output best matched the user request. This makes the AI value visible: native execution is fast and deterministic, while AI adds intent matching, field interpretation, generated SQL, and business explanation.

### 2:25 - AI Chat Copilot
Visual: AI Analyst Studio Chat with KAGGLE dot FINANCE_TRAN dot FINANCE_CARDS_DATA selected.

Narration:
AI Chat is the conversational entry point. Here the selected table is the finance cards table. The question asks how many debit cards have a chip, a credit limit above ten thousand dollars, and an account opened within the last ten years. The assistant inspects field meaning and storage format before writing SQL, including currency-formatted values and date strings, and keeps the generated SQL visible. Before execution, the SQL Validation Firewall checks table and column references against Snowflake metadata, so hallucinated fields are caught before they become trusted results.

### 3:20 - Query-To-Insight Loop
Visual: Ask Dataset tab with finance cards result chart.

Narration:
The Ask Dataset tab turns a native language request into a visual result. The prompt asks for average credit limit by card brand for chip-enabled cards, plus the number of cards in each brand. Data Pilot generates SQL, validates it against metadata, executes it in Snowflake, visualizes the result, and explains the answer. The explainability timeline shows the path from table resolution to cache check, budget check, SQL validation, execution, and final insight.

### 4:15 - Natural Language Report Builder
Visual: Report Builder chart and generated SQL.

Narration:
The Report Builder turns a report request into generated SQL and a chart. Here the prompt asks for a monthly account-opening trend based on card type, so the output preserves both the time axis and the card-type breakdown. This is a lightweight dashboard workflow where the SQL remains transparent and reusable.

### 5:00 - Table Intelligence Studio
Visual: Table Intelligence Studio using KAGGLE dot INCIDENT_MGMT dot INCIDENTS.

Narration:
The table context now changes to the operational incident table. Table Intelligence combines metadata, sample rows, generated DDL, profile statistics, data quality checks, column labels, and AI-assisted descriptions into one selected-table workspace.

### 5:55 - Volume Analyzer
Visual: Volume Analyzer throughput chart and heatmap.

Narration:
The Volume Analyzer uses the incident created date field. The user can decide whether a date field behaves like an event timestamp or a batch run marker. The app then plots throughput, heatmaps, spikes, drops, and flagged buckets.

### 6:35 - Insight Generator
Visual: Insight cards with executable SQL.

Narration:
The Insight Generator turns a table into analyst-style findings such as trends, anomalies, correlations, business KPIs, and likely sensitive fields. Each insight keeps executable SQL nearby so the finding is explainable and reusable.

### 7:10 - Anomaly Detector
Visual: Anomaly plot and custom rule SQL.

Narration:
The Anomaly Detector runs on the incident cost impact field. Numeric fields use statistical outlier logic, date buckets use median absolute deviation, and custom business rules generate executable SQL with inline result previews.

### 7:50 - Data Freshness
Visual: Freshness summary and trend chart.

Narration:
Freshness is calculated from the date field selected by the user. For the incident table, the created date is used to show age hours, latest rows, previous rows, volume change, trend, and freshness status.

### 8:25 - Cost-Aware SQL Tuning
Visual: SQL Explainer, cost advisor, and optimization report.

Narration:
The SQL tuning workflow combines native cost awareness with AI explanation and rewrite suggestions. One action estimates scan exposure, gives cheaper alternatives, explains performance risk, and keeps optimized SQL executable. The advisor is designed to review cost before execution, so large scans, broad selects, missing filters, and expensive patterns are visible while the query can still be improved.

### 9:10 - Snowflake Cost Analyzer
Visual: Cost Analyzer charts and recommendations.

Narration:
The Cost Analyzer gives a platform-level view of Snowflake credits, estimated spend, warehouse usage, expensive queries, failed queries, and optimization recommendations. This connects technical query behavior to business cost.

### 9:45 - Search And Discovery
Visual: Column / Table Search results.

Narration:
Search separates table matches from column matches and lets the user narrow column results by table keyword and data type. This reduces noise in large schemas and creates instant SELECT queries for exploration.

### 10:15 - Document Hub
Visual: Document Hub question box first. Pause on the typed question. Then show the verified answer card.

Narration:
Document Hub is a rich RAG-based search and answer engine for enterprise knowledge. It can ingest table-related documentation, runbooks, web pages, files, JSON, CSV, Excel, and pasted notes, then chunk and index that content for retrieval. When a user asks about the INCIDENTS table, Document Hub retrieves the most relevant source context, generates a verified answer, cites the source, and keeps supporting snippets available for review.

### 11:00 - Persistent Query Log
Visual: Query Log page.

Narration:
The Query Log persists generated and executed SQL until the user clears it. This gives the application an audit trail and lets users replay useful queries instead of losing them inside a chat session.

### 11:25 - Execution Footprint And Spend-Aware AI
Visual: Execution Footprint dashboard, then Spend-Aware AI Engine.

Narration:
Execution Footprint is the control room for understanding how Data Pilot is using native logic, Snowflake execution, and LLM calls across the application. It shows which workflows used AI, how many prompts were sent, how many tokens were consumed, estimated API cost, average response time, and recent AI events. The spend-aware AI engine gathers native Snowflake facts first, sends only useful context to the model, tracks cumulative tokens, estimates API cost, shows cache savings, and makes AI usage governable. The prompt reuse cache avoids repeat calls when the same request and context already produced an answer. Token budget checks show what was used, what remains, and whether a call should continue, warn, or be blocked.

### 11:55 - Governance And AI Transparency
Visual: Execution Footprint dashboard.

Narration:
Execution Footprint shows which applications use LLM tokens and which run with native Python and Snowflake logic. Usage is cumulative until reset, so AI activity is observable across sessions instead of disappearing when the app closes. This is also where the transparency features come together: semantic table resolver, SQL validation firewall, retry and repair traces, model metadata, token usage, response time, cache savings, and budget status.

### 12:30 - Custom Client Application: Incident Command Center
Visual: Incident Command Center dashboard.

Narration:
The final screen shows how the platform can be customized for a client-specific workflow. Incident Command Center is built around an operational incident-management dataset instead of a generic table browser. It reads Snowflake incident tables and presents domain KPIs, SLA risk, root causes, cost impact, trends, and natural-language triage. The same platform foundation can support other client-specific applications such as claims review, finance controls, risk monitoring, or supply-chain operations.

### Closing
Visual: Incident Command Center or Execution Footprint.

Narration:
Final note: Data Pilot Studio is designed for teams that want AI in the data platform without giving up trust, control, or portability. It is not just a chatbot on top of Snowflake; it is an LLM-agnostic AI data platform copilot that combines live Snowflake execution, native reliability, governed AI, validated SQL, RAG-based knowledge search, and client-specific applications. The outcome is simple: faster answers, safer automation, clearer cost visibility, and a data experience that can adapt to the way each enterprise actually works.

## Narration-Only Script For Text-To-Speech

Data Pilot Studio brings data analysis, operations, governance, and AI assistance into one live application. The left navigation includes AI analyst workflows, SQL tuning, table intelligence, search, anomaly detection, freshness, cost analytics, document hub, query log, AI usage governance, and a client-specific Incident Command Center.

Database settings are separate from AI configuration. The platform selector shows mock mode, Snowflake, Redshift, and PostgreSQL style targets. For this demo, Snowflake is used as the live connection. Snowflake authentication supports password, SSO through an external browser, and token-based authentication.

After connecting, the user chooses Snowflake role and warehouse once from the left pane. That session context is shared across the application, while each workflow can still select database, schema, table, view, column, and date fields as needed.

AI configuration is provider agnostic. The user can choose OpenAI, Azure OpenAI, Anthropic Claude, Google Gemini, Snowflake Cortex, Ollama, or a custom OpenAI-compatible endpoint. The API key and optional base URL are configured here, and Test Connection confirms readiness before AI workflows run. The platform also checks prompt reuse cache and token budget guardrails before sending work to a model, so repeated prompts can avoid extra tokens and over-budget requests can be stopped early.

Native mode runs Python and Snowflake SQL without an LLM. AI mode adds reasoning, SQL generation, explanations, and recommendations through the configured model. Compare mode runs both pipelines independently and shows which output best matched the user request. This makes the AI value visible: native execution is fast and deterministic, while AI adds intent matching, field interpretation, generated SQL, and business explanation.

AI Chat is the conversational entry point. Here the selected table is the finance cards table. The question asks how many debit cards have a chip, a credit limit above ten thousand dollars, and an account opened within the last ten years. The assistant inspects field meaning and storage format before writing SQL, including currency-formatted values and date strings, and keeps the generated SQL visible. Before execution, the SQL Validation Firewall checks table and column references against Snowflake metadata, so hallucinated fields are caught before they become trusted results.

The Ask Dataset tab turns a native language request into a visual result. The prompt asks for average credit limit by card brand for chip-enabled cards, plus the number of cards in each brand. Data Pilot generates SQL, validates it against metadata, executes it in Snowflake, visualizes the result, and explains the answer. The explainability timeline shows the path from table resolution to cache check, budget check, SQL validation, execution, and final insight.

The Report Builder turns a report request into generated SQL and a chart. Here the prompt asks for a monthly account-opening trend based on card type, so the output preserves both the time axis and the card-type breakdown. This is a lightweight dashboard workflow where the SQL remains transparent and reusable.

The table context now changes to the operational incident table. Table Intelligence combines metadata, sample rows, generated DDL, profile statistics, data quality checks, column labels, and AI-assisted descriptions into one selected-table workspace.

The Volume Analyzer uses the incident created date field. The user can decide whether a date field behaves like an event timestamp or a batch run marker. The app then plots throughput, heatmaps, spikes, drops, and flagged buckets.

The Insight Generator turns a table into analyst-style findings such as trends, anomalies, correlations, business KPIs, and likely sensitive fields. Each insight keeps executable SQL nearby so the finding is explainable and reusable.

The Anomaly Detector runs on the incident cost impact field. Numeric fields use statistical outlier logic, date buckets use median absolute deviation, and custom business rules generate executable SQL with inline result previews.

Freshness is calculated from the date field selected by the user. For the incident table, the created date is used to show age hours, latest rows, previous rows, volume change, trend, and freshness status.

The SQL tuning workflow combines native cost awareness with AI explanation and rewrite suggestions. One action estimates scan exposure, gives cheaper alternatives, explains performance risk, and keeps optimized SQL executable. The advisor is designed to review cost before execution, so large scans, broad selects, missing filters, and expensive patterns are visible while the query can still be improved.

The Cost Analyzer gives a platform-level view of Snowflake credits, estimated spend, warehouse usage, expensive queries, failed queries, and optimization recommendations. This connects technical query behavior to business cost.

Search separates table matches from column matches and lets the user narrow column results by table keyword and data type. This reduces noise in large schemas and creates instant SELECT queries for exploration.

Document Hub is a rich RAG-based search and answer engine for enterprise knowledge. It can ingest table-related documentation, runbooks, web pages, files, JSON, CSV, Excel, and pasted notes, then chunk and index that content for retrieval. When a user asks about the INCIDENTS table, Document Hub retrieves the most relevant source context, generates a verified answer, cites the source, and keeps supporting snippets available for review.

The Query Log persists generated and executed SQL until the user clears it. This gives the application an audit trail and lets users replay useful queries instead of losing them inside a chat session.

Execution Footprint is the control room for understanding how Data Pilot is using native logic, Snowflake execution, and LLM calls across the application. It shows which workflows used AI, how many prompts were sent, how many tokens were consumed, estimated API cost, average response time, and recent AI events. The spend-aware AI engine gathers native Snowflake facts first, sends only useful context to the model, tracks cumulative tokens, estimates API cost, shows cache savings, and makes AI usage governable. The prompt reuse cache avoids repeat calls when the same request and context already produced an answer. Token budget checks show what was used, what remains, and whether a call should continue, warn, or be blocked.

Execution Footprint shows which applications use LLM tokens and which run with native Python and Snowflake logic. Usage is cumulative until reset, so AI activity is observable across sessions instead of disappearing when the app closes. This is also where the transparency features come together: semantic table resolver, SQL validation firewall, retry and repair traces, model metadata, token usage, response time, cache savings, and budget status.

The final screen shows how the platform can be customized for a client-specific workflow. Incident Command Center is built around an operational incident-management dataset instead of a generic table browser. It reads Snowflake incident tables and presents domain KPIs, SLA risk, root causes, cost impact, trends, and natural-language triage. The same platform foundation can support other client-specific applications such as claims review, finance controls, risk monitoring, or supply-chain operations.

Final note: Data Pilot Studio is designed for teams that want AI in the data platform without giving up trust, control, or portability. It is not just a chatbot on top of Snowflake; it is an LLM-agnostic AI data platform copilot that combines live Snowflake execution, native reliability, governed AI, validated SQL, RAG-based knowledge search, and client-specific applications. The outcome is simple: faster answers, safer automation, clearer cost visibility, and a data experience that can adapt to the way each enterprise actually works.
