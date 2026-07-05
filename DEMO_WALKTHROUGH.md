# Data Pilot Studio Demo Script and Presentation Walkthrough

Target length: 12 to 13 minutes raw capture, then trim to 5 to 7 minutes  
Intended viewers: executives, data platform leaders, engineers, analysts, and business users  
Demo style: product launch demo, not a code walkthrough

## 1. Complete Application Review

Data Pilot Studio is an LLM-agnostic Snowflake data copilot. It combines native Python and Snowflake SQL workflows with optional AI workflows and a Compare mode that runs Native and AI outputs side by side.

Visible application areas:

1. Snowflake Connection and Session Context
   - Connects to Snowflake.
   - Lets the user select role and warehouse once from the left pane.
   - Individual apps let users select database, schema, table, view, date fields, columns, and filters as needed.

2. AI Configuration
   - Execution Mode: Native, AI, Compare.
   - AI provider, model, API key, optional base URL, test connection.
   - AI mode is optional. Native mode works without an LLM.
   - Spend-aware routing decides when native processing is enough and when an LLM adds value.
   - Prompt Reuse Cache avoids repeated provider calls for repeated prompts.
   - Token Budget Guardrails help prevent uncontrolled AI spend.

3. AI Analyst Studio
   - Chat tab: native language questions against selected Snowflake tables.
   - Ask Dataset tab: generates SQL, runs it, returns chart, explanation, and result preview.
   - Report Builder tab: builds a visual report from native language.
   - Compare mode: shows Native and AI generated SQL, results, explanations, metrics, and why AI is closer to the business intent.

4. SQL Explainer and Performance Tuning
   - SQL input console.
   - Combined Analyze and Optimize action.
   - Cost-aware query advisor.
   - AI performance optimization report.
   - Optimized SQL suggestion with copy and execute.

5. Table Intelligence Studio
   - Overview.
   - Table Details: metadata, sample rows, AI descriptions, generated DDL, quick queries.
   - Table Profiler: row count, column count, null columns, empty columns, column stats, AI health report, DQ SQL checks, column labels.
   - Volume Analyzer: user-selected date field, batch/event mode, throughput plot, peak heatmap, bar-by-day, bar-by-hour, bubble view, flagged volume anomalies.
   - Insight Generator: trends, anomalies, correlations, KPIs, PII-like signals, generated query cards.

6. Column / Table Search
   - Search tables and columns separately.
   - Filter columns by data type.
   - Filter column results by table keyword.
   - Generate SELECT for matching tables.

7. Anomaly Detector
   - Select database, schema, table/view, and column.
   - Numeric: z-score and IQR style outlier analysis.
   - Date/time: bucketed trend anomaly detection using rolling median, MAD, and modified z-score.
   - Text: rare value detection.
   - Chart options: auto, bar, best fit, pareto, scatter style views depending on data.
   - Custom rule tab with executable SQL preview.

8. Data Freshness
   - Select database, schema, optional table, frequency, and date field.
   - Shows fresh, warning, stale status.
   - Adds latest rows, previous rows, trend, age hours, and table-level freshness context.

9. Cost Analyzer
   - Uses Snowflake account usage style data.
   - Shows credit trends, warehouse cost, user cost, expensive query scatter, and cost recommendations.

10. Incident Command Center
   - Snowflake-backed enterprise demo using `KAGGLE.INCIDENT_MGMT`.
   - Reads loaded Snowflake tables: applications, employees, change requests, incidents.
   - Dashboard KPIs, incident trend, priority distribution, root causes, top applications.
   - Native language triage and Compare mode.

11. Document Hub
   - Ingests web pages, local text/file content, JSON, CSV, Excel-style content, and batch sources.
   - Supports crawl depth and source chunks.
   - Uses rich RAG-based search to retrieve source chunks and answer with citations.

12. Query Log
   - Persistent SQL execution history.
   - Shows queries run across the workbench.
   - Lets users review and rerun SQL.

