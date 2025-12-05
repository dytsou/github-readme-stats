# API Documentation

This document provides comprehensive documentation for all API endpoints available in the GitHub Readme Stats service.

> **OpenAPI Specification:** This API is also documented using the OpenAPI 3.1.0 specification. See [openapi.yaml](openapi.yaml) for the machine-readable API specification that can be used with tools like Swagger UI, Postman, or code generators.

## Base URL

All endpoints are relative to your deployed instance. For example:
- `https://your-instance.workers.dev/api`
- `https://your-instance.vercel.app/api`

## Response Format

All card endpoints return SVG images with `Content-Type: image/svg+xml; charset=utf-8`.

Status endpoints return JSON with `Content-Type: application/json`.

## Common Parameters

These parameters are available across all card endpoints:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `theme` | string | Theme name (see [themes](themes/README.md)) | `default` |
| `bg_color` | string | Background color (hex, without `#`) | Theme default |
| `title_color` | string | Title color (hex, without `#`) | Theme default |
| `text_color` | string | Text color (hex, without `#`) | Theme default |
| `border_color` | string | Border color (hex, without `#`) | Theme default |
| `hide_border` | boolean | Hide card border | `false` |
| `border_radius` | number | Border radius (0-50) | `4.5` |
| `cache_seconds` | number | Cache duration in seconds | Card-specific default |
| `locale` | string | Language locale code | `en` |

### Supported Locales

`ar`, `az`, `bn`, `bg`, `my`, `ca`, `cn`, `zh-tw`, `cs`, `nl`, `en`, `fil`, `fi`, `fr`, `de`, `el`, `he`, `hi`, `hu`, `id`, `it`, `ja`, `kr`, `ml`, `np`, `no`, `fa`, `pl`, `pt-br`, `pt-pt`, `ro`, `ru`, `sa`, `sr`, `sr-latn`, `sk`, `es`, `sw`, `se`, `ta`, `th`, `tr`, `uk-ua`, `ur`, `uz`, `vi`

### Cache Durations

Default cache durations (can be overridden with `cache_seconds`):

- **Stats Card**: 24 hours (86400 seconds)
- **Top Languages Card**: 6 days (518400 seconds)
- **Repository Card**: 10 days (864000 seconds)
- **Gist Card**: 2 days (172800 seconds)
- **WakaTime Card**: 24 hours (86400 seconds)

Minimum cache duration: 12 hours (43200 seconds)  
Maximum cache duration: 10 days (864000 seconds)

---

## Endpoints

### 1. Stats Card

Generate a GitHub statistics card showing stars, commits, pull requests, and more.

**Endpoint:** `GET /api`

**Required Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | GitHub username |

**Optional Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `hide` | string | Comma-separated list of stats to hide (`stars`, `commits`, `prs`, `contribs`, `issues`, `reviews`, `discussions_started`, `discussions_answered`) | - |
| `show` | string | Comma-separated list of additional stats to show (`reviews`, `discussions_started`, `discussions_answered`, `prs_merged`, `prs_merged_percentage`) | - |
| `hide_title` | boolean | Hide card title | `false` |
| `hide_rank` | boolean | Hide rank badge | `false` |
| `rank_icon` | string | Rank icon style (`default`, `github`, `percentile`) | `default` |
| `show_icons` | boolean | Display icons | `false` |
| `card_width` | number | Card width in pixels | `500` |
| `include_all_commits` | boolean | Count all commits (not just current year) | `false` |
| `commits_year` | number | Filter commits by year | Current year |
| `exclude_repo` | string | Comma-separated list of repositories to exclude | - |
| `custom_title` | string | Custom card title | `<username> GitHub Stats` |
| `number_format` | string | Number format (`short` or `long`) | `short` |
| `number_precision` | number | Number precision | - |
| `line_height` | number | Line height | - |
| `ring_color` | string | Ring color (hex, without `#`) | - |
| `icon_color` | string | Icon color (hex, without `#`) | - |
| `text_bold` | boolean | Make text bold | `false` |
| `disable_animations` | boolean | Disable animations | `false` |

**Example Request:**

```
GET /api?username=NAME&theme=dark&show_icons=true&hide=contribs,prs
```

**Example Response:**

SVG image with GitHub statistics card.

---

### 2. Top Languages Card

Display the most frequently used programming languages.

**Endpoint:** `GET /api/top-langs`

**Required Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | GitHub username |

