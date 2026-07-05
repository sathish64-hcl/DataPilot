# Data Pilot Studio Demo Director Voice-Over Script

Use this script after clicking `Demo Director` and `Run Full Demo`. The app calculates pacing dynamically, so the times below are guideposts rather than strict cuts. Keep the tone direct, practical, and product-focused.

## 0:00 - Platform Overview

Visual cue: Left navigation at the top.

Voice-over:
Data Pilot Studio brings data analysis, operations, governance, and AI assistance into one live application. The left navigation includes AI analyst workflows, SQL tuning, table intelligence, search, anomaly detection, freshness, cost analytics, document hub, query log, AI usage governance, and a client-specific Incident Command Center.

## 0:30 - Database Settings

Visual cue: Database Settings modal, Database Platform dropdown, Authentication Method dropdown.

Voice-over:
Database settings are separate from AI configuration. The platform dropdown shows the database targets currently represented in the application: mock mode, Snowflake, Redshift, and PostgreSQL style targets. For this demo, Snowflake is used as the live connection. The Snowflake authentication dropdown shows password, SSO through an external browser, and token-based authentication.

## 1:00 - Snowflake Session

Visual cue: Snowflake / Session section in the left pane.

Voice-over:
After connecting, the user chooses Snowflake role and warehouse once from the left pane. That session context is shared across the application, while each workflow still lets the user select database, schema, table, view, column, and date fields as needed.

## 1:25 - AI Configuration

Visual cue: AI Configuration section in the left pane.

Voice-over:
AI configuration is provider agnostic. The user can choose OpenAI, Azure OpenAI, Anthropic Claude, Google Gemini, Snowflake Cortex, Ollama, or a custom OpenAI-compatible endpoint. The API key and optional base URL are configured here, and Test Connection confirms readiness before AI workflows run. The platform also checks prompt reuse cache and token budget guardrails before sending work to a model, so repeated prompts can avoid extra tokens and over-budget requests can be stopped early.

## 1:55 - Native, AI, And Compare Modes

Visual cue: Execution Mode selector.

Voice-over:
Native mode runs Python and Snowflake SQL without an LLM. AI mode adds reasoning, SQL generation, explanations, and recommendations through the configured model. Compare mode runs both pipelines independently and shows which output best matched the user request. This makes the AI value visible: native execution is fast and deterministic, while AI adds intent matching, field interpretation, generated SQL, and business explanation.

## 2:25 - AI Chat Copilot

Visual cue: AI Analyst Studio / Chat with `KAGGLE.FINANCE_TRAN.FINANCE_CARDS_DATA` selected.

Voice-over:
AI Chat is the conversational entry point. Here the selected table is the finance cards table. The question asks how many debit cards have a chip, a credit limit above ten thousand dollars, and an account opened within the last ten years. The assistant needs to inspect the table fields before writing SQL, including formatted currency values, and keep the generated SQL visible. Before execution, the SQL Validation Firewall checks table and column references against Snowflake metadata, so hallucinated fields are caught before they become trusted results.

## 3:20 - Query-To-Insight Loop

Visual cue: AI Analyst Studio / Ask Dataset using the finance cards table.

Voice-over:
The Ask Dataset tab uses the same selected finance table, but turns the request into a more visual result. The prompt asks for average credit limit by card brand for chip-enabled cards, plus the number of cards in each brand. Data Pilot generates SQL, validates it against metadata, executes it in Snowflake, visualizes the result, and explains the answer. The explainability timeline shows the path from table resolution to cache check, budget check, SQL validation, execution, and final insight.

## 4:15 - Natural Language Report Builder

Visual cue: Report Builder chart and generated SQL.

Voice-over:
The Report Builder turns a report request into generated SQL and a chart. Here the prompt asks for a monthly account-opening trend based on card type, so the output preserves both the time axis and the card-type breakdown. This is a lightweight dashboard workflow where the SQL remains transparent and reusable.

## 5:00 - Table Intelligence Studio

Visual cue: Table Intelligence Studio using `KAGGLE.INCIDENT_MGMT.INCIDENTS`.

Voice-over:
The table context now changes to the operational incident table. Table Intelligence combines metadata, sample rows, generated DDL, profile statistics, data quality checks, column labels, and AI-assisted descriptions into one selected-table workspace.

## 5:55 - Volume Analyzer

Visual cue: Volume Analyzer throughput chart and heatmap.

Voice-over:
The Volume Analyzer uses the incident created date field. The user can decide whether a date field behaves like an event timestamp or a batch run marker. The app then plots throughput, heatmaps, spikes, drops, and flagged buckets.

## 6:35 - Insight Generator

