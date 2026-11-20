import { useEffect, useRef, useState } from 'react'
import './App.css'

const scanTypes = [
  { id: 'website', label: 'Website URL', icon: 'link', placeholder: 'Paste a website URL to check…' },
  { id: 'message', label: 'Text message', icon: 'message', placeholder: 'Paste a suspicious SMS or WhatsApp message…' },
  { id: 'email', label: 'Email', icon: 'mail', placeholder: 'Paste the email text, including its subject…' },
  { id: 'job', label: 'Job offer', icon: 'briefcase', placeholder: 'Paste the job or internship offer…' },
]
const heroPhrases = ['suspicious links', 'scam messages', 'fake websites', 'phishing emails']

const today = new Date().toDateString()

const examples = {
  website: 'http://secure-account-verify.example.com/login',
  message: 'URGENT: Your account will be suspended today. Verify your identity now at http://account-check.example.com',
  email: 'Subject: Action required. Your mailbox is full. Sign in immediately to avoid losing access.',
  job: 'Congratulations! You are selected for a remote data entry job. Pay a refundable $49 onboarding fee to secure your position.',
}

function Icon({ name, size = 18 }) {
  const paths = {
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    alert: <><path d="M10.3 3.9 2.5 17.4A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.5-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1 2.5 2 1-2 1L19 21l-1-2.5-2-1 2-1 1-2.5Z" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18m-11 0v2h4v-2" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function HeroSection({ scannerAvailable }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const heroRef = useRef(null)
  const shieldRef = useRef(null)
  const chipsRef = useRef([])
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let interval
    function syncRotation() {
      window.clearInterval(interval)
      interval = undefined
      if (reducedMotion.matches) {
        setPhraseIndex(0)
        return
      }
      interval = window.setInterval(() => {
        setPhraseIndex((index) => (index + 1) % heroPhrases.length)
      }, 3000)
    }
    syncRotation()
    reducedMotion.addEventListener('change', syncRotation)
    return () => {
      window.clearInterval(interval)
      reducedMotion.removeEventListener('change', syncRotation)
    }
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    const shield = shieldRef.current
    const chips = chipsRef.current
    if (!hero || !shield || !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    function moveScene(event) {
      const bounds = hero.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width - 0.5
      const y = (event.clientY - bounds.top) / bounds.height - 0.5
      shield.style.transform = `translate3d(${x * 8}px, ${y * 6}px, 0)`
      chips.forEach((chip, index) => {
        if (chip) chip.style.transform = `translate3d(${x * (index + 1) * 3}px, ${y * (index + 1) * 2}px, 0)`
      })
    }

    function resetScene() {
      shield.style.transform = ''
      chips.forEach((chip) => {
        if (chip) chip.style.transform = ''
      })
    }

    hero.addEventListener('pointermove', moveScene)
    hero.addEventListener('pointerleave', resetScene)
    return () => {
      hero.removeEventListener('pointermove', moveScene)
      hero.removeEventListener('pointerleave', resetScene)
    }
  }, [])

  const examples = [
    { domain: 'paypa1-login.com', label: 'Suspicious', status: 'suspicious' },
    { domain: 'google.com', label: 'Safe', status: 'safe' },
    { domain: 'free-gift-claim.xyz', label: 'Phishing', status: 'phishing' },
  ]

  return (
    <section className="welcome-row hero-card" ref={heroRef}>
      <div className="hero-mesh" aria-hidden="true"><span /><span /><span /></div>
      <div className="hero-scan-line" aria-hidden="true" />
      <div className="hero-copy">
        <h1>Check before you click.</h1>
        <p className="welcome-copy">Your personal security assistant for <span className="rotating-phrase" key={phraseIndex}>{heroPhrases[phraseIndex]}</span>.</p>
      </div>
      <div className="hero-art">
        <span className={`hero-status ${scannerAvailable === false ? 'offline' : ''}`}><i />{scannerAvailable === null ? 'Checking scanner' : scannerAvailable ? 'Scanner ready' : 'Scanner offline'}</span>
        <div className="hero-visual" role="img" aria-label="Illustrative examples only: paypa1-login.com suspicious, google.com safe, free-gift-claim.xyz phishing">
          <div className="hero-radar" aria-hidden="true"><i /><i /><i /></div>
          <div className="hero-shield-layer" ref={shieldRef}>
            <div className="hero-shield"><span><Icon name="shield" size={52} /></span></div>
          </div>
          {examples.map((example, index) => (
            <div className={`link-chip-layer chip-layer-${index + 1}`} key={example.domain} ref={(element) => { chipsRef.current[index] = element }}>
              <div className={`hero-link-chip ${example.status}`}>
                <span className="chip-status-icon"><Icon name={example.status === 'safe' ? 'check' : 'alert'} size={12} /></span>
                <span className="chip-copy"><strong>{example.domain}</strong><small>{example.label}</small></span>
              </div>
            </div>
          ))}
          <span className="hero-demo-label">ILLUSTRATIVE EXAMPLES</span>
        </div>
      </div>
    </section>
  )
}