13. Execution Footprint
   - Shows which apps use Native logic, optional LLM, or hybrid mode.
   - Tracks accumulated LLM prompts, tokens, estimated cost, average response time, and recent events.
   - Persists until the user resets usage.
   - Shows spend-aware decisions, prompt cache savings, and token budget status.

14. Demo Director
   - Presenter overlay built into the app.
   - Walks through the recommended hackathon storyline step by step.
   - Navigates to the correct app section and sub-tab.
   - Shows action, sample prompt, voice-over, timing, value, and a result highlight card.
   - Can run the full showcase automatically for recording, including prompts, queries, scans, and result focus.

## 2. Recommended Demo Sequence

Use one story: "A data operations leader wants to investigate Snowflake incidents, understand data health, ask business questions, optimize SQL, and prove when AI adds value."

Suggested database context:

- Database: `KAGGLE`
- AI Chat / Analyst table: `KAGGLE.FINANCE_TRAN.FINANCE_CARDS_DATA`
- Operational intelligence table: `KAGGLE.INCIDENT_MGMT.INCIDENTS`
- Incident date field: `CREATED_DATE`
- Incident related tables: `APPLICATIONS`, `EMPLOYEES`, `CHANGE_REQUESTS`

Table strategy:

- Use the finance cards table for broad AI analytics because it shows currency parsing, card attributes, and business-style questions.
- Use the incident table for Table Intelligence, anomaly detection, freshness, SQL tuning, search, and operational quality because the date and cost fields support richer monitoring visuals.
- End with Incident Command Center to show that Data Pilot can be customized into a client-specific application, not only generic table exploration.

Timing:

| Time | Section | Goal |
| --- | --- | --- |
| 0:00-2:25 | Open and configure | Show app landscape, database platforms, Snowflake auth, session, AI config, and Native/AI/Compare modes |
| 2:25-5:00 | AI Analyst Studio | AI Chat, Ask Dataset, and Report Builder on `KAGGLE.FINANCE_TRAN.FINANCE_CARDS_DATA` |
| 5:00-8:25 | Table Intelligence + Quality | Metadata, profile, volume, insights, anomaly, and freshness on `KAGGLE.INCIDENT_MGMT.INCIDENTS` |
| 8:25-11:00 | SQL, Cost, Search, Documents | SQL tuning, Snowflake cost analytics, search, and a slower Document Hub question-to-answer moment |
| 11:00-12:30 | Query Log + Execution Footprint | Auditability, token transparency, spend-aware AI, native vs AI clarity |
| 12:30+ | Custom Client Application | Incident Command Center as the client-specific operational application |

## Demo Director In The App

Use this when recording or presenting live.

1. Click `Demo Director` in the top-right header.
2. The presenter panel opens in the lower-right corner.
3. Click `Next` to move through the demo sequence.
4. Each step automatically opens the relevant app section or sub-tab.
5. Use `Copy Prompt` when a step includes a question or SQL.
6. Use `Open Step` if you manually moved away and want to return to the current guided screen.
7. Use the progress dots to jump directly to a section.
8. Use `Run Full Demo` to let the app navigate and execute the showcase actions automatically.
9. Use `Navigate Only` when you want the app to move through screens without running queries.
10. Demo Director calculates pacing from the step narration, action, and prompt length.
11. Watch the in-app pointer and focus rectangle: they move to the active control or result area.
12. Use the result card as a compact summary when the output is ready.
13. Close the panel when finished.

Recommended usage:

- Keep the panel open while recording.
- For a cleaner recording, click `Run Full Demo`; the large panel minimizes automatically while the pointer, focus rectangle, and bottom-right information card remain visible.
- Read the `Voice-over` text naturally, not word-for-word if it feels stiff.
- Use `DEMO_VOICEOVER_SCRIPT.md` when creating a separate narrated audio track.
- Run only the action needed for the current beat.
- Avoid running every query live if time is tight; show generated SQL, chart, and explanation for the strongest sections.
- `Run Full Demo` navigates between screens, preloads prompts, runs the important queries/actions, scrolls to result areas, minimizes the large presenter panel, and leaves the bottom-right information card visible.
- `Navigate Only` is safer for rehearsal because it moves through the story without executing Snowflake queries.