Visual cue: Insight cards with executable SQL.

Voice-over:
The Insight Generator turns a table into analyst-style findings such as trends, anomalies, correlations, business KPIs, and likely sensitive fields. Each insight keeps executable SQL nearby so the finding is explainable and reusable.

## 7:10 - Anomaly Detector

Visual cue: Anomaly plot and custom rule SQL.

Voice-over:
The Anomaly Detector runs on the incident cost impact field. Numeric fields use statistical outlier logic, date buckets use median absolute deviation, and custom business rules generate executable SQL with inline result previews.

## 7:50 - Data Freshness

Visual cue: Freshness summary and trend chart.

Voice-over:
Freshness is calculated from the date field selected by the user. For the incident table, the created date is used to show age hours, latest rows, previous rows, volume change, trend, and freshness status.

## 8:25 - Cost-Aware SQL Tuning

Visual cue: SQL Explainer, cost advisor, and optimization report.

Voice-over:
The SQL tuning workflow combines native cost awareness with AI explanation and rewrite suggestions. One action estimates scan exposure, gives cheaper alternatives, explains performance risk, and keeps optimized SQL executable. The advisor is designed to review cost before execution, so large scans, broad selects, missing filters, and expensive patterns are visible while the query can still be improved.

## 9:10 - Snowflake Cost Analyzer

Visual cue: Cost Analyzer charts and recommendations.

Voice-over:
The Cost Analyzer gives a platform-level view of Snowflake credits, estimated spend, warehouse usage, expensive queries, failed queries, and optimization recommendations. This connects technical query behavior to business cost.

## 9:45 - Search And Discovery

Visual cue: Column / Table Search results.

Voice-over:
Search separates table matches from column matches and lets the user narrow column results by table keyword and data type. This reduces noise in large schemas and creates instant SELECT queries for exploration.

## 10:15 - Document Hub

Visual cue: Document Hub question box first, then the verified answer card.

Voice-over:
Document Hub is a rich RAG-based search and answer engine for enterprise knowledge. It can ingest table-related documentation, runbooks, web pages, files, JSON, CSV, Excel, and pasted notes, then chunk and index that content for retrieval. When a user asks about the INCIDENTS table, Document Hub retrieves the most relevant source context, generates a verified answer, cites the source, and keeps supporting snippets available for review.

## 11:00 - Persistent Query Log

Visual cue: Query Log page.

Voice-over:
The Query Log persists generated and executed SQL until the user clears it. This gives the application an audit trail and lets users replay useful queries instead of losing them inside a chat session.

## 11:25 - Execution Footprint And Spend-Aware AI

Visual cue: Execution Footprint dashboard, then Spend-Aware AI Engine.

Voice-over:
Execution Footprint is the control room for understanding how Data Pilot is using native logic, Snowflake execution, and LLM calls across the application. It shows which workflows used AI, how many prompts were sent, how many tokens were consumed, estimated API cost, average response time, and recent AI events. The spend-aware AI engine gathers native Snowflake facts first, sends only useful context to the model, tracks cumulative tokens, estimates API cost, shows cache savings, and makes AI usage governable. The prompt reuse cache avoids repeat calls when the same request and context already produced an answer. Token budget checks show what was used, what remains, and whether a call should continue, warn, or be blocked.

## 11:55 - Governance And AI Transparency

Visual cue: Execution Footprint dashboard.

Voice-over:
Execution Footprint shows which applications use LLM tokens and which run with native Python and Snowflake logic. Usage is cumulative until reset, so AI activity is observable across sessions instead of disappearing when the app closes. This is also where the transparency features come together: semantic table resolver, SQL validation firewall, retry and repair traces, model metadata, token usage, response time, cache savings, and budget status.

## 12:30 - Custom Client Application: Incident Command Center

Visual cue: Incident Command Center dashboard.

Voice-over:
The final screen shows how the platform can be customized for a client-specific workflow. Incident Command Center is built around an operational incident-management dataset instead of a generic table browser. It reads Snowflake incident tables and presents domain KPIs, SLA risk, root causes, cost impact, trends, and natural-language triage. The same platform foundation can support other client-specific applications such as claims review, finance controls, risk monitoring, or supply-chain operations.

## Closing

Voice-over:
Final note: Data Pilot Studio is designed for teams that want AI in the data platform without giving up trust, control, or portability. It is not just a chatbot on top of Snowflake; it is an LLM-agnostic AI data platform copilot that combines live Snowflake execution, native reliability, governed AI, validated SQL, RAG-based knowledge search, and client-specific applications. The outcome is simple: faster answers, safer automation, clearer cost visibility, and a data experience that can adapt to the way each enterprise actually works.
