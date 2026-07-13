# QuuCast App Launcher

A static launch page for Quu-branded apps, themed to match the Quu HD Radio Network and Quu Station Status Dashboard (same navy/blue palette, logo, and typography). Hosted on GitHub, deployed via Cloudflare Pages, with the local apps exposed through a Cloudflare Tunnel.

## Files

- `index.html` — landing page with app tiles
- `settings.html` — shows the configured apps and how to edit them
- `config.json` — app definitions used by the launcher
- `styles.css` — Quu theme (dark navy by default, auto light mode)
- `script.js` — loads tiles from `config.json`
- `assets/quu-logo-light.svg` / `assets/quu-logo-dark.svg` — Quu logo, pulled from the Station Status app
- `favicon.ico` — Quu favicon, pulled from the Station Status app

## Current apps

| Tile | Local address | Public address (via tunnel) |
|---|---|---|
| Quu HD Radio Network | `http://192.168.1.37:3002` | `https://hdradio.quucast.com` |
| Quu Station Status | `http://192.168.1.37:4173` | `https://status.quucast.com` |

`config.json` already points at the public `quucast.com` addresses. Those won't resolve until the Cloudflare Tunnel below is set up and DNS records exist.

The Quu HD Radio Tuner (`192.168.1.37:8080`) wasn't added as a tile — say the word if you want a third tile for it later.

---

## 1. Push to GitHub

From `c:\quucast-web` in PowerShell:

```powershell
git init
git add .
git commit -m "Initial QuuCast launcher"
git branch -M main
gh repo create quucast-web --public --source=. --remote=origin --push
```

(`gh repo create ... --push` creates the GitHub repo and pushes in one step. Use `--private` instead of `--public` if you'd rather it not be public.)

## 2. Connect Cloudflare Pages

1. Go to the Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Pick the `quucast-web` repo.
3. Build settings: framework preset **None**, build command **blank**, build output directory **`/`**.
4. Deploy. You'll get a `*.pages.dev` URL first.
5. In the Pages project → **Custom domains**, add `quucast.com` (and/or `www.quucast.com`). Since `quucast.com` is already in your Cloudflare account, this is a one-click DNS setup — no manual CNAME needed.

## 3. Create the tunnel in the Cloudflare dashboard

Tunnel routing is managed from the Zero Trust dashboard rather than local config files — it's simpler and there's nothing to hand-edit on the PC.

1. Go to **https://one.dash.cloudflare.com/** → pick your account → left sidebar **Networks → Tunnels**.
2. Click **Create a tunnel** → choose **Cloudflared** → name it `quucast-apps` → **Save tunnel**.
3. The next screen gives you an install/connector command for each OS. Copy the **Windows** one — it looks like:

   ```powershell
   cloudflared service install <token>
   ```

## 4. Run the connector on the dedicated PC

This is the PC actually running the HD Radio Server and Station Status apps (`192.168.1.37`).

Install `cloudflared` if it isn't already there:

```powershell
winget install --id Cloudflare.cloudflared
```

Then run the install command copied from step 3, in an **elevated** PowerShell:

```powershell
cloudflared service install <token>
```

This installs `cloudflared` as a Windows service and links it to the `quucast-apps` tunnel — no `login`, `create`, or local `config.yml` needed. Back in the dashboard, the tunnel should flip to **Connected**. Check the service is running with:

```powershell
Get-Service Cloudflared
```

## 5. Add the public hostnames

Still in the tunnel's page in the dashboard, open the **Public Hostname** tab.

**Add a public hostname:**
- Subdomain: `hdradio`
- Domain: `quucast.com`
- Service Type: `HTTP`
- URL: `localhost:3002`

**Add a public hostname** again:
- Subdomain: `status`
- Domain: `quucast.com`
- Service Type: `HTTP`
- URL: `localhost:4173`

Use `localhost`, not `192.168.1.37` — the connector runs on the same PC as the apps. Saving each hostname creates the DNS record and the routing rule together; nothing else to configure.

## 6. Verify

Visit `https://hdradio.quucast.com` and `https://status.quucast.com` directly to confirm both resolve and load before relying on the launcher page.

## 7. Done

Once the tunnel is live, `https://quucast.com` (Cloudflare Pages) will show both tiles, and clicking them will route through the tunnel to the apps on the dedicated PC — no port forwarding, no exposed local IP.

## Adding more apps later

Add an entry to `config.json`:

```json
{
  "name": "New App",
  "url": "https://newapp.quucast.com",
  "description": "What it does.",
  "icon": "link"
}
```

Built-in icon keys: `radio`, `status`. Anything else falls back to a generic link icon (see `script.js`). Then add a matching **public hostname** in the tunnel's dashboard page (subdomain `newapp`, domain `quucast.com`, pointing at the app's `localhost:<port>`).
