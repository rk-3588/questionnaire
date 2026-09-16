# Survey backend setup

The questionnaire uses the same JSON contract in the browser and on the server.
The production browser endpoint is `https://query.linxiksp.cn/api/survey`, which
reverse-proxies to the Node service. Set `VITE_SURVEY_API_URL` at build time to
use another HTTPS endpoint (including a same-origin Cloudflare Pages Function).

The contract is:

- `GET /api/survey` returns an array of 20-answer submissions.
- `POST /api/survey` accepts `{ "answers": [1..5 x 20], "label": "..." }`.
- A failed or unavailable API leaves the local `localStorage` archive usable.

The Cloudflare Pages Function is `functions/api/survey.ts`. It expects a D1 binding named `SURVEY_DB`. Create the table with:

```sql
-- functions/schema.sql
CREATE TABLE IF NOT EXISTS survey_submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  label TEXT NOT NULL
);
```

In Cloudflare Pages, bind the D1 database to the production project as `SURVEY_DB`, then redeploy. The API deliberately returns `503` when the binding is missing so the frontend keeps its local fallback instead of treating an empty response as the complete archive.

The endpoint stores only an anonymous generated id, timestamp, display label, and the twenty scale answers. No name, student number, contact information, or direct identifier is collected by this flow.