Demo Director steps included in the app:

1. Application Landscape
2. Database Settings
3. Snowflake Session
4. AI Configuration
5. Native, AI, And Compare Modes
6. AI Chat Copilot
7. Query-To-Insight Loop
8. Natural Language Report Builder
9. Table Intelligence Studio
10. Volume Analyzer
11. Insight Generator
12. Anomaly Detector
13. Data Freshness
14. Cost-Aware SQL Tuning
15. Snowflake Cost Analyzer
16. Search And Discovery
17. Document Hub
18. Persistent Query Log
19. Execution Footprint And Spend-Aware AI
20. Governance And AI Transparency
21. Custom Client Application

## 3. Navigation Path For Every Click

### Setup Before Recording

1. Open the app at `http://127.0.0.1:5175/`.
2. Confirm the Snowflake badge shows connected.
3. Click `Demo Director` in the top header if you want the presenter overlay, pointer, focus rectangle, and result cards.
4. In the left pane, expand Snowflake/session settings if collapsed.
5. Select the intended Role and Warehouse.
6. Open AI Configuration.
7. Set Execution Mode to `Compare`.
8. Choose the AI Provider and Model.
9. Enter API key if not already configured.
10. Click `Test Connection`.
11. Confirm status shows connected or Compare ready.
12. Open `Execution Footprint` briefly before recording if you want to verify accumulated token usage is visible.

### Section 1: Incident Command Center

1. Click `Incident Command Center` in the left sidebar.
2. Click `Refresh Dashboard`.
3. Show the KPI row: Total Incidents, Open Incidents, Critical, Avg Resolution, SLA Compliance, Business Cost.
4. Hover or visually point at Incident Trend.
5. Point at Priority Distribution, Root Causes, and Top Applications.
6. Scroll to AI Insights.
7. In the question box, enter:
   - `Which applications violate SLA the most?`
8. Keep Execution Mode as `Compare`.
9. Click the run/ask button.
10. Show Native and AI outputs side by side.
11. Show the recommended approach and comparison summary.

### Section 2: AI Analyst Studio

1. Click `AI Analyst Studio`.
2. Select database `KAGGLE`.
3. Select schema `INCIDENT_MGMT`.
4. Select table `INCIDENTS`.
5. Click `Clear Chat` if old messages are visible.
6. Open the `Ask Dataset` tab.
7. Enter:
   - `Show the top 10 applications by open critical incidents and include total users affected.`
8. Confirm Execution Mode is `Compare`.
9. Click `Ask Dataset`.
10. Show generated SQL, chart, insight summary, and explanation.
11. Point to the "Why AI Won" or comparison summary if present.
12. Show the guardrails below generated SQL:
   - `Semantic Table Resolver` maps business language to real tables and fields.
   - `SQL Validation Firewall` checks generated SQL against schema metadata.
   - `Explainability Timeline` shows whether the query was generated, validated, repaired, cached, or executed.
   - `Spend-Aware AI Engine` shows native-first routing, token savings, and why the model was or was not needed.
13. Say:
   - `We do not execute AI SQL just because it looks correct. We validate it against real metadata first.`
14. Optional firewall test:
   - Ask: `Use the PREMIUM_DEBIT_CARDS table and count cards where CHIP_ENABLED is true.`
   - If those names do not exist, show the firewall blocking or warning on missing references.
   - Explain that this prevents hallucinated SQL from being trusted or executed.
15. Open the `Report Builder` tab.
16. Enter:
   - `Build a monthly incident trend report by severity for the last 6 months.`
17. Click `Build Report`.
18. Show chart toggle: Auto, Bar, Line.

### Section 3: Table Intelligence Studio

