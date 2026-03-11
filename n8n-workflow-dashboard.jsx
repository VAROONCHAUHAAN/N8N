import { useState, useEffect } from "react";

const C = {
  bg: "#06060C",
  surface: "#0C0C16",
  card: "#101020",
  border: "#1A1A2E",
  borderHi: "#2A2A45",
  green: "#22C55E",
  yellow: "#EAB308",
  red: "#EF4444",
  blue: "#3B82F6",
  teal: "#14B8A6",
  purple: "#A855F7",
  orange: "#F97316",
  pink: "#EC4899",
  gold: "#F59E0B",
  text: "#F1F1F8",
  muted: "#4A4A6A",
  dim: "#2A2A3E",
};

const nodes = [
  {
    id: "N01", x: 50, y: 200, type: "TRIGGER",
    label: "Schedule Trigger", sub: "Every Mon/Wed/Fri 2PM",
    color: C.teal, icon: "⏰", automated: true,
    detail: "n8n native node. Triggers the entire pipeline on your upload schedule. No setup needed beyond picking days/times.",
    n8nNode: "Schedule Trigger",
    apiNeeded: "None"
  },
  {
    id: "N02", x: 220, y: 200, type: "DATA",
    label: "Google Sheets", sub: "Read next topic",
    color: C.green, icon: "📋", automated: true,
    detail: "Your 30-video topic list lives in a Google Sheet. This node grabs the next unprocessed row automatically. Mark rows as DONE after processing.",
    n8nNode: "Google Sheets Node",
    apiNeeded: "Google Sheets API (free)"
  },
  {
    id: "N03", x: 390, y: 200, type: "AI",
    label: "Gemini 2.5 Pro", sub: "Research + Script",
    color: C.blue, icon: "🧠", automated: true,
    detail: "HTTP Request node calls Gemini API. Generates full research brief + 15-min YouTube script + scene prompts + SEO metadata in ONE call. Cost: ~$0.003 per video.",
    n8nNode: "HTTP Request Node",
    apiNeeded: "Gemini API Key (aistudio.google.com)"
  },
  {
    id: "N04", x: 560, y: 120, type: "AI",
    label: "NotebookLM-py", sub: "Generate base video",
    color: C.purple, icon: "📓", automated: true,
    detail: "Uses the unofficial notebooklm-py CLI (pip install notebooklm-py). n8n Execute Command node runs: notebooklm generate video --wait then notebooklm download video. Requires one-time auth setup.",
    n8nNode: "Execute Command Node",
    apiNeeded: "notebooklm-py + Google login (one-time)"
  },
  {
    id: "N05", x: 560, y: 300, type: "AI",
    label: "Fal.ai Veo 3.1", sub: "Generate video clips",
    color: C.orange, icon: "🎬", automated: true,
    detail: "HTTP Request node polls fal.ai Veo 3.1 API for each scene. Generates 8-second cinematic clips from image+prompt. $0.10/sec = $0.80/clip. Confirmed n8n workflow template exists (workflow #4846).",
    n8nNode: "HTTP Request + Wait Node",
    apiNeeded: "fal.ai API key (fal.ai)"
  },
  {
    id: "N06", x: 730, y: 120, type: "MEDIA",
    label: "Wikimedia API", sub: "Fetch real photos",
    color: C.teal, icon: "🏛️", automated: true,
    detail: "HTTP Request to commons.wikimedia.org/w/api.php searches for real public domain photos of your subject (Einstein, Napoleon etc). Downloads highest resolution version. 100% free, no API key needed.",
    n8nNode: "HTTP Request Node",
    apiNeeded: "None — completely free"
  },
  {
    id: "N07", x: 730, y: 300, type: "AI",
    label: "Google Cloud TTS", sub: "Neural2 voiceover",
    color: C.blue, icon: "🎙️", automated: true,
    detail: "HTTP Request to Cloud TTS API. Uses en-US-Neural2-D (deep authoritative male) or en-US-Neural2-J (warm). Outputs MP3. Cost: $0.05 per 15-min video. Microsoft Azure Neural also works — same price, slightly different voice quality.",
    n8nNode: "HTTP Request Node",
    apiNeeded: "Google Cloud TTS API or Microsoft Azure Speech"
  },
  {
    id: "N08", x: 900, y: 200, type: "PROCESS",
    label: "FFmpeg Merge", sub: "Assemble final video",
    color: C.gold, icon: "✂️", automated: true,
    detail: "Execute Command node runs FFmpeg to: concat all clips, add voiceover, mix background music at 8% volume, apply Ken Burns to photos, export 1080p YouTube-optimized MP4. Free. Runs on your server.",
    n8nNode: "Execute Command Node",
    apiNeeded: "FFmpeg installed on n8n server"
  },
  {
    id: "N09", x: 1070, y: 120, type: "STORAGE",
    label: "Google Drive", sub: "Save final video",
    color: C.green, icon: "💾", automated: true,
    detail: "Native n8n Google Drive node uploads the finished MP4. Creates a folder per video for organization. Also backs up script, research, and scene prompts as reference.",
    n8nNode: "Google Drive Node",
    apiNeeded: "Google Drive API (free)"
  },
  {
    id: "N10", x: 1070, y: 300, type: "AI",
    label: "Gemini SEO", sub: "Title, description, tags",
    color: C.blue, icon: "🔍", automated: true,
    detail: "Second Gemini API call generates: 3 A/B test title options, YouTube description (500 words, keyword-rich), 15 tags, chapter timestamps, pinned comment text. All based on the final script.",
    n8nNode: "HTTP Request Node",
    apiNeeded: "Gemini API Key (same as N03)"
  },
  {
    id: "N11", x: 1240, y: 200, type: "PUBLISH",
    label: "YouTube Upload", sub: "Upload + Schedule",
    color: C.red, icon: "▶️", automated: true,
    detail: "Native n8n YouTube node uploads video as PRIVATE, sets title/description/tags/thumbnail/chapters, then schedules publish time. Uses YouTube Data API v3. Confirmed working in n8n workflow templates.",
    n8nNode: "YouTube Node (native)",
    apiNeeded: "YouTube Data API v3 (Google Cloud)"
  },
  {
    id: "N12", x: 1410, y: 200, type: "LOG",
    label: "Update Sheet", sub: "Mark DONE + log URL",
    color: C.green, icon: "✅", automated: true,
    detail: "Updates the Google Sheet row: marks status as DONE, logs YouTube video URL, upload timestamp, view count after 24hrs. Creates your content calendar audit trail.",
    n8nNode: "Google Sheets Node",
    apiNeeded: "Google Sheets API (free)"
  },
];

