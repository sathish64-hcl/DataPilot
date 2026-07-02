(async () => {
  console.log("=== STARTING DATA PILOT STUDIO WALKTHROUGH AUTOMATION ===");
  
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  
  // Create an on-screen overlay to display what step the automation is on
  const overlay = document.createElement('div');
  overlay.id = 'automation-overlay';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '20px';
  overlay.style.right = '20px';
  overlay.style.background = 'rgba(10, 13, 26, 0.95)';
  overlay.style.border = '2px solid #0095ff';
  overlay.style.borderRadius = '12px';
  overlay.style.padding = '16px 20px';
  overlay.style.color = '#ffffff';
  overlay.style.fontFamily = 'system-ui, sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.zIndex = 999999;
  overlay.style.boxShadow = '0 10px 40px rgba(0, 149, 255, 0.3), 0 0 20px rgba(0, 149, 255, 0.2)';
  overlay.style.maxWidth = '400px';
  overlay.style.transition = 'all 0.3s ease';
  
  const title = document.createElement('div');
  title.style.fontWeight = 'bold';
  title.style.color = '#00f2fe';
  title.style.marginBottom = '6px';
  title.style.fontSize = '12px';
  title.style.textTransform = 'uppercase';
  title.style.letterSpacing = '1px';
  title.textContent = 'Demo Presenter Info';
  overlay.appendChild(title);
  
  const content = document.createElement('div');
  content.id = 'automation-overlay-content';
  content.style.lineHeight = '1.4';
  content.textContent = 'Initializing Data Pilot Studio Demo Walkthrough...';
  overlay.appendChild(content);
  
  document.body.appendChild(overlay);
  
  function updatePresenterText(text) {
    console.log("[Presenter]: " + text);
    content.textContent = text;
    overlay.style.transform = 'scale(1.02)';
    setTimeout(() => { overlay.style.transform = 'scale(1)'; }, 200);
  }

  function clickSidebarItem(name) {
    const items = Array.from(document.querySelectorAll('.sidebar-item'));
    const target = items.find(item => item.textContent.includes(name));
    if (!target) {
      console.error("Sidebar item not found: " + name);
      return;
    }
    target.click();
    console.log("Clicked sidebar item: " + name);
  }
  
  async function selectOption(label, value) {
    const labels = Array.from(document.querySelectorAll('span'));
    const labelSpan = labels.find(el => el.textContent.trim().startsWith(label));
    if (!labelSpan) {
      console.warn("Label not found: " + label);
      return;
    }
    const trigger = labelSpan.parentElement.querySelector('.searchable-select-trigger');
    if (!trigger) {
      console.warn("Trigger not found for: " + label);
      return;
    }
    
    // Check if already set to this value to avoid opening dropdown unnecessarily
    if (trigger.textContent.trim() === value) {
      console.log(`Label ${label} is already set to ${value}. Skipping selection.`);
      return;
    }
    
    trigger.click();
    await sleep(1000);
    
    const option = Array.from(document.querySelectorAll('div')).find(d => d.textContent.trim() === value && d.style.cursor === 'pointer');
    if (!option) {
      console.warn(`Option ${value} not found in dropdown for ${label}. Closing dropdown.`);
      trigger.click(); // Close dropdown
      await sleep(500);
      return;
    }
    option.click();
    console.log(`Selected option ${value} for label ${label}`);
    await sleep(2000); // Wait extra time for options/schemas to load
  }
  
  // FIXED typeText to avoid Illegal invocation error on different input prototypes (textarea vs input)
  function typeText(element, text) {
    if (!element) return;
    const proto = element.tagName === 'TEXTAREA' 
      ? window.HTMLTextAreaElement.prototype 
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (setter && setter.set) {
      setter.set.call(element, text);
    } else {
      element.value = text;
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  function clickButton(text) {
    const clickableElements = Array.from(document.querySelectorAll('button, .workbench-tab, .tab, div[role="button"], a'));
    const target = clickableElements.find(el => el.textContent.trim() === text || el.textContent.trim().includes(text));
    if (!target) {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const fallbackTarget = allDivs.find(el => el.textContent.trim() === text);
      if (fallbackTarget) {
        fallbackTarget.click();
        console.log("Clicked fallback div: " + text);
        return;
      }
      console.warn("Button/Tab not found: " + text);
      return;
    }
    target.click();
    console.log("Clicked element: " + text);
  }
  
  try {
    // ----------------------------------------------------
    // PRE-WALKTHROUGH SETUP (35 seconds)
    // ----------------------------------------------------
    updatePresenterText("Welcome to Data Pilot Studio. Setting up AI Configuration and connecting to Snowflake...");
    
    // Expand AI Configuration if collapsed
    const aiSectionBtn = Array.from(document.querySelectorAll('.sidebar-section-toggle')).find(el => el.textContent.includes('AI CONFIGURATION'));
    const aiContent = document.querySelector('.sidebar-section-content');
    if (!aiContent && aiSectionBtn) {
      aiSectionBtn.click();
      await sleep(1000);
    }
    
    // Set execution mode to 'Compare'
    const modeSelect = document.querySelector('.sidebar-field select');
    if (modeSelect) {
      modeSelect.value = 'compare';
      modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(1000);
    }
    
    // Click Test Connection
    const testBtn = Array.from(document.querySelectorAll('.sidebar-ai-config button')).find(b => b.textContent.includes('Test') || b.textContent.includes('Testing'));
    if (testBtn) {
      testBtn.click();
      await sleep(3000);
    }
    
    // Scroll sidebar up to click AI Analyst Studio
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.scrollTop = 0;
    await sleep(500);
    
    clickSidebarItem('AI Analyst Studio');
    await sleep(2000);
    
    await selectOption('DB:', 'KAGGLE');
    await selectOption('SCHEMA:', 'INCIDENT_MGMT');
    
    updatePresenterText("Data Pilot Studio is connected to Snowflake. We are running in Compare mode to run Native and AI pipelines side by side.");
    await sleep(10000);
    
    // ----------------------------------------------------
    // SECTION 1: INCIDENT COMMAND CENTER (50 seconds)
    // ----------------------------------------------------
    updatePresenterText("Section 1: Navigating to the Incident Command Center. This dashboard reads loaded Snowflake incident data.");
    clickSidebarItem('Incident Command Center');
    await sleep(3000);
    
    clickButton('Refresh Dashboard');
    await sleep(6000);
    
    updatePresenterText("We see operational KPIs: Open incidents, average resolution time, and business cost impact. Let's run an AI triage query.");
    window.scrollTo({ top: 400, behavior: 'smooth' });
    await sleep(4000);
    
    const iccInput = document.querySelector('input[placeholder*="Ask a question"], input[placeholder*="triage"], textarea');
    if (iccInput) {
      typeText(iccInput, 'Which applications violate SLA the most?');
      await sleep(2000);
      
      const sendBtn = iccInput.parentElement.querySelector('button');
      if (sendBtn) {
        sendBtn.click();
      } else {
        clickButton('Ask');
      }
    }
    
    updatePresenterText("In Compare mode, Data Pilot executes the native deterministic logic and the AI-generated SQL side by side, helping us verify the AI's accuracy.");
    await sleep(25000);
    
    // ----------------------------------------------------
    // SECTION 2: AI ANALYST STUDIO (60 seconds)
    // ----------------------------------------------------
    updatePresenterText("Section 2: AI Analyst Studio. Let's select the INCIDENTS table and run a natural language business query.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clickSidebarItem('AI Analyst Studio');
    await sleep(2000);
    
    await selectOption('TABLE/VIEW:', 'INCIDENTS');
    
    const askTab = Array.from(document.querySelectorAll('.workbench-tab, button')).find(t => t.textContent.trim() === 'Ask Dataset');
    if (askTab) {
      askTab.click();
      await sleep(1000);
    }
    
    const askTextArea = document.querySelector('.report-prompt-input, textarea');
    if (askTextArea) {
      typeText(askTextArea, 'Show the top 10 applications by open critical incidents and include total users affected.');
      await sleep(2000);
      clickButton('Ask Dataset');
    }
    
    updatePresenterText("Data Pilot generates the Snowflake SQL query, executes it, creates a chart, and provides a clear business explanation.");
    await sleep(25000);
    
    const reportTab = Array.from(document.querySelectorAll('.workbench-tab, button')).find(t => t.textContent.trim() === 'Report Builder');
    if (reportTab) {
      reportTab.click();
      await sleep(1000);
    }
    
    updatePresenterText("We can also build complete reports. Let's request a monthly incident trend report by severity.");
    const reportInput = document.querySelector('.report-prompt-input, textarea');
    if (reportInput) {
      typeText(reportInput, 'Build a monthly incident trend report by severity for the last 6 months.');
      await sleep(2000);
      clickButton('Build Report');
    }
    
    updatePresenterText("The report is built instantly! We can toggle between Bar and Line charts to inspect the trends.");
    await sleep(10000);
    clickButton('Bar');
    await sleep(4000);
    clickButton('Line');
    await sleep(8000);
    
    // ----------------------------------------------------
    // SECTION 3: TABLE INTELLIGENCE STUDIO (50 seconds)
    // ----------------------------------------------------
    updatePresenterText("Section 3: Table Intelligence Studio. This page consolidates catalog, profiling, and insight generation.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clickSidebarItem('Table Intelligence Studio');
    await sleep(2000);
    
    clickButton('Load Details');
    await sleep(2000);
    clickButton('Run Profile');
    await sleep(4000);
    
    clickButton('Table Details');
    updatePresenterText("Under Table Details, we see complete column metadata, data types, and sample rows directly from Snowflake.");
    await sleep(8000);
    
    clickButton('Table Profiler');
    updatePresenterText("The Table Profiler displays key statistics: null rates, empty columns, and an AI-generated health check.");
    await sleep(8000);
    
    clickButton('Volume Analyzer');
    updatePresenterText("Volume Analyzer helps us analyze ingestion throughput. We select the date field and load analytics.");
    await selectOption('Date Field:', 'CREATED_DATE');
    clickButton('Load Analytics');
    await sleep(8000);
    
    clickButton('Insight Generator');
    updatePresenterText("The Insight Generator automatically surfaces trends, correlations, business KPIs, and potential PII fields.");
    await sleep(10000);
    
    // ----------------------------------------------------
    // SECTION 4: ANOMALY DETECTOR (40 seconds)
    // ----------------------------------------------------
    updatePresenterText("Section 4: Anomaly Detector. We select a column and run statistical scans to detect data quality anomalies.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clickSidebarItem('Anomaly Detector');
    await sleep(3000);
    
    await selectOption('Column:', 'COST_IMPACT');
    clickButton('Run Scan');
    await sleep(12000);
    
    clickButton('Custom Rule');
    updatePresenterText("We can also define custom quality rules, generate the Snowflake SQL, and execute it inline.");
    const ruleTypeSelect = document.querySelector('select');
    if (ruleTypeSelect) {
      ruleTypeSelect.value = 'greater_than';
      ruleTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const ruleValueInput = document.querySelector('input[type="number"]');
    if (ruleValueInput) {
      typeText(ruleValueInput, '5000');
    }
    await sleep(2000);
    clickButton('Execute');
    await sleep(10000);
    
    // ----------------------------------------------------
    // SECTION 5: DATA FRESHNESS (40 seconds)
    // ----------------------------------------------------
    updatePresenterText("Section 5: Data Freshness. We monitor data recency by analyzing the latest date fields.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clickSidebarItem('Data Freshness');
    await sleep(3000);
    
    await selectOption('Date Field:', 'CREATED_DATE');
    clickButton('Run Freshness');
    updatePresenterText("Data Pilot shows freshness status (fresh/stale), age in hours, latest row count, and volume trends.");
    await sleep(20000);
    
    // ----------------------------------------------------
    // SECTION 6: SQL EXPLAINER AND COST ANALYZER (45 seconds)
    // ----------------------------------------------------
    updatePresenterText("Section 6: SQL Explainer and Cost Analyzer. Let's paste a query to analyze its cost and optimize it.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clickSidebarItem('SQL Explainer / Tuning');
    await sleep(3000);
    
    const sqlTextarea = document.querySelector('textarea, .monaco-editor');
    if (sqlTextarea) {
      const sqlQuery = `SELECT APP_NAME, COUNT(*) AS INCIDENT_COUNT, SUM(COST_IMPACT) AS TOTAL_COST\nFROM KAGGLE.INCIDENT_MGMT.INCIDENTS\nWHERE CREATED_DATE >= DATEADD(DAY, -90, CURRENT_DATE())\nGROUP BY APP_NAME\nORDER BY TOTAL_COST DESC;`;
      typeText(sqlTextarea, sqlQuery);
      await sleep(2000);
      clickButton('Analyze & Optimize SQL');
    }
    
    updatePresenterText("The explainer details query behavior, scan impact, and provides a cost-optimized query recommendation.");
    await sleep(20000);
    
    updatePresenterText("We can also track cost platform-wide using the Cost Analyzer, displaying credit trends and expensive queries.");
    clickSidebarItem('Cost Analyzer');
    await sleep(20000);
    
    // ----------------------------------------------------
    // SECTION 7: SEARCH AND DOCUMENT HUB (40 seconds)
    // ----------------------------------------------------
    updatePresenterText("Section 7: Search and Document Hub. Let's search for columns and tables containing 'incident' and 'sla'.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clickSidebarItem('Column / Table Search');
    await sleep(3000);
    
    const searchInput = document.querySelector('.catalog-main-search');
    if (searchInput) {
      typeText(searchInput, 'incident');
      await sleep(1000);
      clickButton('Search');
    }
    await sleep(4000);
    
    const colFilter = document.querySelector('input[placeholder*="Filter column results"]');
    if (colFilter) {
      typeText(colFilter, 'sla');
      await sleep(1000);
      clickButton('Apply Table Filter');
    }
    await sleep(6000);
    
    updatePresenterText("Document Hub handles unstructured data RAG. We paste operational notes, ingest them, and ask questions.");
    clickSidebarItem('Document Hub');
    await sleep(3000);
    
    const pasteArea = document.querySelector('textarea');
    if (pasteArea) {
      const docText = 'Incident management operations for 2026 show that Database services have a 15% higher risk of SLA breaches due to query bottlenecks. Network infrastructure has a 5% risk, and Application layer has a 12% risk. Recommended mitigation is implementing query caching and auto-scaling resources.';
      typeText(pasteArea, docText);
      await sleep(2000);
      clickButton('Ingest');
    }
    await sleep(5000);
    
    const ragInput = document.querySelector('input[placeholder*="Ask a question"]');
    if (ragInput) {
      typeText(ragInput, 'Summarize the key operational risks by category.');
      await sleep(2000);
      const askBtn = ragInput.parentElement.querySelector('button');
      if (askBtn) askBtn.click();
    }
    await sleep(15000);
    
    // ----------------------------------------------------
    // SECTION 8: QUERY LOG AND EXECUTION FOOTPRINT (30 seconds)
    // ----------------------------------------------------
    updatePresenterText("Section 8: Query Log and Execution Footprint. Query Log maintains a complete local audit trail of executed SQL.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clickSidebarItem('Query Log');
    await sleep(10000);
    
    updatePresenterText("Finally, the Execution Footprint details resource utilization, tracking LLM prompts, token counts, and estimated cost.");
    clickSidebarItem('Execution Footprint');
    await sleep(15000);
    
    updatePresenterText("Thank you for watching the Data Pilot Studio presentation. A portable, powerful, LLM-agnostic Snowflake data copilot.");
    await sleep(10000);
    
    overlay.style.borderColor = '#00ff55';
    updatePresenterText("DEMO WALKTHROUGH COMPLETED SUCCESSFULLY!");
    console.log("=== AUTOMATION RUN COMPLETED SUCCESSFULLY ===");
    
  } catch (err) {
    console.error("Automation error: ", err);
    updatePresenterText("ERROR: " + err.message);
  }
})();
