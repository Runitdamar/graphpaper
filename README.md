# Graphpaper

CBSE updates, syllabus and NCERT book links for Class 11 and 12 Science. Static site: `index.html` (home) and `updates.html`.

## How updates work
- `scripts/scrape_cbse.py` runs on a schedule (`.github/workflows/update.yml`) and adds new CBSE items to `updates.json` as `"status": "pending"`.
- Pending items are never shown. To publish one, edit `updates.json` on GitHub and change `"pending"` to `"approved"` (add a short `summary` if you like).
- You can also run the check by hand: Actions tab > Check CBSE updates > Run workflow.
- The scraper has not been tested against the live CBSE site. If a run adds nothing or fails, check the Actions log.

## Data format (`updates.json`)
```json
{ "id": "unique-id", "tag": "Circular | Date Sheet | Syllabus Change | Result",
  "title": "...", "date": "YYYY-MM-DD", "summary": "...",
  "url": "official link", "status": "approved | pending" }
```
While the file is empty, the site shows clearly labeled sample items.