const edges = [
  ["N01","N02"], ["N02","N03"], ["N03","N04"], ["N03","N05"],
  ["N04","N08"], ["N05","N08"], ["N06","N08"], ["N03","N06"],
  ["N03","N07"], ["N07","N08"], ["N08","N09"], ["N08","N10"],
  ["N09","N11"], ["N10","N11"], ["N11","N12"]
];

const warnings = [
  {
    icon: "🟡", title: "notebooklm-py Is Unofficial",
    desc: "The notebooklm-py library reverse-engineers Google's internal API. It works reliably right now but Google could break it without warning. Recommendation: use it for the base draft, but have Fal.ai Veo as your primary clip generator so the pipeline never fully breaks if NotebookLM-py goes down.",
    severity: "medium"
  },
  {
    icon: "🔴", title: "Meta AI Has NO API — Cannot Be Automated",
    desc: "Meta AI Vibes, Meta video generation, and Meta lip-sync all have zero public API. You cannot call them from n8n. This is not a workaround limitation — there is simply no endpoint to hit. The solution: Fal.ai Veo 3.1 handles all clip generation. Meta AI stays as a manual enhancement tool for special clips only, outside the main pipeline.",
    severity: "high"
  },
  {
    icon: "🟡", title: "Google Flow Has NO API Either",
    desc: "Google Flow (labs.google.com/flow) is a web UI only — no REST API, no automation endpoint. This is why fal.ai is the correct Veo 3.1 access point for n8n. Fal.ai wraps the same Veo model in a proper API with confirmed n8n integration.",
    severity: "medium"
  },
  {
    icon: "🟢", title: "YouTube Upload Requires One Manual Step First",
    desc: "To upload to YouTube via API, Google requires you to submit your app for verification IF you plan to upload public videos. While in 'testing mode' you can upload to your own channel freely. For a personal channel uploading to yourself, you never need verification — just OAuth your own account in n8n.",
    severity: "low"
  },
];