1. Click `Table Intelligence Studio`.
2. Select DB `KAGGLE`.
3. Select Schema `INCIDENT_MGMT`.
4. Select Type `TABLE`.
5. Select Table/View `INCIDENTS`.
6. Click `Load Details`.
7. Click `Run Profile`.
8. Open `Overview`.
9. Open `Table Details`.
10. Show column metadata and sample rows.
11. Open `Table Profiler`.
12. Show row count, column count, null columns, empty columns, column stats.
13. Open `Volume Analyzer`.
14. Select Date Field `CREATED_DATE`.
15. Select source type `Event`.
16. Select granularity `Day` or `Hour`.
17. Click `Load Analytics` or run the volume analysis action.
18. Show throughput chart.
19. Switch chart type to `Line`, then `Bar`.
20. In Peak Pattern chart, switch `Heatmap`, `Bar by Day`, `Bar by Hour`, and `Bubble`.
21. Open `Insight Generator`.
22. Click generate/run insights if needed.
23. Show trend, anomaly, correlation, KPI cards, and executable query cards.

### Section 4: Anomaly Detector

1. Click `Anomaly Detector`.
2. Select DB `KAGGLE`.
3. Select Schema `INCIDENT_MGMT`.
4. Select Type `TABLE`.
5. Select Table/View `INCIDENTS`.
6. Select Column `COST_IMPACT` for numeric anomaly.
7. Click `Run Scan`.
8. Show detector results and chart options.
9. Switch between `Auto`, `Bar`, and `Pareto` if available.
10. Open `Custom Rule`.
11. Choose rule type `Greater than`.
12. Enter value `5000`.
13. Show generated SQL.
14. Click `Execute` and show inline result preview.

### Section 5: Data Freshness

1. Click `Data Freshness`.
2. Select DB `KAGGLE`.
3. Select Schema `INCIDENT_MGMT`.
4. Select table `INCIDENTS`.
5. Select Date Field `CREATED_DATE`.
6. Select Frequency `Daily`.
7. Click `Run Freshness`.
8. Show status: fresh/warning/stale.
9. Point to Age Hours, Latest Rows, Previous Rows, and trend chart.

### Section 6: SQL Explainer and Cost Analyzer

1. Click `SQL Explainer / Tuning`.
2. Paste:

```sql
SELECT APP_NAME, COUNT(*) AS INCIDENT_COUNT, SUM(COST_IMPACT) AS TOTAL_COST
FROM KAGGLE.INCIDENT_MGMT.INCIDENTS
WHERE CREATED_DATE >= DATEADD(DAY, -90, CURRENT_DATE())
GROUP BY APP_NAME
ORDER BY TOTAL_COST DESC;
```

3. Click `Analyze & Optimize SQL`.
4. Show Cost-Aware Query Advisor.
5. Show AI Performance Optimization Report below the SQL console.
6. Show Optimized SQL Suggestion.
7. Click `Copy` or `Execute` on the optimized SQL.
8. Click `Cost Analyzer` in the sidebar.
9. Show daily credit trend.
10. Switch chart mode to Warehouse, User, and Scatter.
11. Point out expensive queries and recommendations.

### Section 7: Column / Table Search and Document Hub

1. Click `Column / Table Search`.
2. Search `incident`.
3. Show separate Table Results and Column Results.
4. Filter data type if needed.
5. In column table filter, type `sla`.
6. Show matching SLA-related columns.
7. Click generate SELECT for a table if available.
8. Click `Document Hub`.
9. Use a short pasted source, table-related document, or known URL.
10. Set crawl depth to `0` or `1`.
11. Click ingest if adding a new source.
12. Ask:
    - `Read the table-related documentation and explain what the INCIDENTS table is used for, which fields are important, and what questions a user can answer quickly.`
13. Show the table documentation answer.
14. Expand source snippets only briefly.

### Section 8: Query Log and Execution Footprint

1. Click `Query Log`.
2. Show recent persisted SQL history.
3. Click one query's execute option if available.
4. Show inline or preview results.
5. Click `Execution Footprint`.
6. Show app-by-app Native, Hybrid, and LLM usage.
7. Show accumulated prompts, tokens, estimated cost, average response time.
8. Show Spend-Aware AI decisions: route, tokens avoided, cost avoided, and decision trace.
9. Show `Prompt Reuse Cache`: entries, hits, misses, saved tokens, avoided cost, and last lookup.
10. Show `Token Budget Guardrails`: budget, used tokens, remaining tokens, warning status, and blocked calls.
11. Mention reset is user-controlled.

