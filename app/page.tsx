'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Plus, ShieldCheck, Sparkles, Trash2, Download, LockKeyhole, CloudOff, Upload, Save } from 'lucide-react';
import { db, type ReportRecord } from '@/lib/db';

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
    const allowed = /\.(txt|md|csv)$/i.test(file.name) || ['text/plain', 'text/csv', 'text/markdown'].includes(file.type);
    if (!allowed) {
      setImportError('This starter supports TXT, Markdown, and CSV. DOCX/PDF import is planned.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImportError('The file exceeds the 10 MB import limit.');
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) setImportError('The selected file is empty.');
      else {
        setSourceText(previous => previous.trim() ? previous + '\n\n--- Imported: ' + file.name + ' ---\n\n' + text : text);
        setNotice('Imported ' + file.name + '. Save the report to keep it in this browser.');
      }
    } catch {
      setImportError('Could not read this file. Try saving it as UTF-8 text or CSV.');
    }
    if (fileInput.current) fileInput.current.value = '';
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

          <div className="privacy-note"><ShieldCheck size={19} /><div><strong>Private by default</strong><span>Reports are stored in this browser only. AI generation is not connected yet. When enabled, selected text will be sent to the provider you choose.</span></div></div>

          <div className="editor-card">
            <div className="card-heading"><div><span className="step">01</span><h2>Source material</h2></div><span className="small-muted">Paste notes or transcript</span></div>
            <div className="source-label-row">
              <label htmlFor="source">Interview notes, transcript, or existing report</label>
              <button className="secondary-button import-button" onClick={() => fileInput.current?.click()}><Upload size={15} /> Import TXT / MD / CSV</button>
              <input ref={fileInput} type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" hidden onChange={event => void importSource(event.target.files?.[0])} />
            </div>
            <textarea id="source" className="source-input" placeholder="Paste your interview notes or transcript here…" value={sourceText} onChange={event => setSourceText(event.target.value)} />
            <div className="source-meta">{sourceText.length.toLocaleString()} characters · Maximum imported file size 10 MB</div>
            {importError && <p className="error-note" role="alert">{importError}</p>}

            <div className="card-heading report-heading"><div><span className="step">02</span><h2>Report editor</h2></div><span className="small-muted">Editable draft</span></div>
            <label htmlFor="title">Report title</label>
            <input id="title" className="title-input" value={title} onChange={event => setTitle(event.target.value)} />
            <label htmlFor="report">Report content</label>
            <textarea id="report" className="report-input" value={reportText} onChange={event => setReportText(event.target.value)} />
            <div className="actions"><button className="primary-button" onClick={() => void save()}><Save size={16} /> Save locally</button><button className="secondary-button" onClick={downloadMarkdown}><Download size={16} /> Export draft (.md)</button><span className="save-notice" role="status">{notice}</span></div>
          </div>

          <div className="coming-soon"><div className="coming-icon"><Sparkles size={18} /></div><div><strong>Next up: AI provider connections and document exports</strong><p>We’ll add supported provider authorization, safe document import, and DOCX/PDF export. No cloud database or hidden paid fallback.</p></div></div>
          <footer>Built for field researchers, enumerators, students, NGOs, journalists, and independent consultants.</footer>
        </div>
      </section>
    </main>
  );
}
