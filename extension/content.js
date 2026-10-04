// CivicSync PH extension (CS-115): finds bill numbers on the page ("SB 1294",
// "Senate Bill No. 1294", "H.B. 4659") and shows their live status on hover.
(() => {
  const RE = /\b(S\.?\s?B\.?|H\.?\s?B\.?|Senate\s+Bill|House\s+Bill)\s*(?:No\.?\s*)?(\d{1,5})\b/gi;
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "CODE", "PRE", "A", "BUTTON"]);
  const MAX = 300;
  let found = 0;

  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    if (!enabled) return;
    scan(document.body);
    let t;
    new MutationObserver((muts) => {
      clearTimeout(t);
      t = setTimeout(() => muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n))), 400);
    }).observe(document.body, { childList: true, subtree: true });
  });

  function scan(root) {
    if (found >= MAX) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p || p.closest("[data-civicsync],[contenteditable='true']")) return NodeFilter.FILTER_REJECT;
        for (let el = p; el && el !== root.parentElement; el = el.parentElement) if (SKIP.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        RE.lastIndex = 0;
        return RE.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    const nodes = [];
    while (walker.nextNode() && nodes.length < 100) nodes.push(walker.currentNode);
    nodes.forEach(wrap);
  }

  function wrap(node) {
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let last = 0;
    RE.lastIndex = 0;
    for (const m of text.matchAll(RE)) {
      if (found >= MAX) break;
      const kind = /^s/i.test(m[1]) ? "SB" : "HB";
      frag.append(text.slice(last, m.index));
      const span = document.createElement("span");
      span.textContent = m[0];
      span.dataset.civicsync = `${kind}${m[2]}`;
      span.tabIndex = 0;
      span.style.cssText = "text-decoration: underline dotted #1E3A8A; text-underline-offset: 3px; cursor: help;";
      span.addEventListener("mouseenter", () => show(span));
      span.addEventListener("focus", () => show(span));
      span.addEventListener("mouseleave", hideSoon);
      span.addEventListener("blur", hideSoon);
      frag.append(span);
      last = m.index + m[0].length;
      found++;
    }
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }

  // One tooltip in a shadow root, so page styles can't break it (and vice versa).
  let host, box, timer;
  function tooltip() {
    if (box) return box;
    host = document.createElement("div");
    host.dataset.civicsync = "tooltip";
    host.style.cssText = "position:fixed;z-index:2147483647;top:0;left:0;display:none;";
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `<style>
      .t{width:300px;font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fff;color:#111827;border:1px solid #E5E7EB;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);padding:12px 14px}
      .m{display:flex;justify-content:space-between;font-size:11px;color:#6B7280}.b{font-weight:700;color:#1E3A8A}
      .ti{margin-top:4px;font-weight:600;font-size:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
      .s{display:inline-block;margin-top:8px;padding:2px 10px;border-radius:99px;font-weight:600;font-size:12px}
      .law{background:#ECFDF5;color:#065F46}.moving{background:#EFF6FF;color:#1E3A8A}.committee{background:#FFFBEB;color:#92400E}.stalled{background:#FEF2F2;color:#991B1B}.unknown{background:#F3F4F6;color:#4B5563}
      .by{margin-top:6px;font-size:12px;color:#4B5563}.n{margin-top:8px;font-size:11px;color:#6B7280}
      a{display:inline-block;margin-top:8px;font-weight:700;color:#991B1B;text-decoration:none}a:hover{text-decoration:underline}
    </style><div class="t" role="tooltip"></div>`;
    box = shadow.querySelector(".t");
    host.addEventListener("mouseenter", () => clearTimeout(timer));
    host.addEventListener("mouseleave", hideSoon);
    document.documentElement.append(host);
    return box;
  }

  function place(el) {
    const r = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, innerWidth - 316));
    const below = r.bottom + 220 < innerHeight;
    host.style.left = `${left}px`;
    host.style.top = below ? `${r.bottom + 6}px` : "";
    host.style.bottom = below ? "" : `${innerHeight - r.top + 6}px`;
    host.style.display = "block";
  }

  function show(el) {
    clearTimeout(timer);
    const t = tooltip();
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    t.innerHTML = `<div class="m"><span class="b">${esc(el.dataset.civicsync.replace(/^(SB|HB)/, "$1 "))}</span><span>CivicSync PH</span></div><div class="ti">Loading…</div>`;
    place(el);
    chrome.runtime.sendMessage({ type: "bill", number: el.dataset.civicsync }, (d) => {
      if (!d) {
        t.innerHTML = `<div class="m"><span class="b">${esc(el.dataset.civicsync.replace(/^(SB|HB)/, "$1 "))}</span><span>CivicSync PH</span></div><div class="ti">Not found in the 20th Congress.</div>`;
        return;
      }
      t.innerHTML = `<div class="m"><span class="b">${esc(d.label)}</span><span>${esc(d.chamber)} · 20th Congress</span></div>
        <div class="ti">${esc(d.title)}</div>
        <span class="s ${esc(d.tone)}">${esc(d.status)}</span>
        ${d.byline ? `<div class="by">${esc(d.byline)}</div>` : ""}
        <div class="n">Older articles may mean a bill from an earlier Congress.</div>
        <a href="${esc(d.url)}" target="_blank" rel="noopener">See it on CivicSync →</a>`;
      place(el);
    });
  }

  function hideSoon() {
    clearTimeout(timer);
    timer = setTimeout(() => host && (host.style.display = "none"), 250);
  }
})();
