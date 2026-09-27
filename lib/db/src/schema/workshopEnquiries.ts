import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const workshopEnquiriesTable = pgTable("workshop_enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  workshopType: text("workshop_type").notNull(),
  peopleCount: integer("people_count").notNull(),
  preferredDate: date("preferred_date", { mode: "string" }).notNull(),
  preferredTime: text("preferred_time").notNull(),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkshopEnquirySchema = createInsertSchema(workshopEnquiriesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkshopEnquiry = z.infer<typeof insertWorkshopEnquirySchema>;
export type WorkshopEnquiry = typeof workshopEnquiriesTable.$inferSelect;