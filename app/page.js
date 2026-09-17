"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  RefreshCw,
  Mail,
  MailOpen,
  Sparkles,
  Search,
  ArrowLeft,
  ExternalLink,
  Clock3,
  ShieldCheck,
  WandSparkles
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://aixi-temp-mail.airaexiyu.workers.dev";

const DEFAULT_DOMAIN = "akunlama.com";

function cleanEmail(value) {
  return String(value || "").trim().replace(/^@/, "");
}

function getEmailUsername(email) {
  return cleanEmail(email).split("@")[0];
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

async function api(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    cache: "no-store"
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status === "error") {
    throw new Error(payload.message || "API request failed");
  }

  return payload;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const username = useMemo(() => getEmailUsername(email), [email]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const copyText = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      showNotice(label);
    } catch {
      setError("Clipboard tidak tersedia di browser ini.");
    }
  };

  const generateEmail = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelected(null);

    try {
      const result = await api("/api/gen");
      const generated = result?.data?.email;

      if (!generated) throw new Error("Respons generate email tidak valid.");

      setEmail(generated);
      setMessages([]);
      showNotice("Alamat email baru dibuat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const useCustomEmail = async (event) => {
    event.preventDefault();
    const value = customName.trim();

    if (!value) {
      setError("Masukkan username terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setSelected(null);

    try {
      const result = await api(`/api/use?user=${encodeURIComponent(value)}`);
      const generated = result?.data?.email;

      if (!generated) throw new Error("Respons custom email tidak valid.");

      setEmail(generated);
      setMessages([]);
      showNotice("Custom mailbox aktif");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshInbox = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError("");

    try {
      const result = await api(`/api/inbox?user=${encodeURIComponent(username)}`);
      setMessages(Array.isArray(result.messages) ? result.messages : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const readMessage = async (message) => {
    if (!username || !message) return;

    setReading(true);
    setError("");

    try {
      const result = await api(
        `/api/read?user=${encodeURIComponent(username)}&index=${encodeURIComponent(
          message.id || message.index
        )}`
      );

      setSelected(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setReading(false);
    }
  };

  useEffect(() => {
    if (!email) return;
    refreshInbox();
  }, [email, refreshInbox]);

  useEffect(() => {
    if (!autoRefresh || !email) return undefined;

    const timer = window.setInterval(() => {
      refreshInbox();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [autoRefresh, email, refreshInbox]);

  const filteredMessages = messages.filter((message) => {
    const value = `${message.from || ""} ${message.subject || ""}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  return (
    <main className="site-shell">
      <div className="backdrop" />

      <section className="content">
        <header className="topbar">
          <div className="brand-mark">
            <div className="brand-icon">
              <Mail size={19} />
            </div>
            <div>
              <div className="brand-name">AIXI</div>
              <div className="brand-subtitle">TEMP MAIL</div>
            </div>
          </div>

          <div className="status-pill">
            <span className="status-dot" />
            ONLINE
          </div>
        </header>

        <section className="hero">
          <div className="eyebrow">
            <Sparkles size={14} />
            PRIVATE DISPOSABLE MAILBOX
          </div>
          <h1>
            Your temporary
            <br />
            <span>digital identity.</span>
          </h1>
          <p>
            Buat alamat email sementara untuk kebutuhan verifikasi dan inbox
            singkat tanpa memenuhi email utama kamu.
          </p>
        </section>

        <section className="mailbox-card glass-card">
          <div className="card-heading">
            <div>
              <span className="mini-label">ACTIVE MAILBOX</span>
              <h2>{email || "Belum ada email"}</h2>
            </div>
            <div className="shield">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="mailbox-actions">
            <button
              className="primary-button"
              onClick={generateEmail}
              disabled={loading}
            >
              <WandSparkles size={17} />
              {loading ? "Processing..." : "Generate Email"}
            </button>

            <button
              className="secondary-button"
              onClick={() => copyText(email, "Email berhasil disalin")}
              disabled={!email}
              aria-label="Copy email"
            >
              <Copy size={17} />
              Copy
            </button>
          </div>

          <form className="custom-form" onSubmit={useCustomEmail}>
            <div className="input-wrap">
              <span className="input-prefix">@</span>
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="custom-username"
                autoComplete="off"
              />
              <span className="domain-suffix">{DEFAULT_DOMAIN}</span>
            </div>
            <button className="icon-button" disabled={loading} title="Use custom email">
              <ArrowLeft size={17} />
            </button>
          </form>

          <div className="card-footer">
            <span>
              <Clock3 size={14} />
              Inbox auto-refresh 10s
            </span>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
              />
              <span className="toggle" />
            </label>
          </div>
        </section>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="error-box">{error}</div>}

        <section className="inbox-section glass-card">
          {selected ? (
            <div className="reader">
              <button className="back-button" onClick={() => setSelected(null)}>
                <ArrowLeft size={16} />
                Back to inbox
              </button>

              <div className="reader-heading">
                <span className="mini-label">MESSAGE DETAIL</span>
                <h2>{selected.subject || "(No Subject)"}</h2>
                <p>{selected.from || "Unknown sender"}</p>
                <small>{formatDate(selected.date)}</small>
              </div>

              {selected.otp && (
                <div className="otp-box">
                  <span>Possible OTP</span>
                  <strong>{selected.otp}</strong>
                  <button onClick={() => copyText(selected.otp, "OTP disalin")}>
                    <Copy size={15} />
                  </button>
                </div>
              )}

              {Array.isArray(selected.links) && selected.links.length > 0 && (
                <div className="links-box">
                  <h3>Detected links</h3>
                  {selected.links.map((link) => (
                    <a href={link} target="_blank" rel="noreferrer" key={link}>
                      <ExternalLink size={14} />
                      {link}
                    </a>
                  ))}
                </div>
              )}

              <article className="email-body">
                <pre>{selected.text || "No readable text found."}</pre>
              </article>
            </div>
          ) : (
            <>
              <div className="section-heading">
                <div>
                  <span className="mini-label">YOUR INBOX</span>
                  <h2>Incoming messages</h2>
                </div>
                <button
                  className="refresh-button"
                  onClick={refreshInbox}
                  disabled={!email || loading}
                  title="Refresh inbox"
                >
                  <RefreshCw size={17} className={loading ? "spin" : ""} />
                </button>
              </div>

              <div className="inbox-tools">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search sender or subject..."
                />
              </div>

              {!email ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Mail size={25} />
                  </div>
                  <h3>No active mailbox</h3>
                  <p>Tekan Generate Email untuk mulai menerima pesan.</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <MailOpen size={25} />
                  </div>
                  <h3>Inbox masih kosong</h3>
                  <p>Pesan baru akan muncul otomatis ketika tersedia.</p>
                </div>
              ) : (
                <div className="message-list">
                  {filteredMessages.map((message) => (
                    <button
                      className="message-row"
                      key={`${message.id || "message"}-${message.index}`}
                      onClick={() => readMessage(message)}
                      disabled={reading}
                    >
                      <div className="sender-avatar">
                        {(message.from || "?").replace(/<.*?>/g, "").trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="message-main">
                        <strong>{message.from || "Unknown sender"}</strong>
                        <span>{message.subject || "(No Subject)"}</span>
                        <small>{formatDate(message.date)}</small>
                      </div>
                      <ArrowLeft className="message-arrow" size={16} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <footer className="footer">
          <span>© {new Date().getFullYear()} AIXI CODEX</span>
          <span>BUILT FOR MOBILE</span>
        </footer>
      </section>
    </main>
  );
}