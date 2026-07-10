import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  MessageSquare, Terminal, Database, ShieldAlert, DollarSign, 
  GitBranch, ShieldCheck, HelpCircle, AlertTriangle, Play, 
  RefreshCw, Layers, Copy, Check, Info, Server, Wifi, 
  AlertCircle, Sparkles, Send, Settings, User, Key, Activity, Table, Trash2
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000';


function SearchableSelect({ value, onChange, options, placeholder, label, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 220 });

  const updatePos = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isWorkbenchSelect = className.includes('workbench');
      const DROPDOWN_WIDTH = isWorkbenchSelect
        ? Math.min(Math.max(rect.width, 340), 560)
        : Math.max(rect.width, 280);
      const viewportWidth = window.innerWidth;

      // If dropdown would overflow right edge, align to the RIGHT of the trigger instead
      let left = rect.left;
      if (left + DROPDOWN_WIDTH > viewportWidth - 8) {
        left = rect.right - DROPDOWN_WIDTH;
      }
      // Clamp to viewport left edge
      left = Math.max(8, left);

      setDropdownPos({
        top: rect.bottom + 6,
        left,
        width: DROPDOWN_WIDTH
      });
    }
  };

  const open = () => { updatePos(); setSearch(''); setIsOpen(true); };
  const close = () => setIsOpen(false);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const portalRoot = document.getElementById('dropdown-portal') || document.body;

  return (
    <div className={`searchable-select-container ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}:</span>
        <div
          ref={triggerRef}
          onClick={isOpen ? close : open}
          className="searchable-select-trigger"
        >
          <span>{value || placeholder}</span>
          <span style={{ fontSize: '9px', opacity: 0.6 }}>▼</span>
        </div>
      </div>

      {isOpen && ReactDOM.createPortal(
        <>
          {/* Full-screen backdrop — captures outside clicks, sits above everything */}
          <div
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483646,
              background: 'transparent',
              cursor: 'default'
            }}
          />
          {/* Dropdown panel — above the backdrop */}
          <div
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxWidth: 'calc(100vw - 16px)',
              zIndex: 2147483647,
              background: '#0a0d1a',
              border: '1px solid rgba(0,149,255,0.4)',
              borderRadius: '10px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,149,255,0.1)',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: `${Math.min(360, Math.max(180, window.innerHeight - dropdownPos.top - 16))}px`,
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#e0e6f0',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div
                onClick={() => { onChange(''); close(); }}
                style={{
                  padding: '9px 12px',
                  fontSize: '12px',
                  lineHeight: '18px',
                  minHeight: '36px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: value === '' ? '#00b4ff' : 'rgba(255,255,255,0.5)',
                  background: value === '' ? 'rgba(0,149,255,0.1)' : 'transparent',
                  fontWeight: value === '' ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = value === '' ? 'rgba(0,149,255,0.1)' : 'transparent'}
              >
                {placeholder}
              </div>
              {filteredOptions.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => { onChange(opt); close(); }}
                  style={{
                    padding: '9px 12px',
                    fontSize: '12px',
                    lineHeight: '18px',
                    minHeight: '36px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    color: value === opt ? '#00b4ff' : '#c8d0e0',
                    background: value === opt ? 'rgba(0,149,255,0.12)' : 'transparent',
                    fontWeight: value === opt ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = value === opt ? 'rgba(0,149,255,0.12)' : 'transparent'}
                >
                  {opt}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div style={{ padding: '6px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  No matches found
                </div>
              )}
            </div>
          </div>
        </>,
        portalRoot
      )}
    </div>
  );
}

function App() {
  const toDateInput = (date) => date.toISOString().slice(0, 10);
  const getRelativeCostRange = (days) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (Number(days) || 30) + 1);
    return { start: toDateInput(start), end: toDateInput(end) };
  };
  const defaultCostRange = getRelativeCostRange(30);

  const [activeTab, setActiveTab] = useState('chat');
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [helpTipsOpen, setHelpTipsOpen] = useState(false);
  const [guidedDemoOpen, setGuidedDemoOpen] = useState(false);
  const [guidedDemoStepIndex, setGuidedDemoStepIndex] = useState(0);
  const [guidedDemoAutoPlay, setGuidedDemoAutoPlay] = useState(false);
  const [guidedDemoRunActions, setGuidedDemoRunActions] = useState(false);
  const [guidedDemoRemaining, setGuidedDemoRemaining] = useState(20);
  const [guidedDemoActionStatus, setGuidedDemoActionStatus] = useState('');
  const [demoDirectorPanelMinimized, setDemoDirectorPanelMinimized] = useState(false);
  const [demoDirectorPointer, setDemoDirectorPointer] = useState({ x: 78, y: 86, label: 'Start here' });
  const [demoDirectorHighlight, setDemoDirectorHighlight] = useState(null);
  const [demoDirectorResultCard, setDemoDirectorResultCard] = useState(null);
  const [activeType, setActiveType] = useState('ALL');
  const [connectionConfig, setConnectionConfig] = useState({
    platform: 'SNOWFLAKE',
    account: 'https://uxcqeib-tb48867.snowflakecomputing.com',
    user: 'HCLHACKATHON',
    password: 'Indian-1234567',
    role: '',
    warehouse: '',
    database: '',
    schema_name: '',
    use_sso: false,
    use_mock: false,
    auth_method: 'PASSWORD',
    token: '',
    host: '',
    port: ''
  });
  
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'connecting',
    message: 'Checking saved database connection...',
    mode: 'SNOWFLAKE'
  });

  // Database dropdown context states
  const [databases, setDatabases] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeDb, setActiveDb] = useState('');
  const [activeSchema, setActiveSchema] = useState('');
  const [activeTable, setActiveTable] = useState('');

  const loadRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/roles`);
      const data = await res.json();
      const rls = data.roles || [];
      setRoles(rls);
      if (rls.length > 0) {
        setActiveRole(rls[0]);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/warehouses`);
      const data = await res.json();
      const whs = data.warehouses || [];
      setWarehouses(whs);
      if (whs.length > 0) {
        setActiveWarehouse(whs[0]);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const handleRoleChange = async (roleName) => {
    setActiveRole(roleName);
    try {
      await fetch(`${API_BASE}/api/connection/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleName })
      });
    } catch (err) {
      console.error('Error setting role:', err);
    }
  };

  const handleWarehouseChange = async (whName) => {
    setActiveWarehouse(whName);
    try {
      await fetch(`${API_BASE}/api/connection/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse: whName })
      });
    } catch (err) {
      console.error('Error setting warehouse:', err);
    }
  };

  async function loadDatabases() {
    try {
      const res = await fetch(`${API_BASE}/api/databases`);
      const data = await res.json();
      const dbs = data.databases || [];
      setDatabases(dbs);
      let defaultDb = '';
      let defaultSchema = '';
      if (dbs.length > 0) {
        defaultDb = dbs.find(dbName => dbName !== 'DEMO_DB') || dbs[0];
        setActiveDb(defaultDb);
        const schemasRes = await fetch(`${API_BASE}/api/schemas?database=${defaultDb}`);
        const schemasData = await schemasRes.json();
        const schs = schemasData.schemas || [];
        setSchemas(schs);
        if (schs.length > 0) {
          defaultSchema = schs.includes('PUBLIC') ? 'PUBLIC' : schs[0];
          setActiveSchema(defaultSchema);
          await loadTables(defaultDb, defaultSchema, activeType);
        }
        await syncWorkbenchContext(defaultDb, defaultSchema);
      }
      await loadRoles();
      await loadWarehouses();
      await fetchMetadata('', defaultDb || null, defaultSchema || null);
      await fetchGovernance(defaultDb || null);
      await loadChatSamples(defaultDb || null, defaultSchema || null);
    } catch (err) {
      console.error('Error fetching databases:', err);
    }
  }

  const loadTables = async (dbName, schemaName, tableType = null) => {
    try {
      const typeParam = tableType !== null ? tableType : activeType;
      const res = await fetch(`${API_BASE}/api/tables?database=${dbName}&schema=${schemaName}&table_type=${typeParam}`);
      const data = await res.json();
      const tbls = data.tables || [];
      setTables(tbls);
      setActiveTable('');
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const handleTypeChange = async (typeVal) => {
    setActiveType(typeVal);
    await loadTables(activeDb, activeSchema, typeVal);
  };

  const handleTableChange = async (tableName) => {
    setActiveTable(tableName);
    // Refresh samples scoped to the selected table
    if (tableName) {
      await loadChatSamples(activeDb, activeSchema, tableName);
    }
  };

  const handleDbChange = async (dbName) => {
    setActiveDb(dbName);
    try {
      await fetch(`${API_BASE}/api/connection/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: dbName })
      });
    } catch (err) {
      console.error('Error setting database context:', err);
    }
    try {
      const res = await fetch(`${API_BASE}/api/schemas?database=${dbName}`);
      const data = await res.json();
      const schs = data.schemas || [];
      setSchemas(schs);
      let defaultSch = '';
      if (schs.length > 0) {
        defaultSch = schs.includes('PUBLIC') ? 'PUBLIC' : schs[0];
        setActiveSchema(defaultSch);
        await loadTables(dbName, defaultSch, activeType);
      } else {
        setSchemas([]);
        setTables([]);
        setActiveSchema('');
        setActiveTable('');
      }
      await fetchMetadata('', dbName, defaultSch || null);
      await fetchGovernance(dbName);
      await loadChatSamples(dbName, defaultSch || null);
      await syncWorkbenchContext(dbName, defaultSch || '');
    } catch (err) {
      console.error('Error in handleDbChange:', err);
    }
  };

  const handleSchemaChange = async (schemaName) => {
    setActiveSchema(schemaName);
    try {
      await fetch(`${API_BASE}/api/connection/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: activeDb, schema_name: schemaName })
      });
    } catch (err) {
      console.error('Error setting schema context:', err);
    }
    await loadTables(activeDb, schemaName, activeType);
    await fetchMetadata('', activeDb, schemaName);
    await loadChatSamples(activeDb, schemaName);
    await syncWorkbenchContext(activeDb, schemaName);
  };

  // State for Chat Copilot
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'ai', 
      text: 'Hello! I am your Data Pilot Copilot. Ask me anything in your native language. Select a Table from the header to see suggested queries tailored to your data.',
      samples: []
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [executingChatQuery, setExecutingChatQuery] = useState(false);
  const [chatResults, setChatResults] = useState(null);
  const [analystStudioTab, setAnalystStudioTab] = useState('chat');
  const [askDatasetQuestion, setAskDatasetQuestion] = useState('');
  const [askDatasetSql, setAskDatasetSql] = useState('');
  const [askDatasetExplanation, setAskDatasetExplanation] = useState('');
  const [askDatasetResult, setAskDatasetResult] = useState(null);
  const [askDatasetCompareResult, setAskDatasetCompareResult] = useState(null);
  const [askDatasetTitle, setAskDatasetTitle] = useState('Dataset Answer');
  const [askDatasetChartType, setAskDatasetChartType] = useState('auto');
  const [askDatasetLoading, setAskDatasetLoading] = useState(false);
  const [reportPrompt, setReportPrompt] = useState('');
  const [reportTitle, setReportTitle] = useState('Untitled Report');
  const [reportSql, setReportSql] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportChartType, setReportChartType] = useState('auto');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [sqlRowLimit, setSqlRowLimit] = useState(100);
  const [workbenchSqlResults, setWorkbenchSqlResults] = useState(null);
  const [workbenchSqlTitle, setWorkbenchSqlTitle] = useState('');
  const [workbenchSqlExecuting, setWorkbenchSqlExecuting] = useState(false);
  const [inlineSqlResults, setInlineSqlResults] = useState({});
  const [inlineSqlExecuting, setInlineSqlExecuting] = useState({});

  // State for SQL Optimizer
  const [sqlQuery, setSqlQuery] = useState(
    'SELECT * FROM LINEITEM l\nJOIN ORDERS o ON l.order_id = o.order_id\nWHERE o.order_date > \'2023-01-01\';'
  );
  const [sqlOptimization, setSqlOptimization] = useState(null);
  const [sqlCostAdvisor, setSqlCostAdvisor] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [analyzingCost, setAnalyzingCost] = useState(false);

  // State for Metadata Discovery
  const [metadataSearch, setMetadataSearch] = useState('');
  const [metadataTables, setMetadataTables] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [dataDictLoading, setDataDictLoading] = useState(false);

  // State for Governance
  const [governanceTableSearch, setGovernanceTableSearch] = useState('CUSTOMER');
  const [governanceGrants, setGovernanceGrants] = useState([]);
  const [loadingGovernance, setLoadingGovernance] = useState(false);

  // State for Cost Dashboard
  const [costData, setCostData] = useState(null);
  const [loadingCost, setLoadingCost] = useState(false);
  const [costChartMode, setCostChartMode] = useState('trend');
  const [costQueryFilter, setCostQueryFilter] = useState('all');
  const [costDateRange, setCostDateRange] = useState(30);
  const [costStartDate, setCostStartDate] = useState(defaultCostRange.start);
  const [costEndDate, setCostEndDate] = useState(defaultCostRange.end);

  // State for Lineage & Impact
  const [impactSearch, setImpactSearch] = useState('CUSTOMER');
  const [impactResult, setImpactResult] = useState(null);
  const [selectedLineageNode, setSelectedLineageNode] = useState(null);

  // State for Data Quality
  const [dqData, setDqData] = useState(null);
  const [loadingDq, setLoadingDq] = useState(false);

  // State for RAG Knowledge Hub
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState(null);
  const [loadingRag, setLoadingRag] = useState(false);
  const [ragDocuments, setRagDocuments] = useState([]);
  const [rssUrl, setRssUrl] = useState('');
  const [rssSourceName, setRssSourceName] = useState('');
  const [documentSourceMode, setDocumentSourceMode] = useState('web');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [documentFormat, setDocumentFormat] = useState('auto');
  const [crawlDepth, setCrawlDepth] = useState(0);
  const [crawlMaxPages, setCrawlMaxPages] = useState(10);
  const [documentIngestStatus, setDocumentIngestStatus] = useState('');
  const [ingestingDocument, setIngestingDocument] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchIngestStatus, setBatchIngestStatus] = useState('');
  const [batchIngestResult, setBatchIngestResult] = useState(null);
  const [ingestingBatch, setIngestingBatch] = useState(false);
  const [ingestingFeed, setIngestingFeed] = useState(false);
  const [feedIngestStatus, setFeedIngestStatus] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadStatus, setFileUploadStatus] = useState('');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const fileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);
  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [activeRole, setActiveRole] = useState('');
  const [activeWarehouse, setActiveWarehouse] = useState('');
  const [aiConfig, setAiConfig] = useState({
    enabled: false,
    processing_mode: 'native',
    provider: 'openai',
    model: 'gpt-4o-mini',
    base_url: '',
    has_api_key: false,
    providers: [],
    usage: {},
    connection_status: { status: 'not_configured', message: 'AI is disabled.' },
    templates: {}
  });
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiConfigOpen, setAiConfigOpen] = useState(true);
  const [snowflakeContextOpen, setSnowflakeContextOpen] = useState(false);
  const [ragSourcesOpen, setRagSourcesOpen] = useState(false);
  const aiNeedsConfig = ['ai', 'compare'].includes(aiConfig.processing_mode);
  const isAiConnected = aiNeedsConfig && aiConfig.enabled && aiConfig.connection_status?.status === 'connected';
  const isAiConfigured = aiNeedsConfig && aiConfig.enabled && !isAiConnected;
  const appExecutionCatalog = [
    {
      id: 'agentCommand',
      name: 'DataOps Agent Command Center',
      mode: 'Agentic',
      llmOps: ['agent_planning', 'rag_answer', 'sql_optimization'],
      nativeWork: 'Plans the investigation, executes Snowflake/RAG/quality/cost tools, records observations, and gates risky remediation.',
      llmWork: 'Optional goal interpretation, root-cause narrative, recommendation wording, and final executive report.',
      note: 'Shows the visible agent loop: goal, plan, tools, observations, approval, and audit trail.'
    },
    {
      id: 'chat',
      name: 'AI Analyst Studio',
      mode: 'Hybrid',
      llmOps: ['nl_to_sql', 'nl_to_sql_compare', 'sql_repair'],
      nativeWork: 'Schema lookup, SQL execution, charts, previews, row limits, comparison scoring.',
      llmWork: 'Native language to SQL, Compare AI pipeline, SQL auto-repair, answer explanation.',
      note: 'Uses LLM only in AI or Compare execution mode.'
    },
    {
      id: 'sql',
      name: 'SQL Explainer / Tuning',
      mode: 'Hybrid',
      llmOps: ['sql_optimization'],
      nativeWork: 'Cost-aware advisor, metadata-based scan estimate, SQL execution preview.',
      llmWork: 'AI performance optimization report, SQL explanation, rewrite suggestions.',
      note: 'Native cost advisor still works without an LLM.'
    },
    {
      id: 'tableDetails',
      name: 'Table Intelligence Studio',
      mode: 'Hybrid',
      llmOps: ['metadata_discovery', 'data_quality'],
      nativeWork: 'Column metadata, samples, DDL, profiler stats, volume analyzer, DQ SQL, insight SQL.',
      llmWork: 'AI descriptions, health narrative, metadata interpretation when AI mode is enabled.',
      note: 'Most profiling and plots are Python/Snowflake SQL.'
    },
    {
      id: 'rag',
      name: 'Document Hub',
      mode: 'Hybrid',
      llmOps: ['rag_answer'],
      nativeWork: 'Ingest web/files/RSS, crawl depth, chunking, retrieval, source snippets.',
      llmWork: 'Source-grounded answer synthesis and summarization when AI mode is enabled.',
      note: 'Falls back to native extractive answers when AI is unavailable.'
    },
    {
      id: 'catalogSearch',
      name: 'Column / Table Search',
      mode: 'Native',
      llmOps: [],
      nativeWork: 'Information schema search, filters, datatype chips, generated SELECT snippets.',
      llmWork: 'None.',
      note: 'No token usage.'
    },
    {
      id: 'anomaly',
      name: 'Anomaly Detector',
      mode: 'Native',
      llmOps: [],
      nativeWork: 'Z-score, MAD, frequency rarity, custom rule SQL, plots and previews.',
      llmWork: 'None.',
      note: 'No token usage.'
    },
    {
      id: 'freshness',
      name: 'Data Freshness',
      mode: 'Native',
      llmOps: [],
      nativeWork: 'Date-field scan, freshness age, SLA buckets, latest/previous rows, trend checks.',
      llmWork: 'None.',
      note: 'No token usage.'
    },
    {
      id: 'cost',
      name: 'Cost Analyzer',
      mode: 'Native',
      llmOps: [],
      nativeWork: 'Snowflake account usage/cost queries, plots, warehouse/query breakdowns.',
      llmWork: 'None.',
      note: 'No token usage.'
    },
    {
      id: 'incidentCommand',
      name: 'Incident Command Center',
      mode: 'Hybrid',
      llmOps: ['incident_investigation', 'nl_to_sql_compare'],
      nativeWork: 'Snowflake-backed incident KPI dashboard, NL keyword routing, charts, and SQL preview.',
      llmWork: 'Executive-style summaries, risk interpretation, recommendations, and Native-vs-AI comparison narrative.',
      note: 'Reads loaded enterprise incident management tables from Snowflake.'
    },
    {
      id: 'queryLog',
      name: 'Query Log',
      mode: 'Native',
      llmOps: [],
      nativeWork: 'Persisted local query history, replay, clear log.',
      llmWork: 'None.',
      note: 'No token usage.'
    }
  ];

  const getAppUsage = (app) => {
    const opUsage = aiConfig.usage?.operation_usage || {};
    return (app.llmOps || []).reduce((acc, op) => {
      const row = opUsage[op] || {};
      acc.prompt_count += Number(row.prompt_count || 0);
      acc.total_tokens += Number(row.total_tokens || 0);
      acc.estimated_cost += Number(row.estimated_cost || 0);
      return acc;
    }, { prompt_count: 0, total_tokens: 0, estimated_cost: 0 });
  };
  const formatTokenCount = (value) => Number(value || 0).toLocaleString();
  const formatSmallUsd = (value) => `$${Number(value || 0).toFixed(4)}`;
  const renderSpendAwarePanel = (spendAware) => {
    if (!spendAware) return null;
    return (
      <div className="glass-card spend-aware-card">
        <div className="glass-card-header">
          <span className="glass-card-title"><DollarSign size={16} /> Spend-Aware AI Engine</span>
          <span className="status-badge">{spendAware.route || 'native-first'}</span>
        </div>
        <div className="spend-aware-hero">
          <div>
            <span>Naive Prompt</span>
            <strong>{formatTokenCount(spendAware.naive_prompt_tokens)}</strong>
          </div>
          <div>
            <span>Optimized Prompt</span>
            <strong>{formatTokenCount(spendAware.optimized_prompt_tokens)}</strong>
          </div>
          <div>
            <span>Tokens Avoided</span>
            <strong className="green">{formatTokenCount(spendAware.tokens_saved)}</strong>
          </div>
          <div>
            <span>Reduction</span>
            <strong>{Number(spendAware.reduction_pct || 0).toFixed(1)}%</strong>
          </div>
          <div>
            <span>Cost Avoided</span>
            <strong>{formatSmallUsd(spendAware.cost_avoided)}</strong>
          </div>
        </div>
        <div className="spend-aware-decision">
          <strong>{spendAware.decision}</strong>
          <span>{spendAware.quality_guardrail || 'Native facts are gathered first; AI is reserved for reasoning and language.'}</span>
        </div>
        <div className="spend-aware-context-grid">
          <div><span>Naive Context</span><p>{spendAware.naive_context}</p></div>
          <div><span>Optimized Context</span><p>{spendAware.optimized_context}</p></div>
        </div>
        <div className="spend-aware-trace">
          {(spendAware.trace || []).map((item, idx) => <div key={idx}><span>{idx + 1}</span>{item}</div>)}
        </div>
      </div>
    );
  };
  const currentExecutionApp = appExecutionCatalog.find(app => app.id === activeTab);
  const [demoDirectorEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === '1'
      || params.get('demoDirector') === '1';
  });
  const demoFinanceContext = {
    database: 'KAGGLE',
    schema: 'FINANCE_TRAN',
    table: 'FINANCE_CARDS_DATA'
  };
  const demoIncidentContext = {
    database: 'KAGGLE',
    schema: 'INCIDENT_MGMT',
    table: 'INCIDENTS',
    dateColumn: 'CREATED_DATE',
    anomalyColumn: 'COST_IMPACT'
  };
  const demoContextLabel = (context) => `${context.database}.${context.schema}.${context.table}`;
  const guidedDemoSteps = [
    {
      tab: 'chat',
      analystTab: 'chat',
      title: 'Application Landscape',
      seconds: 10,
      screen: 'Left navigation applications',
      action: 'Start at the top of the left pane and show the full platform coverage, including Agent Command Center as the orchestration layer.',
      prompt: '',
      narration: 'Data Pilot Studio is a governed AI data platform for live Snowflake work. The left navigation shows the specialist tools, and Agent Command Center is the layer that can plan across those tools.',
      value: 'One workspace for specialist data tools plus an agentic orchestration layer.'
    },
    {
      tab: 'chat',
      analystTab: 'chat',
      openConnectionModal: true,
      title: 'Database Settings',
      seconds: 7,
      screen: 'Database Settings modal',
      action: 'Open Configure Connection, show the Database Platform choices, then show Snowflake authentication methods. Snowflake is used for this live demo.',
      prompt: '',
      narration: 'Database settings are separate from AI settings. The app supports multiple database targets; this run uses Snowflake with role, warehouse, and authentication control.',
      value: 'Database connection, platform choice, and authentication are configured before the application workflows run.'
    },
    {
      tab: 'chat',
      analystTab: 'chat',
      showSnowflakeSession: true,
      title: 'Snowflake Session',
      seconds: 7,
      screen: 'Snowflake / Session section',
      action: 'Show the Role and Warehouse selectors in the left pane. Explain that users choose these once, then every application inherits the session context.',
      prompt: '',
      narration: 'After connecting, the user can choose the Snowflake role and warehouse once from the sidebar. That keeps session control consistent while each application still lets the user pick database, schema, table, view, and date or column fields as needed.',
      value: 'Makes enterprise Snowflake controls visible and reusable.'
    },
    {
      tab: 'chat',
      analystTab: 'chat',
      showAiConfig: true,
      title: 'AI Configuration',
      seconds: 8,
      screen: 'AI Configuration section',
      action: 'Show AI Provider, Model, API key, optional Base URL, Test Connection, and connection status.',
      prompt: '',
      narration: 'AI configuration is also separate. The user can choose OpenAI, Azure OpenAI, Claude, Gemini, Cortex, Ollama, or a custom OpenAI-compatible endpoint, then test the connection before running AI workflows.',
      value: 'Positions the product as an LLM-agnostic enterprise AI data copilot.'
    },
    {
      tab: 'chat',
      analystTab: 'chat',
      showAiConfig: true,
      title: 'Native, AI, And Compare Modes',
      seconds: 8,
      screen: 'Execution Mode selector',
      action: 'Explain Native, AI, and Compare. Native runs Python and Snowflake SQL only. AI routes supported reasoning through the configured model. Compare runs both independently and scores intent match, SQL quality, results, explanation, and performance.',
      prompt: '',
      narration: 'The execution mode is the core differentiator. Native mode proves the app is reliable without an LLM. AI mode adds reasoning, SQL generation, explanation, and recommendations. Compare mode runs both pipelines side by side to show exactly where AI adds value.',
      value: 'This makes the AI value measurable instead of just claimed.'
    },
    {
      tab: 'chat',
      analystTab: 'chat',
      context: 'finance',
      time: '0:40 - 1:20',
      seconds: 40,
      title: 'AI Chat Copilot',
      screen: 'AI Analyst Studio / Chat',
      action: `Select ${demoContextLabel(demoFinanceContext)}, ask a natural-language card analytics question, and show the generated SQL and answer in the chat thread.`,
      prompt: 'How many debit cards have a chip, credit limit greater than 10000 dollars, and account opened within the last 10 years?',
      narration: 'AI Chat is the conversational entry point. In this step, the selected context is the finance cards table. The assistant should inspect the table fields before writing SQL, handle formatted currency values correctly, and return an answer with transparent generated SQL.',
      value: 'Conversational analysis starts from the selected live Snowflake table and keeps SQL visible.'
    },
    {
      tab: 'chat',
      analystTab: 'ask',
      context: 'finance',
      time: '1:20 - 1:55',
      seconds: 35,
      title: 'Query-To-Insight Loop',
      screen: 'AI Analyst Studio / Ask Dataset',
      action: `Use ${demoContextLabel(demoFinanceContext)}, ask a card portfolio question, and show SQL, chart, result preview, explanation, and Compare summary.`,
      prompt: 'Show average credit limit by card brand for cards with chip, and include the number of cards for each brand.',
      narration: 'The user asks in native language against a different Snowflake table. Data Pilot generates SQL, validates it against metadata, executes it in Snowflake, visualizes the result, and explains the answer.',
      value: 'Turns Snowflake results into a story while preserving SQL transparency.'
    },
    {
      tab: 'chat',
      analystTab: 'report',
      time: '1:55 - 2:25',
      seconds: 30,
      title: 'Natural Language Report Builder',
      screen: 'AI Analyst Studio / Report Builder',
      action: 'Build a report and show Auto, Bar, and Line chart options.',
      prompt: 'Build a monthly account opening trend based on the card type',
      narration: 'Report Builder lets an analyst describe the report they want and get generated SQL plus a visual output without manually designing the chart first.',
      value: 'Demo-friendly visual analytics from native language.'
    },
    {
      tab: 'tableDetails',
      tableDetailsTab: 'overview',
      time: '2:25 - 2:55',
      seconds: 30,
      title: 'Table Intelligence Studio',
      screen: 'Overview, Table Details, Profiler',
      action: 'Select INCIDENTS, load details, run profile, and move through metadata, sample rows, profiler stats, AI health, DQ checks, and labels.',
      prompt: '',
      narration: 'Table Intelligence brings catalog, profiling, DDL, quick SQL, and AI-assisted descriptions into one selected-table workflow.',
      value: 'Moves from raw schema browsing to data product understanding.'
    },
    {
      tab: 'tableDetails',
      tableDetailsTab: 'volumeAnalyzer',
      time: '2:55 - 3:25',
      seconds: 30,
      title: 'Volume Analyzer',
      screen: 'Table Intelligence Studio / Volume Analyzer',
      action: 'Select CREATED_DATE, choose Event or Batch, load analytics, and switch throughput and peak-pattern chart options.',
      prompt: '',
      narration: 'Volume Analyzer lets users decide whether a date field represents batch or event behavior, then shows throughput, peak heatmaps, drops, spikes, and flagged buckets.',
      value: 'Makes freshness and operational volume issues visible instead of buried in SQL.'
    },
    {
      tab: 'tableDetails',
      tableDetailsTab: 'insights',
      time: '3:25 - 3:50',
      seconds: 25,
      title: 'Insight Generator',
      screen: 'Table Intelligence Studio / Insight Generator',
      action: 'Generate insights and show KPI, trend, anomaly, correlation, and PII-like cards with executable query cards.',
      prompt: '',
      narration: 'Insight Generator turns a table into analyst-style findings such as trends, anomalies, correlations, business KPIs, and likely sensitive fields.',
      value: 'This is the data catalog becoming a data analyst.'
    },
    {
      tab: 'anomaly',
      anomalyTab: 'scan',
      time: '3:50 - 4:15',
      seconds: 25,
      title: 'Anomaly Detector',
      screen: 'Anomaly Detector',
      action: 'Scan COST_IMPACT, switch plot options, then open Custom Rule and preview executable SQL.',
      prompt: 'Custom rule: COST_IMPACT greater than 5000',
      narration: 'The anomaly app uses statistical and rule-based checks for numeric, date, and text columns, while still giving users executable SQL for custom business rules.',
      value: 'Combines explainable data quality checks with analyst-controlled rules.'
    },
    {
      tab: 'freshness',
      time: '4:15 - 4:35',
      seconds: 20,
      title: 'Data Freshness',
      screen: 'Data Freshness',
      action: 'Select INCIDENTS and CREATED_DATE, run freshness, and show Age Hours, Latest Rows, Previous Rows, and the trend chart.',
      prompt: '',
      narration: 'Freshness is calculated from the date field the user chooses, so the app does not guess which timestamp defines recency.',
      value: 'Practical operational trust check for every table.'
    },
    {
      tab: 'sql',
      time: '4:35 - 5:00',
      seconds: 25,
      title: 'Cost-Aware SQL Tuning',
      screen: 'SQL Explainer / Tuning',
      action: 'Click Analyze & Optimize SQL and show cost advisor, AI performance report, optimized SQL, validation timeline, and execute/copy controls.',
      prompt: `SELECT APP_NAME, COUNT(*) AS INCIDENT_COUNT, SUM(COST_IMPACT) AS TOTAL_COST
FROM KAGGLE.INCIDENT_MGMT.INCIDENTS
WHERE CREATED_DATE >= DATEADD(DAY, -90, CURRENT_DATE())
GROUP BY APP_NAME
ORDER BY TOTAL_COST DESC;`,
      narration: 'SQL tuning combines native cost awareness with AI explanation and rewrite suggestions, so users can understand performance and cost before repeating expensive patterns.',
      value: 'Connects SQL quality to Snowflake spend.'
    },
    {
      tab: 'cost',
      time: '5:00 - 5:15',
      seconds: 15,
      title: 'Snowflake Cost Analyzer',
      screen: 'Cost Analyzer',
      action: 'Show daily trend, warehouse view, user view, scatter plot, and recommendations.',
      prompt: '',
      narration: 'Cost Analyzer gives a platform-level view of credits, expensive queries, warehouse usage, and optimization opportunities.',
      value: 'Makes cost governance visible across technical and business workflows.'
    },
    {
      tab: 'catalogSearch',
      time: '5:15 - 5:30',
      seconds: 15,
      title: 'Search And Discovery',
      screen: 'Column / Table Search',
      action: 'Search incident, then narrow column results with table keyword SLA or date/cost filters.',
      prompt: 'Search: incident. Column table filter: sla.',
      narration: 'Search separates table matches from column matches, then lets users narrow large schemas by data type and table keyword.',
      value: 'Reduces discovery noise in large Snowflake estates.'
    },
    {
      tab: 'rag',
      time: '5:30 - 5:55',
      seconds: 25,
      title: 'Document Hub',
      screen: 'Document Hub',
      action: 'Ask a table-documentation question and show how Document Hub answers from learned web pages, files, JSON, CSV, Excel, and runbook-style content.',
      prompt: 'Read the table-related documentation and explain what the INCIDENTS table is used for, which fields are important, and what questions a user can answer quickly.',
      narration: 'Document Hub can learn table-related documentation, runbooks, data dictionaries, web pages, and files. Users can ask questions without reading the full document, and the answer can be paired with Snowflake table analysis.',
      value: 'Turns table documentation into quick answers for users working with the data.'
    },
    {
      tab: 'queryLog',
      time: '5:55 - 6:05',
      seconds: 10,
      title: 'Persistent Query Log',
      screen: 'Query Log',
      action: 'Show persisted SQL generated and executed across the workbench. Point out replay/execute options on logged queries.',
      prompt: '',
      narration: 'Query Log keeps the SQL history visible after execution, so generated queries are not lost in a chat stream or buried at the bottom of a page.',
      value: 'Gives the demo an audit trail and makes generated SQL reusable.'
    },
    {
      tab: 'executionFootprint',
      time: '6:05 - 6:20',
      seconds: 15,
      title: 'Execution Footprint And Spend-Aware AI',
      screen: 'Execution Footprint',
      action: 'Introduce Execution Footprint, then highlight prompt optimization, tokens avoided, cost avoided, prompt cache savings, and budget status.',
      prompt: '',
      narration: 'Execution Footprint is the control room for AI usage across the application. It shows which workflows used AI, token usage, estimated cost, response time, recent events, prompt cache savings, and token budget status.',
      value: 'Shows enterprise-grade AI governance, not just AI features.'
    },
    {
      time: '6:20 - 6:42',
      seconds: 22,
      tab: 'agentCommand',
      title: 'Agent Command Center',
      screen: 'DataOps Agent Command Center',
      action: 'Run the DataOps Agent goal, show the plan, tool execution timeline, observations, approval gate, and final report.',
      prompt: 'Investigate why incident cost and SLA risk increased recently, then prepare a safe remediation plan.',
      narration: 'The specialist apps are the toolbelt. Agent Command Center is the agentic layer. It accepts a goal, plans the investigation, calls metadata, freshness, anomaly, RAG, cost, and incident tools, observes the evidence, pauses for approval, and produces an audit-ready report.',
      value: 'This is the clearest agentic AI moment: goal, plan, tools, observations, approval, and audit trail.'
    },
    {
      tab: 'incidentCommand',
      time: '6:42 - 6:55',
      seconds: 13,
      title: 'Custom Client Application',
      screen: 'Incident Command Center',
      action: 'Open Incident Command Center last, refresh the dashboard, and ask the SLA question in Compare mode.',
      prompt: 'Which applications violate SLA the most?',
      narration: 'The final application shows client-specific customization. Incident Command Center is built around an operational incident-management dataset instead of a generic table browser. The same platform shell can host custom applications for a client domain, such as incident triage, claims review, finance controls, or supply-chain monitoring.',
      value: 'The platform can be customized into client-specific applications while still using the same Snowflake, AI, query, and governance foundation.'
    }
  ];
  const guidedDemoStep = guidedDemoSteps[guidedDemoStepIndex] || guidedDemoSteps[0];
  const getGuidedDemoStepSeconds = (step) => {
    if (!step) return 18;
    if (step.seconds) return step.seconds;
    const narrationWords = String(step.narration || '').trim().split(/\s+/).filter(Boolean).length;
    const actionWords = String(step.action || '').trim().split(/\s+/).filter(Boolean).length;
    const promptLines = String(step.prompt || '').split('\n').filter(line => line.trim()).length;
    const base = 8 + Math.ceil(narrationWords / 2.3) + Math.ceil(actionWords / 8) + Math.min(12, promptLines * 2);
    return Math.max(14, Math.min(60, base));
  };
  const formatDemoClock = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  };
  const getGuidedDemoStepWindow = (index) => {
    const start = guidedDemoSteps.slice(0, index).reduce((sum, step) => sum + getGuidedDemoStepSeconds(step), 0);
    const end = start + getGuidedDemoStepSeconds(guidedDemoSteps[index]);
    return `${formatDemoClock(start)} - ${formatDemoClock(end)}`;
  };
  const guidedDemoCurrentSeconds = getGuidedDemoStepSeconds(guidedDemoStep);
  const getDemoDirectorCue = (step) => {
    if (!step) return {};
    if (step.openConnectionModal) {
      return {
        focusSelector: '.database-platform-select',
        resultSelector: '.snowflake-auth-method-select',
        resultTitle: 'Database Settings',
        resultBullets: ['Database Platform includes mock mode, Snowflake, Redshift, and PostgreSQL style targets.', 'Snowflake is selected for the live demo.', 'Authentication supports password, SSO external browser, and token-based options.']
      };
    }
    if (step.showSnowflakeSession) {
      return {
        focusSelector: '.sidebar-session-context',
        resultSelector: '.sidebar-session-context',
        resultTitle: 'Snowflake Session Control',
        resultBullets: ['Role and Warehouse are selected once from the left pane.', 'Every application inherits the chosen session context.', 'Users still choose DB, schema, table, view, and fields inside each app.']
      };
    }
    if (step.showAiConfig) {
      return {
        focusSelector: '.sidebar-ai-config',
        resultSelector: '.sidebar-ai-config',
        resultTitle: step.title,
        resultBullets: step.title.includes('Native')
          ? ['Native mode uses Python and Snowflake SQL without LLM calls.', 'AI mode uses the configured model for reasoning, SQL, explanations, and recommendations.', 'Compare mode runs both pipelines independently and explains which output best matched the request.']
          : ['Provider, model, API key, and optional base URL are configured in one place.', 'AI can be enabled only when needed.', 'The Test Connection status makes model readiness visible before the demo.']
      };
    }
    if (step.title === 'Application Landscape') {
      return {
        focusSelector: '.sidebar-menu',
        resultSelector: '.sidebar-menu',
        resultTitle: 'Platform Overview',
        resultBullets: ['The suite covers agent orchestration, analyst chat, SQL tuning, table intelligence, search, anomaly, freshness, cost, incidents, documents, query log, and AI usage.', 'Specialist apps act as tools.', 'Agent Command Center is the visible planner and orchestrator.']
      };
    }
    if (step.title === 'Execution Footprint And Spend-Aware AI') {
      return {
        focusSelector: '.execution-spend-aware-card',
        resultSelector: '.execution-spend-aware-card',
        resultTitle: 'Execution Footprint',
        resultBullets: ['This screen explains where Native, Snowflake, and LLM work happened.', 'Prompt count, tokens, estimated cost, response time, cache savings, and budget status are visible.', 'AI value is measured and governed across sessions.']
      };
    }
    if (step.tab === 'agentCommand') {
      return {
        focusSelector: '.agent-goal-card',
        resultSelector: '.agent-report-card, .agent-approval-card, .agent-timeline-card',
        resultTitle: 'Agentic DataOps Workflow',
        resultBullets: ['The user gives a goal, not a single SQL command.', 'The agent plans, calls specialist tools, observes evidence, and pauses for approval.', 'The final report keeps root cause, recommendation, evidence, SQL, and audit trail together.']
      };
    }
    if (step.title === 'AI Chat Copilot') {
      return {
        focusSelector: '.chat-input-row',
        resultSelector: '.chat-messages',
        resultTitle: 'AI Chat Copilot',
        resultBullets: ['The selected table is visible in the header before the question runs.', 'The prompt asks against the finance cards table, not the incident table.', 'Generated SQL and results remain visible in the conversation.']
      };
    }
    if (step.tab === 'chat' && step.analystTab === 'chat') {
      return {
        focusSelector: '.sidebar-ai-config',
        resultSelector: '.processing-mode-badge',
        resultTitle: 'LLM-Agnostic Control Plane',
        resultBullets: ['Execution mode is visible before the demo starts.', 'AI provider and Snowflake context are configured separately.', 'Native mode can run without token usage.']
      };
    }
    if (step.tab === 'incidentCommand') {
      return {
        focusSelector: '.incident-command-page',
        resultSelector: '.incident-command-hero',
        resultTitle: 'Custom Client Application',
        resultBullets: ['Incident Command Center is a client-specific application built on the same platform shell.', 'It reads the incident-management Snowflake tables and presents domain KPIs, trends, and triage.', 'The same approach can be customized for other client domains.']
      };
    }
    if (step.tab === 'chat' && step.analystTab === 'ask') {
      return {
        focusSelector: '.ask-dataset-control',
        resultSelector: '.ask-dataset-results',
        resultTitle: 'Query-To-Insight Result',
        resultBullets: ['Native language becomes executable Snowflake SQL.', 'The result includes preview rows, chart, explanation, and Compare summary.', 'The SQL remains visible for trust and auditability.']
      };
    }
    if (step.tab === 'chat' && step.analystTab === 'report') {
      return {
        focusSelector: '.report-builder-card',
        resultSelector: '.report-chart-wrap',
        resultTitle: 'Report Built From Native Language',
        resultBullets: ['The app generates report SQL and runs it.', 'Chart controls make the output demo-friendly.', 'This shows analyst productivity, not only query generation.']
      };
    }
    if (step.tab === 'tableDetails' && step.tableDetailsTab === 'overview') {
      return {
        focusSelector: '.table-intelligence-control',
        resultSelector: '.table-intelligence-content',
        resultTitle: 'Single Table Intelligence Workspace',
        resultBullets: ['Metadata, samples, DDL, profiler, DQ checks, and labels live together.', 'The selected Snowflake table remains active across tabs.', 'This combines catalog and profiler workflows cleanly.']
      };
    }
    if (step.tab === 'tableDetails' && step.tableDetailsTab === 'volumeAnalyzer') {
      return {
        focusSelector: '.volume-analyzer-control-grid',
        resultSelector: '.volume-analytics-card',
        resultTitle: 'Operational Volume Analyzer',
        resultBullets: ['User chooses event or batch behavior for the date field.', 'Throughput charts and heatmaps expose peaks and drops.', 'Flagged buckets explain Rolling Median, MAD, and Modified Z signals.']
      };
    }
    if (step.tab === 'tableDetails' && step.tableDetailsTab === 'insights') {
      return {
        focusSelector: '.table-intelligence-content',
        resultSelector: '.insight-card',
        resultTitle: 'Insight Generator',
        resultBullets: ['The table becomes KPI, trend, anomaly, correlation, and PII-like findings.', 'Each insight keeps executable SQL nearby.', 'This is the strongest data-catalog-to-data-analyst moment.']
      };
    }
    if (step.tab === 'anomaly') {
      return {
        focusSelector: '.anomaly-page',
        resultSelector: '.anomaly-chart-card',
        resultTitle: 'Explainable Anomaly Detection',
        resultBullets: ['Numeric columns use Z-score and IQR style outlier views.', 'Date buckets use MAD-based peak/drop detection.', 'Custom rules generate executable SQL with inline result previews.']
      };
    }
    if (step.tab === 'freshness') {
      return {
        focusSelector: '.freshness-date-field-panel',
        resultSelector: '.freshness-detail-card',
        resultTitle: 'Freshness Based On User-Chosen Date Field',
        resultBullets: ['The app does not guess the freshness column.', 'Age Hours, Latest Rows, Previous Rows, and volume change are visible.', 'No-date-field tables get a clear message.']
      };
    }
    if (step.tab === 'sql') {
      return {
        focusSelector: '.sql-input-card',
        resultSelector: '.sql-optimizer-card',
        resultTitle: 'Cost-Aware SQL Tuning',
        resultBullets: ['One button estimates cost and produces optimization guidance.', 'Cost advisor and AI performance report are separated but aligned.', 'Optimized SQL keeps execute and copy controls readable.']
      };
    }
    if (step.tab === 'cost') {
      return {
        focusSelector: '.cost-hero',
        resultSelector: '.cost-chart-shell',
        resultTitle: 'Snowflake Spend Visibility',
        resultBullets: ['Credits, cost, warehouse usage, user usage, and expensive queries are connected.', 'Charts summarize the spend pattern quickly.', 'Recommendations translate history into action.']
      };
    }
    if (step.tab === 'catalogSearch') {
      return {
        focusSelector: '.catalog-search-page',
        resultSelector: '.catalog-results-layout',
        resultTitle: 'Fast Metadata Discovery',
        resultBullets: ['Tables and columns are shown separately.', 'Column results can be narrowed by table keyword.', 'Generated SELECT statements make discovery immediately useful.']
      };
    }
    if (step.tab === 'rag') {
      return {
        focusSelector: '.document-hub-page',
        resultSelector: '.rag-result-card',
        resultTitle: 'Table Documentation Answers',
        resultBullets: ['Learns table-related documents, runbooks, web pages, files, JSON, CSV, and Excel.', 'Answers questions without forcing users to read the full document.', 'Connects documentation context with Snowflake table analysis.']
      };
    }
    if (step.tab === 'queryLog') {
      return {
        focusSelector: '.query-log-page',
        resultSelector: '.query-log-list',
        resultTitle: 'Persistent SQL Audit Trail',
        resultBullets: ['Generated SQL survives app restarts until the user clears it.', 'Logged queries can be replayed from one place.', 'This prevents demo SQL from disappearing into scattered pages.']
      };
    }
    if (step.tab === 'executionFootprint') {
      return {
        focusSelector: '.execution-footprint-page',
        resultSelector: '.execution-overview-card',
        resultTitle: 'AI Governance And Token Transparency',
        resultBullets: ['Shows which apps use LLMs and which remain native.', 'Token usage is cumulative until reset by the user.', 'Spend-aware routing and cache savings are visible.']
      };
    }
    return {
      focusSelector: '.tab-content',
      resultSelector: '.tab-content',
      resultTitle: step.title,
      resultBullets: [step.value]
    };
  };

  const focusDemoDirectorTarget = (selector, label = 'Watch here', attempt = 0) => {
    if (typeof document === 'undefined') return;
    const target = selector ? document.querySelector(selector) : null;
    const fallback = document.querySelector('.tab-content') || document.querySelector('.main-content');
    const element = target || fallback;
    if (!element) return;
    element.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    window.setTimeout(() => {
      const rect = element.getBoundingClientRect();
      if ((rect.width <= 0 || rect.height <= 0) && attempt < 2) {
        focusDemoDirectorTarget(selector, label, attempt + 1);
        return;
      }
      const padding = 10;
      const left = Math.max(padding, rect.left);
      const top = Math.max(padding, rect.top);
      const width = Math.min(window.innerWidth - left - padding, Math.max(120, rect.width));
      const height = Math.min(window.innerHeight - top - padding, Math.max(70, rect.height));
      setDemoDirectorHighlight({ left, top, width, height });
      setDemoDirectorPointer({
        x: Math.min(window.innerWidth - 210, Math.max(28, left + Math.min(width * 0.72, width - 28))),
        y: Math.min(window.innerHeight - 84, Math.max(28, top + 18)),
        label
      });
    }, attempt === 0 ? 520 : 220);
  };

  const waitForDemo = (ms) => new Promise(resolve => window.setTimeout(resolve, ms));

  const findDemoChatSqlBlock = () => {
    if (typeof document === 'undefined') return null;
    const candidates = Array.from(document.querySelectorAll('.demo-chat-sql-block, .chat-bubble.ai .code-container'));
    return [...candidates].reverse().find((element) => {
      const text = element.innerText || '';
      return /\bselect\b/i.test(text) || /generated .*sql/i.test(text);
    }) || null;
  };

  const waitForDemoChatSqlBlock = async (timeoutMs = 9000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const block = findDemoChatSqlBlock();
      if (block) return block;
      await waitForDemo(180);
    }
    return null;
  };

  const waitForDemoChatFirewallCard = async (timeoutMs = 5000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const cards = Array.from(document.querySelectorAll('.chat-bubble.ai .sql-firewall-card'));
      const card = cards[cards.length - 1];
      if (card) return card;
      await waitForDemo(180);
    }
    return null;
  };

  const waitForLatestDemoChatElement = async (selector, timeoutMs = 5000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const elements = Array.from(document.querySelectorAll(selector));
      const element = elements[elements.length - 1];
      if (element) return element;
      await waitForDemo(180);
    }
    return null;
  };

  const focusDemoChatLayer = async (selector, label, options = {}) => {
    const element = await waitForLatestDemoChatElement(selector, options.timeoutMs || 5000);
    if (!element) return false;
    const activeClass = options.activeClass || 'demo-active-chat-layer';
    element.classList.add(activeClass);
    element.scrollIntoView?.({ block: options.block || 'nearest', inline: 'nearest', behavior: 'smooth' });
    await waitForDemo(options.afterScrollPause || 1000);
    focusDemoDirectorTarget(`.${activeClass}`, label);
    await waitForDemo(options.holdMs || 2600);
    element.classList.remove(activeClass);
    return true;
  };

  const parkDemoDirectorPointer = (label = '') => {
    if (typeof window === 'undefined') return;
    setDemoDirectorHighlight(null);
    setDemoDirectorPointer({
      x: Math.min(Math.max(320, window.innerWidth * 0.46), window.innerWidth - 260),
      y: 82,
      label
    });
  };

  const showDemoCompleteCard = () => {
    setDemoDirectorHighlight(null);
    parkDemoDirectorPointer('Demo ended');
    setDemoDirectorResultCard({
      phase: 'complete',
      title: 'Demo Ended',
      screen: 'Demo Director',
      value: 'AI-powered data work without giving up trust, control, or portability.',
      bullets: [
        'Live Snowflake execution, native reliability, validated SQL, and governed AI work together.',
        'RAG-based knowledge search, cost visibility, query history, and execution footprint keep the system explainable.',
        'The same platform can adapt into client-specific applications like Incident Command Center.'
      ],
      status: 'Complete'
    });
  };

  const slowScrollDemoTarget = async (selector, options = {}) => {
    const element = document.querySelector(selector);
    if (!element) return;
    element.scrollIntoView?.({ block: options.block || 'center', inline: 'nearest', behavior: 'smooth' });
    await waitForDemo(options.initialPause || 1200);
    const scrollTarget = element.scrollHeight > element.clientHeight ? element : document.querySelector('.main-content');
    const increments = options.increments || [120, 140];
    for (const amount of increments) {
      scrollTarget?.scrollBy?.({ top: amount, behavior: 'smooth' });
      await waitForDemo(options.pause || 1200);
    }
  };

  const showDemoDirectorCue = (step, phase = 'focus') => {
    const cue = getDemoDirectorCue(step);
    setDemoDirectorResultCard({
      phase,
      title: cue.resultTitle || step?.title || 'Demo Director',
      screen: step?.screen || '',
      value: step?.value || '',
      bullets: cue.resultBullets || [],
      status: phase === 'result' ? 'Result highlight' : guidedDemoRunActions ? 'Running demo step' : 'Active focus'
    });
    focusDemoDirectorTarget(phase === 'result' ? cue.resultSelector : cue.focusSelector, cue.resultTitle || step?.title || 'Watch here');
  };
  const focusSelectedDemoApplication = (step) => {
    if (!step?.tab || step.openConnectionModal || step.showSnowflakeSession || step.showAiConfig || step.title === 'Application Landscape') return false;
    const selector = `[data-demo-tab="${step.tab}"]`;
    focusDemoDirectorTarget(selector, step.title || 'Selected application');
    return true;
  };

  const applyGuidedDemoStep = (index) => {
    const step = guidedDemoSteps[index];
    if (!step) return;
    if (!(step.tab === 'chat' && step.analystTab === 'chat' && step.title === 'AI Chat Copilot')) {
      setDemoHoldChatSql(false);
    }
    setActiveTab(step.tab);
    setConnectionModalOpen(Boolean(step.openConnectionModal));
    if (step.context === 'finance') {
      setDemoActiveContext(demoFinanceContext);
    } else if (['tableDetails', 'anomaly', 'freshness', 'catalogSearch', 'sql', 'incidentCommand', 'agentCommand'].includes(step.tab)) {
      setDemoActiveContext(demoIncidentContext);
    }
    if (step.title === 'Application Landscape') {
      document.querySelector('.sidebar-menu')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (step.showSnowflakeSession) {
      setSnowflakeContextOpen(true);
      setAiConfigOpen(false);
      document.querySelector('.sidebar-menu')?.scrollTo({ top: 9999, behavior: 'smooth' });
    }
    if (step.showAiConfig) {
      setAiConfigOpen(true);
      document.querySelector('.sidebar-menu')?.scrollTo({ top: 9999, behavior: 'smooth' });
    }
    if (step.analystTab) setAnalystStudioTab(step.analystTab);
    if (step.tableDetailsTab) setTableDetailsTab(step.tableDetailsTab);
    if (step.anomalyTab) setAnomalyTab(step.anomalyTab);
    if (step.tab === 'cost') {
      fetchCostDashboard();
      setCostChartMode('trend');
    }
    if (step.tab === 'incidentCommand') {
      fetchIncidentCommandDashboard();
      setIncidentQuestion(step.prompt || 'Which applications violate SLA the most?');
    }
    if (step.tab === 'agentCommand') {
      setAgentGoal(step.prompt || 'Investigate why incident cost and SLA risk increased recently, then prepare a safe remediation plan.');
      setAgentApprovalRequired(false);
      setAgentApprovalGranted(false);
      setAgentFinalReport(null);
      setAgentTimeline([
        {
          id: 'goal',
          title: 'Goal Intake',
          tool: 'Agent Planner',
          status: 'ready',
          observation: 'The demo will run the agent loop: goal, plan, tool execution, observations, approval gate, and final report.'
        }
      ]);
    }
    if (step.tab === 'rag') {
      fetchRagDocuments();
      setRagQuery(step.prompt || '');
    }
    if (step.tab === 'queryLog') loadWorkbenchQueryLog();
    if (step.tab === 'executionFootprint') refreshAiUsage();
    if (step.tab === 'chat' && step.analystTab === 'ask') {
      setAskDatasetQuestion(step.prompt || '');
    }
    if (step.tab === 'chat' && step.analystTab === 'report') {
      setReportPrompt(step.prompt || '');
    }
    if (step.tab === 'sql' && step.prompt) {
      setSqlQuery(step.prompt);
    }
    if (['tableDetails', 'anomaly', 'freshness'].includes(step.tab)) {
      setAppScopes(prev => ({
        ...prev,
        tableDetails: { ...prev.tableDetails, database: 'KAGGLE', schema: 'INCIDENT_MGMT', type: 'TABLE', table: 'INCIDENTS' },
        profiler: { ...prev.profiler, database: 'KAGGLE', schema: 'INCIDENT_MGMT', type: 'TABLE', table: 'INCIDENTS' },
        anomaly: { ...prev.anomaly, database: 'KAGGLE', schema: 'INCIDENT_MGMT', type: 'TABLE', table: 'INCIDENTS', column: step.tab === 'anomaly' ? 'COST_IMPACT' : prev.anomaly.column },
        freshness: { ...prev.freshness, database: 'KAGGLE', schema: 'INCIDENT_MGMT', type: 'TABLE', table: 'INCIDENTS', column: step.tab === 'freshness' ? 'CREATED_DATE' : prev.freshness.column }
      }));
      if (step.tab === 'tableDetails') setVolumeAnalyzerColumn('CREATED_DATE');
    }
    setTimeout(() => {
      document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
      const showedAppPointer = focusSelectedDemoApplication(step);
      window.setTimeout(() => {
        showDemoDirectorCue(step, 'focus');
        if (step.openConnectionModal) {
          window.setTimeout(() => focusDemoDirectorTarget('.snowflake-auth-method-select', 'Authentication methods'), 1400);
          window.setTimeout(() => parkDemoDirectorPointer(), 3200);
        } else {
          window.setTimeout(() => parkDemoDirectorPointer(), showedAppPointer ? 2600 : 1900);
        }
      }, showedAppPointer ? 1150 : 120);
    }, 60);
  };

  const startGuidedDemo = () => {
    setGuidedDemoOpen(true);
    setDemoDirectorPanelMinimized(false);
    saveAiConfig({ processing_mode: 'ai', enabled: true });
    setGuidedDemoStepIndex(0);
    setGuidedDemoAutoPlay(false);
    setGuidedDemoRemaining(getGuidedDemoStepSeconds(guidedDemoSteps[0]));
    applyGuidedDemoStep(0);
  };

  const moveGuidedDemo = (delta) => {
    const nextIndex = Math.min(Math.max(guidedDemoStepIndex + delta, 0), guidedDemoSteps.length - 1);
    setGuidedDemoStepIndex(nextIndex);
    setGuidedDemoRemaining(getGuidedDemoStepSeconds(guidedDemoSteps[nextIndex]));
    applyGuidedDemoStep(nextIndex);
  };

  const jumpGuidedDemo = (index) => {
    setGuidedDemoStepIndex(index);
    setGuidedDemoRemaining(getGuidedDemoStepSeconds(guidedDemoSteps[index]));
    applyGuidedDemoStep(index);
  };

  const toggleGuidedDemoAutoPlay = () => {
    if (!guidedDemoOpen) {
      setGuidedDemoOpen(true);
      setGuidedDemoStepIndex(0);
      applyGuidedDemoStep(0);
    }
    setGuidedDemoRunActions(false);
    setDemoDirectorPanelMinimized(false);
    setGuidedDemoRemaining(getGuidedDemoStepSeconds(guidedDemoSteps[guidedDemoStepIndex]));
    setGuidedDemoAutoPlay(prev => !prev);
  };

  const startFullGuidedDemo = () => {
    setGuidedDemoOpen(true);
    setGuidedDemoRunActions(true);
    setGuidedDemoAutoPlay(true);
    setDemoDirectorPanelMinimized(true);
    saveAiConfig({ processing_mode: 'ai', enabled: true });
    setGuidedDemoStepIndex(0);
    setGuidedDemoRemaining(getGuidedDemoStepSeconds(guidedDemoSteps[0]));
    applyGuidedDemoStep(0);
  };

  const defaultWorkbenchScope = { database: '', schema: '', type: 'TABLE', table: '', column: '' };
  const [appScopes, setAppScopes] = useState({
    tableDetails: { ...defaultWorkbenchScope },
    profiler: { ...defaultWorkbenchScope },
    search: { ...defaultWorkbenchScope, query: '', dataType: '', tableFilter: '' },
    anomaly: { ...defaultWorkbenchScope },
    freshness: { ...defaultWorkbenchScope, table: '', frequency: '', expectedFrequency: 'daily', customHours: 24 }
  });
  const [appOptions, setAppOptions] = useState({
    tableDetails: { schemas: [], tables: [], columns: [], columnDetails: [] },
    profiler: { schemas: [], tables: [], columns: [], columnDetails: [] },
    search: { schemas: [], tables: [], columns: [], columnDetails: [] },
    anomaly: { schemas: [], tables: [], columns: [], columnDetails: [] },
    freshness: { schemas: [], tables: [], columns: [], columnDetails: [] }
  });
  const [tableDetailsTab, setTableDetailsTab] = useState('overview');
  const [tableDetailsData, setTableDetailsData] = useState(null);
  const [profilerData, setProfilerData] = useState(null);
  const [profilerVolumePlot, setProfilerVolumePlot] = useState('daily');
  const [volumeAnalyzerColumn, setVolumeAnalyzerColumn] = useState('');
  const [volumeAnalyzerMode, setVolumeAnalyzerMode] = useState('event');
  const [volumeAnalyzerTimeWindow, setVolumeAnalyzerTimeWindow] = useState('24h');
  const [volumeAnalyzerGranularity, setVolumeAnalyzerGranularity] = useState('hour');
  const [volumeAnalyzerChartType, setVolumeAnalyzerChartType] = useState('bar');
  const [volumeAnalyzerHeatmapType, setVolumeAnalyzerHeatmapType] = useState('heatmap');
  const [volumeAnalyzerData, setVolumeAnalyzerData] = useState(null);
  const [tableInsightsData, setTableInsightsData] = useState(null);
  const [searchTableResults, setSearchTableResults] = useState([]);
  const [searchColumnResults, setSearchColumnResults] = useState([]);
  const [anomalyTab, setAnomalyTab] = useState('scan');
  const [anomalyData, setAnomalyData] = useState(null);
  const [anomalyPlotType, setAnomalyPlotType] = useState('auto');
  const [customAnomalyRule, setCustomAnomalyRule] = useState({
    name: 'Custom anomaly rule',
    type: 'is_null',
    value: '',
    secondValue: '',
    customWhere: ''
  });
  const [freshnessData, setFreshnessData] = useState(null);
  const [workbenchQueryLog, setWorkbenchQueryLog] = useState([]);
  const [workbenchLoading, setWorkbenchLoading] = useState({
    tableDetails: false,
    profiler: false,
    volumeAnalyzer: false,
    insights: false,
    search: false,
    anomaly: false,
    freshness: false,
    queryLog: false
  });

  // State for Incident Investigator
  const [incidentsList, setIncidentsList] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentInvestigation, setIncidentInvestigation] = useState(null);
  const [investigatingIncident, setInvestigatingIncident] = useState(false);
  const [incidentCommandData, setIncidentCommandData] = useState(null);
  const [incidentCommandLoading, setIncidentCommandLoading] = useState(false);
  const [incidentQuestion, setIncidentQuestion] = useState('Which application has the highest incident count?');
  const [incidentQueryResult, setIncidentQueryResult] = useState(null);
  const [incidentQueryLoading, setIncidentQueryLoading] = useState(false);
  const [agentGoal, setAgentGoal] = useState('Investigate why incident cost and SLA risk increased recently, then prepare a safe remediation plan.');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentApprovalRequired, setAgentApprovalRequired] = useState(false);
  const [agentApprovalGranted, setAgentApprovalGranted] = useState(false);
  const [agentFinalReport, setAgentFinalReport] = useState(null);
  const [agentTimeline, setAgentTimeline] = useState([
    {
      id: 'goal',
      title: 'Goal Intake',
      tool: 'Agent Planner',
      status: 'ready',
      observation: 'Enter a data operations goal and run the agent to generate a plan, execute tools, and produce an evidence-backed report.'
    }
  ]);

  // Utility copy ref
  const [copiedQuery, setCopiedQuery] = useState('');
  const [demoHoldChatSql, setDemoHoldChatSql] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (demoHoldChatSql || (guidedDemoOpen && guidedDemoAutoPlay && activeTab === 'chat' && analystStudioTab === 'chat')) return;
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, demoHoldChatSql, guidedDemoOpen, guidedDemoAutoPlay, activeTab, analystStudioTab]);

  async function loadChatSamples(dbName, schemaName, tableName) {
    try {
      const params = new URLSearchParams();
      if (dbName) params.append('database', dbName);
      if (schemaName) params.append('schema', schemaName);
      if (tableName) params.append('table_name', tableName);
      const res = await fetch(`${API_BASE}/api/chat/samples?${params.toString()}`);
      const data = await res.json();
      const samples = data.samples || [];
      setChatMessages(prev => {
        const updated = [...prev];
        // Update the first welcome message with real samples
        if (updated.length > 0 && updated[0].sender === 'ai') {
          updated[0] = { ...updated[0], samples };
        }
        return updated;
      });
    } catch (err) {
      console.error('Error fetching chat samples:', err);
    }
  }

  useEffect(() => {
    // Initial data load
    loadDatabases();
    loadAiConfig();
    fetchCostDashboard();
    fetchLineage();
    fetchDqDashboard();
    fetchIncidents();
    fetchIncidentCommandDashboard();
    fetchRagDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(text);
    setTimeout(() => setCopiedQuery(''), 2000);
  };

  const loadAiConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/config`);
      const data = await res.json();
      setAiConfig(data);
    } catch (err) {
      console.error('Error loading AI config:', err);
    }
  };

  const saveAiConfig = async (patch = {}) => {
    const next = {
      enabled: aiConfig.enabled,
      processing_mode: aiConfig.processing_mode,
      provider: aiConfig.provider,
      model: aiConfig.model,
      base_url: aiConfig.base_url,
      ...patch
    };
    if (aiApiKey.trim()) next.api_key = aiApiKey.trim();
    setAiSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      const data = await res.json();
      setAiConfig(data);
      if (next.api_key) setAiApiKey('');
    } catch (err) {
      console.error('Error saving AI config:', err);
    } finally {
      setAiSaving(false);
    }
  };

  const testAiConnection = async () => {
    setAiTesting(true);
    try {
      if (aiApiKey.trim()) {
        await saveAiConfig({ api_key: aiApiKey.trim() });
      }
      const res = await fetch(`${API_BASE}/api/ai/test`, { method: 'POST' });
      setAiConfig(await res.json());
    } catch (err) {
      console.error('Error testing AI connection:', err);
    } finally {
      setAiTesting(false);
    }
  };

  const clearAiConversation = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/conversation/clear`, { method: 'POST' });
      const data = await res.json();
      setAiConfig(prev => ({ ...prev, usage: data.usage || prev.usage }));
    } catch (err) {
      console.error('Error clearing AI conversation:', err);
    }
  };

  const resetChatMessages = () => {
    setChatMessages([
      {
        sender: 'ai',
        text: 'Chat cleared. Select a table and ask a fresh question when you are ready.',
        samples: []
      }
    ]);
    setCurrentMessage('');
    setChatResults(null);
    clearAiConversation();
  };

  const refreshAiUsage = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/usage`);
      const usage = await res.json();
      setAiConfig(prev => ({ ...prev, usage }));
    } catch (err) {
      console.error('Error refreshing AI usage:', err);
    }
  };

  const resetAiUsage = async () => {
    if (!window.confirm('Reset accumulated LLM token usage? This clears the local usage dashboard history.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/ai/usage/reset`, { method: 'POST' });
      const data = await res.json();
      setAiConfig(prev => ({ ...prev, usage: data.usage || prev.usage }));
    } catch (err) {
      console.error('Error resetting AI usage:', err);
    }
  };

  // Connection testing
  const testDatabaseConnection = async ({ closeModal = false, showConnecting = true } = {}) => {
    if (showConnecting) {
      setConnectionStatus({ status: 'connecting', message: 'Testing server connection...', mode: 'PENDING' });
    }
    try {
      const res = await fetch(`${API_BASE}/api/connection/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionConfig)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Connection test failed.');
      }
      if (data.success) {
        setConnectionStatus({
          status: 'connected',
          message: data.message,
          mode: data.mode
        });
        if (closeModal) setConnectionModalOpen(false);
        loadDatabases(); // Fetch database scoping list on connection load
        return true;
      } else {
        setConnectionStatus({
          status: 'disconnected',
          message: data.message || 'Connection test failed.',
          mode: data.mode || connectionConfig.platform
        });
        return false;
      }
    } catch (err) {
      setConnectionStatus({
        status: 'disconnected',
        message: err.message || 'Could not connect to FastAPI server. Ensure backend is running.',
        mode: 'OFFLINE'
      });
      return false;
    }
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    await testDatabaseConnection({ closeModal: true, showConnecting: true });
  };

  useEffect(() => {
    testDatabaseConnection({ closeModal: false, showConnecting: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send message to Copilot chat
  const handleSendChatMessage = async (textToSend, contextOverride = null, modeOverride = null) => {
    const text = textToSend || currentMessage;
    if (!text.trim()) return;
    const requestContext = contextOverride || { database: activeDb, schema: activeSchema, table: activeTable || null };
    const requestMode = modeOverride || aiConfig.processing_mode;

    if (!textToSend) {
      setCurrentMessage('');
    }

    // Add user message
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatMessages(prev => [...prev, { sender: 'ai', text: requestMode === 'compare' ? 'Running Native and AI pipelines side by side...' : 'Processing your request with Data Pilot AI...', loading: true }]);

    try {
      const endpoint = requestMode === 'compare' ? '/api/chat/compare' : '/api/chat';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          database: requestContext.database,
          schema_name: requestContext.schema,
          table_name: requestContext.table || null
        })
      });
      const data = await res.json();
      
      setChatMessages(prev => {
        const updated = [...prev];
        // Replace loading message
        updated[updated.length - 1] = data.mode === 'compare'
          ? {
              sender: 'ai',
              text: 'Native vs AI comparison complete.',
              compareResult: data
            }
          : {
              sender: 'ai',
              text: data.reply,
              sql: data.sql,
              visualization: data.visualization,
              aiMetadata: data.ai_metadata,
              semanticResolver: data.semantic_resolver,
              sqlValidation: data.sql_validation,
              explainabilityTimeline: data.explainability_timeline
            };
        return updated;
      });
      refreshAiUsage();
    } catch {
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: 'ai',
          text: 'Error connecting to the AI agent. Please check your backend connection.',
          error: true
        };
        return updated;
      });
    }
  };

  const inferReportChart = (result) => {
    const columns = result?.columns || [];
    const rows = result?.data || [];
    if (!columns.length || !rows.length) return { type: 'none' };
    const numericCols = columns.filter(col => rows.some(row => Number.isFinite(Number(row[col]))));
    const labelCols = columns.filter(col => !numericCols.includes(col));
    if (!numericCols.length) return { type: 'none' };
    const x = labelCols[0] || columns.find(col => col !== numericCols[0]) || columns[0];
    const y = numericCols[0];
    const series = labelCols.find(col => col !== x) || '';
    const loweredX = String(x).toLowerCase();
    const type = loweredX.includes('date') || loweredX.includes('month') || loweredX.includes('time') ? 'line' : 'bar';
    return { type, x, y, series };
  };

  const renderReportChart = () => {
    if (!reportData?.success) return null;
    const inferred = inferReportChart(reportData);
    const chartType = reportChartType === 'auto' ? inferred.type : reportChartType;
    if (chartType === 'none' || !inferred.x || !inferred.y) {
      return <div className="empty-state">No numeric column was found for charting this result set.</div>;
    }
    if (chartType === 'line' && inferred.series) return renderReportMultiSeriesLineChart(reportData.data, inferred.x, inferred.y, inferred.series);
    if (chartType === 'line') return renderReportLineChart(reportData.data, inferred.x, inferred.y);
    return renderReportBarChart(reportData.data, inferred.x, inferred.y);
  };

  const buildDatasetInsightSummary = (result, question) => {
    if (!result?.success) return 'No successful result set is available yet.';
    const rows = result.data || [];
    const columns = result.columns || [];
    if (!rows.length || !columns.length) {
      return 'The generated query ran successfully but returned no rows for this dataset context.';
    }
    const numericCols = columns.filter(col => rows.some(row => Number.isFinite(Number(row[col]))));
    const labelCols = columns.filter(col => !numericCols.includes(col));
    const parts = [`Returned ${rows.length} rows across ${columns.length} columns for: "${question}".`];
    if (numericCols.length) {
      const metric = numericCols[0];
      const values = rows.map(row => Number(row[metric])).filter(Number.isFinite);
      const total = values.reduce((sum, value) => sum + value, 0);
      const avg = values.length ? total / values.length : 0;
      parts.push(`${metric} totals ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} with an average of ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`);
      if (labelCols.length) {
        const label = labelCols[0];
        const topRow = [...rows].sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0))[0];
        if (topRow) parts.push(`${topRow[label]} is the top ${label} by ${metric}.`);
      }
    } else {
      parts.push('The result is descriptive rather than numeric, so review the returned categories and sample rows.');
    }
    return parts.join(' ');
  };

  const renderAskDatasetChart = () => {
    if (!askDatasetResult?.success) return null;
    const inferred = inferReportChart(askDatasetResult);
    const chartType = askDatasetChartType === 'auto' ? inferred.type : askDatasetChartType;
    if (chartType === 'none' || !inferred.x || !inferred.y) {
      return <div className="empty-state">No numeric field was found for an automatic chart.</div>;
    }
    if (chartType === 'line') return renderReportLineChart(askDatasetResult.data, inferred.x, inferred.y);
    return renderReportBarChart(askDatasetResult.data, inferred.x, inferred.y);
  };

  const handleAskDataset = async (e) => {
    e?.preventDefault();
    if (!askDatasetQuestion.trim()) return;
    setAskDatasetLoading(true);
    setAskDatasetSql('');
    setAskDatasetExplanation('');
    setAskDatasetResult(null);
    setAskDatasetCompareResult(null);
    try {
      if (aiConfig.processing_mode === 'compare') {
        const res = await fetch(`${API_BASE}/api/chat/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: askDatasetQuestion,
            database: activeDb,
            schema_name: activeSchema,
            table_name: activeTable || null
          })
        });
        const comparison = await res.json();
        setAskDatasetCompareResult(comparison);
        setAskDatasetTitle(askDatasetQuestion.slice(0, 80) || 'Dataset Comparison');
        refreshAiUsage();
        return;
      }
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${askDatasetQuestion}\nGenerate Snowflake SQL that directly answers this dataset question. Prefer grouped, chart-friendly results with concise columns. Also explain what the SQL is doing in plain native language.`,
          database: activeDb,
          schema_name: activeSchema,
          table_name: activeTable || null
        })
      });
      const generated = await res.json();
      if (!generated.sql) {
        setAskDatasetResult({ success: false, error: generated.reply || 'AI did not return SQL for this dataset question.' });
        return;
      }
      setAskDatasetSql(generated.sql);
      setAskDatasetExplanation(generated.reply || 'The generated SQL answers the selected dataset question using the current database context.');
      setAskDatasetTitle(askDatasetQuestion.slice(0, 80) || 'Dataset Answer');
      setAskDatasetResult(await executeSqlWithLimit(generated.sql));
      refreshAiUsage();
    } catch (err) {
      setAskDatasetResult({ success: false, error: err.message || 'Failed to ask this dataset.' });
    } finally {
      setAskDatasetLoading(false);
    }
  };

  const handleRunAskDatasetSql = async () => {
    if (!askDatasetSql.trim()) return;
    setAskDatasetLoading(true);
    try {
      setAskDatasetResult(await executeSqlWithLimit(askDatasetSql));
    } catch (err) {
      setAskDatasetResult({ success: false, error: err.message || 'Failed to run generated SQL.' });
    } finally {
      setAskDatasetLoading(false);
    }
  };

  const handleBuildReport = async (e) => {
    e?.preventDefault();
    if (!reportPrompt.trim()) return;

    setReportGenerating(true);
    setReportData(null);
    setReportSql('');
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${reportPrompt}\nReturn SQL suitable for a dashboard/report. Prefer grouped metrics and concise result sets.`,
          database: activeDb,
          schema_name: activeSchema,
          table_name: activeTable || null
        })
      });
      const generated = await res.json();
      if (!generated.sql) {
        setReportData({ success: false, error: generated.reply || 'AI did not return SQL for this report.' });
        return;
      }
      setReportSql(generated.sql);
      const executed = await executeSqlWithLimit(generated.sql);
      setReportData(executed);
      setReportTitle(reportPrompt.slice(0, 72) || 'Generated Report');
      refreshAiUsage();
    } catch (err) {
      setReportData({ success: false, error: err.message || 'Failed to generate report.' });
    } finally {
      setReportGenerating(false);
    }
  };

  const handleRunReportSql = async () => {
    if (!reportSql.trim()) return;
    setReportGenerating(true);
    setReportData(null);
    try {
      setReportData(await executeSqlWithLimit(reportSql));
    } catch (err) {
      setReportData({ success: false, error: err.message || 'Failed to run report SQL.' });
    } finally {
      setReportGenerating(false);
    }
  };

  const executeSqlWithLimit = async (sqlString) => {
    const res = await fetch(`${API_BASE}/api/execute-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: sqlString, limit: sqlRowLimit })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.detail || data.error || 'SQL execution failed.' };
    }
    return data;
  };

  const handleExecuteChatSql = async (sqlString, messageIndex = null) => {
    setExecutingChatQuery(true);
    setChatResults(null);
    try {
      const result = await executeSqlWithLimit(sqlString);
      setChatResults(result);
      if (messageIndex !== null) {
        setChatMessages(prev => prev.map((msg, idx) => idx === messageIndex ? { ...msg, result } : msg));
      }
    } catch {
      const result = { success: false, error: 'Network communication failure with uvicorn server.' };
      setChatResults(result);
      if (messageIndex !== null) {
        setChatMessages(prev => prev.map((msg, idx) => idx === messageIndex ? { ...msg, result } : msg));
      }
    }
    setExecutingChatQuery(false);
  };

  const handleExecuteWorkbenchSql = async (sqlString, title = 'SQL Result', options = {}) => {
    if (options.inlineKey) {
      setWorkbenchSqlResults(null);
      setWorkbenchSqlTitle('');
      setInlineSqlExecuting(prev => ({ ...prev, [options.inlineKey]: true }));
      setInlineSqlResults(prev => ({ ...prev, [options.inlineKey]: null }));
      try {
        const result = await executeSqlWithLimit(sqlString);
        setInlineSqlResults(prev => ({ ...prev, [options.inlineKey]: result }));
      } catch {
        setInlineSqlResults(prev => ({
          ...prev,
          [options.inlineKey]: { success: false, error: 'Network communication failure with uvicorn server.' }
        }));
      }
      setInlineSqlExecuting(prev => ({ ...prev, [options.inlineKey]: false }));
      return;
    }
    setWorkbenchSqlExecuting(true);
    setWorkbenchSqlTitle(title);
    setWorkbenchSqlResults(null);
    try {
      setWorkbenchSqlResults(await executeSqlWithLimit(sqlString));
    } catch {
      setWorkbenchSqlResults({ success: false, error: 'Network communication failure with uvicorn server.' });
    }
    setWorkbenchSqlExecuting(false);
  };

  // SQL Optimizer
  const safeJsonResponse = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  };

  const normalizeList = (value, fallback = []) => {
    if (Array.isArray(value)) return value.map(item => String(item));
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return fallback;
  };

  const normalizeSqlOptimization = (payload = {}) => ({
    explanation: String(payload.explanation || payload.detail || payload.error || 'Optimization analysis completed without a narrative response.'),
    inefficiencies: normalizeList(payload.inefficiencies, ['No inefficiency details were returned.']),
    recommendations: normalizeList(payload.recommendations, ['No recommendation details were returned.']),
    optimized_sql: String(payload.optimized_sql || payload.sql || sqlQuery),
    ai_metadata: payload.ai_metadata || null,
  });

  const normalizeSqlCostAdvisor = (payload = {}, ok = true) => {
    if (!ok || payload.success === false) {
      return { success: false, error: String(payload.detail || payload.error || 'Cost advisor failed.') };
    }
    return {
      ...payload,
      success: true,
      findings: normalizeList(payload.findings, ['No cost findings were returned.']),
      alternatives: normalizeList(payload.alternatives, ['No cheaper alternatives were returned.']),
      assumptions: normalizeList(payload.assumptions, []),
      optimized_sql: String(payload.optimized_sql || sqlQuery),
      estimated_reduction_pct: Number(payload.estimated_reduction_pct || 0),
    };
  };

  const handleAnalyzeAndOptimizeSql = async () => {
    if (!sqlQuery.trim()) return;
    setAnalyzingCost(true);
    setOptimizing(true);
    setSqlCostAdvisor(null);
    setSqlOptimization(null);
    try {
      const [costRes, optimizeRes] = await Promise.all([
        fetch(`${API_BASE}/api/sql/cost-advisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: sqlQuery })
        }),
        fetch(`${API_BASE}/api/sql/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: sqlQuery })
        })
      ]);
      const [costData, optimizeData] = await Promise.all([safeJsonResponse(costRes), safeJsonResponse(optimizeRes)]);
      setSqlCostAdvisor(normalizeSqlCostAdvisor(costData, costRes.ok));
      setSqlOptimization(normalizeSqlOptimization(optimizeRes.ok ? optimizeData : {
        explanation: optimizeData.detail || optimizeData.error || 'Optimization failed.',
        optimized_sql: sqlQuery,
      }));
      refreshAiUsage();
    } catch (err) {
      setSqlCostAdvisor({ success: false, error: err.message || 'Cost advisor failed.' });
      setSqlOptimization(normalizeSqlOptimization({ explanation: err.message || 'Optimization failed.', optimized_sql: sqlQuery }));
    }
    setAnalyzingCost(false);
    setOptimizing(false);
  };

  // Metadata operations
  async function fetchMetadata(searchVal = '', dbName = null, schemaName = null) {
    setLoadingMetadata(true);
    try {
      const searchString = typeof searchVal === 'string' ? searchVal : '';
      const targetDb = (dbName && typeof dbName === 'string') ? dbName : activeDb;
      const targetSchema = (schemaName && typeof schemaName === 'string') ? schemaName : activeSchema;
      
      let url = `${API_BASE}/api/metadata?search=${searchString}`;
      if (targetDb) url += `&database=${targetDb}`;
      if (targetSchema) url += `&schema=${targetSchema}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setMetadataTables(data.tables || []);
    } catch (err) {
      console.error(err);
    }
    setLoadingMetadata(false);
  }

  const handleGenerateDataDict = async (table) => {
    setDataDictLoading(true);
    try {
      const cols = table.columns.map(c => c.COLUMN_NAME);
      const res = await fetch(`${API_BASE}/api/metadata/dictionary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_name: table.TABLE_NAME, columns: cols })
      });
      const dict = await res.json();
      refreshAiUsage();
      
      // Update local tables array
      setMetadataTables(prev => prev.map(t => {
        if (t.TABLE_NAME === table.TABLE_NAME) {
          return {
            ...t,
            DESCRIPTION: dict.table_description,
            OWNER: dict.owner,
            REFRESH_FREQUENCY: dict.refresh_frequency,
            SOURCE_SYSTEM: dict.source_system,
            columns: t.columns.map(col => {
              const matchedCol = dict.columns.find(dc => dc.name === col.COLUMN_NAME);
              return matchedCol ? { ...col, DESCRIPTION: matchedCol.description, DATA_OWNER: matchedCol.owner } : col;
            })
          };
        }
        return t;
      }));
      
      // Update selected table reference
      setSelectedTable(prev => {
        if (prev && prev.TABLE_NAME === table.TABLE_NAME) {
          return {
            ...prev,
            DESCRIPTION: dict.table_description,
            OWNER: dict.owner,
            REFRESH_FREQUENCY: dict.refresh_frequency,
            SOURCE_SYSTEM: dict.source_system,
            columns: prev.columns.map(col => {
              const matchedCol = dict.columns.find(dc => dc.name === col.COLUMN_NAME);
              return matchedCol ? { ...col, DESCRIPTION: matchedCol.description, DATA_OWNER: matchedCol.owner } : col;
            })
          };
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
    }
    setDataDictLoading(false);
  };

  // Governance fetch
  async function fetchGovernance(dbName = null) {
    setLoadingGovernance(true);
    try {
      const targetDb = (dbName && typeof dbName === 'string') ? dbName : activeDb;
      const url = targetDb 
        ? `${API_BASE}/api/governance?database=${targetDb}&table=${governanceTableSearch}`
        : `${API_BASE}/api/governance?table=${governanceTableSearch}`;
      const res = await fetch(url);
      const data = await res.json();
      setGovernanceGrants(data.grants || []);
    } catch (err) {
      console.error(err);
    }
    setLoadingGovernance(false);
  }

  // Cost Dashboard fetch
  async function fetchCostDashboard(range = costDateRange, startDate = costStartDate, endDate = costEndDate) {
    setLoadingCost(true);
    try {
      const params = new URLSearchParams({ days: String(range) });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const res = await fetch(`${API_BASE}/api/cost/dashboard?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setCostData({ success: false, error: data.detail || data.error || 'Failed to load Cost Analyzer data.' });
      } else {
        setCostData(data);
      }
    } catch (err) {
      console.error(err);
      setCostData({ success: false, error: err.message || 'Failed to load Cost Analyzer data.' });
    }
    setLoadingCost(false);
  }

  // Lineage fetch
  async function fetchLineage() {
    try {
      const res = await fetch(`${API_BASE}/api/lineage?object_name=${impactSearch}`);
      const data = await res.json();
      if (data.impact) {
        setImpactResult(data.impact);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // DQ Dashboard fetch
  async function fetchDqDashboard() {
    setLoadingDq(true);
    try {
      const res = await fetch(`${API_BASE}/api/quality/dashboard`);
      const data = await res.json();
      setDqData(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingDq(false);
  }

  // RAG Search fetch
  const handleRagSearch = async (e) => {
    if (e) e.preventDefault();
    if (!ragQuery.trim()) return;
    setLoadingRag(true);
    try {
      const res = await fetch(`${API_BASE}/api/rag/search?query=${encodeURIComponent(ragQuery)}`);
      const data = await res.json();
      setRagResult(data);
      refreshAiUsage();
    } catch (err) {
      console.error(err);
    }
    setLoadingRag(false);
  };

  async function fetchRagDocuments() {
    try {
      const res = await fetch(`${API_BASE}/api/rag/documents`);
      const data = await res.json();
      setRagDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching RAG documents:', err);
    }
  }

  const agentPlanTemplate = () => ([
    {
      id: 'plan',
      title: 'Plan Investigation',
      tool: 'Agent Planner',
      status: 'pending',
      action: 'Break the business/data goal into tool calls and evidence checks.',
      observation: ''
    },
    {
      id: 'metadata',
      title: 'Resolve Snowflake Context',
      tool: 'Metadata Search',
      status: 'pending',
      action: 'Find the incident table and important operational fields.',
      observation: ''
    },
    {
      id: 'freshness',
      title: 'Check Data Freshness',
      tool: 'Freshness Scanner',
      status: 'pending',
      action: 'Use CREATED_DATE to verify whether the incident table is current.',
      observation: ''
    },
    {
      id: 'anomaly',
      title: 'Scan Cost Impact Anomalies',
      tool: 'Anomaly Detector',
      status: 'pending',
      action: 'Run a numeric anomaly scan on COST_IMPACT.',
      observation: ''
    },
    {
      id: 'rag',
      title: 'Retrieve Runbook Knowledge',
      tool: 'Document Hub RAG',
      status: 'pending',
      action: 'Search indexed incident documentation and runbooks for table purpose and triage guidance.',
      observation: ''
    },
    {
      id: 'incident',
      title: 'Inspect Incident Signals',
      tool: 'Incident Command Center',
      status: 'pending',
      action: 'Load incident KPIs, trends, root causes, priority, and impacted apps.',
      observation: ''
    },
    {
      id: 'cost',
      title: 'Estimate Query Cost / Optimization',
      tool: 'Cost-Aware SQL Advisor',
      status: 'pending',
      action: 'Analyze a targeted incident query and suggest a cheaper operational review pattern.',
      observation: ''
    },
    {
      id: 'approval',
      title: 'Human Approval Gate',
      tool: 'Approval Policy',
      status: 'pending',
      action: 'Pause before any remediation SQL or operational change.',
      observation: ''
    },
    {
      id: 'report',
      title: 'Final Root-Cause Report',
      tool: 'Agent Reporter',
      status: 'pending',
      action: 'Combine evidence into root-cause hypothesis, fix plan, risk, and audit trail.',
      observation: ''
    }
  ]);

  const updateAgentStep = (id, patch) => {
    setAgentTimeline(prev => prev.map(step => step.id === id ? { ...step, ...patch } : step));
  };

  const summarizeRows = (rows, emptyText = 'No rows returned') => {
    if (!Array.isArray(rows) || rows.length === 0) return emptyText;
    return rows.slice(0, 3).map(row => Object.entries(row).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(', ')).join(' | ');
  };

  const runAgentCommandCenter = async () => {
    if (!agentGoal.trim() || agentRunning) return;
    setAgentRunning(true);
    setAgentApprovalRequired(false);
    setAgentApprovalGranted(false);
    setAgentFinalReport(null);
    const plan = agentPlanTemplate();
    setAgentTimeline(plan);
    const evidence = {};

    const runStep = async (id, executor) => {
      updateAgentStep(id, { status: 'running', observation: 'Running tool call...' });
      try {
        const observation = await executor();
        updateAgentStep(id, { status: 'complete', observation });
      } catch (err) {
        const message = err.message || 'Tool failed. The agent kept the remaining workflow available.';
        const backendHint = message.toLowerCase().includes('failed to fetch')
          ? 'Backend API is not reachable at http://127.0.0.1:8000. Restart the backend, then run the agent again.'
          : message;
        updateAgentStep(id, { status: 'error', observation: backendHint });
      }
    };

    await runStep('plan', async () => {
      evidence.plan = [
        'Use metadata first so the agent does not guess fields.',
        'Check freshness and anomalies before forming a cause.',
        'Use RAG for operational context.',
        'Pause before remediation SQL.'
      ];
      return `Plan created for goal: "${agentGoal}". The agent will use metadata, freshness, anomaly, RAG, incident, and cost tools before proposing remediation.`;
    });

    await runStep('metadata', async () => {
      const params = new URLSearchParams({ database: 'KAGGLE', schema: 'INCIDENT_MGMT', query: 'incident', table_filter: 'incident' });
      const res = await fetch(`${API_BASE}/api/workbench/search?${params.toString()}`);
      const data = await res.json();
      evidence.metadata = data;
      const tableCount = data.table_results?.length || data.tables?.length || 0;
      const columnCount = data.column_results?.length || data.columns?.length || data.results?.length || 0;
      return `Resolved KAGGLE.INCIDENT_MGMT with ${tableCount} table matches and ${columnCount} column matches. Key context includes INCIDENTS, CREATED_DATE, SLA_BREACHED, ROOT_CAUSE, APP_NAME, USERS_AFFECTED, and COST_IMPACT.`;
    });

    await runStep('freshness', async () => {
      const params = new URLSearchParams({ database: 'KAGGLE', schema: 'INCIDENT_MGMT', table: 'INCIDENTS', date_column: 'CREATED_DATE', expected_frequency: 'daily' });
      const res = await fetch(`${API_BASE}/api/workbench/freshness?${params.toString()}`);
      const data = await res.json();
      evidence.freshness = data;
      const row = data.results?.[0] || {};
      return `${row.table_name || 'INCIDENTS'} freshness is ${row.status || 'unknown'} using ${row.date_column || 'CREATED_DATE'}. Age Hours: ${row.age_hours ?? '-'}, Latest Rows: ${row.latest_rows ?? '-'}, Previous Rows: ${row.previous_rows ?? '-'}.`;
    });

    await runStep('anomaly', async () => {
      const params = new URLSearchParams({ database: 'KAGGLE', schema: 'INCIDENT_MGMT', table: 'INCIDENTS', column: 'COST_IMPACT' });
      const res = await fetch(`${API_BASE}/api/workbench/anomaly?${params.toString()}`);
      const data = await res.json();
      evidence.anomaly = data;
      return `COST_IMPACT anomaly scan used ${data.kind || 'numeric'} logic and returned ${data.rows?.length || 0} flagged rows. ${data.summary ? `Summary: ${JSON.stringify(data.summary).slice(0, 180)}` : ''}`;
    });

    await runStep('rag', async () => {
      const query = 'What is the KAGGLE.INCIDENT_MGMT.INCIDENTS table used for and how should incident SLA and cost risk be triaged?';
      const res = await fetch(`${API_BASE}/api/rag/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      evidence.rag = data;
      const citations = data.citations?.map(c => c.title || c.source || c).slice(0, 2).join(', ');
      return `Retrieved ${data.source_chunks?.length || 0} knowledge chunks${citations ? ` from ${citations}` : ''}. The agent uses this evidence to avoid relying only on table names.`;
    });

    await runStep('incident', async () => {
      const res = await fetch(`${API_BASE}/api/incident-command/dashboard`);
      const data = await res.json();
      evidence.incident = data;
      const summary = data.summary || {};
      return `Incident dashboard loaded ${Number(summary.total_incidents || 0).toLocaleString()} incidents, ${Number(summary.open_incidents || 0).toLocaleString()} open, ${Number(summary.critical_incidents || 0).toLocaleString()} critical, SLA compliance ${summary.sla_compliance_pct ?? '-'}%, business cost $${Number(summary.business_cost || 0).toLocaleString()}.`;
    });

    await runStep('cost', async () => {
      const sql = `SELECT APP_NAME, ROOT_CAUSE, COUNT(*) AS INCIDENT_COUNT, SUM(COST_IMPACT) AS TOTAL_COST
FROM KAGGLE.INCIDENT_MGMT.INCIDENTS
WHERE CREATED_DATE >= DATEADD(day, -30, CURRENT_DATE())
GROUP BY APP_NAME, ROOT_CAUSE
ORDER BY TOTAL_COST DESC
LIMIT 25`;
      const res = await fetch(`${API_BASE}/api/sql/cost-advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      const data = await res.json();
      evidence.cost = { ...data, sql };
      return `Cost advisor reviewed targeted incident SQL. Estimated scan: ${data.estimated_scan_gb ?? 0} GB, estimated cost ${data.estimated_cost_label || '$0.00'}, optimized reduction ${data.optimized_reduction_pct || 0}%.`;
    });

    updateAgentStep('approval', {
      status: 'waiting',
      observation: 'Approval required before running remediation SQL. The agent prepared a safe dry-run validation query and a separate fix plan; no corrective SQL has been executed.'
    });
    setAgentApprovalRequired(true);

    const summary = evidence.incident?.summary || {};
    setAgentFinalReport({
      status: 'waiting_approval',
      rootCause: 'Primary hypothesis: recent SLA and cost risk is concentrated in high-impact incident groups. The agent found the operational table, checked recency, scanned COST_IMPACT anomalies, retrieved runbook context, and reviewed incident dashboard signals before recommending action.',
      evidence: [
        `Freshness: ${evidence.freshness?.results?.[0]?.status || 'unknown'}; age ${evidence.freshness?.results?.[0]?.age_hours ?? '-'} hours.`,
        `Anomalies: ${evidence.anomaly?.rows?.length || 0} COST_IMPACT rows flagged for review.`,
        `Incidents: ${Number(summary.open_incidents || 0).toLocaleString()} open, ${Number(summary.critical_incidents || 0).toLocaleString()} critical, SLA compliance ${summary.sla_compliance_pct ?? '-'}%.`,
        `RAG: ${evidence.rag?.source_chunks?.length || 0} supporting knowledge chunks retrieved.`
      ],
      recommendation: 'Prioritize open Critical and High incidents with SLA breach, high user impact, high cost impact, and repeated root causes. Review change-linked incidents before proposing pipeline or release-governance fixes.',
      remediationSql: `SELECT INCIDENT_ID, APP_NAME, SEVERITY, STATUS, SLA_BREACHED, USERS_AFFECTED, COST_IMPACT, ROOT_CAUSE
FROM KAGGLE.INCIDENT_MGMT.INCIDENTS
WHERE STATUS <> 'Resolved'
  AND (SLA_BREACHED = TRUE OR SEVERITY IN ('Critical', 'High') OR COST_IMPACT > 10000)
ORDER BY COST_IMPACT DESC
LIMIT 100`,
      auditTrail: Object.entries(evidence).map(([key, value]) => ({ tool: key, captured: Boolean(value), preview: summarizeRows(value?.rows || value?.results || value?.table_results || []) }))
    });
    updateAgentStep('report', { status: 'waiting', observation: 'Draft report generated. Final action plan is waiting for human approval.' });
    setAgentRunning(false);
    refreshAiUsage();
  };

  const approveAgentRemediation = async () => {
    if (!agentFinalReport?.remediationSql || agentRunning) return;
    setAgentRunning(true);
    setAgentApprovalGranted(true);
    updateAgentStep('approval', { status: 'running', observation: 'Approval granted. Running safe validation SQL with row limit before any corrective action.' });
    try {
      const res = await fetch(`${API_BASE}/api/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: agentFinalReport.remediationSql, limit: 25 })
      });
      const data = await res.json();
      updateAgentStep('approval', { status: 'complete', observation: `Approved validation returned ${data.rows?.length || 0} preview rows. Corrective UPDATE/DELETE actions remain blocked unless reviewed outside the demo.` });
      updateAgentStep('report', { status: 'complete', observation: 'Final report is complete with plan, evidence, approved validation query, and audit trail.' });
      setAgentFinalReport(prev => ({
        ...prev,
        status: 'complete',
        validationRows: data.rows || [],
        evidence: [...(prev?.evidence || []), `Approved validation query returned ${data.rows?.length || 0} rows for human review.`]
      }));
    } catch (err) {
      updateAgentStep('approval', { status: 'error', observation: err.message || 'Approved validation failed.' });
    }
    setAgentRunning(false);
  };

  const resetAgentCommandCenter = () => {
    setAgentRunning(false);
    setAgentApprovalRequired(false);
    setAgentApprovalGranted(false);
    setAgentFinalReport(null);
    setAgentTimeline([
      {
        id: 'goal',
        title: 'Goal Intake',
        tool: 'Agent Planner',
        status: 'ready',
        observation: 'Enter a data operations goal and run the agent to generate a plan, execute tools, and produce an evidence-backed report.'
      }
    ]);
  };

  const handleIngestDocumentSource = async (e) => {
    e.preventDefault();
    const isWeb = documentSourceMode === 'web';
    if (isWeb && !documentUrl.trim()) return;
    if (!isWeb && !documentText.trim()) return;

    setIngestingDocument(true);
    setDocumentIngestStatus(isWeb ? 'Reading web page and indexing chunks...' : 'Indexing pasted content...');

    try {
      const res = await fetch(`${API_BASE}/api/rag/ingest/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: documentSourceMode,
          title: documentTitle,
          url: isWeb ? documentUrl : undefined,
          content: isWeb ? undefined : documentText,
          format: documentFormat,
          crawl_depth: isWeb ? Number(crawlDepth) : 0,
          max_pages: Number(crawlMaxPages)
        })
      });
      const data = await res.json();
      if (data.success) {
        setDocumentIngestStatus(`Success! ${data.message}`);
        setDocumentTitle('');
        setDocumentUrl('');
        setDocumentText('');
        fetchRagDocuments();
      } else {
        setDocumentIngestStatus(`Ingestion failed: ${data.detail || 'Could not learn the source.'}`);
      }
    } catch {
      setDocumentIngestStatus('Network error connecting to document ingestion service.');
    } finally {
      setIngestingDocument(false);
    }
  };

  const handleBatchIngest = async (e) => {
    e.preventDefault();
    if (!batchUrls.trim() && batchFiles.length === 0) return;

    setIngestingBatch(true);
    setBatchIngestStatus('Batch ingest is reading sources and indexing chunks...');
    setBatchIngestResult(null);

    const formData = new FormData();
    formData.append('urls', batchUrls);
    formData.append('file_format', documentFormat);
    formData.append('crawl_depth', String(crawlDepth));
    formData.append('max_pages', String(crawlMaxPages));
    batchFiles.forEach(file => formData.append('files', file));

    try {
      const res = await fetch(`${API_BASE}/api/rag/ingest/batch`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setBatchIngestStatus(`Success! ${data.message}`);
        setBatchUrls('');
        setBatchFiles([]);
        if (batchFileInputRef.current) batchFileInputRef.current.value = '';
        fetchRagDocuments();
      } else {
        setBatchIngestStatus(`Batch ingest failed: ${data.detail || data.message || 'No sources were indexed.'}`);
      }
      setBatchIngestResult(data);
    } catch {
      setBatchIngestStatus('Network error running batch ingest.');
    } finally {
      setIngestingBatch(false);
    }
  };

  const handleIngestFeed = async (e) => {
    e.preventDefault();
    if (!rssUrl.trim()) return;
    setIngestingFeed(true);
    setFeedIngestStatus('Connecting and parsing feed...');
    try {
      const res = await fetch(`${API_BASE}/api/rag/ingest/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rssUrl, source_name: rssSourceName || 'Website Feed' })
      });
      const data = await res.json();
      if (data.success) {
        setFeedIngestStatus(`Success! Ingested ${data.ingested_count} articles.`);
        setRssUrl('');
        setRssSourceName('');
        fetchRagDocuments();
      } else {
        setFeedIngestStatus(`Ingestion failed: ${data.detail || 'Could not parse RSS URL.'}`);
      }
    } catch {
      setFeedIngestStatus('Network error connecting to ingestion service.');
    } finally {
      setIngestingFeed(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingFile(true);
    setFileUploadStatus('Uploading and indexing document chunks...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_format', documentFormat);
    
    try {
      const res = await fetch(`${API_BASE}/api/rag/ingest/file`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setFileUploadStatus(`Success! File parsed into ${data.chunks_count} chunks.`);
        fetchRagDocuments();
      } else {
        setFileUploadStatus(`Upload failed: ${data.detail || 'Error processing file.'}`);
      }
    } catch {
      setFileUploadStatus('Network error uploading file.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearRagDocuments = () => {
    setConfirmResetOpen(true);
  };

  // Incident Investigation fetch
  async function fetchIncidents() {
    try {
      const res = await fetch(`${API_BASE}/api/incidents`);
      const data = await res.json();
      setIncidentsList(data.incidents || []);
    } catch (err) {
      console.error(err);
    }
  }

  const handleInvestigateIncident = async (inc) => {
    setSelectedIncident(inc);
    setInvestigatingIncident(true);
    setIncidentInvestigation(null);
    try {
      const res = await fetch(`${API_BASE}/api/incidents?incident_id=${inc.INCIDENT_ID}`);
      const data = await res.json();
      setIncidentInvestigation(data.investigation);
    } catch (err) {
      console.error(err);
    }
    setInvestigatingIncident(false);
  };

  async function fetchIncidentCommandDashboard() {
    setIncidentCommandLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/incident-command/dashboard`);
      const data = await res.json();
      setIncidentCommandData(data);
    } catch (err) {
      console.error('Error loading incident command dashboard:', err);
      setIncidentCommandData({ error: err.message || 'Failed to load Incident Command Center.' });
    }
    setIncidentCommandLoading(false);
  }

  async function runIncidentCommandQuestion(question = incidentQuestion) {
    const prompt = question.trim();
    if (!prompt) return;
    setIncidentQueryLoading(true);
    setIncidentQueryResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/incident-command/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, mode: aiConfig.processing_mode || 'native' })
      });
      const data = await res.json();
      setIncidentQueryResult(res.ok ? data : { success: false, error: data.detail || data.error || 'Incident query failed.' });
      if (res.ok) {
        await refreshAiUsage();
      }
    } catch (err) {
      setIncidentQueryResult({ success: false, error: err.message || 'Incident query failed.' });
    }
    setIncidentQueryLoading(false);
  }

  const patchWorkbenchScope = (appKey, patch) => {
    setAppScopes(prev => ({
      ...prev,
      [appKey]: { ...prev[appKey], ...patch }
    }));
  };

  const patchWorkbenchOptions = (appKey, patch) => {
    setAppOptions(prev => ({
      ...prev,
      [appKey]: { ...prev[appKey], ...patch }
    }));
  };

  const syncWorkbenchContext = async (databaseName, schemaName = '') => {
    if (!databaseName) return;
    const appKeys = ['tableDetails', 'search', 'anomaly', 'freshness'];
    let schemaList = [];
    try {
      const schemaRes = await fetch(`${API_BASE}/api/schemas?database=${encodeURIComponent(databaseName)}`);
      const schemaData = await schemaRes.json();
      schemaList = schemaData.schemas || [];
    } catch (err) {
      console.error('Error syncing workbench schemas:', err);
    }
    const nextSchema = schemaName || (schemaList.includes('PUBLIC') ? 'PUBLIC' : schemaList[0] || '');
    setAppScopes(prev => {
      const next = { ...prev };
      appKeys.forEach(appKey => {
        next[appKey] = {
          ...next[appKey],
          database: databaseName,
          schema: nextSchema,
          table: '',
          column: ''
        };
      });
      return next;
    });
    setAppOptions(prev => {
      const next = { ...prev };
      appKeys.forEach(appKey => {
        next[appKey] = {
          ...next[appKey],
          schemas: schemaList,
          tables: [],
          columns: [],
          columnDetails: []
        };
      });
      return next;
    });
    if (!nextSchema) return;
    await Promise.all(appKeys.map(async (appKey) => {
      const typeParam = appScopes[appKey]?.type || 'ALL';
      try {
        const tableRes = await fetch(`${API_BASE}/api/tables?database=${encodeURIComponent(databaseName)}&schema=${encodeURIComponent(nextSchema)}&table_type=${encodeURIComponent(typeParam)}`);
        const tableData = await tableRes.json();
        patchWorkbenchOptions(appKey, { tables: tableData.tables || [], columns: [], columnDetails: [] });
      } catch (err) {
        console.error(`Error syncing ${appKey} tables:`, err);
      }
    }));
  };

  const loadWorkbenchSchemas = async (appKey, databaseName) => {
    patchWorkbenchScope(appKey, { database: databaseName, schema: '', table: '', column: '' });
    patchWorkbenchOptions(appKey, { schemas: [], tables: [], columns: [], columnDetails: [] });
    if (!databaseName) return;
    try {
      const res = await fetch(`${API_BASE}/api/schemas?database=${encodeURIComponent(databaseName)}`);
      const data = await res.json();
      patchWorkbenchOptions(appKey, { schemas: data.schemas || [] });
    } catch (err) {
      console.error('Error loading app schemas:', err);
    }
  };

  const loadWorkbenchTables = async (appKey, schemaName, tableType = null) => {
    const scope = appScopes[appKey];
    const typeParam = tableType || scope.type || 'ALL';
    patchWorkbenchScope(appKey, { schema: schemaName, table: '', column: '', type: typeParam });
    patchWorkbenchOptions(appKey, { tables: [], columns: [], columnDetails: [] });
    if (!scope.database || !schemaName) return;
    try {
      const res = await fetch(`${API_BASE}/api/tables?database=${encodeURIComponent(scope.database)}&schema=${encodeURIComponent(schemaName)}&table_type=${encodeURIComponent(typeParam)}`);
      const data = await res.json();
      patchWorkbenchOptions(appKey, { tables: data.tables || [] });
    } catch (err) {
      console.error('Error loading app tables:', err);
    }
  };

  const loadWorkbenchTableDetails = async (appKey, tableName = null) => {
    const scope = { ...appScopes[appKey], table: tableName || appScopes[appKey].table };
    const tableChanged = tableName && tableName !== appScopes[appKey].table;
    patchWorkbenchScope(appKey, { table: scope.table, column: '' });
    patchWorkbenchOptions(appKey, { columns: [], columnDetails: [] });
    if (appKey === 'tableDetails' && tableChanged) {
      setProfilerData(null);
      setTableInsightsData(null);
      setVolumeAnalyzerData(null);
      setVolumeAnalyzerColumn('');
      setVolumeAnalyzerMode('event');
      setVolumeAnalyzerTimeWindow('24h');
      setVolumeAnalyzerGranularity('hour');
      setVolumeAnalyzerChartType('bar');
      setVolumeAnalyzerHeatmapType('heatmap');
      setProfilerVolumePlot('daily');
    }
    if (!scope.database || !scope.schema || !scope.table) return null;
    const params = new URLSearchParams({ database: scope.database, schema: scope.schema, table: scope.table });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/table-details?${params.toString()}`);
      const data = await res.json();
      const columnNames = (data.columns || []).map(col => col.COLUMN_NAME);
      patchWorkbenchOptions(appKey, { columns: columnNames, columnDetails: data.columns || [] });
      if (appKey === 'tableDetails') setTableDetailsData(data);
      return data;
    } catch (err) {
      console.error('Error loading table details:', err);
      return null;
    }
  };

  const setWorkbenchTable = async (appKey, tableName) => {
    if (appKey === 'tableDetails') {
      setWorkbenchLoading(prev => ({ ...prev, tableDetails: true }));
      await loadWorkbenchTableDetails(appKey, tableName);
      setWorkbenchLoading(prev => ({ ...prev, tableDetails: false }));
    } else if (appKey === 'anomaly' || appKey === 'freshness') {
      await loadWorkbenchTableDetails(appKey, tableName);
    } else {
      patchWorkbenchScope(appKey, { table: tableName, column: '' });
    }
  };

  const runTableDetails = async () => {
    setWorkbenchLoading(prev => ({ ...prev, tableDetails: true }));
    await loadWorkbenchTableDetails('tableDetails');
    setWorkbenchLoading(prev => ({ ...prev, tableDetails: false }));
  };

  const runProfiler = async () => {
    const scope = appScopes.tableDetails;
    if (!scope.database || !scope.schema || !scope.table) return;
    setWorkbenchLoading(prev => ({ ...prev, profiler: true }));
    const params = new URLSearchParams({ database: scope.database, schema: scope.schema, table: scope.table });
    try {
      if (!tableDetailsData) {
        await loadWorkbenchTableDetails('tableDetails');
      }
      const res = await fetch(`${API_BASE}/api/workbench/profile?${params.toString()}`);
      setProfilerData(await res.json());
    } catch (err) {
      console.error('Error running profiler:', err);
    }
    setWorkbenchLoading(prev => ({ ...prev, profiler: false }));
  };

  const runTableInsights = async () => {
    const scope = appScopes.tableDetails;
    if (!scope.database || !scope.schema || !scope.table) return;
    setWorkbenchLoading(prev => ({ ...prev, insights: true }));
    const params = new URLSearchParams({ database: scope.database, schema: scope.schema, table: scope.table });
    try {
      if (!tableDetailsData) {
        await loadWorkbenchTableDetails('tableDetails');
      }
      const res = await fetch(`${API_BASE}/api/workbench/insights?${params.toString()}`);
      setTableInsightsData(await res.json());
    } catch (err) {
      console.error('Error generating table insights:', err);
      setTableInsightsData({ insights: [], error: err.message || 'Insight generation failed.' });
    }
    setWorkbenchLoading(prev => ({ ...prev, insights: false }));
  };

  const getTableDateColumns = () => (
    tableDetailsData?.columns || []
  ).filter(col => {
    const dataType = String(col.DATA_TYPE || '').toUpperCase();
    return dataType.includes('DATE') || dataType.includes('TIME');
  }).map(col => col.COLUMN_NAME);

  const getWorkbenchDateColumns = (appKey) => (
    appOptions[appKey]?.columnDetails || []
  ).filter(col => {
    const dataType = String(col.DATA_TYPE || '').toUpperCase();
    return dataType.includes('DATE') || dataType.includes('TIME');
  }).map(col => col.COLUMN_NAME);

  const handleVolumeAnalyzerModeChange = (mode) => {
    setVolumeAnalyzerMode(mode);
    setVolumeAnalyzerData(null);
    if (mode === 'event') {
      setVolumeAnalyzerTimeWindow('24h');
      setVolumeAnalyzerGranularity('hour');
    } else {
      setVolumeAnalyzerTimeWindow('90d');
      setVolumeAnalyzerGranularity('day');
    }
  };

  const runVolumeAnalyzer = async () => {
    const scope = appScopes.tableDetails;
    const dateColumns = getTableDateColumns();
    const selectedColumn = volumeAnalyzerColumn || dateColumns[0] || '';
    if (!scope.database || !scope.schema || !scope.table || !selectedColumn) return;
    setWorkbenchLoading(prev => ({ ...prev, volumeAnalyzer: true }));
    const params = new URLSearchParams({
      database: scope.database,
      schema: scope.schema,
      table: scope.table,
      column: selectedColumn,
      field_mode: volumeAnalyzerMode,
      time_window: volumeAnalyzerTimeWindow,
      granularity: volumeAnalyzerGranularity
    });
    try {
      if (!tableDetailsData) {
        await loadWorkbenchTableDetails('tableDetails');
      }
      setVolumeAnalyzerColumn(selectedColumn);
      const res = await fetch(`${API_BASE}/api/workbench/volume-analyzer?${params.toString()}`);
      setVolumeAnalyzerData(await res.json());
    } catch (err) {
      console.error('Error running volume analyzer:', err);
      setVolumeAnalyzerData({ kind: 'date', summary: {}, rows: [], plot_data: { series: [] }, error: err.message || 'Volume analysis failed.' });
    }
    setWorkbenchLoading(prev => ({ ...prev, volumeAnalyzer: false }));
  };

  const runCatalogSearch = async () => {
    const scope = appScopes.search;
    setWorkbenchLoading(prev => ({ ...prev, search: true }));
    const params = new URLSearchParams();
    if (scope.database) params.append('database', scope.database);
    if (scope.schema) params.append('schema', scope.schema);
    if (scope.query) params.append('query', scope.query);
    if (scope.dataType) params.append('data_type', scope.dataType);
    if (scope.tableFilter) params.append('table_filter', scope.tableFilter);
    try {
      const res = await fetch(`${API_BASE}/api/workbench/search?${params.toString()}`);
      const data = await res.json();
      const fallbackResults = data.results || [];
      setSearchTableResults(data.tables || []);
      setSearchColumnResults(data.columns || fallbackResults);
    } catch (err) {
      console.error('Error running search:', err);
    }
    setWorkbenchLoading(prev => ({ ...prev, search: false }));
  };

  const runAnomaly = async () => {
    const scope = appScopes.anomaly;
    if (!scope.database || !scope.schema || !scope.table || !scope.column) return;
    setWorkbenchLoading(prev => ({ ...prev, anomaly: true }));
    setAnomalyPlotType('auto');
    const params = new URLSearchParams({ database: scope.database, schema: scope.schema, table: scope.table, column: scope.column });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/anomaly?${params.toString()}`);
      setAnomalyData(await res.json());
    } catch (err) {
      console.error('Error running anomaly detector:', err);
    }
    setWorkbenchLoading(prev => ({ ...prev, anomaly: false }));
  };

  const quoteSqlIdentifier = (value) => `"${String(value || '').replace(/"/g, '""')}"`;

  const quoteSqlLiteral = (value) => `'${String(value ?? '').replace(/'/g, "''")}'`;

  const getAnomalyTableRef = () => {
    const scope = appScopes.anomaly;
    if (!scope.database || !scope.schema || !scope.table) return '';
    return `${quoteSqlIdentifier(scope.database)}.${quoteSqlIdentifier(scope.schema)}.${quoteSqlIdentifier(scope.table)}`;
  };

  const buildCustomAnomalyRuleSql = () => {
    const scope = appScopes.anomaly;
    const tableRef = getAnomalyTableRef();
    if (!tableRef || (!scope.column && customAnomalyRule.type !== 'custom_where')) return '';
    const col = quoteSqlIdentifier(scope.column);
    const value = quoteSqlLiteral(customAnomalyRule.value);
    const numericValue = customAnomalyRule.value || '0';
    const numericSecondValue = customAnomalyRule.secondValue || '0';
    const conditions = {
      is_null: `${col} IS NULL`,
      is_not_null: `${col} IS NOT NULL`,
      equals: `${col} = ${value}`,
      not_equals: `${col} <> ${value}`,
      greater_than: `${col} > ${numericValue}`,
      greater_or_equal: `${col} >= ${numericValue}`,
      less_than: `${col} < ${numericValue}`,
      less_or_equal: `${col} <= ${numericValue}`,
      between: `${col} BETWEEN ${numericValue} AND ${numericSecondValue}`,
      contains: `${col} ILIKE '%' || ${value} || '%'`,
      not_contains: `(${col} IS NULL OR ${col} NOT ILIKE '%' || ${value} || '%')`,
      starts_with: `${col} ILIKE ${quoteSqlLiteral(`${customAnomalyRule.value}%`)}`,
      ends_with: `${col} ILIKE ${quoteSqlLiteral(`%${customAnomalyRule.value}`)}`,
      regex: `REGEXP_LIKE(${col}, ${value})`,
      custom_where: customAnomalyRule.customWhere.trim()
    };
    const condition = conditions[customAnomalyRule.type] || conditions.is_null;
    if (!condition) return '';
    return `SELECT *\nFROM ${tableRef}\nWHERE ${condition}\nLIMIT 100;`;
  };

  const getCustomRuleNeedsValue = () => !['is_null', 'is_not_null', 'custom_where'].includes(customAnomalyRule.type);

  const getCustomRuleNeedsSecondValue = () => customAnomalyRule.type === 'between';

  const runFreshness = async () => {
    const scope = appScopes.freshness;
    if (!scope.database || !scope.schema) return;
    setWorkbenchLoading(prev => ({ ...prev, freshness: true }));
    const params = new URLSearchParams({ database: scope.database, schema: scope.schema });
    if (scope.table) params.append('table', scope.table);
    if (scope.frequency) params.append('frequency', scope.frequency);
    if (scope.expectedFrequency) params.append('expected_frequency', scope.expectedFrequency);
    if (scope.expectedFrequency === 'custom') params.append('custom_hours', scope.customHours || 24);
    if (scope.table) {
      const dateColumns = getWorkbenchDateColumns('freshness');
      const selectedDateColumn = scope.column || dateColumns[0] || '';
      if (selectedDateColumn) params.append('date_column', selectedDateColumn);
    }
    try {
      const res = await fetch(`${API_BASE}/api/workbench/freshness?${params.toString()}`);
      setFreshnessData(await res.json());
      await loadWorkbenchQueryLog();
    } catch (err) {
      console.error('Error running freshness scan:', err);
    }
    setWorkbenchLoading(prev => ({ ...prev, freshness: false }));
  };

  const loadWorkbenchQueryLog = async () => {
    setWorkbenchLoading(prev => ({ ...prev, queryLog: true }));
    try {
      const res = await fetch(`${API_BASE}/api/workbench/query-log`);
      const data = await res.json();
      setWorkbenchQueryLog(data.queries || []);
    } catch (err) {
      console.error('Error loading query log:', err);
    }
    setWorkbenchLoading(prev => ({ ...prev, queryLog: false }));
  };

  const setDemoActiveContext = (context) => {
    setActiveDb(context.database);
    setActiveSchema(context.schema);
    setActiveTable(context.table);
    setActiveType('TABLE');
    loadTables(context.database, context.schema, 'TABLE')
      .then(() => setActiveTable(context.table))
      .catch(err => console.error('Demo table option load failed:', err));
  };

  const setDemoWorkbenchScope = (context = demoIncidentContext) => {
    setDemoActiveContext(context);
    setAppScopes(prev => ({
      ...prev,
      tableDetails: { ...prev.tableDetails, database: context.database, schema: context.schema, type: 'TABLE', table: context.table, column: '' },
      profiler: { ...prev.profiler, database: context.database, schema: context.schema, type: 'TABLE', table: context.table, column: '' },
      search: { ...prev.search, database: demoIncidentContext.database, schema: demoIncidentContext.schema, query: 'incident', tableFilter: 'sla', dataType: '' },
      anomaly: { ...prev.anomaly, database: demoIncidentContext.database, schema: demoIncidentContext.schema, type: 'TABLE', table: demoIncidentContext.table, column: demoIncidentContext.anomalyColumn },
      freshness: { ...prev.freshness, database: demoIncidentContext.database, schema: demoIncidentContext.schema, type: 'TABLE', table: demoIncidentContext.table, column: demoIncidentContext.dateColumn, expectedFrequency: 'daily', frequency: '' }
    }));
  };

  const getDemoAskDatasetFallbackSql = () => `SELECT
  CARD_BRAND,
  COUNT(*) AS CARD_COUNT,
  ROUND(AVG(TRY_TO_NUMBER(REGEXP_REPLACE(CREDIT_LIMIT, '[^0-9.-]', ''))), 2) AS AVG_CREDIT_LIMIT
FROM KAGGLE.FINANCE_TRAN.FINANCE_CARDS_DATA
WHERE HAS_CHIP = TRUE
GROUP BY CARD_BRAND
ORDER BY AVG_CREDIT_LIMIT DESC
LIMIT 100`;

  const getDemoReportFallbackSql = () => `SELECT
  TO_VARCHAR(DATE_TRUNC('MONTH', TRY_TO_DATE(ACCT_OPEN_DATE, 'MM/YYYY')), 'YYYY-MM') AS ACCOUNT_OPEN_MONTH,
  COUNT(*) AS CARDS_OPENED
FROM KAGGLE.FINANCE_TRAN.FINANCE_CARDS_DATA
WHERE TRY_TO_DATE(ACCT_OPEN_DATE, 'MM/YYYY') >= DATEADD(YEAR, -10, CURRENT_DATE())
GROUP BY ACCOUNT_OPEN_MONTH
ORDER BY ACCOUNT_OPEN_MONTH
LIMIT 100`;

  const runDemoChat = async (question) => {
    setDemoActiveContext(demoFinanceContext);
    setDemoHoldChatSql(true);
    setCurrentMessage(question);
    setChatMessages(prev => [
      ...prev.filter(msg => !msg.demoIntro),
      { sender: 'ai', text: `Demo context: ${demoContextLabel(demoFinanceContext)}`, demoIntro: true }
    ]);
    document.querySelector('.chat-wrapper')?.scrollIntoView?.({ block: 'start', inline: 'nearest', behavior: 'smooth' });
    await waitForDemo(900);
    focusDemoDirectorTarget('.chat-input-container', 'Native language question');
    await waitForDemo(3400);
    await handleSendChatMessage(question, demoFinanceContext, 'ai');
    setGuidedDemoActionStatus('Holding generated SQL for the walkthrough...');
    const sqlBlock = await waitForDemoChatSqlBlock(9000);
    if (sqlBlock) {
      sqlBlock.classList.add('demo-active-sql-block');
      sqlBlock.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      await waitForDemo(1200);
      focusDemoDirectorTarget('.demo-active-sql-block', 'Generated SQL');
      await waitForDemo(3400);
      sqlBlock.classList.remove('demo-active-sql-block');
      await focusDemoChatLayer('.chat-bubble.ai .semantic-resolver-card', 'Semantic Table Resolver', { holdMs: 2600 });
      await focusDemoChatLayer('.chat-bubble.ai .sql-firewall-card', 'SQL Validation Firewall', { holdMs: 3000 });
      await focusDemoChatLayer('.chat-bubble.ai .explainability-timeline', 'Explainability Timeline', { holdMs: 3200 });
      await focusDemoChatLayer('.chat-bubble.ai .ai-transparency-card', 'AI Response Transparency', { holdMs: 2600 });
    } else {
      await waitForDemo(4200);
    }
    document.querySelector('.chat-panel')?.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  };

  const runDemoAskDataset = async (question, context = demoIncidentContext) => {
    setDemoActiveContext(context);
    setAskDatasetQuestion(question);
    setAskDatasetLoading(true);
    setAskDatasetResult(null);
    setAskDatasetCompareResult(null);
    setAskDatasetSql('');
    setAskDatasetExplanation('');
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${question}\nGenerate Snowflake SQL that directly answers this dataset question. Prefer grouped, chart-friendly results with concise columns. Also explain what the SQL is doing in plain native language.`,
          database: context.database,
          schema_name: context.schema,
          table_name: context.table
        })
      });
      const generated = await res.json();
      if (!generated.sql) {
        const fallbackSql = getDemoAskDatasetFallbackSql();
        setAskDatasetSql(fallbackSql);
        setAskDatasetExplanation('Demo fallback SQL groups chip-enabled cards by brand and calculates average credit limit after cleaning currency-formatted values.');
        setAskDatasetTitle(question.slice(0, 80) || 'Dataset Answer');
        await waitForDemo(2800);
        setAskDatasetResult(await executeSqlWithLimit(fallbackSql));
        return;
      }
      setAskDatasetSql(generated.sql);
      setAskDatasetExplanation(generated.reply || 'The generated SQL answers the selected dataset question using the current database context.');
      setAskDatasetTitle(question.slice(0, 80) || 'Dataset Answer');
      await waitForDemo(2800);
      const executed = await executeSqlWithLimit(generated.sql);
      if (executed?.success) {
        setAskDatasetResult(executed);
      } else {
        const fallbackSql = getDemoAskDatasetFallbackSql();
        setAskDatasetSql(fallbackSql);
        setAskDatasetExplanation('The demo recovered with a metadata-aware query that cleans CREDIT_LIMIT as a currency string before averaging it by card brand.');
        setAskDatasetResult(await executeSqlWithLimit(fallbackSql));
      }
      await refreshAiUsage();
    } catch (err) {
      setAskDatasetResult({ success: false, error: err.message || 'Demo Ask Dataset failed.' });
    } finally {
      setAskDatasetLoading(false);
    }
  };

  const runDemoReport = async (prompt, context = demoIncidentContext) => {
    setDemoActiveContext(context);
    setReportPrompt(prompt);
    setReportGenerating(true);
    setReportData(null);
    setReportSql('');
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${prompt}\nReturn SQL suitable for a dashboard/report. Prefer grouped metrics and concise result sets.`,
          database: context.database,
          schema_name: context.schema,
          table_name: context.table
        })
      });
      const generated = await res.json();
      if (generated.sql) {
        setReportSql(generated.sql);
        setReportTitle(prompt.slice(0, 72) || 'Generated Report');
        await waitForDemo(2200);
        const executed = await executeSqlWithLimit(generated.sql);
        if (executed?.success) {
          setReportData(executed);
        } else {
          const fallbackSql = getDemoReportFallbackSql();
          setReportSql(fallbackSql);
          setReportTitle('Monthly Account Opening Trend');
          setReportData(await executeSqlWithLimit(fallbackSql));
        }
        await refreshAiUsage();
      } else {
        const fallbackSql = getDemoReportFallbackSql();
        setReportSql(fallbackSql);
        setReportTitle('Monthly Account Opening Trend');
        await waitForDemo(2200);
        setReportData(await executeSqlWithLimit(fallbackSql));
      }
    } catch (err) {
      setReportData({ success: false, error: err.message || 'Demo report generation failed.' });
    } finally {
      setReportGenerating(false);
    }
  };

  const runDemoTableDetails = async () => {
    setDemoWorkbenchScope();
    setWorkbenchLoading(prev => ({ ...prev, tableDetails: true }));
    const params = new URLSearchParams({ database: demoIncidentContext.database, schema: demoIncidentContext.schema, table: demoIncidentContext.table });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/table-details?${params.toString()}`);
      const data = await res.json();
      setTableDetailsData(data);
      const columnNames = (data.columns || []).map(col => col.COLUMN_NAME);
      patchWorkbenchOptions('tableDetails', { columns: columnNames, columnDetails: data.columns || [] });
    } catch (err) {
      console.error('Demo table details failed:', err);
    } finally {
      setWorkbenchLoading(prev => ({ ...prev, tableDetails: false }));
    }
  };

  const runDemoProfiler = async () => {
    await runDemoTableDetails();
    setWorkbenchLoading(prev => ({ ...prev, profiler: true }));
    const params = new URLSearchParams({ database: demoIncidentContext.database, schema: demoIncidentContext.schema, table: demoIncidentContext.table });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/profile?${params.toString()}`);
      setProfilerData(await res.json());
    } catch (err) {
      console.error('Demo profiler failed:', err);
    } finally {
      setWorkbenchLoading(prev => ({ ...prev, profiler: false }));
    }
  };

  const runDemoVolumeAnalyzer = async () => {
    await runDemoTableDetails();
    setVolumeAnalyzerColumn(demoIncidentContext.dateColumn);
    setVolumeAnalyzerMode('event');
    setVolumeAnalyzerTimeWindow('24h');
    setVolumeAnalyzerGranularity('hour');
    setWorkbenchLoading(prev => ({ ...prev, volumeAnalyzer: true }));
    const params = new URLSearchParams({
      database: demoIncidentContext.database,
      schema: demoIncidentContext.schema,
      table: demoIncidentContext.table,
      column: demoIncidentContext.dateColumn,
      field_mode: 'event',
      time_window: '24h',
      granularity: 'hour'
    });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/volume-analyzer?${params.toString()}`);
      setVolumeAnalyzerData(await res.json());
    } catch (err) {
      setVolumeAnalyzerData({ kind: 'date', summary: {}, rows: [], plot_data: { series: [] }, error: err.message || 'Volume analysis failed.' });
    } finally {
      setWorkbenchLoading(prev => ({ ...prev, volumeAnalyzer: false }));
    }
  };

  const runDemoInsights = async () => {
    await runDemoProfiler();
    setWorkbenchLoading(prev => ({ ...prev, insights: true }));
    const params = new URLSearchParams({ database: demoIncidentContext.database, schema: demoIncidentContext.schema, table: demoIncidentContext.table });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/insights?${params.toString()}`);
      setTableInsightsData(await res.json());
    } catch (err) {
      setTableInsightsData({ insights: [], error: err.message || 'Insight generation failed.' });
    } finally {
      setWorkbenchLoading(prev => ({ ...prev, insights: false }));
    }
  };

  const runDemoAnomaly = async () => {
    setDemoWorkbenchScope();
    setAnomalyTab('scan');
    setAnomalyPlotType('auto');
    setCustomAnomalyRule(prev => ({ ...prev, type: 'greater_than', value: '5000', secondValue: '', customWhere: '' }));
    setWorkbenchLoading(prev => ({ ...prev, anomaly: true }));
    const params = new URLSearchParams({ database: demoIncidentContext.database, schema: demoIncidentContext.schema, table: demoIncidentContext.table, column: demoIncidentContext.anomalyColumn });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/anomaly?${params.toString()}`);
      setAnomalyData(await res.json());
    } catch (err) {
      console.error('Demo anomaly failed:', err);
    } finally {
      setWorkbenchLoading(prev => ({ ...prev, anomaly: false }));
    }
  };

  const runDemoFreshness = async () => {
    setDemoWorkbenchScope();
    setWorkbenchLoading(prev => ({ ...prev, freshness: true }));
    const params = new URLSearchParams({
      database: demoIncidentContext.database,
      schema: demoIncidentContext.schema,
      table: demoIncidentContext.table,
      expected_frequency: 'daily',
      date_column: demoIncidentContext.dateColumn
    });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/freshness?${params.toString()}`);
      setFreshnessData(await res.json());
      await loadWorkbenchQueryLog();
    } catch (err) {
      console.error('Demo freshness failed:', err);
    } finally {
      setWorkbenchLoading(prev => ({ ...prev, freshness: false }));
    }
  };

  const runDemoSqlTuning = async () => {
    const demoSql = `SELECT APP_NAME, COUNT(*) AS INCIDENT_COUNT, SUM(COST_IMPACT) AS TOTAL_COST
FROM KAGGLE.INCIDENT_MGMT.INCIDENTS
WHERE CREATED_DATE >= DATEADD(DAY, -90, CURRENT_DATE())
GROUP BY APP_NAME
ORDER BY TOTAL_COST DESC;`;
    setSqlQuery(demoSql);
    setAnalyzingCost(true);
    setOptimizing(true);
    setSqlCostAdvisor(null);
    setSqlOptimization(null);
    try {
      const [costRes, optimizeRes] = await Promise.all([
        fetch(`${API_BASE}/api/sql/cost-advisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: demoSql })
        }),
        fetch(`${API_BASE}/api/sql/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: demoSql })
        })
      ]);
      const [costData, optimizeData] = await Promise.all([safeJsonResponse(costRes), safeJsonResponse(optimizeRes)]);
      setSqlCostAdvisor(normalizeSqlCostAdvisor(costData, costRes.ok));
      setSqlOptimization(normalizeSqlOptimization(optimizeRes.ok ? optimizeData : {
        explanation: optimizeData.detail || optimizeData.error || 'Optimization failed.',
        optimized_sql: demoSql,
      }));
      await refreshAiUsage();
    } catch (err) {
      setSqlCostAdvisor({ success: false, error: err.message || 'Cost advisor failed.' });
      setSqlOptimization(normalizeSqlOptimization({ explanation: err.message || 'Optimization failed.', optimized_sql: demoSql }));
    } finally {
      setAnalyzingCost(false);
      setOptimizing(false);
    }
  };

  const runDemoCatalogSearch = async () => {
    setDemoWorkbenchScope();
    setWorkbenchLoading(prev => ({ ...prev, search: true }));
    const params = new URLSearchParams({
      database: demoIncidentContext.database,
      schema: demoIncidentContext.schema,
      query: 'incident',
      table_filter: 'sla'
    });
    try {
      const res = await fetch(`${API_BASE}/api/workbench/search?${params.toString()}`);
      const data = await res.json();
      setSearchTableResults(data.tables || []);
      setSearchColumnResults(data.columns || data.results || []);
    } catch (err) {
      console.error('Demo catalog search failed:', err);
    } finally {
      setWorkbenchLoading(prev => ({ ...prev, search: false }));
    }
  };

  const buildDemoRagAnswer = () => ({
    answer: {
      title: 'INCIDENTS Table Documentation Summary',
      sections: [
        {
          heading: 'Purpose',
          bullets: [
            'The INCIDENTS table tracks operational incidents across applications, including severity, status, ownership, SLA impact, root cause, and business impact.',
            'It helps teams answer triage, reliability, cost-impact, and executive reporting questions without reading the full runbook.'
          ]
        },
        {
          heading: 'Important fields',
          bullets: [
            'INCIDENT_ID identifies each incident; APP_NAME groups incidents by business or platform application.',
            'SEVERITY, STATUS, CREATED_DATE, SLA_BREACHED, ROOT_CAUSE, USERS_AFFECTED, and COST_IMPACT are the main fields for analysis.'
          ]
        },
        {
          heading: 'Fast questions users can ask',
          bullets: [
            'Which applications violate SLA the most?',
            'What are the top recurring root causes?',
            'How many critical incidents are still open?',
            'Which incidents have the highest user or cost impact?'
          ]
        }
      ]
    },
    citations: ['Demo table documentation summary'],
    source_chunks: [],
    retrieval_status: 'demo_summary',
    ai_metadata: {
      mode: 'demo_native_fallback',
      model: 'Document Hub demo summary',
      processing_time_ms: 0,
      assumptions: 'Shown when live RAG does not return a usable answer during the walkthrough.'
    }
  });

  const isUsableDemoRagResult = (data) => {
    if (!data?.answer || data.retrieval_status === 'no_match') return false;
    const answerText = typeof data.answer === 'string' ? data.answer : JSON.stringify(data.answer);
    const lowered = answerText.toLowerCase();
    return ![
      'openai_api_key',
      'api key',
      'not configured',
      'fallback reason',
      'could not find relevant indexed content',
      'no relevant indexed content'
    ].some(term => lowered.includes(term));
  };

  const runDemoRagSearch = async () => {
    const query = 'Read the table-related documentation and explain what the INCIDENTS table is used for, which fields are important, and what questions a user can answer quickly.';
    setRagResult(null);
    setLoadingRag(false);
    setRagQuery('');
    document.querySelector('.document-hub-page')?.scrollIntoView?.({ block: 'start', inline: 'nearest', behavior: 'smooth' });
    focusDemoDirectorTarget('.document-hub-page .chat-input', 'Document Hub question');
    await waitForDemo(900);

    const words = query.split(' ');
    for (let idx = 0; idx < words.length; idx += 6) {
      setRagQuery(words.slice(0, idx + 6).join(' '));
      await waitForDemo(260);
    }
    setRagQuery(query);
    await waitForDemo(3200);

    setLoadingRag(true);
    focusDemoDirectorTarget('.document-hub-page .btn.btn-primary', 'Ask Document Hub');
    await waitForDemo(900);
    try {
      await fetchRagDocuments();
      const res = await fetch(`${API_BASE}/api/rag/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setRagResult(isUsableDemoRagResult(data) ? data : buildDemoRagAnswer());
      await refreshAiUsage();
      await waitForDemo(900);
      focusDemoDirectorTarget('.rag-result-card', 'Verified answer');
      document.querySelector('.rag-result-card')?.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      await waitForDemo(2600);
    } catch (err) {
      console.error('Demo document search failed:', err);
      setRagResult(buildDemoRagAnswer());
      await waitForDemo(1800);
    } finally {
      setLoadingRag(false);
    }
  };

  const executeGuidedDemoStep = async (index) => {
    const step = guidedDemoSteps[index];
    if (!step) return;
    setGuidedDemoActionStatus(`Running: ${step.title}`);
    showDemoDirectorCue(step, 'focus');
    try {
      if (step.tab === 'incidentCommand') {
        await fetchIncidentCommandDashboard();
        await runIncidentCommandQuestion(step.prompt || 'Which applications violate SLA the most?');
        await waitForDemo(1200);
        await slowScrollDemoTarget('.incident-query-results, .incident-compare-grid, .incident-query-card', { initialPause: 900, increments: [180, 220, 220], pause: 1300 });
      } else if (step.tab === 'chat' && step.analystTab === 'chat' && step.title === 'AI Chat Copilot') {
        await runDemoChat(step.prompt || 'How many debit cards have a chip, credit limit greater than 10000 dollars, and account opened within the last 10 years?');
      } else if (step.tab === 'chat' && step.analystTab === 'ask') {
        await runDemoAskDataset(step.prompt || 'Show average credit limit by card brand for cards with chip, and include the number of cards for each brand.', demoFinanceContext);
        await slowScrollDemoTarget('.ask-dataset-results', { initialPause: 1900, increments: [90, 110, 110, 90], pause: 1700 });
      } else if (step.tab === 'chat' && step.analystTab === 'report') {
        await runDemoReport(step.prompt || 'Build a monthly account opening trend based on the card type', demoFinanceContext);
        await slowScrollDemoTarget('.analyst-report-body', { initialPause: 1800, increments: [90, 110, 110], pause: 1600 });
      } else if (step.tab === 'tableDetails' && step.tableDetailsTab === 'overview') {
        await runDemoProfiler();
      } else if (step.tab === 'tableDetails' && step.tableDetailsTab === 'volumeAnalyzer') {
        await runDemoVolumeAnalyzer();
        await slowScrollDemoTarget('.volume-analyzer-workspace', { initialPause: 1500, increments: [140, 190, 210, 170], pause: 1700, block: 'start' });
      } else if (step.tab === 'tableDetails' && step.tableDetailsTab === 'insights') {
        await runDemoInsights();
      } else if (step.tab === 'anomaly') {
        await runDemoAnomaly();
        const ruleSql = `SELECT *
FROM "KAGGLE"."INCIDENT_MGMT"."INCIDENTS"
WHERE "COST_IMPACT" > 5000
LIMIT 100;`;
        await handleExecuteWorkbenchSql(ruleSql, 'Demo Custom Anomaly Rule', { inlineKey: 'demo-custom-anomaly-rule' });
        await slowScrollDemoTarget('.anomaly-page', { initialPause: 1400, increments: [160, 180, 160], pause: 1400 });
      } else if (step.tab === 'freshness') {
        await runDemoFreshness();
        await slowScrollDemoTarget('.freshness-detail-card, .freshness-result-table', { initialPause: 1300, increments: [150, 150, 120], pause: 1400 });
      } else if (step.tab === 'sql') {
        await runDemoSqlTuning();
      } else if (step.tab === 'cost') {
        await fetchCostDashboard(costDateRange, costStartDate, costEndDate);
        setCostChartMode('trend');
      } else if (step.tab === 'catalogSearch') {
        await runDemoCatalogSearch();
      } else if (step.tab === 'rag') {
        await runDemoRagSearch();
      } else if (step.tab === 'queryLog') {
        await loadWorkbenchQueryLog();
      } else if (step.tab === 'executionFootprint') {
        await refreshAiUsage();
      } else if (step.tab === 'agentCommand') {
        setAgentGoal(step.prompt || 'Investigate why incident cost and SLA risk increased recently, then prepare a safe remediation plan.');
        await waitForDemo(900);
        focusDemoDirectorTarget('.agent-goal-card', 'Agent goal');
        await waitForDemo(1000);
        await runAgentCommandCenter();
        await waitForDemo(1200);
        focusDemoDirectorTarget('.agent-timeline-card', 'Tool execution timeline');
        await slowScrollDemoTarget('.agent-timeline-card', { initialPause: 1200, increments: [160, 170, 170], pause: 1200, block: 'start' });
        focusDemoDirectorTarget('.agent-approval-card', 'Approval gate');
        await waitForDemo(1800);
        focusDemoDirectorTarget('.agent-report-card', 'Final report');
        await slowScrollDemoTarget('.agent-report-card', { initialPause: 1200, increments: [130, 140], pause: 1200, block: 'center' });
      }
      setGuidedDemoActionStatus(`Ready: ${step.title}`);
      showDemoDirectorCue(step, 'result');
    } catch (err) {
      setGuidedDemoActionStatus(`Check manually: ${err.message || step.title}`);
      setDemoDirectorResultCard(prev => ({
        ...(prev || {}),
        phase: 'error',
        status: 'Manual check',
        title: step.title,
        value: err.message || 'The demo step needs a manual retry.'
      }));
    }
  };

  useEffect(() => {
    if (!guidedDemoOpen || !guidedDemoAutoPlay) return undefined;
    let cancelled = false;
    const wait = (ms) => new Promise(resolve => window.setTimeout(resolve, ms));
    const runSequenceStep = async () => {
      if (guidedDemoRunActions) {
        await executeGuidedDemoStep(guidedDemoStepIndex);
      }
      const stepSeconds = getGuidedDemoStepSeconds(guidedDemoSteps[guidedDemoStepIndex]);
      for (let remaining = stepSeconds; remaining > 0; remaining -= 1) {
        if (cancelled) return;
        setGuidedDemoRemaining(remaining);
        await wait(1000);
      }
      if (cancelled) return;
      const nextIndex = guidedDemoStepIndex + 1;
      if (nextIndex >= guidedDemoSteps.length) {
        setGuidedDemoAutoPlay(false);
        setGuidedDemoRunActions(false);
        setGuidedDemoActionStatus('Full demo completed.');
        showDemoCompleteCard();
        return;
      }
      setGuidedDemoStepIndex(nextIndex);
      setGuidedDemoRemaining(getGuidedDemoStepSeconds(guidedDemoSteps[nextIndex]));
      applyGuidedDemoStep(nextIndex);
    };
    runSequenceStep();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guidedDemoOpen, guidedDemoAutoPlay, guidedDemoRunActions, guidedDemoStepIndex]);

  const clearWorkbenchQueryLog = async () => {
    setWorkbenchLoading(prev => ({ ...prev, queryLog: true }));
    try {
      await fetch(`${API_BASE}/api/workbench/query-log/clear`, { method: 'POST' });
      setWorkbenchQueryLog([]);
    } catch (err) {
      console.error('Error clearing query log:', err);
    }
    setWorkbenchLoading(prev => ({ ...prev, queryLog: false }));
  };

  const renderWorkbenchScope = (appKey, options = {}) => {
    const scope = appScopes[appKey];
    const optionSet = appOptions[appKey];
    return (
      <div className="app-scope-bar">
        <SearchableSelect value={scope.database} onChange={(value) => loadWorkbenchSchemas(appKey, value)} options={databases} placeholder="Select Database" label="DB" className="workbench-select" />
        <SearchableSelect value={scope.schema} onChange={(value) => loadWorkbenchTables(appKey, value)} options={optionSet.schemas} placeholder="Select Schema" label="SCHEMA" className="workbench-select" />
        {options.includeType !== false && (
          <SearchableSelect value={scope.type} onChange={(value) => loadWorkbenchTables(appKey, scope.schema, value)} options={['ALL', 'TABLE', 'VIEW']} placeholder="TABLE" label="TYPE" className="workbench-type-select" />
        )}
        {options.includeTable !== false && (
          <SearchableSelect value={scope.table} onChange={(value) => setWorkbenchTable(appKey, value)} options={optionSet.tables} placeholder={options.tablePlaceholder || 'Select Table/View'} label="TABLE/VIEW" className="workbench-table-select" />
        )}
        {options.includeColumn && (
          <SearchableSelect value={scope.column} onChange={(value) => patchWorkbenchScope(appKey, { column: value })} options={optionSet.columns} placeholder="Select Column" label="COLUMN" className="workbench-table-select" />
        )}
      </div>
    );
  };

  const renderWorkbenchTabs = (tabs, active, onChange) => (
    <div className="workbench-tabs">
      {tabs.map(tab => (
        <button key={tab.id} className={`workbench-tab ${active === tab.id ? 'active' : ''}`} onClick={() => onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  );

  const getContextualTips = () => {
    if (activeTab === 'chat') {
      if (analystStudioTab === 'ask') {
        return {
          title: 'Ask Dataset Tips',
          tips: [
            'Select a table in the header when you want tighter SQL generation.',
            'Ask for grouped, ranked, or trend answers to get better charts.',
            'Use the row limit before running broad exploratory questions.',
            'Review the generated SQL before re-running if the question touches large tables.'
          ]
        };
      }
      if (analystStudioTab === 'report') {
        return {
          title: 'Report Builder Tips',
          tips: [
            'Phrase prompts like a dashboard requirement: metric, dimension, and time grain.',
            'Use grouped result sets for cleaner visualizations.',
            'Regenerate when the SQL shape is wrong; Run SQL when the SQL is right.',
            'Switch chart type only after confirming the result has a numeric measure.'
          ]
        };
      }
      return {
        title: 'Chat Copilot Tips',
        tips: [
          'Pick DB, schema, and table first to improve generated SQL accuracy.',
          'Ask one business question at a time for cleaner SQL.',
          'Click Execute on generated SQL to populate the results console.',
          'Use suggested questions as quick smoke tests for a selected table.'
        ]
      };
    }

    if (activeTab === 'agentCommand') {
      return {
        title: 'Agent Command Tips',
        tips: [
          'Start with a goal, not a single SQL request.',
          'Watch the agent plan, call tools, observe evidence, and decide the next step.',
          'Approval gates stop remediation SQL or operational changes before execution.',
          'Use the audit trail to explain exactly which tools the agent used.'
        ]
      };
    }

    if (activeTab === 'sql') {
      return {
        title: 'SQL Tuning Tips',
        tips: [
          'Run Analyze Cost before executing broad SELECT or JOIN queries.',
          'High-risk queries usually need filters, fewer columns, or pre-aggregation.',
          'Use Optimize & Explain SQL for readability and performance rewrite ideas.',
          'Cost estimates are directional; use Snowflake query history for exact executed cost.'
        ]
      };
    }

    if (activeTab === 'tableDetails') {
      const tabLabel = {
        overview: 'Overview',
        details: 'Table Details',
        profiler: 'Table Profiler',
        volumeAnalyzer: 'Volume Analyzer',
        insights: 'Insight Generator',
        ddl: 'Generated DDL',
        queries: 'Quick Queries'
      }[tableDetailsTab] || 'Table Intelligence';
      const tipsByTab = {
        overview: [
          'Use Overview to confirm the selected object before running heavier analysis.',
          'Open Profiler for row counts, null rates, DQ checks, and volume plots.',
          'Open Insights for KPI, trend, anomaly, correlation, and PII signals.'
        ],
        details: [
          'Load Details refreshes metadata, samples, descriptions, DDL, and quick SQL.',
          'Use sample rows to validate column meaning before asking AI questions.',
          'AI descriptions are documentation-style; column labels are role classifications.'
        ],
        profiler: [
          'Run Profile only when needed; it executes heavier stats queries.',
          'High null and empty columns are early data quality warning signs.',
          'Volume plots appear when the table has a date or timestamp column.'
        ],
        volumeAnalyzer: [
          'Pick the date or timestamp field that represents table activity.',
          'The analyzer flags unusual daily peaks and drops with a rolling MAD score.',
          'Use the daily count SQL to validate the plotted pattern in Snowflake.'
        ],
        insights: [
          'Generate Insights turns table structure and aggregates into analyst-style findings.',
          'Use recommended SQL snippets to verify or deepen each insight.',
          'PII signals are heuristic and should be reviewed before policy decisions.'
        ],
        ddl: [
          'Use generated DDL to understand structure or recreate a table shell.',
          'Check nullable and numeric precision details before migration work.'
        ],
        queries: [
          'Quick Queries are executable starting points for common table checks.',
          'Adjust row limit before executing broad sample queries.'
        ]
      };
      return { title: `${tabLabel} Tips`, tips: tipsByTab[tableDetailsTab] || tipsByTab.overview };
    }

    if (activeTab === 'catalogSearch') {
      return {
        title: 'Catalog Search Tips',
        tips: [
          'Search partial table or column names when you do not know the exact object.',
          'Use data type chips to narrow large schemas quickly.',
          'Generate SELECT from a result when you want a fast starter query.'
        ]
      };
    }

    if (activeTab === 'anomaly') {
      return {
        title: anomalyTab === 'rules' ? 'Custom Rule Tips' : 'Anomaly Detector Tips',
        tips: anomalyTab === 'rules' ? [
          'Use custom rules for business constraints that statistics cannot infer.',
          'Execute generated rule SQL to inspect affected rows.',
          'Keep row limits modest when checking broad anomaly rules.'
        ] : [
          'Numeric scans use z-score style outlier detection.',
          'Date scans look for unusual row-count movement over time.',
          'Text scans highlight rare categories or values.'
        ]
      };
    }

    if (activeTab === 'freshness') {
      return {
        title: 'Data Freshness Tips',
        tips: [
          'Leave table empty to scan the schema, or choose one table for faster checks.',
          'Use frequency filters to focus on daily, weekly, or monthly expectations.',
          'Freshness depends on detecting a usable date or timestamp column.'
        ]
      };
    }

    if (activeTab === 'cost') {
      return {
        title: 'Cost Analyzer Tips',
        tips: [
          'Set a custom date range before comparing warehouse or user spend.',
          'Query-level costs use cloud-services credits; warehouse totals use metering history.',
          'Use scatter view to find long-running or unusually expensive queries.',
          'Pair this page with SQL Cost Advisor before running new expensive SQL.'
        ]
      };
    }

    if (activeTab === 'incidentCommand') {
      return {
        title: 'Incident Command Tips',
        tips: [
          'Use this app to show Data Pilot as a domain-configurable enterprise copilot, not only a Snowflake utility.',
          'Switch Execution Mode to Compare before asking a question to show Native speed versus AI business context.',
          'Use the sample prompts for critical incidents, SLA breaches, change-linked incidents, and cost impact.',
          'The dashboard reads from the loaded Snowflake tables in KAGGLE.INCIDENT_MGMT.'
        ]
      };
    }

    if (activeTab === 'rag') {
      return {
        title: 'Document Hub Tips',
        tips: [
          'Use batch ingest for multiple URLs or files that belong to the same topic.',
          'Set crawl depth carefully; deeper crawls collect more pages and take longer.',
          'Ask questions that mention the uploaded source or topic for better retrieval.',
          'Use reset only when you intentionally want to clear the local knowledge base.'
        ]
      };
    }

    if (activeTab === 'queryLog') {
      return {
        title: 'Query Log Tips',
        tips: [
          'Use Query Log to replay SQL generated from chat, workbench, and insight tools.',
          'Clean up the log when demo history becomes noisy.',
          'Copy useful SQL into the SQL Tuning page for cost and optimization review.'
        ]
      };
    }

    return {
      title: 'Data Pilot Tips',
      tips: [
        'Select role and warehouse once from the sidebar session context.',
        'Use DB, schema, and table selectors before running AI or profiling workflows.',
        'Review generated SQL before executing against large Snowflake objects.'
      ]
    };
  };

  const renderRowLimitSelect = () => (
    <label className="row-limit-control">
      <span>Rows</span>
      <select value={sqlRowLimit} onChange={(e) => setSqlRowLimit(Number(e.target.value))}>
        {[25, 50, 100, 250, 500, 1000].map(limit => (
          <option key={limit} value={limit}>{limit}</option>
        ))}
      </select>
    </label>
  );

  const contextualTips = getContextualTips();

  const getInlineSqlKey = (sql, title = 'SQL Result') => `${title}::${sql}`;

  const renderInlineSqlResult = (inlineKey) => {
    if (!inlineKey) return null;
    const result = inlineSqlResults[inlineKey];
    const executing = inlineSqlExecuting[inlineKey];
    if (!result && !executing) return null;
    const previewRows = (result?.data || []).slice(0, 10);
    return (
      <div className="inline-sql-result">
        {executing && <div className="empty-state">Executing query...</div>}
        {result && !result.success && (
          <div className="inline-sql-error">
            <strong>Execution Error</strong>
            <span>{result.error}</span>
          </div>
        )}
        {result?.success && (
          <>
            <div className="inline-sql-result-header">
              <span>{previewRows.length} preview rows</span>
              <span>{result.row_count} returned | Limit {result.row_limit || sqlRowLimit}</span>
            </div>
            {previewRows.length > 0 ? (
              <div className="table-container inline-sql-table">
                <table className="custom-table">
                  <thead>
                    <tr>{result.columns?.map((col, idx) => <th key={idx}>{col}</th>)}</tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {result.columns?.map((col, cIdx) => (
                          <td key={cIdx} title={String(row[col] ?? '')}>{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">Query ran successfully and returned no rows.</div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderSqlActionButtons = (sql, title, options = {}) => {
    const inlineKey = options.inline ? getInlineSqlKey(sql, title) : options.inlineKey;
    const isExecuting = inlineKey ? inlineSqlExecuting[inlineKey] : workbenchSqlExecuting;
    return (
    <div className="sql-action-row">
      {renderRowLimitSelect()}
      <button className="btn btn-primary btn-small" onClick={() => handleExecuteWorkbenchSql(sql, title, inlineKey ? { inlineKey } : {})} disabled={isExecuting}>
        <Play size={10} /> {isExecuting ? 'Running...' : 'Execute'}
      </button>
      <button className="btn btn-secondary btn-small" onClick={() => handleCopy(sql)}>
        {copiedQuery === sql ? 'Copied!' : 'Copy'}
      </button>
    </div>
    );
  };

  const renderSqlInlinePreview = (sql, title) => renderInlineSqlResult(getInlineSqlKey(sql, title));

  const resolveChartFields = (result, visualization = {}) => {
    const rows = result?.data || [];
    const columns = result?.columns || Object.keys(rows[0] || {});
    const resolveColumn = (name) => {
      if (!name) return '';
      return columns.find(col => String(col).toLowerCase() === String(name).toLowerCase()) || '';
    };
    let x = resolveColumn(visualization.x);
    let y = resolveColumn(visualization.y);
    const numericColumns = columns.filter(col => rows.some(row => Number.isFinite(Number(getKeyValue(row, col)))));
    const labelColumns = columns.filter(col => !numericColumns.includes(col));
    if (!y) y = numericColumns[0] || '';
    if (!x) x = labelColumns[0] || columns.find(col => col !== y) || columns[0] || '';
    const type = visualization.type && visualization.type !== 'none'
      ? visualization.type
      : (String(x).toLowerCase().includes('date') || String(x).toLowerCase().includes('time') ? 'line' : 'bar');
    return { type, x, y, canChart: Boolean(rows.length && x && y) };
  };

  const renderChatVisualization = (message) => {
    if (!message?.result?.success) {
      return (
        <div className="text-secondary" style={{ fontSize: '11px' }}>
          Click "Execute" on SQL above to render this visualization dynamically.
        </div>
      );
    }
    const resolved = resolveChartFields(message.result, message.visualization);
    if (!resolved.canChart) {
      return <div className="text-secondary" style={{ fontSize: '11px' }}>No numeric result column was available for charting.</div>;
    }
    if (resolved.type === 'line') return renderSvgLineChart(message.result.data, resolved.x, resolved.y);
    return renderSvgBarChart(message.result.data, resolved.x, resolved.y);
  };

  const renderRagAnswer = (answer) => {
    const inferNewsCategory = (headline = '', details = '') => {
      const text = `${headline} ${details}`.toLowerCase();
      if (/(trump|senator|booker|election|white house|congress|politic|newsom|governor|state of emergency)/.test(text)) return 'Politics';
      if (/(ukrain|crimea|russian|europe|erdogan|erdoğan|france|canadian|world|turkey|seminenary|seminary|orthodox|heat wave)/.test(text)) return 'World News';
      if (/(open golf|championship|sports|u\.s\. open|wyndham clark)/.test(text)) return 'Sports';
      if (/(concert|rod stewart|music|culture|movie|television)/.test(text)) return 'Culture';
      if (/(radio telescope|space|science|technology|nevada desert|array)/.test(text)) return 'Science & Tech';
      if (/(dies|madison square garden|california|l\.a\.|los angeles|u\.s\.|fire|balcony)/.test(text)) return 'U.S. News';
      return 'General News';
    };

    const groupNewsRows = (rows = []) => {
      const grouped = {};
      rows.forEach(item => {
        let row = item;
        if (typeof row === 'string') {
          if (row.includes(' - ')) {
            const [headline, ...detailParts] = row.split(' - ');
            row = { headline: headline.trim(), details: detailParts.join(' - ').trim() };
          } else {
            row = { headline: row, details: '' };
          }
        }
        const headline = row.headline || row.HEADLINE || row.title || row.TITLE || 'Untitled';
        const details = row.details || row.DETAILS || row.summary || row.SUMMARY || '';
        const category = row.category || row.CATEGORY || inferNewsCategory(headline, details);
        grouped[category] = grouped[category] || [];
        grouped[category].push({ headline, details });
      });
      return grouped;
    };

    const normalizeJsonLineAnswer = (value) => {
      if (typeof value !== 'string') return null;
      const lines = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      const jsonRows = [];
      lines.forEach(line => {
        if (!line.startsWith('{') || !line.endsWith('}')) return;
        try {
          jsonRows.push(JSON.parse(line));
        } catch {
          // Keep non-JSON text on the plain text path.
        }
      });
      if (!jsonRows.length) return null;
      return groupNewsRows(jsonRows);
    };

    const normalizeFlatNewsText = (value) => {
      if (typeof value !== 'string') return null;
      const lines = value.split(/\r?\n/).map(line => line.trim().replace(/^-+\s*/, '')).filter(Boolean);
      const rows = [];
      lines.forEach(line => {
        if (line.toLowerCase().replace(/\s+/g, '_') === 'latest_news') return;
        if (!line.includes(' - ')) return;
        const [headline, ...detailParts] = line.split(' - ');
        const details = detailParts.join(' - ').trim();
        rows.push({ headline: headline.trim(), details });
      });
      return rows.length ? groupNewsRows(rows) : null;
    };

    if (answer === null || answer === undefined) {
      return <p className="rag-answer-text">No answer was returned.</p>;
    }
    if (typeof answer === 'string' || typeof answer === 'number') {
      const parsed = normalizeJsonLineAnswer(String(answer));
      if (parsed) return renderRagAnswer(parsed);
      const flatNews = normalizeFlatNewsText(String(answer));
      if (flatNews) return renderRagAnswer(flatNews);
      return <p className="rag-answer-text">{String(answer)}</p>;
    }
    if (Array.isArray(answer)) {
      return (
        <div className="rag-answer-list">
          {answer.map((item, idx) => <span key={idx}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>)}
        </div>
      );
    }
    if (typeof answer === 'object') {
      if (answer.title && Array.isArray(answer.sections)) {
        return (
          <div className="rag-structured-answer">
            <div className="mini-card-title" style={{ marginBottom: '10px' }}>{answer.title}</div>
            <div className="rag-answer-list">
              {answer.sections.map((section, idx) => (
                <div key={`${section.heading || 'section'}-${idx}`} className="rag-structured-section">
                  <strong>{section.heading || `Section ${idx + 1}`}</strong>
                  {Array.isArray(section.bullets) ? (
                    <ul>
                      {section.bullets.map((bullet, bulletIdx) => (
                        <li key={bulletIdx}>{String(bullet)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rag-answer-text">{String(section.text || section.summary || '')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      const normalizeGenericKey = (key) => key.toLowerCase().trim().replace(/\s+/g, '_');
      const keys = Object.keys(answer).map(normalizeGenericKey);
      if (keys.length && keys.every(key => ['latest_news', 'news', 'headlines', 'items', 'results'].includes(key))) {
        const rows = Object.values(answer).flatMap(value => {
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
          }
          return [value];
        });
        return renderRagAnswer(groupNewsRows(rows));
      }
      return (
        <div className="rag-category-grid">
          {Object.entries(answer).map(([category, items]) => (
            <div key={category} className="rag-category-card">
              <div className="mini-card-title">{category}</div>
              {Array.isArray(items) ? (
                <div className="rag-answer-list">
                  {items.map((item, idx) => (
                    <span key={idx}>
                      {typeof item === 'object'
                        ? <><strong>{item.headline || item.title || 'Item'}</strong>{item.details || item.summary ? ` - ${item.details || item.summary}` : ''}</>
                        : String(item)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="rag-answer-text">{typeof items === 'object' ? JSON.stringify(items) : String(items)}</p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return <p className="rag-answer-text">{String(answer)}</p>;
  };

  const normalizeRagList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(/\r?\n|,/).map(item => item.trim()).filter(Boolean);
    }
    if (typeof value === 'object') return Object.values(value).flat();
    return [value];
  };

  const formatRagCitation = (citation) => {
    if (citation === null || citation === undefined) return '';
    if (typeof citation === 'string' || typeof citation === 'number') return String(citation);
    return citation.title || citation.TITLE || citation.source || citation.SOURCE || citation.name || JSON.stringify(citation);
  };

  const renderComparePreview = (pipeline) => {
    const columns = pipeline?.columns || [];
    const rows = pipeline?.preview || [];
    if (!pipeline?.execution_success) {
      return <div className="empty-state compact">{pipeline?.execution_error || 'No executable preview was returned.'}</div>;
    }
    if (!columns.length || !rows.length) {
      return <div className="empty-state compact">Query ran successfully but returned no preview rows.</div>;
    }
    return (
      <div className="table-container compare-preview-table">
        <table>
          <thead>
            <tr>{columns.map((col, idx) => <th key={idx}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row, rIdx) => (
              <tr key={rIdx}>
                {columns.map((col, cIdx) => <td key={cIdx}>{String(row[col] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const calculateSqlIntentScore = (sql = '', prompt = '') => {
    const text = String(sql || '').toLowerCase();
    const ask = String(prompt || '').toLowerCase();
    let score = 0;
    const matches = [];
    if (!text.trim()) return { score, matches };
    if (/\bcount\s*\(/.test(text) && /(how many|count)/.test(ask)) {
      score += 25;
      matches.push('uses COUNT for a count question');
    }
    if (/\bwhere\b/.test(text)) {
      score += 20;
      matches.push('applies filtering criteria');
    }
    if (/select\s+\*/.test(text)) {
      score -= 25;
      matches.push('uses broad SELECT * instead of an answer-shaped projection');
    }
    if (/(more than|less than|within|last|opened|10k|10000)/.test(ask) && /(>|<|between|dateadd|try_to_date|try_to_timestamp|current_date)/.test(text)) {
      score += 20;
      matches.push('models threshold or date-window logic');
    }
    if (/(credit|limit)/.test(ask) && /credit/.test(text) && /limit/.test(text)) {
      score += 15;
      matches.push('uses the credit-limit field concept');
    }
    if (/chip/.test(ask) && /chip/.test(text)) {
      score += 10;
      matches.push('uses chip criteria');
    }
    if (/debit/.test(ask) && /debit/.test(text)) {
      score += 10;
      matches.push('uses debit-card criteria');
    }
    if (/(card|cards|debit|credit)/.test(ask) && /card/.test(text)) {
      score += 10;
      matches.push('selects a card-oriented table or field');
    }
    if (/(\$|10k|10000|amount|credit limit)/.test(ask) && /(regexp_replace|replace|try_cast|try_to_number|try_cast)/.test(text)) {
      score += 15;
      matches.push('handles formatted numeric text safely');
    }
    if (/(opened|last|year|date)/.test(ask) && /(try_to_date|try_to_timestamp|dateadd|current_date)/.test(text)) {
      score += 15;
      matches.push('handles date logic safely');
    }
    return { score, matches };
  };

  const renderComparePipeline = (pipeline, type) => {
    if (!pipeline) return null;
    const isAi = type === 'ai';
    return (
      <div className={`compare-pipeline-card ${isAi ? 'ai' : 'native'}`}>
        <div className="compare-pipeline-header">
          <div>
            <span className="compare-pipeline-kicker">{isAi ? 'Provider Pipeline' : 'Python Pipeline'}</span>
            <h3>{pipeline.label}</h3>
          </div>
          <span className={`compare-status ${pipeline.execution_success ? 'success' : 'error'}`}>
            {pipeline.execution_success ? 'Executed' : 'Needs Review'}
          </span>
        </div>
        {pipeline.repair?.attempted && (
          <div className={`compare-repair-note ${pipeline.repair.success ? 'success' : 'error'}`}>
            <strong>{pipeline.repair.success ? 'Auto-repaired after Snowflake error' : 'Auto-repair attempted'}</strong>
            <span>{pipeline.repair.original_error}</span>
          </div>
        )}
        <div className="compare-metric-grid">
          <div><span>Total Time</span><strong>{pipeline.total_processing_time_ms || 0} ms</strong></div>
          <div><span>SQL Time</span><strong>{pipeline.sql_execution_time_ms || 0} ms</strong></div>
          <div><span>Rows</span><strong>{pipeline.rows_returned || 0}</strong></div>
          <div><span>Confidence</span><strong>{pipeline.confidence || '-'}</strong></div>
          {isAi && <div><span>Tokens</span><strong>{pipeline.tokens?.total || 0}</strong></div>}
          {isAi && <div><span>API Cost</span><strong>${Number(pipeline.estimated_api_cost || 0).toFixed(4)}</strong></div>}
        </div>
        {renderExplainabilityTimeline(pipeline.explainability_timeline)}
        <div className="compare-section">
          <div className="compare-section-title">
            <span>Generated SQL</span>
            <div className="compare-code-actions">
              {renderRowLimitSelect()}
              <button className="btn btn-secondary btn-small" onClick={() => handleCopy(pipeline.generated_sql || '')}>
                {copiedQuery === pipeline.generated_sql ? <Check size={12} /> : <Copy size={12} />} Copy
              </button>
            </div>
          </div>
          <pre className="code-block compare-code-block">{pipeline.generated_sql || pipeline.error || 'No SQL generated.'}</pre>
        </div>
        {renderSqlValidationFirewall(pipeline.sql_validation)}
        <div className="compare-section">
          <div className="compare-section-title"><span>Explanation</span></div>
          <p className="compare-text">{pipeline.explanation || 'No explanation returned.'}</p>
        </div>
        <div className="compare-section">
          <div className="compare-section-title"><span>Optimization Suggestions</span></div>
          <div className="compare-suggestion-list">
            {(pipeline.optimization_suggestions || []).map((item, idx) => <span key={idx}>{item}</span>)}
          </div>
        </div>
        <div className="compare-section">
          <div className="compare-section-title"><span>Query Result Preview</span></div>
          {renderComparePreview(pipeline)}
        </div>
      </div>
    );
  };

  const renderComparisonDashboard = (comparison) => {
    if (!comparison) return null;
    const summary = comparison.summary || {};
    const nativeIntent = calculateSqlIntentScore(comparison.native?.generated_sql, comparison.prompt);
    const aiIntent = calculateSqlIntentScore(comparison.ai?.generated_sql, comparison.prompt);
    const intentScores = {
      native: Math.max(summary.intent_scores?.native ?? -999, nativeIntent.score),
      ai: Math.max(summary.intent_scores?.ai ?? -999, aiIntent.score),
      native_matches: (nativeIntent.matches.length ? nativeIntent.matches : summary.intent_scores?.native_matches) || [],
      ai_matches: (aiIntent.matches.length ? aiIntent.matches : summary.intent_scores?.ai_matches) || [],
    };
    const derivedWhyAiWon = intentScores.ai > intentScores.native + 15
      ? `AI won because it matched the user's question more closely than the native path. The AI SQL ${intentScores.ai_matches.slice(0, 4).join(', ') || 'encodes the requested business logic'}, while the native SQL ${intentScores.native_matches.slice(0, 2).join(', ') || 'does not capture the requested criteria'}. Execution speed is secondary when a faster query does not answer the question.`
      : summary.why_ai_won;
    return (
      <div className="compare-dashboard">
        <div className="compare-hero">
          <div>
            <span className="compare-pipeline-kicker">Original Prompt</span>
            <h2>{comparison.prompt || 'Native vs AI Comparison'}</h2>
          </div>
          <div className={`compare-recommendation ${String(summary.recommended || '').toLowerCase()}`}>
            Recommended: {summary.recommended || 'Review'}
          </div>
        </div>
        {renderSemanticResolver(comparison.semantic_resolver)}
        <div className="compare-grid">
          {renderComparePipeline(comparison.native, 'native')}
          {renderComparePipeline(comparison.ai, 'ai')}
        </div>
        <div className="compare-summary-panel">
          <div className="compare-summary-main">
            <span className="compare-pipeline-kicker">Comparison Summary</span>
            <h3>{summary.summary || 'Review the two pipelines side by side.'}</h3>
            <p>{summary.performance}</p>
          </div>
          <div className="compare-summary-grid">
            <div><span>SQL Readability</span><strong>{summary.readability || '-'}</strong></div>
            <div><span>AI Optimizations</span><strong>{summary.ai_optimization || '-'}</strong></div>
            <div><span>Business Insight</span><strong>{summary.business_insights || '-'}</strong></div>
            <div><span>Cost Savings</span><strong>{summary.cost_savings || '-'}</strong></div>
          </div>
          <div className="why-ai-won">
            <span>Why AI Won</span>
            <p>{derivedWhyAiWon || 'AI adds the most value when the request benefits from explanation, optimization, and business interpretation.'}</p>
            {intentScores && (
              <div className="intent-score-grid">
                <div>
                  <strong>Native Intent Score: {intentScores.native ?? 0}</strong>
                  <small>{(intentScores.native_matches || []).slice(0, 3).join(', ') || 'No strong intent match detected'}</small>
                </div>
                <div>
                  <strong>AI Intent Score: {intentScores.ai ?? 0}</strong>
                  <small>{(intentScores.ai_matches || []).slice(0, 3).join(', ') || 'No strong intent match detected'}</small>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSemanticResolver = (resolver) => {
    const matches = resolver?.top_matches || [];
    if (!resolver) return null;
    return (
      <div className="semantic-resolver-card">
        <div className="semantic-resolver-header">
          <div>
            <span className="compare-pipeline-kicker">Semantic Table Resolver</span>
            <strong>{resolver.best_table || matches[0]?.table || 'No table match yet'}</strong>
          </div>
          <span className="status-badge">{resolver.confidence || matches[0]?.confidence} Confidence</span>
        </div>
        <div className="semantic-concept-row">
          {(resolver.concepts?.length ? resolver.concepts : resolver.query_tokens?.slice(0, 6) || ['no schema match']).map(concept => <span key={concept}>{concept}</span>)}
        </div>
        {matches.length ? (
          <div className="semantic-match-grid">
            {matches.slice(0, 3).map(match => (
              <div key={match.table} className="semantic-match">
                <div><strong>{match.table}</strong><span>Score {match.score} | {match.confidence}</span></div>
                <p>{(match.matched_columns || []).slice(0, 6).join(', ') || 'Matched by table name'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="semantic-empty">
            No strong table match was found from the current DB/schema metadata. Select a more specific table/view or refresh the schema context.
          </div>
        )}
      </div>
    );
  };

  const renderSqlValidationFirewall = (validation) => {
    if (!validation || Object.keys(validation).length === 0) return null;
    const status = validation.status || (validation.blocked ? 'blocked' : 'passed');
    const details = [
      ...(validation.missing_tables || []).map(item => `Missing table: ${item}`),
      ...(validation.missing_columns || []).map(item => `Missing field: ${item}`),
      ...(validation.warnings || []),
    ];
    return (
      <div className={`sql-firewall-card ${status}`}>
        <div className="sql-firewall-header">
          <span>SQL Validation Firewall</span>
          <strong>{status}</strong>
        </div>
        <div className="sql-firewall-grid">
          <div><span>Tables Checked</span><strong>{validation.checked_tables?.length || 0}</strong></div>
          <div><span>Fields Checked</span><strong>{validation.checked_columns?.length || 0}</strong></div>
          <div><span>Blocked</span><strong>{validation.blocked ? 'Yes' : 'No'}</strong></div>
        </div>
        {details.length > 0 && (
          <div className="sql-firewall-details">
            {details.slice(0, 5).map((item, idx) => <span key={idx}>{item}</span>)}
          </div>
        )}
      </div>
    );
  };

  const renderExplainabilityTimeline = (timeline) => {
    const steps = timeline?.steps || [];
    if (!steps.length) return null;
    const statusLabel = timeline.status || 'review';
    return (
      <div className={`explainability-timeline ${statusLabel}`}>
        <div className="explainability-timeline-header">
          <div>
            <span className="compare-pipeline-kicker">Explainability Timeline</span>
            <strong>{timeline.label || 'Decision Trace'}</strong>
          </div>
          <span className={`compare-status ${statusLabel === 'passed' ? 'success' : statusLabel === 'blocked' ? 'error' : ''}`}>
            {statusLabel}
          </span>
        </div>
        <div className="explainability-step-list">
          {steps.map((step, idx) => (
            <div key={`${step.id || step.label}-${idx}`} className={`explainability-step ${step.status || 'info'}`}>
              <div className="explainability-marker">{idx + 1}</div>
              <div className="explainability-step-body">
                <div className="explainability-step-title">
                  <strong>{step.label}</strong>
                  <span>{step.status || 'info'}</span>
                </div>
                <p>{step.detail}</p>
                {step.metrics && Object.keys(step.metrics).some(key => step.metrics[key] !== null && step.metrics[key] !== undefined && step.metrics[key] !== '') && (
                  <div className="explainability-metrics">
                    {Object.entries(step.metrics)
                      .filter(([, value]) => value !== null && value !== undefined && value !== '')
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <span key={key}>{key.replace(/_/g, ' ')}: {String(value)}</span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAiTransparency = (metadata, options = {}) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    const rawMetadataError = String(metadata.error || '');
    const safeMetadataError = rawMetadataError && /api[_\s-]?key|not configured|authentication|credential/i.test(rawMetadataError)
      ? 'AI provider is not configured for this run, so Data Pilot used the native fallback path.'
      : rawMetadataError;
    const shouldHideFallbackReason = options.hideFallbackReason || (
      metadata.operation === 'rag_answer'
      && metadata.fallback_used
      && /401|unauthorized|api[_\s-]?key|authentication|credential/i.test(rawMetadataError)
    );
    const transparencyNote = shouldHideFallbackReason
      ? 'Document Hub used native retrieval and the indexed knowledge base for this answer.'
      : (safeMetadataError ? `Fallback reason: ${safeMetadataError}` : metadata.assumptions);
    return (
      <div className="ai-transparency-card">
        <div className="ai-transparency-header">
          <span>{metadata.processing_mode || 'Native'} Processing</span>
          <span>{metadata.provider || 'Native'} / {metadata.model || 'Rules'}</span>
        </div>
        <div className="ai-transparency-grid">
          <span>Time: {metadata.processing_time_ms ?? '-'} ms</span>
          <span>Confidence: {metadata.confidence || '-'}</span>
          <span>Tokens: {(metadata.prompt_tokens || 0) + (metadata.completion_tokens || 0)}</span>
          <span>{metadata.fallback_used ? 'Fallback used' : 'AI path'}</span>
        </div>
        {transparencyNote && (
          <p>{transparencyNote}</p>
        )}
      </div>
    );
  };

  const renderSqlResultsCard = () => {
    if (!workbenchSqlResults && !workbenchSqlExecuting) return null;
    return (
      <div className="panel-body sql-results-panel">
        <div className="glass-card">
          <div className="glass-card-header">
            <span className="glass-card-title"><Terminal size={16} /> {workbenchSqlTitle || 'SQL Results'}</span>
            {renderRowLimitSelect()}
          </div>
          {workbenchSqlExecuting && <div className="empty-state">Executing SQL...</div>}
          {workbenchSqlResults && !workbenchSqlResults.success && (
            <div className="glass-card" style={{ borderColor: 'var(--accent-red)', backgroundColor: 'rgba(255,82,100,0.05)' }}>
              <div style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Execution Error</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--text-secondary)' }}>{workbenchSqlResults.error}</div>
            </div>
          )}
          {workbenchSqlResults?.success && (
            <>
              <div className="status-badge" style={{ marginBottom: '12px' }}>
                {workbenchSqlResults.row_count} rows shown
                {workbenchSqlResults.total_row_count > workbenchSqlResults.row_count ? ` of ${workbenchSqlResults.total_row_count}` : ''}
                {' '}| Limit {workbenchSqlResults.row_limit || sqlRowLimit}
              </div>
              <div className="table-container sql-result-table">
                <table className="custom-table">
                  <thead>
                    <tr>{workbenchSqlResults.columns?.map((col, idx) => <th key={idx}>{col}</th>)}</tr>
                  </thead>
                  <tbody>
                    {workbenchSqlResults.data?.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {workbenchSqlResults.columns?.map((col, cIdx) => (
                          <td key={cIdx} title={String(row[col] ?? '')}>{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const getAnomalyPlotOptions = (kind) => {
    if (kind === 'numeric') return ['auto', 'scatter', 'histogram'];
    if (kind === 'date') return ['auto', 'line', 'bar'];
    return ['auto', 'bar', 'pareto'];
  };

  const renderAnomalyPlot = (data, requestedPlot = 'auto') => {
    const summary = data?.summary || {};
    const width = 860;
    const height = 280;
    const pad = { left: 56, right: 24, top: 26, bottom: 42 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;

    const plotType = requestedPlot === 'auto'
      ? (data.kind === 'numeric' ? 'scatter' : data.kind === 'date' ? 'line' : 'pareto')
      : requestedPlot;

    if (data.kind === 'numeric') {
      const points = data.plot_data?.points || [];
      const histogram = data.plot_data?.histogram || [];
      const values = points.map(row => Number(row.value)).filter(Number.isFinite);
      const lowerThreshold = Number(summary.lower_z_threshold ?? summary.lower_fence);
      const upperThreshold = Number(summary.upper_z_threshold ?? summary.upper_fence);
      const thresholds = [lowerThreshold, upperThreshold, summary.mean]
        .map(Number)
        .filter(Number.isFinite);
      if (!values.length && !histogram.length) {
        return <div className="empty-state">No numeric values to plot for this scan.</div>;
      }

      if (plotType === 'histogram') {
        const maxCount = Math.max(...histogram.map(bin => Number(bin.count) || 0), 1);
        const barWidth = Math.max(8, chartWidth / histogram.length * 0.68);
        const slot = chartWidth / histogram.length;
        return (
          <div className="anomaly-plot-card anomaly-chart-card">
            <svg viewBox={`0 0 ${width} ${height}`} className="anomaly-svg">
              <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
              <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
              {histogram.map((bin, idx) => {
                const count = Number(bin.count) || 0;
                const barHeight = (count / maxCount) * chartHeight;
                const x = pad.left + idx * slot + (slot - barWidth) / 2;
                const y = pad.top + chartHeight - barHeight;
                const isThresholdBin = lowerThreshold >= bin.min && lowerThreshold <= bin.max || upperThreshold >= bin.min && upperThreshold <= bin.max;
                return (
                  <g key={`${bin.min}-${idx}`}>
                    <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" className={isThresholdBin ? 'anomaly-bar warning' : 'anomaly-bar'} />
                    <title>{`${bin.min.toFixed(2)} - ${bin.max.toFixed(2)}\nCount: ${count}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        );
      }

      const minVal = Math.min(...values, ...thresholds);
      const maxVal = Math.max(...values, ...thresholds);
      const span = maxVal - minVal || 1;
      const scaleY = (value) => pad.top + chartHeight - ((value - minVal) / span) * chartHeight;
      const scaleX = (idx) => pad.left + (points.length === 1 ? chartWidth / 2 : (idx / (points.length - 1)) * chartWidth);
      const fenceLines = [
        { label: 'Lower 3 sigma', value: lowerThreshold, color: 'var(--accent-orange)' },
        { label: 'Upper 3 sigma', value: upperThreshold, color: 'var(--accent-orange)' },
        { label: 'Mean', value: Number(summary.mean), color: 'var(--accent-cyan)' }
      ].filter(line => Number.isFinite(line.value));

      return (
        <div className="anomaly-plot-card anomaly-chart-card">
          <svg viewBox={`0 0 ${width} ${height}`} className="anomaly-svg">
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
            <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
            {fenceLines.map(line => {
              const y = scaleY(line.value);
              return (
                <g key={line.label}>
                  <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke={line.color} strokeDasharray="6 5" strokeWidth="1.5" />
                  <text x={pad.left + 8} y={y - 6} className="chart-label" fill={line.color}>{line.label}: {line.value.toFixed(2)}</text>
                </g>
              );
            })}
            {points.map((row, idx) => {
              const value = Number(row.value);
              const y = scaleY(value);
              const x = scaleX(idx);
              return (
                <g key={`${value}-${idx}`}>
                  <circle cx={x} cy={y} r={row.is_anomaly ? 5 : 3} className={row.is_anomaly ? 'anomaly-dot critical' : 'anomaly-dot'} />
                  <title>{`Value: ${value}${row.is_anomaly ? '\nOutlier' : ''}`}</title>
                </g>
              );
            })}
          </svg>
          <div className="anomaly-legend">
            <span><i className="legend-dot critical"></i>Outlier values</span>
            <span><i className="legend-line orange"></i>3-sigma bounds</span>
            <span><i className="legend-line cyan"></i>Mean</span>
          </div>
        </div>
      );
    }

    const sourceRows = data.kind === 'date' ? (data.plot_data?.series || []) : (data.plot_data?.categories || []);
    if (!sourceRows.length) {
      return <div className="empty-state">No values to plot for this scan.</div>;
    }
    const labelKey = data.kind === 'date' ? 'ACTIVITY_DATE' : 'VALUE';
    const valueKey = data.kind === 'date' ? 'ROW_COUNT' : 'COUNT';
    const parsed = sourceRows.map(row => ({
      label: String(row[labelKey] ?? row[labelKey.toLowerCase()] ?? row.value ?? ''),
      value: Number(row[valueKey] ?? row[valueKey.toLowerCase()] ?? row.count ?? 0),
      pct: row.pct,
      direction: row.DIRECTION || row.direction || '',
      modifiedZ: row.MODIFIED_Z ?? row.modified_z,
      rollingMedian: row.ROLLING_MEDIAN ?? row.rolling_median,
      isAnomaly: Boolean(row.IS_ANOMALY || row.IS_RARE)
    })).filter(row => Number.isFinite(row.value));
    const maxVal = Math.max(...parsed.map(row => row.value), 1);

    if (plotType === 'line') {
      const points = parsed.map((row, idx) => ({
        x: pad.left + (parsed.length === 1 ? chartWidth / 2 : (idx / (parsed.length - 1)) * chartWidth),
        y: pad.top + chartHeight - (row.value / maxVal) * chartHeight,
        ...row
      }));
      return (
        <div className="anomaly-plot-card anomaly-chart-card">
          <svg viewBox={`0 0 ${width} ${height}`} className="anomaly-svg">
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
            <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
            <polyline points={points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" />
            {points.map((point, idx) => (
              <g key={`${point.label}-${idx}`}>
                <circle cx={point.x} cy={point.y} r={point.isAnomaly ? 5 : 3} className={point.isAnomaly ? 'anomaly-dot critical' : 'anomaly-dot'} />
                {idx % Math.ceil(points.length / 10 || 1) === 0 && <text x={point.x} y={height - 14} className="chart-label" textAnchor="middle">{point.label.slice(0, 10)}</text>}
                <title>{`${point.label}\nCount: ${point.value}${point.isAnomaly ? `\n${point.direction || 'anomaly'} anomaly${point.modifiedZ !== undefined ? `\nModified Z: ${point.modifiedZ}` : ''}` : ''}`}</title>
              </g>
            ))}
          </svg>
        </div>
      );
    }

    const chartRows = plotType === 'pareto'
      ? [...parsed].sort((a, b) => b.value - a.value)
      : parsed;
    const barWidth = Math.max(10, chartWidth / parsed.length * 0.58);
    const slot = chartWidth / chartRows.length;
    const totalValue = chartRows.reduce((sum, row) => sum + row.value, 0) || 1;
    let cumulativeValue = 0;
    const paretoPoints = chartRows.map((row, idx) => {
      cumulativeValue += row.value;
      return {
        x: pad.left + idx * slot + slot / 2,
        y: pad.top + chartHeight - (cumulativeValue / totalValue) * chartHeight,
        pct: (cumulativeValue / totalValue) * 100
      };
    });

    return (
      <div className="anomaly-plot-card anomaly-chart-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="anomaly-svg">
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          {plotType === 'pareto' && (
            <>
              <line x1={width - pad.right} y1={pad.top} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
              {[0, 50, 100].map(pct => (
                <text key={pct} x={width - pad.right + 6} y={pad.top + chartHeight - (pct / 100) * chartHeight + 4} className="chart-label">{pct}%</text>
              ))}
            </>
          )}
          {chartRows.map((row, idx) => {
            const barHeight = (row.value / maxVal) * chartHeight;
            const x = pad.left + idx * slot + (slot - barWidth) / 2;
            const y = pad.top + chartHeight - barHeight;
            return (
              <g key={`${row.label}-${idx}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" className={row.isAnomaly ? 'anomaly-bar warning' : 'anomaly-bar'} />
                {idx % Math.ceil(chartRows.length / 10 || 1) === 0 && (
                  <text x={x + barWidth / 2} y={height - 14} className="chart-label" textAnchor="middle">
                    {row.label.slice(0, 10)}
                  </text>
                )}
                <title>{`${row.label}\nCount: ${row.value}${row.pct !== undefined ? `\nPct: ${row.pct}%` : ''}${row.isAnomaly ? `\n${row.direction || 'anomaly'} anomaly${row.modifiedZ !== undefined ? `\nModified Z: ${row.modifiedZ}` : ''}` : ''}`}</title>
              </g>
            );
          })}
          {plotType === 'pareto' && (
            <>
              <polyline points={paretoPoints.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="var(--accent-green)" strokeWidth="2.4" strokeDasharray="5 4" />
              {paretoPoints.map((point, idx) => (
                <g key={`pareto-${idx}`}>
                  <circle cx={point.x} cy={point.y} r="3.5" className="pareto-dot" />
                  <title>{`Cumulative: ${point.pct.toFixed(1)}%`}</title>
                </g>
              ))}
            </>
          )}
        </svg>
        {plotType === 'pareto' && (
          <div className="anomaly-legend">
            <span><i className="legend-dot critical"></i>Rare values</span>
            <span><i className="legend-line green"></i>Cumulative share</span>
          </div>
        )}
      </div>
    );
  };

  const getKeyValue = (obj, key) => {
    if (!obj || !key) return '';
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? obj[foundKey] : '';
  };

  const formatVolumeTimestamp = (value, granularity = 'day') => {
    if (!value) return '-';
    const text = String(value).replace('T', ' ').replace('.000', '');
    if (granularity === 'hour') return text.slice(0, 16);
    if (granularity === 'month') return text.slice(0, 7);
    return text.slice(0, 10);
  };

  const getVolumeSeries = (data) => (
    data?.plot_data?.series || []
  ).map((row, idx) => ({
    label: formatVolumeTimestamp(getKeyValue(row, 'ACTIVITY_BUCKET') || getKeyValue(row, 'ACTIVITY_DATE'), data?.summary?.granularity),
    rawLabel: String(getKeyValue(row, 'ACTIVITY_BUCKET') || getKeyValue(row, 'ACTIVITY_DATE') || `Bucket ${idx + 1}`),
    value: Number(getKeyValue(row, 'ROW_COUNT') || 0),
    isAnomaly: Boolean(getKeyValue(row, 'IS_ANOMALY')),
    direction: getKeyValue(row, 'DIRECTION') || '',
    modifiedZ: getKeyValue(row, 'MODIFIED_Z')
  })).filter(row => Number.isFinite(row.value));

  const renderVolumeThroughputChart = (data, chartType = 'bar') => {
    const rows = getVolumeSeries(data);
    if (!rows.length) return <div className="empty-state">No bucketed volume data available for this selection.</div>;
    const width = 1040;
    const height = 340;
    const pad = { left: 62, right: 26, top: 26, bottom: 58 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const maxVal = Math.max(...rows.map(row => row.value), 1) * 1.12;
    const points = rows.map((row, idx) => ({
      ...row,
      x: pad.left + (rows.length === 1 ? chartWidth / 2 : (idx / (rows.length - 1)) * chartWidth),
      y: pad.top + chartHeight - (row.value / maxVal) * chartHeight
    }));
    const barSlot = chartWidth / rows.length;
    const barWidth = Math.max(4, Math.min(32, barSlot * 0.64));
    const areaPath = `M ${points[0].x} ${height - pad.bottom} ${points.map(point => `L ${point.x} ${point.y}`).join(' ')} L ${points[points.length - 1].x} ${height - pad.bottom} Z`;
    const linePath = points.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const showBars = chartType === 'bar';
    const showLine = chartType === 'line' || chartType === 'area';
    const showArea = chartType === 'area';
    const showScatter = chartType === 'scatter';

    return (
      <div className="volume-chart-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="volume-chart-svg">
          <defs>
            <linearGradient id="volumeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.32" />
            </linearGradient>
            <linearGradient id="volumeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = pad.top + chartHeight - tick * chartHeight;
            return (
              <g key={tick}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <text x={pad.left - 12} y={y + 4} textAnchor="end" className="chart-label">{Math.round(maxVal * tick)}</text>
              </g>
            );
          })}
          {showArea && <path d={areaPath} fill="url(#volumeAreaGrad)" />}
          {showLine && <path d={linePath} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" />}
          {showBars && points.map((point, idx) => {
            const barHeight = height - pad.bottom - point.y;
            const x = pad.left + idx * barSlot + (barSlot - barWidth) / 2;
            return (
              <g key={`${point.rawLabel}-${idx}`}>
                <rect x={x} y={point.y} width={barWidth} height={barHeight} rx="4" className={point.isAnomaly ? 'volume-bar anomaly' : 'volume-bar'} />
                <title>{`${point.label}\nCount: ${point.value}${point.isAnomaly ? `\n${point.direction} anomaly\nModified Z: ${point.modifiedZ}` : ''}`}</title>
              </g>
            );
          })}
          {(showLine || showScatter) && points.map((point, idx) => (
            <g key={`${point.rawLabel}-${idx}`}>
              <circle cx={point.x} cy={point.y} r={point.isAnomaly ? 5 : showScatter ? 4 : 3} className={point.isAnomaly ? 'anomaly-dot critical' : 'anomaly-dot'} />
              <title>{`${point.label}\nCount: ${point.value}${point.isAnomaly ? `\n${point.direction} anomaly\nModified Z: ${point.modifiedZ}` : ''}`}</title>
            </g>
          ))}
          {points.map((point, idx) => (
            idx % Math.ceil(points.length / 8 || 1) === 0
              ? <text key={`label-${point.rawLabel}-${idx}`} x={point.x} y={height - 18} className="chart-label" textAnchor="middle">{point.label}</text>
              : null
          ))}
          <text x={pad.left} y={height - 4} className="chart-label">{data?.summary?.granularity || 'bucket'}</text>
        </svg>
      </div>
    );
  };

  const renderVolumeHeatmap = (data) => {
    const rows = data?.plot_data?.heatmap || [];
    if (!rows.length) return <div className="empty-state">No hour-of-day heatmap data returned for this selection.</div>;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayLookup = {
      MON: 'Mon', MONDAY: 'Mon', '1': 'Mon',
      TUE: 'Tue', TUESDAY: 'Tue', '2': 'Tue',
      WED: 'Wed', WEDNESDAY: 'Wed', '3': 'Wed',
      THU: 'Thu', THURSDAY: 'Thu', '4': 'Thu',
      FRI: 'Fri', FRIDAY: 'Fri', '5': 'Fri',
      SAT: 'Sat', SATURDAY: 'Sat', '6': 'Sat',
      SUN: 'Sun', SUNDAY: 'Sun', '0': 'Sun', '7': 'Sun'
    };
    const hours = Array.from({ length: 24 }, (_, idx) => `${String(idx).padStart(2, '0')}:00`);
    const values = new Map();
    rows.forEach(row => {
      const dayValue = String(getKeyValue(row, 'DAY_NAME') || getKeyValue(row, 'DAY_SORT') || '').toUpperCase();
      const day = dayLookup[dayValue] || dayLookup[String(getKeyValue(row, 'DAY_SORT'))] || String(dayValue).slice(0, 3);
      const hour = String(getKeyValue(row, 'HOUR_BUCKET') || '').slice(0, 5);
      values.set(`${day}-${hour}`, Number(getKeyValue(row, 'ROW_COUNT') || 0));
    });
    const maxVal = Math.max(...Array.from(values.values()), 1);
    return (
      <div className="volume-heatmap-card">
        <div className="volume-heatmap-header">
          <span></span>
          {days.map(day => <strong key={day}>{day}</strong>)}
        </div>
        <div className="volume-heatmap-grid">
          {hours.map(hour => (
            <div key={hour} className="volume-heatmap-row">
              <span>{hour}</span>
              {days.map(day => {
                const value = values.get(`${day}-${hour}`) || 0;
                const intensity = value / maxVal;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="volume-heat-cell"
                    style={{ '--heat': intensity }}
                    title={`${day} ${hour}\nCount: ${value}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getVolumeHeatmapRows = (data) => {
    const rows = data?.plot_data?.heatmap || [];
    const dayLookup = {
      MON: 'Mon', MONDAY: 'Mon', '1': 'Mon',
      TUE: 'Tue', TUESDAY: 'Tue', '2': 'Tue',
      WED: 'Wed', WEDNESDAY: 'Wed', '3': 'Wed',
      THU: 'Thu', THURSDAY: 'Thu', '4': 'Thu',
      FRI: 'Fri', FRIDAY: 'Fri', '5': 'Fri',
      SAT: 'Sat', SATURDAY: 'Sat', '6': 'Sat',
      SUN: 'Sun', SUNDAY: 'Sun', '0': 'Sun', '7': 'Sun'
    };
    return rows.map(row => {
      const dayValue = String(getKeyValue(row, 'DAY_NAME') || getKeyValue(row, 'DAY_SORT') || '').toUpperCase();
      return {
        day: dayLookup[dayValue] || dayLookup[String(getKeyValue(row, 'DAY_SORT'))] || String(dayValue).slice(0, 3),
        hour: String(getKeyValue(row, 'HOUR_BUCKET') || '').slice(0, 5),
        value: Number(getKeyValue(row, 'ROW_COUNT') || 0)
      };
    }).filter(row => row.day && row.hour && Number.isFinite(row.value));
  };

  const renderVolumeHeatmapBarChart = (data, groupBy = 'day') => {
    const sourceRows = getVolumeHeatmapRows(data);
    if (!sourceRows.length) return <div className="empty-state">No peak-pattern data available for this view.</div>;
    const order = groupBy === 'hour'
      ? Array.from({ length: 24 }, (_, idx) => `${String(idx).padStart(2, '0')}:00`)
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const bucketKey = groupBy === 'hour' ? 'hour' : 'day';
    const totals = order.map(label => ({
      label,
      value: sourceRows.filter(row => row[bucketKey] === label).reduce((sum, row) => sum + row.value, 0)
    }));
    const width = 920;
    const height = 300;
    const pad = { left: 58, right: 24, top: 24, bottom: 52 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const maxVal = Math.max(...totals.map(row => row.value), 1) * 1.12;
    const slot = chartWidth / totals.length;
    const barWidth = Math.max(14, slot * 0.56);
    return (
      <div className="volume-chart-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="volume-mini-chart-svg">
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          {totals.map((row, idx) => {
            const barHeight = (row.value / maxVal) * chartHeight;
            const x = pad.left + idx * slot + (slot - barWidth) / 2;
            const y = pad.top + chartHeight - barHeight;
            return (
              <g key={row.label}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="5" className="volume-bar" />
                <text x={x + barWidth / 2} y={height - 18} className="chart-label" textAnchor="middle">{row.label}</text>
                <title>{`${row.label}\nCount: ${row.value}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderVolumeBubbleChart = (data) => {
    const sourceRows = getVolumeHeatmapRows(data);
    if (!sourceRows.length) return <div className="empty-state">No peak-pattern data available for bubble view.</div>;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, idx) => `${String(idx).padStart(2, '0')}:00`);
    const width = 980;
    const height = 410;
    const pad = { left: 64, right: 26, top: 24, bottom: 46 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const maxVal = Math.max(...sourceRows.map(row => row.value), 1);
    const xForDay = (day) => pad.left + (days.indexOf(day) / Math.max(days.length - 1, 1)) * chartWidth;
    const yForHour = (hour) => pad.top + (hours.indexOf(hour) / Math.max(hours.length - 1, 1)) * chartHeight;
    return (
      <div className="volume-chart-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="volume-bubble-svg">
          {days.map(day => (
            <text key={day} x={xForDay(day)} y={height - 18} className="chart-label" textAnchor="middle">{day}</text>
          ))}
          {hours.filter((_, idx) => idx % 3 === 0).map(hour => (
            <g key={hour}>
              <line x1={pad.left} y1={yForHour(hour)} x2={width - pad.right} y2={yForHour(hour)} className="chart-grid-line" />
              <text x={pad.left - 12} y={yForHour(hour) + 4} className="chart-label" textAnchor="end">{hour}</text>
            </g>
          ))}
          {sourceRows.map((row, idx) => {
            const radius = 4 + (row.value / maxVal) * 20;
            return (
              <g key={`${row.day}-${row.hour}-${idx}`}>
                <circle cx={xForDay(row.day)} cy={yForHour(row.hour)} r={radius} className="volume-bubble" />
                <title>{`${row.day} ${row.hour}\nCount: ${row.value}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderVolumePeakPatternChart = (data, chartType) => {
    if (chartType === 'dayBar') return renderVolumeHeatmapBarChart(data, 'day');
    if (chartType === 'hourBar') return renderVolumeHeatmapBarChart(data, 'hour');
    if (chartType === 'bubble') return renderVolumeBubbleChart(data);
    return renderVolumeHeatmap(data);
  };

  const normalizeProfilerVolumeRows = (rows = [], mode = 'daily') => {
    return rows.map((row, idx) => {
      const label = mode === 'daily'
        ? String(getKeyValue(row, 'ACTIVITY_DATE') || getKeyValue(row, 'activity_date') || '')
        : String(getKeyValue(row, 'PERIOD') || getKeyValue(row, 'period') || '');
      return {
        label: label || `Bucket ${idx + 1}`,
        value: Number(getKeyValue(row, 'ROW_COUNT') || getKeyValue(row, 'row_count') || 0)
      };
    }).filter(row => Number.isFinite(row.value));
  };

  const renderProfilerVolumeChart = (rows = [], mode = 'daily') => {
    const parsed = normalizeProfilerVolumeRows(rows, mode);
    if (!parsed.length) return <div className="empty-state">No volume data available for this bucket.</div>;

    const chartRows = mode === 'daily'
      ? [...parsed].sort((a, b) => String(a.label).localeCompare(String(b.label))).slice(-90)
      : parsed;
    const isTrend = mode === 'daily' || mode === 'monthly';
    const width = 900;
    const height = 310;
    const pad = { left: 64, right: 28, top: 28, bottom: 58 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const maxVal = Math.max(...chartRows.map(row => row.value), 1) * 1.16;

    if (isTrend) {
      const points = chartRows.map((row, idx) => ({
        x: pad.left + (chartRows.length === 1 ? chartWidth / 2 : (idx / (chartRows.length - 1)) * chartWidth),
        y: pad.top + chartHeight - (row.value / maxVal) * chartHeight,
        ...row
      }));
      const areaPath = `M ${points[0].x} ${height - pad.bottom} ${points.map(point => `L ${point.x} ${point.y}`).join(' ')} L ${points[points.length - 1].x} ${height - pad.bottom} Z`;
      const linePath = `M ${points.map(point => `${point.x} ${point.y}`).join(' L ')}`;

      return (
        <div className="cost-chart-card profiler-volume-chart">
          <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
            <defs>
              <linearGradient id="profilerVolumeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#0095ff" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = pad.top + chartHeight * (1 - ratio);
              return (
                <g key={ratio}>
                  <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                  <text x={pad.left - 10} y={y + 4} className="chart-label" textAnchor="end">{Math.round(maxVal * ratio)}</text>
                </g>
              );
            })}
            <path d={areaPath} fill="url(#profilerVolumeAreaGrad)" />
            <path d={linePath} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" />
            {points.map((point, idx) => (
              <g key={`${point.label}-${idx}`}>
                <circle cx={point.x} cy={point.y} r="4.5" className="cost-point" />
                {idx % Math.ceil(points.length / 9 || 1) === 0 && (
                  <text x={point.x} y={height - 26} className="chart-label" textAnchor="middle">{point.label.slice(0, 10)}</text>
                )}
                <title>{`${point.label}\nRows: ${point.value}`}</title>
              </g>
            ))}
            <text x={width / 2} y={height - 8} className="chart-label" textAnchor="middle">{mode === 'daily' ? 'Activity date' : 'Month'}</text>
            <text x={18} y={height / 2} className="chart-label" textAnchor="middle" transform={`rotate(-90 18 ${height / 2})`}>Rows</text>
            <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
          </svg>
        </div>
      );
    }

    const slot = chartWidth / chartRows.length;
    const barWidth = Math.max(16, Math.min(58, slot * 0.56));
    return (
      <div className="cost-chart-card profiler-volume-chart">
        <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
          <defs>
            <linearGradient id="profilerVolumeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#0095ff" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <text x={pad.left - 10} y={y + 4} className="chart-label" textAnchor="end">{Math.round(maxVal * ratio)}</text>
              </g>
            );
          })}
          {chartRows.map((row, idx) => {
            const barHeight = (row.value / maxVal) * chartHeight;
            const x = pad.left + idx * slot + (slot - barWidth) / 2;
            const y = pad.top + chartHeight - barHeight;
            return (
              <g key={`${row.label}-${idx}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="5" fill="url(#profilerVolumeBarGrad)" />
                <text x={x + barWidth / 2} y={height - 30} className="chart-label" textAnchor="middle">{row.label.slice(0, 9)}</text>
                <title>{`${row.label}\nRows: ${row.value}`}</title>
              </g>
            );
          })}
          <text x={width / 2} y={height - 8} className="chart-label" textAnchor="middle">{mode === 'weekday' ? 'Day of week' : 'Hour'}</text>
          <text x={18} y={height / 2} className="chart-label" textAnchor="middle" transform={`rotate(-90 18 ${height / 2})`}>Rows</text>
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
        </svg>
      </div>
    );
  };

  const normalizeFreshnessTrendRows = (rows = []) => rows.map((row, idx) => ({
    label: formatVolumeTimestamp(getKeyValue(row, 'ACTIVITY_BUCKET') || getKeyValue(row, 'activity_bucket'), appScopes.freshness.expectedFrequency === 'hourly' ? 'hour' : appScopes.freshness.expectedFrequency === 'monthly' ? 'month' : 'day') || `Bucket ${idx + 1}`,
    value: Number(getKeyValue(row, 'ROW_COUNT') || getKeyValue(row, 'row_count') || 0)
  })).filter(row => Number.isFinite(row.value));

  const renderFreshnessTrendChart = (rows = []) => {
    const parsed = normalizeFreshnessTrendRows(rows).slice(-60);
    if (!parsed.length) return <div className="empty-state">No freshness trend buckets were returned for this date field.</div>;
    const width = 940;
    const height = 300;
    const pad = { left: 64, right: 28, top: 28, bottom: 58 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const maxVal = Math.max(...parsed.map(row => row.value), 1) * 1.15;
    const slot = chartWidth / parsed.length;
    const barWidth = Math.max(5, Math.min(34, slot * 0.62));
    const points = parsed.map((row, idx) => ({
      ...row,
      x: pad.left + idx * slot + slot / 2,
      y: pad.top + chartHeight - (row.value / maxVal) * chartHeight
    }));
    const linePath = points.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

    return (
      <div className="cost-chart-card freshness-trend-chart">
        <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
          <defs>
            <linearGradient id="freshnessBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#00bcd4" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <text x={pad.left - 10} y={y + 4} className="chart-label" textAnchor="end">{Math.round(maxVal * ratio)}</text>
              </g>
            );
          })}
          {points.map((point, idx) => {
            const barHeight = (point.value / maxVal) * chartHeight;
            const x = point.x - barWidth / 2;
            const y = pad.top + chartHeight - barHeight;
            return (
              <g key={`${point.label}-${idx}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="5" fill="url(#freshnessBarGrad)" opacity="0.76" />
                {idx % Math.ceil(points.length / 10 || 1) === 0 && (
                  <text x={point.x} y={height - 28} className="chart-label" textAnchor="middle">{point.label.slice(0, 10)}</text>
                )}
                <title>{`${point.label}\nRows: ${point.value.toLocaleString()}`}</title>
              </g>
            );
          })}
          <path d={linePath} fill="none" stroke="var(--accent-green)" strokeWidth="2.5" />
          {points.map((point, idx) => <circle key={`dot-${idx}`} cx={point.x} cy={point.y} r="3.5" className="cost-point" />)}
          <text x={width / 2} y={height - 8} className="chart-label" textAnchor="middle">Load bucket</text>
          <text x={18} y={height / 2} className="chart-label" textAnchor="middle" transform={`rotate(-90 18 ${height / 2})`}>Rows</text>
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
        </svg>
      </div>
    );
  };

  const formatCredits = (value) => `${Number(value || 0).toFixed(2)} cr`;
  const formatUsd = (value) => `$${Number(value || 0).toFixed(2)}`;

  const renderCostTrendChart = (rows = []) => {
    if (!rows.length) return <div className="empty-state">No metering trend available.</div>;
    const width = 900;
    const height = 300;
    const pad = { left: 58, right: 28, top: 24, bottom: 46 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const maxVal = Math.max(...rows.map(row => Number(row.credits) || 0), 1) * 1.18;
    const stepX = chartWidth / Math.max(rows.length - 1, 1);
    const points = rows.map((row, idx) => ({
      x: pad.left + idx * stepX,
      y: pad.top + chartHeight - ((Number(row.credits) || 0) / maxVal) * chartHeight,
      row
    }));
    const areaPath = `M ${points[0].x} ${height - pad.bottom} ${points.map(point => `L ${point.x} ${point.y}`).join(' ')} L ${points[points.length - 1].x} ${height - pad.bottom} Z`;
    const linePath = `M ${points.map(point => `${point.x} ${point.y}`).join(' L ')}`;

    return (
      <div className="cost-chart-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
          <defs>
            <linearGradient id="costAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0095ff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <text x={pad.left - 10} y={y + 4} className="chart-label" textAnchor="end">{Math.round(maxVal * ratio)}</text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#costAreaGrad)" />
          <path d={linePath} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" />
          {points.map((point, idx) => (
            <g key={point.row.date}>
              <circle cx={point.x} cy={point.y} r="5" className="cost-point" />
              <title>{`${point.row.date}\nCredits: ${point.row.credits}\nQueries: ${point.row.queries}\nCost: ${formatUsd(point.row.cost_usd)}`}</title>
              {idx % Math.ceil(points.length / 8 || 1) === 0 && <text x={point.x} y={height - 18} className="chart-label" textAnchor="middle">{String(point.row.date).slice(5)}</text>}
            </g>
          ))}
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
        </svg>
      </div>
    );
  };

  const renderCostBarChart = (rows = [], labelKey, valueKey, titleKey = labelKey) => {
    if (!rows.length) return <div className="empty-state">No breakdown data available.</div>;
    const width = 900;
    const height = 300;
    const pad = { left: 58, right: 28, top: 22, bottom: 58 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const maxVal = Math.max(...rows.map(row => Number(row[valueKey]) || 0), 1) * 1.16;
    const slot = chartWidth / rows.length;
    const barWidth = Math.max(18, slot * 0.52);

    return (
      <div className="cost-chart-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
          <defs>
            <linearGradient id="costBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#0095ff" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <text x={pad.left - 10} y={y + 4} className="chart-label" textAnchor="end">{Math.round(maxVal * ratio)}</text>
              </g>
            );
          })}
          {rows.map((row, idx) => {
            const value = Number(row[valueKey]) || 0;
            const barHeight = (value / maxVal) * chartHeight;
            const x = pad.left + idx * slot + (slot - barWidth) / 2;
            const y = pad.top + chartHeight - barHeight;
            const label = String(row[labelKey] || '');
            return (
              <g key={`${label}-${idx}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="5" className="cost-bar" />
                <text x={x + barWidth / 2} y={y - 8} className="chart-label" textAnchor="middle">{value.toFixed(value < 10 ? 2 : 0)}</text>
                <text x={x + barWidth / 2} y={height - 30} className="chart-label" textAnchor="middle">{label.slice(0, 14)}</text>
                <title>{`${row[titleKey] || label}\nCredits: ${value}\nQueries: ${row.queries ?? 'n/a'}${row.share_pct !== undefined ? `\nShare: ${row.share_pct}%` : ''}`}</title>
              </g>
            );
          })}
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
        </svg>
      </div>
    );
  };

  const renderCostScatterChart = (rows = []) => {
    const sourceRows = rows.filter(row => Number(row.credits) > 0 || Number(row.elapsed_seconds) > 0);
    if (!sourceRows.length) return <div className="empty-state">No query runtime data available.</div>;
    const width = 900;
    const height = 300;
    const pad = { left: 62, right: 28, top: 24, bottom: 48 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const maxElapsed = Math.max(...sourceRows.map(row => Number(row.elapsed_seconds) || 0), 1) * 1.12;
    const maxCredits = Math.max(...sourceRows.map(row => Number(row.credits) || 0), 1) * 1.12;
    const scaleX = (value) => pad.left + (value / maxElapsed) * chartWidth;
    const scaleY = (value) => pad.top + chartHeight - (value / maxCredits) * chartHeight;

    return (
      <div className="cost-chart-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad.top + chartHeight * (1 - ratio);
            const x = pad.left + chartWidth * ratio;
            return (
              <g key={ratio}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <line x1={x} y1={pad.top} x2={x} y2={height - pad.bottom} className="chart-grid-line" />
              </g>
            );
          })}
          {sourceRows.map((row, idx) => {
            const credits = Number(row.credits) || 0;
            const elapsed = Number(row.elapsed_seconds) || 0;
            return (
              <g key={`${row.query_id}-${idx}`}>
                <circle cx={scaleX(elapsed)} cy={scaleY(credits)} r={Math.max(4, Math.min(12, credits * 1.4))} className={row.status === 'FAILED' ? 'cost-bubble warning' : 'cost-bubble'} />
                <title>{`${row.query_id}\n${row.user} on ${row.warehouse}\nElapsed: ${elapsed}s\nCredits: ${credits}`}</title>
              </g>
            );
          })}
          <text x={width / 2} y={height - 12} className="chart-label" textAnchor="middle">Elapsed seconds</text>
          <text x={18} y={height / 2} className="chart-label" textAnchor="middle" transform={`rotate(-90 18 ${height / 2})`}>Credits</text>
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
        </svg>
      </div>
    );
  };

  const renderReportBarChart = (rows = [], xField, yField) => {
    const sourceRows = rows.slice(0, 40);
    if (!sourceRows.length) return <div className="empty-state">No chart data available.</div>;
    const width = 900;
    const height = 310;
    const pad = { left: 64, right: 28, top: 28, bottom: 62 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const values = sourceRows.map(row => Number(getKeyValue(row, yField)) || 0);
    const maxVal = Math.max(...values, 1) * 1.16;
    const slot = chartWidth / sourceRows.length;
    const barWidth = Math.max(12, Math.min(44, slot * 0.56));

    return (
      <div className="cost-chart-card report-dashboard-chart">
        <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
          <defs>
            <linearGradient id="reportBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#0095ff" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <text x={pad.left - 10} y={y + 4} className="chart-label" textAnchor="end">{Math.round(maxVal * ratio)}</text>
              </g>
            );
          })}
          {sourceRows.map((row, idx) => {
            const value = Number(getKeyValue(row, yField)) || 0;
            const label = String(getKeyValue(row, xField) || `Row ${idx + 1}`);
            const barHeight = (value / maxVal) * chartHeight;
            const x = pad.left + idx * slot + (slot - barWidth) / 2;
            const y = pad.top + chartHeight - barHeight;
            return (
              <g key={`${label}-${idx}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="5" fill="url(#reportBarGrad)" />
                {idx % Math.ceil(sourceRows.length / 10 || 1) === 0 && (
                  <text x={x + barWidth / 2} y={height - 30} className="chart-label" textAnchor="middle">{label.slice(0, 12)}</text>
                )}
                <title>{`${label}\n${yField}: ${value}`}</title>
              </g>
            );
          })}
          <text x={width / 2} y={height - 10} className="chart-label" textAnchor="middle">{xField}</text>
          <text x={18} y={height / 2} className="chart-label" textAnchor="middle" transform={`rotate(-90 18 ${height / 2})`}>{yField}</text>
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
        </svg>
      </div>
    );
  };

  const renderReportMultiSeriesLineChart = (rows = [], xField, yField, seriesField) => {
    const sourceRows = rows.slice(0, 220);
    if (!sourceRows.length) return <div className="empty-state">No chart data available.</div>;
    const width = 900;
    const height = 330;
    const pad = { left: 64, right: 34, top: 28, bottom: 70 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const xValues = Array.from(new Set(sourceRows.map(row => String(getKeyValue(row, xField) || 'Unknown')))).sort();
    const seriesValues = Array.from(new Set(sourceRows.map(row => String(getKeyValue(row, seriesField) || 'Unknown')))).slice(0, 6);
    const colors = ['#00f2fe', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#60a5fa'];
    const lookup = new Map();
    sourceRows.forEach(row => {
      const x = String(getKeyValue(row, xField) || 'Unknown');
      const series = String(getKeyValue(row, seriesField) || 'Unknown');
      lookup.set(`${series}__${x}`, Number(getKeyValue(row, yField)) || 0);
    });
    const maxVal = Math.max(
      ...seriesValues.flatMap(series => xValues.map(x => lookup.get(`${series}__${x}`) || 0)),
      1
    ) * 1.16;
    const xStep = chartWidth / Math.max(xValues.length - 1, 1);
    const xFor = (idx) => pad.left + idx * xStep;
    const yFor = (value) => pad.top + chartHeight - (value / maxVal) * chartHeight;

    return (
      <div className="cost-chart-card report-dashboard-chart">
        <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <text x={pad.left - 10} y={y + 4} className="chart-label" textAnchor="end">{Math.round(maxVal * ratio)}</text>
              </g>
            );
          })}
          {seriesValues.map((series, seriesIdx) => {
            const points = xValues.map((xValue, idx) => {
              const value = lookup.get(`${series}__${xValue}`) || 0;
              return { x: xFor(idx), y: yFor(value), value, label: xValue };
            });
            const linePath = `M ${points.map(point => `${point.x} ${point.y}`).join(' L ')}`;
            return (
              <g key={series}>
                <path d={linePath} fill="none" stroke={colors[seriesIdx % colors.length]} strokeWidth="3" />
                {points.map((point, idx) => (
                  idx % Math.ceil(points.length / 18 || 1) === 0 ? (
                    <circle key={`${series}-${point.label}`} cx={point.x} cy={point.y} r="3.8" fill={colors[seriesIdx % colors.length]}>
                      <title>{`${series}\n${point.label}\n${yField}: ${point.value}`}</title>
                    </circle>
                  ) : null
                ))}
              </g>
            );
          })}
          {xValues.map((label, idx) => (
            idx % Math.ceil(xValues.length / 9 || 1) === 0 ? (
              <text key={label} x={xFor(idx)} y={height - 36} className="chart-label" textAnchor="middle">{label.slice(0, 10)}</text>
            ) : null
          ))}
          <text x={width / 2} y={height - 12} className="chart-label" textAnchor="middle">{xField}</text>
          <text x={18} y={height / 2} className="chart-label" textAnchor="middle" transform={`rotate(-90 18 ${height / 2})`}>{yField}</text>
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
          <g transform={`translate(${pad.left}, ${height - 24})`}>
            {seriesValues.map((series, idx) => (
              <g key={series} transform={`translate(${idx * 145}, 0)`}>
                <circle cx="0" cy="-4" r="4" fill={colors[idx % colors.length]} />
                <text x="10" y="0" className="chart-label">{series.slice(0, 18)}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    );
  };

  const renderReportLineChart = (rows = [], xField, yField) => {
    const sourceRows = rows.slice(0, 80);
    if (!sourceRows.length) return <div className="empty-state">No chart data available.</div>;
    const width = 900;
    const height = 310;
    const pad = { left: 64, right: 28, top: 28, bottom: 58 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const values = sourceRows.map(row => Number(getKeyValue(row, yField)) || 0);
    const maxVal = Math.max(...values, 1) * 1.16;
    const stepX = chartWidth / Math.max(sourceRows.length - 1, 1);
    const points = sourceRows.map((row, idx) => {
      const value = Number(getKeyValue(row, yField)) || 0;
      const label = String(getKeyValue(row, xField) || `Row ${idx + 1}`);
      return {
        x: pad.left + idx * stepX,
        y: pad.top + chartHeight - (value / maxVal) * chartHeight,
        value,
        label
      };
    });
    const areaPath = `M ${points[0].x} ${height - pad.bottom} ${points.map(point => `L ${point.x} ${point.y}`).join(' ')} L ${points[points.length - 1].x} ${height - pad.bottom} Z`;
    const linePath = `M ${points.map(point => `${point.x} ${point.y}`).join(' L ')}`;

    return (
      <div className="cost-chart-card report-dashboard-chart">
        <svg viewBox={`0 0 ${width} ${height}`} className="cost-chart-svg">
          <defs>
            <linearGradient id="reportLineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#0095ff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="chart-grid-line" />
                <text x={pad.left - 10} y={y + 4} className="chart-label" textAnchor="end">{Math.round(maxVal * ratio)}</text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#reportLineAreaGrad)" />
          <path d={linePath} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" />
          {points.map((point, idx) => (
            <g key={`${point.label}-${idx}`}>
              <circle cx={point.x} cy={point.y} r="4.5" className="cost-point" />
              <title>{`${point.label}\n${yField}: ${point.value}`}</title>
              {idx % Math.ceil(points.length / 9 || 1) === 0 && (
                <text x={point.x} y={height - 26} className="chart-label" textAnchor="middle">{point.label.slice(0, 10)}</text>
              )}
            </g>
          ))}
          <text x={width / 2} y={height - 8} className="chart-label" textAnchor="middle">{xField}</text>
          <text x={18} y={height / 2} className="chart-label" textAnchor="middle" transform={`rotate(-90 18 ${height / 2})`}>{yField}</text>
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="chart-axis-line" />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="chart-axis-line" />
        </svg>
      </div>
    );
  };

  // SVG Chart Render Helper: Bar Chart
  const renderSvgBarChart = (data, xField, yField) => {
    if (!data || data.length === 0) return <div className="text-secondary text-xs">No chart data</div>;
    const width = 380;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 25;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const parsedValues = data.map(d => parseFloat(getKeyValue(d, yField)) || 0);
    const maxVal = Math.max(...parsedValues) * 1.15 || 1;
    const barWidth = (chartWidth / data.length) * 0.6;
    const gap = (chartWidth / data.length) * 0.4;
    
    return (
      <svg width={width} height={height} className="chart-svg">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#0095ff" />
          </linearGradient>
        </defs>
        
        {/* Draw Y Grid Lines and Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
              <text x={paddingLeft - 8} y={y + 3} className="chart-label" textAnchor="end">{val}</text>
            </g>
          );
        })}
        
        {/* Draw Bars */}
        {data.map((item, idx) => {
          const val = parseFloat(getKeyValue(item, yField)) || 0;
          const label = String(getKeyValue(item, xField));
          const barHeight = (val / maxVal) * chartHeight;
          const x = paddingLeft + idx * (barWidth + gap) + gap / 2;
          const y = paddingTop + chartHeight - barHeight;
          
          return (
            <g key={idx}>
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                rx={4} 
                className="chart-bar"
              >
                <title>{`${label}: ${val}`}</title>
              </rect>
              <text 
                x={x + barWidth / 2} 
                y={height - 8} 
                className="chart-label" 
                textAnchor="middle"
              >
                {label.substring(0, 7)}
              </text>
            </g>
          );
        })}
        
        {/* Axes */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} className="chart-axis-line" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} className="chart-axis-line" />
      </svg>
    );
  };

  // SVG Chart Render Helper: Line Chart
  const renderSvgLineChart = (data, xField, yField) => {
    if (!data || data.length === 0) return <div className="text-secondary text-xs">No chart data</div>;
    const width = 380;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const parsedValues = data.map(d => parseFloat(getKeyValue(d, yField)) || 0);
    const maxVal = Math.max(...parsedValues) * 1.15 || 1;
    const stepX = chartWidth / (data.length - 1 || 1);
    
    const points = data.map((item, idx) => {
      const val = parseFloat(getKeyValue(item, yField)) || 0;
      const label = String(getKeyValue(item, xField));
      const x = paddingLeft + idx * stepX;
      const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, val, label };
    });
    
    const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = points.length > 0 
      ? `M ${points[0].x} ${height - paddingBottom} ` + points.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${points[points.length-1].x} ${height - paddingBottom} Z`
      : '';
      
    return (
      <svg width={width} height={height} className="chart-svg">
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0095ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a155fe" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineStrokeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="50%" stopColor="#0095ff" />
            <stop offset="100%" stopColor="#a155fe" />
          </linearGradient>
        </defs>
        
        {/* Draw Y Grid Lines and Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
              <text x={paddingLeft - 8} y={y + 3} className="chart-label" textAnchor="end">{val}</text>
            </g>
          );
        })}
        
        {/* Draw Filled Area */}
        {areaPath && <path d={areaPath} fill="url(#lineAreaGrad)" />}
        
        {/* Draw Polyline */}
        {polylinePath && <path d={`M ` + polylinePath} fill="none" stroke="url(#lineStrokeGrad)" strokeWidth={2.5} />}
        
        {/* Draw dots & text */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={4} fill="#ffffff" stroke="#0095ff" strokeWidth={2} />
            {idx % 2 === 0 && (
              <text 
                x={p.x} 
                y={height - 8} 
                className="chart-label" 
                textAnchor="middle"
              >
                {p.label.split('-').slice(1).join('-') || p.label.substring(0, 5)}
              </text>
            )}
          </g>
        ))}
        
        {/* Axes */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} className="chart-axis-line" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} className="chart-axis-line" />
      </svg>
    );
  };

  const hideDemoDirectorControls = demoDirectorEnabled && guidedDemoOpen && guidedDemoAutoPlay;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-glow">
            <Sparkles size={18} color="#ffffff" />
          </div>
          <span className="sidebar-logo-text">DATA PILOT</span>
        </div>
        
        <nav className="sidebar-menu">
          <div
            className={`sidebar-item ${activeTab === 'agentCommand' ? 'active' : ''}`}
            data-demo-tab="agentCommand"
            onClick={() => setActiveTab('agentCommand')}
            title="Agentic: plans, calls tools, observes results, gates approval, and produces an audit trail."
          >
            <Sparkles size={16} />
            <span>Agent Command Center</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
            data-demo-tab="chat"
            onClick={() => setActiveTab('chat')}
            title="Hybrid: Native SQL execution plus optional LLM for native language, Compare, and repair."
          >
            <MessageSquare size={16} />
            <span>AI Analyst Studio</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'sql' ? 'active' : ''}`}
            data-demo-tab="sql"
            onClick={() => setActiveTab('sql')}
            title="Hybrid: Native cost advisor plus optional LLM explanation and optimization."
          >
            <Terminal size={16} />
            <span>SQL Explainer / Tuning</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'tableDetails' ? 'active' : ''}`}
            data-demo-tab="tableDetails"
            onClick={() => setActiveTab('tableDetails')}
            title="Hybrid: Native metadata/profiling plus optional LLM summaries and descriptions."
          >
            <Database size={16} />
            <span>Table Intelligence Studio</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'catalogSearch' ? 'active' : ''}`}
            data-demo-tab="catalogSearch"
            onClick={() => setActiveTab('catalogSearch')}
            title="Native: Python and Snowflake metadata search only."
          >
            <Layers size={16} />
            <span>Column / Table Search</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'anomaly' ? 'active' : ''}`}
            data-demo-tab="anomaly"
            onClick={() => setActiveTab('anomaly')}
            title="Native: statistical anomaly rules and Snowflake SQL only."
          >
            <AlertTriangle size={16} />
            <span>Anomaly Detector</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'freshness' ? 'active' : ''}`}
            data-demo-tab="freshness"
            onClick={() => setActiveTab('freshness')}
            title="Native: freshness calculations and trend checks only."
          >
            <RefreshCw size={16} />
            <span>Data Freshness</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'cost' ? 'active' : ''}`}
            data-demo-tab="cost"
            onClick={() => { setActiveTab('cost'); fetchCostDashboard(); }}
            title="Native: Snowflake cost metadata and query history analysis only."
          >
            <DollarSign size={16} />
            <span>Cost Analyzer</span>
          </div>

          <div
            className={`sidebar-item ${activeTab === 'incidentCommand' ? 'active' : ''}`}
            data-demo-tab="incidentCommand"
            onClick={() => { setActiveTab('incidentCommand'); fetchIncidentCommandDashboard(); }}
            title="Hybrid: enterprise incident KPIs, NL query, and Native-vs-AI comparison."
          >
            <Activity size={16} />
            <span>Incident Command Center</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'rag' ? 'active' : ''}`}
            data-demo-tab="rag"
            onClick={() => { setActiveTab('rag'); fetchRagDocuments(); }}
            title="Hybrid: Native ingestion/retrieval plus optional LLM answer synthesis."
          >
            <HelpCircle size={16} />
            <span>Document Hub</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'queryLog' ? 'active' : ''}`}
            data-demo-tab="queryLog"
            onClick={() => { setActiveTab('queryLog'); loadWorkbenchQueryLog(); }}
            title="Native: persisted local query log only."
          >
            <Terminal size={16} />
            <span>Query Log</span>
          </div>

          <div
            className={`sidebar-item ${activeTab === 'executionFootprint' ? 'active' : ''}`}
            data-demo-tab="executionFootprint"
            onClick={() => { setActiveTab('executionFootprint'); refreshAiUsage(); }}
          >
            <Activity size={16} />
            <span>Execution Footprint</span>
          </div>

          <div className="sidebar-ai-config">
            <button type="button" className="sidebar-section-toggle" onClick={() => setAiConfigOpen(prev => !prev)}>
              <span>AI CONFIGURATION</span>
              <span>{aiConfigOpen ? 'Hide' : 'Show'}</span>
            </button>
            {aiConfigOpen && (
              <div className="sidebar-section-content">
                <div className="ai-mode-pill">
                  <span className={`ai-status-dot ${isAiConnected ? 'connected' : isAiConfigured ? 'configured' : 'native'}`}></span>
                  {aiConfig.processing_mode === 'compare'
                    ? (isAiConnected ? 'Compare Ready' : 'Compare Needs AI Test')
                    : isAiConnected ? 'AI Ready' : isAiConfigured ? 'AI Configured' : 'Native Mode'}
                </div>
                <label className="sidebar-field">
                  <span>Execution Mode</span>
                  <select
                    value={aiConfig.processing_mode || 'native'}
                    onChange={(e) => {
                      const mode = e.target.value;
                      saveAiConfig({ processing_mode: mode, enabled: mode !== 'native' });
                    }}
                  >
                    <option value="native">Native</option>
                    <option value="ai">AI</option>
                    <option value="compare">Compare</option>
                  </select>
                </label>
                <div className={`ai-provider-fields ${aiNeedsConfig ? '' : 'disabled'}`}>
                <label className="sidebar-field">
                  <span>AI Provider</span>
                  <select
                    value={aiConfig.provider || 'openai'}
                    disabled={!aiNeedsConfig}
                    onChange={(e) => {
                      const provider = e.target.value;
                      const models = aiConfig.providers?.find(item => item.id === provider)?.models || [];
                      saveAiConfig({ provider, model: models[0] || '' });
                    }}
                  >
                    {(aiConfig.providers || []).map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.label}</option>
                    ))}
                  </select>
                </label>
                <label className="sidebar-field">
                  <span>Model</span>
                  <select value={aiConfig.model || ''} disabled={!aiNeedsConfig} onChange={(e) => saveAiConfig({ model: e.target.value })}>
                    {((aiConfig.providers || []).find(item => item.id === aiConfig.provider)?.models || [aiConfig.model || '']).map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </label>
                <label className="sidebar-field">
                  <span>API Key {aiConfig.has_api_key ? '(set)' : ''}</span>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    onBlur={() => aiApiKey.trim() && saveAiConfig({ api_key: aiApiKey.trim() })}
                    placeholder={aiConfig.has_api_key ? 'Stored in session' : 'Paste provider API key'}
                    disabled={!aiNeedsConfig}
                  />
                </label>
                <label className="sidebar-field">
                  <span>Base URL (Optional)</span>
                  <input
                    value={aiConfig.base_url || ''}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, base_url: e.target.value }))}
                    onBlur={() => saveAiConfig({ base_url: aiConfig.base_url || '' })}
                    placeholder="Optional except Azure/custom endpoints"
                    disabled={!aiNeedsConfig}
                  />
                </label>
                </div>
                <div className={`ai-connection-note ${aiConfig.connection_status?.status || ''}`}>
                  {aiConfig.connection_status?.message || 'Not tested'}
                </div>
                <div className="ai-config-actions">
                  <button className="btn btn-secondary btn-small" onClick={testAiConnection} disabled={!aiNeedsConfig || aiTesting || aiSaving}>
                    {aiTesting ? 'Testing...' : 'Test'}
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={clearAiConversation}>
                    Clear Chat
                  </button>
                </div>
                <div className="ai-usage-mini">
                  <div><span>Provider</span><strong>{aiConfig.usage?.active_provider || aiConfig.provider}</strong></div>
                  <div><span>Prompts</span><strong>{aiConfig.usage?.prompt_count || 0}</strong></div>
                  <div><span>Tokens</span><strong>{aiConfig.usage?.total_tokens || 0}</strong></div>
                  <div><span>Cost</span><strong>${Number(aiConfig.usage?.estimated_cost || 0).toFixed(4)}</strong></div>
                  <div><span>Avg Time</span><strong>{aiConfig.usage?.avg_response_time_ms || 0} ms</strong></div>
                  <div><span>Last OK</span><strong>{aiConfig.usage?.last_successful_connection || '-'}</strong></div>
                </div>
              </div>
            )}
          </div>

          {(connectionStatus.mode === 'MOCK' || connectionStatus.mode.startsWith('SNOWFLAKE')) && (
            <div className="sidebar-session-context">
              <button type="button" className="sidebar-section-toggle" onClick={() => setSnowflakeContextOpen(prev => !prev)}>
                <span>SNOWFLAKE / SESSION</span>
                <span>{snowflakeContextOpen ? 'Hide' : 'Show'}</span>
              </button>
              {snowflakeContextOpen && (
                <div className="sidebar-section-content">
                  <div className="ai-mode-pill">
                    <span className={`ai-status-dot ${connectionStatus.status === 'connected' ? 'connected' : 'native'}`}></span>
                    {connectionStatus.mode.replace('_FALLBACK', ' Fallback')}
                  </div>
                  <SearchableSelect
                    value={activeRole}
                    onChange={handleRoleChange}
                    options={roles}
                    placeholder="Select Role"
                    label="ROLE"
                    className="sidebar-select"
                  />

                  <SearchableSelect
                    value={activeWarehouse}
                    onChange={handleWarehouseChange}
                    options={warehouses}
                    placeholder="Select Warehouse"
                    label="WH"
                    className="sidebar-select"
                  />
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div>ENVIRONMENT STATUS</div>
          <div className="status-badge-container" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span className={`status-badge ${connectionStatus.mode === 'MOCK' || connectionStatus.mode.endsWith('_FALLBACK') ? 'mock' : ''}`}>
              <Server size={10} style={{ marginRight: '3px' }} />
              {connectionStatus.mode.replace('_FALLBACK', ' (FALLBACK)')} MODE
            </span>
            <span className="status-badge" style={{ backgroundColor: 'rgba(0,149,255,0.1)', color: '#0095ff' }}>
              <Wifi size={10} style={{ marginRight: '3px' }} />
              ONLINE
            </span>
          </div>
          <button 
            className="btn btn-secondary btn-small configure-connection-button" 
            style={{ width: '100%', marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'center' }}
            onClick={() => setConnectionModalOpen(true)}
          >
            <Settings size={12} />
            <span>Configure Connection</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Container */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-top-row">
            <div className="header-title-section">
              <h1>
                {activeTab === 'agentCommand' && 'DataOps Agent Command Center'}
                {activeTab === 'chat' && 'AI Analyst Studio'}
                {activeTab === 'sql' && 'SQL Explainer & Performance Tuning'}
                {activeTab === 'tableDetails' && 'Table Intelligence Studio'}
                {activeTab === 'catalogSearch' && 'Column / Table Search'}
                {activeTab === 'anomaly' && 'Anomaly Detector'}
                {activeTab === 'freshness' && 'Data Freshness'}
                {activeTab === 'rag' && 'Document Hub'}
                {activeTab === 'queryLog' && 'Query Log'}
                {activeTab === 'cost' && 'Snowflake Query Cost Analyzer'}
                {activeTab === 'incidentCommand' && 'Incident Command Center'}
                {activeTab === 'executionFootprint' && 'Execution Footprint'}
              </h1>
              <p>
                {activeTab === 'agentCommand' && 'Run a visible agentic workflow: goal, plan, tool execution, observations, approval gate, and audit-ready final report.'}
                {activeTab === 'chat' && 'Chat with data and build report views from native language.'}
                {activeTab === 'sql' && 'Explain, identify inefficiencies, and auto-tune queries.'}
                {activeTab === 'tableDetails' && 'Inspect, profile, and generate analyst-style insights for one selected table.'}
                {activeTab === 'catalogSearch' && 'Find tables and columns by name, type, and table context.'}
                {activeTab === 'anomaly' && 'Scan numeric, date, and text columns for unusual values.'}
                {activeTab === 'freshness' && 'Check table recency by selected database, schema, and table scope.'}
                {activeTab === 'rag' && 'Learn web pages, pasted text, JSON, CSV, Excel, and other files, then answer questions with cited source chunks.'}
                {activeTab === 'queryLog' && 'Review persisted SQL executed from chat and workbench applications.'}
                {activeTab === 'cost' && 'Track credit consumption, metering trends, and expensive runs.'}
                {activeTab === 'incidentCommand' && 'Executive incident dashboard, natural-language triage, and Native-vs-AI comparison for enterprise operations.'}
                {activeTab === 'executionFootprint' && 'See which applications use LLM tokens versus native Python/Snowflake logic.'}
              </p>
            </div>

            <div className="header-actions">
              {currentExecutionApp && (
                <div className={`current-app-mode ${currentExecutionApp.mode.toLowerCase()}`} title={currentExecutionApp.note}>
                  {currentExecutionApp.mode}
                </div>
              )}
              {demoDirectorEnabled && !hideDemoDirectorControls && (
                <button
                  className={`guided-demo-launch ${guidedDemoOpen ? 'active' : ''}`}
                  type="button"
                  onClick={startGuidedDemo}
                  title="Open the recording-ready Demo Director."
                >
                  <Play size={12} />
                  Demo Director
                </button>
              )}
              <div className="processing-mode-badge">
                <Sparkles size={12} />
                {aiConfig.processing_mode === 'compare'
                  ? `${isAiConnected ? 'Compare Ready' : 'Compare Pending Test'}: Native + ${aiConfig.provider_label || aiConfig.provider} / ${aiConfig.model}`
                  : aiConfig.enabled && aiConfig.processing_mode === 'ai'
                    ? `${isAiConnected ? 'AI Ready' : 'AI Pending Test'}: ${aiConfig.provider_label || aiConfig.provider} / ${aiConfig.model}`
                    : 'Native Python Mode'}
              </div>
              <button
                className={`tips-toggle ${helpTipsOpen ? 'active' : ''}`}
                onClick={() => setHelpTipsOpen(prev => !prev)}
                type="button"
              >
                <HelpCircle size={14} />
                Tips
              </button>
              <div className="connection-pill" onClick={() => setConnectionModalOpen(true)}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: connectionStatus.status === 'connected' 
                    ? (connectionStatus.mode.endsWith('_FALLBACK') ? 'var(--accent-orange)' : 'var(--accent-green)') 
                    : connectionStatus.status === 'connecting'
                      ? 'var(--accent-cyan)'
                      : 'var(--accent-orange)' 
                }}></div>
                <span style={{ fontWeight: 600 }}>
                  {connectionStatus.status === 'connected' 
                    ? (connectionStatus.mode === 'MOCK' 
                        ? 'Mock DB Connected' 
                        : connectionStatus.mode.endsWith('_FALLBACK')
                          ? `${connectionStatus.mode.replace('_FALLBACK', '')} (Fallback)`
                          : `${connectionStatus.mode} Connected`)
                    : connectionStatus.status === 'connecting'
                      ? 'Checking Connection'
                      : 'Connection Pending'}
                </span>
              </div>
            </div>
          </div>
          
          {(activeTab === 'chat' || activeTab === 'sql') && (
          <div className="scoping-selectors">
            <SearchableSelect 
              value={activeDb}
              onChange={handleDbChange}
              options={databases}
              placeholder="Select Database"
              label="DB"
            />
            
            <SearchableSelect 
              value={activeSchema}
              onChange={handleSchemaChange}
              options={schemas}
              placeholder="Select Schema"
              label="SCHEMA"
            />

            <SearchableSelect 
              value={activeType}
              onChange={handleTypeChange}
              options={['ALL', 'TABLE', 'VIEW']}
              placeholder="ALL"
              label="TYPE"
            />

            <SearchableSelect 
              value={activeTable}
              onChange={handleTableChange}
              options={tables}
              placeholder="ALL TABLES/VIEWS"
              label={activeType === 'ALL' ? 'TABLE/VIEW' : activeType}
            />
          </div>
          )}
          {helpTipsOpen && (
            <div className="contextual-tips-panel">
              <div className="contextual-tips-title">
                <HelpCircle size={14} />
                {contextualTips.title}
              </div>
              <div className="contextual-tips-list">
                {contextualTips.tips.map((tip, idx) => (
                  <span key={idx}>{tip}</span>
                ))}
              </div>
            </div>
          )}
        </header>

        {demoDirectorEnabled && guidedDemoOpen && demoDirectorPanelMinimized && !hideDemoDirectorControls && (
          <button
            className="demo-director-hidden-control"
            type="button"
            onClick={() => setDemoDirectorPanelMinimized(false)}
          >
            Show Director
          </button>
        )}

        {demoDirectorEnabled && guidedDemoOpen && guidedDemoStep && !demoDirectorPanelMinimized && !hideDemoDirectorControls && (
          <div className="guided-demo-panel">
            <div className="guided-demo-header">
              <div>
                <span className="guided-demo-kicker">Demo Director</span>
                <h3>{guidedDemoStep.title}</h3>
              </div>
              <div className="guided-demo-header-actions">
                <button className="guided-demo-close" type="button" onClick={() => setDemoDirectorPanelMinimized(true)}>_</button>
                <button
                  className="guided-demo-close"
                  type="button"
                  onClick={() => {
                    setGuidedDemoOpen(false);
                    setGuidedDemoAutoPlay(false);
                    setGuidedDemoRunActions(false);
                    setDemoDirectorHighlight(null);
                    setDemoDirectorResultCard(null);
                  }}
                >
                  x
                </button>
              </div>
            </div>
            <div className="guided-demo-progress">
              <span>{getGuidedDemoStepWindow(guidedDemoStepIndex)}</span>
              <strong>{guidedDemoStepIndex + 1} / {guidedDemoSteps.length}</strong>
            </div>
            <div className="guided-demo-autoplay">
              <button
                className="btn btn-primary btn-small guided-demo-fullrun"
                type="button"
                onClick={startFullGuidedDemo}
              >
                <Sparkles size={12} /> Run Full Demo
              </button>
              <button
                className={`btn btn-small ${guidedDemoAutoPlay ? 'btn-secondary' : 'btn-primary'}`}
                type="button"
                onClick={toggleGuidedDemoAutoPlay}
              >
                <Play size={12} /> {guidedDemoAutoPlay ? 'Pause' : 'Navigate Only'}
              </button>
              <div className="guided-demo-auto-duration">
                <span>Auto pacing</span>
                <strong>{guidedDemoCurrentSeconds}s</strong>
              </div>
              <span className={`guided-demo-countdown ${guidedDemoAutoPlay ? 'running' : ''}`}>
                {guidedDemoAutoPlay ? `Next in ${guidedDemoRemaining}s` : 'Manual'}
              </span>
            </div>
            <div className={`guided-demo-run-status ${guidedDemoRunActions ? 'running' : ''}`}>
              <span>{guidedDemoRunActions ? 'Auto-executing demo actions' : 'Presenter controls execution'}</span>
              <strong>{guidedDemoActionStatus || (guidedDemoRunActions ? 'Preparing full demo...' : 'Navigation mode')}</strong>
            </div>
            <div className="guided-demo-timer-bar" aria-hidden="true">
              <span style={{ width: `${Math.max(0, Math.min(100, ((guidedDemoCurrentSeconds - guidedDemoRemaining) / guidedDemoCurrentSeconds) * 100))}%` }} />
            </div>
            <div className="guided-demo-track" aria-hidden="true">
              {guidedDemoSteps.map((step, idx) => (
                <button
                  key={step.title}
                  type="button"
                  className={idx === guidedDemoStepIndex ? 'active' : idx < guidedDemoStepIndex ? 'done' : ''}
                  onClick={() => jumpGuidedDemo(idx)}
                  title={step.title}
                />
              ))}
            </div>
            <div className="guided-demo-body">
              <div>
                <span>Screen</span>
                <p>{guidedDemoStep.screen}</p>
              </div>
              <div>
                <span>Action</span>
                <p>{guidedDemoStep.action}</p>
              </div>
              {guidedDemoStep.prompt && (
                <div>
                  <span>Sample Prompt / SQL</span>
                  <pre>{guidedDemoStep.prompt}</pre>
                </div>
              )}
              <div>
                <span>Voice-over</span>
                <p>{guidedDemoStep.narration}</p>
              </div>
              <div>
                <span>Why It Matters</span>
                <p>{guidedDemoStep.value}</p>
              </div>
            </div>
            <div className="guided-demo-actions">
              <button className="btn btn-secondary btn-small" type="button" onClick={() => moveGuidedDemo(-1)} disabled={guidedDemoStepIndex === 0}>Back</button>
              {guidedDemoStep.prompt && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => handleCopy(guidedDemoStep.prompt)}>
                  {copiedQuery === guidedDemoStep.prompt ? <Check size={12} /> : <Copy size={12} />} Copy Prompt
                </button>
              )}
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setDemoDirectorPanelMinimized(true)}>Hide Panel</button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => applyGuidedDemoStep(guidedDemoStepIndex)}>Open Step</button>
              <button className="btn btn-primary btn-small" type="button" onClick={() => moveGuidedDemo(1)} disabled={guidedDemoStepIndex === guidedDemoSteps.length - 1}>Next</button>
            </div>
          </div>
        )}

        {demoDirectorEnabled && guidedDemoOpen && demoDirectorHighlight && (
          <div
            className="demo-director-highlight"
            style={{
              left: `${demoDirectorHighlight.left}px`,
              top: `${demoDirectorHighlight.top}px`,
              width: `${demoDirectorHighlight.width}px`,
              height: `${demoDirectorHighlight.height}px`
            }}
            aria-hidden="true"
          />
        )}

        {demoDirectorEnabled && guidedDemoOpen && (
          <div
            className="demo-director-pointer"
            style={{ left: `${demoDirectorPointer.x}px`, top: `${demoDirectorPointer.y}px` }}
            aria-hidden="true"
          >
            {demoDirectorPointer.label && <span>{demoDirectorPointer.label}</span>}
          </div>
        )}

        {demoDirectorEnabled && guidedDemoOpen && demoDirectorResultCard && (
          <div className={`demo-director-result-card ${demoDirectorResultCard.phase || ''}`}>
            <h4>{demoDirectorResultCard.title}</h4>
            {demoDirectorResultCard.value && <p>{demoDirectorResultCard.value}</p>}
            <ul>
              {(demoDirectorResultCard.bullets || []).map((bullet, idx) => <li key={idx}>{bullet}</li>)}
            </ul>
          </div>
        )}

        {/* Tab Rendering Switch */}
        <div className={`tab-content ${activeTab === 'chat' ? 'chat-tab-content' : ''}`}>
          {activeTab === 'agentCommand' && (
            <div className="panel-body agent-command-page">
              <div className="agent-hero glass-card">
                <div>
                  <span className="compare-pipeline-kicker">Autonomous DataOps Copilot</span>
                  <h2>Goal-driven agent workflow over Snowflake, RAG, quality, cost, and governance tools.</h2>
                  <p>This command center makes the agent loop explicit: understand the goal, plan steps, call tools, observe evidence, request approval, and produce an audit trail.</p>
                </div>
                <div className="agent-loop-strip">
                  {['Goal', 'Plan', 'Tools', 'Observe', 'Approve', 'Report'].map(item => <span key={item}>{item}</span>)}
                </div>
              </div>

              <div className="agent-layout">
                <div className="glass-card agent-goal-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Sparkles size={16} /> Agent Goal</span>
                    <span className={`status-badge ${agentRunning ? 'running' : agentFinalReport?.status === 'complete' ? 'fresh' : ''}`}>
                      {agentRunning ? 'Running' : agentFinalReport?.status === 'complete' ? 'Complete' : 'Ready'}
                    </span>
                  </div>
                  <textarea
                    className="agent-goal-input"
                    value={agentGoal}
                    onChange={(e) => setAgentGoal(e.target.value)}
                    placeholder="Example: Investigate why customer revenue dropped yesterday and prepare a fix plan."
                    disabled={agentRunning}
                  />
                  <div className="agent-action-row">
                    <button className="btn btn-primary" onClick={runAgentCommandCenter} disabled={agentRunning || !agentGoal.trim()}>
                      <Play size={14} /> {agentRunning ? 'Agent Running...' : 'Run DataOps Agent'}
                    </button>
                    <button className="btn btn-secondary" onClick={resetAgentCommandCenter} disabled={agentRunning}>Reset</button>
                  </div>
                  <div className="agent-persona-card">
                    <strong>Agent Persona: Enterprise Data Pilot Agent</strong>
                    <p>Acts like a senior DataOps analyst: metadata-grounded, cost-aware, cautious with SQL, evidence-seeking, and approval-first for risky changes.</p>
                  </div>
                </div>

                <div className="glass-card agent-toolbox-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><ShieldCheck size={16} /> Toolset Available</span>
                    <span className="status-badge">Tool-using agent</span>
                  </div>
                  <div className="agent-tool-grid">
                    {[
                      ['Metadata', 'Resolve DB/schema/table/columns'],
                      ['Snowflake SQL', 'Execute limited validation queries'],
                      ['Freshness', 'Check recency and volume shift'],
                      ['Anomaly', 'Scan numeric/date/text risk'],
                      ['RAG', 'Retrieve runbook/document evidence'],
                      ['Cost Advisor', 'Estimate scan and optimization risk'],
                      ['Incident Tools', 'Load KPIs, trends, root causes'],
                      ['Governance', 'Query log, tokens, approval trail']
                    ].map(([label, text]) => (
                      <div key={label}>
                        <strong>{label}</strong>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-card agent-timeline-card">
                <div className="glass-card-header">
                  <span className="glass-card-title"><Activity size={16} /> Tool Execution Timeline</span>
                  <span className="status-badge">{agentTimeline.filter(step => step.status === 'complete').length}/{agentTimeline.length} complete</span>
                </div>
                <div className="agent-timeline">
                  {agentTimeline.map((step, idx) => (
                    <div key={step.id} className={`agent-step ${step.status}`}>
                      <div className="agent-step-index">{idx + 1}</div>
                      <div className="agent-step-body">
                        <div className="agent-step-header">
                          <div>
                            <span>{step.tool}</span>
                            <strong>{step.title}</strong>
                          </div>
                          <em>{step.status}</em>
                        </div>
                        {step.action && <p className="agent-step-action">{step.action}</p>}
                        <p>{step.observation || 'Waiting for prior step.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {agentApprovalRequired && agentFinalReport && (
                <div className={`glass-card agent-approval-card ${agentApprovalGranted ? 'approved' : ''}`}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><ShieldAlert size={16} /> Human Approval Gate</span>
                    <span className="status-badge">{agentApprovalGranted ? 'Approved' : 'Waiting Approval'}</span>
                  </div>
                  <p>The agent prepared a safe validation query before any remediation action. This demonstrates human-in-the-loop control: the agent can recommend action, but potentially risky execution requires approval.</p>
                  <div className="agent-sql-review">
                    <div className="code-header">
                      <span>Approved dry-run validation SQL</span>
                      {renderSqlActionButtons(agentFinalReport.remediationSql, 'Agent Remediation Validation', { inline: true })}
                    </div>
                    <pre className="code-block">{agentFinalReport.remediationSql}</pre>
                  </div>
                  <button className="btn btn-primary" onClick={approveAgentRemediation} disabled={agentRunning || agentApprovalGranted}>
                    <Play size={14} /> Approve and Run Validation
                  </button>
                </div>
              )}

              {agentFinalReport && (
                <div className="glass-card agent-report-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Terminal size={16} /> Final Agent Report</span>
                    <span className="status-badge">{agentFinalReport.status === 'complete' ? 'Audit Ready' : 'Draft'}</span>
                  </div>
                  <div className="agent-report-grid">
                    <div>
                      <span>Root-Cause Hypothesis</span>
                      <p>{agentFinalReport.rootCause}</p>
                    </div>
                    <div>
                      <span>Recommended Fix Plan</span>
                      <p>{agentFinalReport.recommendation}</p>
                    </div>
                  </div>
                  <div className="agent-evidence-list">
                    <span>Evidence Used</span>
                    {(agentFinalReport.evidence || []).map((item, idx) => <div key={idx}>{item}</div>)}
                  </div>
                  {agentFinalReport.validationRows?.length > 0 && (
                    <div className="table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>{Object.keys(agentFinalReport.validationRows[0]).map(key => <th key={key}>{key}</th>)}</tr>
                        </thead>
                        <tbody>
                          {agentFinalReport.validationRows.slice(0, 10).map((row, idx) => (
                            <tr key={idx}>{Object.keys(agentFinalReport.validationRows[0]).map(key => <td key={key}>{String(row[key] ?? '')}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="agent-audit-list">
                    <span>Audit Trail</span>
                    {(agentFinalReport.auditTrail || []).map(item => (
                      <div key={item.tool}>
                        <strong>{item.tool}</strong>
                        <p>{item.captured ? item.preview : 'No evidence captured.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: AI Analyst Studio */}
          {activeTab === 'chat' && (
            <div className={`analyst-studio-shell ${analystStudioTab === 'chat' ? 'chat-mode' : 'scroll-mode'}`}>
              <div className="analyst-studio-tabs">
                {renderWorkbenchTabs([
                  { id: 'chat', label: 'Chat' },
                  { id: 'ask', label: 'Ask Dataset' },
                  { id: 'report', label: 'Report Builder' }
                ], analystStudioTab, setAnalystStudioTab)}
              </div>

              {analystStudioTab === 'chat' && (
                <div className="chat-wrapper" style={{ width: '100%' }}>
                  <div className="chat-panel">
                    <div className="chat-messages">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble ${msg.sender}`}>
                      <div className="chat-bubble-sender">{msg.sender === 'user' ? 'User' : 'Pilot Studio AI'}</div>
                      <div>{msg.text}</div>
                      
                      {msg.loading && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                          <span className="status-badge" style={{ animation: 'flowLine 1s infinite' }}>Analyzing...</span>
                        </div>
                      )}

                      {msg.samples && msg.samples.length > 0 && activeTable && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>SUGGESTED QUERIES:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {msg.samples.map((sample, sIdx) => (
                              <button 
                                key={sIdx} 
                                className="btn btn-secondary btn-small"
                                onClick={() => handleSendChatMessage(sample)}
                              >
                                {sample}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.sql && (
                        <div className={`code-container ${demoDirectorEnabled ? 'demo-chat-sql-block' : ''}`} style={{ marginTop: '12px', border: '1px solid var(--border-glow)' }}>
                          <div className="code-header">
                            <span>GENERATED {connectionStatus.mode === 'MOCK' ? 'DATABASE' : connectionStatus.mode.replace('_FALLBACK', '')} SQL</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {renderRowLimitSelect()}
                              <button 
                                className="btn btn-secondary btn-small"
                                style={{ padding: '2px 6px', fontSize: '9px' }}
                                onClick={() => handleCopy(msg.sql)}
                              >
                                {copiedQuery === msg.sql ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                              <button 
                                className="btn btn-primary btn-small"
                                style={{ padding: '2px 8px', fontSize: '9px' }}
                                onClick={() => handleExecuteChatSql(msg.sql, idx)}
                              >
                                <Play size={8} /> Execute
                              </button>
                            </div>
                          </div>
                          <div className="code-block">{msg.sql}</div>
                        </div>
                      )}

                      {renderSemanticResolver(msg.semanticResolver)}
                      {renderSqlValidationFirewall(msg.sqlValidation)}
                      {renderExplainabilityTimeline(msg.explainabilityTimeline)}

                      {msg.visualization && msg.visualization.type !== 'none' && (
                        <div className="glass-card" style={{ marginTop: '12px', padding: '14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '10px', textTransform: 'uppercase' }}>
                            Auto-Generated Visual: {msg.visualization.type} chart
                          </div>
                          {renderChatVisualization(msg)}
                        </div>
                      )}
                      {msg.compareResult && (
                        <div style={{ marginTop: '12px' }}>
                          {renderComparisonDashboard(msg.compareResult)}
                        </div>
                      )}
                      {renderAiTransparency(msg.aiMetadata)}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                      <div className="chat-session-toolbar">
                        <span>
                          Context: {activeDb || 'No DB'} / {activeSchema || 'No Schema'}{activeTable ? ` / ${activeTable}` : ''}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={resetChatMessages}
                          disabled={executingChatQuery}
                        >
                          <Trash2 size={12} /> Clear Chat
                        </button>
                      </div>
                      <div className="chat-input-container">
                        <input 
                          type="text" 
                          placeholder="Ask a question in your native language... (e.g. Show customer count by state)" 
                          className="chat-input"
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                        />
                        <button className="chat-send-btn" onClick={() => handleSendChatMessage()}>
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Execution Console Side Panel */}
                  <div className="details-panel">
                    <div className="details-panel-header">
                      <span className="details-panel-title">SQL Query Results Console</span>
                      {executingChatQuery && <RefreshCw size={14} className="status-badge" style={{ animation: 'flowLine 1.5s infinite' }} />}
                    </div>
                    <div className="details-panel-body">
                      {!chatResults && !executingChatQuery && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '10px', textAlign: 'center', padding: '30px' }}>
                          <Terminal size={32} style={{ opacity: 0.4 }} />
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>Console Awaiting Trigger</div>
                          <div style={{ fontSize: '12px' }}>Generate and click "Execute" on a SQL query block in the chat stream to view query execution tabular outputs here.</div>
                        </div>
                      )}

                      {executingChatQuery && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                          <div className="status-badge" style={{ padding: '8px 16px', fontSize: '12px' }}>Executing SQL against {connectionStatus.mode.replace('_FALLBACK', '')} Warehouse...</div>
                        </div>
                      )}

                      {chatResults && (
                        <div className="chat-results-shell">
                          <div className="status-badge chat-results-title">
                            Source: {chatResults.source} | Status: Success | {chatResults.row_count} Rows Returned
                            {chatResults.total_row_count > chatResults.row_count ? ` of ${chatResults.total_row_count}` : ''} | Limit {chatResults.row_limit || sqlRowLimit}
                          </div>
                          
                          {chatResults.success ? (
                            <div className="table-container chat-results-table-scroll">
                              <table className="custom-table">
                                <thead>
                                  <tr>
                                    {chatResults.columns.map((c, idx) => <th key={idx}>{c}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {chatResults.data.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                      {chatResults.columns.map((c, cIdx) => (
                                        <td key={cIdx} title={String(row[c])}>
                                          {String(row[c])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="glass-card" style={{ borderColor: 'var(--accent-red)', backgroundColor: 'rgba(255,82,100,0.05)' }}>
                              <div style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <AlertCircle size={14} /> Execution Error
                              </div>
                              <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--text-secondary)' }}>{chatResults.error}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {analystStudioTab === 'ask' && (
                <div className="panel-body ask-dataset-body">
                  <div className="ask-dataset-layout">
                    <div className="glass-card ask-dataset-control">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><Sparkles size={16} /> Ask This Dataset</span>
                        {renderRowLimitSelect()}
                      </div>
                      <form onSubmit={handleAskDataset} className="report-builder-form">
                        <div className="mini-card">
                          <div className="mini-card-title">Dataset Context</div>
                          <p className="object-path">{activeDb || 'No DB'}.{activeSchema || 'No Schema'}{activeTable ? `.${activeTable}` : '.All Tables/Views'}</p>
                        </div>
                        <textarea
                          className="form-input report-prompt-input"
                          placeholder="Ask a business question. Example: Which region has the highest revenue trend, or what categories changed most month over month?"
                          value={askDatasetQuestion}
                          onChange={(e) => setAskDatasetQuestion(e.target.value)}
                        />
                        <button className="btn btn-primary" type="submit" disabled={askDatasetLoading || !askDatasetQuestion.trim()}>
                          <Sparkles size={14} /> {askDatasetLoading ? 'Asking Dataset...' : 'Ask Dataset'}
                        </button>
                      </form>
                    </div>

                    <div className="ask-dataset-results">
                      {!askDatasetResult && !askDatasetCompareResult && !askDatasetLoading && (
                        <div className="empty-state ask-dataset-empty">
                          Ask a question to generate SQL, run it in Snowflake, and turn the result into a chart, insight summary, and explanation.
                        </div>
                      )}

                      {askDatasetLoading && (
                        <div className="empty-state ask-dataset-empty">
                          {aiConfig.processing_mode === 'compare'
                            ? 'Running Native and AI pipelines side by side...'
                            : 'Generating SQL, executing it, and shaping the answer...'}
                        </div>
                      )}

                      {askDatasetCompareResult && (
                        <div className="glass-card compare-result-card">
                          {renderComparisonDashboard(askDatasetCompareResult)}
                        </div>
                      )}

                      {askDatasetResult?.success && (
                        <>
                          <div className="glass-card ask-insight-hero">
                            <div>
                              <div className="mini-card-title">Insight Summary</div>
                              <h2>{askDatasetTitle}</h2>
                              <p>{buildDatasetInsightSummary(askDatasetResult, askDatasetQuestion)}</p>
                            </div>
                            <span className="status-badge">
                              {askDatasetResult.row_count} rows | Limit {askDatasetResult.row_limit || sqlRowLimit}
                            </span>
                          </div>

                          <div className="glass-card">
                            <div className="glass-card-header">
                              <span className="glass-card-title"><DollarSign size={16} /> Visual Answer</span>
                              <div className="plot-option-row" style={{ margin: 0 }}>
                                {['auto', 'bar', 'line'].map(type => (
                                  <button key={type} className={`chip-btn ${askDatasetChartType === type ? 'active' : ''}`} onClick={() => setAskDatasetChartType(type)}>
                                    {type === 'auto' ? 'Auto' : type}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="report-chart-wrap">{renderAskDatasetChart()}</div>
                          </div>

                          <div className="glass-card">
                            <div className="glass-card-header">
                              <span className="glass-card-title"><Info size={16} /> SQL Explanation</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>{askDatasetExplanation}</p>
                          </div>
                        </>
                      )}

                      {askDatasetSql && (
                        <div className="glass-card">
                          <div className="glass-card-header">
                            <span className="glass-card-title"><Terminal size={16} /> Generated SQL</span>
                            <div className="sql-action-row">
                              {renderRowLimitSelect()}
                              <button className="btn btn-secondary btn-small" onClick={() => handleCopy(askDatasetSql)}>
                                {copiedQuery === askDatasetSql ? <Check size={12} /> : <Copy size={12} />} Copy
                              </button>
                              <button className="btn btn-primary btn-small" onClick={handleRunAskDatasetSql} disabled={askDatasetLoading}>
                                <Play size={12} /> Run SQL
                              </button>
                            </div>
                          </div>
                          <pre className="code-block">{askDatasetSql}</pre>
                        </div>
                      )}

                      {askDatasetResult?.success && (
                        <div className="glass-card">
                          <div className="glass-card-header">
                            <span className="glass-card-title"><Database size={16} /> Result Data</span>
                          </div>
                          <div className="table-container sql-result-table">
                            <table className="custom-table">
                              <thead>
                                <tr>{askDatasetResult.columns?.map((col, idx) => <th key={idx}>{col}</th>)}</tr>
                              </thead>
                              <tbody>
                                {askDatasetResult.data?.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {askDatasetResult.columns?.map((col, cIdx) => (
                                      <td key={cIdx} title={String(row[col] ?? '')}>{String(row[col] ?? '')}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {askDatasetResult && !askDatasetResult.success && (
                        <div className="glass-card" style={{ borderColor: 'var(--accent-red)', backgroundColor: 'rgba(255,82,100,0.05)' }}>
                          <div style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <AlertCircle size={14} /> Ask Dataset Error
                          </div>
                          <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--text-secondary)' }}>{askDatasetResult.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {analystStudioTab === 'report' && (
                <div className="panel-body analyst-report-body">
                  <div className="glass-card report-builder-card">
                    <div className="glass-card-header">
                      <span className="glass-card-title"><Sparkles size={16} /> Natural Language Report Builder</span>
                      {renderRowLimitSelect()}
                    </div>
                    <form onSubmit={handleBuildReport} className="report-builder-form">
                      <textarea
                        className="form-input report-prompt-input"
                        placeholder="Describe the report you want. Example: show monthly revenue trend by region, or top 10 customers by order amount."
                        value={reportPrompt}
                        onChange={(e) => setReportPrompt(e.target.value)}
                      />
                      <div className="report-builder-actions">
                        <div className="status-badge">
                          Context: {activeDb || 'No DB'} / {activeSchema || 'No Schema'} {activeTable ? `/ ${activeTable}` : ''}
                        </div>
                        <button className="btn btn-primary btn-small" type="submit" disabled={reportGenerating || !reportPrompt.trim()}>
                          {reportGenerating ? 'Building...' : 'Build Report'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {reportSql && (
                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><Terminal size={16} /> Generated SQL</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary btn-small" onClick={() => handleCopy(reportSql)}>
                            {copiedQuery === reportSql ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                          <button className="btn btn-secondary btn-small" onClick={handleBuildReport} disabled={reportGenerating}>
                            <Sparkles size={12} /> Regenerate
                          </button>
                          <button className="btn btn-primary btn-small" onClick={handleRunReportSql} disabled={reportGenerating}>
                            <Play size={12} /> Run SQL
                          </button>
                        </div>
                      </div>
                      <pre className="code-block">{reportSql}</pre>
                    </div>
                  )}

                  {reportData?.success && (
                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><DollarSign size={16} /> {reportTitle}</span>
                        <div className="plot-option-row" style={{ margin: 0 }}>
                          {['auto', 'bar', 'line'].map(type => (
                            <button key={type} className={`chip-btn ${reportChartType === type ? 'active' : ''}`} onClick={() => setReportChartType(type)}>
                              {type === 'auto' ? 'Auto' : type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="report-chart-wrap">{renderReportChart()}</div>
                    </div>
                  )}

                  {reportData && !reportData.success && (
                    <div className="glass-card" style={{ borderColor: 'var(--accent-red)', backgroundColor: 'rgba(255,82,100,0.05)' }}>
                      <div style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <AlertCircle size={14} /> Report Builder Error
                      </div>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--text-secondary)' }}>{reportData.error}</div>
                    </div>
                  )}

                  {reportData?.success && (
                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><Database size={16} /> Report Data</span>
                        <span className="status-badge">{reportData.row_count} rows shown | Limit {reportData.row_limit || sqlRowLimit}</span>
                      </div>
                      <div className="table-container report-data-table">
                        <table className="custom-table">
                          <thead>
                            <tr>{reportData.columns?.map((col, idx) => <th key={idx}>{col}</th>)}</tr>
                          </thead>
                          <tbody>
                            {reportData.data?.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {reportData.columns?.map((col, cIdx) => <td key={cIdx}>{String(row[col] ?? '')}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SQL Explainer / Performance Tuning */}
          {activeTab === 'sql' && (
            <div className="panel-body">
              <div className="sql-tuning-layout">
                <div className="sql-input-column">
                  {/* Query Input */}
                  <div className="glass-card sql-input-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="glass-card-header">
                      <span className="glass-card-title"><Terminal size={16} /> SQL Input Console</span>
                      <div className="sql-action-row">
                        <button className="btn btn-primary btn-small" onClick={handleAnalyzeAndOptimizeSql} disabled={(optimizing || analyzingCost) || !sqlQuery.trim()}>
                          <Sparkles size={12} /> {(optimizing || analyzingCost) ? 'Analyzing SQL...' : 'Analyze & Optimize SQL'}
                        </button>
                      </div>
                    </div>
                    <textarea 
                      className="form-input" 
                      style={{ height: '300px', fontFamily: 'var(--font-family-mono)', fontSize: '13px', resize: 'none', lineHeight: '1.5', padding: '14px' }}
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Paste any standard Snowflake SQL query. The AI Engine will review joins, scan scopes, partition pruning options, and compute suggestions.
                    </div>
                  </div>

                  {/* Optimization Report Output */}
                  <div className="glass-card sql-optimizer-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Sparkles size={16} color="var(--accent-cyan)" /> AI Performance Optimization Report</span>
                  </div>
                  
                  {!sqlOptimization && !optimizing && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)', gap: '10px' }}>
                      <AlertCircle size={28} style={{ opacity: 0.3 }} />
                      <div>Awaiting input analysis. Paste a SQL query and click "Optimize"</div>
                    </div>
                  )}

                  {optimizing && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
                      <RefreshCw size={24} className="status-badge" style={{ animation: 'flowLine 1.5s infinite' }} />
                      <div className="text-secondary" style={{ fontSize: '12px' }}>Running index check and compiling query optimizations...</div>
                    </div>
                  )}

                  {sqlOptimization && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '450px', paddingRight: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '4px' }}>BUSINESS EXPLANATION:</div>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sqlOptimization.explanation}</p>
                      </div>
                      {renderAiTransparency(sqlOptimization.ai_metadata)}

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-red)', marginBottom: '6px' }}>INEFFICIENCIES DETECTED:</div>
                        <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(Array.isArray(sqlOptimization.inefficiencies) ? sqlOptimization.inefficiencies : []).map((item, idx) => (
                            <li key={idx} style={{ listStyleType: 'square' }}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '6px' }}>OPTIMIZATION RECOMMENDATIONS:</div>
                        <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(Array.isArray(sqlOptimization.recommendations) ? sqlOptimization.recommendations : []).map((item, idx) => (
                            <li key={idx} style={{ listStyleType: 'disc' }}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="code-container" style={{ margin: 0 }}>
                          <div className="code-header" style={{ color: 'var(--accent-cyan)' }}>
                            <span>OPTIMIZED SQL SUGGESTION</span>
                            {renderSqlActionButtons(sqlOptimization.optimized_sql, 'Optimized SQL Results', { inline: true })}
                          </div>
                          <pre className="code-block">{sqlOptimization.optimized_sql}</pre>
                          {renderSqlInlinePreview(sqlOptimization.optimized_sql, 'Optimized SQL Results')}
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                <div className="sql-analysis-results">
                  {/* Cost Advisor Output */}
                  <div className="glass-card sql-advisor-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><DollarSign size={16} color="var(--accent-green)" /> Cost-Aware Query Advisor</span>
                    {sqlCostAdvisor?.risk_level && <span className={`confidence-badge ${sqlCostAdvisor.risk_level.toLowerCase()}`}>{sqlCostAdvisor.risk_level} Risk</span>}
                  </div>

                  {!sqlCostAdvisor && !analyzingCost && (
                    <div className="empty-state">Analyze cost before execution to estimate scan size, risk, and cheaper alternatives.</div>
                  )}

                  {analyzingCost && (
                    <div className="empty-state">Estimating scan exposure and optimization opportunities...</div>
                  )}

                  {sqlCostAdvisor?.success === false && (
                    <div className="empty-state">{sqlCostAdvisor.error}</div>
                  )}

                  {sqlCostAdvisor?.success && (
                    <div className="sql-advisor-content">
                      <div className="sql-advisor-kpis">
                        <div className="mini-card">
                          <div className="mini-card-title">Estimated Scan</div>
                          <span className="stat-value">{sqlCostAdvisor.estimated_scan_label || `${sqlCostAdvisor.estimated_scan_gb}GB`}</span>
                        </div>
                        <div className="mini-card">
                          <div className="mini-card-title">Estimated Cost</div>
                          <span className="stat-value green">{sqlCostAdvisor.estimated_cost_label || `$${sqlCostAdvisor.estimated_cost_usd}`}</span>
                        </div>
                        <div className="mini-card">
                          <div className="mini-card-title">Potential Reduction</div>
                          <span className="stat-value purple">{sqlCostAdvisor.estimated_reduction_pct}%</span>
                        </div>
                        <div className="mini-card">
                          <div className="mini-card-title">Optimized Cost</div>
                          <span className="stat-value">{sqlCostAdvisor.optimized_cost_label || `$${sqlCostAdvisor.optimized_cost_usd}`}</span>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="mini-card-title">Advisor Summary</div>
                        <p>This query may scan about {sqlCostAdvisor.estimated_scan_label || `${sqlCostAdvisor.estimated_scan_gb}GB`} (~{sqlCostAdvisor.estimated_cost_label || `$${sqlCostAdvisor.estimated_cost_usd}`}). Suggested changes may reduce scan exposure by about {sqlCostAdvisor.estimated_reduction_pct}%, toward {sqlCostAdvisor.optimized_scan_label || `${sqlCostAdvisor.optimized_scan_gb}GB`} (~{sqlCostAdvisor.optimized_cost_label || `$${sqlCostAdvisor.optimized_cost_usd}`}).</p>
                        <p>{sqlCostAdvisor.cache_note}</p>
                      </div>

                      <div className="workbench-grid">
                        <div className="mini-card">
                          <div className="mini-card-title">Findings</div>
                          <ul className="advisor-list">{(Array.isArray(sqlCostAdvisor.findings) ? sqlCostAdvisor.findings : []).map((item, idx) => <li key={idx}>{item}</li>)}</ul>
                        </div>
                        <div className="mini-card">
                          <div className="mini-card-title">Cheaper Alternatives</div>
                          <ul className="advisor-list">{(Array.isArray(sqlCostAdvisor.alternatives) ? sqlCostAdvisor.alternatives : []).map((item, idx) => <li key={idx}>{item}</li>)}</ul>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="mini-card-title">Cost-Aware SQL Suggestion</div>
                        <div className="code-container">
                          <div className="code-header">
                            <span>Suggested safer SQL</span>
                            {renderSqlActionButtons(sqlCostAdvisor.optimized_sql, 'Cost Advisor SQL Results', { inline: true })}
                          </div>
                          <pre className="code-block">{sqlCostAdvisor.optimized_sql}</pre>
                          {renderSqlInlinePreview(sqlCostAdvisor.optimized_sql, 'Cost Advisor SQL Results')}
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="mini-card-title">Assumptions</div>
                        <ul className="advisor-list">{(Array.isArray(sqlCostAdvisor.assumptions) ? sqlCostAdvisor.assumptions : []).map((item, idx) => <li key={idx}>{item}</li>)}</ul>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tableDetails' && (
            <div className="panel-body table-intelligence-page">
              <div className="glass-card table-intelligence-control">
                <div className="glass-card-header">
                  <span className="glass-card-title"><Database size={16} /> Table Intelligence Studio</span>
                </div>
                {renderWorkbenchScope('tableDetails')}
              </div>

              {tableDetailsData ? (
                <div className="glass-card table-intelligence-content">
                  {renderWorkbenchTabs([
                    { id: 'overview', label: 'Overview' },
                    { id: 'details', label: 'Table Details' },
                    { id: 'profiler', label: 'Table Profiler' },
                    { id: 'volumeAnalyzer', label: 'Volume Analyzer' },
                    { id: 'insights', label: 'Insight Generator' },
                    { id: 'ddl', label: 'Generated DDL' },
                    { id: 'queries', label: 'Quick Queries' }
                  ], tableDetailsTab, setTableDetailsTab)}

                  {tableDetailsTab === 'overview' && (
                    <div className="table-intelligence-overview">
                      <div className="mini-card table-intelligence-object-card">
                        <div className="mini-card-title">Selected Object</div>
                        <p className="object-path">{appScopes.tableDetails.database}.{appScopes.tableDetails.schema}.{appScopes.tableDetails.table}</p>
                      </div>
                      <div className="mini-card table-intelligence-kpi-card">
                        <div className="mini-card-title">Columns</div>
                        <span className="stat-value">{tableDetailsData.columns?.length || profilerData?.summary?.columns || 0}</span>
                        <button className="btn btn-secondary btn-small" onClick={() => setTableDetailsTab('details')}>Open Details</button>
                      </div>
                      <div className="mini-card table-intelligence-kpi-card">
                        <div className="mini-card-title">Profiled Rows</div>
                        <span className={`stat-value ${profilerData ? '' : 'pending'}`}>{profilerData?.summary?.total_rows ?? 'Not Run'}</span>
                        <button className="btn btn-secondary btn-small" onClick={() => setTableDetailsTab('profiler')}>Open Profiler</button>
                      </div>
                      <div className="mini-card table-intelligence-kpi-card">
                        <div className="mini-card-title">High Null Columns</div>
                        <span className="stat-value red">{profilerData?.summary?.high_null_columns ?? '-'}</span>
                      </div>
                      <div className="mini-card table-intelligence-kpi-card">
                        <div className="mini-card-title">Empty Columns</div>
                        <span className="stat-value purple">{profilerData?.summary?.empty_columns ?? '-'}</span>
                      </div>
                      <div className="mini-card table-intelligence-status-card">
                        <div className="mini-card-title">Insight Status</div>
                        <p>{tableInsightsData ? `${tableInsightsData.insights?.length || 0} insights are ready with ${tableInsightsData.recommended_sql?.length || 0} follow-up SQL snippets.` : 'Open Insight Generator when you want trends, KPI signals, anomaly candidates, correlations, and likely PII.'}</p>
                        <button className="btn btn-secondary btn-small" onClick={() => setTableDetailsTab('insights')}>Open Insights</button>
                      </div>
                    </div>
                  )}

                  {tableDetailsTab === 'details' && (
                    <div className="table-intelligence-sections">
                      <div className="tab-action-bar">
                        <div>
                          <div className="mini-card-title">Table Details</div>
                          <p>Refresh metadata, sample rows, AI descriptions, DDL, and quick SQL for the selected table.</p>
                        </div>
                        <button className="btn btn-primary btn-small" onClick={runTableDetails} disabled={workbenchLoading.tableDetails}>
                          {workbenchLoading.tableDetails ? 'Loading...' : 'Load Details'}
                        </button>
                      </div>
                      <div className="mini-card">
                        <div className="mini-card-title">Column Metadata</div>
                        <div className="table-container">
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Column</th>
                                <th>Type</th>
                                <th>Nullable</th>
                                <th>Max Length</th>
                                <th>Precision</th>
                                <th>Comment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableDetailsData.columns?.map((col, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 700 }}>{col.COLUMN_NAME}</td>
                                  <td>{col.DATA_TYPE}</td>
                                  <td>{col.IS_NULLABLE}</td>
                                  <td>{col.CHARACTER_MAXIMUM_LENGTH || '-'}</td>
                                  <td>{col.NUMERIC_PRECISION || '-'}</td>
                                  <td style={{ whiteSpace: 'normal' }}>{col.COMMENT || col.DESCRIPTION || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="mini-card-title">Sample Rows</div>
                        <div className="table-container">
                          {tableDetailsData.sample_rows?.length > 0 ? (
                            <table className="custom-table">
                              <thead>
                                <tr>{Object.keys(tableDetailsData.sample_rows[0]).map(col => <th key={col}>{col}</th>)}</tr>
                              </thead>
                              <tbody>
                                {tableDetailsData.sample_rows.slice(0, 10).map((row, idx) => (
                                  <tr key={idx}>{Object.keys(row).map(col => <td key={col}>{String(row[col] ?? '')}</td>)}</tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="empty-state">No sample rows returned.</div>
                          )}
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="mini-card-title">AI Descriptions</div>
                        <div className="workbench-grid">
                          {tableDetailsData.ai_descriptions?.map((item, idx) => (
                            <div key={idx} className="mini-card">
                              <div className="mini-card-title">{item.column_name}</div>
                              <span className="status-badge">{item.label}</span>
                              <p>{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {tableDetailsTab === 'profiler' && (
                    profilerData ? (
                      <div className="table-intelligence-sections">
                        <div className="tab-action-bar">
                          <div>
                            <div className="mini-card-title">Table Profiler</div>
                            <p>Run profiling when you need row counts, null rates, DQ checks, labels, and volume plots.</p>
                          </div>
                          <button className="btn btn-primary btn-small" onClick={runProfiler} disabled={workbenchLoading.profiler}>
                            <ShieldCheck size={13} /> {workbenchLoading.profiler ? 'Profiling...' : 'Run Profile'}
                          </button>
                        </div>
                        <div className="stat-grid">
                          <div className="glass-card stat-card"><span className="stat-label">Total Rows</span><span className="stat-value">{profilerData.summary?.total_rows}</span></div>
                          <div className="glass-card stat-card"><span className="stat-label">Columns</span><span className="stat-value">{profilerData.summary?.columns}</span></div>
                          <div className="glass-card stat-card"><span className="stat-label">High Null Columns</span><span className="stat-value red">{profilerData.summary?.high_null_columns}</span></div>
                          <div className="glass-card stat-card"><span className="stat-label">Empty Columns</span><span className="stat-value purple">{profilerData.summary?.empty_columns}</span></div>
                        </div>

                        <div className="mini-card">
                          <div className="mini-card-title">Column Statistics</div>
                          <div className="table-container">
                            <table className="custom-table">
                              <thead><tr><th>Column</th><th>Type</th><th>Null %</th><th>Distinct</th><th>Min</th><th>Max</th><th>Label</th></tr></thead>
                              <tbody>
                                {profilerData.column_stats?.map((row, idx) => (
                                  <tr key={idx}><td>{row.column_name}</td><td>{row.data_type}</td><td>{row.null_pct}%</td><td>{row.distinct_count}</td><td>{String(row.min ?? '-')}</td><td>{String(row.max ?? '-')}</td><td><span className="status-badge">{row.label}</span></td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="mini-card">
                          <div className="mini-card-title">Volume Analysis</div>
                          <div className="profiler-volume-panel">
                            {profilerData.volume_analysis?.length > 0 ? (
                              <>
                                <div className="plot-option-row">
                                  <span>Plot:</span>
                                  {[
                                    { id: 'daily', label: 'Daily Trend' },
                                    { id: 'monthly', label: 'Monthly' },
                                    { id: 'weekday', label: 'Day of Week' },
                                    { id: 'hourly', label: 'Hourly' }
                                  ].filter(option => (profilerData.volume_breakdown?.[option.id] || []).length > 0).map(option => (
                                    <button
                                      key={option.id}
                                      className={`chip-btn ${profilerVolumePlot === option.id ? 'active' : ''}`}
                                      onClick={() => setProfilerVolumePlot(option.id)}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                                {renderProfilerVolumeChart(
                                  (profilerData.volume_breakdown?.[profilerVolumePlot] || []).length > 0 ? profilerData.volume_breakdown?.[profilerVolumePlot] : profilerData.volume_analysis,
                                  (profilerData.volume_breakdown?.[profilerVolumePlot] || []).length > 0 ? profilerVolumePlot : 'daily'
                                )}
                              </>
                            ) : (
                              <div className="empty-state">No date/time column found for volume analysis.</div>
                            )}
                          </div>
                        </div>

                        <div className="mini-card">
                          <div className="mini-card-title">AI Health Report</div>
                          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{profilerData.health_report}</p>
                        </div>

                        <div className="mini-card">
                          <div className="mini-card-title">DQ SQL Checks</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {profilerData.dq_checks?.length > 0 ? profilerData.dq_checks.map((check, idx) => (
                              <div key={idx} className="mini-card">
                                <div className="mini-card-title" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                                  <span>{check.check}</span>
                                  {renderSqlActionButtons(check.sql, check.check, { inline: true })}
                                </div>
                                <pre className="code-block">{check.sql}</pre>
                                {renderSqlInlinePreview(check.sql, check.check)}
                              </div>
                            )) : <div className="empty-state">No obvious identifier or amount checks were generated for this table.</div>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="tab-empty-action">
                        <div className="empty-state">Run Profile to calculate row counts, column statistics, health report, DQ checks, labels, and volume plots.</div>
                        <button className="btn btn-primary btn-small" onClick={runProfiler} disabled={workbenchLoading.profiler}>
                          <ShieldCheck size={13} /> {workbenchLoading.profiler ? 'Profiling...' : 'Run Profile'}
                        </button>
                      </div>
                    )
                  )}

                  {tableDetailsTab === 'volumeAnalyzer' && (() => {
                    const dateColumns = getTableDateColumns();
                    const selectedDateColumn = volumeAnalyzerColumn || dateColumns[0] || '';
                    const anomalyRows = volumeAnalyzerData?.rows || [];
                    const summary = volumeAnalyzerData?.summary || {};
                    const modeLabel = volumeAnalyzerMode === 'event' ? 'Event Volume & Throughput' : 'Batch Volume & Run Pattern';
                    const unitLabel = volumeAnalyzerGranularity === 'hour' ? 'Hour' : volumeAnalyzerGranularity === 'month' ? 'Month' : volumeAnalyzerGranularity === 'week' ? 'Week' : 'Day';
                    return (
                      <div className="table-intelligence-sections volume-analyzer-workspace">
                        <div className="tab-action-bar volume-analyzer-action-bar">
                          <div>
                            <div className="mini-card-title">{modeLabel}</div>
                            <p>Choose whether the selected field represents streaming events or scheduled batch loads, then analyze throughput and peak/drop behavior.</p>
                          </div>
                        </div>

                        <div className="volume-analyzer-control-grid">
                          <div className="volume-control-field">
                            <span>Field Type</span>
                            <div className="segmented-control">
                              {[
                                { id: 'event', label: 'Event' },
                                { id: 'batch', label: 'Batch' }
                              ].map(option => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className={volumeAnalyzerMode === option.id ? 'active' : ''}
                                  onClick={() => handleVolumeAnalyzerModeChange(option.id)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="volume-control-field volume-date-field">
                            <SearchableSelect
                              value={selectedDateColumn}
                              onChange={(value) => {
                                setVolumeAnalyzerColumn(value);
                                setVolumeAnalyzerData(null);
                              }}
                              options={dateColumns}
                              placeholder="Select Date Field"
                              label="DATE FIELD"
                              className="workbench-table-select volume-date-select"
                            />
                          </div>
                          <label className="volume-control-field">
                            <span>Time Window</span>
                            <select className="form-input" value={volumeAnalyzerTimeWindow} onChange={(e) => { setVolumeAnalyzerTimeWindow(e.target.value); setVolumeAnalyzerData(null); }}>
                              <option value="24h">Last 24 hours</option>
                              <option value="7d">Last 7 days</option>
                              <option value="30d">Last 30 days</option>
                              <option value="90d">Last 90 days</option>
                              <option value="all">All time</option>
                            </select>
                          </label>
                          <label className="volume-control-field">
                            <span>Granularity</span>
                            <select className="form-input" value={volumeAnalyzerGranularity} onChange={(e) => { setVolumeAnalyzerGranularity(e.target.value); setVolumeAnalyzerData(null); }}>
                              <option value="hour">Hour</option>
                              <option value="day">Day</option>
                              <option value="week">Week</option>
                              <option value="month">Month</option>
                            </select>
                          </label>
                          <button className="btn btn-primary btn-small volume-load-button" onClick={runVolumeAnalyzer} disabled={workbenchLoading.volumeAnalyzer || dateColumns.length === 0}>
                            <AlertTriangle size={13} /> {workbenchLoading.volumeAnalyzer ? 'Loading Analytics...' : 'Load Analytics'}
                          </button>
                        </div>

                        {dateColumns.length === 0 && (
                          <div className="empty-state">No date or timestamp columns were found for this table.</div>
                        )}

                        {volumeAnalyzerData?.error && (
                          <div className="empty-state">{volumeAnalyzerData.error}</div>
                        )}

                        {!volumeAnalyzerData && dateColumns.length > 0 && (
                          <div className="tab-empty-action">
                            <div className="empty-state">Load analytics to plot {volumeAnalyzerMode === 'event' ? 'event throughput' : 'batch volume'} and flag peak/drop anomalies for {selectedDateColumn}.</div>
                            <button className="btn btn-primary btn-small" onClick={runVolumeAnalyzer} disabled={workbenchLoading.volumeAnalyzer}>
                              <AlertTriangle size={13} /> {workbenchLoading.volumeAnalyzer ? 'Loading Analytics...' : 'Load Analytics'}
                            </button>
                          </div>
                        )}

                        {volumeAnalyzerData && !volumeAnalyzerData.error && (
                          <>
                            <div className="volume-kpi-strip">
                              <div>
                                <span>Total {volumeAnalyzerMode === 'event' ? 'Events' : 'Rows'}</span>
                                <strong>{(summary.total_events ?? 0).toLocaleString()}</strong>
                              </div>
                              <div>
                                <span>Avg / {unitLabel}</span>
                                <strong>{summary.avg_bucket_rows ?? 0}</strong>
                              </div>
                              <div>
                                <span>First {volumeAnalyzerMode === 'event' ? 'Event' : 'Run'}</span>
                                <strong>{formatVolumeTimestamp(summary.first_event, volumeAnalyzerGranularity)}</strong>
                              </div>
                              <div>
                                <span>Last {volumeAnalyzerMode === 'event' ? 'Event' : 'Run'}</span>
                                <strong>{formatVolumeTimestamp(summary.last_event, volumeAnalyzerGranularity)}</strong>
                              </div>
                              <div>
                                <span>Peak / Drop</span>
                                <strong>{summary.peak_count ?? 0} / {summary.drop_count ?? 0}</strong>
                              </div>
                            </div>

                            <div className="volume-analytics-card">
                              <div className="volume-chart-header">
                                <div>
                                  <div className="mini-card-title">{volumeAnalyzerMode === 'event' ? 'Events' : 'Rows'} per {unitLabel}</div>
                                  <p>{unitLabel} buckets for {volumeAnalyzerTimeWindow === 'all' ? 'all time' : volumeAnalyzerTimeWindow}; red marks indicate MAD peak/drop anomalies.</p>
                                </div>
                                <div className="plot-option-row">
                                  <span>Chart type:</span>
                                  {['bar', 'line', 'area', 'scatter'].map(type => (
                                    <button key={type} className={`chip-btn ${volumeAnalyzerChartType === type ? 'active' : ''}`} onClick={() => setVolumeAnalyzerChartType(type)}>
                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <p className="section-note">
                                Method: {summary.method} on {summary.date_column}; threshold {summary.threshold}.
                              </p>
                              {renderVolumeThroughputChart(volumeAnalyzerData, volumeAnalyzerChartType)}
                              <div className="anomaly-legend">
                                <span><i className="legend-dot critical"></i>Peak/drop anomaly</span>
                                <span><i className="legend-line cyan"></i>{volumeAnalyzerMode === 'event' ? 'Event count' : 'Batch row count'}</span>
                              </div>
                            </div>

                            <div className="volume-analytics-card">
                              <div className="volume-chart-header">
                                <div>
                                  <div className="mini-card-title">Peak {volumeAnalyzerMode === 'event' ? 'Event' : 'Batch'} Heatmap</div>
                                  <p>Hour of day by day of week, useful for finding bursty producers, quiet windows, missed runs, and recurring spikes.</p>
                                </div>
                                <div className="plot-option-row">
                                  <span>Chart type:</span>
                                  {[
                                    { id: 'heatmap', label: 'Heatmap' },
                                    { id: 'dayBar', label: 'Bar by Day' },
                                    { id: 'hourBar', label: 'Bar by Hour' },
                                    { id: 'bubble', label: 'Bubble' }
                                  ].map(option => (
                                    <button
                                      key={option.id}
                                      className={`chip-btn ${volumeAnalyzerHeatmapType === option.id ? 'active' : ''}`}
                                      onClick={() => setVolumeAnalyzerHeatmapType(option.id)}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {renderVolumePeakPatternChart(volumeAnalyzerData, volumeAnalyzerHeatmapType)}
                            </div>

                            <div className="mini-card">
                              <div className="mini-card-title">Flagged Buckets</div>
                              <div className="table-container">
                                {anomalyRows.length > 0 ? (
                                  <table className="custom-table">
                                    <thead>
                                      <tr>
                                        <th>Bucket</th>
                                        <th>Rows</th>
                                        <th>Rolling Median</th>
                                        <th>MAD</th>
                                        <th>Modified Z</th>
                                        <th>Direction</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {anomalyRows.map((row, idx) => (
                                        <tr key={idx}>
                                          <td>{formatVolumeTimestamp(getKeyValue(row, 'ACTIVITY_BUCKET') || getKeyValue(row, 'ACTIVITY_DATE'), volumeAnalyzerGranularity)}</td>
                                          <td>{getKeyValue(row, 'ROW_COUNT')}</td>
                                          <td>{getKeyValue(row, 'ROLLING_MEDIAN')}</td>
                                          <td>{getKeyValue(row, 'MAD')}</td>
                                          <td>{getKeyValue(row, 'MODIFIED_Z')}</td>
                                          <td><span className={`status-badge ${String(getKeyValue(row, 'DIRECTION')).toLowerCase()}`}>{getKeyValue(row, 'DIRECTION') || 'anomaly'}</span></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="empty-state">No peak/drop anomalies found for the selected field and time window.</div>
                                )}
                              </div>
                            </div>

                            {volumeAnalyzerData.sql && (
                              <div className="mini-card">
                                <div className="mini-card-title sql-card-title">
                                  <span>Bucketed Count SQL</span>
                                  {renderSqlActionButtons(volumeAnalyzerData.sql, 'Volume Analyzer Bucketed Counts', { inline: true })}
                                </div>
                                <pre className="code-block">{volumeAnalyzerData.sql}</pre>
                                {renderSqlInlinePreview(volumeAnalyzerData.sql, 'Volume Analyzer Bucketed Counts')}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {tableDetailsTab === 'insights' && (
                    tableInsightsData ? (
                      <div className="table-intelligence-sections">
                        <div className="tab-action-bar">
                          <div>
                            <div className="mini-card-title">Insight Generator</div>
                            <p>Generate analyst-style findings such as trends, KPI summaries, anomaly candidates, correlations, and likely sensitive fields.</p>
                          </div>
                          <button className="btn btn-primary btn-small" onClick={runTableInsights} disabled={workbenchLoading.insights}>
                            <Sparkles size={13} /> {workbenchLoading.insights ? 'Generating...' : 'Generate Insights'}
                          </button>
                        </div>
                        {tableInsightsData.error && (
                          <div className="empty-state">{tableInsightsData.error}</div>
                        )}
                        <div className="table-insight-summary">
                          <div className="mini-card">
                            <div className="mini-card-title">Rows</div>
                            <span className="stat-value">{tableInsightsData.summary?.row_count ?? '-'}</span>
                          </div>
                          <div className="mini-card">
                            <div className="mini-card-title">Numeric Columns</div>
                            <span className="stat-value">{tableInsightsData.summary?.numeric_columns ?? '-'}</span>
                          </div>
                          <div className="mini-card">
                            <div className="mini-card-title">Date Columns</div>
                            <span className="stat-value green">{tableInsightsData.summary?.date_columns ?? '-'}</span>
                          </div>
                          <div className="mini-card">
                            <div className="mini-card-title">Likely PII</div>
                            <span className="stat-value purple">{tableInsightsData.summary?.pii_columns ?? '-'}</span>
                          </div>
                        </div>

                        <div className="table-insight-grid">
                          {tableInsightsData.insights?.map((insight, idx) => (
                            <div key={idx} className="mini-card insight-card">
                              <div className="insight-card-header">
                                <span className="status-badge">{insight.category}</span>
                                <span className={`confidence-badge ${String(insight.confidence || '').toLowerCase()}`}>{insight.confidence || 'Signal'}</span>
                              </div>
                              <div className="mini-card-title">{insight.title}</div>
                              <p>{insight.summary}</p>
                              {insight.data?.length > 0 && (
                                <div className="insight-mini-list">
                                  {insight.data.slice(0, 5).map((item, itemIdx) => (
                                    <span key={itemIdx}>{item.column || item.VALUE || item.value || item.PERIOD || item.period}: {item.reason || item.ROW_COUNT || item.row_count || item.label || ''}</span>
                                  ))}
                                </div>
                              )}
                              {insight.sql && (
                                <div className="code-container insight-sql">
                                  <div className="insight-sql-header">
                                    <span>SQL</span>
                                    {renderSqlActionButtons(insight.sql, insight.title, { inline: true })}
                                  </div>
                                  <pre className="code-block">{insight.sql}</pre>
                                  {renderSqlInlinePreview(insight.sql, insight.title)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mini-card">
                          <div className="mini-card-title">Recommended Follow-Up SQL</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {tableInsightsData.recommended_sql?.length > 0 ? tableInsightsData.recommended_sql.map((item, idx) => (
                              <div key={idx} className="mini-card">
                                <div className="mini-card-title" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                                  <span>{item.label}</span>
                                  {renderSqlActionButtons(item.sql, item.label, { inline: true })}
                                </div>
                                <pre className="code-block">{item.sql}</pre>
                                {renderSqlInlinePreview(item.sql, item.label)}
                              </div>
                            )) : <div className="empty-state">No follow-up SQL generated yet.</div>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="tab-empty-action">
                        <div className="empty-state">
                          Generate insights to discover trends, anomalies, correlations, KPI summaries, likely PII, and suggested follow-up SQL for this table.
                        </div>
                        <button className="btn btn-primary btn-small" onClick={runTableInsights} disabled={workbenchLoading.insights}>
                          <Sparkles size={13} /> {workbenchLoading.insights ? 'Generating...' : 'Generate Insights'}
                        </button>
                      </div>
                    )
                  )}

                  {tableDetailsTab === 'columns' && (
                    <div className="table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Type</th>
                            <th>Nullable</th>
                            <th>Max Length</th>
                            <th>Precision</th>
                            <th>Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableDetailsData.columns?.map((col, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 700 }}>{col.COLUMN_NAME}</td>
                              <td>{col.DATA_TYPE}</td>
                              <td>{col.IS_NULLABLE}</td>
                              <td>{col.CHARACTER_MAXIMUM_LENGTH || '-'}</td>
                              <td>{col.NUMERIC_PRECISION || '-'}</td>
                              <td style={{ whiteSpace: 'normal' }}>{col.COMMENT || col.DESCRIPTION || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {tableDetailsTab === 'sample' && (
                    <div className="table-container">
                      {tableDetailsData.sample_rows?.length > 0 ? (
                        <table className="custom-table">
                          <thead>
                            <tr>{Object.keys(tableDetailsData.sample_rows[0]).map(col => <th key={col}>{col}</th>)}</tr>
                          </thead>
                          <tbody>
                            {tableDetailsData.sample_rows.map((row, idx) => (
                              <tr key={idx}>{Object.keys(row).map(col => <td key={col}>{String(row[col] ?? '')}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="empty-state">No sample rows returned.</div>
                      )}
                    </div>
                  )}

                  {tableDetailsTab === 'stats' && (
                    profilerData ? (
                      <div className="table-container">
                        <table className="custom-table">
                          <thead><tr><th>Column</th><th>Type</th><th>Null %</th><th>Distinct</th><th>Min</th><th>Max</th></tr></thead>
                          <tbody>
                            {profilerData.column_stats?.map((row, idx) => (
                              <tr key={idx}><td>{row.column_name}</td><td>{row.data_type}</td><td>{row.null_pct}%</td><td>{row.distinct_count}</td><td>{String(row.min ?? '-')}</td><td>{String(row.max ?? '-')}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-state">Run Profile to calculate null percentages, distinct counts, min, and max values.</div>
                    )
                  )}

                  {tableDetailsTab === 'health' && (
                    profilerData ? (
                      <div className="mini-card"><p style={{ fontSize: '14px', lineHeight: 1.6 }}>{profilerData.health_report}</p></div>
                    ) : (
                      <div className="empty-state">Run Profile to generate the AI health report.</div>
                    )
                  )}

                  {tableDetailsTab === 'volume' && (
                    profilerData ? (
                      <div className="profiler-volume-panel">
                        {profilerData.volume_analysis?.length > 0 ? (
                          <>
                            <div className="plot-option-row">
                              <span>Plot:</span>
                              {[
                                { id: 'daily', label: 'Daily Trend' },
                                { id: 'monthly', label: 'Monthly' },
                                { id: 'weekday', label: 'Day of Week' },
                                { id: 'hourly', label: 'Hourly' }
                              ].filter(option => (profilerData.volume_breakdown?.[option.id] || []).length > 0).map(option => (
                                <button
                                  key={option.id}
                                  className={`chip-btn ${profilerVolumePlot === option.id ? 'active' : ''}`}
                                  onClick={() => setProfilerVolumePlot(option.id)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            {renderProfilerVolumeChart(
                              (profilerData.volume_breakdown?.[profilerVolumePlot] || []).length > 0 ? profilerData.volume_breakdown?.[profilerVolumePlot] : profilerData.volume_analysis,
                              (profilerData.volume_breakdown?.[profilerVolumePlot] || []).length > 0 ? profilerVolumePlot : 'daily'
                            )}
                            <div className="table-container">
                              <table className="custom-table">
                                <thead><tr><th>Date</th><th>Rows</th></tr></thead>
                                <tbody>{profilerData.volume_analysis.map((row, idx) => <tr key={idx}><td>{String(row.ACTIVITY_DATE ?? row.activity_date ?? '')}</td><td>{row.ROW_COUNT ?? row.row_count}</td></tr>)}</tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <div className="empty-state">No date/time column found for volume analysis.</div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-state">Run Profile to build volume analysis and plots.</div>
                    )
                  )}

                  {tableDetailsTab === 'checks' && (
                    profilerData ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {profilerData.dq_checks?.length > 0 ? profilerData.dq_checks.map((check, idx) => (
                          <div key={idx} className="mini-card">
                            <div className="mini-card-title" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                              <span>{check.check}</span>
                              {renderSqlActionButtons(check.sql, check.check, { inline: true })}
                            </div>
                            <pre className="code-block">{check.sql}</pre>
                            {renderSqlInlinePreview(check.sql, check.check)}
                          </div>
                        )) : <div className="empty-state">No obvious identifier or amount checks were generated for this table.</div>}
                      </div>
                    ) : (
                      <div className="empty-state">Run Profile to generate basic data quality SQL checks.</div>
                    )
                  )}

                  {tableDetailsTab === 'labels' && (
                    profilerData ? (
                      <div className="workbench-grid">
                        {profilerData.column_labels?.map((item, idx) => (
                          <div key={idx} className="mini-card"><div className="mini-card-title">{item.column_name}</div><span className="status-badge">{item.label}</span></div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">Run Profile to assign column labels like PK, FK, Amount, Date, Flag, and Category.</div>
                    )
                  )}

                  {tableDetailsTab === 'ai' && (
                    <div className="workbench-grid">
                      {tableDetailsData.ai_descriptions?.map((item, idx) => (
                        <div key={idx} className="mini-card">
                          <div className="mini-card-title">{item.column_name}</div>
                          <span className="status-badge">{item.label}</span>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {tableDetailsTab === 'ddl' && (
                    <div className="code-container">
                      <button className="btn btn-secondary btn-small" style={{ position: 'absolute', right: '10px', top: '10px' }} onClick={() => handleCopy(tableDetailsData.ddl)}>
                        {copiedQuery === tableDetailsData.ddl ? 'Copied!' : 'Copy'}
                      </button>
                      <pre className="code-block">{tableDetailsData.ddl}</pre>
                    </div>
                  )}

                  {tableDetailsTab === 'queries' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {tableDetailsData.quick_queries?.map((query, idx) => (
                        <div key={idx} className="mini-card">
                          <div className="code-header">{query.label}</div>
                          <div className="code-container">
                            <div style={{ position: 'absolute', right: '10px', top: '10px' }}>
                              {renderSqlActionButtons(query.sql, query.label, { inline: true })}
                            </div>
                            <pre className="code-block">{query.sql}</pre>
                            {renderSqlInlinePreview(query.sql, query.label)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">Choose a database, schema, and table/view to load metadata, samples, DDL, descriptions, and quick SQL.</div>
              )}
            </div>
          )}

          {activeTab === 'catalogSearch' && (
            <div className="panel-body catalog-search-page">
              <div className="glass-card">
                <div className="glass-card-header">
                  <span className="glass-card-title"><Layers size={16} /> Column / Table Search</span>
                  <button className="btn btn-primary btn-small" onClick={runCatalogSearch} disabled={workbenchLoading.search}>
                    {workbenchLoading.search ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {renderWorkbenchScope('search', { includeType: false, includeTable: false })}
                <div className="catalog-search-controls">
                  <input className="form-input catalog-main-search" placeholder="Search table or column name, for example id" value={appScopes.search.query} onChange={(e) => patchWorkbenchScope('search', { query: e.target.value })} />
                  <div className="plot-option-row catalog-type-row">
                    <span>Data type:</span>
                    {['', 'NUMBER', 'VARCHAR', 'DATE', 'TIMESTAMP', 'BOOLEAN'].map(type => (
                      <button key={type || 'all'} className={`chip-btn ${appScopes.search.dataType === type ? 'active' : ''}`} onClick={() => patchWorkbenchScope('search', { dataType: type })}>{type || 'ALL TYPES'}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="catalog-results-layout">
                <div className="glass-card catalog-result-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Database size={16} /> Table Matches</span>
                    <span className="status-badge">{searchTableResults.length} tables</span>
                  </div>
                  <div className="table-container catalog-result-table">
                    <table className="custom-table catalog-table-match-table">
                      <thead><tr><th>Database</th><th>Schema</th><th>Table</th><th>Instant Select</th></tr></thead>
                      <tbody>
                        {searchTableResults.map((row, idx) => {
                          const sql = `SELECT * FROM ${row.TABLE_CATALOG}.${row.TABLE_SCHEMA}.${row.TABLE_NAME} LIMIT 100;`;
                          return (
                            <tr key={`${row.TABLE_CATALOG}-${row.TABLE_SCHEMA}-${row.TABLE_NAME}-${idx}`}>
                              <td>{row.TABLE_CATALOG}</td>
                              <td>{row.TABLE_SCHEMA}</td>
                              <td style={{ fontWeight: 700 }}>{row.TABLE_NAME}</td>
                              <td>{renderSqlActionButtons(sql, `${row.TABLE_NAME} Select`)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {searchTableResults.length === 0 && <div className="empty-state">No table names matched the search text.</div>}
                  </div>
                </div>

                <div className="glass-card catalog-result-card">
                  <div className="glass-card-header catalog-card-header-wrap">
                    <span className="glass-card-title"><Layers size={16} /> Column Matches</span>
                    <span className="status-badge">{searchColumnResults.length} columns</span>
                  </div>
                  <div className="catalog-column-filter-row">
                    <input
                      className="form-input"
                      placeholder="Filter column results by table name, for example airline"
                      value={appScopes.search.tableFilter}
                      onChange={(e) => patchWorkbenchScope('search', { tableFilter: e.target.value })}
                    />
                    <button className="btn btn-secondary btn-small" onClick={runCatalogSearch} disabled={workbenchLoading.search}>
                      Apply Table Filter
                    </button>
                  </div>
                  <div className="table-container catalog-result-table">
                    <table className="custom-table catalog-column-match-table">
                      <thead><tr><th>Database</th><th>Schema</th><th>Table</th><th>Column</th><th>Type</th><th>Instant Select</th></tr></thead>
                      <tbody>
                        {searchColumnResults.map((row, idx) => {
                          const sql = `SELECT ${row.COLUMN_NAME} FROM ${row.TABLE_CATALOG}.${row.TABLE_SCHEMA}.${row.TABLE_NAME} LIMIT 100;`;
                          return (
                            <tr key={`${row.TABLE_CATALOG}-${row.TABLE_SCHEMA}-${row.TABLE_NAME}-${row.COLUMN_NAME}-${idx}`}>
                              <td>{row.TABLE_CATALOG}</td>
                              <td>{row.TABLE_SCHEMA}</td>
                              <td>{row.TABLE_NAME}</td>
                              <td style={{ fontWeight: 700 }}>{row.COLUMN_NAME}</td>
                              <td><span className="status-badge">{row.DATA_TYPE}</span></td>
                              <td>{renderSqlActionButtons(sql, `${row.TABLE_NAME}.${row.COLUMN_NAME} Select`)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {searchColumnResults.length === 0 && <div className="empty-state">No columns matched the search text, data type, and table-name filter.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'anomaly' && (
            <div className="panel-body anomaly-page">
              <div className="glass-card anomaly-scope-card">
                <div className="glass-card-header">
                  <span className="glass-card-title"><AlertTriangle size={16} /> Anomaly Detector</span>
                  <button className="btn btn-primary btn-small" onClick={runAnomaly} disabled={workbenchLoading.anomaly}>
                    {workbenchLoading.anomaly ? 'Scanning...' : 'Run Scan'}
                  </button>
                </div>
                {renderWorkbenchScope('anomaly', { includeColumn: true })}
              </div>

              <div className="glass-card">
                {renderWorkbenchTabs([{ id: 'scan', label: 'Detector Results' }, { id: 'rules', label: 'Custom Rule' }], anomalyTab, setAnomalyTab)}
                {anomalyTab === 'scan' && (
                  anomalyData ? (
                    <>
                      <div className="anomaly-summary-grid">
                        <div className="mini-card">
                          <div className="mini-card-title">Scan Type</div>
                          <span className="status-badge">{anomalyData.kind}</span>
                        </div>
                        <div className="mini-card">
                          <div className="mini-card-title">Anomalies Returned</div>
                          <span className="stat-value" style={{ fontSize: '24px' }}>{anomalyData.rows?.length || 0}</span>
                        </div>
                        <div className="mini-card">
                          <div className="mini-card-title">Detection Summary</div>
                          <pre className="code-block compact-code">{JSON.stringify(anomalyData.summary, null, 2)}</pre>
                        </div>
                      </div>
                      <div className="plot-option-row">
                        <span>Plot</span>
                        {getAnomalyPlotOptions(anomalyData.kind).map(option => (
                          <button
                            key={option}
                            className={`chip-btn ${anomalyPlotType === option ? 'active' : ''}`}
                            onClick={() => setAnomalyPlotType(option)}
                          >
                            {option === 'auto' ? 'Best Fit' : option}
                          </button>
                        ))}
                      </div>
                      {renderAnomalyPlot(anomalyData, anomalyPlotType)}
                      <div className="table-container">
                        {anomalyData.rows?.length > 0 ? (
                          <table className="custom-table">
                            <thead><tr>{Object.keys(anomalyData.rows[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
                            <tbody>{anomalyData.rows.map((row, idx) => <tr key={idx}>{Object.keys(row).map(k => <td key={k}>{String(row[k] ?? '')}</td>)}</tr>)}</tbody>
                          </table>
                        ) : (
                          <div className="empty-state">No anomalies returned for this scan.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">Choose a table and column, then run the detector. Numeric columns use z-score, dates use rolling MAD, and text columns use frequency probability.</div>
                  )
                )}
                {anomalyTab === 'rules' && (() => {
                  const customRuleSql = buildCustomAnomalyRuleSql();
                  return (
                    <div className="anomaly-rule-workspace">
                      <div className="mini-card anomaly-rule-builder">
                        <div className="mini-card-title">Build Custom Rule</div>
                        <div className="anomaly-rule-grid">
                          <label className="form-group">
                            <span>Rule Name</span>
                            <input
                              className="form-input"
                              value={customAnomalyRule.name}
                              onChange={(e) => setCustomAnomalyRule(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Negative amount, invalid status, future date..."
                            />
                          </label>
                          <label className="form-group">
                            <span>Rule Type</span>
                            <select
                              className="form-input"
                              value={customAnomalyRule.type}
                              onChange={(e) => setCustomAnomalyRule(prev => ({ ...prev, type: e.target.value }))}
                            >
                              <option value="is_null">Is null</option>
                              <option value="is_not_null">Is not null</option>
                              <option value="equals">Equals</option>
                              <option value="not_equals">Not equals</option>
                              <option value="greater_than">Greater than</option>
                              <option value="greater_or_equal">Greater than or equal</option>
                              <option value="less_than">Less than</option>
                              <option value="less_or_equal">Less than or equal</option>
                              <option value="between">Between</option>
                              <option value="contains">Contains</option>
                              <option value="not_contains">Does not contain</option>
                              <option value="starts_with">Starts with</option>
                              <option value="ends_with">Ends with</option>
                              <option value="regex">Regex match</option>
                              <option value="custom_where">Custom WHERE</option>
                            </select>
                          </label>
                          {customAnomalyRule.type !== 'custom_where' && (
                            <div className="form-group">
                              <span>Selected Column</span>
                              <div className="readonly-pill">{appScopes.anomaly.column || 'Select a column above'}</div>
                            </div>
                          )}
                          {getCustomRuleNeedsValue() && (
                            <label className="form-group">
                              <span>{customAnomalyRule.type === 'between' ? 'Start Value' : 'Value'}</span>
                              <input
                                className="form-input"
                                value={customAnomalyRule.value}
                                onChange={(e) => setCustomAnomalyRule(prev => ({ ...prev, value: e.target.value }))}
                                placeholder="Enter comparison value"
                              />
                            </label>
                          )}
                          {getCustomRuleNeedsSecondValue() && (
                            <label className="form-group">
                              <span>End Value</span>
                              <input
                                className="form-input"
                                value={customAnomalyRule.secondValue}
                                onChange={(e) => setCustomAnomalyRule(prev => ({ ...prev, secondValue: e.target.value }))}
                                placeholder="Enter upper bound"
                              />
                            </label>
                          )}
                          {customAnomalyRule.type === 'custom_where' && (
                            <label className="form-group anomaly-custom-where">
                              <span>Custom WHERE Condition</span>
                              <textarea
                                className="form-input"
                                value={customAnomalyRule.customWhere}
                                onChange={(e) => setCustomAnomalyRule(prev => ({ ...prev, customWhere: e.target.value }))}
                                placeholder={'Example: "AMOUNT" < 0 OR "STATUS" = \'FAILED\''}
                                rows="4"
                              />
                            </label>
                          )}
                        </div>
                        <div className="anomaly-rule-preview">
                          <div className="mini-card-title sql-card-title">
                            <span>Generated Rule SQL</span>
                            {customRuleSql && renderSqlActionButtons(customRuleSql, customAnomalyRule.name || 'Custom Anomaly Rule', { inline: true })}
                          </div>
                          {customRuleSql ? (
                            <>
                              <pre className="code-block">{customRuleSql}</pre>
                              {renderSqlInlinePreview(customRuleSql, customAnomalyRule.name || 'Custom Anomaly Rule')}
                            </>
                          ) : (
                            <div className="empty-state">Select a table/column and fill the rule inputs to generate executable SQL.</div>
                          )}
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="mini-card-title">Suggested Rules From Detector</div>
                        {anomalyData?.custom_rules?.length > 0 ? (
                          <div className="anomaly-suggested-rules">
                            {anomalyData.custom_rules.map((rule, idx) => (
                              <div key={idx} className="mini-card">
                                <div className="mini-card-title" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                                  <span>{rule.label}</span>
                                  {renderSqlActionButtons(rule.sql, rule.label, { inline: true })}
                                </div>
                                <pre className="code-block">{rule.sql}</pre>
                                {renderSqlInlinePreview(rule.sql, rule.label)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">Run Scan to get detector-suggested rule templates for the selected column.</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'freshness' && (
            <div className="panel-body">
              <div className="glass-card">
                <div className="glass-card-header">
                  <span className="glass-card-title"><RefreshCw size={16} /> Data Freshness</span>
                  <button className="btn btn-primary btn-small" onClick={runFreshness} disabled={workbenchLoading.freshness}>
                    {workbenchLoading.freshness ? 'Scanning...' : 'Run Freshness Scan'}
                  </button>
                </div>
                {renderWorkbenchScope('freshness', { includeTable: true, tablePlaceholder: 'All Tables/Views' })}
                <div className="freshness-control-grid">
                  <div>
                    <div className="scope-control-label">Status Filter</div>
                    <div className="chip-row">
                      {['', 'daily', 'weekly', 'monthly'].map(freq => (
                        <button key={freq || 'all'} className={`chip-btn ${appScopes.freshness.frequency === freq ? 'active' : ''}`} onClick={() => patchWorkbenchScope('freshness', { frequency: freq })}>{freq || 'ALL'}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="scope-control-label">Expected SLA</div>
                    <div className="chip-row">
                      {['hourly', 'daily', 'weekly', 'monthly', 'custom'].map(freq => (
                        <button key={freq} className={`chip-btn ${appScopes.freshness.expectedFrequency === freq ? 'active' : ''}`} onClick={() => patchWorkbenchScope('freshness', { expectedFrequency: freq })}>{freq.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  {appScopes.freshness.expectedFrequency === 'custom' && (
                    <label className="custom-hours-control">
                      <span>Custom Hours</span>
                      <input
                        type="number"
                        min="1"
                        value={appScopes.freshness.customHours || 24}
                        onChange={(e) => patchWorkbenchScope('freshness', { customHours: Number(e.target.value) })}
                      />
                    </label>
                  )}
                </div>
                {appScopes.freshness.table && (() => {
                  const freshnessDateColumns = getWorkbenchDateColumns('freshness');
                  return (
                    <div className="freshness-date-field-panel">
                      {freshnessDateColumns.length > 0 ? (
                        <SearchableSelect
                          value={appScopes.freshness.column || freshnessDateColumns[0] || ''}
                          onChange={(value) => patchWorkbenchScope('freshness', { column: value })}
                          options={freshnessDateColumns}
                          placeholder="Select Date Field"
                          label="FRESHNESS DATE FIELD"
                          className="workbench-table-select freshness-date-select"
                        />
                      ) : (
                        <div className="empty-state">No date or timestamp field found for the selected table. Data freshness cannot be calculated for this table.</div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {freshnessData && (
                <>
                  <div className="freshness-summary-grid">
                    {[
                      ['Tables Scanned', freshnessData.summary?.tables_scanned ?? freshnessData.results?.length ?? 0, ''],
                      ['Fresh', freshnessData.summary?.fresh ?? 0, 'fresh'],
                      ['Warning', freshnessData.summary?.warning ?? 0, 'warning'],
                      ['Stale', freshnessData.summary?.stale ?? 0, 'stale'],
                      ['No Date Field', freshnessData.summary?.no_date_field ?? 0, 'unknown'],
                      ['SLA Hours', freshnessData.summary?.expected_hours ?? '-', '']
                    ].map(([label, value, tone]) => (
                      <div key={label} className={`freshness-summary-card ${tone}`}>
                        <span>{label}</span>
                        <strong>{Number.isFinite(Number(value)) ? Number(value).toLocaleString() : value}</strong>
                      </div>
                    ))}
                  </div>

                  {appScopes.freshness.table && (() => {
                    const selectedFreshness = freshnessData.results?.[0];
                    if (!selectedFreshness) return null;
                    return (
                      <div className="glass-card freshness-detail-card">
                        <div className="glass-card-header">
                          <span className="glass-card-title"><Activity size={16} /> Freshness Monitor Detail</span>
                          <span className={`status-badge ${selectedFreshness.status !== 'fresh' ? 'mock' : ''}`}>{selectedFreshness.status}</span>
                        </div>
                        <div className="freshness-kpi-strip">
                          <div><span>Last Seen</span><strong>{String(selectedFreshness.last_seen || '-')}</strong></div>
                          <div><span>Age Hours</span><strong>{selectedFreshness.age_hours ?? '-'}</strong></div>
                          <div><span>Latest Rows</span><strong>{(selectedFreshness.latest_rows ?? 0).toLocaleString()}</strong></div>
                          <div><span>Previous Rows</span><strong>{(selectedFreshness.previous_rows ?? 0).toLocaleString()}</strong></div>
                          <div><span>Volume Change</span><strong>{selectedFreshness.volume_change_pct ?? '-'}%</strong></div>
                          <div><span>Load Pattern</span><strong>{selectedFreshness.load_pattern || '-'}</strong></div>
                        </div>
                        <div className="freshness-detail-grid">
                          <div className="mini-card freshness-narrative">
                            <div className="mini-card-title">AI Freshness Summary</div>
                            <p>{selectedFreshness.ai_summary || selectedFreshness.message || 'No freshness summary available.'}</p>
                          </div>
                          <div className="mini-card freshness-narrative">
                            <div className="mini-card-title">Alert Recommendation</div>
                            <p>{selectedFreshness.alert_recommendation || 'No alert recommendation available.'}</p>
                          </div>
                        </div>
                        <div className="mini-card">
                          <div className="mini-card-title">Freshness Trend</div>
                          {renderFreshnessTrendChart(selectedFreshness.trend || [])}
                        </div>
                        <div className="freshness-detail-grid">
                          <div className="mini-card">
                            <div className="mini-card-title">Missing Expected Dates</div>
                            {selectedFreshness.missing_dates?.length ? (
                              <div className="freshness-missing-list">
                                {selectedFreshness.missing_dates.map(day => <span key={day}>{day}</span>)}
                              </div>
                            ) : (
                              <div className="empty-state">No missing daily partitions detected in the returned history.</div>
                            )}
                          </div>
                          <div className="mini-card">
                            <div className="mini-card-title">Freshness SQL Checks</div>
                            <div className="freshness-sql-list">
                              {selectedFreshness.sql_checks?.map((check, idx) => (
                                <div key={idx} className="freshness-sql-item">
                                  <div className="code-header">
                                    <span>{check.check}</span>
                                    {renderSqlActionButtons(check.sql, check.check, { inline: true })}
                                  </div>
                                  <pre className="code-block">{check.sql}</pre>
                                  {renderSqlInlinePreview(check.sql, check.check)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="glass-card">
                    <div className="glass-card-header">
                      <span className="glass-card-title"><Table size={16} /> Freshness Ranking</span>
                    </div>
                    <div className="table-container freshness-result-table">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Table</th><th>Date Column</th><th>Last Seen</th><th>Age Hours</th><th>Latest Rows</th><th>Previous Rows</th><th>Change</th><th>Pattern</th><th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {freshnessData.results?.map((row, idx) => (
                            <tr key={idx}>
                              <td title={row.table_name}>{row.table_name}</td>
                              <td>{row.date_column || '-'}</td>
                              <td>{String(row.last_seen || '-')}</td>
                              <td>{row.age_hours ?? '-'}</td>
                              <td>{row.latest_rows?.toLocaleString?.() ?? '-'}</td>
                              <td>{row.previous_rows?.toLocaleString?.() ?? '-'}</td>
                              <td>{row.volume_change_pct ?? '-'}%</td>
                              <td>{row.load_pattern || '-'}</td>
                              <td><span className={`status-badge ${row.status !== 'fresh' ? 'mock' : ''}`}>{row.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {activeTab === 'queryLog' && (
            <div className="panel-body query-log-page">
              <div className="glass-card">
                <div className="glass-card-header">
                  <span className="glass-card-title"><Terminal size={16} /> Persisted Query Log</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-small" onClick={loadWorkbenchQueryLog} disabled={workbenchLoading.queryLog}>
                      {workbenchLoading.queryLog ? 'Refreshing...' : 'Refresh Log'}
                    </button>
                    <button className="btn btn-danger btn-small" onClick={clearWorkbenchQueryLog} disabled={workbenchLoading.queryLog}>
                      Clear Log
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Stored locally in the backend workspace until you clear it.
                </div>
                <div className="query-log-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {workbenchQueryLog.length > 0 ? workbenchQueryLog.map((item, idx) => (
                    <div key={idx} className="mini-card">
                      <div className="code-header" style={{ alignItems: 'center', gap: '12px' }}>
                        <span>{item.timestamp} | {item.purpose} | {item.source}</span>
                        {renderSqlActionButtons(item.query, item.purpose || 'Query Log Result', { inline: true })}
                      </div>
                      <pre className="code-block">{item.query}</pre>
                      {renderSqlInlinePreview(item.query, item.purpose || 'Query Log Result')}
                    </div>
                  )) : <div className="empty-state">No queries logged yet. Execute SQL from chat or run a workbench scan to populate this list.</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'executionFootprint' && (
            <div className="panel-body execution-footprint-page">
              <div className="glass-card execution-overview-card">
                <div className="glass-card-header">
                  <span className="glass-card-title"><Activity size={16} /> Execution Footprint</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-small" onClick={refreshAiUsage}>Refresh Usage</button>
                    <button className="btn btn-danger btn-small" onClick={resetAiUsage}>Reset Usage</button>
                  </div>
                </div>
                <div className="execution-persist-note">
                  Usage is accumulated in the backend workspace until you reset it. File: {aiConfig.usage?.usage_file || 'backend/ai_usage.json'}
                </div>
                <div className="execution-summary-grid">
                  <div><span>Execution Mode</span><strong>{aiConfig.processing_mode || 'native'}</strong></div>
                  <div><span>Provider</span><strong>{aiConfig.usage?.active_provider || aiConfig.provider || '-'}</strong></div>
                  <div><span>Model</span><strong>{aiConfig.usage?.model || aiConfig.model || '-'}</strong></div>
                  <div><span>Total LLM Prompts</span><strong>{aiConfig.usage?.prompt_count || 0}</strong></div>
                  <div><span>Total Tokens</span><strong>{Number(aiConfig.usage?.total_tokens || 0).toLocaleString()}</strong></div>
                  <div><span>Estimated API Cost</span><strong>${Number(aiConfig.usage?.estimated_cost || 0).toFixed(4)}</strong></div>
                </div>
              </div>

              <div className="glass-card spend-aware-card execution-spend-aware-card">
                <div className="glass-card-header">
                  <span className="glass-card-title"><DollarSign size={16} /> Spend-Aware AI Engine</span>
                  <span className="status-badge">{aiConfig.usage?.spend_aware?.decision_count || 0} decisions</span>
                </div>
                <div className="spend-aware-hero">
                  <div><span>Naive Tokens</span><strong>{formatTokenCount(aiConfig.usage?.spend_aware?.naive_prompt_tokens)}</strong></div>
                  <div><span>Optimized Tokens</span><strong>{formatTokenCount(aiConfig.usage?.spend_aware?.optimized_prompt_tokens)}</strong></div>
                  <div><span>Tokens Avoided</span><strong className="green">{formatTokenCount(aiConfig.usage?.spend_aware?.tokens_saved)}</strong></div>
                  <div><span>Avg Reduction</span><strong>{Number(aiConfig.usage?.spend_aware?.avg_reduction_pct || 0).toFixed(1)}%</strong></div>
                  <div><span>Cost Avoided</span><strong>{formatSmallUsd(aiConfig.usage?.spend_aware?.cost_avoided)}</strong></div>
                </div>
                <div className="spend-aware-decision">
                  <strong>Internal token governance without external tools.</strong>
                  <span>DataPilot estimates naive context, uses native SQL first, trims the LLM prompt to the facts that matter, and records avoided tokens separately from actual provider usage.</span>
                </div>
                {aiConfig.usage?.spend_aware?.events?.length ? (
                  <div className="spend-aware-event-list">
                    {[...(aiConfig.usage.spend_aware.events || [])].slice(-5).reverse().map((event, idx) => (
                      <div className="spend-aware-event" key={`${event.timestamp}-${idx}`}>
                        <div>
                          <strong>{event.feature}</strong>
                          <span>{event.question}</span>
                        </div>
                        <span className="status-badge">{formatTokenCount(event.tokens_saved)} saved</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">Run an Incident Command question to populate Spend-Aware decisions.</div>
                )}
              </div>

              <div className="execution-governance-grid">
                <div className="glass-card execution-governance-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Copy size={16} /> Prompt Reuse Cache</span>
                    <span className="status-badge">{aiConfig.usage?.prompt_cache?.entries || 0} entries</span>
                  </div>
                  <div className="execution-summary-grid compact">
                    <div><span>Cache Hits</span><strong>{formatTokenCount(aiConfig.usage?.prompt_cache?.hits)}</strong></div>
                    <div><span>Misses</span><strong>{formatTokenCount(aiConfig.usage?.prompt_cache?.misses)}</strong></div>
                    <div><span>Tokens Saved</span><strong>{formatTokenCount(aiConfig.usage?.prompt_cache?.tokens_saved)}</strong></div>
                    <div><span>Cost Avoided</span><strong>{formatSmallUsd(aiConfig.usage?.prompt_cache?.cost_avoided)}</strong></div>
                  </div>
                  <p className="execution-note">
                    Last lookup: {aiConfig.usage?.prompt_cache?.last_lookup?.status || 'not run'}
                    {aiConfig.usage?.prompt_cache?.last_lookup?.scope ? ` | ${aiConfig.usage.prompt_cache.last_lookup.scope}` : ''}
                    {aiConfig.usage?.prompt_cache?.last_lookup?.key ? ` | ${aiConfig.usage.prompt_cache.last_lookup.key}` : ''}
                  </p>
                  <p className="execution-note">Exact same operation, provider, model, question, database/schema, and resolved table scope can reuse the stored response without spending provider tokens.</p>
                </div>

                <div className={`glass-card execution-governance-card budget-${aiConfig.usage?.token_budget?.status || 'ok'}`}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><ShieldCheck size={16} /> Token Budget Guardrails</span>
                    <span className="status-badge">{aiConfig.usage?.token_budget?.status || 'ok'}</span>
                  </div>
                  <div className="execution-summary-grid compact">
                    <div><span>Budget</span><strong>{formatTokenCount(aiConfig.usage?.token_budget?.limit)}</strong></div>
                    <div><span>Used</span><strong>{formatTokenCount(aiConfig.usage?.token_budget?.used)}</strong></div>
                    <div><span>Remaining</span><strong>{formatTokenCount(aiConfig.usage?.token_budget?.remaining)}</strong></div>
                    <div><span>Blocked Calls</span><strong>{formatTokenCount(aiConfig.usage?.token_budget?.blocked_calls)}</strong></div>
                  </div>
                  {(aiConfig.usage?.token_budget?.warnings || []).slice(-2).map((warning, idx) => (
                    <p className="execution-note warning" key={idx}>{warning}</p>
                  ))}
                </div>
              </div>

              <div className="execution-app-grid">
                {appExecutionCatalog.map(app => {
                  const usage = getAppUsage(app);
                  return (
                    <div key={app.id} className="glass-card execution-app-card">
                      <div className="execution-app-header">
                        <div>
                          <span className="compare-pipeline-kicker">{app.mode === 'Native' ? 'Python / Snowflake SQL' : 'Native + Optional LLM'}</span>
                          <h3>{app.name}</h3>
                        </div>
                        <span className={`execution-mode-pill ${app.mode.toLowerCase()}`}>{app.mode}</span>
                      </div>
                      <div className="execution-token-row">
                        <div><span>LLM Calls</span><strong>{usage.prompt_count}</strong></div>
                        <div><span>Tokens</span><strong>{usage.total_tokens.toLocaleString()}</strong></div>
                        <div><span>Cost</span><strong>${usage.estimated_cost.toFixed(4)}</strong></div>
                      </div>
                      <div className="execution-details-grid">
                        <div><span>Native Python / SQL</span><p>{app.nativeWork}</p></div>
                        <div><span>LLM Usage</span><p>{app.llmWork}</p></div>
                      </div>
                      <div className="execution-operation-list">
                        {(app.llmOps.length ? app.llmOps : ['No LLM operations']).map(op => <span key={op}>{op}</span>)}
                      </div>
                      <p className="execution-note">{app.note}</p>
                    </div>
                  );
                })}
              </div>

              <div className="glass-card execution-events-card">
                <div className="glass-card-header">
                  <span className="glass-card-title"><Terminal size={16} /> Recent LLM Usage Events</span>
                  <span className="status-badge">{aiConfig.usage?.events?.length || 0} shown</span>
                </div>
                {aiConfig.usage?.events?.length ? (
                  <div className="table-container execution-events-table">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Operation</th>
                          <th>Provider</th>
                          <th>Model</th>
                          <th>Prompt</th>
                          <th>Completion</th>
                          <th>Total</th>
                          <th>Cost</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...(aiConfig.usage.events || [])].slice(-50).reverse().map((event, idx) => (
                          <tr key={`${event.timestamp}-${idx}`}>
                            <td>{event.timestamp}</td>
                            <td><span className="status-badge">{event.operation}</span></td>
                            <td>{event.provider}</td>
                            <td>{event.model}</td>
                            <td>{Number(event.prompt_tokens || 0).toLocaleString()}</td>
                            <td>{Number(event.completion_tokens || 0).toLocaleString()}</td>
                            <td>{Number(event.total_tokens || 0).toLocaleString()}</td>
                            <td>${Number(event.estimated_cost || 0).toFixed(4)}</td>
                            <td>{event.response_time_ms} ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">No LLM usage has been recorded yet. Run AI or Compare mode to populate this dashboard.</div>
                )}
              </div>
            </div>
          )}

          {activeTab !== 'chat' && activeTab !== 'executionFootprint' && activeTab !== 'agentCommand' && renderSqlResultsCard()}

          {/* TAB 3: Metadata & Dictionary */}
          {activeTab === 'metadata' && (
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Table search explorer */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh' }}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Database size={16} /> Information Schema</span>
                  </div>
                  <div className="chat-input-container">
                    <input 
                      type="text" 
                      placeholder="Search tables..." 
                      className="chat-input"
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                      value={metadataSearch}
                      onChange={(e) => {
                        setMetadataSearch(e.target.value);
                        fetchMetadata(e.target.value);
                      }}
                    />
                  </div>

                  {loadingMetadata ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
                  ) : (
                    <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {metadataTables.map((table, idx) => (
                        <div 
                          key={idx} 
                          className={`sidebar-item ${selectedTable?.TABLE_NAME === table.TABLE_NAME ? 'active' : ''}`}
                          style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '10px' }}
                          onClick={() => setSelectedTable(table)}
                        >
                          <div style={{ width: '100%' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{table.TABLE_NAME}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{table.ROW_COUNT} rows</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '3px' }}>
                              Schema: {table.TABLE_SCHEMA} | Owner: {table.OWNER}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Table details panel */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {selectedTable ? (
                    <>
                      <div className="glass-card-header" style={{ marginBottom: 0 }}>
                        <div>
                          <h2 style={{ fontSize: '22px', fontFamily: 'Outfit', fontWeight: 700 }}>{selectedTable.TABLE_SCHEMA}.{selectedTable.TABLE_NAME}</h2>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Data Owner: {selectedTable.OWNER} | Storage Size: {(selectedTable.BYTES / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button 
                          className="btn btn-primary btn-small"
                          onClick={() => handleGenerateDataDict(selectedTable)}
                          disabled={dataDictLoading}
                        >
                          {dataDictLoading ? 'Generating AI Descriptions...' : 'AI Auto-Generate Descriptions'}
                        </button>
                      </div>

                      <div className="glass-card" style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '6px' }}>BUSINESS DESCRIPTION / DICTIONARY:</div>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          {selectedTable.DESCRIPTION || 'No database comment exists. Trigger AI Auto-Generate to scan table schema and create a business definition.'}
                        </p>
                        
                        {selectedTable.SOURCE_SYSTEM && (
                          <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <div><strong>Source Feed:</strong> {selectedTable.SOURCE_SYSTEM}</div>
                            <div><strong>ETL Frequency:</strong> {selectedTable.REFRESH_FREQUENCY}</div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>COLUMN SPECIFICATION DETAILS:</div>
                        <div className="table-container">
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Column Name</th>
                                <th>Data Type</th>
                                <th>Nullable</th>
                                <th>Business Description</th>
                                <th>Owner / SLA</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedTable.columns?.map((col, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600 }}>{col.COLUMN_NAME}</td>
                                  <td><span className="status-badge" style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#b4c2f0', border: '1px solid rgba(255,255,255,0.08)' }}>{col.DATA_TYPE}</span></td>
                                  <td>{col.IS_NULLABLE}</td>
                                  <td style={{ whiteSpace: 'normal', fontSize: '12px' }}>{col.DESCRIPTION || '—'}</td>
                                  <td style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{col.DATA_OWNER || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '10px' }}>
                      <Database size={48} style={{ opacity: 0.2 }} />
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>No Table Selected</div>
                      <div style={{ fontSize: '12px' }}>Select a schema object from the sidebar navigation list to inspect attributes and definitions.</div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: Access Explorer */}
          {activeTab === 'governance' && (
            <div className="panel-body">
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card-header" style={{ marginBottom: 0 }}>
                  <span className="glass-card-title"><ShieldAlert size={16} /> Access Control Auditor</span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Enter Table (e.g. CUSTOMER)..." 
                      className="chat-input"
                      style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }}
                      value={governanceTableSearch}
                      onChange={(e) => setGovernanceTableSearch(e.target.value)}
                    />
                    <button className="btn btn-primary btn-small" onClick={fetchGovernance}>
                      Audit Privileges
                    </button>
                  </div>
                </div>

                {loadingGovernance ? (
                  <div style={{ textAlign: 'center', padding: '30px' }}>Analyzing grants...</div>
                ) : (
                  <>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="status-badge" style={{ color: 'var(--accent-cyan)', backgroundColor: 'rgba(0,242,254,0.08)' }}>
                        Auditing table: {governanceTableSearch.toUpperCase()}
                      </div>
                      <div>Total roles granted access: {governanceGrants.filter(g => g.OBJECT_TYPE === 'TABLE').length}</div>
                    </div>

                    <div className="table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Object Type</th>
                            <th>Object Name</th>
                            <th>Role Granted</th>
                            <th>Privilege</th>
                            <th>Granted By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {governanceGrants.map((grant, idx) => (
                            <tr key={idx}>
                              <td>{grant.OBJECT_TYPE}</td>
                              <td style={{ fontWeight: 600 }}>{grant.OBJECT_NAME}</td>
                              <td>
                                <span className="status-badge" style={{ backgroundColor: 'rgba(161,85,254,0.1)', color: 'var(--accent-purple)' }}>
                                  {grant.ROLE}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: grant.PRIVILEGE === 'ALL' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                                {grant.PRIVILEGE}
                              </td>
                              <td>{grant.GRANTED_BY}</td>
                            </tr>
                          ))}
                          {governanceGrants.length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No grants recorded for this schema path.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'incidentCommand' && (
            <div className="panel-body incident-command-page">
              <div className="incident-command-hero">
                <div>
                  <div className="status-badge">Snowflake Incident Management</div>
                  <h2>Operational intelligence from KAGGLE.INCIDENT_MGMT</h2>
                  <p>Reads the loaded Snowflake incident tables for apps, employees, changes, incidents, SLA, business cost, root cause, and comparison mode.</p>
                </div>
                <div className="incident-hero-actions">
                  <button className="btn btn-secondary btn-small" onClick={fetchIncidentCommandDashboard} disabled={incidentCommandLoading}>
                    <RefreshCw size={13} /> {incidentCommandLoading ? 'Refreshing...' : 'Refresh Dashboard'}
                  </button>
                </div>
              </div>

              {incidentCommandData?.error && <div className="empty-state">{incidentCommandData.error}</div>}
              {!incidentCommandData && !incidentCommandLoading && <div className="empty-state">Refresh the Incident Command Center to read the Snowflake dashboard.</div>}

              {incidentCommandData && !incidentCommandData.error && (
                <>
                  <div className="incident-kpi-grid">
                    {[
                      ['Total Incidents', incidentCommandData.summary?.total_incidents?.toLocaleString(), ''],
                      ['Open Incidents', incidentCommandData.summary?.open_incidents?.toLocaleString(), 'orange'],
                      ['Critical', incidentCommandData.summary?.critical_incidents?.toLocaleString(), 'red'],
                      ['Avg Resolution', `${incidentCommandData.summary?.avg_resolution_hours}h`, ''],
                      ['SLA Compliance', `${incidentCommandData.summary?.sla_compliance_pct}%`, 'green'],
                      ['Business Cost', `$${Number(incidentCommandData.summary?.business_cost || 0).toLocaleString()}`, 'purple'],
                    ].map(([label, value, tone]) => (
                      <div className="mini-card" key={label}>
                        <div className="mini-card-title">{label}</div>
                        <span className={`stat-value ${tone}`}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="incident-dashboard-grid">
                    <div className="glass-card incident-chart-card">
                      <div className="glass-card-header"><span className="glass-card-title"><Activity size={16} /> Incident Trend</span></div>
                      {renderSvgLineChart(incidentCommandData.charts?.trend || [], 'label', 'value')}
                    </div>
                    <div className="glass-card incident-chart-card">
                      <div className="glass-card-header"><span className="glass-card-title"><AlertTriangle size={16} /> Priority Distribution</span></div>
                      {renderSvgBarChart(incidentCommandData.charts?.priority || [], 'label', 'value')}
                    </div>
                    <div className="glass-card incident-chart-card">
                      <div className="glass-card-header"><span className="glass-card-title"><Database size={16} /> Root Causes</span></div>
                      {renderSvgBarChart(incidentCommandData.charts?.root_causes || [], 'label', 'value')}
                    </div>
                    <div className="glass-card incident-chart-card">
                      <div className="glass-card-header"><span className="glass-card-title"><Server size={16} /> Top Applications</span></div>
                      {renderSvgBarChart(incidentCommandData.charts?.top_apps || [], 'label', 'value')}
                    </div>
                  </div>

                  <div className="incident-split-grid">
                    <div className="glass-card">
                      <div className="glass-card-header"><span className="glass-card-title"><Sparkles size={16} /> AI Insights</span></div>
                      <div className="incident-insight-list">
                        {(incidentCommandData.insights || []).map((item, idx) => <div className="incident-insight" key={idx}>{item}</div>)}
                      </div>
                      <div className="incident-domain-strip">
                        {incidentCommandData.source && <span>source: <strong>{incidentCommandData.source}</strong></span>}
                        {Object.entries(incidentCommandData.dataset || {}).map(([key, value]) => (
                          <span key={key}>{key.replace('_', ' ')}: <strong>{Number(value).toLocaleString()}</strong></span>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card">
                      <div className="glass-card-header"><span className="glass-card-title"><ShieldAlert size={16} /> Critical Queue</span></div>
                      <div className="incident-critical-list">
                        {(incidentCommandData.recent_critical || []).slice(0, 6).map(row => (
                          <div className="incident-critical-row" key={row.INCIDENT_ID}>
                            <div><strong>{row.INCIDENT_ID}</strong><span>{row.TITLE}</span></div>
                            <span className={`status-badge ${row.SEVERITY === 'Critical' ? 'mock' : ''}`}>{row.SEVERITY}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card incident-query-card">
                    <div className="glass-card-header">
                      <span className="glass-card-title"><MessageSquare size={16} /> Ask Incident Data</span>
                      <div className="status-badge">{aiConfig.processing_mode?.toUpperCase() || 'NATIVE'} Mode</div>
                    </div>
                    <div className="incident-prompt-row">
                      <input
                        className="form-input"
                        value={incidentQuestion}
                        onChange={(e) => setIncidentQuestion(e.target.value)}
                        placeholder="Ask about critical incidents, SLA breaches, root causes, trends, cost, or change-linked incidents"
                      />
                      <button className="btn btn-primary btn-small" onClick={() => runIncidentCommandQuestion()} disabled={incidentQueryLoading || !incidentQuestion.trim()}>
                        <Play size={13} /> {incidentQueryLoading ? 'Running...' : 'Run'}
                      </button>
                    </div>
                    <div className="incident-sample-prompts">
                      {[
                        'Show critical incidents this week',
                        'Which application has the highest incident count?',
                        'Which engineer resolved the most incidents?',
                        'Which applications violate SLA the most?',
                        'Which change requests caused incidents?',
                        'Which applications have the highest operational cost?',
                        'Show incident trend over the last six months'
                      ].map(sample => (
                        <button key={sample} type="button" onClick={() => { setIncidentQuestion(sample); runIncidentCommandQuestion(sample); }}>{sample}</button>
                      ))}
                    </div>
                  </div>

                  {renderSpendAwarePanel(incidentQueryResult?.spend_aware)}

                  {incidentQueryResult?.mode === 'compare' && (
                    <div className="incident-compare-grid">
                      {[
                        ['Native', incidentQueryResult.native],
                        ['AI', incidentQueryResult.ai]
                      ].map(([label, pipeline]) => (
                        <div className="glass-card compare-result-card" key={label}>
                          <div className="glass-card-header">
                            <span className="glass-card-title">{label} Pipeline</span>
                            <span className="status-badge">{pipeline?.execution_time_ms} ms</span>
                          </div>
                          <pre className="code-block compare-code-block">{pipeline?.generated_sql}</pre>
                          <p className="text-secondary">{pipeline?.explanation}</p>
                          {label === 'AI' && (
                            <div className="incident-insight-list compact">
                              {(pipeline?.business_insights || []).map((item, idx) => <div className="incident-insight" key={idx}>{item}</div>)}
                            </div>
                          )}
                          <div className="table-container sql-result-table">
                            <table className="custom-table">
                              <thead><tr>{Object.keys((pipeline?.result_preview || [])[0] || {}).slice(0, 5).map(col => <th key={col}>{col}</th>)}</tr></thead>
                              <tbody>{(pipeline?.result_preview || []).slice(0, 5).map((row, idx) => (
                                <tr key={idx}>{Object.keys(row).slice(0, 5).map(col => <td key={col}>{String(row[col] ?? '')}</td>)}</tr>
                              ))}</tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                      <div className="glass-card incident-compare-summary">
                        <strong>Why AI Helps</strong>
                        <span>{incidentQueryResult.comparison_summary}</span>
                        <span className="status-badge">Recommended: {incidentQueryResult.recommended}</span>
                      </div>
                    </div>
                  )}

                  {incidentQueryResult && incidentQueryResult.mode !== 'compare' && (
                    <div className="incident-query-results">
                      <div className="glass-card">
                        <div className="glass-card-header">
                          <span className="glass-card-title"><Terminal size={16} /> Generated SQL</span>
                          <button className="btn btn-secondary btn-small" onClick={() => handleCopy(incidentQueryResult.generated_sql)}>
                            {copiedQuery === incidentQueryResult.generated_sql ? <Check size={12} /> : <Copy size={12} />} Copy
                          </button>
                        </div>
                        <pre className="code-block">{incidentQueryResult.generated_sql || incidentQueryResult.error}</pre>
                        <p className="text-secondary">{incidentQueryResult.explanation}</p>
                        {incidentQueryResult.business_insights?.length > 0 && (
                          <div className="incident-insight-list compact">
                            {incidentQueryResult.business_insights.map((item, idx) => <div className="incident-insight" key={idx}>{item}</div>)}
                          </div>
                        )}
                      </div>
                      <div className="glass-card">
                        <div className="glass-card-header">
                          <span className="glass-card-title"><Activity size={16} /> Result View</span>
                          <span className="status-badge">{incidentQueryResult.rows_returned || 0} rows</span>
                        </div>
                        {incidentQueryResult.chart?.type === 'bar' && renderSvgBarChart(incidentQueryResult.result_preview || [], incidentQueryResult.chart.x, incidentQueryResult.chart.y)}
                        {incidentQueryResult.chart?.type === 'line' && renderSvgLineChart(incidentQueryResult.result_preview || [], incidentQueryResult.chart.x, incidentQueryResult.chart.y)}
                        {(!incidentQueryResult.chart || incidentQueryResult.chart.type === 'table') && (
                          <div className="table-container sql-result-table">
                            <table className="custom-table">
                              <thead><tr>{Object.keys((incidentQueryResult.result_preview || [])[0] || {}).slice(0, 6).map(col => <th key={col}>{col}</th>)}</tr></thead>
                              <tbody>{(incidentQueryResult.result_preview || []).slice(0, 8).map((row, idx) => (
                                <tr key={idx}>{Object.keys(row).slice(0, 6).map(col => <td key={col}>{String(row[col] ?? '')}</td>)}</tr>
                              ))}</tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 5: Query Cost Analyzer */}
          {activeTab === 'cost' && (
            <div className="panel-body">
              {loadingCost ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Loading Cost Analytics...</div>
              ) : costData?.success === false ? (
                <div className="empty-state">
                  <strong>Cost Analyzer could not load.</strong>
                  <div style={{ marginTop: 8 }}>{costData.error}</div>
                  <button className="btn btn-secondary btn-small" style={{ marginTop: 14 }} onClick={() => fetchCostDashboard(costDateRange, costStartDate, costEndDate)}>
                    <RefreshCw size={13} /> Retry
                  </button>
                </div>
              ) : costData ? (
                <div className="cost-dashboard">
                  <div className={`cost-source-banner ${costData.data_source === 'snowflake' ? 'live' : 'mock'}`}>
                    <div>
                      <strong>{costData.data_source === 'snowflake' ? 'Live Snowflake ACCOUNT_USAGE' : 'Demo / Mock Cost Data'}</strong>
                      <span>{costData.source_message}</span>
                      {costData.query_cost_note && <span>{costData.query_cost_note}</span>}
                    </div>
                    <span className="status-badge">
                      {costData.source_queries?.warehouse_metering || 'Cost source'} | {costData.date_range?.start_date || costStartDate} to {costData.date_range?.end_date || costEndDate}
                    </span>
                  </div>

                  <div className="cost-hero">
                    <div>
                      <div className="mini-card-title">Snowflake Spend Snapshot</div>
                      <div className="cost-hero-value">{formatCredits(costData.summary?.total_credits_used)}</div>
                      <div className="cost-hero-subtitle">
                        Estimated {formatUsd(costData.summary?.estimated_cost_usd)} across {costData.summary?.active_warehouses_count || 0} warehouses and {costData.summary?.query_count || 0} captured queries.
                      </div>
                    </div>
                    <div className="cost-hero-actions">
                      <select className="form-input" value={costDateRange} onChange={(e) => {
                        const nextRange = Number(e.target.value);
                        const nextDates = getRelativeCostRange(nextRange);
                        setCostDateRange(nextRange);
                        setCostStartDate(nextDates.start);
                        setCostEndDate(nextDates.end);
                        fetchCostDashboard(nextRange, nextDates.start, nextDates.end);
                      }}>
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={180}>Last 180 days</option>
                        <option value={365}>Last 365 days</option>
                      </select>
                      <input className="form-input" type="date" value={costStartDate} onChange={(e) => setCostStartDate(e.target.value)} max={costEndDate || undefined} />
                      <input className="form-input" type="date" value={costEndDate} onChange={(e) => setCostEndDate(e.target.value)} min={costStartDate || undefined} />
                      <button className="btn btn-secondary btn-small" onClick={() => fetchCostDashboard(costDateRange, costStartDate, costEndDate)} disabled={loadingCost}>
                        <RefreshCw size={13} /> Apply
                      </button>
                    </div>
                  </div>

                  <div className="cost-kpi-grid">
                    <div className="mini-card">
                      <div className="mini-card-title">Avg Daily Burn</div>
                      <span className="stat-value">{formatCredits(costData.summary?.avg_daily_credits)}</span>
                      <span className="stat-change text-secondary">Across metering window</span>
                    </div>
                    <div className="mini-card">
                      <div className="mini-card-title">Top Warehouse</div>
                      <span className="stat-value green">{costData.summary?.top_warehouse?.warehouse || 'n/a'}</span>
                      <span className="stat-change text-secondary">{costData.summary?.top_warehouse?.share_pct || 0}% of credits</span>
                    </div>
                    <div className="mini-card">
                      <div className="mini-card-title">Compute / Cloud</div>
                      <span className="stat-value purple">{formatCredits(costData.summary?.compute_credits)}</span>
                      <span className="stat-change text-secondary">Cloud services {formatCredits(costData.summary?.cloud_credits)}</span>
                    </div>
                    <div className="mini-card">
                      <div className="mini-card-title">Failed Queries</div>
                      <span className={`stat-value ${costData.summary?.failed_queries ? 'purple' : 'green'}`}>{costData.summary?.failed_queries || 0}</span>
                      <span className="stat-change text-secondary">Avg {formatCredits(costData.summary?.avg_credit_per_query)} per query</span>
                    </div>
                  </div>

                  <div className="glass-card cost-chart-shell">
                    <div className="glass-card-header">
                      <span className="glass-card-title"><DollarSign size={16} /> Interactive Cost View</span>
                      <div className="plot-option-row" style={{ margin: 0 }}>
                        {[
                          ['trend', 'Daily Trend'],
                          ['warehouse', 'Warehouse Share'],
                          ['user', 'User Spend'],
                          ['scatter', 'Runtime vs Credits']
                        ].map(([mode, label]) => (
                          <button key={mode} className={`chip-btn ${costChartMode === mode ? 'active' : ''}`} onClick={() => setCostChartMode(mode)}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {costChartMode === 'trend' && renderCostTrendChart(costData.daily_trend)}
                    {costChartMode === 'warehouse' && renderCostBarChart(costData.warehouse_credits || [], 'warehouse', 'credits')}
                    {costChartMode === 'user' && renderCostBarChart(costData.user_credits || [], 'user', 'credits')}
                    {costChartMode === 'scatter' && renderCostScatterChart(costData.query_scatter || [])}
                  </div>

                  <div className="cost-split-grid">
                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><AlertTriangle size={16} color="var(--accent-orange)" /> Optimization Signals</span>
                      </div>
                      <div className="cost-recommendation-list">
                        {costData.recommendations?.map((rec, idx) => (
                          <div key={idx} className="cost-recommendation">
                            <Info size={16} color="var(--accent-orange)" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><Layers size={16} /> Warehouse Utilization</span>
                      </div>
                      <div className="cost-warehouse-list">
                        {costData.warehouse_credits?.map((row) => (
                          <div key={row.warehouse} className="cost-warehouse-row">
                            <div>
                              <div className="cost-row-title">{row.warehouse}</div>
                              <div className="cost-row-subtitle">{row.queries} queries | avg {row.avg_elapsed_seconds}s | {row.failures} failed</div>
                            </div>
                            <div className="cost-row-meter">
                              <div className="cost-row-meter-fill" style={{ width: `${Math.min(100, row.share_pct || 0)}%` }}></div>
                            </div>
                            <div className="cost-row-value">{formatCredits(row.credits)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card">
                    <div className="glass-card-header">
                      <span className="glass-card-title"><Terminal size={16} /> Most Expensive Queries</span>
                      <div className="plot-option-row" style={{ margin: 0 }}>
                        {['all', 'failed', 'long'].map(filter => (
                          <button key={filter} className={`chip-btn ${costQueryFilter === filter ? 'active' : ''}`} onClick={() => setCostQueryFilter(filter)}>
                            {filter === 'all' ? 'All' : filter === 'failed' ? 'Failed' : 'Long Running'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="custom-table cost-query-table">
                        <thead>
                          <tr>
                            <th>Query ID</th>
                            <th>User</th>
                            <th>Warehouse</th>
                            <th>Status</th>
                            <th>Elapsed</th>
                            <th>Cloud Credits</th>
                            <th>Cloud Cost</th>
                            <th>SQL Preview</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(costData.most_expensive_queries || [])
                            .filter(row => costQueryFilter === 'all' || (costQueryFilter === 'failed' && row.EXECUTION_STATUS === 'FAILED') || (costQueryFilter === 'long' && Number(row.TOTAL_ELAPSED_TIME) >= 120))
                            .map((qRow, idx) => (
                              <tr key={`${qRow.QUERY_ID}-${idx}`}>
                                <td style={{ fontFamily: 'var(--font-family-mono)' }}>{qRow.QUERY_ID}</td>
                                <td>{qRow.USER_NAME}</td>
                                <td>{qRow.WAREHOUSE_NAME}</td>
                                <td><span className={`status-badge ${qRow.EXECUTION_STATUS === 'FAILED' ? 'mock' : ''}`}>{qRow.EXECUTION_STATUS}</span></td>
                                <td>{Number(qRow.TOTAL_ELAPSED_TIME || 0).toFixed(1)}s</td>
                                <td style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>{Number(qRow.CREDITS_USED || 0).toFixed(3)}</td>
                                <td>{formatUsd(qRow.COST_USD)}</td>
                                <td className="cost-sql-cell" title={qRow.QUERY_TEXT}>{qRow.QUERY_TEXT}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 6: Lineage & Impact */}
          {activeTab === 'lineage' && (
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
                
                {/* Impact Analysis Side tool */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><ShieldAlert size={16} /> Downstream Impact Analyzer</span>
                  </div>
                  <div className="form-group">
                    <label>Target Database Object / Column</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ flex: 1 }}
                        value={impactSearch}
                        onChange={(e) => setImpactSearch(e.target.value)}
                      />
                      <button className="btn btn-primary btn-small" onClick={fetchLineage}>
                        Evaluate
                      </button>
                    </div>
                  </div>

                  {impactResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>DOWNSTREAM IMPACT RISK:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                          <span 
                            className="stat-value" 
                            style={{ 
                              fontSize: '32px', 
                              color: impactResult.risk_score >= 8 ? 'var(--accent-red)' : impactResult.risk_score >= 5 ? 'var(--accent-orange)' : 'var(--accent-green)',
                              WebkitTextFillColor: 'initial'
                            }}
                          >
                            {impactResult.risk_score} / 10
                          </span>
                          <span className="status-badge" style={{ 
                            color: impactResult.risk_score >= 8 ? 'var(--accent-red)' : impactResult.risk_score >= 5 ? 'var(--accent-orange)' : 'var(--accent-green)',
                            backgroundColor: impactResult.risk_score >= 8 ? 'rgba(255,82,100,0.1)' : impactResult.risk_score >= 5 ? 'rgba(255,159,67,0.1)' : 'rgba(0,224,150,0.1)'
                          }}>
                            {impactResult.risk_score >= 8 ? 'CRITICAL RISK' : impactResult.risk_score >= 5 ? 'MODERATE RISK' : 'LOW RISK'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>AFFECTED OBJECTS & JOBS:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {impactResult.affected_pipelines?.map((pipe, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '8px 12px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                              {pipe}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lineage Visual DAG */}
                <div className="glass-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><GitBranch size={16} /> Interactive Lineage DAG Map</span>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="dag-node-type-dot source"></div> Stage</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="dag-node-type-dot staging"></div> Staging</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="dag-node-type-dot core"></div> Core</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="dag-node-type-dot analytics"></div> Analytics</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="dag-node-type-dot downstream"></div> Downstream</div>
                    </div>
                  </div>

                  <div className="dag-container">
                    {/* Fixed coordinate layout for a beautiful static visual tree graph */}
                    <div className="dag-node" style={{ left: '20px', top: '160px' }} onClick={() => setSelectedLineageNode('s3_customer')}>
                      <div className="dag-node-type-dot source"></div>
                      <span>s3://company-datalake/</span>
                    </div>

                    <div className="dag-node" style={{ left: '220px', top: '160px' }} onClick={() => setSelectedLineageNode('raw_logins')}>
                      <div className="dag-node-type-dot staging"></div>
                      <span>STAGING.RAW_LOGINS</span>
                    </div>

                    <div className="dag-node" style={{ left: '440px', top: '90px' }} onClick={() => setSelectedLineageNode('customer')}>
                      <div className="dag-node-type-dot core"></div>
                      <span>PUBLIC.CUSTOMER</span>
                    </div>

                    <div className="dag-node" style={{ left: '440px', top: '230px' }} onClick={() => setSelectedLineageNode('orders')}>
                      <div className="dag-node-type-dot core"></div>
                      <span>PUBLIC.ORDERS</span>
                    </div>

                    <div className="dag-node" style={{ left: '680px', top: '60px' }} onClick={() => setSelectedLineageNode('customer_ltv')}>
                      <div className="dag-node-type-dot analytics"></div>
                      <span>ANALYTICS.CUSTOMER_LTV</span>
                    </div>

                    <div className="dag-node" style={{ left: '680px', top: '200px' }} onClick={() => setSelectedLineageNode('monthly_revenue')}>
                      <div className="dag-node-type-dot analytics"></div>
                      <span>ANALYTICS.MONTHLY_REVENUE</span>
                    </div>

                    <div className="dag-node animate-pulse" style={{ left: '920px', top: '130px', border: '1px solid var(--accent-green)' }} onClick={() => setSelectedLineageNode('sales_tableau')}>
                      <div className="dag-node-type-dot downstream"></div>
                      <span>Tableau Revenue Board</span>
                    </div>

                    {/* SVG Connector Lines */}
                    <svg className="dag-svg-links">
                      {/* S3 to Staging */}
                      <path d="M 180 178 L 220 178" className="dag-link-path active" />
                      {/* Staging to Customer */}
                      <path d="M 390 178 L 440 108" className="dag-link-path active" />
                      {/* Customer to LTV */}
                      <path d="M 600 108 L 680 78" className="dag-link-path active" />
                      {/* Orders to LTV */}
                      <path d="M 600 248 L 680 78" className="dag-link-path active" />
                      {/* Orders to monthly revenue */}
                      <path d="M 600 248 L 680 218" className="dag-link-path active" />
                      {/* LTV to Tableau */}
                      <path d="M 865 78 L 920 148" className="dag-link-path active" />
                      {/* Revenue to Tableau */}
                      <path d="M 865 218 L 920 148" className="dag-link-path active" />
                    </svg>
                  </div>
                  
                  {selectedLineageNode && (
                    <div className="glass-card" style={{ marginTop: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Info size={14} color="var(--accent-cyan)" /> Schema Object: {selectedLineageNode.toUpperCase()}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Trace nodes to review upstream databases and pipelines feeding this data node.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: Data Quality */}
          {activeTab === 'quality' && (
            <div className="panel-body">
              {loadingDq ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Evaluating schema quality metrics...</div>
              ) : dqData ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    {/* Gauge chart */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', width: '100%' }}>
                      <div className="glass-card-header" style={{ width: '100%' }}>
                        <span className="glass-card-title"><ShieldCheck size={16} /> Global Quality Score</span>
                      </div>
                      
                      <div className="dq-gauge-container">
                        <div className="dq-gauge">
                          <svg width="140" height="140" className="dq-gauge-svg">
                            <defs>
                              <linearGradient id="dqGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ff5264" />
                                <stop offset="50%" stopColor="#ff9f43" />
                                <stop offset="100%" stopColor="#00e096" />
                              </linearGradient>
                            </defs>
                            <circle cx="70" cy="70" r="58" className="dq-gauge-bg" />
                            <circle 
                              cx="70" 
                              cy="70" 
                              r="58" 
                              className="dq-gauge-fill" 
                              strokeDasharray={`${2 * Math.PI * 58}`}
                              strokeDashoffset={`${2 * Math.PI * 58 * (1 - dqData.quality_score / 100)}`}
                            />
                          </svg>
                          <div className="dq-gauge-val" style={{ color: dqData.quality_score >= 80 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                            {dqData.quality_score}%
                          </div>
                        </div>
                        <div className="text-secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                          Passed {dqData.checks_passed} of {dqData.total_checks_run} automated schema validation checks.
                        </div>
                      </div>
                    </div>

                    {/* Quality summary details */}
                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><AlertTriangle size={16} color="var(--accent-red)" /> Active Schema Anomalies & Drift Warnings</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {dqData.anomalies?.map((an, idx) => (
                          <div key={idx} className="glass-card" style={{ padding: '14px', borderLeft: '3px solid var(--accent-red)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px' }}>{an.TABLE_NAME}.{an.COLUMN_NAME}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Failed Check: {an.CHECK_NAME} | Records scanned: {an.TOTAL_COUNT} | Fault count: {an.FAIL_COUNT}
                              </div>
                            </div>
                            <span className="status-badge" style={{ backgroundColor: 'rgba(255,82,100,0.1)', color: 'var(--accent-red)' }}>
                              FAIL
                            </span>
                          </div>
                        ))}
                        {dqData.anomalies?.length === 0 && (
                          <div className="text-secondary" style={{ fontSize: '12px', textAlign: 'center', padding: '20px' }}>No anomalies detected. Database schema is clean and synchronized!</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DQ Checks tabular layout */}
                  <div className="glass-card">
                    <div className="glass-card-header">
                      <span className="glass-card-title"><Database size={16} /> Complete Quality Audit Logs</span>
                    </div>
                    <div className="table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Table Name</th>
                            <th>Column Checked</th>
                            <th>Check Scope</th>
                            <th>Run Status</th>
                            <th>Audit Count</th>
                            <th>Last Checked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dqData.metrics?.map((check, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{check.TABLE_NAME}</td>
                              <td>{check.COLUMN_NAME}</td>
                              <td>{check.CHECK_NAME}</td>
                              <td>
                                <span className={`status-badge ${check.CHECK_STATUS === 'FAIL' ? 'mock' : ''}`} style={{ color: check.CHECK_STATUS === 'FAIL' ? 'var(--accent-red)' : 'var(--accent-green)', backgroundColor: check.CHECK_STATUS === 'FAIL' ? 'rgba(255,82,100,0.08)' : 'rgba(0,224,150,0.08)' }}>
                                  {check.CHECK_STATUS}
                                </span>
                              </td>
                              <td>{check.TOTAL_COUNT - check.FAIL_COUNT} / {check.TOTAL_COUNT} passed</td>
                              <td>{check.LAST_RUN}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Document Hub */}
          {activeTab === 'rag' && (
            <div className="panel-body document-hub-page" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="glass-card-title"><HelpCircle size={16} /> Document Hub</span>
                  <button 
                    className="btn btn-secondary btn-small"
                    style={{ border: '1px solid rgba(255, 68, 68, 0.4)', color: '#ff4444' }}
                    onClick={handleClearRagDocuments}
                  >
                    Reset RAG Database
                  </button>
                </div>
                
                <form onSubmit={handleRagSearch} style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Ask a question from learned articles, files, JSON, CSV, Excel, or pasted notes..." 
                    className="chat-input"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit" disabled={loadingRag}>
                    {loadingRag ? 'Searching knowledge...' : 'Ask Document Hub'}
                  </button>
                </form>

                <div className="workbench-grid">
                  {[
                    ['Source-grounded answers', 'Answers use indexed chunks and return source snippets for review.'],
                    ['Multi-format learning', 'Learn URLs, pasted text, JSON, CSV, Excel, HTML, SQL, logs, and raw text files.'],
                    ['Useful next steps', 'Add summaries, entity extraction, document comparison, and reusable Q&A history next.']
                  ].map(([title, copy]) => (
                    <div key={title} className="mini-card">
                      <div className="mini-card-title">{title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{copy}</div>
                    </div>
                  ))}
                </div>

                {ragResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                    {/* Citations and Answer */}
                    <div className="glass-card rag-result-card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <Sparkles size={14} color="var(--accent-cyan)" />
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-cyan)' }}>Verified Answer</span>
                      </div>
                      {renderRagAnswer(ragResult.answer)}
                      {renderAiTransparency(ragResult.ai_metadata)}
                      
                      {normalizeRagList(ragResult.citations).length > 0 && (
                        <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <strong>Sources Cited:</strong> {normalizeRagList(ragResult.citations).map((c, i) => (
                            <span key={i} className="status-badge" style={{ marginLeft: '6px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#ffffff', border: '1px solid var(--border-light)' }}>
                              {formatRagCitation(c)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Source Documents */}
                    <div className="rag-source-panel">
                      <button type="button" className="rag-source-toggle" onClick={() => setRagSourcesOpen(prev => !prev)}>
                        <span>Retrieved Knowledge Source Snippets ({normalizeRagList(ragResult.source_chunks).length})</span>
                        <span>{ragSourcesOpen ? 'Hide' : 'Show'}</span>
                      </button>
                      {ragSourcesOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                          {normalizeRagList(ragResult.source_chunks).map((chunk, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '14px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-purple)' }}>
                                <span>{chunk?.TITLE || chunk?.title || chunk?.source || `Source ${idx + 1}`}</span>
                                <span className="status-badge" style={{ fontSize: '9px' }}>{chunk?.SOURCE_TYPE || chunk?.source_type || 'SOURCE'}</span>
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                                {chunk?.CONTENT || chunk?.content || chunk?.text || String(chunk)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Side Panel: Ingest Custom Knowledge Sources */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Layers size={16} /> Batch Ingest</span>
                  </div>
                  <form onSubmit={handleBatchIngest} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Web Page URLs</label>
                      <textarea
                        className="form-input"
                        rows="5"
                        placeholder="Paste one URL per line. You can also separate URLs with commas."
                        value={batchUrls}
                        onChange={(e) => setBatchUrls(e.target.value)}
                        style={{ resize: 'vertical', minHeight: '100px' }}
                      />
                    </div>
                    <div className="crawl-control-grid">
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Crawl Depth</label>
                        <select className="form-input" value={crawlDepth} onChange={(e) => setCrawlDepth(Number(e.target.value))}>
                          <option value={0}>0 - This page only</option>
                          <option value={1}>1 - Direct child links</option>
                          <option value={2}>2 - Child links of child links</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Max Pages Total</label>
                        <select className="form-input" value={crawlMaxPages} onChange={(e) => setCrawlMaxPages(Number(e.target.value))}>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={25}>25</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Shared File Format</label>
                      <select className="form-input" value={documentFormat} onChange={(e) => setDocumentFormat(e.target.value)}>
                        <option value="auto">Auto detect</option>
                        <option value="text">Text / Markdown / SQL / Logs</option>
                        <option value="json">JSON</option>
                        <option value="csv">CSV / TSV</option>
                        <option value="excel">Excel</option>
                        <option value="html">HTML</option>
                        <option value="raw">Raw readable text</option>
                      </select>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.json,.csv,.tsv,.xlsx,.xls,.html,.htm,.sql,.log,.xml,.yaml,.yml"
                      ref={batchFileInputRef}
                      onChange={(e) => setBatchFiles(Array.from(e.target.files || []))}
                      style={{ display: 'none' }}
                    />
                    <button type="button" className="btn btn-secondary btn-small" onClick={() => batchFileInputRef.current?.click()} disabled={ingestingBatch} style={{ width: '100%' }}>
                      {batchFiles.length ? `${batchFiles.length} Files Selected` : 'Select Files'}
                    </button>
                    {batchFiles.length > 0 && (
                      <div className="batch-file-list">
                        {batchFiles.slice(0, 5).map(file => <span key={file.name}>{file.name}</span>)}
                        {batchFiles.length > 5 && <span>+{batchFiles.length - 5} more</span>}
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-small" disabled={ingestingBatch || (!batchUrls.trim() && batchFiles.length === 0)} style={{ width: '100%' }}>
                      {ingestingBatch ? 'Batch Learning...' : 'Ingest URLs + Files'}
                    </button>
                    {batchIngestStatus && (
                      <div style={{ fontSize: '11px', color: batchIngestStatus.startsWith('Success') ? 'var(--accent-green)' : 'var(--accent-orange)', marginTop: '4px' }}>
                        {batchIngestStatus}
                      </div>
                    )}
                    {batchIngestResult?.results?.length > 0 && (
                      <div className="batch-result-list">
                        {batchIngestResult.results.map((item, idx) => (
                          <div key={`${item.source}-${idx}`} className="batch-result-row">
                            <span className={`status-badge ${item.success ? '' : 'mock'}`}>{item.success ? 'OK' : 'FAIL'}</span>
                            <span title={item.source}>{item.source}</span>
                            <strong>{item.success ? `${item.chunks} chunks` : item.error}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </form>
                </div>

                <div className="glass-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Sparkles size={16} /> Learn a Source</span>
                  </div>
                  <form onSubmit={handleIngestDocumentSource} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <div className="plot-option-row" style={{ marginBottom: 0 }}>
                      <span>Source</span>
                      {['web', 'text'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          className={`chip-btn ${documentSourceMode === mode ? 'active' : ''}`}
                          onClick={() => setDocumentSourceMode(mode)}
                        >
                          {mode === 'web' ? 'Web Page' : 'Paste Text'}
                        </button>
                      ))}
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Title</label>
                      <input
                        type="text"
                        placeholder="Optional source title"
                        className="form-input"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                      />
                    </div>
                    {documentSourceMode === 'web' ? (
                      <>
                        <div className="form-group">
                          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Web Page URL</label>
                          <input
                            type="url"
                            placeholder="https://example.com/article"
                            className="form-input"
                            value={documentUrl}
                            onChange={(e) => setDocumentUrl(e.target.value)}
                            required
                          />
                        </div>
                        <div className="crawl-control-grid">
                          <div className="form-group">
                            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Crawl Depth</label>
                            <select className="form-input" value={crawlDepth} onChange={(e) => setCrawlDepth(Number(e.target.value))}>
                              <option value={0}>0 - This page only</option>
                              <option value={1}>1 - Direct child links</option>
                              <option value={2}>2 - Child links of child links</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Max Pages</label>
                            <select className="form-input" value={crawlMaxPages} onChange={(e) => setCrawlMaxPages(Number(e.target.value))}>
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={25}>25</option>
                            </select>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Text / JSON / Notes</label>
                        <textarea
                          className="form-input"
                          rows="7"
                          placeholder="Paste article text, JSON, SQL notes, runbooks, or any readable content"
                          value={documentText}
                          onChange={(e) => setDocumentText(e.target.value)}
                          required
                          style={{ resize: 'vertical', minHeight: '130px' }}
                        />
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-small" disabled={ingestingDocument} style={{ width: '100%' }}>
                      {ingestingDocument ? 'Learning...' : 'Learn Source'}
                    </button>
                    {documentIngestStatus && (
                      <div style={{ fontSize: '11px', color: documentIngestStatus.startsWith('Success') ? 'var(--accent-green)' : 'var(--accent-orange)', marginTop: '4px' }}>
                        {documentIngestStatus}
                      </div>
                    )}
                  </form>
                </div>

                <div className="glass-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><GitBranch size={16} /> Ingest Web Feed (RSS)</span>
                  </div>
                  <form onSubmit={handleIngestFeed} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>RSS Feed URL</label>
                      <input 
                        type="url" 
                        placeholder="https://news.ycombinator.com/rss"
                        className="form-input"
                        value={rssUrl}
                        onChange={(e) => setRssUrl(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Source Name (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="HackerNews"
                        className="form-input"
                        value={rssSourceName}
                        onChange={(e) => setRssSourceName(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-small" disabled={ingestingFeed} style={{ alignSelf: 'flex-start', width: '100%' }}>
                      {ingestingFeed ? 'Fetching & Indexing...' : 'Ingest Feed'}
                    </button>
                    {feedIngestStatus && (
                      <div style={{ fontSize: '11px', color: feedIngestStatus.startsWith('Success') ? 'var(--accent-green)' : 'var(--accent-orange)', marginTop: '4px' }}>
                        {feedIngestStatus}
                      </div>
                    )}
                  </form>
                </div>

                <div className="glass-card">
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Terminal size={16} /> Upload Local File</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Choose a format, upload a local document, and parse it into searchable knowledge chunks.</p>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>File Format</label>
                      <select className="form-input" value={documentFormat} onChange={(e) => setDocumentFormat(e.target.value)}>
                        <option value="auto">Auto detect</option>
                        <option value="text">Text / Markdown / SQL / Logs</option>
                        <option value="json">JSON</option>
                        <option value="csv">CSV / TSV</option>
                        <option value="excel">Excel</option>
                        <option value="html">HTML</option>
                        <option value="raw">Raw readable text</option>
                      </select>
                    </div>
                    <input 
                      type="file" 
                      accept=".txt,.md,.json,.csv,.tsv,.xlsx,.xls,.html,.htm,.sql,.log,.xml,.yaml,.yml"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary btn-small"
                      disabled={uploadingFile}
                      style={{ width: '100%' }}
                    >
                      {uploadingFile ? 'Uploading File...' : 'Select File to Upload'}
                    </button>
                    {fileUploadStatus && (
                      <div style={{ fontSize: '11px', color: fileUploadStatus.startsWith('Success') ? 'var(--accent-green)' : 'var(--accent-orange)', marginTop: '4px' }}>
                        {fileUploadStatus}
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Database size={16} /> Indexed Catalog ({ragDocuments.length})</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ragDocuments.map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '11px' }}>
                        <span style={{ fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={doc.title}>
                          {doc.title}
                        </span>
                        <span className="status-badge" style={{ fontSize: '9px', padding: '2px 6px', height: 'fit-content' }}>
                          {doc.source_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: Incident Investigator */}
          {activeTab === 'incidents' && (
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Incident logs list */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><AlertTriangle size={16} /> Automated Incident Manager</span>
                  </div>

                  <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {incidentsList.map((inc, idx) => (
                      <div 
                        key={idx} 
                        className={`glass-card ${selectedIncident?.INCIDENT_ID === inc.INCIDENT_ID ? 'glow-border' : ''}`}
                        style={{ cursor: 'pointer', padding: '14px', backgroundColor: selectedIncident?.INCIDENT_ID === inc.INCIDENT_ID ? 'rgba(0,149,255,0.05)' : 'var(--bg-card)' }}
                        onClick={() => handleInvestigateIncident(inc)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'var(--font-family-mono)' }}>{inc.INCIDENT_ID}</span>
                          <span className={`status-badge ${inc.STATUS === 'OPEN' ? 'mock' : ''}`} style={{ color: inc.STATUS === 'OPEN' ? 'var(--accent-red)' : 'var(--accent-green)', backgroundColor: inc.STATUS === 'OPEN' ? 'rgba(255,82,100,0.08)' : 'rgba(0,224,150,0.08)' }}>
                            {inc.STATUS}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>{inc.PIPELINE_NAME}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          Error: {inc.ERROR_MESSAGE}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '8px' }}>
                          Logged: {inc.INCIDENT_TIME}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Incident Correlation Report */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Sparkles size={16} color="var(--accent-cyan)" /> Root-Cause Analysis Report</span>
                  </div>

                  {!selectedIncident && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '10px' }}>
                      <AlertTriangle size={32} style={{ opacity: 0.3 }} />
                      <div>Select an active incident from the list to trigger root-cause correlation analysis.</div>
                    </div>
                  )}

                  {investigatingIncident && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                      <RefreshCw size={24} className="status-badge" style={{ animation: 'flowLine 1.5s infinite' }} />
                      <div className="text-secondary" style={{ fontSize: '12px' }}>Querying audit logs and correlating pipeline schedules...</div>
                    </div>
                  )}

                  {selectedIncident && !investigatingIncident && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '480px', paddingRight: '6px' }}>
                      
                      <div className="glass-card" style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '14px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--accent-red)', fontWeight: 600, marginBottom: '4px' }}>TRIGGER PIPELINE ERROR:</div>
                        <p style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--text-primary)' }}>{selectedIncident.ERROR_MESSAGE}</p>
                      </div>

                      {incidentInvestigation ? (
                        <>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '6px' }}>PROBABLE ROOT CAUSE IDENTIFIED:</div>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{incidentInvestigation.root_cause}</p>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>RISK FACTOR SCORE:</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span className="stat-value red" style={{ fontSize: '28px' }}>{incidentInvestigation.risk_score} / 10</span>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>AFFECTED DB PATHS:</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                {incidentInvestigation.affected_objects?.map((obj, i) => (
                                  <span key={i} className="status-badge" style={{ fontSize: '9px' }}>{obj}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '6px' }}>REMEDIATION ACTION ITEMS:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {incidentInvestigation.reremediation_steps?.map((step, idx) => (
                                <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                                  <span>{idx + 1}.</span> <span>{step}</span>
                                </div>
                              )) || incidentInvestigation.remediation_steps?.map((step, idx) => (
                                <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                                  <span>{idx + 1}.</span> <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {selectedIncident.STATUS === 'RESOLVED' && (
                            <div className="glass-card" style={{ borderLeft: '3px solid var(--accent-green)', padding: '12px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>RESOLUTION STATUS:</div>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedIncident.RESOLUTION}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Click "Investigate" to query uvicorn correlation tables.</div>
                      )}

                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* Settings Connection Configuration Modal */}
      {connectionModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleTestConnection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '18px' }}>Database Settings</h2>
              <button 
                type="button" 
                className="btn btn-secondary btn-small"
                onClick={() => setConnectionModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Database Platform</label>
              <select 
                className="form-input database-platform-select" 
                value={connectionConfig.platform}
                onChange={(e) => {
                  const plat = e.target.value;
                  setConnectionConfig({ 
                    ...connectionConfig, 
                    platform: plat, 
                    use_mock: plat === 'MOCK' 
                  });
                }}
              >
                <option value="MOCK">Hackathon Mock Database (Local SQLite)</option>
                <option value="SNOWFLAKE">Snowflake Data Cloud</option>
                <option value="REDSHIFT">Amazon Redshift</option>
                <option value="POSTGRESQL">PostgreSQL Database</option>
              </select>
            </div>

            {connectionConfig.platform === 'SNOWFLAKE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label><Server size={10} style={{ marginRight: '4px' }} /> Snowflake Account URL</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={connectionConfig.account}
                    onChange={(e) => setConnectionConfig({ ...connectionConfig, account: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Authentication Method</label>
                  <select 
                    className="form-input snowflake-auth-method-select" 
                    value={connectionConfig.auth_method}
                    onChange={(e) => setConnectionConfig({ 
                      ...connectionConfig, 
                      auth_method: e.target.value, 
                      use_sso: e.target.value === 'SSO' 
                    })}
                  >
                    <option value="PASSWORD">Snowflake (Password)</option>
                    <option value="SSO">Snowflake (SSO / External Browser)</option>
                    <option value="OAUTH_TOKEN">Snowflake (JWT / Passkey Token)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><User size={10} style={{ marginRight: '4px' }} /> User Login</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={connectionConfig.user}
                      onChange={(e) => setConnectionConfig({ ...connectionConfig, user: e.target.value })}
                    />
                  </div>
                  {connectionConfig.auth_method === 'PASSWORD' && (
                    <div className="form-group">
                      <label><Key size={10} style={{ marginRight: '4px' }} /> Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={connectionConfig.password}
                        onChange={(e) => setConnectionConfig({ ...connectionConfig, password: e.target.value })}
                      />
                    </div>
                  )}
                  {connectionConfig.auth_method === 'OAUTH_TOKEN' && (
                    <div className="form-group">
                      <label><Key size={10} style={{ marginRight: '4px' }} /> Passkey / JWT Token</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Paste eyJ..."
                        value={connectionConfig.token}
                        onChange={(e) => setConnectionConfig({ ...connectionConfig, token: e.target.value })}
                      />
                    </div>
                  )}
                </div>

              </div>
            )}

            {(connectionConfig.platform === 'REDSHIFT' || connectionConfig.platform === 'POSTGRESQL') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label><Server size={10} style={{ marginRight: '4px' }} /> Host URL / Endpoint</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={connectionConfig.platform === 'REDSHIFT' ? 'my-cluster.redshift.amazonaws.com' : 'localhost'}
                    value={connectionConfig.host}
                    onChange={(e) => setConnectionConfig({ ...connectionConfig, host: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Port</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder={connectionConfig.platform === 'REDSHIFT' ? '5439' : '5432'}
                      value={connectionConfig.port}
                      onChange={(e) => setConnectionConfig({ ...connectionConfig, port: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Database Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={connectionConfig.platform === 'REDSHIFT' ? 'dev' : 'postgres'}
                      value={connectionConfig.database}
                      onChange={(e) => setConnectionConfig({ ...connectionConfig, database: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><User size={10} style={{ marginRight: '4px' }} /> Username</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={connectionConfig.user}
                      onChange={(e) => setConnectionConfig({ ...connectionConfig, user: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label><Key size={10} style={{ marginRight: '4px' }} /> Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={connectionConfig.password}
                      onChange={(e) => setConnectionConfig({ ...connectionConfig, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {connectionStatus.message && (
              <div
                className={`connection-test-status ${connectionStatus.status}`}
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${connectionStatus.status === 'connected' ? 'rgba(0,224,150,0.35)' : connectionStatus.status === 'connecting' ? 'rgba(0,242,254,0.35)' : connectionStatus.status === 'disconnected' ? 'rgba(169,184,216,0.22)' : 'rgba(255,82,100,0.35)'}`,
                  background: connectionStatus.status === 'connected' ? 'rgba(0,224,150,0.08)' : connectionStatus.status === 'connecting' ? 'rgba(0,242,254,0.08)' : connectionStatus.status === 'disconnected' ? 'rgba(255,255,255,0.035)' : 'rgba(255,82,100,0.08)',
                  color: connectionStatus.status === 'connected' ? 'var(--accent-green)' : connectionStatus.status === 'connecting' ? 'var(--accent-cyan)' : connectionStatus.status === 'disconnected' ? 'var(--text-secondary)' : 'var(--accent-red)',
                  fontSize: '12px',
                  lineHeight: 1.45
                }}
              >
                <strong>{connectionStatus.status === 'connecting' ? 'Testing connection' : connectionStatus.status === 'connected' ? 'Connection ready' : connectionStatus.status === 'disconnected' ? 'Connection yet to be established' : 'Connection failed'}</strong>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-word' }}>{connectionStatus.message}</div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '16px' }}
            >
              Apply Settings and Test Connection
            </button>
          </form>
        </div>
      )}

      {/* Reset RAG Confirmation Modal */}
      {confirmResetOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '18px', marginBottom: '12px' }}>Reset RAG Knowledge Base?</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
              This will clear all custom ingested website feeds and uploaded files, restoring the database to default runbooks and schemas.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => setConfirmResetOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary btn-small"
                style={{ backgroundColor: '#ff4444', border: '1px solid #ff4444', color: '#ffffff' }}
                onClick={async () => {
                  setConfirmResetOpen(false);
                  try {
                    const res = await fetch(`${API_BASE}/api/rag/documents/clear`, {
                      method: 'POST'
                    });
                    const data = await res.json();
                    if (data.success) {
                      fetchRagDocuments();
                    }
                  } catch (err) {
                    console.error("Error clearing RAG documents:", err);
                  }
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
