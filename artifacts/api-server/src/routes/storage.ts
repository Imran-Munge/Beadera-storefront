import { Readable } from "node:stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { Router, type IRouter, type Request, type Response } from "express";
import { requireAdmin } from "../lib/admin-auth";
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.post(
  "/storage/uploads/request-url",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid upload metadata." });
      return;
    }

    if (
      parsed.data.size > 10 * 1024 * 1024 ||
      !parsed.data.contentType.startsWith("image/")
    ) {
      res.status(400).json({
        error: "Product images must be image files no larger than 10 MB.",
      });
      return;
    }

    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath =
        objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: parsed.data,
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Error generating product image upload URL");
      res.status(500).json({ error: "Failed to prepare image upload." });
    }
  },
);

router.get(
  "/storage/objects/*path",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawPath = req.params.path;
      const objectPath = `/objects/${
        Array.isArray(rawPath) ? rawPath.join("/") : rawPath
      }`;
      const file = await objectStorageService.getObjectEntityFile(objectPath);
      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) {
        Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        ).pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Object not found." });
        return;
      }
      req.log.error({ err: error }, "Error serving product image");
      res.status(500).json({ error: "Failed to serve product image." });
    }
  },
);

export default router;