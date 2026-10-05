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
  WandSparkles,
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

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function api(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status === "error") {
    throw new Error(payload.message || "API request failed");
  }

  return payload;
}

export default function Home() {
  // =========================
  // ACTIVE MAILBOX
  // =========================

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

  // =========================
  // INBOX CHECKER
  // =========================

  const [checkerEmail, setCheckerEmail] = useState("");
  const [checkerMessages, setCheckerMessages] = useState([]);
  const [checkerSelected, setCheckerSelected] = useState(null);

  const [checkerLoading, setCheckerLoading] = useState(false);
  const [checkerReading, setCheckerReading] = useState(false);
  const [checkerError, setCheckerError] = useState("");

  const username = useMemo(
    () => getEmailUsername(email),
    [email]
  );

  // =========================
  // NOTICE
  // =========================

  const showNotice = useCallback((message) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 2400);
  }, []);

  // =========================
  // COPY
  // =========================

  const copyText = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      showNotice(label);
    } catch {
      setError("Clipboard tidak tersedia di browser ini.");
    }
  };

  // =========================
  // GENERATE EMAIL
  // =========================

  const generateEmail = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelected(null);

    try {
      const result = await api("/api/gen");

      const generated = result?.data?.email;

      if (!generated) {
        throw new Error("Respons generate email tidak valid.");
      }

      setEmail(generated);
      setMessages([]);

      showNotice("Alamat email baru dibuat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  // =========================
  // CUSTOM EMAIL
  // =========================

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
      const result = await api(
        `/api/use?user=${encodeURIComponent(value)}`
      );

      const generated = result?.data?.email;

      if (!generated) {
        throw new Error("Respons custom email tidak valid.");
      }

      setEmail(generated);
      setMessages([]);

      showNotice("Custom mailbox aktif");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // REFRESH ACTIVE INBOX
  // =========================

  const refreshInbox = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError("");

    try {
      const result = await api(
        `/api/inbox?user=${encodeURIComponent(username)}`
      );

      setMessages(
        Array.isArray(result.messages)
          ? result.messages
          : []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // =========================
  // READ ACTIVE MESSAGE
  // =========================

  const readMessage = async (message) => {
    if (!username || !message) return;

    setReading(true);
    setError("");

    try {
      const messageIndex =
        message.id !== undefined
          ? message.id
          : message.index;

      const result = await api(
        `/api/read?user=${encodeURIComponent(
          username
        )}&index=${encodeURIComponent(messageIndex)}`
      );

      setSelected(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setReading(false);
    }
  };

  // =========================
  // ACTIVE INBOX AUTO REFRESH
  // =========================

  useEffect(() => {
    if (!email) return;

    refreshInbox();
  }, [email, refreshInbox]);

  useEffect(() => {
    if (!autoRefresh || !email) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      refreshInbox();
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRefresh, email, refreshInbox]);

  // =========================
  // ACTIVE INBOX SEARCH
  // =========================

  const filteredMessages = messages.filter((message) => {
    const value = `
      ${message.from || ""}
      ${message.subject || ""}
    `.toLowerCase();

    return value.includes(search.toLowerCase());
  });

  // =========================
  // CHECKER
  // =========================

  const checkInbox = async (event) => {
    event.preventDefault();

    const value = cleanEmail(checkerEmail);

    if (!value || !value.includes("@")) {
      setCheckerError("Masukkan alamat email yang valid.");
      return;
    }

    const checkerUsername = getEmailUsername(value);

    setCheckerLoading(true);
    setCheckerError("");
    setCheckerSelected(null);
    setCheckerMessages([]);

    try {
      const result = await api(
        `/api/inbox?user=${encodeURIComponent(
          checkerUsername
        )}`
      );

      setCheckerMessages(
        Array.isArray(result.messages)
          ? result.messages
          : []
      );

      showNotice("Inbox berhasil diperiksa");
    } catch (err) {
      setCheckerMessages([]);
      setCheckerError(err.message);
    } finally {
      setCheckerLoading(false);
    }
  };

  // =========================
  // READ CHECKER MESSAGE
  // =========================

  const readCheckerMessage = async (message) => {
    const value = cleanEmail(checkerEmail);

    if (!value || !message) return;

    const checkerUsername = getEmailUsername(value);

    setCheckerReading(true);
    setCheckerError("");

    try {
      const messageIndex =
        message.id !== undefined
          ? message.id
          : message.index;

      const result = await api(
        `/api/read?user=${encodeURIComponent(
          checkerUsername
        )}&index=${encodeURIComponent(messageIndex)}`
      );

      setCheckerSelected(result.data);
    } catch (err) {
      setCheckerError(err.message);
    } finally {
      setCheckerReading(false);
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <main className="site-shell">
      <div className="backdrop" />

      <section className="content">

        {/* ================= HEADER ================= */}

        <header className="topbar">
          <div className="brand-mark">
            <div className="brand-icon">
              <Mail size={19} />
            </div>

            <div>
              <div className="brand-name">
                AIXI
              </div>

              <div className="brand-subtitle">
                TEMP MAIL
              </div>
            </div>
          </div>

          <div className="status-pill">
            <span className="status-dot" />
            ONLINE
          </div>
        </header>

        {/* ================= HERO ================= */}

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
            Buat alamat email sementara untuk kebutuhan
            verifikasi dan inbox singkat tanpa memenuhi
            email utama kamu.
          </p>
        </section>

        {/* ================= MAILBOX ================= */}

        <section className="mailbox-card glass-card">

          <div className="card-heading">
            <div>
              <span className="mini-label">
                ACTIVE MAILBOX
              </span>

              <h2>
                {email || "Belum ada email"}
              </h2>
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

              {loading
                ? "Processing..."
                : "Generate Email"}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                copyText(
                  email,
                  "Email berhasil disalin"
                )
              }
              disabled={!email}
              aria-label="Copy email"
            >
              <Copy size={17} />
              Copy
            </button>

          </div>

          <form
            className="custom-form"
            onSubmit={useCustomEmail}
          >
            <div className="input-wrap">

              <span className="input-prefix">
                @
              </span>

              <input
                value={customName}
                onChange={(event) =>
                  setCustomName(event.target.value)
                }
                placeholder="custom-username"
                autoComplete="off"
              />

              <span className="domain-suffix">
                {DEFAULT_DOMAIN}
              </span>

            </div>

            <button
              className="icon-button"
              disabled={loading}
              title="Use custom email"
            >
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
                onChange={(event) =>
                  setAutoRefresh(
                    event.target.checked
                  )
                }
              />

              <span className="toggle" />
            </label>

          </div>

        </section>

        {/* ================= NOTIFICATION ================= */}

        {notice && (
          <div className="notice">
            {notice}
          </div>
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* ==================================================
            INBOX CHECKER
        ================================================== */}

        <section className="checker-card glass-card">

          <div className="checker-heading">

            <div>
              <span className="mini-label">
                INBOX CHECKER
              </span>

              <h2>
                Cek inbox email
              </h2>

              <p>
                Masukkan alamat email untuk melihat
                pesan yang masuk.
              </p>
            </div>

            <div className="checker-icon">
              <MailOpen size={18} />
            </div>

          </div>

          {/* CHECKER INPUT */}

          <form
            className="checker-form"
            onSubmit={checkInbox}
          >

            <div className="checker-input-wrap">

              <Mail size={16} />

              <input
                value={checkerEmail}
                onChange={(event) => {
                  setCheckerEmail(
                    event.target.value
                  );

                  setCheckerError("");
                }}
                placeholder="contoh@akunlama.com"
                type="email"
                autoComplete="off"
              />

            </div>

            <button
              className="checker-button"
              disabled={checkerLoading}
            >
              <Search size={16} />

              {checkerLoading
                ? "Checking..."
                : "Cek Inbox"}
            </button>

          </form>

          {/* CHECKER ERROR */}

          {checkerError && (
            <div className="checker-error">
              {checkerError}
            </div>
          )}

          {/* ==================================================
              CHECKER MESSAGE DETAIL
          ================================================== */}

          {checkerSelected ? (

            <div className="checker-reader">

              <button
                className="back-button"
                onClick={() =>
                  setCheckerSelected(null)
                }
              >
                <ArrowLeft size={16} />
                Kembali ke inbox checker
              </button>

              <div className="reader-heading">

                <span className="mini-label">
                  MESSAGE DETAIL
                </span>

                <h2>
                  {checkerSelected.subject ||
                    "(No Subject)"}
                </h2>

                <p>
                  {checkerSelected.from ||
                    "Unknown sender"}
                </p>

                <small>
                  {formatDate(
                    checkerSelected.date
                  )}
                </small>

              </div>

              {/* OTP */}

              {checkerSelected.otp && (
                <div className="otp-box">

                  <span>
                    Possible OTP
                  </span>

                  <strong>
                    {checkerSelected.otp}
                  </strong>

                  <button
                    onClick={() =>
                      copyText(
                        checkerSelected.otp,
                        "OTP disalin"
                      )
                    }
                  >
                    <Copy size={15} />
                  </button>

                </div>
              )}

              {/* LINKS */}

              {Array.isArray(
                checkerSelected.links
              ) &&
                checkerSelected.links.length > 0 && (
                  <div className="links-box">

                    <h3>
                      Detected links
                    </h3>

                    {checkerSelected.links.map(
                      (link) => (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          key={link}
                        >
                          <ExternalLink
                            size={14}
                          />

                          {link}
                        </a>
                      )
                    )}

                  </div>
                )}

              {/* BODY */}

              <article className="email-body">

                <pre>
                  {checkerSelected.text ||
                    "No readable text found."}
                </pre>

              </article>

            </div>

          ) : checkerMessages.length > 0 ? (

            /* ==================================================
               CHECKER RESULT LIST
            ================================================== */

            <div className="checker-results">

              <div className="checker-results-head">

                <div>
                  <span className="mini-label">
                    RESULT
                  </span>

                  <strong>
                    {checkerEmail}
                  </strong>
                </div>

                <span className="message-count">
                  {checkerMessages.length} pesan
                </span>

              </div>

              <div className="message-list">

                {checkerMessages.map(
                  (message) => {

                    const sender =
                      message.from ||
                      "Unknown sender";

                    const avatar =
                      sender
                        .replace(
                          /<.*?>/g,
                          ""
                        )
                        .trim()
                        .charAt(0)
                        .toUpperCase() || "?";

                    return (
                      <button
                        className="message-row"
                        key={`checker-${
                          message.id ??
                          "message"
                        }-${message.index ?? ""}`}
                        disabled={
                          checkerReading
                        }
                        onClick={() =>
                          readCheckerMessage(
                            message
                          )
                        }
                      >

                        <div className="sender-avatar">
                          {avatar}
                        </div>

                        <div className="message-main">

                          <strong>
                            {sender}
                          </strong>

                          <span>
                            {message.subject ||
                              "(No Subject)"}
                          </span>

                          <small>
                            {formatDate(
                              message.date
                            )}
                          </small>

                        </div>

                        <ArrowLeft
                          className="message-arrow"
                          size={16}
                        />

                      </button>
                    );
                  }
                )}

              </div>

            </div>

          ) : checkerEmail &&
            !checkerLoading ? (

            /* ==================================================
               CHECKER EMPTY
            ================================================== */

            <div className="checker-empty">

              <MailOpen size={23} />

              <strong>
                Inbox kosong
              </strong>

              <span>
                Tidak ada pesan untuk email
                tersebut.
              </span>

            </div>

          ) : null}

        </section>

        {/* ==================================================
            ACTIVE MAILBOX INBOX
        ================================================== */}

        <section className="inbox-section glass-card">

          {selected ? (

            <div className="reader">

              <button
                className="back-button"
                onClick={() =>
                  setSelected(null)
                }
              >
                <ArrowLeft size={16} />
                Back to inbox
              </button>

              <div className="reader-heading">

                <span className="mini-label">
                  MESSAGE DETAIL
                </span>

                <h2>
                  {selected.subject ||
                    "(No Subject)"}
                </h2>

                <p>
                  {selected.from ||
                    "Unknown sender"}
                </p>

                <small>
                  {formatDate(selected.date)}
                </small>

              </div>

              {/* OTP */}

              {selected.otp && (
                <div className="otp-box">

                  <span>
                    Possible OTP
                  </span>

                  <strong>
                    {selected.otp}
                  </strong>

                  <button
                    onClick={() =>
                      copyText(
                        selected.otp,
                        "OTP disalin"
                      )
                    }
                  >
                    <Copy size={15} />
                  </button>

                </div>
              )}

              {/* LINKS */}

              {Array.isArray(selected.links) &&
                selected.links.length > 0 && (
                  <div className="links-box">

                    <h3>
                      Detected links
                    </h3>

                    {selected.links.map(
                      (link) => (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          key={link}
                        >
                          <ExternalLink
                            size={14}
                          />

                          {link}
                        </a>
                      )
                    )}

                  </div>
                )}

              {/* BODY */}

              <article className="email-body">

                <pre>
                  {selected.text ||
                    "No readable text found."}
                </pre>

              </article>

            </div>

          ) : (

            <>
              {/* INBOX HEADER */}

              <div className="section-heading">

                <div>
                  <span className="mini-label">
                    YOUR INBOX
                  </span>

                  <h2>
                    Incoming messages
                  </h2>
                </div>

                <button
                  className="refresh-button"
                  onClick={refreshInbox}
                  disabled={
                    !email || loading
                  }
                  title="Refresh inbox"
                >
                  <RefreshCw
                    size={17}
                    className={
                      loading
                        ? "spin"
                        : ""
                    }
                  />
                </button>

              </div>

              {/* SEARCH */}

              <div className="inbox-tools">

                <Search size={16} />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search sender or subject..."
                />

              </div>

              {/* NO EMAIL */}

              {!email ? (

                <div className="empty-state">

                  <div className="empty-icon">
                    <Mail size={25} />
                  </div>

                  <h3>
                    No active mailbox
                  </h3>

                  <p>
                    Tekan Generate Email
                    untuk mulai menerima
                    pesan.
                  </p>

                </div>

              ) : filteredMessages.length ===
                0 ? (

                /* EMPTY INBOX */

                <div className="empty-state">

                  <div className="empty-icon">
                    <MailOpen size={25} />
                  </div>

                  <h3>
                    Inbox masih kosong
                  </h3>

                  <p>
                    Pesan baru akan muncul
                    otomatis ketika tersedia.
                  </p>

                </div>

              ) : (

                /* ACTIVE MESSAGE LIST */

                <div className="message-list">

                  {filteredMessages.map(
                    (message) => {

                      const sender =
                        message.from ||
                        "Unknown sender";

                      const avatar =
                        sender
                          .replace(
                            /<.*?>/g,
                            ""
                          )
                          .trim()
                          .charAt(0)
                          .toUpperCase() ||
                        "?";

                      return (
                        <button
                          className="message-row"
                          key={`${message.id ?? "message"}-${message.index ?? ""}`}
                          onClick={() =>
                            readMessage(
                              message
                            )
                          }
                          disabled={reading}
                        >

                          <div className="sender-avatar">
                            {avatar}
                          </div>

                          <div className="message-main">

                            <strong>
                              {sender}
                            </strong>

                            <span>
                              {message.subject ||
                                "(No Subject)"}
                            </span>

                            <small>
                              {formatDate(
                                message.date
                              )}
                            </small>

                          </div>

                          <ArrowLeft
                            className="message-arrow"
                            size={16}
                          />

                        </button>
                      );
                    }
                  )}

                </div>
              )}

            </>
          )}

        </section>

        {/* ================= FOOTER ================= */}

        <footer className="footer">

          <span>
            © {new Date().getFullYear()} AIXI CODEX
          </span>

          <span>
            BUILT FOR MOBILE
          </span>

        </footer>

      </section>
    </main>
  );
}
