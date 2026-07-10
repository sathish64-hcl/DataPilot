# Data Pilot Studio Under-7-Minute Voice-Over Script

Use this after clicking `Demo Director` and `Run Full Demo`. The recording should stay under seven minutes, but live Snowflake execution can take longer; trim waiting time if needed.

## 0:00 - 0:40 Opening, Connection, And AI Control

Data Pilot Studio is a governed AI data copilot for live Snowflake workflows. The left navigation shows the platform breadth: analyst questions, SQL tuning, table intelligence, search, anomalies, freshness, cost, documents, query history, governance, and incident operations.

Connection settings and AI settings are separated. Snowflake handles platform, authentication, role, and warehouse. The AI layer is provider agnostic, with Native, AI, and Compare modes. Native runs Python and Snowflake logic, AI adds model reasoning, and Compare shows both outputs side by side.

## 0:40 - 1:20 AI Chat Copilot

AI Chat is the conversational entry point. The selected table is the finance cards table. The question asks how many debit cards have a chip, a credit limit above ten thousand dollars, and an account opened within the last ten years. The assistant needs to inspect field meaning and formatting before writing SQL, including currency values stored as strings. The generated SQL stays visible for trust.

## 1:20 - 1:55 Query-To-Insight Loop

Ask Dataset turns native language into SQL, execution, chart, preview, and explanation. The prompt asks for average credit limit by card brand for chip-enabled cards, plus the number of cards in each brand. This is more than text-to-SQL; it is query-to-insight with transparent SQL and a visual result.

## 1:55 - 2:25 Report Builder

Report Builder converts a reporting request into SQL and a chart. The prompt asks for a monthly account-opening trend by card type, so the result keeps both the time axis and the card-type breakdown. This shows how business users can move from a sentence to a reusable report.

## 2:25 - 3:50 Table Intelligence

Now the context moves to the incident-management table. Table Intelligence combines metadata, sample rows, generated DDL, profile statistics, data quality checks, column labels, and AI-assisted descriptions in one selected-table workspace.

The Volume Analyzer uses the selected date field and lets the user decide whether it behaves like event time or batch time. It plots throughput, heatmaps, peaks, drops, and flagged buckets.

The Insight Generator turns the table into analyst-style findings: trends, anomalies, correlations, KPIs, and likely sensitive fields, with executable SQL beside the insight.

## 3:50 - 5:30 Operations Tools

Anomaly Detector scans the incident cost impact field and shows statistical outlier results plus custom-rule SQL. Freshness uses the user-selected date field, so the system does not guess the recency column. It shows age hours, latest rows, previous rows, trend, and freshness status.

SQL tuning combines cost awareness with optimization guidance. The advisor reviews scan exposure, broad query patterns, missing filters, and optimization opportunities before the query becomes an expensive habit.

Cost Analyzer provides Snowflake spend visibility, while Search separates table matches from column matches and narrows results by table keyword and data type.

## 5:30 - 6:20 Knowledge And Governance

Document Hub is the RAG-based knowledge layer. It can ingest table documentation, runbooks, web pages, files, JSON, CSV, Excel, and pasted notes, then retrieve source chunks and answer with citations.

Query Log preserves generated and executed SQL until the user clears it. Execution Footprint shows where native logic ran, where LLM calls happened, token usage, estimated cost, prompt cache savings, and budget guardrails. This makes AI usage observable and governable.

## 6:20 - 6:42 Agent Command Center

So far, we have seen the specialist tools. Agent Command Center is the agentic layer on top of them.

The user gives a goal: investigate why incident cost and SLA risk increased recently, then prepare a safe remediation plan. The agent plans the investigation, calls metadata search, freshness, anomaly detection, RAG, cost, and incident tools, observes evidence after each step, pauses for approval before remediation-style SQL, and produces an audit-ready report.

This is the key agentic AI pattern: goal, plan, tool use, observation, human approval, final action plan, and audit trail.

## 6:42 - 6:55 Custom Client Application And Close

Incident Command Center shows how the platform can become a client-specific application. It reads Snowflake incident tables and presents operational KPIs, SLA risk, root causes, trends, cost impact, and triage.

Final message: Data Pilot Studio is not just a chatbot on Snowflake. It is a governed, LLM-agnostic enterprise data copilot with reusable specialist tools and an agentic command layer that can reason, act, observe, and explain.
