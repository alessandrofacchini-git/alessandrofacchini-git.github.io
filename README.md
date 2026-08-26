# alessandrofacchini-git.github.io

Personal website of Alessandro Facchini — published with GitHub Pages at
<https://alessandrofacchini-git.github.io/>.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | **The live site** — the "Editorial Navy" design. Self-contained: all CSS and JS are inline. |
| `assets/` | Portrait, favicon (SVG + PNG), and the social share card |
| `designs/design-a.html` | Alternative design — "Ivory & Oxford" |
| `designs/design-b.html` | Alternative design — "Slate Institute" |
| `backup/` | Verbatim copy of the previous site, kept for rollback |
| `ALESSANDRO FACCHINI - CV.pdf` | CV, opened in a new tab from the site |
| `robots.txt`, `sitemap.xml` | Search-engine crawling hints |
| `googlee5f06614f5ff588b.html` | Google Search Console verification — **do not delete** |

## Editing content

Everything lives in `index.html`. The parts you are most likely to change:

- **Papers** — each is an `<li class="paper">` block. Copy one to add another;
  the `01` / `02` numbering is generated from the markup order.
- **Abstracts** — the `<div class="abstract" hidden>` inside each paper. Keep the
  `id` matching the button's `aria-controls`, and keep each paragraph in its own `<p>`.
- **Research Contributions** — currently placeholder text, ready to be filled in.
- **Colours** — the `:root` block near the top of the `<style>` element.

## Switching to a different design

The files in `designs/` are complete pages with identical content. To make one live:

```sh
sed -e 's|\.\./assets/|assets/|g' -e 's|\.\./ALESSANDRO|ALESSANDRO|g' \
    designs/design-a.html > index.html
```

## Restoring the previous version

The previous site is preserved in `backup/`, and in git history on `main`.

```sh
cp backup/index-original.html index.html
cp backup/AF-original.png AF.png
git commit -am "Restore previous site"
git push
```
