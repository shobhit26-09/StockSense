import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpRight, BookOpen, RefreshCw, Search, ShieldCheck, Star, X } from 'lucide-react';
import PremiumNavbar from '@/components/PremiumNavbar';
import Seo from '@/components/Seo';
import { loadWatchlistState, normalizeSymbol, saveWatchlist, subscribeWatchlist, WATCHLIST_KEY, WATCHLIST_EVENT } from '@/lib/watchlist';
import { searchStocks } from '@/services/stockSearchService';
import { fetchMultipleQuotesRacing } from '@/services/multiSourceDataService';
import { emptyResearch, exportResearch, quoteState, quoteDeadline, readResearch, writeResearch, parseResearchBackup, restoreResearchBackup, MAX_RESEARCH_BACKUP_BYTES, archivedResearch } from '@/lib/research.js';
import './research.css';

const money = value => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export default function ResearchPage() {
  const [initial] = useState(() => loadWatchlistState());
  const [stored] = useState(() => readResearch({ getItem: key => localStorage.getItem(key) }));
  const [symbols, setSymbols] = useState(initial.symbols), [watchError, setWatchError] = useState(initial.error);
  const [notes, setNotes] = useState(stored.notes), [noteError, setNoteError] = useState(stored.error);
  const [quotes, setQuotes] = useState(new Map()), [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(''), [selected, setSelected] = useState(initial.symbols[0] || ''), [filter, setFilter] = useState('all');
  const [archiveQuery, setArchiveQuery] = useState('');
  const [now, setNow] = useState(Date.now());
  const request = useRef(0), importRead = useRef(0), detail = useRef(null);
  function openNotebook(symbol) { setSelected(symbol); requestAnimationFrame(() => { detail.current?.focus({ preventScroll: true }); detail.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }); }
  const [pendingImport, setPendingImport] = useState(null), [importError, setImportError] = useState(''), [importMessage, setImportMessage] = useState('');
  const matches = query.trim() ? searchStocks(query, 6) : [];
  useEffect(() => subscribeWatchlist(() => { const state = loadWatchlistState(); setSymbols(state.symbols); setWatchError(state.error); }), []);
  useEffect(() => { if (!symbols.includes(selected) && !notes[selected]) setSelected(symbols[0] || Object.keys(notes).sort()[0] || ''); }, [symbols, selected, notes]);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    if (!symbols.length) { setQuotes(new Map()); setLoading(false); return; }
    setLoading(true);
    try { const result = await quoteDeadline(fetchMultipleQuotesRacing(symbols, 8000), new Map()); if (request.current === current) setQuotes(result); }
    catch { if (request.current === current) setQuotes(new Map()); }
    finally { if (request.current === current) { setNow(Date.now()); setLoading(false); } }
  }, [symbols]);
  useEffect(() => { refresh(); return () => { request.current++; }; }, [refresh]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  function updateList(next) { setSymbols(next); try { saveWatchlist(next); setWatchError(''); } catch { setWatchError('Watchlist changes are not saved. Download your research before reloading.'); } }
  function add(raw) {
    const symbol = normalizeSymbol(raw);
    if (!/^[A-Z0-9&^._-]{1,40}$/.test(symbol)) { setWatchError('Choose a symbol from the results, or enter a valid NSE/BSE ticker.'); return; }
    if (symbols.includes(symbol)) { setSelected(symbol); setQuery(''); return; }
    if (symbols.length >= 30) { setWatchError('Your watchlist has 30 stocks. Remove one before adding another.'); return; }
    updateList([...symbols, symbol]); setSelected(symbol); setQuery('');
  }
  const note = notes[selected] || emptyResearch();
  function edit(change) { if (!notes[selected] && Object.keys(notes).length >= 200) { setNoteError('This notebook has reached 200 companies. Download your research before starting a new notebook.'); return; } const next = { ...notes, [selected]: { ...note, ...change } }; setNotes(next); setNoteError(writeResearch({ setItem: (key, value) => localStorage.setItem(key, value) }, next)); }
  function download() { const url = URL.createObjectURL(new Blob([exportResearch(symbols, notes, quotes)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'stocksense-research.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  async function chooseBackup(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const current = ++importRead.current; setPendingImport(null); setImportError(''); setImportMessage('');
    try {
      if (file.size > MAX_RESEARCH_BACKUP_BYTES) throw new Error('Choose a StockSense research backup smaller than 4 MB.');
      const backup = parseResearchBackup(await file.text());
      if (current === importRead.current) setPendingImport(backup);
    } catch (error) { if (current === importRead.current) setImportError(error.message || 'The backup could not be read. Your notebook has not changed.'); }
  }
  function confirmRestore() {
    if (!pendingImport) return;
    request.current++; setLoading(false); setQuotes(new Map());
    const warning = restoreResearchBackup({ getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value), removeItem: key => localStorage.removeItem(key) }, pendingImport, WATCHLIST_KEY);
    setSymbols(pendingImport.symbols); setNotes(pendingImport.notes); setSelected(pendingImport.symbols[0] || ''); setFilter('all'); setQuery(''); setWatchError(''); setNoteError(warning); setPendingImport(null);
    if (!warning) window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT));
    setImportMessage(warning ? '' : 'Notebook restored on this device. Quotes will be requested again, not restored from the backup.');
  }
  const archived = archivedResearch(symbols, notes);
  const archiveMatches = archivedResearch(symbols, notes, archiveQuery);
  const outsideWatchlist = !!selected && !symbols.includes(selected);
  const quote = outsideWatchlist ? null : quotes.get(selected), state = quoteState(quote, now);
  const visible = symbols.filter(symbol => filter === 'all' || (notes[symbol]?.status || 'researching') === filter);
  const company = selected ? searchStocks(selected.replace(/\.(NS|BO)$/, ''), 6).find(item => item.symbol === selected) : null;
  return <div className="researchPage min-h-screen bg-background text-foreground"><Seo title="Your research workspace | StockSense" description="A browser-local watchlist and research notebook with quote-source states, useful next questions and no trade execution." path="/research" /><PremiumNavbar /><main className="researchMain">
    <header className="researchHeading"><div><p className="researchEyebrow"><BookOpen size={14}/> YOUR RESEARCH WORKSPACE</p><h1>Know why it's on your list.</h1><p>Save a stock. Record the reason. Keep the next question in view, without confusing a market move with a decision.</p></div><div className="researchBackupActions"><label className="researchButton researchRestoreLabel">Restore research<input type="file" accept=".json,application/json" aria-label="Choose StockSense research backup" onChange={chooseBackup}/></label><button className="researchButton" onClick={download} disabled={!symbols.length && !Object.keys(notes).length}><ArrowDownToLine size={15}/> Download research</button></div></header>
    {importError && <p role="alert" className="researchWarning">{importError}</p>}
    {importMessage && <p role="status" className="researchImportStatus">{importMessage}</p>}
    {pendingImport && <section className="researchImportReview" aria-labelledby="restore-title"><h2 id="restore-title">Replace this notebook?</h2><p>This backup contains {pendingImport.symbols.length} watchlist stocks and {Object.keys(pendingImport.notes).length} sets of notes, including any saved for stocks outside the watchlist. It will replace this device's watchlist and research notes. Download your current research first if you want to keep it.</p><p>Imported prices are not treated as current quotes. New quotes will be requested from the providers.</p><div><button className="researchButton" onClick={() => { importRead.current++; setPendingImport(null); }}>Cancel restore</button><button className="researchButton" onClick={confirmRestore}>Replace notebook</button></div></section>}
    <div className="researchNotice"><ShieldCheck size={17}/><p>Research only. No orders or broker connection. Free feeds may be delayed; received time is not exchange trade time. Your notes and watchlist stay in this browser, not in your account.</p></div>
    {(watchError || noteError) && <div role="alert" className="researchWarning">{watchError && <p>{watchError}</p>}{noteError && <p>{noteError}</p>}</div>}
    <div className="researchGrid"><aside className="researchList" aria-labelledby="research-list-title"><div className="researchListHead"><h2 id="research-list-title">Your watchlist <span>{symbols.length}/30</span></h2><button onClick={refresh} disabled={loading || !symbols.length} aria-label="Refresh watchlist quotes"><RefreshCw size={15} className={loading ? 'researchSpinning' : ''}/></button></div>
      <form className="researchSearch" onSubmit={event => { event.preventDefault(); if (matches.length) add(matches[0].symbol); else add(query); }}><label htmlFor="research-symbol">Find a company or ticker</label><div><Search size={15}/><input id="research-symbol" value={query} onChange={event => setQuery(event.target.value)} placeholder="Company or NSE/BSE ticker" autoComplete="off"/><button type="submit">Add</button></div></form>
      {matches.length > 0 && <ul className="researchSuggestions" aria-label="Matching companies">{matches.map(item => <li key={item.symbol}><button onClick={() => add(item.symbol)}><b>{item.name}</b><span>{item.symbol} · {item.exchange}</span></button></li>)}</ul>}
      <label className="researchFilter" htmlFor="research-stage-filter"><span>Research stage</span><select id="research-stage-filter" aria-label="Research stage" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All stocks</option><option value="researching">Researching</option><option value="review">Needs review</option><option value="parked">Parked</option></select></label>
      <div className="researchStocks">{visible.map(symbol => { const q = quotes.get(symbol), source = quoteState(q, now); return <div key={symbol} className={`researchStock ${symbol === selected ? 'selected' : ''}`}><button className="researchStockPick" onClick={() => setSelected(symbol)} aria-pressed={symbol === selected}><span><b>{symbol.replace(/\.(NS|BO)$/, '')}</b><small>{({ researching: 'Researching', review: 'Needs review', parked: 'Parked' })[notes[symbol]?.status || 'researching']}</small></span><span className="researchStockQuote"><b>{source.display ? money(q.price) : loading ? 'Loading…' : 'Unavailable'}</b><small>{source.display && Number.isFinite(q.changePercent) ? `${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%` : source.label}</small></span></button><button className="researchRemove" aria-label={`Remove ${symbol} from watchlist`} onClick={() => updateList(symbols.filter(item => item !== symbol))}><X size={13}/></button></div>; })}</div>
      {!visible.length && <div className="researchListEmpty"><Star size={22}/><h3>{symbols.length ? 'No stocks at this stage.' : 'Make this list yours.'}</h3><p>{symbols.length ? 'Choose All stocks to see the whole list.' : 'Search for a company above. Nothing is added until you choose it.'}</p>{symbols.length > 0 && <button onClick={() => setFilter('all')}>Show all stocks</button>}</div>}
      {archived.length > 0 && <section className="researchArchive" aria-labelledby="archived-title"><h3 id="archived-title">Saved notes outside your watchlist <span>{archived.length}</span></h3><p>Removing a stock does not remove its research. Open a notebook here without requesting quotes or adding it back.</p><label htmlFor="archive-search">Find saved notes<input id="archive-search" value={archiveQuery} onChange={event => setArchiveQuery(event.target.value)} placeholder="Search saved ticker" /></label><ul aria-label="Saved notebooks outside watchlist">{archiveMatches.map(symbol => <li key={symbol}><button onClick={() => openNotebook(symbol)} aria-pressed={selected === symbol}><b>{symbol}</b><small>{({ researching: 'Researching', review: 'Needs review', parked: 'Parked' })[notes[symbol].status]}</small></button></li>)}</ul>{!archiveMatches.length && <p>No saved ticker matches. Clear the search to see all notebooks.</p>}</section>}
      <p className="researchLocal">Saved on this device. Removing a stock keeps its notes for when you add it again.</p></aside>
      {selected ? <section className="researchDetail" ref={detail} tabIndex={-1} aria-labelledby="research-company"><div className="researchCompany"><div><span className="researchSymbol">{selected}</span><h2 id="research-company">{company?.name || selected.replace(/\.(NS|BO)$/, '')}</h2><p>{company?.sector || 'Company research'}</p></div><Link className="researchButton" to={`/stock/${encodeURIComponent(selected)}`}>Open analysis <ArrowUpRight size={15}/></Link></div>
        {outsideWatchlist && <div className="researchArchivedNotice"><div><h3>Saved notebook, not a watched stock.</h3><p>You can review and edit these notes. No quote is requested for this ticker until you add it to the watchlist.</p></div><button className="researchButton" disabled={symbols.length >= 30} onClick={() => add(selected)}>Add back to watchlist</button>{symbols.length >= 30 && <p>Your watchlist has 30 stocks. Remove one before adding this ticker back.</p>}</div>}
        <div className={`researchQuotePanel ${state.display ? '' : 'unavailable'}`}><div><span>REFERENCE QUOTE</span><strong>{outsideWatchlist ? 'Not watching this ticker' : state.display ? money(quote.price) : loading ? 'Loading quote…' : 'No sourced quote available'}</strong><p>{outsideWatchlist ? 'Notes are available without a price feed' : state.label}</p></div><dl><dt>Source reported</dt><dd>{state.source}</dd><dt>Received on this device</dt><dd>{state.receivedAt ? new Date(state.receivedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not available'}</dd><dt>Exchange trade time</dt><dd>Not supplied by this feed</dd></dl></div>
        <div className="researchNotesHead"><h3>Your research, in your words.</h3><label>Stage<select value={note.status} onChange={event => edit({ status: event.target.value })}><option value="researching">Researching</option><option value="review">Needs review</option><option value="parked">Parked</option></select></label></div>
        <label className="researchNote"><span>Why is this company on your list?</span><small>A business fact, question or source worth checking. Not a price target generated for you.</small><textarea maxLength={1500} value={note.thesis} onChange={event => edit({ thesis: event.target.value })} placeholder="What do you want to understand about the business?"/></label>
        <label className="researchNote"><span>What could change your view?</span><small>Write down the risk or missing evidence before the next headline arrives.</small><textarea maxLength={1500} value={note.risk} onChange={event => edit({ risk: event.target.value })} placeholder="Which assumption needs the most scrutiny?"/></label>
        <label className="researchNote"><span>What will you check next?</span><small>For example, a result announcement, company filing or source figure to verify.</small><textarea maxLength={1500} value={note.next} onChange={event => edit({ next: event.target.value })} placeholder="Leave yourself a specific next step."/></label>
        <p className="researchNoteFooter">{noteError ? 'Not saved. Download a copy before leaving.' : 'Notes save on this device as you type.'} Downloads contain your private notes. Review them before sharing.</p>
      </section> : <section className="researchWelcome"><span className="researchWelcomeIcon"><BookOpen size={30}/></span><p className="researchEyebrow">FROM WATCHING TO UNDERSTANDING</p><h2>A useful place to return to.</h2><p>Your watchlist should be more than changing numbers. Choose a company, record what you need to learn, and leave yourself a clear next step.</p><div><span>01</span><p><b>Choose a company.</b> Search by name or ticker. No stocks are preselected for you.</p></div><div><span>02</span><p><b>Keep evidence separate from opinion.</b> Quote availability and provider source are shown beside your own notes.</p></div><div><span>03</span><p><b>Come back with a question.</b> Save your next check and download a copy before switching devices.</p></div><Link to="/screener">Explore the screener <ArrowUpRight size={14}/></Link></section>}
    </div><p className="researchDisclaimer">StockSense does not provide investment advice. This workspace does not assess suitability, recommend a trade or guarantee data accuracy. Verify important facts with the exchange or issuer.</p>
  </main></div>;
                                                                                 }