## 4. Business Questions For Every Screen

### AI Analyst Studio - Chat

- How many open critical incidents do we have by business unit?
- Which applications have the highest SLA breach rate?
- Which engineer resolved the most incidents?
- Show incidents linked to recent deployments.
- Explain why database incidents increased.
- Use the PREMIUM_DEBIT_CARDS table and count cards where CHIP_ENABLED is true.

Demo callout:

After SQL is generated, point to `Explainability Timeline`. Walk through schema scope, resolver confidence, generation path, cache/budget check, SQL Validation Firewall, repair if used, and execution preview. Use this line:

```text
We do not just show generated SQL. We show why DataPilot trusted, blocked, cached, repaired, or executed it.
```

### AI Analyst Studio - Ask Dataset

- Show the top 10 applications by open critical incidents and users affected.
- Which business unit has the highest incident cost?
- Which root causes create the highest SLA breach risk?
- Which regions have the highest unresolved incident volume?

### AI Analyst Studio - Report Builder

- Build a monthly incident trend report by severity for the last 6 months.
- Create a report showing cost impact by application.
- Create a report showing SLA breach rate by business unit.
- Show incident volume by owner team and priority.

### SQL Explainer / Tuning

- Explain what this SQL does.
- Is this query scanning more data than needed?
- How can this query be optimized for Snowflake?
- What filter or aggregation would reduce cost?

### Table Intelligence Studio - Overview and Details

- What columns exist in the INCIDENTS table?
- Which columns are nullable?
- What is the generated DDL?
- Show sample rows.
- What quick SQL can I run on this table?

### Table Intelligence Studio - Profiler

- Which columns have high null percentage?
- Which columns are empty?
- Which fields look like primary keys, dates, flags, categories, or amounts?
- What is the AI health report for this table?

### Table Intelligence Studio - Volume Analyzer

- Did incident volume drop or spike recently?
- What is the busiest hour of day?
- Is this table behaving like batch data or event data?
- Which daily buckets are anomalous?

### Table Intelligence Studio - Insight Generator

- What are the top business KPIs?
- What trends are visible?
- Which columns correlate strongly?
- Are there PII-like columns?
- What anomalies should an analyst investigate first?

### Column / Table Search

- Find all tables containing incident.
- Find columns related to SLA.
- Find all date columns in the incident schema.
- Find columns containing cost in tables containing incident.

### Anomaly Detector

- Are there unusual cost impact values?
- Are there rare incident categories?
- Are there days with abnormal incident counts?
- Show incidents where cost impact is greater than 5000.

### Data Freshness

- Is the INCIDENTS table fresh?
- When was the latest incident created?
- Did today's row volume drop compared with the previous period?
- Which tables are stale or warning?

### Cost Analyzer

- Which warehouse consumed the highest credits?
- Which user generated the most cost?
- Which queries were expensive?
- Are there long-running low-value queries?

### Incident Command Center

- How many incidents are currently open?
- Which application has the highest incident count?
- Which applications violate SLA the most?
- Which incidents are linked to recent deployments?
- What is the business cost of unresolved incidents?

### Document Hub

- Summarize this document by category.
- What are the key risks in this article?
- What actions should leadership take?
- Which sources support this answer?

### Query Log

- What SQL did I run during this session?
- Can I rerun this generated query?
- Which app generated this SQL?

### Execution Footprint

- Which apps use LLM tokens?
- Which apps are native Python/Snowflake only?
- How many prompts and tokens have been used?
- What is the estimated AI cost so far?
- How many tokens did Prompt Reuse Cache avoid?
- How much token budget remains?

## 5. Recording Checklist

