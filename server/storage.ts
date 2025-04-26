import { users, type User, type InsertUser, posts, type Post, type InsertPost, likes, type Like, type InsertLike, comments, type Comment, type InsertComment, friends, type Friend, type InsertFriend, type PostWithAuthor, type FriendWithUser } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import createMemoryStore from "memorystore";
import session from "express-session";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface Story {
  id: number;
  userId: number;
  media: string;
  createdAt: Date;
}

export interface IStorage {
  // Stories
  createStory(story: { userId: number; media: string }): Promise<Story>;
  getStories(userId: number): Promise<Story[]>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getPosts(): Promise<Post[]>;
  getPostsByUser(userId: number): Promise<Post[]>;
  getPostsForFeed(userId: number): Promise<PostWithAuthor[]>;
  getAllPostsWithAuthors(): Promise<(Post & { author: User })[]>;
  deletePost(id: number): Promise<boolean>;

  // Likes
  createLike(like: InsertLike): Promise<Like>;
  removeLike(userId: number, postId: number): Promise<void>;
  getLike(userId: number, postId: number): Promise<Like | undefined>;
  getLikesByPost(postId: number): Promise<Like[]>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPost(postId: number): Promise<Comment[]>;

  // Friends
  createFriendRequest(friend: InsertFriend): Promise<Friend>;
  acceptFriendRequest(id: number): Promise<Friend | undefined>;
  rejectFriendRequest(id: number): Promise<Friend | undefined>;
  getFriendRequest(userId: number, friendId: number): Promise<Friend | undefined>;
  getFriendRequestsForUser(userId: number): Promise<FriendWithUser[]>;
  getFriends(userId: number): Promise<FriendWithUser[]>;
  getFriendSuggestions(userId: number): Promise<User[]>; // Added method

  // Admin
  toggleUserBanStatus(userId: number): Promise<User | undefined>;

  // Session
  sessionStore: any; // Using any to avoid SessionStore type issues

  // Saved Posts
  savePost(userId: number, postId: number): Promise<void>;
  unsavePost(userId: number, postId: number): Promise<void>;
  getSavedPosts(userId: number): Promise<PostWithAuthor[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private friends: Map<number, Friend>;
  private savedPosts: Map<number, number[]>; // userId -> [postId1, postId2, ...]
  private stories: Map<number, Story>;
  sessionStore: any; // Using any to avoid SessionStore type issues

  currentUserId: number;
  currentPostId: number;
  currentLikeId: number;
  currentCommentId: number;
  currentFriendId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.friends = new Map();
    this.savedPosts = new Map();
    this.stories = new Map();

    this.currentUserId = 1;
    this.currentPostId = 1;
    this.currentLikeId = 1;
    this.currentCommentId = 1;
    this.currentFriendId = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now, 
      isBanned: false,
      bio: insertUser.bio ?? null,
      profileImage: insertUser.profileImage ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.name.toLowerCase().includes(searchTerm) || 
        user.username.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    // Update all fields that are present in updates
    const updatedUser = { 
      ...user,
      name: updates.name !== undefined ? updates.name : user.name,
      bio: updates.bio !== undefined ? updates.bio : user.bio,
      profileImage: updates.profileImage !== undefined ? updates.profileImage : user.profileImage,
      work: updates.work !== undefined ? updates.work : user.work,
      education: updates.education !== undefined ? updates.education : user.education,
      currentCity: updates.currentCity !== undefined ? updates.currentCity : user.currentCity,
      hometown: updates.hometown !== undefined ? updates.hometown : user.hometown,
      coverColor: updates.coverColor !== undefined ? updates.coverColor : user.coverColor,
      coverImage: updates.coverImage !== undefined ? updates.coverImage : user.coverImage
    };

    // Ensure the updates are saved
    this.users.set(id, {...updatedUser});
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;

    // Delete user
    this.users.delete(id);

    // Delete user's posts
    const userPosts = await this.getPostsByUser(id);
    for (const post of userPosts) {
      await this.deletePost(post.id);
    }

    // Delete user's likes
    const allLikes = Array.from(this.likes.values());
    for (const like of allLikes) {
      if (like.userId === id) {
        this.likes.delete(like.id);
      }
    }

    // Delete user's comments
    const allComments = Array.from(this.comments.values());
    for (const comment of allComments) {
      if (comment.userId === id) {
        this.comments.delete(comment.id);
      }
    }

    // Delete user's friend connections
    const allFriends = Array.from(this.friends.values());
    for (const friend of allFriends) {
      if (friend.userId === id || friend.friendId === id) {
        this.friends.delete(friend.id);
      }
    }

    return true;
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.currentPostId++;
    const now = new Date();
    const post: Post = { ...insertPost, id, createdAt: now };
    this.posts.set(id, post);
    return post;
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getPostsByUser(userId: number): Promise<PostWithAuthor[]> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const postsWithDetails = await Promise.all(userPosts.map(async post => {
      const author = await this.getUser(post.userId);
      const postLikes = await this.getLikesByPost(post.id);
      const postComments = await this.getCommentsByPost(post.id);
      const userLiked = postLikes.some(like => like.userId === userId);

      return {
        ...post,
        author: {
          ...author!,
          password: undefined
        },
        liked: userLiked,
        likes: postLikes.length,
        comments: await Promise.all(postComments.map(async comment => ({
          ...comment,
          author: {
            ...(await this.getUser(comment.userId))!,
            password: undefined
          }
        }))),
        commentsCount: postComments.length
      };
    }));

    return postsWithDetails;
  }

