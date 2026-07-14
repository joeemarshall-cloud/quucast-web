const configUrl = "config.json";
const fallbackApps = [
  {
    name: "Quu HD Radio Network",
    url: "https://hdradionetwork.quucast.com",
    description: "Live tuner dashboard, signal and RDS data, and remote tuning.",
    image: "assets/tile-radio.svg"
  },
  {
    name: "Quu Station Status",
    url: "https://status.quucast.com",
    description: "Station health, stream status, and system uptime across the network.",
    image: "assets/tile-status.svg"
  },
  {
    name: "Quu Podcast Editor",
    url: "https://podedit.quucast.com",
    description: "Record, edit, and publish podcast episodes for the QuuCast network.",
    image: "assets/tile-podcast-editor.svg"
  }
];

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
  const preview = app.image
    ? `<img class="tile-image" src="${app.image}" alt="" loading="lazy" />`
    : `<div class="tile-image tile-image-placeholder"></div>`;
  anchor.innerHTML = `
    ${preview}
    <div class="tile-body">
      <h2>${app.name}</h2>
      <p>${app.description || "Open this app."}</p>
      <span class="tile-label">${app.status || "Launch →"}</span>
    </div>
  `;
  return anchor;
}

function renderDashboard(apps) {
  const grid = document.getElementById("dashboard-tiles");
  if (!grid) return;
  grid.innerHTML = "";
  if (!apps.length) {
    grid.innerHTML = '<div class="empty-state">No apps configured. Edit config.json to add apps.</div>';
    return;
  }
  apps.forEach((app) => grid.appendChild(createTile(app)));
}

document.addEventListener("DOMContentLoaded", async () => {
  const apps = await loadConfig();
  renderDashboard(apps);
});
