import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const addresses = sqliteTable(
  'addresses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    addressLine1: text('address_line_1', { length: 255 }),
    addressLine2: text('address_line_2', { length: 255 }),
    area: text('area', { length: 20 }),
    city: text('city', { length: 20 }),
    taluk: text('taluk', { length: 20 }),
    district: text('district', { length: 20 }),
    state: text('state', { length: 20 }),
    country: text('country', { length: 20 }),
    postalCode: text('postal_code', { length: 20 }),
    phone: text('phone', { length: 20 }),
    mobile: text('mobile', { length: 20 }),
    email: text('email', { length: 100 }),
    website: text('website', { length: 100 }),
    latitude: text('latitude', { length: 20 }),
    longitude: text('longitude', { length: 20 }),
  },
  (t) => [index('address_city').on(t.city), index('address_mobile').on(t.mobile)],
);

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
