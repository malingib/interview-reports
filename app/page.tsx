'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Plus, ShieldCheck, Sparkles, Trash2, Download, LockKeyhole, CloudOff, Upload, Save, WandSparkles } from 'lucide-react';
import { db, type ReportRecord } from '@/lib/db';
import { extractFileText, exportDocx, exportPdf } from '@/lib/document-tools';

const starter = `# Interview report

## Executive summary
To be completed from the source material.

## Background and objectives
Not provided.

## Methodology
Not provided.

## Findings and observations
Add source-supported findings here.

## Evidence and quotations
Add exact quotations or references to source passages.

## Challenges
Not provided.

## Conclusions
To be completed.

## Recommendations
To be completed based on verified findings.

## Limitations and missing information
List any gaps, contradictions, or uncertainties.`;

export default function Home() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled interview report');
  const [sourceText, setSourceText] = useState('');
  const [reportText, setReportText] = useState(starter);
  const [notice, setNotice] = useState('Your work is stored in this browser.');
  const [importError, setImportError] = useState('');
  const [provider, setProvider] = useState<'platform' | 'gemini' | 'openai' | 'groq'>('platform');
  const [generating, setGenerating] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function refresh() {
    if (!db) return;
    setReports(await db.reports.orderBy('updatedAt').reverse().toArray());
  }

  useEffect(() => { void refresh(); }, []);

  async function save() {
    if (!db) { setNotice('Local database is not available in this browser.'); return; }
    const now = new Date().toISOString();
    const previous = reports.find(r => r.id === activeId);
    const item: ReportRecord = {
      id: activeId ?? crypto.randomUUID(),
      title: title.trim() || 'Untitled interview report',
      sourceText,
      reportText,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now
    };
    await db.reports.put(item);
    setActiveId(item.id);
    setNotice('Saved locally in this browser. Nothing was uploaded.');
    await refresh();
  }

  function openReport(item: ReportRecord) {
    setActiveId(item.id);
    setTitle(item.title);
    setSourceText(item.sourceText);
    setReportText(item.reportText);
    setNotice('Opened a report saved in this browser.');
  }

  function newReport() {
    setActiveId(null);
    setTitle('Untitled interview report');
    setSourceText('');
    setReportText(starter);
    setNotice('New local draft.');
    setImportError('');
  }

  async function removeReport(id: string) {
    if (!db || !window.confirm('Delete this report from this browser? This cannot be undone.')) return;
    await db.reports.delete(id);
    if (activeId === id) newReport();
    await refresh();
    setNotice('Report deleted from this browser.');
  }

  async function importSource(file?: File) {
    setImportError('');
    if (!file) return;
    try {
      const text = await extractFileText(file);
      setSourceText(previous => previous.trim() ? previous + '\n\n--- Imported: ' + file.name + ' ---\n\n' + text : text);
      setNotice('Imported ' + file.name + '. Save the report to keep it in this browser.');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read this file.');
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  async function generateReport() {
    if (!sourceText.trim()) { setNotice('Add or import source material before generating a report.'); return; }
    if (sourceText.trim().length < 20) { setNotice('Please provide at least 20 characters of source material.'); return; }
    if (sourceText.length > 40_000) { setNotice('For this first version, AI input is limited to 40,000 characters.'); return; }
    setGenerating(true);
    setNotice('Sending source text to the selected AI provider. Review sensitive information before continuing.');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, sourceText, title, currentReport: reportText, task: 'generate' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI generation failed.');
      setReportText(data.report);
      setNotice('Draft generated with ' + data.provider + '. Review all facts and quotations before using it.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not generate the report.');
    } finally {
      setGenerating(false);
    }
  }

  function downloadMarkdown() {
    const blob = new Blob([ '# ' + title + '\n\n' + reportText ], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = (title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'interview-report') + '.md';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><FileText size={21} /></div><div><strong>Interview Reports</strong><span>Local-first workspace</span></div></div>
        <button className="new-button" onClick={newReport}><Plus size={17} /> New report</button>
        <div className="side-label">YOUR REPORTS <span>{reports.length}</span></div>
        <div className="report-list">
          {reports.length === 0 ? <p className="empty-list">Your saved reports will appear here.</p> : reports.map(item => (
            <div className={'report-item ' + (activeId === item.id ? 'selected' : '')} key={item.id}>
              <button className="report-open" onClick={() => openReport(item)}><FileText size={16} /><span>{item.title}</span></button>
              <button className="icon-button" aria-label={'Delete ' + item.title} onClick={() => void removeReport(item.id)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="sidebar-foot"><LockKeyhole size={15} /><span>Saved on this device</span></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="crumb">Workspace <span>/</span> Report editor</div><div className="local-pill"><CloudOff size={14} /> No cloud storage</div></header>
        <div className="content">
          <div className="intro">
            <div className="eyebrow"><Sparkles size={14} /> INTERVIEW REPORT BUILDER</div>
            <h1>Turn raw notes into<br /><em>clear, useful reports.</em></h1>
            <p>Organize interview notes and transcripts into a structured report. Keep control of your files and save drafts in this browser.</p>
          </div>

          <div className="privacy-note"><ShieldCheck size={19} /><div><strong>Private by default</strong><span>Drafts stay in this browser. AI generation sends the source text to the selected provider through this app server. Do not submit sensitive information unless you are comfortable with the provider&apos;s terms.</span></div></div>

          <div className="editor-card">
            <div className="card-heading"><div><span className="step">01</span><h2>Source material</h2></div><span className="small-muted">Paste notes or transcript</span></div>
            <div className="source-label-row">
              <label htmlFor="source">Interview notes, transcript, or existing report</label>
              <button className="secondary-button import-button" onClick={() => fileInput.current?.click()}><Upload size={15} /> Import document</button>
              <input ref={fileInput} type="file" accept=".txt,.md,.csv,.docx,.pdf,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={event => void importSource(event.target.files?.[0])} />
            </div>
            <textarea id="source" className="source-input" placeholder="Paste your interview notes or transcript here…" value={sourceText} onChange={event => setSourceText(event.target.value)} />
            <div className="source-meta">{sourceText.length.toLocaleString()} characters · Maximum imported file size 10 MB</div>
            {importError && <p className="error-note" role="alert">{importError}</p>}

            <div className="ai-controls">
              <div className="card-heading"><div><span className="step">AI</span><h2>Generate report</h2></div><span className="small-muted">No automatic paid fallback</span></div>
              <label htmlFor="provider">AI provider</label>
              <select id="provider" className="title-input" value={provider} onChange={event => setProvider(event.target.value as typeof provider)}>
                <option value="platform">Platform AI (configured free provider)</option>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI API (not ChatGPT consumer sign-in)</option>
                <option value="groq">Groq API</option>
              </select>
              <p className="small-muted">The deployment administrator must configure provider credentials on the server. Your own provider password or API key is never requested here. A free allowance depends on the provider and its current limits.</p>
              <button className="primary-button" disabled={generating || !sourceText.trim()} onClick={() => void generateReport()}><WandSparkles size={16} /> {generating ? 'Generating…' : 'Generate from source'}</button>
            </div>

            <div className="card-heading report-heading"><div><span className="step">02</span><h2>Report editor</h2></div><span className="small-muted">Editable draft</span></div>
            <label htmlFor="title">Report title</label>
            <input id="title" className="title-input" value={title} onChange={event => setTitle(event.target.value)} />
            <label htmlFor="report">Report content</label>
            <textarea id="report" className="report-input" value={reportText} onChange={event => setReportText(event.target.value)} />
            <div className="actions"><button className="primary-button" onClick={() => void save()}><Save size={16} /> Save locally</button><button className="secondary-button" onClick={downloadMarkdown}><Download size={16} /> Markdown</button><button className="secondary-button" onClick={() => void exportDocx(title, reportText)}><Download size={16} /> DOCX</button><button className="secondary-button" onClick={() => exportPdf(title, reportText)}><Download size={16} /> PDF</button><span className="save-notice" role="status">{notice}</span></div>
          </div>

          <div className="coming-soon"><div className="coming-icon"><ShieldCheck size={18} /></div><div><strong>Review before sharing</strong><p>AI output can contain errors. Verify every claim against the source notes. This version uses server-configured provider credentials; it does not connect a user’s personal consumer account automatically.</p></div></div>
          <footer>Built for field researchers, enumerators, students, NGOs, journalists, and independent consultants.</footer>
        </div>
      </section>
    </main>
  );
}
