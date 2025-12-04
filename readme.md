# GitHub Readme Stats

Dynamically generated GitHub stats cards for your README.

<div>
  <h1>GitHub Readme Stats</h1>
  <p>Get dynamically generated GitHub stats on your READMEs!</p>
</div>

<details>
<summary>Table of contents</summary>

- [Quick Start](#quick-start)
- [GitHub Stats Card](#github-stats-card)
- [Top Languages Card](#top-languages-card)
- [Repository Card](#repository-card)
- [Gist Card](#gist-card)
- [WakaTime Card](#wakatime-card)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Support](#support)

</details>

## Quick Start

Add this to your README (replace `YOUR_USERNAME` with your GitHub username):

```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME)
```

> **Note:** Replace `YOUR-INSTANCE.WORKERS.DEV` with your deployed Cloudflare Workers instance URL and `YOUR_USERNAME` with your GitHub username.

---

## Important Notes

> [!IMPORTANT]
> The GitHub API allows 5k requests per hour per account. Public instances may hit rate limits. We use caching to prevent this. For better control, [deploy your own instance](#deployment).

> [!WARNING]
> By default, cards only show statistics from public repositories. To include private repository statistics, deploy your own instance with a GitHub Personal Access Token.

---

## GitHub Stats Card

Display your GitHub statistics including stars, commits, pull requests, and more.

### Basic Usage

```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME)
```

### Common Options

| Parameter | Description | Example |
|-----------|-------------|---------|
| `username` | GitHub username (required) | `anuraghazra` |
| `theme` | Theme name | `dark`, `radical`, `merko`, etc. |
| `hide` | Hide specific stats | `stars,commits,prs` |
| `show` | Show additional stats | `reviews,discussions_started` |
| `show_icons` | Display icons | `true` |
| `hide_border` | Hide card border | `true` |
| `bg_color` | Background color (hex) | `1a1b27` |
| `title_color` | Title color (hex) | `fff` |
| `text_color` | Text color (hex) | `9f9f9f` |
| `border_color` | Border color (hex) | `e4e2e2` |
| `locale` | Language | `en`, `es`, `fr`, etc. |
| `cache_seconds` | Cache duration (21600-86400) | `21600` |

### Stats Card Specific Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `hide_title` | Hide card title | `false` |
| `hide_rank` | Hide rank badge | `false` |
| `rank_icon` | Rank icon style | `default`, `github`, `percentile` |
| `card_width` | Card width in pixels | `500` |
| `include_all_commits` | Count all commits (not just current year) | `false` |
| `commits_year` | Filter commits by year | Current year |
| `exclude_repo` | Exclude repositories | Comma-separated list |
| `custom_title` | Custom card title | `<username> GitHub Stats` |
| `number_format` | Number format | `short` (e.g., `6.6k`) or `long` (e.g., `6626`) |

### Examples

**Hide specific stats:**
```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&hide=contribs,prs)
```

**Show icons:**
```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&show_icons=true)
```

**Use a theme:**
```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&theme=radical)
```

**Custom colors:**
```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&bg_color=151515&title_color=fff&text_color=9f9f9f)
```

### Available Themes

Popular themes include: `dark`, `radical`, `merko`, `gruvbox`, `tokyonight`, `onedark`, `cobalt`, `synthwave`, `highcontrast`, `dracula`, `transparent`, and more.

See [all available themes](themes/README.md) for the complete list.

### Responsive Themes

Use GitHub's theme context tags for automatic dark/light mode:

```markdown
[![GitHub Stats Dark](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&theme=dark#gh-dark-mode-only)](https://github.com/YOUR_USERNAME)
[![GitHub Stats Light](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&theme=default#gh-light-mode-only)](https://github.com/YOUR_USERNAME)
```

---

## Top Languages Card

Display your most frequently used programming languages.

### Basic Usage

```markdown
![Top Languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME)
```

### Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `layout` | Layout style | `normal`, `compact`, `donut`, `donut-vertical`, `pie` |
| `langs_count` | Number of languages to show (1-20) | `5` |
| `hide` | Hide specific languages | Comma-separated list |
| `exclude_repo` | Exclude repositories | Comma-separated list |
| `size_weight` | Weight for byte count in ranking | `1` |
| `count_weight` | Weight for repo count in ranking | `0` |
| `stats_format` | Display format | `percentages` or `bytes` |
| `hide_progress` | Hide progress bars | `false` |

### Examples

**Compact layout:**
```markdown
![Top Languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME&layout=compact)
```

**Donut chart:**
```markdown
![Top Languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME&layout=donut)
```

**Show more languages:**
```markdown
![Top Languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME&langs_count=8)
```

**Hide specific languages:**
```markdown
![Top Languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME&hide=javascript,html)
```

### Language Ranking Algorithm

Languages are ranked using:
```
ranking_index = (byte_count ^ size_weight) * (repo_count ^ count_weight)
```

- Default (`size_weight=1, count_weight=0`): Orders by byte count
- Recommended (`size_weight=0.5, count_weight=0.5`): Uses both byte and repo count
- Repo-based (`size_weight=0, count_weight=1`): Orders by repo count

---

## Repository Card

Pin additional repositories beyond GitHub's 6-repo limit.

### Basic Usage

```markdown
![Repository Card](https://YOUR-INSTANCE.WORKERS.DEV/api/pin?username=YOUR_USERNAME&repo=REPO_NAME)
```

### Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `show_owner` | Show repository owner | `false` |
| `description_lines_count` | Number of description lines (1-3) | Auto |

### Example

```markdown
![Repository Card](https://YOUR-INSTANCE.WORKERS.DEV/api/pin?username=YOUR_USERNAME&repo=github-readme-stats&show_owner=true)
```

---

## Gist Card

Display GitHub Gists in your README.

### Basic Usage

```markdown
![Gist Card](https://YOUR-INSTANCE.WORKERS.DEV/api/gist?id=GIST_ID)
```

### Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `show_owner` | Show gist owner | `false` |

### Example

```markdown
![Gist Card](https://YOUR-INSTANCE.WORKERS.DEV/api/gist?id=bbfce31e0217a3689c8d961a356cb10d&show_owner=true)
```

---

## WakaTime Card

Display your WakaTime coding statistics.

> [!WARNING]
> Your WakaTime profile must be public. Enable both "Display code time publicly" and "Display languages, editors, os, categories publicly" in your WakaTime settings.

### Basic Usage

```markdown
![WakaTime Stats](https://YOUR-INSTANCE.WORKERS.DEV/api/wakatime?username=YOUR_WAKATIME_USERNAME)
```

### Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `layout` | Layout style | `default`, `compact` |
| `langs_count` | Limit number of languages | All languages |
| `hide_progress` | Hide progress bars | `false` |
| `display_format` | Display format | `time` or `percent` |
| `api_domain` | Custom API domain | `wakatime.com` |

### Example

```markdown
![WakaTime Stats](https://YOUR-INSTANCE.WORKERS.DEV/api/wakatime?username=YOUR_USERNAME&layout=compact)
```

---

## Deployment

### Prerequisites

1. **GitHub Personal Access Token (PAT)**
   - Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
   - Create a new token (classic) with `repo` and `read:user` scopes
   - Copy the token

### Deploy to Cloudflare Workers

1. **Fork this repository**

2. **Install dependencies:**
   ```bash
   pnpm install
   ```
   
   > **Note:** This project uses [pnpm](https://pnpm.io/) as the package manager. If you don't have pnpm installed, you can install it with `npm install -g pnpm`.

3. **Configure `wrangler.toml`:**
   ```toml
   name = "github-readme-stats"
   main = "src/worker.ts"
   compatibility_date = "2025-12-04"
   compatibility_flags = ["nodejs_compat"]

   [observability]
   enabled = true
   head_sampling_rate = 1

   [observability.logs]
   enabled = true
   head_sampling_rate = 1
   persist = true
   invocation_logs = true

   [observability.traces]
   enabled = true
   persist = true
   head_sampling_rate = 1

   [vars]
   PAT_1 = "your_pat_token_here"
   ```

   > [!WARNING]
   > For production, use Cloudflare secrets instead of `[vars]`:
   > ```bash
   > wrangler secret put PAT_1
   > ```

4. **Deploy:**

   **Option A: Manual deployment**
   ```bash
   npx wrangler deploy
   ```

   **Option B: GitHub Actions (Recommended)**
   
   Set up the following secrets in your GitHub repository:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token (create at [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens))
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found in the right sidebar of your Cloudflare dashboard)
   - `PAT_1`: Your GitHub Personal Access Token (optional, if not set in `wrangler.toml`)
   
   The workflow will automatically deploy on every push to `main`/`master` branch, or you can trigger it manually from the Actions tab.

5. **Your instance will be available at:**
   ```
   https://your-worker-name.your-subdomain.workers.dev
   ```

6. **Update your README URLs** to use your new domain!

### Environment Variables

Configure your instance using these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PAT_1`, `PAT_2`, etc. | GitHub Personal Access Tokens | `ghp_...` |
| `CACHE_SECONDS` | Cache duration in seconds (0 to disable) | `21600` |
| `WHITELIST` | Comma-separated allowed usernames | `user1,user2` |
| `GIST_WHITELIST` | Comma-separated allowed Gist IDs | `id1,id2` |
| `EXCLUDE_REPO` | Comma-separated repositories to exclude | `repo1,repo2` |
| `FETCH_MULTI_PAGE_STARS` | Fetch all starred repos | `true` or `false` |

> [!WARNING]
> Redeploy your instance after changing environment variables for changes to take effect.

### Keep Your Fork Updated

Use GitHub's [Sync Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) feature or the [pull](https://github.com/wei/pull) package to keep your fork up to date.

---

## Configuration

### Available Locales

The cards support multiple languages. Set the `locale` parameter to use:

`ar`, `az`, `bn`, `bg`, `my`, `ca`, `cn`, `zh-tw`, `cs`, `nl`, `en`, `fil`, `fi`, `fr`, `de`, `el`, `he`, `hi`, `hu`, `id`, `it`, `ja`, `kr`, `ml`, `np`, `no`, `fa`, `pl`, `pt-br`, `pt-pt`, `ro`, `ru`, `sa`, `sr`, `sr-latn`, `sk`, `es`, `sw`, `se`, `ta`, `th`, `tr`, `uk-ua`, `ur`, `uz`, `vi`

Example:
```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&locale=es)
```

### Caching

Default cache durations:
- Stats card: 24 hours
- Top languages card: 144 hours (6 days)
- Repository card: 240 hours (10 days)
- Gist card: 48 hours (2 days)
- WakaTime card: 24 hours

Override with `cache_seconds` parameter (min: 21600, max: 86400) or set `CACHE_SECONDS` environment variable.

### Aligning Cards Side by Side

Use HTML with `align` attribute:

```html
<a href="https://github.com/YOUR_USERNAME">
  <img height=200 align="center" src="https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME" />
</a>
<a href="https://github.com/YOUR_USERNAME">
  <img height=200 align="center" src="https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME&layout=compact" />
</a>
```

---

## Support

Contributions are welcome! If you find this project useful:

- ⭐ Star the repository
- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation

Made with ❤️ and JavaScript.

[![Powered by Cloudflare Workers](https://img.shields.io/badge/Powered%20by-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