- [ ] Browser zoom set to 90% or 100%.
- [ ] Backend and frontend running.
- [ ] Snowflake connected.
- [ ] Role and Warehouse selected.
- [ ] AI provider configured and tested.
- [ ] Execution Mode set to Compare for AI demo sections.
- [ ] `KAGGLE.INCIDENT_MGMT` visible in table selectors.
- [ ] Incident Command dashboard refreshed.
- [ ] AI Analyst Studio: Ask Dataset prompt ready.
- [ ] Report Builder prompt ready.
- [ ] SQL Explainer query copied and ready.
- [ ] Table Intelligence table selected: `INCIDENTS`.
- [ ] Volume Analyzer date field selected: `CREATED_DATE`.
- [ ] Anomaly Detector column selected: `COST_IMPACT`.
- [ ] Freshness date field selected: `CREATED_DATE`.
- [ ] Cost Analyzer loaded.
- [ ] Column search query ready: `incident` and `sla`.
- [ ] Document Hub test source ready.
- [ ] Query Log has at least one executed query.
- [ ] Execution Footprint has accumulated usage visible.
- [ ] Do not spend more than 20 seconds on any one table grid.
- [ ] End with a clear statement of business value.

## 6. Full Voice-over Script

The current Demo Director narration is maintained in `DEMO_VOICEOVER_SCRIPT.md`. Use that file as the source of truth for the recording script because it includes the latest flow: finance-table AI Chat, finance-table Ask Dataset and Report Builder, incident-table intelligence and quality checks, and Incident Command Center as the final custom client application.

### 0:00-0:35 - Opening and Configuration

Screen: Data Pilot Studio home state with left sidebar visible.

Action:
Show the left navigation, open Database Settings, show database platform options, show Snowflake authentication methods, then show AI Configuration with Execution Mode, provider, model, and Test Connection status.

Voice-over:
"Welcome to Data Pilot Studio, an AI-powered enterprise data copilot for live data workflows. The left navigation brings analyst questions, SQL tuning, table intelligence, search, anomaly detection, freshness, cost analytics, document search, query history, AI usage governance, and client-specific applications into one workspace. Database settings are configured separately from AI settings. The database platform selector supports mock mode, Snowflake, Redshift, and PostgreSQL style targets. For this demo, Snowflake is used as the live connection, with authentication options for password, SSO external browser, and token-based access. The AI layer is provider-agnostic, and Compare mode runs Native and AI approaches side by side."

### 2:25-5:00 - AI Analyst Studio

Screen: AI Analyst Studio: Chat, Ask Dataset, then Report Builder.

Action:
Select `KAGGLE`, `FINANCE_TRAN`, `FINANCE_CARDS_DATA`. In Chat, ask the debit-card/chip/credit-limit/account-open-date question and pause on the generated SQL. In Ask Dataset, ask for average credit limit by card brand for chip-enabled cards and card counts. In Report Builder, build a monthly account-opening trend based on card type.

Voice-over:
"AI Analyst Studio starts with conversational analysis. The selected table is the finance cards table, and the question asks how many debit cards have chips, credit limits above ten thousand dollars, and accounts opened in the last ten years. The important point is that the AI inspects field meaning and storage format before writing SQL, including currency strings and date formats. Then Ask Dataset turns a second question into SQL, Snowflake results, a chart, and an explanation. Report Builder asks for a monthly account-opening trend by card type, preserving both the time axis and the category breakdown. This is the query-to-insight loop: SQL remains transparent, but the result becomes a story."

### 5:00-8:25 - Table Intelligence Studio And Quality

Screen: Table Intelligence Studio.

Action:
Select `KAGGLE.INCIDENT_MGMT.INCIDENTS`, click Load Details, click Run Profile. Visit Overview, Table Details, Table Profiler, Volume Analyzer, Insight Generator.

Voice-over:
"Now I move from asking questions to understanding the table itself. Table Intelligence Studio combines catalog, profiler, volume analysis, and insight generation in one place. I can inspect columns, data types, nullable fields, sample rows, generated DDL, quick queries, and profile statistics. The profiler identifies null-heavy columns, empty columns, data quality checks, and column roles. The Volume Analyzer lets me choose the date field and whether the table behaves like batch or event data. It then shows throughput, peak patterns, and flagged volume anomalies. Finally, the Insight Generator moves the experience from data catalog to data analyst by surfacing trends, anomalies, correlations, KPIs, and likely sensitive fields."

