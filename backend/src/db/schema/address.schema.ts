import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const addresses = sqliteTable(
  'addresses',
  {
    id: integer('id')
      .primaryKey({ autoIncrement: true })
      .notNull(),

    addressLine1: text('address_line_1', { length: 255 }),

    addressLine2: text('address_line_2', { length: 255 }),

    area: text('area', { length: 25 }),

    city: text('city', { length: 25 }),

    taluk: text('taluk', { length: 25 }),

    district: text('district', { length: 25 }),

    state: text('state', { length: 25 }),

    country: text('country', { length: 25 }),

    postalCode: text('postal_code', { length: 25 }),

    phone: text('phone', { length: 25 }),

    mobile: text('mobile', { length: 25 }),

    email: text('email', { length: 100 }),

    website: text('website', { length: 100 }),

    latitude: text('latitude', { length: 25 }),

    longitude: text('longitude', { length: 25 })
  },
  (t) => [
    index('address_city_idx').on(t.city),

    index('address_phone_idx').on(t.phone),

    index('address_mobile_idx').on(t.mobile),

    index('address_email_idx').on(t.email)
  ]
);

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
