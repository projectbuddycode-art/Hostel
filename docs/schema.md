# Data and migrations

The application uses Prisma with SQLite for a working local ledger. The schema is relational and can be moved to PostgreSQL by changing the datasource provider and `DATABASE_URL`. Row-level policies are not available on SQLite; authorization is enforced in server actions, route handlers and middleware.

Migration: `prisma/migrations/20261118000000_init`.

Apply and seed:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Entities

- `User`, `Profile`, `Address`, `PasswordReset` — members and staff. Passwords are bcrypt hashes. Roles are `CUSTOMER`, `ADMIN`, `KITCHEN`, `DELIVERY`.
- `Plan`, `Addon`, `PlanAddon` — configurable price, services, credits, customisation, pause limits and which extras a plan may buy.
- `Subscription` — pending, active, paused, cancelled, expired or superseded. Credits and term length are snapshotted at checkout.
- `Dish`, `MenuSchedule` — repertoire and the dated services members can actually select.
- `MealSelection`, `MealSelectionAddon`, `Order`, `DeliveryAssignment`, `DeliveryEvent` — one selection per membership, date and service. Orders carry the address, allergens and instructions.
- `Payment`, `Refund` — Razorpay or an offline record. Activation happens only after a verified transition. Idempotency keys are unique.
- `KitchenBatch` — production status for a dish on a service.
- `Notification`, `SupportTicket`, `AuditLog`.

Business dates are `YYYY-MM-DD` in Asia/Kolkata. Cutoffs are real timestamps.

## Environment

See `.env.example`. Required to boot: `DATABASE_URL`, `AUTH_SECRET`. Required to create the first administrator: `ADMIN_EMAIL`, `ADMIN_PASSWORD` at seed time. Required before online payment can succeed: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Email and WhatsApp stay silent, and say so in the notification log, until their credentials exist. `DEV_EXPOSE_RESET_LINKS` is ignored in production.
