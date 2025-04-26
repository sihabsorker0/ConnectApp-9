import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  lastNameChange: timestamp("last_name_change"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  coverColor: text("cover_color"),
  work: text("work"),
  education: text("education"),
  currentCity: text("current_city"),
  hometown: text("hometown"),
  isBanned: boolean("is_banned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  bio: true,
  profileImage: true
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertFriendSchema = createInsertSchema(friends).pick({
  userId: true,
  friendId: true,
  status: true
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  content: true
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  userId: true,
  postId: true
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  postId: true,
  content: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type PostWithAuthor = Post & {
  author: User;
  likes: number;
  liked: boolean;
  comments: (Comment & { author: User })[];
  likesCount?: number;
  commentsCount?: number;
};

export type FriendWithUser = Friend & {
  user: User;
};
