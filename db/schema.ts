import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const progress = sqliteTable(
  "lesson_progress",
  {
    userId: text("user_id").notNull(),
    lesson: text("lesson").notNull(),
    path: text("path").notNull(),
    completed: integer("completed").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lesson] })],
);

export const games = sqliteTable("saved_games", {
  userId: text("user_id").primaryKey(),
  state: text("state").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
