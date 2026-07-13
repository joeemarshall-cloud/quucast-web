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

## 3. Install `cloudflared` on the dedicated PC

This is the PC actually running the HD Radio Server and Station Status apps (`192.168.1.37`).

```powershell
winget install --id Cloudflare.cloudflared
```

Verify:

```powershell
cloudflared --version
```

## 4. Authenticate and create the tunnel

```powershell
cloudflared tunnel login
```

This opens a browser — sign in and pick `quucast.com` as the domain to authorize.

```powershell
cloudflared tunnel create quucast-apps
```

This prints a **tunnel ID** and writes a credentials JSON file to `%USERPROFILE%\.cloudflared\`. Note the tunnel ID for the config below.

## 5. Route the hostnames

```powershell
cloudflared tunnel route dns quucast-apps hdradio.quucast.com
cloudflared tunnel route dns quucast-apps status.quucast.com
```

This creates the DNS records in Cloudflare automatically (they'll show as proxied CNAMEs pointing at the tunnel).

## 6. Configure ingress

Create `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<you>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: hdradio.quucast.com
    service: http://localhost:3002
  - hostname: status.quucast.com
    service: http://localhost:4173
  - service: http_status:404
```

Use `localhost` here (not `192.168.1.37`) since `cloudflared` runs on the same machine as the apps.

## 7. Run the tunnel

Test it first in the foreground:

```powershell
cloudflared tunnel run quucast-apps
```

Visit `https://hdradio.quucast.com` and `https://status.quucast.com` to confirm both resolve. Then install it as a Windows service so it survives reboots:

```powershell
cloudflared service install
```

This uses the same `config.yml`. Check it's running with:

```powershell
Get-Service Cloudflared
```

## 8. Done

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

Built-in icon keys: `radio`, `status`. Anything else falls back to a generic link icon (see `script.js`). Then add a matching `ingress` entry in `config.yml`, run `cloudflared tunnel route dns quucast-apps newapp.quucast.com`, and restart the `Cloudflared` service.
