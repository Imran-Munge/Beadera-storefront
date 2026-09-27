import { and, asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, productsTable, workshopEnquiriesTable } from "@workspace/db";
import {
  CreateWorkshopEnquiryBody,
  CreateWorkshopEnquiryResponse,
  GetProductParams,
  GetProductResponse,
  ListProductsQueryParams,
  ListProductsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsedQuery = ListProductsQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const filters = [eq(productsTable.isActive, true)];
  if (parsedQuery.data.category) {
    filters.push(eq(productsTable.category, parsedQuery.data.category));
  }
  if (parsedQuery.data.featured !== undefined) {
    filters.push(eq(productsTable.isFeatured, parsedQuery.data.featured));
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(and(...filters))
    .orderBy(asc(productsTable.sortOrder), asc(productsTable.createdAt));

  res.json(ListProductsResponse.parse(products));
});

router.get("/products/:slug", async (req, res): Promise<void> => {
  const parsedParams = GetProductParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.slug, parsedParams.data.slug), eq(productsTable.isActive, true)));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(product));
});

router.post("/workshop-enquiries", async (req, res): Promise<void> => {
  const parsed = CreateWorkshopEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [enquiry] = await db
    .insert(workshopEnquiriesTable)
    .values({
      ...parsed.data,
      message: parsed.data.message ?? "",
      status: "pending",
    })
    .returning();

  res.status(201).json(CreateWorkshopEnquiryResponse.parse(enquiry));
});

export default router;