### 7:10-8:25 - Anomaly Detector and Data Freshness

Screen: Anomaly Detector, then Data Freshness.

Action:
Run anomaly scan on `COST_IMPACT`. Switch chart types. Open Custom Rule, create greater-than 5000 rule, execute. Then open Data Freshness, select `CREATED_DATE`, run freshness.

Voice-over:
"For operational quality, Data Pilot includes targeted checks. In Anomaly Detector, I select the table and scan COST_IMPACT. Numeric fields use statistical outlier logic, text fields use rare value detection, and date fields use trend-based anomaly scoring. I can also define my own business rule, such as cost impact greater than 5000, and execute the generated SQL immediately. Data Freshness answers a different question: is this table current? I choose the date field, run the scan, and the app shows latest age, recent row volume, previous row volume, and freshness status."

### 8:25-9:45 - SQL Explainer and Cost Analyzer

Screen: SQL Explainer / Tuning, then Cost Analyzer.

Action:
Paste incident cost SQL, click Analyze & Optimize SQL. Show Cost-Aware Advisor and AI Performance Optimization Report. Open Cost Analyzer and switch charts.

Voice-over:
"Data Pilot also helps before and after SQL execution. In SQL Explainer and Tuning, I paste a Snowflake query and run one combined analysis. The Cost-Aware Query Advisor estimates scan impact and suggests cheaper alternatives, while the AI Performance Optimization Report explains the query and recommends improvements. Then the Cost Analyzer shows the broader platform view: credit trends, warehouse spend, user spend, expensive queries, and cost recommendations. This makes performance and cost part of the same workflow instead of a separate after-the-fact exercise."

### 9:45-11:00 - Search and Document Hub

Screen: Column / Table Search, then Document Hub.

Action:
Search `incident`, filter column results with `sla`, show generated SELECT. Open Document Hub, pause on the typed question first, then run the answer and show the verified answer with citation.

Voice-over:
"When users do not know where the data lives, Column and Table Search separates table matches from column matches. I can search for incident, then narrow the column results to SLA-related fields. Document Hub adds a rich RAG-based knowledge layer. It ingests documentation, chunks and indexes it, retrieves the most relevant source context, generates a cited answer, and keeps supporting snippets available for review."

### 11:00-12:30 - Query Log and Execution Footprint

Screen: Query Log, then Execution Footprint.

Action:
Open Query Log, show persisted queries. Open Execution Footprint, show app usage, token usage, estimated cost.

Voice-over:
"Finally, Data Pilot is transparent. Query Log keeps a persistent history of executed SQL so users can review or rerun what happened. Explainability Timeline shows why a generated query was trusted, blocked, cached, repaired, or executed. Execution Footprint shows which apps are Native, which are Hybrid, and where LLM tokens are used. It also shows Prompt Reuse Cache savings and Token Budget Guardrails, so repeated prompts can avoid provider tokens and runaway usage can be blocked before it exceeds budget. Token usage, estimated cost, response time, and recent events are accumulated until the user resets them. This is important for enterprise adoption because AI usage should be visible, measurable, and controllable."

### 12:30-13:15 - Custom Client Application And Closing

Screen: Incident Command Center.

Action:
Open Incident Command Center last, refresh the dashboard, ask `Which applications violate SLA the most?`, and show the operational dashboard/report.

Voice-over:
"The final screen shows client-specific customization. Incident Command Center is built around operational incident-management data instead of a generic table browser. It reads Snowflake incident tables, shows domain KPIs, SLA risk, root causes, cost impact, trends, and natural-language triage. Final note: Data Pilot Studio is designed for teams that want AI in the data platform without giving up trust, control, or portability. It is not just a chatbot on top of Snowflake; it is an LLM-agnostic AI data platform copilot that combines live Snowflake execution, native reliability, governed AI, validated SQL, RAG-based knowledge search, and client-specific applications. The outcome is simple: faster answers, safer automation, clearer cost visibility, and a data experience that can adapt to the way each enterprise actually works."