**Optional Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `layout` | string | Layout style (`normal`, `compact`, `donut`, `donut-vertical`, `pie`) | `normal` |
| `langs_count` | number | Number of languages to show (1-20) | `5` |
| `hide` | string | Comma-separated list of languages to hide | - |
| `exclude_repo` | string | Comma-separated list of repositories to exclude | - |
| `size_weight` | number | Weight for byte count in ranking | `1` |
| `count_weight` | number | Weight for repo count in ranking | `0` |
| `stats_format` | string | Display format (`percentages` or `bytes`) | `percentages` |
| `hide_progress` | boolean | Hide progress bars | `false` |
| `hide_title` | boolean | Hide card title | `false` |
| `card_width` | number | Card width in pixels | `500` |
| `custom_title` | string | Custom card title | - |
| `disable_animations` | boolean | Disable animations | `false` |

**Language Ranking Algorithm:**

Languages are ranked using:
```
ranking_index = (byte_count ^ size_weight) * (repo_count ^ count_weight)
```

- **Default** (`size_weight=1, count_weight=0`): Orders by byte count
- **Recommended** (`size_weight=0.5, count_weight=0.5`): Uses both byte and repo count
- **Repo-based** (`size_weight=0, count_weight=1`): Orders by repo count

**Example Request:**

```
GET /api/top-langs?username=NAME&layout=compact&langs_count=8
```

**Example Response:**

SVG image with top languages card.

---

### 3. Repository Card

Pin additional repositories beyond GitHub's 6-repo limit.

**Endpoint:** `GET /api/pin`

**Required Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | GitHub username |
| `repo` | string | Repository name |

**Optional Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `show_owner` | boolean | Show repository owner | `false` |
| `description_lines_count` | number | Number of description lines (1-3) | Auto |

**Example Request:**

```
GET /api/pin?username=NAME&repo=github-readme-stats&show_owner=true
```

**Example Response:**

SVG image with repository card.

---

### 4. Gist Card

Display GitHub Gists in your README.

**Endpoint:** `GET /api/gist`

**Required Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Gist ID |

**Optional Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `show_owner` | boolean | Show gist owner | `false` |

**Example Request:**

```
GET /api/gist?id=bbfce31e0217a3689c8d961a356cb10d&show_owner=true
```

**Example Response:**

SVG image with gist card.

---

### 5. WakaTime Card

Display your WakaTime coding statistics.

> **Warning:** Your WakaTime profile must be public. Enable both "Display code time publicly" and "Display languages, editors, os, categories publicly" in your WakaTime settings.

**Endpoint:** `GET /api/wakatime`

**Required Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | WakaTime username |

**Optional Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `layout` | string | Layout style (`default`, `compact`) | `default` |
| `langs_count` | number | Limit number of languages | All languages |
| `hide_progress` | boolean | Hide progress bars | `false` |
| `display_format` | string | Display format (`time` or `percent`) | `time` |
| `api_domain` | string | Custom API domain | `wakatime.com` |
| `hide_title` | boolean | Hide card title | `false` |
| `card_width` | number | Card width in pixels | `500` |
| `custom_title` | string | Custom card title | - |
| `hide` | string | Comma-separated list of languages to hide | - |
| `line_height` | number | Line height | - |
| `icon_color` | string | Icon color (hex, without `#`) | - |
| `disable_animations` | boolean | Disable animations | `false` |

**Example Request:**

```
GET /api/wakatime?username=NAME&layout=compact
```

**Example Response:**

SVG image with WakaTime statistics card.

---

### 6. Status - Uptime Check

Check if the Personal Access Tokens (PATs) are still functional.

**Endpoint:** `GET /api/status/up`

**Optional Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `type` | string | Response type (`boolean`, `json`, `shields`) | `boolean` |

**Rate Limit:** 1 request per 5 minutes

**Response Types:**

- **boolean**: Returns `true` or `false`
- **json**: Returns `{"up": true}` or `{"up": false}`
- **shields**: Returns Shields.io compatible JSON:
  ```json
  {
    "schemaVersion": 1,
    "label": "Public Instance",
    "message": "up",
    "color": "brightgreen",
    "isError": true
  }
  ```

**Example Request:**

```
GET /api/status/up?type=json
```

**Example Response:**

```json
{"up": true}
```

---

### 7. Status - PAT Information

Get detailed information about Personal Access Tokens status.

**Endpoint:** `GET /api/status/pat-info`

**Rate Limit:** 1 request per 5 minutes

**Response Format:**

```json
{
  "validPATs": ["PAT_1", "PAT_2"],
  "expiredPATs": ["PAT_3"],
  "exhaustedPATs": ["PAT_4"],
  "suspendedPATs": [],
  "errorPATs": [],
  "details": {
    "PAT_1": {
      "status": "valid",
      "remaining": 4999
    },
    "PAT_2": {
      "status": "valid",
      "remaining": 5000
    },
    "PAT_3": {
      "status": "expired"
    },
    "PAT_4": {
      "status": "exhausted",
      "remaining": 0,
      "resetIn": "45 minutes"
    }
  }
}
```

