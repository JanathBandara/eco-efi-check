
Goal: determine why the public project thumbnail is still broken and apply the minimum fix that actually affects the thumbnail source.

Diagnosis
- The console error is relevant.
- It points to an expired temporary image URL under `gpt-engineer-file-uploads/attachments/og-images/...`.
- The current code no longer references that old URL; `index.html` now points to `https://eco-drive-health.lovable.app/og-image.png`.
- That means the broken thumbnail is most likely coming from cached project/publication metadata or a stale platform thumbnail, not from the current app code alone.

Implementation plan
1. Verify the live published metadata source
- Check the actual HTML returned by the published URL, not just the local file.
- Confirm whether the published site is serving the latest `og:image`, `twitter:image`, `og:title`, and `og:description`.
- Confirm the image URL returns `200` publicly without redirects or auth.

2. Make the thumbnail source fully permanent
- Move the OG image from `public/og-image.png` to permanent backend file storage as a stable public asset.
- Use a stable non-expiring public URL for the image instead of relying on generated/temporary asset hosting.
- Keep the image at standard OG dimensions: `1200x630`.

3. Update metadata to point only to the permanent public asset
- Set both:
  - `meta property="og:image"`
  - `meta name="twitter:image"`
  to the permanent storage URL.
- Add/confirm:
  - `og:url`
  - `og:image:width`
  - `og:image:height`
  - optional `og:image:type`
- Add a cache-busting version suffix if needed, e.g. `?v=2`, to force refresh of stale scrapers.

4. Republish frontend changes
- Push the updated `index.html` live.
- Re-check the published HTML to ensure the new permanent URL is what the live site serves.

5. Validate whether the problem is app-side or platform-cache-side
- If the published HTML and image are correct but the Lovable project thumbnail still shows the expired URL/error, that confirms the remaining issue is platform-side cached thumbnail metadata.
- At that point, no further code change in this repo will fix the project card immediately; the app’s public OG metadata will already be correct.

Expected outcome
- Social previews and metadata scrapers will use a stable, non-expiring image URL.
- If the project tile still shows the old broken image after that, the remaining issue is a stale cached thumbnail outside the app code.

Technical notes
- Current repo scan shows no leftover reference to the expired `attachments/og-images` URL in project files.
- The error is from a temporary old asset URL, which strongly suggests stale cached thumbnail generation.
- Permanent backend file storage is the safest fix because it avoids expiring generated asset links entirely.