  async getPostsForFeed(userId: number): Promise<PostWithAuthor[]> {
    // Get user's friends
    const userFriends = await this.getFriends(userId);
    const friendIds = userFriends.map(friend => 
      friend.userId === userId ? friend.friendId : friend.userId
    );

    // Include user's own posts in feed
    friendIds.push(userId);

    // Get posts from friends and user
    const feedPosts = Array.from(this.posts.values())
      .filter(post => friendIds.includes(post.userId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Enhance posts with author, likes, and comments
    const enhancedPosts = await Promise.all(feedPosts.map(async post => {
      const author = await this.getUser(post.userId);
      const postLikes = await this.getLikesByPost(post.id);
      const postComments = await this.getCommentsByPost(post.id);

      // Get user info for each comment
      const commentsWithAuthor = await Promise.all(postComments.map(async comment => {
        const commentAuthor = await this.getUser(comment.userId);
        return { ...comment, author: commentAuthor! };
      }));

      // Check if current user liked the post
      const userLike = await this.getLike(userId, post.id);

      return {
        ...post,
        author: author!,
        likes: postLikes.length,
        liked: !!userLike,
        comments: commentsWithAuthor
      };
    }));

    return enhancedPosts;
  }

  async getAllPostsWithAuthors(): Promise<(Post & { author: User })[]> {
    const allPosts = await this.getPosts();

    const postsWithAuthors = await Promise.all(allPosts.map(async post => {
      const author = await this.getUser(post.userId);
      const postLikes = await this.getLikesByPost(post.id);
      const postComments = await this.getCommentsByPost(post.id);

      return {
        ...post,
        author: author!,
        likesCount: postLikes.length,
        commentsCount: postComments.length
      };
    }));

    return postsWithAuthors;
  }



  async updatePost(id: number, content: string): Promise<Post | undefined> {
    const post = await this.getPost(id);
    if (!post) return undefined;

    const updatedPost = { ...post, content };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: number): Promise<boolean> {
    const post = await this.getPost(id);
    if (!post) return false;

    // Delete post
    this.posts.delete(id);

    // Delete post's likes
    const allLikes = Array.from(this.likes.values());
    for (const like of allLikes) {
      if (like.postId === id) {
        this.likes.delete(like.id);
      }
    }

    // Delete post's comments
    const allComments = Array.from(this.comments.values());
    for (const comment of allComments) {
      if (comment.postId === id) {
        this.comments.delete(comment.id);
      }
    }

    return true;
  }

  // Like methods
  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.currentLikeId++;
    const now = new Date();
    const like: Like = { ...insertLike, id, createdAt: now };
    this.likes.set(id, like);
    return like;
  }

  async removeLike(userId: number, postId: number): Promise<void> {
    const like = await this.getLike(userId, postId);
    if (like) {
      this.likes.delete(like.id);
    }
  }

  async getLike(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
  }

  async getLikesByPost(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(
      like => like.postId === postId
    );
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const now = new Date();
    const comment: Comment = { ...insertComment, id, createdAt: now };
    this.comments.set(id, comment);
    return comment;
  }

  async getCommentsByPost(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Friend methods
  async createFriendRequest(insertFriend: InsertFriend): Promise<Friend> {
    const id = this.currentFriendId++;
    const now = new Date();

    // Create the friend object with proper default for status
    const friend: Friend = { 
      ...insertFriend, 
      id, 
      createdAt: now,
      status: insertFriend.status ?? 'pending'  
    };

    this.friends.set(id, friend);
    return friend;
  }

  async acceptFriendRequest(id: number): Promise<Friend | undefined> {
    const friend = this.friends.get(id);
    if (friend) {
      const updatedFriend = { ...friend, status: 'accepted' };
      this.friends.set(id, updatedFriend);
      return updatedFriend;
    }
    return undefined;
  }

  async rejectFriendRequest(id: number): Promise<Friend | undefined> {
    const friend = this.friends.get(id);
    if (friend) {
      const updatedFriend = { ...friend, status: 'rejected' };
      this.friends.set(id, updatedFriend);
      return updatedFriend;
    }
    return undefined;
  }

  async getFriendRequest(userId: number, friendId: number): Promise<Friend | undefined> {
    return Array.from(this.friends.values()).find(
      friend => 
        (friend.userId === userId && friend.friendId === friendId) || 
        (friend.userId === friendId && friend.friendId === userId)
    );
  }

  async getFriendRequestsForUser(userId: number): Promise<FriendWithUser[]> {
    const requests = Array.from(this.friends.values()).filter(
      friend => friend.friendId === userId && friend.status === 'pending'
    );

    const requestsWithUser = await Promise.all(requests.map(async request => {
      const user = await this.getUser(request.userId);
      return { ...request, user: user! };
    }));

    return requestsWithUser;
  }

  async getFriends(userId: number): Promise<FriendWithUser[]> {
    // Get all accepted friend connections where user is either userId or friendId
    const friendConnections = Array.from(this.friends.values()).filter(
      friend => 
        (friend.status === 'accepted') &&
        ((friend.userId === userId) || (friend.friendId === userId))
    );

    const friendsWithUser = await Promise.all(friendConnections.map(async connection => {
      // If userId is the current user, get the friend user, otherwise get the requesting user
      const friendUserId = connection.userId === userId ? connection.friendId : connection.userId;
      const user = await this.getUser(friendUserId);
      return { ...connection, user: user! };
    }));

    return friendsWithUser;
  }

  async getFriendSuggestions(userId: number): Promise<User[]> {
    // Filter out the current user and existing friends
    const allUsers = Array.from(this.users.values());
    const friends = await this.getFriends(userId);
    const friendIds = new Set(friends.map(f => f.friendId === userId ? f.userId : f.friendId));
    friendIds.add(userId);

    const suggestions = allUsers.filter(user => !friendIds.has(user.id));
    return suggestions.slice(0,5); // Return up to 5 suggestions

  }

  // Admin methods
  async toggleUserBanStatus(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Toggle ban status
    const updatedUser = { 
      ...user, 
      isBanned: !user.isBanned 
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async savePost(userId: number, postId: number): Promise<void> {
    let savedPosts = this.savedPosts.get(userId) || [];
    if (!savedPosts.includes(postId)) {
      savedPosts.push(postId);
      this.savedPosts.set(userId, savedPosts);
    }
  }

  async unsavePost(userId: number, postId: number): Promise<void> {
    const savedPosts = this.savedPosts.get(userId);
    if (savedPosts) {
      this.savedPosts.set(userId, savedPosts.filter(id => id !== postId));
    }
  }

  private currentStoryId = 1;

  async createStory(storyData: { userId: number; media: string }): Promise<Story> {
    const id = this.currentStoryId++;
    const story: Story = {
      id,
      userId: storyData.userId,
      media: storyData.media,
      createdAt: new Date()
    };
    this.stories.set(id, story);
    return story;
  }

  async getStories(userId: number): Promise<Story[]> {
    const userFriends = await this.getFriends(userId);
    const friendIds = userFriends.map(friend => 
      friend.userId === userId ? friend.friendId : friend.userId
    );
    friendIds.push(userId);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return Array.from(this.stories.values())
      .filter(story => 
        friendIds.includes(story.userId) && 
        story.createdAt > twentyFourHoursAgo
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSavedPosts(userId: number): Promise<PostWithAuthor[]> {
    const savedPostIds = this.savedPosts.get(userId) || [];
    const posts = await Promise.all(savedPostIds.map(async (postId) => {
       const post = await this.getPost(postId);
       if (!post) return null;
       const author = await this.getUser(post.userId);
       const postComments = await this.getCommentsByPost(postId);
       const commentsWithAuthor = await Promise.all(postComments.map(async comment => {
         const commentAuthor = await this.getUser(comment.userId);
         return { ...comment, author: commentAuthor! };
       }));
       return { 
         ...post, 
         author: author!, 
         saved: true,
         comments: commentsWithAuthor,
         likes: (await this.getLikesByPost(postId)).length
       };
    }));
    return posts.filter(p => p !== null) as PostWithAuthor[];
  }
}

export const storage = new MemStorage();