# alessandrofacchini-git.github.io

Personal website of Alessandro Facchini — published with GitHub Pages at
<https://alessandrofacchini-git.github.io/>.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | The whole site. Self-contained: all CSS and JavaScript are inline. |
| `assets/` | Portrait, favicon set, and the social share card |
| `ALESSANDRO FACCHINI - CV.pdf` | CV, opened in a new tab from the header button |
| `favicon.ico` | Root icon (16/32/48) — what search-engine favicon crawlers fetch first |
| `site.webmanifest` | Icon and theme metadata for mobile home-screen use |
| `robots.txt`, `sitemap.xml` | Crawling hints; bump `<lastmod>` when content changes |
| `googlee5f06614f5ff588b.html` | Google Search Console verification — **do not delete** |

## Editing content

Everything is in `index.html`.

- **Projects** — each is an `<li class="paper">`. The `01` / `02` numbering is written in
  the markup, so renumber by hand if you reorder items.
- **Abstracts** — the `<div class="abstract" hidden>` inside each project. Its `id` must match
  the button's `aria-controls`. Keep each paragraph in its own `<p>`.
- **Toggle wording** — set per button via `data-more` / `data-less` on the `<span data-label>`
  ("Read abstract" in Work in Progress, "Read more" in Research Contributions).
- **Collaborators / citations** — the `<p class="byline">` at the top of an abstract.
- **Hiding a project** without deleting it — add `hidden` to its `<li>`:
  `<li class="paper" hidden>`. It disappears from the page, from screen readers and from
  search engines, and the change is one word to reverse.
- **Colours and type** — the `:root` block at the top of the `<style>` element.
- **The portrait** is served at four sizes (`assets/portrait-320|480|700.jpg` and
  `portrait.jpg`) through a `srcset`, so a phone downloads ~21 KB instead of 133 KB.
  If you replace the photo, regenerate all four or the small versions will still show
  the old picture.
- **Tap targets** — `.toggle`, `.mails a` and `.foot-inner a` each carry an invisible
  `::after` overlay that enlarges the tappable area to 48 px on phones. It changes
  nothing visually; don't remove it.

## After changing content

Update `<lastmod>` in `sitemap.xml`, then in Google Search Console use URL Inspection →
Request Indexing so the change is picked up promptly.

## History

Earlier versions of the site, two alternative designs, and the original pre-redesign page all
remain in the git history and can be restored with `git log` / `git checkout`.
