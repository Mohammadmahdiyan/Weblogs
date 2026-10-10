# Content pipeline

Create each article in `content/blog/<folder>/index.md` and place its media beside it. `npm run content` builds the generated metadata and public media for development; Vite runs the same builder when content changes and reloads the page.

The Vite production build passes `--production` explicitly to the builder. In production, folders whose names begin with `_` are skipped. Development runs and `npm run content` include those folders, so example articles can be previewed locally.