function formatScanTime(timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'Recently'
  if (date.toDateString() === new Date().toDateString()) {
    return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function riskCategory(score) {
  if (score >= 75) return 'high'
  if (score >= 40) return 'suspicious'
  return 'safe'
}

const evidenceTerms = {
  urgency: ['urgent', 'immediately', 'act now', 'suspended', 'limited time', 'expires today'],
  credentials: ['password', 'verify your identity', 'verification code', 'one-time code', 'sign in', 'log in'],
  payment: ['gift card', 'wire transfer', 'crypto', 'cryptocurrency', 'upfront fee', 'processing fee', 'onboarding fee', 'pay a fee'],
  job_claim: ['work from home', 'remote job', 'no experience', 'guaranteed income', 'selected for', 'job offer'],
  link_prompt: ['click here', 'open this link', 'follow this link'],
}

function findingEvidence(content, code) {
  const phrases = evidenceTerms[code] || []
  const matches = phrases.filter((phrase) => content.toLowerCase().includes(phrase))
  const urls = content.match(/(?:https?:\/\/|www\.)[^\s<>\])}]+/gi) || []

  if (code === 'unencrypted') matches.push(...urls.filter((url) => /^http:\/\//i.test(url)).map((url) => url.match(/^http:\/\//i)[0]))
  if (code === 'punycode') matches.push(...(content.match(/xn--[a-z\d-]+/gi) || []))
  if (code === 'ip_address') matches.push(...(content.match(/(?:\d{1,3}\.){3}\d{1,3}/g) || []))
  if (code === 'at_symbol') matches.push(...urls.filter((url) => url.includes('@')).map((url) => url.match(/[^/]+@[^/]+/)[0]))
  if (code === 'long_url') matches.push(...urls.filter((url) => url.length > 100))
  if (code === 'subdomains' || code === 'brand_bait') {
    urls.forEach((url) => {
      try {
        const host = new URL(url.startsWith('www.') ? `https://${url}` : url).hostname
        if (code === 'subdomains' && host.split('.').length >= 5) matches.push(host)
        if (code === 'brand_bait' && /(?:login|verify|secure|account|update|wallet)/i.test(host) && (host.match(/-/g) || []).length >= 2) matches.push(host)
      } catch {
        return
      }
    })
  }
  return [...new Set(matches)]
}

function HighlightedContent({ content, findings }) {
  const ranges = findings.flatMap((finding) => findingEvidence(content, finding.code).flatMap((phrase) => {
    const start = content.toLowerCase().indexOf(phrase.toLowerCase())
    return start < 0 ? [] : [{ start, end: start + phrase.length }]
  })).sort((a, b) => a.start - b.start)
  const merged = ranges.reduce((list, range) => {
    const previous = list[list.length - 1]
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
    else list.push({ ...range })
    return list
  }, [])
  if (!merged.length) return content
  const parts = []
  let cursor = 0
  merged.forEach(({ start, end }, index) => {
    if (start > cursor) parts.push(content.slice(cursor, start))
    parts.push(<mark key={`${start}-${index}`}>{content.slice(start, end)}</mark>)
    cursor = end
  })
  if (cursor < content.length) parts.push(content.slice(cursor))
  return parts
}

function ScanReportDetails({ report, content, type, createdAt }) {
  const category = riskCategory(report.risk_score)
  const checks = [
    { label: 'Scam-pattern model', status: Number.isFinite(report.model_score) ? 'Complete' : 'Unavailable', detail: Number.isFinite(report.model_score) ? `${report.model_version || 'Model version not supplied'} · signal ${report.model_score}%` : 'Model details not supplied' },
    { label: 'Warning-sign checks', status: Array.isArray(report.findings) ? 'Complete' : 'Unavailable', detail: `${report.findings?.length ?? 0} indicators found` },
    {
      label: 'AI explanation',
      status: report.explanation_status === 'generated' ? 'Complete' : report.explanation_status === 'unavailable' ? 'Unavailable' : 'Not configured',
      detail: report.explanation_status === 'generated' ? 'Explanation provided' : report.explanation_status === 'unavailable' ? 'The explanation service did not respond' : 'Optional service is not configured',
    },
    { label: 'Live reputation lookup', status: 'Unavailable', detail: 'This scanner does not query domain blocklists or verify live websites' },
  ]

  return (
    <div className="report-details">
      <div className={`risk-meter ${category}`} style={{ '--risk-angle': `${report.risk_score * 3.6}deg` }} role="img" aria-label={`${report.risk_score} out of 100 risk score`}>
        <div><strong>{report.risk_score}</strong><span>out of 100</span></div>
      </div>
      <div className={`report-classification ${category}`}>
        <span className={`risk-pill ${category}`}>{report.verdict}</span>
        <p>{report.summary}</p>
        <span className="report-type">{type?.label || 'Scan'} · {formatScanTime(createdAt)}</span>
      </div>

      <section className="report-section">
        <h3>Threat indicators and evidence</h3>
        {report.findings?.length ? (
          <ul className="report-findings">
            {report.findings.map((finding) => {
              const evidence = findingEvidence(content, finding.code)
              return <li key={finding.code}><strong>{finding.description}</strong><span>{evidence.length ? <>Evidence: {evidence.map((phrase) => `“${phrase}”`).join(', ')}</> : 'Structural signal; no exact phrase could be isolated.'}</span></li>
            })}
          </ul>
        ) : <p className="report-muted">No common warning signs were detected in this scan.</p>}
      </section>

      <section className="report-section">
        <h3>Submitted content</h3>
        <p className="report-content highlighted-content"><HighlightedContent content={content} findings={report.findings || []} /></p>
      </section>

      <section className="report-section">
        <h3>Security checks</h3>
        <ul className="security-checks">{checks.map((check) => <li key={check.label}><span className={`check-status ${check.status.toLowerCase().replaceAll(' ', '-')}`}>{check.status}</span><div><strong>{check.label}</strong><span>{check.detail}</span></div></li>)}</ul>
      </section>

      {report.explanation && <section className="report-section"><h3>AI explanation</h3><p className="report-muted">{report.explanation}</p></section>}
      <section className="report-section recommendation-section"><h3>Recommended next steps</h3><p>{report.recommendation}</p><ul><li>Verify the sender using contact details from an official source you find independently.</li><li>Do not share passwords, verification codes, or payment details in response to an unexpected request.</li></ul></section>
      <p className="report-disclaimer">{report.disclaimer}</p>
    </div>
  )
}

const quizQuestions = [
  {
    scenario: 'A fictional delivery text says: “Your parcel is held. Pay a $1.20 redelivery fee today at parcel-help.example.”',
    question: 'Which warning signs should make you pause?',
    choices: ['Unexpected fee and a link in an urgent message', 'A tracking update in the official retailer app', 'A delivery date you already confirmed'],
    answers: [0],
    explanation: 'A small unexpected fee and pressure to use a message link are common lures. Check delivery status in the carrier’s official app or website instead.',
  },
  {
    scenario: 'A fictional recruiter offers a remote role without an interview and asks you to pay a refundable equipment deposit.',
    question: 'What is the strongest warning sign?',
    choices: ['A written job description', 'Paying an upfront fee to get hired', 'A recruiter sharing the company name'],
    answers: [1],
    explanation: 'Legitimate employers generally do not require candidates to pay a deposit to receive a job or equipment. Verify the role through the company’s official careers page.',
  },
  {
    scenario: 'A message claims your account will close in 10 minutes unless you share a one-time sign-in code with “support.”',
    question: 'What should you do?',
    choices: ['Share the code so support can secure the account', 'Reply asking for a longer deadline', 'Do not share the code; contact support through the official app or site'],
    answers: [2],
    explanation: 'One-time codes are for you only. Do not share them with anyone, and independently contact the service through its official channel.',
  },
]

function AwarenessSimulator() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [complete, setComplete] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [stats, setStats] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('scamshield-quiz-stats') || '{}')
      return { attempts: Number.isFinite(saved.attempts) ? saved.attempts : 0, best: Number.isFinite(saved.best) ? saved.best : 0, last: Number.isFinite(saved.last) ? saved.last : null }
    } catch {
      return { attempts: 0, best: 0, last: null }
    }
  })
  const question = quizQuestions[questionIndex]

  function submitAnswer() {
    if (selectedAnswer === '') return
    const correct = question.answers.includes(Number(selectedAnswer))
    setScore((current) => current + Number(correct))
    setAnswered(true)
  }

  function nextQuestion() {
    if (questionIndex < quizQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1)
      setSelectedAnswer('')
      setAnswered(false)
      return
    }
    const nextStats = { attempts: stats.attempts + 1, best: Math.max(stats.best, score), last: score }
    setStats(nextStats)
    try {
      localStorage.setItem('scamshield-quiz-stats', JSON.stringify(nextStats))
      setStorageError('')
    } catch {
      setStorageError('Your browser could not save this score. It will be available only until you leave this page.')
    }
    setComplete(true)
  }

  function restart() {
    setQuestionIndex(0)
    setSelectedAnswer('')
    setAnswered(false)
    setScore(0)
    setComplete(false)
  }

  return (
    <section className="awareness-card">
      <div className="awareness-heading"><span className="tip-icon"><Icon name="sparkle" size={18} /></span><div><span className="scanner-kicker">SCAM AWARENESS SIMULATOR</span><h1>Practice spotting the signs</h1><p>Short, fictional examples. No real links or messages are used.</p></div><div className="quiz-stats"><strong>{stats.best}/{quizQuestions.length}</strong><span>best score · {stats.attempts} {stats.attempts === 1 ? 'try' : 'tries'}</span></div></div>
      {storageError && <p className="quiz-storage-error" role="alert">{storageError}</p>}
      {complete ? (
        <div className="quiz-complete"><span className="empty-icon"><Icon name={score === quizQuestions.length ? 'check' : 'shield'} size={22} /></span><h2>{score} of {quizQuestions.length} correct</h2><p>{score === quizQuestions.length ? 'Great work. Keep verifying unexpected requests independently.' : 'Review the explanations, then try again to reinforce the warning signs.'}</p><button className="scan-button" onClick={restart}>Try again</button></div>
      ) : (
        <div className="quiz-question">
          <div className="quiz-progress"><span>Scenario {questionIndex + 1} of {quizQuestions.length}</span><div><i style={{ width: `${(questionIndex + 1) / quizQuestions.length * 100}%` }} /></div></div>
          <blockquote>{question.scenario}</blockquote>
          <h2>{question.question}</h2>
          <fieldset className="quiz-choices" disabled={answered}><legend className="sr-only">Choose the best answer</legend>{question.choices.map((choice, index) => <label key={choice} className={answered && index === question.answers[0] ? 'correct' : ''}><input type="radio" name={`quiz-${questionIndex}`} value={index} checked={selectedAnswer === String(index)} onChange={(event) => setSelectedAnswer(event.target.value)} /><span>{choice}</span></label>)}</fieldset>
          {answered && <p className="quiz-explanation" role="status">{question.explanation}</p>}
          {!answered ? <button className="scan-button" disabled={selectedAnswer === ''} onClick={submitAnswer}>Check answer</button> : <button className="scan-button" onClick={nextQuestion}>{questionIndex === quizQuestions.length - 1 ? 'Finish quiz' : 'Next scenario'}</button>}
        </div>
      )}
    </section>
  )
}

