import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  MessageSquare, Terminal, Database, ShieldAlert, DollarSign, 
  GitBranch, ShieldCheck, HelpCircle, AlertTriangle, Play, 
  RefreshCw, Layers, Copy, Check, Info, Server, Wifi, 
  Search, AlertCircle, Sparkles, Send, Settings, User, Key, ChevronRight
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8000';


function SearchableSelect({ value, onChange, options, placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 220 });

  const updatePos = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const DROPDOWN_WIDTH = Math.max(rect.width, 280);
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
    <div className="searchable-select-container">
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
              maxHeight: `calc(100vh - ${dropdownPos.top + 16}px)`,
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
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: value === '' ? '#00b4ff' : 'rgba(255,255,255,0.5)',
                  background: value === '' ? 'rgba(0,149,255,0.1)' : 'transparent',
                  fontWeight: value === '' ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
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
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    color: value === opt ? '#00b4ff' : '#c8d0e0',
                    background: value === opt ? 'rgba(0,149,255,0.12)' : 'transparent',
                    fontWeight: value === opt ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
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
  const [activeTab, setActiveTab] = useState('chat');
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
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
    status: 'connected',
    message: 'Connected to Snowflake.',
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

  const loadDatabases = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/databases`);
      const data = await res.json();
      const dbs = data.databases || [];
      setDatabases(dbs);
      let defaultDb = '';
      let defaultSchema = '';
      if (dbs.length > 0) {
        defaultDb = dbs.includes('DEMO_DB') ? 'DEMO_DB' : dbs[0];
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
      }
      await loadRoles();
      await loadWarehouses();
      await fetchMetadata('', defaultDb || null, defaultSchema || null);
      await fetchGovernance(defaultDb || null);
      await loadChatSamples(defaultDb || null, defaultSchema || null);
    } catch (err) {
      console.error('Error fetching databases:', err);
    }
  };

  const loadSchemas = async (dbName) => {
    try {
      const res = await fetch(`${API_BASE}/api/schemas?database=${dbName}`);
      const data = await res.json();
      const schs = data.schemas || [];
      setSchemas(schs);
      if (schs.length > 0) {
        let defaultSch = schs.includes('PUBLIC') ? 'PUBLIC' : schs[0];
        setActiveSchema(defaultSch);
        await loadTables(dbName, defaultSch, activeType);
      } else {
        setSchemas([]);
        setTables([]);
        setActiveSchema('');
        setActiveTable('');
      }
    } catch (err) {
      console.error('Error fetching schemas:', err);
    }
  };

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
  };

  // State for Chat Copilot
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'ai', 
      text: 'Hello! I am your Data Pilot Copilot. Ask me anything in plain English. Select a Table from the header to see suggested queries tailored to your data.',
      samples: []
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [executingChatQuery, setExecutingChatQuery] = useState(false);
  const [chatResults, setChatResults] = useState(null);
  const [chatSqlExecuting, setChatSqlExecuting] = useState('');

  // State for SQL Optimizer
  const [sqlQuery, setSqlQuery] = useState(
    'SELECT * FROM LINEITEM l\nJOIN ORDERS o ON l.order_id = o.order_id\nWHERE o.order_date > \'2023-01-01\';'
  );
  const [sqlOptimization, setSqlOptimization] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

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

  // State for Lineage & Impact
  const [lineageData, setLineageData] = useState(null);
  const [impactSearch, setImpactSearch] = useState('CUSTOMER');
  const [impactResult, setImpactResult] = useState(null);
  const [loadingLineage, setLoadingLineage] = useState(false);
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
  const [ingestingFeed, setIngestingFeed] = useState(false);
  const [feedIngestStatus, setFeedIngestStatus] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadStatus, setFileUploadStatus] = useState('');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [activeRole, setActiveRole] = useState('');
  const [activeWarehouse, setActiveWarehouse] = useState('');

  // State for Incident Investigator
  const [incidentsList, setIncidentsList] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentInvestigation, setIncidentInvestigation] = useState(null);
  const [investigatingIncident, setInvestigatingIncident] = useState(false);

  // Utility copy ref
  const [copiedQuery, setCopiedQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadChatSamples = async (dbName, schemaName, tableName) => {
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
  };

  useEffect(() => {
    // Initial data load
    loadDatabases();
    fetchCostDashboard();
    fetchLineage();
    fetchDqDashboard();
    fetchIncidents();
    fetchRagDocuments();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(text);
    setTimeout(() => setCopiedQuery(''), 2000);
  };

  // Connection testing
  const handleTestConnection = async (e) => {
    e.preventDefault();
    setConnectionStatus({ status: 'connecting', message: 'Testing server connection...', mode: 'PENDING' });
    try {
      const res = await fetch(`${API_BASE}/api/connection/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionConfig)
      });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus({
          status: 'connected',
          message: data.message,
          mode: data.mode
        });
        setConnectionModalOpen(false);
        loadDatabases(); // Fetch database scoping list on connection load
      } else {
        if (data.mode && data.mode.endsWith('_FALLBACK')) {
          setConnectionStatus({
            status: 'connected',
            message: data.message,
            mode: data.mode
          });
          setConnectionModalOpen(false);
          loadDatabases(); // Fetch database scoping list for fallback engine
        } else {
          setConnectionStatus({
            status: 'disconnected',
            message: data.message,
            mode: 'MOCK_FALLBACK'
          });
        }
      }
    } catch (err) {
      setConnectionStatus({
        status: 'disconnected',
        message: 'Could not connect to FastAPI server. Ensure backend is running.',
        mode: 'OFFLINE'
      });
    }
  };

  // Send message to Copilot chat
  const handleSendChatMessage = async (textToSend) => {
    const text = textToSend || currentMessage;
    if (!text.trim()) return;

    if (!textToSend) {
      setCurrentMessage('');
    }

    // Add user message
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatMessages(prev => [...prev, { sender: 'ai', text: 'Processing your request with Data Pilot AI...', loading: true }]);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          database: activeDb,
          schema_name: activeSchema,
          table_name: activeTable || null
        })
      });
      const data = await res.json();
      
      setChatMessages(prev => {
        const updated = [...prev];
        // Replace loading message
        updated[updated.length - 1] = {
          sender: 'ai',
          text: data.reply,
          sql: data.sql,
          visualization: data.visualization
        };
        return updated;
      });
    } catch (err) {
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

  // Execute Generated SQL from Chat Bubble
  const handleExecuteChatSql = async (sqlString) => {
    setExecutingChatQuery(true);
    setChatSqlExecuting(sqlString);
    setChatResults(null);
    try {
      const res = await fetch(`${API_BASE}/api/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlString })
      });
      const data = await res.json();
      if (data.success) {
        setChatResults(data);
      } else {
        setChatResults({ success: false, error: data.error });
      }
    } catch (err) {
      setChatResults({ success: false, error: 'Network communication failure with uvicorn server.' });
    }
    setExecutingChatQuery(false);
  };

  // SQL Optimizer
  const handleOptimizeSql = async () => {
    setOptimizing(true);
    setSqlOptimization(null);
    try {
      const res = await fetch(`${API_BASE}/api/sql/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });
      const data = await res.json();
      setSqlOptimization(data);
    } catch (err) {
      console.error(err);
    }
    setOptimizing(false);
  };

  // Metadata operations
  const fetchMetadata = async (searchVal = '', dbName = null, schemaName = null) => {
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
  };

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
  const fetchGovernance = async (dbName = null) => {
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
  };

  // Cost Dashboard fetch
  const fetchCostDashboard = async () => {
    setLoadingCost(true);
    try {
      const res = await fetch(`${API_BASE}/api/cost/dashboard`);
      const data = await res.json();
      setCostData(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingCost(false);
  };

  // Lineage fetch
  const fetchLineage = async () => {
    setLoadingLineage(true);
    try {
      const res = await fetch(`${API_BASE}/api/lineage?object_name=${impactSearch}`);
      const data = await res.json();
      setLineageData(data);
      if (data.impact) {
        setImpactResult(data.impact);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingLineage(false);
  };

  // DQ Dashboard fetch
  const fetchDqDashboard = async () => {
    setLoadingDq(true);
    try {
      const res = await fetch(`${API_BASE}/api/quality/dashboard`);
      const data = await res.json();
      setDqData(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingDq(false);
  };

  // RAG Search fetch
  const handleRagSearch = async (e) => {
    if (e) e.preventDefault();
    if (!ragQuery.trim()) return;
    setLoadingRag(true);
    try {
      const res = await fetch(`${API_BASE}/api/rag/search?query=${encodeURIComponent(ragQuery)}`);
      const data = await res.json();
      setRagResult(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingRag(false);
  };

  const fetchRagDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/rag/documents`);
      const data = await res.json();
      setRagDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching RAG documents:', err);
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
    } catch (err) {
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
    } catch (err) {
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
  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const res = await fetch(`${API_BASE}/api/incidents`);
      const data = await res.json();
      setIncidentsList(data.incidents || []);
    } catch (err) {
      console.error(err);
    }
    setLoadingIncidents(false);
  };

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

  const getKeyValue = (obj, key) => {
    if (!obj || !key) return '';
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? obj[foundKey] : '';
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
            className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} />
            <span>AI Chat Copilot</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'sql' ? 'active' : ''}`}
            onClick={() => setActiveTab('sql')}
          >
            <Terminal size={16} />
            <span>SQL Explainer / Tuning</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'metadata' ? 'active' : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            <Database size={16} />
            <span>Metadata & Dictionary</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'governance' ? 'active' : ''}`}
            onClick={() => setActiveTab('governance')}
          >
            <ShieldAlert size={16} />
            <span>Access Explorer</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'cost' ? 'active' : ''}`}
            onClick={() => setActiveTab('cost')}
          >
            <DollarSign size={16} />
            <span>Query Cost Analyzer</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'lineage' ? 'active' : ''}`}
            onClick={() => setActiveTab('lineage')}
          >
            <GitBranch size={16} />
            <span>Lineage & Impact</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'quality' ? 'active' : ''}`}
            onClick={() => setActiveTab('quality')}
          >
            <ShieldCheck size={16} />
            <span>Data Quality Copilot</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'rag' ? 'active' : ''}`}
            onClick={() => setActiveTab('rag')}
          >
            <HelpCircle size={16} />
            <span>Documentation Hub</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={16} />
            <span>Incident Investigator</span>
          </div>
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
            className="btn btn-secondary btn-small" 
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
                {activeTab === 'chat' && 'AI Chat Copilot'}
                {activeTab === 'sql' && 'SQL Explainer & Performance Tuning'}
                {activeTab === 'metadata' && 'Metadata Discovery & AI Dictionary'}
                {activeTab === 'governance' && 'Access Control & Privilege Audit'}
                {activeTab === 'cost' && 'Snowflake Query Cost Analyzer'}
                {activeTab === 'lineage' && 'Data Lineage & Downstream Impact'}
                {activeTab === 'quality' && 'Automated Data Quality Copilot'}
                {activeTab === 'rag' && 'Operational Knowledge & RAG search'}
                {activeTab === 'incidents' && 'Incident Investigation Dashboard'}
              </h1>
              <p>
                {activeTab === 'chat' && 'Query enterprise databases in plain English.'}
                {activeTab === 'sql' && 'Explain, identify inefficiencies, and auto-tune queries.'}
                {activeTab === 'metadata' && 'Search Information Schema and auto-document tables/columns.'}
                {activeTab === 'governance' && 'Audit who has access and track SELECT privileges.'}
                {activeTab === 'cost' && 'Track credit consumption, metering trends, and expensive runs.'}
                {activeTab === 'lineage' && 'Explore upstream source feeds and estimate column dependency risk.'}
                {activeTab === 'quality' && 'Null checks, duplication metrics, and global database quality logs.'}
                {activeTab === 'rag' && 'Index and query operational manuals, runbooks, and architectures.'}
                {activeTab === 'incidents' && 'Correlate pipeline failures, query logs, and database errors.'}
              </p>
            </div>

            <div className="connection-pill" onClick={() => setConnectionModalOpen(true)}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: connectionStatus.status === 'connected' 
                  ? (connectionStatus.mode.endsWith('_FALLBACK') ? 'var(--accent-orange)' : 'var(--accent-green)') 
                  : 'var(--accent-orange)' 
              }}></div>
              <span style={{ fontWeight: 600 }}>
                {connectionStatus.status === 'connected' 
                  ? (connectionStatus.mode === 'MOCK' 
                      ? 'Mock DB Connected' 
                      : connectionStatus.mode.endsWith('_FALLBACK')
                        ? `${connectionStatus.mode.replace('_FALLBACK', '')} (Fallback)`
                        : `${connectionStatus.mode} Connected`)
                  : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="scoping-selectors">
            {(connectionStatus.mode === 'MOCK' || connectionStatus.mode.startsWith('SNOWFLAKE')) && (
              <>
                <SearchableSelect 
                  value={activeRole}
                  onChange={handleRoleChange}
                  options={roles}
                  placeholder="Select Role"
                  label="ROLE"
                />
                
                <SearchableSelect 
                  value={activeWarehouse}
                  onChange={handleWarehouseChange}
                  options={warehouses}
                  placeholder="Select Warehouse"
                  label="WH"
                />
              </>
            )}

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
        </header>

        {/* Tab Rendering Switch */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          
          {/* TAB 1: AI Chat Copilot */}
          {activeTab === 'chat' && (
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
                        <div className="code-container" style={{ marginTop: '12px', border: '1px solid var(--border-glow)' }}>
                          <div className="code-header">
                            <span>GENERATED {connectionStatus.mode === 'MOCK' ? 'DATABASE' : connectionStatus.mode.replace('_FALLBACK', '')} SQL</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
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
                                onClick={() => handleExecuteChatSql(msg.sql)}
                              >
                                <Play size={8} /> Execute
                              </button>
                            </div>
                          </div>
                          <div className="code-block">{msg.sql}</div>
                        </div>
                      )}

                      {msg.visualization && msg.visualization.type !== 'none' && (
                        <div className="glass-card" style={{ marginTop: '12px', padding: '14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '10px', textTransform: 'uppercase' }}>
                            Auto-Generated Visual: {msg.visualization.type} chart
                          </div>
                          {msg.visualization.type === 'bar' && chatResults && chatResults.success && 
                            renderSvgBarChart(chatResults.data, msg.visualization.x.toUpperCase(), msg.visualization.y.toUpperCase())
                          }
                          {msg.visualization.type === 'line' && chatResults && chatResults.success && 
                            renderSvgLineChart(chatResults.data, msg.visualization.x.toUpperCase(), msg.visualization.y.toUpperCase())
                          }
                          {msg.visualization.type === 'pie' && chatResults && chatResults.success && 
                            renderSvgBarChart(chatResults.data, msg.visualization.x.toUpperCase(), msg.visualization.y.toUpperCase()) // Fallback pie layout
                          }
                          {!chatResults && (
                            <div className="text-secondary" style={{ fontSize: '11px' }}>
                              Click "Execute" on SQL above to render this visualization dynamically.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                  <div className="chat-input-container">
                    <input 
                      type="text" 
                      placeholder="Ask a question in plain business English... (e.g. Show customer count by state)" 
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="status-badge" style={{ width: '100%', justifyContent: 'center' }}>
                        Source: {chatResults.source} | Status: Success | {chatResults.row_count} Rows Returned
                      </div>
                      
                      {chatResults.success ? (
                        <div className="table-container">
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

          {/* TAB 2: SQL Explainer / Performance Tuning */}
          {activeTab === 'sql' && (
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Query Input */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="glass-card-header">
                    <span className="glass-card-title"><Terminal size={16} /> SQL Input Console</span>
                    <button className="btn btn-primary btn-small" onClick={handleOptimizeSql} disabled={optimizing}>
                      {optimizing ? 'Analyzing Query...' : 'Optimize & Explain SQL'}
                    </button>
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
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-red)', marginBottom: '6px' }}>INEFFICIENCIES DETECTED:</div>
                        <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {sqlOptimization.inefficiencies.map((item, idx) => (
                            <li key={idx} style={{ listStyleType: 'square' }}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '6px' }}>OPTIMIZATION RECOMMENDATIONS:</div>
                        <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {sqlOptimization.recommendations.map((item, idx) => (
                            <li key={idx} style={{ listStyleType: 'disc' }}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="code-header" style={{ color: 'var(--accent-cyan)' }}>OPTIMIZED SQL SUGGESTION</div>
                        <div className="code-container" style={{ margin: 0 }}>
                          <button 
                            className="btn btn-secondary btn-small"
                            style={{ position: 'absolute', right: '10px', top: '10px', padding: '2px 6px' }}
                            onClick={() => handleCopy(sqlOptimization.optimized_sql)}
                          >
                            {copiedQuery === sqlOptimization.optimized_sql ? 'Copied!' : 'Copy'}
                          </button>
                          <div className="code-block">{sqlOptimization.optimized_sql}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Metadata & Dictionary */}
          {activeTab === 'metadata' && (
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', flex: 1, height: 'calc(100vh - 170px)', overflow: 'hidden' }}>
                
                {/* Table search explorer */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
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
                <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
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

          {/* TAB 5: Query Cost Analyzer */}
          {activeTab === 'cost' && (
            <div className="panel-body">
              {loadingCost ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Loading Cost Analytics...</div>
              ) : costData ? (
                <>
                  <div className="stat-grid">
                    <div className="glass-card stat-card">
                      <span className="stat-label">Total Credit Consumption (7 Days)</span>
                      <span className="stat-value purple">{costData.total_credits_used} Credits</span>
                      <span className="stat-change text-secondary">Equivalent to ~${(costData.total_credits_used * 3.00).toFixed(2)} USD</span>
                    </div>

                    <div className="glass-card stat-card">
                      <span className="stat-label">Active Warehouse Clusters</span>
                      <span className="stat-value">{costData.active_warehouses_count} WHs</span>
                      <span className="stat-change">All configured with auto-suspend</span>
                    </div>

                    <div className="glass-card stat-card">
                      <span className="stat-label">Average Warehouse Efficiency</span>
                      <span className="stat-value green">88.4%</span>
                      <span className="stat-change">Optimal cluster execution time</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Compute Billing trend */}
                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><DollarSign size={16} /> Daily Credit Trend</span>
                      </div>
                      <div className="chart-container">
                        {renderSvgLineChart(costData.daily_trend, 'date', 'credits')}
                      </div>
                    </div>

                    {/* Warehouse Breakdown */}
                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><Layers size={16} /> Warehouse Breakdown</span>
                      </div>
                      <div className="chart-container">
                        {renderSvgBarChart(costData.warehouse_credits, 'warehouse', 'credits')}
                      </div>
                    </div>
                  </div>

                  {/* Expensive queries and suggestions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="glass-card-header">
                        <span className="glass-card-title"><AlertTriangle size={16} color="var(--accent-orange)" /> Cost Optimization Recommendations</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {costData.recommendations?.map((rec, idx) => (
                          <div key={idx} className="glass-card" style={{ padding: '12px', borderLeft: '3px solid var(--accent-orange)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Info size={16} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
                            <div style={{ fontSize: '12px' }}>{rec}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card">
                      <div className="glass-card-header">
                        <span className="glass-card-title"><Terminal size={16} /> Top Most Expensive Queries</span>
                      </div>
                      <div className="table-container">
                        <table className="custom-table" style={{ fontSize: '11px' }}>
                          <thead>
                            <tr>
                              <th>Query ID</th>
                              <th>User</th>
                              <th>Warehouse</th>
                              <th>Elapsed</th>
                              <th>Credits</th>
                            </tr>
                          </thead>
                          <tbody>
                            {costData.most_expensive_queries?.map((qRow, idx) => (
                              <tr key={idx}>
                                <td style={{ fontFamily: 'var(--font-family-mono)' }}>{qRow.QUERY_ID}</td>
                                <td>{qRow.USER_NAME}</td>
                                <td>{qRow.WAREHOUSE_NAME}</td>
                                <td>{qRow.TOTAL_ELAPSED_TIME.toFixed(1)}s</td>
                                <td style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{qRow.CREDITS_USED.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </>
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

          {/* TAB 8: Documentation Hub (RAG) */}
          {activeTab === 'rag' && (
            <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'stretch' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'auto' }}>
                <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="glass-card-title"><HelpCircle size={16} /> Data Architecture Knowledge Base</span>
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
                    placeholder="Ask standard engineering questions... (e.g. How is customer data loaded?)" 
                    className="chat-input"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit" disabled={loadingRag}>
                    {loadingRag ? 'Searching Vector Space...' : 'Query Repository'}
                  </button>
                </form>

                {ragResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                    {/* Citations and Answer */}
                    <div className="glass-card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <Sparkles size={14} color="var(--accent-cyan)" />
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-cyan)' }}>Verified Answer</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.5' }}>{ragResult.answer}</p>
                      
                      {ragResult.citations?.length > 0 && (
                        <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <strong>Sources Cited:</strong> {ragResult.citations.map((c, i) => (
                            <span key={i} className="status-badge" style={{ marginLeft: '6px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#ffffff', border: '1px solid var(--border-light)' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Source Documents */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>RETRIEVED KNOWLEDGE SOURCE SNIPPETS:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {ragResult.source_chunks?.map((chunk, idx) => (
                          <div key={idx} className="glass-card" style={{ padding: '14px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--accent-purple)' }}>
                              <span>{chunk.TITLE}</span>
                              <span className="status-badge" style={{ fontSize: '9px' }}>{chunk.SOURCE_TYPE}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>{chunk.CONTENT}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Side Panel: Ingest Custom Knowledge Sources */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Upload TXT, MD, JSON, or CSV document and parse it into searchable knowledge chunks.</p>
                    <input 
                      type="file" 
                      accept=".txt,.md,.json,.csv"
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
                
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
                className="form-input" 
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
                    className="form-input" 
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
