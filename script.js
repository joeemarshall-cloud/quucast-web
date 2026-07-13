const configUrl = "config.json";
const fallbackApps = [
  {
    name: "Quu HD Radio Network",
    url: "https://hdradio.quucast.com",
    description: "Live tuner dashboard, signal and RDS data, and remote tuning.",
    icon: "radio"
  },
  {
    name: "Quu Station Status",
    url: "https://status.quucast.com",
    description: "Station health, stream status, and system uptime across the network.",
    icon: "status"
  }
];

const icons = {
  radio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4M12 12v.01" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
  status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2 8 4-16 2 8h6" /></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" /><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.36-1.36" /></svg>'
};

async function loadConfig() {
  try {
    const response = await fetch(configUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${configUrl}`);
    }
    const data = await response.json();
    if (data?.apps && Array.isArray(data.apps) && data.apps.length) {
      return data.apps;
    }
  } catch (error) {
    console.warn("Could not load config.json, using fallback apps.", error);
  }
  return fallbackApps;
}

function createTile(app) {
  const anchor = document.createElement("a");
  anchor.className = "app-tile";
  anchor.href = app.url || "#";
  anchor.target = "_blank";
  anchor.rel = "noreferrer noopener";
  anchor.innerHTML = `
    <div class="tile-icon">${icons[app.icon] || icons.link}</div>
    <div>
      <h2>${app.name}</h2>
      <p>${app.description || "Open this app."}</p>
    </div>
    <span class="tile-label">${app.status || "Launch →"}</span>
  `;
  return anchor;
}

function renderDashboard(apps) {
  const grid = document.getElementById("dashboard-tiles");
  if (!grid) return;
  grid.innerHTML = "";
  if (!apps.length) {
    grid.innerHTML = '<div class="empty-state">No apps configured. Edit config.json or open settings.html.</div>';
    return;
  }
  apps.forEach((app) => grid.appendChild(createTile(app)));
}

function renderSettings(apps) {
  const list = document.getElementById("settings-app-list");
  if (!list) return;
  list.innerHTML = "";
  if (!apps.length) {
    list.innerHTML = '<div class="empty-state">No apps configured. Add items to config.json.</div>';
    return;
  }
  apps.forEach((app) => {
    const item = document.createElement("div");
    item.className = "settings-item";
    item.innerHTML = `
      <div class="settings-preview">
        <span class="tile-icon">${icons[app.icon] || icons.link}</span>
        <div>
          <h3>${app.name}</h3>
          <p>${app.description || "No description provided."}</p>
          <p class="settings-url">${app.url || "No URL configured"}</p>
        </div>
      </div>
      ${app.status ? `<span class="app-status">${app.status}</span>` : ""}
    `;
    list.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const apps = await loadConfig();
  renderDashboard(apps);
  renderSettings(apps);
});
