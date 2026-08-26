# alessandrofacchini-git.github.io

Personal website of Alessandro Facchini — published with GitHub Pages at
<https://alessandrofacchini-git.github.io/>.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | The live site. This is the only page GitHub Pages serves as the homepage. |
| `designs/design-a.html` | Design proposal A — "Ivory & Oxford" |
| `designs/design-b.html` | Design proposal B — "Slate Institute" |
| `designs/design-c.html` | Design proposal C — "Editorial Navy" |
| `assets/` | Optimised portrait, favicon (SVG + PNG), and the social share card |
| `backup/` | Verbatim copy of the previous site, kept for reference |
| `ALESSANDRO FACCHINI - CV.pdf` | CV, opened in a new tab from the site |

## Choosing a design

The three files in `designs/` are complete, self-contained pages with identical
content. To make one of them live, copy it over `index.html` and fix the
relative paths (they sit one directory deeper):

```sh
sed -e 's|\.\./assets/|assets/|g' -e 's|\.\./ALESSANDRO|ALESSANDRO|g' \
    designs/design-a.html > index.html
```

## Restoring the previous version

The previous site is preserved in three places, any one of which is enough:

1. `backup/index-original.html` — a verbatim copy in this repository.
2. The `backup/site-2026-08-26` branch and the `site-backup-2026-08-26` tag.
3. Normal git history on `main`.

To roll back completely:

```sh
git checkout main
cp backup/index-original.html index.html
cp backup/AF-original.png AF.png
git commit -am "Restore previous site"
git push origin main
```
