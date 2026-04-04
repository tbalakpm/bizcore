import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const states = sqliteTable('states', {
    id: integer('id')
        .primaryKey({ autoIncrement: true })
        .notNull(),

    stateName: text('state_name', { length: 100 })
        .notNull(),

    stateCode: text('state_code', { length: 2 })
        .notNull(), // GST code (e.g., 33 for TN)

    stateShortCode: text('state_short_code', { length: 5 })
        .notNull(), // short code (e.g., TN)

    countryCode: text('country_code', { length: 2 })
        .notNull()
        .default('IN'),

    isUnionTerritory: integer('is_union_territory', { mode: 'boolean' })
        .default(false),

    isActive: integer('is_active', { mode: 'boolean' })
        .default(true),
}, (t) => [
    uniqueIndex('states_state_name').on(t.stateName),
    uniqueIndex('states_state_code').on(t.stateCode),
    uniqueIndex('states_state_short_code').on(t.stateShortCode),
]);

export type State = typeof states.$inferSelect;
export type NewState = typeof states.$inferInsert;
