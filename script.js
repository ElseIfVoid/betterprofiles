const GITHUB_USER   = "ElseIfVoid";
const DISCORD_ID    = "1494680941862326312";
const WEB3FORMS_KEY = "f42a6262-f2a4-4f72-8166-f010e56d152c";

/* CLOCK */
function updateClock() {
  const now = new Date();
  document.getElementById("clock").innerText =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

/* GITHUB */
async function loadGithub() {
  try {
    const res  = await fetch(`https://api.github.com/users/${GITHUB_USER}`);
    const data = await res.json();
    document.getElementById("avatar").src         = data.avatar_url;
    document.getElementById("username").innerText = data.login;
    document.getElementById("bio").innerText      = data.bio || "professional button clicker";
    document.getElementById("followers").innerText = data.followers;
    document.getElementById("repo-stat").innerText = data.public_repos;
    document.getElementById("following").innerText  = data.following;
    const gh = document.getElementById("gh-link");
    if (gh) gh.href = data.html_url;
  } catch (e) {
    console.error("github failed", e);
  }
}

/* REPOS */
let allRepos = [];

async function loadRepos() {
  try {
    const res   = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=50`);
    const repos = await res.json();
    allRepos = Array.isArray(repos) ? repos : [];
    renderRepos(allRepos);
  } catch (e) {
    document.getElementById("repo-container").innerHTML = `<span class="muted">couldn't load repos</span>`;
  }
}

function renderRepos(repos) {
  const el = document.getElementById("repo-container");
  const ct = document.getElementById("repo-count");
  if (ct) ct.innerText = repos.length ? `${repos.length} found` : "";

  if (!repos.length) {
    el.innerHTML = `<span class="muted">no repos found</span>`;
    return;
  }

  el.innerHTML = repos.map(r => `
    <a href="${r.html_url}" target="_blank" class="repo-card">
      <div class="repo-card-top">
        <span class="repo-name">${esc(r.name)}</span>
        ${r.language ? `<span class="repo-lang">${esc(r.language)}</span>` : ""}
      </div>
      <div class="repo-desc">${esc(r.description || "no description")}</div>
      <div class="repo-meta">
        <span>★ ${r.stargazers_count || 0}</span>
        <span>⑂ ${r.forks_count || 0}</span>
        ${r.updated_at ? `<span>${timeAgo(r.updated_at)}</span>` : ""}
      </div>
    </a>
  `).join("");
}

document.getElementById("repo-search")?.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  renderRepos(q
    ? allRepos.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q)
      )
    : allRepos
  );
});

/* DISCORD */
async function loadDiscord() {
  try {
    const res  = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const json = await res.json();
    if (!json.success || !json.data) return;

    const d      = json.data;
    const status = d.discord_status || "offline";
    const colors = { online:"#00ff41", idle:"#faa61a", dnd:"#f04747", offline:"#444" };

    const dot = document.getElementById("status-dot");
    dot.style.background  = colors[status] || colors.offline;
    dot.style.boxShadow   = status === "online" ? "0 0 6px #00ff41" : "none";
    document.getElementById("discord-status").innerText = status;

    const box      = document.getElementById("activity-content");
    const custom   = d.activities?.find(a => a.type === 4);
    const activity = d.activities?.find(a => a.type !== 4 && a.name !== "Spotify");
    const spotify  = d.spotify;

    if (activity) {
      box.innerHTML = `
        <div class="activity-name">${esc(activity.name)}</div>
        <div class="activity-detail">${esc(activity.details || "")}</div>
        <div class="activity-state">${esc(activity.state || "")}</div>`;
    } else if (spotify) {
      box.innerHTML = `
        <div class="activity-name">♫ ${esc(spotify.song)}</div>
        <div class="activity-detail">${esc(spotify.artist)}</div>
        <div class="activity-state">spotify</div>`;
    } else if (custom) {
      box.innerHTML = `
        <div class="activity-name">${custom.emoji?.name || ""} ${esc(custom.state || "existing")}</div>`;
    } else {
      box.innerHTML = `<span class="muted">probably procrastinating</span>`;
    }
  } catch (e) {
    console.error("discord failed", e);
  }
}

setInterval(loadDiscord, 10000);

/* MESSAGE */
document.getElementById("send-btn")?.addEventListener("click", async () => {
  const name     = document.getElementById("msg-name").value.trim();
  const subject  = document.getElementById("msg-subject").value.trim();
  const body     = document.getElementById("msg-body").value.trim();
  const feedback = document.getElementById("msg-feedback");
  const btn      = document.getElementById("send-btn");

  if (!subject || !body) {
    feedback.className = "feedback error";
    feedback.innerText = "fill in subject + message";
    return;
  }

  btn.disabled = true;
  btn.innerText = "sending...";
  feedback.className = "feedback";
  feedback.innerText = "";

  try {
    const res  = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        name: name || "anonymous",
        subject,
        message: body,
      }),
    });
    const data = await res.json();
    if (data.success) {
      feedback.innerText = "message sent ✓";
      document.getElementById("msg-name").value    = "";
      document.getElementById("msg-subject").value = "";
      document.getElementById("msg-body").value    = "";
      setTimeout(() => { feedback.innerText = ""; }, 4000);
    } else {
      throw new Error(data.message);
    }
  } catch (e) {
    feedback.className = "feedback error";
    feedback.innerText = "failed, try again";
  } finally {
    btn.disabled = false;
    btn.innerText = "send →";
  }
});

/* HELPERS */
function esc(s) {
  if (!s) return "";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function timeAgo(d) {
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  if (days < 365) return `${Math.floor(days/30)}mo ago`;
  return `${Math.floor(days/365)}y ago`;
}

/* INIT */
loadGithub();
loadRepos();
loadDiscord();
