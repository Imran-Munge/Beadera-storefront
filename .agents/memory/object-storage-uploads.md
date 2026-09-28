---
name: Product image uploads
description: The Beadera product image flow uses Replit App Storage with direct browser uploads.
---

Product images should be uploaded directly from the admin browser to App Storage through a short-lived presigned PUT URL. The API should only authorize URL generation and persist the resulting `/objects/...` path; it should not proxy image bytes or store base64 data.

**Why:** Direct uploads keep large media out of the API process and make product images scalable while preserving the existing product schema.

**How to apply:** Protect upload URL generation with the existing admin session, validate image type and size server-side, and serve saved object paths through the API’s storage route.