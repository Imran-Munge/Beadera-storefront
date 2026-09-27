import { asc, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, productsTable, workshopEnquiriesTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  CreateProductBody,
  CreateProductResponse,
  DeleteProductParams,
  GetAdminSessionResponse,
  GetAdminSummaryResponse,
  ListAdminProductsResponse,
  ListWorkshopEnquiriesResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
  UpdateWorkshopEnquiryBody,
  UpdateWorkshopEnquiryParams,
  UpdateWorkshopEnquiryResponse,
} from "@workspace/api-zod";
import {
  clearAdminSession,
  getAdminEmail,
  isAdminCredentialsValid,
  requireAdmin,
  setAdminSession,
} from "../lib/admin-auth";

const router: IRouter = Router();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(name: string, existingId?: number): Promise<string> {
  const base = slugify(name) || `product-${Date.now()}`;
  let candidate = base;
  let suffix = 2;
  while (true) {
    const [match] = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.slug, candidate));
    if (!match || match.id === existingId) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

router.get("/admin/session", (req, res): void => {
  const email = getAdminEmail(req);
  res.json(GetAdminSessionResponse.parse({ authenticated: Boolean(email), email }));
});

router.post("/admin/login", (req, res): void => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!isAdminCredentialsValid(parsed.data.email, parsed.data.password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  setAdminSession(res, parsed.data.email);
  res.json(AdminLoginResponse.parse({ authenticated: true, email: parsed.data.email }));
});

router.post("/admin/logout", (req, res): void => {
  clearAdminSession(res);
  res.sendStatus(204);
});

router.get("/admin/summary", requireAdmin, async (_req, res): Promise<void> => {
  const [total, active, featured, enquiries] = await Promise.all([
    db.select({ value: count() }).from(productsTable),
    db.select({ value: count() }).from(productsTable).where(eq(productsTable.isActive, true)),
    db.select({ value: count() }).from(productsTable).where(eq(productsTable.isFeatured, true)),
    db.select({ value: count() }).from(workshopEnquiriesTable),
  ]);

  res.json(
    GetAdminSummaryResponse.parse({
      totalProducts: total[0]?.value ?? 0,
      activeProducts: active[0]?.value ?? 0,
      featuredProducts: featured[0]?.value ?? 0,
      workshopEnquiries: enquiries[0]?.value ?? 0,
    }),
  );
});

router.get("/admin/products", requireAdmin, async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(asc(productsTable.sortOrder), desc(productsTable.createdAt));
  res.json(ListAdminProductsResponse.parse(products));
});

router.post("/admin/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      ...parsed.data,
      slug: await uniqueSlug(parsed.data.name),
      originalPrice: parsed.data.originalPrice ?? null,
      additionalImages: parsed.data.additionalImages ?? [],
      badge: parsed.data.badge ?? null,
      isFeatured: parsed.data.isFeatured ?? false,
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  res.status(201).json(CreateProductResponse.parse(product));
});

router.patch("/admin/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsedParams = UpdateProductParams.safeParse(req.params);
  const parsedBody = UpdateProductBody.safeParse(req.body);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const changes = {
    ...parsedBody.data,
    ...(parsedBody.data.name ? { slug: await uniqueSlug(parsedBody.data.name, parsedParams.data.id) } : {}),
    ...(parsedBody.data.originalPrice === undefined ? {} : { originalPrice: parsedBody.data.originalPrice }),
    ...(parsedBody.data.additionalImages === undefined ? {} : { additionalImages: parsedBody.data.additionalImages }),
    ...(parsedBody.data.badge === undefined ? {} : { badge: parsedBody.data.badge }),
    updatedAt: new Date(),
  };

  const [product] = await db
    .update(productsTable)
    .set(changes)
    .where(eq(productsTable.id, parsedParams.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse(product));
});

router.delete("/admin/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsedParams = DeleteProductParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const [deleted] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, parsedParams.data.id))
    .returning({ id: productsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/admin/workshop-enquiries", requireAdmin, async (_req, res): Promise<void> => {
  const enquiries = await db
    .select()
    .from(workshopEnquiriesTable)
    .orderBy(desc(workshopEnquiriesTable.createdAt));
  res.json(ListWorkshopEnquiriesResponse.parse(enquiries));
});

router.patch("/admin/workshop-enquiries/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsedParams = UpdateWorkshopEnquiryParams.safeParse(req.params);
  const parsedBody = UpdateWorkshopEnquiryBody.safeParse(req.body);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const [enquiry] = await db
    .update(workshopEnquiriesTable)
    .set({ status: parsedBody.data.status })
    .where(eq(workshopEnquiriesTable.id, parsedParams.data.id))
    .returning();

  if (!enquiry) {
    res.status(404).json({ error: "Workshop enquiry not found" });
    return;
  }

  res.json(UpdateWorkshopEnquiryResponse.parse(enquiry));
});

export default router;