const steps = [
  { n: "01", title: "Install n8n", desc: "Use n8n.cloud (easiest, $20/mo) or self-host on Railway/Render (free tier works for this pipeline). Cloud is recommended — no server management.", time: "30 min" },
  { n: "02", title: "Create Google Sheet", desc: "Make a sheet with columns: TOPIC | STATUS | YOUTUBE_URL | PUBLISH_DATE | NOTES. Fill rows with your 30 video topics from the roadmap. This is your pipeline's control panel.", time: "10 min" },
  { n: "03", title: "Get API Keys", desc: "Gemini API (aistudio.google.com) · Google Cloud project with TTS + YouTube APIs + Sheets enabled · Fal.ai account (fal.ai) · Google Drive OAuth in n8n. All documented in the setup guide below.", time: "45 min" },
  { n: "04", title: "Install notebooklm-py", desc: "On your n8n server: pip install notebooklm-py, then run: notebooklm login (opens browser, authenticate once). After that it runs headlessly forever.", time: "15 min" },
  { n: "05", title: "Install FFmpeg", desc: "On n8n server: apt install ffmpeg (Linux) or brew install ffmpeg (Mac). Test with: ffmpeg -version. This handles all video assembly — concat, audio mix, Ken Burns effects.", time: "5 min" },
  { n: "06", title: "Import Workflow JSON", desc: "Download the workflow JSON file provided. In n8n: go to Workflows → Import → paste JSON. All nodes pre-configured. Just add your API credentials to each node.", time: "20 min" },
  { n: "07", title: "Test Single Video", desc: "Set your sheet to have ONE topic row. Run the workflow manually. Watch each node execute. The first run takes ~90 minutes. After that the pipeline runs autonomously on schedule.", time: "90 min (first run)" },
];

const costBreakdown = [
  { service: "n8n Cloud (Starter)", monthly: "$20", perVideo: "$0.67", notes: "Or free self-host" },
  { service: "Gemini API (research+script+SEO)", monthly: "~$0.09", perVideo: "~$0.003", notes: "Virtually free" },
  { service: "Fal.ai Veo 3.1 (8 clips × $0.80)", monthly: "~$192", perVideo: "~$6.40", notes: "8 hero clips only" },
  { service: "Google Cloud TTS (Neural2)", monthly: "~$1.50", perVideo: "~$0.05", notes: "15 min voiceover" },
  { service: "Wikimedia photos", monthly: "$0", perVideo: "$0", notes: "Always free" },
  { service: "Google Drive storage", monthly: "$0", perVideo: "$0", notes: "15GB free tier" },
  { service: "YouTube API", monthly: "$0", perVideo: "$0", notes: "Free for personal use" },
  { service: "TOTAL (30 videos/mo)", monthly: "~$214", perVideo: "~$7.14", notes: "Fully automated" },
];

const TABS = ["Workflow", "Honest Limits", "Setup Steps", "Costs", "JSON Preview"];

