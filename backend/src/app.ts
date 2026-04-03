import path from "node:path";
import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import { i18nMiddleware } from "./middleware/i18n";
import { requestContextMiddleware } from "./middleware/request-id.middleware";
import { LogService } from "./core/logger/logger.service";

import { config } from "./config";
import { initializeDatabase, migrateDatabase } from "./db";
import { createAdminUser } from "./db/seed/admin-user.seed";
import { seedStates } from "./db/seed/states.seed";
import { seedTaxRates } from "./db/seed/tax-rate.seed";

import { authRouter } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { authRequired, requireRole } from "./middleware/auth";
import { usersRouter } from "./routes/users";
import { productsRouter } from "./routes/products";
import { customersRouter } from "./routes/customers";
import { logger } from "./middleware/logger";
import { suppliersRouter } from "./routes/suppliers";
import { inventoriesRouter } from "./routes/inventories";
import { settingsRouter } from "./routes/settings";
import { invoicesRouter } from "./routes/invoices";
import { serialNumbersRouter } from "./routes/serial-numbers";
import { stockInvoicesRouter } from "./routes/stock-invoices";
import { salesInvoicesRouter } from "./routes/sales-invoices";
import { purchaseInvoicesRouter } from "./routes/purchase-invoices";
import { gstRouter } from "./routes/gst";
import { pricingCategoriesRouter } from "./routes/pricing-categories";
import { dashboardRouter } from "./routes/dashboard";
import { profileRouter } from "./routes/profile";
import { attributesRouter } from "./routes/attributes";
import { productTemplatesRouter } from "./routes/product-templates";
import { brandsRouter } from "./routes/brands";
import { taxRatesRouter } from "./routes/tax-rates";
import { taxRulesRouter } from "./routes/tax-rules";
import stateRouter from "./routes/state.router";


export async function app() {
  console.table(config)
  LogService.info(`Starting BizCore API`, { environment: config.environment });
  await initializeDatabase();
  if (config.autoMigrateOnStartup) {
    await migrateDatabase();
  }
  await createAdminUser();
  await seedStates();
  await seedTaxRates();

  const app = express();
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestContextMiddleware);
  app.use(logger);
  app.use(i18nMiddleware);

  // Serve the static files from the Angular dist directory
  // Replace 'my-angular-app' with your actual project name from the dist folder
  app.use(express.static(path.join(__dirname, "/public")));

  app.get("/api/health", (req: Request, res: Response): void => {
    res.json({
      status: "ok",
      username: req.user?.username || "",
      lang: req.i18n?.lang || "en",
    });
  });

  // Frontend log ingestion endpoint
  app.post("/api/logs", (req: Request, res: Response): void => {
    const { level, message, data } = req.body as { level: string; message: string; data?: Record<string, unknown> };
    const safeLevel = ['info', 'warn', 'error', 'debug'].includes(level?.toLowerCase())
      ? (level.toLowerCase() as 'info' | 'warn' | 'error' | 'debug')
      : 'info';
    LogService[safeLevel](message, { source: 'frontend', ...(data ?? {}) });
    res.sendStatus(200);
  });
  app.use("/api/auth", authRouter);
  app.use("/api/users", authRequired, requireRole("admin"), usersRouter);
  app.use("/api/categories", authRequired, categoriesRouter);
  app.use("/api/pricing-categories", authRequired, pricingCategoriesRouter);
  app.use("/api/products", authRequired, productsRouter);
  app.use("/api/customers", authRequired, customersRouter);
  app.use("/api/suppliers", authRequired, suppliersRouter);
  app.use("/api/inventories", authRequired, inventoriesRouter);
  app.use("/api/settings", authRequired, requireRole("admin"), settingsRouter);
  app.use("/api/invoices", authRequired, invoicesRouter);
  app.use("/api/stock-invoices", authRequired, stockInvoicesRouter);
  app.use("/api/sales-invoices", authRequired, salesInvoicesRouter);
  app.use("/api/purchase-invoices", authRequired, purchaseInvoicesRouter);
  app.use("/api/serial-numbers", authRequired, serialNumbersRouter);
  app.use("/api/gst", authRequired, gstRouter);
  app.use("/api/dashboard", authRequired, dashboardRouter);
  app.use("/api/profile", authRequired, profileRouter);
  app.use("/api/attributes", authRequired, attributesRouter);
  app.use("/api/product-templates", authRequired, productTemplatesRouter);
  app.use("/api/brands", authRequired, brandsRouter);
  app.use("/api/tax-rates", authRequired, taxRatesRouter);
  app.use("/api/tax-rules", authRequired, taxRulesRouter);
  app.use("/api/states", authRequired, stateRouter);


  // Handle any requests that don't match the static files by serving the index.html file
  app.get("/{*any}", (req, res, next) => {
    if (req.url.startsWith("/api")) {
      return res.status(404).json({ message: `Url '${req.url}' not found` });
    }

    res.sendFile(path.join(__dirname, "/public/index.html"), (err) => {
      if (err) {
        next(err);
      }
    });
  });

  return { express: app, port: config.port };
}
