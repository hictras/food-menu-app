import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  prepTime: integer("prep_time").notNull(),
  cookTime: integer("cook_time").notNull(),
  servings: integer("servings").notNull(),
  cuisine: text("cuisine"),
  cuisineAr: text("cuisine_ar"),
  category: text("category"),
  categoryAr: text("category_ar"),
  servedWith: text("served_with"),
  servedWithAr: text("served_with_ar"),
  howToServe: text("how_to_serve"),
  howToServeAr: text("how_to_serve_ar"),
  dietaryTags: text("dietary_tags"),
  imageUrl: text("image_url"),
  image1Url: text("image_1_url"),
  image2Url: text("image_2_url"),
  useImage2: integer("use_image_2", { mode: "boolean" }).default(false),
  isHidden: integer("is_hidden").default(0),
  videoUrl: text("video_url"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  amount: text("amount"),
  unit: text("unit"),
  unitAr: text("unit_ar"),
  preparation: text("preparation"),
  preparationAr: text("preparation_ar"),
});

export const instructions = sqliteTable("instructions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  text: text("text").notNull(),
  textAr: text("text_ar"),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  phoneNumber: text("phone_number").notNull(),
  name: text("name"),
  excluded: integer("excluded").notNull().default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  pollQuestion: text("poll_question"),
  url: text("url"),
  previewImage: text("preview_image"),
  previewTitle: text("preview_title"),
  targetPhone: text("target_phone").notNull().default("all"),
  pollUrl: text("poll_url"),
  location: text("location"),
  time: text("time"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const polls = sqliteTable("polls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  notificationId: integer("notification_id")
    .notNull()
    .references(() => notifications.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  isOpen: integer("is_open").notNull().default(1),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const pollResponses = sqliteTable("poll_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pollId: integer("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  answer: text("answer").notNull(),
  name: text("name"),
  respondedAt: text("responded_at").default(sql`CURRENT_TIMESTAMP`),
});

export const mealPlan = sqliteTable("meal_plan", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  slot: text("slot").notNull(),
  position: integer("position").notNull().default(1),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const recipeReviews = sqliteTable("recipe_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dayReviews = sqliteTable("day_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  phone: text("phone").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const pushPresets = sqliteTable("push_presets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  pollQuestion: text("poll_question"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const recipientGroups = sqliteTable("recipient_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const recipientGroupMembers = sqliteTable("recipient_group_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => recipientGroups.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
});

export const visitors = sqliteTable("visitors", {
  id: text("id").primaryKey(),
  phone: text("phone"),
  visits: integer("visits").default(0),
  lastSeen: text("last_seen").default(sql`CURRENT_TIMESTAMP`),
  lastPage: text("last_page"),
});

export const notificationReads = sqliteTable("notification_reads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  notificationId: integer("notification_id")
    .notNull()
    .references(() => notifications.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  readAt: text("read_at").default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  uniqNotificationPhone: uniqueIndex("uniq_notif_phone").on(t.notificationId, t.phone),
}));

export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});



export const gameStats = sqliteTable(
  "game_stats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    phone: text("phone").notNull(),
    game: text("game").notNull(),
    stats: text("stats").notNull().default("{}"),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    uniqPhoneGame: uniqueIndex("uniq_phone_game").on(t.phone, t.game),
  })
);


export const chessRooms = sqliteTable("chess_rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  whitePhone: text("white_phone").notNull(),
  blackPhone: text("black_phone"),
  board: text("board").notNull(),
  turn: text("turn").notNull().default("w"),
  status: text("status").notNull().default("waiting"),
  winner: text("winner"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