function ActivityRow({ item, onViewReport }) {
  const type = scanTypes.find((scanType) => scanType.id === item.type)
  return (
    <div className="activity-row">
      <span className={`activity-type ${item.type}`}><Icon name={type?.icon || 'shield'} size={16} /></span>
      <div className="activity-info">
        <strong>{item.content}</strong>
        <span>{formatScanTime(item.createdAt)} · {type?.label || 'Scan'}</span>
      </div>
      <span className={`risk-pill ${riskCategory(item.score)}`}>{item.verdict}</span>
      <span className="activity-score">{item.score}</span>
      <button className="report-button" onClick={() => onViewReport(item)}>View report</button>
    </div>
  )
}

function mergeAccountHistory(remote, local) {
  const accountItems = remote.map((item) => {
    const createdAt = new Date(item.created_at).getTime()
    const localMatch = local.find((saved) =>
      saved.type === item.scan_type && saved.content === item.content &&
      Math.abs(saved.createdAt - createdAt) < 60_000)
    return {
      type: item.scan_type,
      content: item.content,
      score: item.risk_score,
      verdict: item.verdict,
      createdAt,
      savedToAccount: true,
      ...(localMatch?.report ? { report: localMatch.report } : {}),
    }
  })
  const localOnly = local.filter((item) => !accountItems.some((saved) =>
    saved.type === item.type && saved.content === item.content &&
    Math.abs(saved.createdAt - item.createdAt) < 60_000))
  return [...localOnly, ...accountItems].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100)
}

function loadLocalHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem('scamshield-scans') || '[]')
    if (!Array.isArray(saved)) return []
    return saved.filter((item) =>
      item && typeof item === 'object' &&
      typeof item.content === 'string' &&
      scanTypes.some((type) => type.id === item.type) &&
      Number.isFinite(item.score)).map((item) => ({
      ...item,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
    }))
  } catch {
    return []
  }
}

function App() {
  const [activeType, setActiveType] = useState('website')
  const [content, setContent] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('scamshield-token') || '')
  const [account, setAccount] = useState(null)
  const [accountStats, setAccountStats] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [view, setView] = useState('overview')
  const [history, setHistory] = useState(loadLocalHistory)
  const [selectedThreat, setSelectedThreat] = useState('all')
  const [selectedScan, setSelectedScan] = useState(null)
  const [latestScan, setLatestScan] = useState(null)
  const [toast, setToast] = useState('')
  const [scannerAvailable, setScannerAvailable] = useState(null)
  const [serviceHealth, setServiceHealth] = useState(null)
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.content = theme === 'dark' ? '#111B2B' : '#F5F6FC'
  }, [theme])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    localStorage.setItem('scamshield-scans', JSON.stringify(history.slice(0, 20)))
  }, [history])

  useEffect(() => {
    let active = true
    async function checkScanner() {
      try {
        const response = await fetch('/api/health')
        if (!response.ok) throw new Error('Scanner health check failed.')
        const health = await response.json()
        if (active) {
          setServiceHealth(health)
          setScannerAvailable(health.status === 'ok')
        }
      } catch {
        if (active) {
          setServiceHealth(null)
          setScannerAvailable(false)
        }
      }
    }
    checkScanner()
    const timer = window.setInterval(checkScanner, 30_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!authToken) return
    async function loadAccount() {
      try {
        const headers = { Authorization: `Bearer ${authToken}` }
        const [accountResponse, historyResponse, statsResponse] = await Promise.all([
          fetch('/api/auth/me', { headers }),
          fetch('/api/history', { headers }),
          fetch('/api/stats', { headers }),
        ])
        if (!accountResponse.ok || !historyResponse.ok || !statsResponse.ok) throw new Error('Your saved session expired. Please sign in again.')
        const [accountData, remoteHistory, remoteStats] = await Promise.all([
          accountResponse.json(),
          historyResponse.json(),
          statsResponse.json(),
        ])
        setAccount(accountData)
        setAccountStats(remoteStats)
        setHistory((local) => mergeAccountHistory(remoteHistory, local))
      } catch (loadError) {
        localStorage.removeItem('scamshield-token')
        setAuthToken('')
        setAccount(null)
        setAccountStats(null)
        setHistory((local) => local.filter((item) => !item.savedToAccount))
        setAuthError(loadError.message)
        setAuthMode('login')
        setAuthOpen(true)
      }
    }
    loadAccount()
  }, [authToken])

  function chooseType(type) {
    setActiveType(type)
    setContent('')
    setResult(null)
    setLatestScan(null)
    setError('')
  }

  async function scan(event) {
    event.preventDefault()
    if (!content.trim()) {
      setError('Paste the suspicious content you want to check.')
      return
    }
    if (activeType === 'website') {
      const candidate = content.trim().startsWith('www.') ? `https://${content.trim()}` : content.trim()
      try {
        const parsed = new URL(candidate)
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error()
      } catch {
        setError('Enter a complete website address, such as example.com or https://example.com.')
        return
      }
    }
    setBusy(true)
    setError('')
    setResult(null)
    setLatestScan(null)
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ content: content.trim(), scan_type: activeType }),
      })
      setScannerAvailable(response.status < 500)
      const responseBody = await response.text()
      let data = {}
      if (responseBody.trim()) {
        try {
          data = JSON.parse(responseBody)
        } catch {
          throw new Error(response.status >= 500
            ? 'The scanner service is unavailable. Make sure the FastAPI server is running, then try again.'
            : 'The scanner returned an unreadable response. Please try again.')
        }
      }
      if (!response.ok) {
        throw new Error(data.detail || (response.status >= 500
          ? 'The scanner service is unavailable. Make sure the FastAPI server is running, then try again.'
          : 'The scan could not be completed.'))
      }
      if (!Number.isFinite(data.risk_score) || !Array.isArray(data.findings)) {
        throw new Error('The scanner returned an incomplete result. Please try again.')
      }
      const completedScan = { type: activeType, content: content.trim(), score: data.risk_score, verdict: data.verdict, createdAt: Date.now(), savedToAccount: data.saved_to_account, report: data }
      setResult(data)
      setLatestScan(completedScan)
      setHistory((previous) => [completedScan, ...previous].slice(0, authToken ? 100 : 20))
      setToast(`Scan complete · ${data.verdict} · ${data.risk_score}/100`)
      if (authToken) {
        const statsResponse = await fetch('/api/stats', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (statsResponse.ok) setAccountStats(await statsResponse.json())
      }
    } catch (scanError) {
      if (scanError.message === 'Failed to fetch') setScannerAvailable(false)
      setError(scanError.message === 'Failed to fetch'
        ? 'Could not reach the scanner API. Start the FastAPI server and try again.'
        : scanError.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitAuth(event) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError('')
    try {
      const response = await fetch(`/api/auth/${authMode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      })
      const responseBody = await response.text()
      let data = {}
      if (responseBody.trim()) {
        try {
          data = JSON.parse(responseBody)
        } catch {
          throw new Error(response.ok
            ? 'The account service returned an unreadable response. Please try again.'
            : 'Could not reach the account service. Make sure the API server is running, then try again.')
        }
      }
      if (!response.ok) {
        throw new Error(data.detail || (response.status >= 500
          ? 'The account service is temporarily unavailable. Please try again.'
          : 'Could not sign in.'))
      }
      if (!data.access_token || !data.user) {
        throw new Error('The account service returned an incomplete response. Please try again.')
      }
      localStorage.setItem('scamshield-token', data.access_token)
      setAuthToken(data.access_token)
      setAccount(data.user)
      setAuthOpen(false)
      setAuthPassword('')
    } catch (authSubmitError) {
      setAuthError(authSubmitError.message === 'Failed to fetch'
        ? 'Could not reach the account service. Start the API and try again.'
        : authSubmitError.message)
    } finally {
      setAuthBusy(false)
    }
  }

  function signOut() {
    localStorage.removeItem('scamshield-token')
    setAuthToken('')
    setAccount(null)
    setAccountStats(null)
    setHistory((local) => local.filter((item) => !item.savedToAccount))
    setAuthError('')
  }

  async function clearHistory() {
    if (authToken) {
      try {
        const response = await fetch('/api/history', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (!response.ok) throw new Error('Could not clear your synced history.')
      } catch (clearError) {
        setError(clearError.message)
        return
      }
    }
    setHistory([])
    setAccountStats(account ? { total_scans: 0, scans_today: 0, flagged_scans: 0, average_risk_score: 0 } : null)
    setError('')
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    try {
      localStorage.setItem('scamshield-theme', nextTheme)
    } catch {
      setToast('Theme changed for this session, but could not be saved in this browser.')
    }
  }

  function reviewScan(item) {
    setActiveType(item.type)
    setContent(item.content)
    setResult(null)
    setLatestScan(null)
    setSelectedScan(null)
    setView('overview')
    requestAnimationFrame(() => {
      document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById('scan-content')?.focus({ preventScroll: true })
    })
  }

  function reportText(item) {
    const report = item.report
    const typeLabel = scanTypes.find((type) => type.id === item.type)?.label || 'Scan'
    const details = report
      ? [
          `Summary: ${report.summary}`,
          'Indicators:',
          ...(report.findings.length ? report.findings.map((finding) => {
            const evidence = findingEvidence(item.content, finding.code)
            return `- ${finding.description}${evidence.length ? ` Evidence: ${evidence.join(', ')}` : ''}`
          }) : ['- No common warning signs were detected.']),
          `Scam-pattern model: ${Number.isFinite(report.model_score) ? `completed (${report.model_score}%; ${report.model_version})` : 'unavailable'}`,
          `Warning-sign checks: ${Array.isArray(report.findings) ? 'completed' : 'unavailable'}`,
          `AI explanation: ${report.explanation_status || 'not available'}`,
          'Live reputation lookup: unavailable; this scanner does not query domain blocklists or verify live websites.',
          `Recommendation: ${report.recommendation}`,
          report.explanation ? `AI explanation: ${report.explanation}` : '',
          report.disclaimer || '',
        ].filter(Boolean)
      : ['Detailed findings were not stored for this earlier scan. Check the content again to generate a full report.']
    return [
      'ScamShield AI scan report',
      `${typeLabel} · ${formatScanTime(item.createdAt)}`,
      `Risk classification: ${item.verdict}`,
      `Risk score: ${item.score}/100`,
      ...details,
      '',
      'Scanned content:',
      item.content,
    ].join('\n')
  }

  async function copyReport(item) {
    try {
      await navigator.clipboard.writeText(reportText(item))
      setToast('Report copied to clipboard.')
    } catch {
      setToast('Could not copy the report. Check browser clipboard permissions.')
    }
  }

  function downloadReport(item) {
    const blob = new Blob([reportText(item)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scamshield-report-${new Date(item.createdAt).toISOString().slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast('Report downloaded.')
  }

  const currentType = scanTypes.find((type) => type.id === activeType)
  const todayCount = accountStats?.scans_today ?? history.filter((item) => new Date(item.createdAt).toDateString() === today).length
  const flaggedCount = accountStats?.flagged_scans ?? history.filter((item) => item.score >= 40).length
  const averageRisk = accountStats?.average_risk_score ?? (history.length
    ? Math.round(history.reduce((total, item) => total + item.score, 0) / history.length)
    : 0)
  const scanCount = accountStats?.total_scans ?? history.length
  const threatCategories = [
    { id: 'safe', label: 'Safe', color: 'var(--chart-safe)', scans: history.filter((item) => item.score < 40) },
    { id: 'suspicious', label: 'Suspicious', color: 'var(--chart-warning)', scans: history.filter((item) => item.score >= 40 && item.score < 75) },
    { id: 'high', label: 'High risk', color: 'var(--chart-danger)', scans: history.filter((item) => item.score >= 75) },
  ]
  const distributionTotal = history.length
  const selectedThreatScans = selectedThreat === 'all'
    ? history
    : threatCategories.find((category) => category.id === selectedThreat)?.scans || []
  let segmentOffset = 0
  const distributionSegments = threatCategories.map((category) => {
    const length = distributionTotal ? category.scans.length / distributionTotal * 264 : 0
    const chartColors = { safe: 'var(--chart-safe)', suspicious: 'var(--chart-warning)', high: 'var(--chart-danger)' }
    const segment = { ...category, color: chartColors[category.id], length, offset: segmentOffset }
    segmentOffset += length
    return segment
  })
  const dailyTips = [
    { title: 'Pause before responding', text: 'Urgent language is designed to rush you. Verify unexpected requests through a contact method you find independently.' },
    { title: 'Keep one-time codes private', text: 'A legitimate support agent should never need you to read out a sign-in or verification code.' },
    { title: 'Check the destination', text: 'Before opening a link, inspect its actual domain. When unsure, visit the organization’s official app or site directly.' },
    { title: 'Hiring should not cost you', text: 'Treat upfront fees for jobs, equipment, or training as a warning sign. Confirm openings on the employer’s careers page.' },
  ]
  const dailyTip = dailyTips[Number(today.split(' ')[2]) % dailyTips.length]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setView('overview') }}>
          <span className="brand-mark"><Icon name="shield" size={21} /></span>
          <span className="brand-name">scamshield<span>AI</span></span>
        </a>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`nav-item ${view === 'overview' ? 'selected' : ''}`} onClick={() => setView('overview')}><Icon name="grid" /> Overview</button>
          <button className={`nav-item ${view === 'history' ? 'selected' : ''}`} onClick={() => setView('history')}><Icon name="clock" /> Scan history <span className="nav-count">{history.length}</span></button>
          <button className={`nav-item ${view === 'awareness' ? 'selected' : ''}`} onClick={() => setView('awareness')}><Icon name="shield" /> Awareness practice</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-safety"><Icon name="lock" size={15} /><span>Never share passwords or verification codes.</span></div>
          <div className="profile">
            <div className="avatar">S</div>
            <div className="profile-copy"><strong>{account?.email || 'Safe browsing'}</strong><span>{account ? 'Account synced' : 'Personal workspace'}</span></div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><strong>{view === 'history' ? 'Scan history' : view === 'awareness' ? 'Awareness practice' : 'Overview'}</strong></div>
          <div className="topbar-right">{account ? <><span className="signed-in-email">{account.email}</span><button className="auth-button" onClick={signOut}>Sign out</button></> : <button className="auth-button" onClick={() => { setAuthError(''); setAuthOpen(true) }}>Sign in to sync</button>}<button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /></button></div>
        </header>

        <div className="page-content">
          {view === 'overview' ? (
            <>
              <HeroSection scannerAvailable={scannerAvailable} />

              <section className="metrics-grid" aria-label="Security summary">
                <div className="metric-card"><div className="metric-top"><span>SCANS TODAY</span><span className="metric-icon blue"><Icon name="grid" size={18} /></span></div><div className="metric-value">{todayCount}</div><div className="metric-foot">{account ? `${scanCount} total saved scans` : 'Saved on this device'}</div></div>
                <div className="metric-card"><div className="metric-top"><span>THREATS FLAGGED</span><span className="metric-icon warning"><Icon name="alert" size={18} /></span></div><div className="metric-value">{flaggedCount}</div><div className="metric-foot">Risk score of 40 or higher</div><div className="metric-progress" role="img" aria-label={`${scanCount ? Math.round(flaggedCount / scanCount * 100) : 0}% of saved scans flagged`}><span style={{ width: `${scanCount ? Math.min(100, flaggedCount / scanCount * 100) : 0}%` }} /></div></div>
                <div className="metric-card safety-metric"><div className="metric-top"><span>AVERAGE RISK</span><span className="metric-icon lavender"><Icon name="shield" size={18} /></span></div><div className="metric-value">{averageRisk}<span className="metric-suffix">/ 100</span></div><div className="metric-foot">Across {scanCount} saved scans</div><div className={`metric-progress risk-progress ${riskCategory(averageRisk)}`} role="img" aria-label={`Average risk score ${averageRisk} out of 100`}><span style={{ width: `${Math.min(100, averageRisk)}%` }} /></div></div>
              </section>

              <section className="dashboard-insights" aria-label="Service status and security tip">
                <div className="service-status-card">
                  <div className="insight-heading"><span className="tip-icon"><Icon name="shield" size={17} /></span><div><h2>Security services</h2><p>Current checks from the scanner API</p></div></div>
                  <div className="service-status-list">
                    <div><i className={scannerAvailable === true ? 'status-up' : scannerAvailable === false ? 'status-down' : ''} /><span>Scanner API</span><strong>{scannerAvailable === true ? 'Connected' : scannerAvailable === false ? 'Unavailable' : 'Checking'}</strong></div>
                    <div><i className={serviceHealth?.classifier ? 'status-up' : serviceHealth ? 'status-down' : ''} /><span>Local classifier</span><strong>{serviceHealth?.classifier || 'Not verified'}</strong></div>
                    <div><i className={serviceHealth?.llm === 'configured' ? 'status-up' : ''} /><span>AI explanation</span><strong>{serviceHealth?.llm === 'configured' ? 'Configured' : serviceHealth ? 'Not configured' : 'Not verified'}</strong></div>
                  </div>
                </div>
                <div className="tip-card daily-tip">
                  <div className="tip-heading"><span className="tip-icon"><Icon name="sparkle" size={16} /></span> DAILY SECURITY TIP</div>
                  <h3>{dailyTip.title}</h3>
                  <p>{dailyTip.text}</p>
                </div>
              </section>

              <section className="scanner-card" id="scanner">
                <div className="scanner-heading"><div><span className="scanner-kicker"><Icon name="shield" size={14} /> Private content screening</span><h2>Check suspicious content</h2><p>Choose a content type, paste it below, and get a clear risk breakdown.</p></div></div>
                <div className="scan-tabs" role="tablist" aria-label="Content type">
                  {scanTypes.map((type) => <button key={type.id} role="tab" aria-selected={activeType === type.id} className={`scan-tab ${type.id} ${activeType === type.id ? 'active' : ''}`} onClick={() => chooseType(type.id)}><span className="tab-icon"><Icon name={type.icon} size={17} /></span>{type.label}</button>)}
                </div>
                <form onSubmit={scan} aria-busy={busy}>
                  <label className="sr-only" htmlFor="scan-content">{currentType.label} to scan</label>
                  <textarea id="scan-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder={currentType.placeholder} maxLength={10000} />
                  <div className="input-footer"><span>{content.length.toLocaleString()} / 10,000 characters</span><button type="button" className="example-button" onClick={() => setContent(examples[activeType])}>Try an example</button></div>
                  {error && <div className="error-message" role="alert"><Icon name="alert" size={16} />{error}</div>}
                  <div className="scan-action-row"><span className="input-hint"><Icon name="lock" size={14} />{account ? 'Scans are saved to your account. Submitted content is sent to configured AI providers.' : 'History stays in this browser. Submitted content is sent to configured AI providers.'}</span><button className="scan-button" type="submit" disabled={busy}>{busy ? <><span className="spinner" /> Analyzing…</> : 'Analyze for threats'}</button></div>
                  {busy && <p className="scan-progress" role="status">Checking warning signs and calculating a risk score. This may take a moment.</p>}
                </form>

                {result && latestScan && <div className={`result-panel ${result.risk_level}`} aria-live="polite">
                  <div className="result-panel-heading"><div><span className="scanner-kicker">SCAN COMPLETE</span><h3>Risk assessment</h3></div><div className="result-toolbar"><button className="report-button" onClick={() => copyReport(latestScan)}>Copy report</button><button className="report-button" onClick={() => downloadReport(latestScan)}>Download</button><button className="report-button" onClick={() => reviewScan(latestScan)}>Scan again</button></div></div>
                  <ScanReportDetails report={result} content={latestScan.content} type={currentType} createdAt={latestScan.createdAt} />
                </div>}
              </section>

              <section className="lower-grid">
                <div className="activity-card">
                  <div className="card-heading"><div><h2>Recent activity</h2><p>Your latest scans</p></div><button className="text-button" onClick={() => setView('history')}>View all <Icon name="arrow" size={14} /></button></div>
                  <div className="activity-list">
                    {history.length ? history.slice(0, 4).map((item, index) => <ActivityRow key={`${item.content}-${item.createdAt}-${index}`} item={item} onViewReport={setSelectedScan} />) : <div className="activity-empty"><span>Your completed scans will show up here.</span><button className="text-button" onClick={() => document.getElementById('scan-content')?.focus()}>Start your first scan <span>→</span></button></div>}
                  </div>
                </div>
                <div className="distribution-card">
                  <div className="card-heading"><div><h2>Threat distribution</h2><p>Risk levels in your saved scans</p></div></div>
                  {distributionTotal ? (
                    <>
                      <div className="distribution-overview">
                        <div className="donut-chart" role="img" aria-label={`Risk distribution across ${distributionTotal} saved scans`}>
                          <svg viewBox="0 0 100 100" aria-hidden="true">
                            <circle className="donut-track" cx="50" cy="50" r="42" />
                            {distributionSegments.map((segment) => <circle key={segment.id} className="donut-segment" cx="50" cy="50" r="42" stroke={segment.color} strokeDasharray={`${segment.length} ${264 - segment.length}`} strokeDashoffset={-segment.offset} />)}
                          </svg>
                          <span><strong>{distributionTotal}</strong><small>scans</small></span>
                        </div>
                        <div className="distribution-legend">
                          <button className={selectedThreat === 'all' ? 'selected' : ''} aria-pressed={selectedThreat === 'all'} onClick={() => setSelectedThreat('all')}><span className="legend-dot all-dot" /><span>All scans</span><strong>{distributionTotal}</strong></button>
                          {threatCategories.map((category) => <button key={category.id} className={selectedThreat === category.id ? 'selected' : ''} aria-pressed={selectedThreat === category.id} onClick={() => setSelectedThreat(category.id)}><span className={`legend-dot ${category.id}`} /><span>{category.label}</span><strong>{category.scans.length}</strong></button>)}
                        </div>
                      </div>
                      <div className="distribution-detail" aria-live="polite">
                        <strong>{selectedThreat === 'all' ? 'Latest scans' : `${threatCategories.find((category) => category.id === selectedThreat)?.label} scans`}</strong>
                        {selectedThreatScans.length
                          ? selectedThreatScans.slice(0, 3).map((item, index) => <button key={`${item.content}-${item.createdAt}-${index}`} onClick={() => setSelectedScan(item)}><span>{scanTypes.find((type) => type.id === item.type)?.label || 'Scan'}</span><span>{item.score}/100</span></button>)
                          : <p>No scans in this category.</p>}
                      </div>
                    </>
                  ) : <div className="distribution-empty"><span className="empty-chart-icon"><Icon name="shield" size={22} /></span><strong>No scan data yet</strong><p>Threat distribution will appear here after your first scan.</p><button className="text-button" onClick={() => document.getElementById('scan-content')?.focus()}>Start a scan <span>→</span></button></div>}
                  <p className="distribution-foot">{history.length === 100 && scanCount > history.length ? 'Based on the latest 100 scans.' : `Based on ${distributionTotal} saved ${distributionTotal === 1 ? 'scan' : 'scans'}.`}</p>
                </div>
              </section>
              <footer className="page-footer"><span>Screening is a guide, not a guarantee.</span></footer>
            </>
          ) : view === 'history' ? (
            <section className="history-page"><div className="history-title-row"><div><h1>Scan history</h1><p className="welcome-copy">{account ? 'Account scans are synced; local checks stay in this browser.' : 'Saved only in this browser until you sign in.'}</p></div><button className="clear-button" onClick={clearHistory} disabled={!history.length}>Clear history</button></div>
              <div className="activity-card history-card"><div className="card-heading"><div><h2>Recent checks</h2><p>{history.length} saved scans</p></div></div>{error && <div className="error-message" role="alert">{error}</div>}{history.length ? <div className="activity-list">{history.map((item, index) => <ActivityRow key={`${item.content}-${item.createdAt}-${index}`} item={item} onViewReport={setSelectedScan} />)}</div> : <div className="empty-history"><span className="empty-icon"><Icon name="clock" size={22} /></span><strong>No scans yet</strong><p>When you scan something, your results will appear here.</p><button className="text-button" onClick={() => setView('overview')}>Start a scan <span>→</span></button></div>}</div>
            </section>
          ) : <AwarenessSimulator />}
        </div>
      </main>
      {authOpen && <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false) }}>
        <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button className="auth-close" onClick={() => setAuthOpen(false)} aria-label="Close">×</button>
          <span className="auth-mark"><Icon name="shield" size={24} /></span>
          <h2 id="auth-title">{authMode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
          <p>Sign in to sync scan history across your devices. Your password is stored as a secure hash.</p>
          <form onSubmit={submitAuth}>
            <label htmlFor="account-email">Email</label>
            <input id="account-email" type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required maxLength={320} />
            <label htmlFor="account-password">Password</label>
            <input id="account-password" type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} required minLength={8} maxLength={128} />
            {authError && <div className="error-message" role="alert"><Icon name="alert" size={16} />{authError}</div>}
            <button className="scan-button auth-submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'} <span className="button-arrow">→</span></button>
          </form>
          <button className="auth-switch" onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setAuthError('') }}>
            {authMode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
          <div className="auth-privacy"><Icon name="lock" size={14} /> Scans are saved to your account only after you sign in.</div>
        </section>
      </div>}
      {selectedScan && <div className="report-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedScan(null) }}>
        <section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
          <button className="auth-close" onClick={() => setSelectedScan(null)} aria-label="Close report">×</button>
          <span className="report-kicker">SAVED SCAN</span>
          <h2 id="report-title">Scan report</h2>
          <div className={`report-score-card ${riskCategory(selectedScan.score)}`}>
            <span className={`risk-pill ${riskCategory(selectedScan.score)}`}>{selectedScan.verdict}</span>
            <strong>{selectedScan.score}<small>/ 100</small></strong>
            <span>{scanTypes.find((type) => type.id === selectedScan.type)?.label || 'Scan'} · {formatScanTime(selectedScan.createdAt)}</span>
          </div>
          {selectedScan.report
            ? <ScanReportDetails report={selectedScan.report} content={selectedScan.content} type={scanTypes.find((type) => type.id === selectedScan.type)} createdAt={selectedScan.createdAt} />
            : <><h3>Scanned content</h3><p className="report-content">{selectedScan.content}</p><p className="report-note">Detailed findings were not stored for this earlier scan. Check it again to generate indicators and recommendations.</p></>}
          <div className="report-actions"><button className="report-button" onClick={() => copyReport(selectedScan)}>Copy report</button><button className="report-button" onClick={() => downloadReport(selectedScan)}>Download</button><button className="scan-button" onClick={() => reviewScan(selectedScan)}>Scan again</button></div>
        </section>
      </div>}
      {toast && <div className="toast-message" role="status"><Icon name="check" size={17} />{toast}</div>}
    </div>
  )
}

export default App