**PAT Status Values:**

- `valid`: PAT is working correctly
- `expired`: PAT credentials are invalid
- `exhausted`: PAT has reached rate limit
- `suspended`: Account associated with PAT is suspended
- `error`: PAT has an error (details in `error` field)

**Example Request:**

```
GET /api/status/pat-info
```

**Example Response:**

```json
{
  "validPATs": ["PAT_1"],
  "expiredPATs": [],
  "exhaustedPATs": [],
  "suspendedPATs": [],
  "errorPATs": [],
  "details": {
    "PAT_1": {
      "status": "valid",
      "remaining": 4999
    }
  }
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found (user, repo, gist, etc.)
- `500 Internal Server Error`: Server error

Error responses are returned as SVG images (for card endpoints) or JSON (for status endpoints) with error messages.

### Common Error Scenarios

1. **Missing Required Parameter**
   - Returns SVG error card with message: "Missing username parameter"

2. **User Not Found**
   - Returns SVG error card with message: "User not found"

3. **Invalid Theme**
   - Falls back to default theme

4. **Invalid Locale**
   - Falls back to default locale (`en`)

5. **Rate Limit Exceeded**
   - Returns error message indicating rate limit

---

## Authentication

### Public Instances

Public instances may have rate limits. The GitHub API allows 5,000 requests per hour per account.

### Self-Hosted Instances

For self-hosted instances, configure GitHub Personal Access Tokens (PATs) as environment variables:

- `PAT_1`, `PAT_2`, `PAT_3`, etc.

Each PAT should have the following scopes:
- `repo` (for private repository access)
- `read:user` (for user information)

---

## Access Control

### Whitelisting

Control access using environment variables:

- `WHITELIST`: Comma-separated list of allowed usernames
- `GIST_WHITELIST`: Comma-separated list of allowed Gist IDs

If whitelisting is enabled, only whitelisted users/gists can access the API.

---

## Rate Limiting

### GitHub API Rate Limits

- **Authenticated requests**: 5,000 requests/hour
- **Unauthenticated requests**: 60 requests/hour

The service uses multiple PATs with automatic rotation to maximize rate limits.

### Service Rate Limits

- **Status endpoints** (`/api/status/*`): 1 request per 5 minutes

---

## Caching

All card endpoints support HTTP caching via the `Cache-Control` header. Default cache durations vary by endpoint type.

### Cache Headers

- `max-age`: Browser cache duration
- `s-maxage`: CDN/shared cache duration
- `stale-while-revalidate`: Allows serving stale content while revalidating

### Cache Override

Override default cache duration using the `cache_seconds` query parameter (subject to min/max limits).

---

## Examples

### Basic Stats Card

```markdown
![GitHub Stats](https://your-instance.workers.dev/api?username=NAME)
```

### Custom Theme and Icons

```markdown
![GitHub Stats](https://your-instance.workers.dev/api?username=NAME&theme=radical&show_icons=true)
```

### Hide Specific Stats

```markdown
![GitHub Stats](https://your-instance.workers.dev/api?username=NAME&hide=contribs,prs)
```

### Top Languages with Compact Layout

```markdown
![Top Languages](https://your-instance.workers.dev/api/top-langs?username=NAME&layout=compact)
```

### Repository Card

```markdown
![Repository Card](https://your-instance.workers.dev/api/pin?username=NAME&repo=github-readme-stats)
```

### Responsive Themes (Dark/Light Mode)

```markdown
[![GitHub Stats Dark](https://your-instance.workers.dev/api?username=NAME&theme=dark#gh-dark-mode-only)](https://github.com/NAME)
[![GitHub Stats Light](https://your-instance.workers.dev/api?username=NAME&theme=default#gh-light-mode-only)](https://github.com/NAME)
```

---

## Environment Variables

Configure your instance using these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PAT_1`, `PAT_2`, etc. | GitHub Personal Access Tokens | `ghp_...` |
| `CACHE_SECONDS` | Cache duration in seconds (0 to disable) | `21600` |
| `WHITELIST` | Comma-separated allowed usernames | `user1,user2` |
| `GIST_WHITELIST` | Comma-separated allowed Gist IDs | `id1,id2` |
| `EXCLUDE_REPO` | Comma-separated repositories to exclude | `repo1,repo2` |
| `FETCH_MULTI_PAGE_STARS` | Fetch all starred repos | `true` or `false` |

---

## Deployment

See the main [README.md](readme.md) for deployment instructions.