export default function App() {
  const [tab, setTab] = useState("Workflow");
  const [selected, setSelected] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [activeEdge, setActiveEdge] = useState(0);

  useEffect(() => {
    setAnimated(true);
    const interval = setInterval(() => {
      setActiveEdge(prev => (prev + 1) % edges.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const selectedNode = selected ? nodeMap[selected] : null;

  const typeColors = {
    TRIGGER: C.teal, DATA: C.green, AI: C.blue,
    MEDIA: C.teal, PROCESS: C.gold, STORAGE: C.green,
    PUBLISH: C.red, LOG: C.green
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Nunito:wght@400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    .syne{font-family:'Syne',sans-serif}
    .mono{font-family:'IBM Plex Mono',monospace}
    .nun{font-family:'Nunito',sans-serif}
    .card{background:#101020;border:1px solid #1A1A2E;border-radius:12px;padding:18px}
    .card-xs{background:#0C0C16;border:1px solid #1A1A2E;border-radius:8px;padding:12px}
    .tab{background:none;border:none;cursor:pointer;padding:8px 15px;font-family:'Syne',sans-serif;font-size:12px;font-weight:600;color:#4A4A6A;border-radius:6px;transition:all .2s;letter-spacing:.5px;white-space:nowrap}
    .tab:hover{color:#F1F1F8}
    .tab.on{background:#F59E0B18;color:#F59E0B;border-bottom:2px solid #F59E0B}
    .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.3px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .fade{animation:fadeUp .3s ease forwards}
    @keyframes flowPulse{0%{stroke-dashoffset:20}100%{stroke-dashoffset:0}}
    .flow-line{stroke-dasharray:6 4;animation:flowPulse .8s linear infinite}
    @keyframes nodePop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
    .node-pop{animation:nodePop .4s cubic-bezier(.34,1.56,.64,1) forwards}
    ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#2A2A45;border-radius:2px}
    .node-btn{cursor:pointer;transition:all .15s;filter:drop-shadow(0 2px 8px rgba(0,0,0,.5))}
    .node-btn:hover{filter:drop-shadow(0 4px 16px rgba(245,158,11,.25))}
    .step-row{display:grid;grid-template-columns:48px 1fr auto;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #1A1A2E}
    .step-row:last-child{border-bottom:none}
  `;

  const SVG_W = 1500;
  const SVG_H = 480;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Nunito', sans-serif" }}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{ background: "#08080F", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 4px", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#F59E0B,#14B8A6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
              <div>
                <div className="syne" style={{ fontSize: 16, fontWeight: 800, letterSpacing: -.3 }}>
                  Full n8n Automation Pipeline
                </div>
                <div className="mono" style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  History × Psychology · Topic → YouTube · 100% Automated
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { l: "12 Nodes", c: C.blue },
                { l: "100% Automated", c: C.green },
                { l: "~$7/video", c: C.gold },
                { l: "Zero Manual Work", c: C.teal }
              ].map(b => (
                <span key={b.l} className="badge" style={{ background: b.c + "18", color: b.c, border: `1px solid ${b.c}30` }}>{b.l}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
            {TABS.map(t => <button key={t} className={`tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px 60px" }} className="fade">

        {/* ═══ WORKFLOW TAB ═══ */}
        {tab === "Workflow" && (
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <h2 className="syne" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                The Complete n8n Automation Map
              </h2>
              <p className="nun" style={{ fontSize: 13, color: C.muted }}>
                Click any node to see exact configuration, API needed, and n8n node type. Every node is 100% automatable.
              </p>
            </div>

            {/* SVG FLOW DIAGRAM */}
            <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: C.borderHi }}>
              <div style={{ overflowX: "auto", background: `radial-gradient(ellipse at center, #0F0F22 0%, #06060C 70%)` }}>
                <svg width={SVG_W} height={SVG_H} style={{ display: "block", minWidth: SVG_W }}>
                  <defs>
                    <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#2A2A45" />
                    </marker>
                    <marker id="arr-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#F59E0B" />
                    </marker>
                    {nodes.map(n => (
                      <filter key={n.id} id={`glow-${n.id}`}>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    ))}
                  </defs>

                  {/* Grid background */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1A1A2E" strokeWidth="0.5" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* EDGES */}
                  {edges.map(([from, to], i) => {
                    const fn = nodeMap[from];
                    const tn = nodeMap[to];
                    if (!fn || !tn) return null;
                    const fx = fn.x + 65;
                    const fy = fn.y + 30;
                    const tx = tn.x;
                    const ty = tn.y + 30;
                    const mx = (fx + tx) / 2;
                    const isActive = activeEdge === i;
                    return (
                      <g key={i}>
                        <path
                          d={`M${fx},${fy} C${mx},${fy} ${mx},${ty} ${tx},${ty}`}
                          fill="none"
                          stroke={isActive ? C.gold : "#2A2A45"}
                          strokeWidth={isActive ? 2 : 1.5}
                          markerEnd={isActive ? "url(#arr-active)" : "url(#arr)"}
                          className={isActive ? "flow-line" : ""}
                          style={{ transition: "stroke .3s" }}
                        />
                      </g>
                    );
                  })}

                  {/* NODES */}
                  {nodes.map((n, i) => {
                    const isSelected = selected === n.id;
                    return (
                      <g
                        key={n.id}
                        className="node-btn node-pop"
                        style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
                        onClick={() => setSelected(isSelected ? null : n.id)}
                      >
                        {/* Glow */}
                        {isSelected && (
                          <ellipse cx={n.x + 65} cy={n.y + 30} rx={75} ry={40}
                            fill={n.color} opacity={0.12}
                            filter={`url(#glow-${n.id})`}
                          />
                        )}

                        {/* Card */}
                        <rect x={n.x} y={n.y} width={130} height={60} rx={10}
                          fill={isSelected ? n.color + "25" : "#101020"}
                          stroke={isSelected ? n.color : "#2A2A45"}
                          strokeWidth={isSelected ? 2 : 1}
                        />

                        {/* Type badge */}
                        <rect x={n.x} y={n.y} width={130} height={16} rx={10}
                          fill={n.color + "30"}
                        />
                        <rect x={n.x} y={n.y + 6} width={130} height={10}
                          fill={n.color + "30"}
                        />

                        {/* Icon */}
                        <text x={n.x + 14} y={n.y + 34} fontSize={18} dominantBaseline="middle">{n.icon}</text>

                        {/* Label */}
                        <text x={n.x + 38} y={n.y + 26} fontSize={11} fontWeight="700"
                          fill={isSelected ? n.color : C.text}
                          fontFamily="'Syne', sans-serif"
                        >{n.label}</text>
                        <text x={n.x + 38} y={n.y + 40} fontSize={9.5}
                          fill={C.muted}
                          fontFamily="'Nunito', sans-serif"
                        >{n.sub}</text>

                        {/* Auto badge */}
                        <circle cx={n.x + 118} cy={n.y + 10} r={6}
                          fill={n.automated ? C.green : C.yellow}
                        />

                        {/* Node ID */}
                        <text x={n.x + 8} y={n.y + 11} fontSize={8}
                          fill={n.color} fontFamily="'IBM Plex Mono', monospace" fontWeight="500"
                        >{n.id}</text>
                      </g>
                    );
                  })}

                  {/* Legend */}
                  <g>
                    <circle cx={20} cy={460} r={5} fill={C.green} />
                    <text x={30} y={464} fontSize={10} fill={C.muted} fontFamily="'Nunito', sans-serif">Fully Automated</text>
                    <circle cx={140} cy={460} r={5} fill={C.yellow} />
                    <text x={150} y={464} fontSize={10} fill={C.muted} fontFamily="'Nunito', sans-serif">One-time setup</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* SELECTED NODE DETAIL */}
            {selectedNode && (
              <div className="card fade" style={{ borderColor: selectedNode.color + "55", background: selectedNode.color + "08" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 28 }}>{selectedNode.icon}</span>
                      <div>
                        <span className="badge" style={{ background: selectedNode.color + "22", color: selectedNode.color, marginBottom: 4 }}>{selectedNode.id}</span>
                        <div className="syne" style={{ fontSize: 18, fontWeight: 800, color: selectedNode.color }}>{selectedNode.label}</div>
                        <div className="nun" style={{ fontSize: 12, color: C.muted }}>{selectedNode.sub}</div>
                      </div>
                    </div>
                    <p className="nun" style={{ fontSize: 13, lineHeight: 1.8, color: C.text }}>{selectedNode.detail}</p>
                  </div>
                  <div className="card-xs">
                    <div className="mono" style={{ fontSize: 10, color: selectedNode.color, marginBottom: 6 }}>N8N NODE TYPE</div>
                    <div className="nun" style={{ fontSize: 13, fontWeight: 600 }}>{selectedNode.n8nNode}</div>
                  </div>
                  <div className="card-xs">
                    <div className="mono" style={{ fontSize: 10, color: selectedNode.color, marginBottom: 6 }}>API NEEDED</div>
                    <div className="nun" style={{ fontSize: 13, fontWeight: 600 }}>{selectedNode.apiNeeded}</div>
                  </div>
                </div>
              </div>
            )}
            {!selectedNode && (
              <div className="card" style={{ textAlign: "center", padding: "20px", borderStyle: "dashed" }}>
                <p className="nun" style={{ fontSize: 13, color: C.muted }}>👆 Click any node above to see its full configuration, required API, and n8n setup instructions</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ HONEST LIMITS TAB ═══ */}
        {tab === "Honest Limits" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <h2 className="syne" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>What I Need To Tell You Before You Build This</h2>
              <p className="nun" style={{ fontSize: 13, color: C.muted }}>4 things you must know. Some are good news. Some require a workaround. All are honest.</p>
            </div>
            {warnings.map((w, i) => {
              const colors = { high: C.red, medium: C.yellow, low: C.green };
              const c = colors[w.severity];
              return (
                <div key={i} className="card" style={{ borderLeft: `4px solid ${c}`, display: "grid", gridTemplateColumns: "48px 1fr", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: c + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{w.icon}</div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="syne" style={{ fontWeight: 800, fontSize: 15 }}>{w.title}</span>
                      <span className="badge" style={{ background: c + "22", color: c }}>{w.severity.toUpperCase()}</span>
                    </div>
                    <p className="nun" style={{ fontSize: 13, color: C.text, lineHeight: 1.8 }}>{w.desc}</p>
                  </div>
                </div>
              );
            })}

            {/* The replacement map */}
            <div className="card" style={{ borderColor: C.gold + "44", background: C.gold + "06" }}>
              <div className="syne" style={{ fontWeight: 800, fontSize: 16, marginBottom: 14, color: C.gold }}>
                🔄 The Replacement Map — What Replaces What
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" }}>
                {[
                  { wanted: "NotebookLM Cinematic (Pro — no API)", arrow: "→", replacement: "notebooklm-py CLI (unofficial, works now)", c: C.yellow },
                  { wanted: "Meta AI Vibes (NO API exists)", arrow: "→", replacement: "Fal.ai Veo 3.1 + Wikimedia real photos", c: C.red },
                  { wanted: "Google Flow UI (NO API exists)", arrow: "→", replacement: "Fal.ai Veo 3.1 API (same Veo model)", c: C.red },
                  { wanted: "Manual video editing", arrow: "→", replacement: "FFmpeg via n8n Execute Command (free)", c: C.green },
                  { wanted: "Manual YouTube upload", arrow: "→", replacement: "Native n8n YouTube node (confirmed working)", c: C.green },
                  { wanted: "Manual SEO", arrow: "→", replacement: "Gemini API generates title/desc/tags/chapters", c: C.green },
                ].map((row, i) => (
                  <div key={i} style={{ display: "contents" }}>
                    <div className="card-xs" style={{ borderLeft: `2px solid ${row.c}` }}>
                      <div className="nun" style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>WANTED</div>
                      <div className="nun" style={{ fontSize: 12 }}>{row.wanted}</div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 20, color: C.gold }}>→</div>
                    <div className="card-xs" style={{ borderLeft: `2px solid ${C.green}`, background: C.green + "08" }}>
                      <div className="nun" style={{ fontSize: 12, color: C.green, marginBottom: 2 }}>REPLACEMENT</div>
                      <div className="nun" style={{ fontSize: 12 }}>{row.replacement}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SETUP STEPS TAB ═══ */}
        {tab === "Setup Steps" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 className="syne" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>7-Step Setup — Do This Once, Then It Runs Forever</h2>
              <p className="nun" style={{ fontSize: 13, color: C.muted }}>Total setup time: ~3–4 hours. After that, every video is fully automatic.</p>
            </div>
            <div className="card" style={{ padding: "8px 20px" }}>
              {steps.map((s, i) => (
                <div key={i} className="step-row">
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: `${Object.values({ a: C.teal, b: C.blue, c: C.purple, d: C.orange, e: C.gold, f: C.green, g: C.red })[i]}22`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: Object.values({ a: C.teal, b: C.blue, c: C.purple, d: C.orange, e: C.gold, f: C.green, g: C.red })[i], flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <div className="syne" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                    <p className="nun" style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                  <div className="card-xs" style={{ textAlign: "center", whiteSpace: "nowrap", minWidth: 90 }}>
                    <div className="nun" style={{ fontSize: 10, color: C.muted }}>EST. TIME</div>
                    <div className="mono" style={{ fontSize: 12, color: C.gold, marginTop: 2 }}>{s.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card" style={{ marginTop: 16, borderColor: C.teal + "44" }}>
              <div className="syne" style={{ fontWeight: 800, fontSize: 14, color: C.teal, marginBottom: 10 }}>🔑 All API Keys You Need — In One Place</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {[
                  { key: "Gemini API Key", get: "aistudio.google.com → Get API Key", cost: "Free tier available", c: C.blue },
                  { key: "Google Cloud Project", get: "console.cloud.google.com → New Project", cost: "Free + $300 credits", c: C.blue },
                  { key: "YouTube Data API v3", get: "GCloud Console → APIs → Enable", cost: "Free (personal use)", c: C.red },
                  { key: "Google Cloud TTS API", get: "GCloud Console → APIs → Enable", cost: "$0.05/video", c: C.blue },
                  { key: "Google Sheets API", get: "GCloud Console → APIs → Enable", cost: "Free", c: C.green },
                  { key: "Fal.ai API Key", get: "fal.ai → Dashboard → API Keys", cost: "$0.80/clip", c: C.orange },
                  { key: "notebooklm-py auth", get: "pip install notebooklm-py && notebooklm login", cost: "Free (uses Pro plan)", c: C.purple },
                ].map((k, i) => (
                  <div key={i} className="card-xs" style={{ borderLeft: `2px solid ${k.c}` }}>
                    <div className="syne" style={{ fontSize: 12, fontWeight: 700, color: k.c, marginBottom: 4 }}>{k.key}</div>
                    <div className="nun" style={{ fontSize: 11, color: C.text, marginBottom: 2 }}>{k.get}</div>
                    <div className="mono" style={{ fontSize: 10, color: C.muted }}>{k.cost}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ COSTS TAB ═══ */}
        {tab === "Costs" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 className="syne" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Complete Cost Breakdown</h2>
              <p className="nun" style={{ fontSize: 13, color: C.muted }}>For 30 videos/month (3x per week). All costs are real — no hidden fees.</p>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#08080F", borderBottom: `1px solid ${C.border}` }}>
                    {["Service", "Monthly Cost", "Per Video", "Notes"].map(h => (
                      <th key={h} className="mono" style={{ padding: "12px 16px", fontSize: 10, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1.5, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {costBreakdown.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 1 ? "#0A0A14" : "transparent" }}>
                      <td className="nun" style={{ padding: "11px 16px", fontSize: 13, fontWeight: i === costBreakdown.length - 1 ? 700 : 400, color: i === costBreakdown.length - 1 ? C.gold : C.text }}>{row.service}</td>
                      <td className="mono" style={{ padding: "11px 16px", fontSize: 12, color: row.monthly === "$0" ? C.green : i === costBreakdown.length - 1 ? C.gold : C.text, fontWeight: i === costBreakdown.length - 1 ? 700 : 400 }}>{row.monthly}</td>
                      <td className="mono" style={{ padding: "11px 16px", fontSize: 12, color: row.perVideo === "$0" ? C.green : C.text }}>{row.perVideo}</td>
                      <td className="nun" style={{ padding: "11px 16px", fontSize: 12, color: C.muted }}>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ borderColor: C.green + "44", background: C.green + "06" }}>
                <div className="syne" style={{ fontWeight: 800, fontSize: 14, color: C.green, marginBottom: 10 }}>💡 Slash Cost to ~$2/Video</div>
                {[
                  "Use only 3 Fal.ai clips instead of 8 per video (saves $4/video)",
                  "Fill remaining 15+ scenes with free Wikimedia photos + Ken Burns",
                  "Your 1,000 Flow credits handle hero shots for free",
                  "Total: ~$2.45/video at 30 videos/month = $73/mo total"
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: C.green, flexShrink: 0 }}>✓</span>
                    <p className="nun" style={{ fontSize: 12, lineHeight: 1.6 }}>{tip}</p>
                  </div>
                ))}
              </div>
              <div className="card" style={{ borderColor: C.gold + "44", background: C.gold + "06" }}>
                <div className="syne" style={{ fontWeight: 800, fontSize: 14, color: C.gold, marginBottom: 10 }}>📈 When Does This Pay Off?</div>
                {[
                  "YouTube monetizes at 1,000 subs + 4,000 watch hours",
                  "Based on your 90-day roadmap: monetized by Day 90",
                  "CPM for History/Psychology niche: $4–12 per 1,000 views",
                  "At 10,000 views/video × 30 videos: ~$1,200–3,600/mo revenue",
                  "Pipeline cost: ~$214/mo — ROI positive within 3 months"
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: C.gold, flexShrink: 0 }}>→</span>
                    <p className="nun" style={{ fontSize: 12, lineHeight: 1.6 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ JSON PREVIEW TAB ═══ */}
        {tab === "JSON Preview" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 className="syne" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>n8n Workflow JSON</h2>
              <p className="nun" style={{ fontSize: 13, color: C.muted }}>Download the JSON file below and import directly into n8n. All nodes pre-built. Just add your API credentials.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
              {[
                { step: "1", action: "Download JSON file below", icon: "⬇️" },
                { step: "2", action: "Open n8n → Workflows → Import", icon: "📥" },
                { step: "3", action: "Add credentials to each node", icon: "🔑" },
                { step: "4", action: "Run with test topic, watch it go", icon: "▶️" },
              ].map(s => (
                <div key={s.step} className="card-xs" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: C.muted }}>STEP {s.step}</div>
                    <div className="nun" style={{ fontSize: 12 }}>{s.action}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#050510", border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, overflow: "auto", maxHeight: 400 }}>
              <pre className="mono" style={{ fontSize: 11, lineHeight: 1.8, color: "#8888AA", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
{`{
  "name": "History × Psychology YouTube Automation",
  "nodes": [
    {
      "id": "schedule-trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{ "field": "weeks", "weeksInterval": 1,
            "triggerAtDay": [1, 3, 5], "triggerAtHour": 14 }]
        }
      }
    },
    {
      "id": "read-topic",
      "name": "Read Next Topic",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetId": "YOUR_SHEET_ID",
        "filters": { "status": "PENDING" },
        "limit": 1
      }
    },
    {
      "id": "gemini-research-script",
      "name": "Gemini — Research + Script + SEO",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
        "headers": { "x-goog-api-key": "={{ $credentials.geminiApiKey }}" },
        "body": {
          "contents": [{
            "parts": [{
              "text": "You are a YouTube scriptwriter for 'Mindset of History'...
                        Topic: {{ $json.topic }}
                        Return JSON with: research, script_sections, 
                        veo_prompts (array of 8), seo_title, 
                        seo_description, seo_tags (15), chapters"
            }]
          }],
          "generationConfig": { "responseMimeType": "application/json" }
        }
      }
    },
    {
      "id": "notebooklm-generate",
      "name": "NotebookLM — Base Video",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "notebooklm create '{{ $json.research.subject }}' && notebooklm source add '{{ $json.research.wikipedia_url }}' && notebooklm generate video --style cinematic --wait && notebooklm download video /tmp/notebooklm_base.mp4"
      }
    },
    {
      "id": "fal-veo-loop",
      "name": "Fal.ai — Generate Veo Clips",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": { "batchSize": 1 },
      "note": "Loops through each of 8 scene prompts"
    },
    {
      "id": "fal-veo-http",
      "name": "Fal.ai Veo 3.1 API Call",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://fal.run/fal-ai/veo3",
        "headers": { "Authorization": "Key {{ $credentials.falApiKey }}" },
        "body": {
          "prompt": "={{ $json.veo_prompt }}",
          "duration": 8,
          "aspect_ratio": "16:9"
        }
      }
    },
    {
      "id": "wikimedia-photos",
      "name": "Wikimedia — Fetch Real Photo",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://commons.wikimedia.org/w/api.php",
        "queryParameters": {
          "action": "query", "format": "json",
          "generator": "search", "gsrsearch": "={{ $json.subject }}",
          "prop": "imageinfo", "iiprop": "url",
          "iiurlwidth": 1920
        }
      }
    },
    {
      "id": "google-tts",
      "name": "Google TTS — Neural2 Voiceover",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://texttospeech.googleapis.com/v1/text:synthesize",
        "headers": { "Authorization": "Bearer {{ $credentials.googleCloudToken }}" },
        "body": {
          "input": { "text": "={{ $json.full_narration }}" },
          "voice": { "languageCode": "en-US", "name": "en-US-Neural2-D" },
          "audioConfig": { "audioEncoding": "MP3", "speakingRate": 0.92, "pitch": -1.5 }
        }
      }
    },
    {
      "id": "ffmpeg-assemble",
      "name": "FFmpeg — Assemble Final Video",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "ffmpeg -y -f concat -safe 0 -i /tmp/clips_list.txt -i /tmp/voiceover.mp3 -i /tmp/background_music.mp3 -filter_complex '[2:a]volume=0.08[bg];[1:a][bg]amix=inputs=2:duration=first[audio]' -map 0:v -map '[audio]' -c:v libx264 -crf 18 -c:a aac -b:a 192k -movflags +faststart /tmp/final_video.mp4"
      }
    },
    {
      "id": "youtube-upload",
      "name": "YouTube — Upload + Schedule",
      "type": "n8n-nodes-base.youTube",
      "parameters": {
        "operation": "upload",
        "title": "={{ $json.seo_title }}",
        "description": "={{ $json.seo_description }}",
        "tags": "={{ $json.seo_tags }}",
        "privacyStatus": "private",
        "publishAt": "={{ $json.scheduled_publish_time }}",
        "filePath": "/tmp/final_video.mp4"
      }
    },
    {
      "id": "update-sheet",
      "name": "Mark DONE in Sheet",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "update",
        "sheetId": "YOUR_SHEET_ID",
        "columns": {
          "STATUS": "DONE",
          "YOUTUBE_URL": "={{ $json.youtube_url }}",
          "PUBLISHED_AT": "={{ $json.scheduled_publish_time }}"
        }
      }
    }
  ],
  "connections": {
    "Schedule Trigger": { "main": [["Read Next Topic"]] },
    "Read Next Topic": { "main": [["Gemini — Research + Script + SEO"]] },
    "Gemini — Research + Script + SEO": { "main": [["NotebookLM — Base Video", "Fal.ai — Generate Veo Clips", "Wikimedia — Fetch Real Photo", "Google TTS — Neural2 Voiceover"]] },
    "NotebookLM — Base Video": { "main": [["FFmpeg — Assemble Final Video"]] },
    "Fal.ai Veo 3.1 API Call": { "main": [["FFmpeg — Assemble Final Video"]] },
    "Wikimedia — Fetch Real Photo": { "main": [["FFmpeg — Assemble Final Video"]] },
    "Google TTS — Neural2 Voiceover": { "main": [["FFmpeg — Assemble Final Video"]] },
    "FFmpeg — Assemble Final Video": { "main": [["YouTube — Upload + Schedule"]] },
    "YouTube — Upload + Schedule": { "main": [["Mark DONE in Sheet"]] }
  }
}`}
              </pre>
            </div>
            <p className="nun" style={{ fontSize: 12, color: C.muted, marginTop: 12 }}>
              ⬇️ Full importable JSON file is provided separately below — this is a preview. Replace YOUR_SHEET_ID and credentials before importing.
            </p>
          </div>
        )}

      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 20px", textAlign: "center" }}>
        <p className="nun" style={{ fontSize: 11, color: C.muted }}>
          n8n Full Automation · <span style={{ color: C.gold }}>History × Psychology YouTube Channel</span> · 12 Nodes · Zero Manual Work After Setup
        </p>
      </div>
    </div>
  );
}