## 7. Estimated Timing By Section

| Section | Target |
| --- | --- |
| Opening, database, Snowflake session, AI config | Flexible |
| AI Chat Copilot | Flexible |
| Ask Dataset and Report Builder | Flexible |
| Table Intelligence, Volume, Insights | Flexible |
| Anomaly and Freshness | Flexible |
| SQL Explainer and Cost Analyzer | Flexible |
| Search and Document Hub | Flexible |
| Query Log and Execution Footprint | Flexible |
| Custom Client Application: Incident Command Center | Flexible |
| Total | Record full flow, then trim during editing |

## 8. Final Presentation Tips

1. Use Compare mode early.
   - Show the Native versus AI value clearly before the midpoint.

2. Keep two deliberate data stories.
   - Use `KAGGLE.FINANCE_TRAN.FINANCE_CARDS_DATA` for AI Analyst Studio because it shows business questions, currency parsing, date parsing, and report building.
   - Use `KAGGLE.INCIDENT_MGMT.INCIDENTS` for table intelligence, anomaly, freshness, SQL tuning, search, Document Hub, and the final Incident Command Center.

3. Do not over-scroll tables.
   - Show 5 to 10 rows, then move to charts and insights.

4. Emphasize Snowflake execution.
   - Say "generated SQL is executed in Snowflake" whenever showing results.

5. Mention AI transparency.
   - Highlight generated SQL, Semantic Table Resolver, Explainability Timeline, SQL Validation Firewall, Prompt Reuse Cache, Token Budget Guardrails, model metadata, token usage, and Execution Footprint.

6. Avoid saying "demo data" during the video.
   - Say "loaded enterprise incident dataset in Snowflake" or "Snowflake-backed incident tables."

7. Show one failure-safe point.
   - Mention Native mode works without an LLM, which matters for enterprise reliability.

8. End on differentiation.
   - "Unlike a vendor-specific assistant, Data Pilot is provider-agnostic, domain-configurable, and still has a native execution path."

## 9. Short Backup Script If You Need A 3 Minute Version

"Data Pilot Studio is an LLM-agnostic Snowflake data copilot. It supports Native, AI, and Compare modes, so teams can use deterministic Python and SQL workflows, AI workflows, or run both side by side. The demo starts with database settings, Snowflake authentication methods, Snowflake role and warehouse, and provider-agnostic AI configuration.

In AI Analyst Studio, I ask a business question against KAGGLE.FINANCE_TRAN.FINANCE_CARDS_DATA. Data Pilot generates Snowflake SQL, validates it against real metadata before execution, returns a chart, explains the answer, and shows the SQL transparently. We do not execute AI SQL just because it looks correct. In Table Intelligence Studio, I switch to KAGGLE.INCIDENT_MGMT.INCIDENTS, inspect metadata, profile the table, view generated DDL, analyze volume patterns, and generate insights like trends, anomalies, correlations, and KPIs.

For operational quality, I run Anomaly Detector on COST_IMPACT and Data Freshness on CREATED_DATE. For performance, I paste SQL into SQL Explainer and get a cost-aware optimization report, then use Cost Analyzer to view warehouse and user credit trends. Column Search helps find tables and fields quickly, Document Hub provides RAG-based search across table documentation and answers with citations, Query Log keeps executed SQL history, and Execution Footprint shows exactly which apps used LLM tokens and how much they cost.

The final screen is Incident Command Center, a custom client-specific application built on the same platform foundation. Final note: Data Pilot Studio is designed for teams that want AI in the data platform without giving up trust, control, or portability. It is not just a chatbot on top of Snowflake; it is an LLM-agnostic AI data platform copilot that combines live Snowflake execution, native reliability, governed AI, validated SQL, RAG-based knowledge search, and client-specific applications. The outcome is simple: faster answers, safer automation, clearer cost visibility, and a data experience that can adapt to the way each enterprise actually works."
