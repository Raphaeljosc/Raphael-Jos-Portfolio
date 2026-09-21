# Raphael Jos — creative portfolio

A responsive, dependency-free HTML/CSS/JavaScript website for GitHub Pages. Each project has a shareable page at `?project=project-id`. It works under a repository subdirectory as well as a custom domain.

## Publish for free
1. Create a public GitHub repository.
2. Upload all files in this folder, including `assets`, to the repository root.
3. Open Settings → Pages → Deploy from a branch → main → /(root) → Save.
4. GitHub provides the public URL after deployment.

## Edit throughout your career
Open `editor.html` on your website. Edit your name, contact email, professional title, introduction, biography, languages, YouTube channel, and GitHub username. Add, delete, or reorder projects. Paste each film's individual YouTube URL; upload its cover, captioned frames, and audio tracks.

Save draft stores the work only in this browser using IndexedDB. Visitors cannot change the live site using the editor: only repository owners can publish. Download backup saves a portable JSON copy with all media. Keep backups and your original media. Restore backup imports it on another device. Both the JSON backup and website ZIP include all your media.

Download website ZIP packages the website and uploaded media. Extract it and replace files in your repository. Commit the changes to publish. Keep the latest ZIP in a separate backup location. Uploads are not sent to a server by the editor, and draft changes do not publish automatically.

Videos stay on YouTube. Frames and audio become public files when published. Upload only material you have permission to share. Initial project cards use typography until you add real frames; no sample artwork is represented as your own work. Brand projects are labelled independent concepts.

GitHub Pages publishes up to 1 GB per site. Use compressed images and MP3 audio; the editor caps each image at 8 MB and each audio file at 20 MB. Large libraries may eventually need separate media storage. Free service terms and quotas can change; no provider promises lifelong free hosting.

## Local preview
Run `python3 -m http.server 8000` in this folder and open http://localhost:8000. Opening HTML directly from disk will not load the JSON content because of browser security rules.

## Structure
- index.html: public portfolio and project pages
- content.json: profile and project content
- editor.html / editor.js: local draft editor and ZIP exporter
- app.js: rendering, URL validation, and draft storage
- style.css: responsive design
- assets/: favicon and exported media

No package installation or build step is needed. Fonts use Google Fonts, with local sans-serif fallbacks. YouTube embeds use youtube-nocookie.com. Experience, education and toolkit copy can currently be updated in app.js; project and profile information is editable in the editor.
