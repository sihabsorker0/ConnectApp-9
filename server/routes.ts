import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";

import express from "express";

const app = express();

// Auth middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for uploads
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Global middleware for handling large payloads
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb', extended: true}));
app.use(express.raw({limit: '100mb'}));

// Story routes
app.post("/api/stories", isAuthenticated, upload.single('media'), async (req, res) => {
  try {
    const userId = req.user!.id;
    
    if (!req.file) {
      return res.status(400).json({ message: "No media provided" });
    }

    const mediaBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const story = await storage.createStory({ userId, media: mediaBase64 });
    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: "Failed to upload story" });
  }
});

app.get("/api/stories", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const stories = await storage.getStories(userId);
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});

// Additional middleware for profile routes
app.use('/api/user/profile', express.json({limit: '50mb'}));
app.use('/api/user/profile', express.raw({limit: '50mb', type: '*/*'}));
app.use('/api/user/profile', express.urlencoded({extended: true, limit: '50mb'}));
import { insertPostSchema, insertCommentSchema, insertLikeSchema, insertFriendSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Admin middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.id === 1) { // For simplicity, user with ID 1 is admin
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Error handler for Zod validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // Post routes
  app.post("/api/posts", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const userId = req.user!.id;
      const content = req.body.content;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const postData = {
        content,
        userId,
        image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null
      };

      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.get("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const posts = await storage.getPostsForFeed(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.delete("/api/posts/:postId", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;
      const post = await storage.getPost(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }

      await storage.deletePost(postId);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.put("/api/posts/:postId", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;
      const post = await storage.getPost(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this post" });
      }

      const updatedPost = await storage.updatePost(postId, req.body.content);
      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.get("/api/posts/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const posts = await storage.getPostsByUser(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Like routes
  // Saved posts routes
app.post("/api/posts/:postId/save", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.postId);

    const savedPost = await storage.savePost(userId, postId);
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({ message: "Failed to save post" });
  }
});

app.get("/api/posts/saved", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const savedPosts = await storage.getSavedPosts(userId);
    res.json(savedPosts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch saved posts" });
  }
});

app.delete("/api/posts/:postId/save", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.postId);

    await storage.unsavePost(userId, postId);
    res.json({ message: "Post unsaved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to unsave post" });
  }
});

app.post("/api/posts/:postId/like", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const postId = parseInt(req.params.postId);

      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Check if already liked
      const existingLike = await storage.getLike(userId, postId);
      if (existingLike) {
        return res.status(400).json({ message: "Post already liked" });
      }

      const likeData = insertLikeSchema.parse({ userId, postId });
      const like = await storage.createLike(likeData);

      // Get updated like count
      const likes = await storage.getLikesByPost(postId);

      res.status(201).json({ 
        like,
        count: likes.length
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/posts/:postId/like", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const postId = parseInt(req.params.postId);

      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.removeLike(userId, postId);

      // Get updated like count
      const likes = await storage.getLikesByPost(postId);

      res.json({ 
        success: true,
        count: likes.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  // Comment routes
  app.post("/api/posts/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const postId = parseInt(req.params.postId);

      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const commentData = insertCommentSchema.parse({ 
        ...req.body, 
        userId, 
        postId 
      });

      const comment = await storage.createComment(commentData);

      // Include author with comment
      const author = await storage.getUser(userId);
      const commentWithAuthor = {
        ...comment,
        author: {
          ...author!,
          password: undefined
        }
      };

      res.status(201).json(commentWithAuthor);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.get("/api/posts/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);

      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const comments = await storage.getCommentsByPost(postId);

      // Include author with each comment
      const commentsWithAuthor = await Promise.all(comments.map(async comment => {
        const author = await storage.getUser(comment.userId);
        return {
          ...comment,
          author: {
            ...author!,
            password: undefined
          }
        };
      }));

      res.json(commentsWithAuthor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Friend routes
  app.post("/api/friends/request", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const friendId = req.body.friendId;

      if (userId === friendId) {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }

      // Check if friend exists
      const friend = await storage.getUser(friendId);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if friend request already exists
      const existingRequest = await storage.getFriendRequest(userId, friendId);
      if (existingRequest) {
        return res.status(400).json({ message: "Friend request already exists" });
      }

      const friendData = insertFriendSchema.parse({ 
        userId, 
        friendId, 
        status: "pending" 
      });

      const friendRequest = await storage.createFriendRequest(friendData);
      res.status(201).json(friendRequest);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/friends/request/:requestId/accept", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);

      const updatedRequest = await storage.acceptFriendRequest(requestId);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Friend request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.put("/api/friends/request/:requestId/reject", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);

      const updatedRequest = await storage.rejectFriendRequest(requestId);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Friend request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  app.get("/api/friends/requests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const requests = await storage.getFriendRequestsForUser(userId);

      // Remove password from user objects
      const safeRequests = requests.map(request => {
        return {
          ...request,
          user: {
            ...request.user,
            password: undefined
          }
        };
      });

      res.json(safeRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.get("/api/friends", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const friends = await storage.getFriends(userId);

      // Remove password from user objects
      const safeFriends = friends.map(friend => {
        return {
          ...friend,
          user: {
            ...friend.user,
            password: undefined
          }
        };
      });

      res.json(safeFriends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/suggestions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const suggestions = await storage.getFriendSuggestions(userId);
      const safeSuggestions = suggestions.map(user => ({
        ...user,
        password: undefined
      }));
      res.json(safeSuggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend suggestions" });
    }
  });

  // User profile route
  app.get("/api/users/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const users = await storage.searchUsers(query);
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const safeUser = {
        ...user,
        password: undefined
      };

      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();

      // Remove passwords from response
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));

      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/posts", isAdmin, async (req, res) => {
    try {
      const posts = await storage.getAllPostsWithAuthors();

      // Remove passwords from authors
      const safePosts = posts.map(post => ({
        ...post,
        author: {
          ...post.author,
          password: undefined
        }
      }));

      res.json(safePosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.delete("/api/admin/users/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Don't allow deleting the admin (user 1)
      if (userId === 1) {
        return res.status(400).json({ message: "Cannot delete admin user" });
      }

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.delete("/api/admin/posts/:postId", isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);

      const success = await storage.deletePost(postId);
      if (!success) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.put("/api/admin/users/:userId/ban", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Don't allow banning the admin (user 1)
      if (userId === 1) {
        return res.status(400).json({ message: "Cannot ban admin user" });
      }

      const updatedUser = await storage.toggleUserBanStatus(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const safeUser = {
        ...updatedUser,
        password: undefined
      };

      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle user ban status" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Remove password from response
    const safeUser = {
      ...req.user,
      password: undefined
    };

    res.json(safeUser);
  });

  const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit
    }
  });

// Update payload limits for profile routes
app.use("/api/user/profile", express.json({limit: '50mb'}));
app.use("/api/user/profile", express.raw({limit: '50mb'}));
app.use("/api/user/profile", express.urlencoded({extended: true, limit: '50mb'}));

  app.post("/api/user/profile/image", isAuthenticated, imageUpload.single('image'), async (req, res) => {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

      const updatedUser = await storage.updateUser(userId, { profileImage: imageUrl });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ imageUrl });
    } catch (error) {
      console.error('Profile image upload error:', error);
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: "Image too large. Maximum size is 25MB." });
      }
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  app.post("/api/user/profile/cover", isAuthenticated, imageUpload.single('image'), async (req, res) => {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

      const updatedUser = await storage.updateUser(userId, { 
        coverImage: imageUrl,
        coverColor: null // Clear cover color when setting image
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ imageUrl });
    } catch (error) {
      console.error('Cover image upload error:', error);
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: "Image too large. Maximum size is 25MB." });
      }
      res.status(500).json({ message: "Failed to upload cover image" });
    }
  });

  app.put("/api/user/profile", isAuthenticated, express.json({limit: '50mb'}), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, bio, work, education, currentCity, hometown, profileImage, coverImage } = req.body;
      
      // Check if name is being changed
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (name && name !== currentUser.name) {
        // Always check lastNameChange when attempting to change name
        if (currentUser.lastNameChange) {
          const daysSinceLastChange = Math.floor((Date.now() - currentUser.lastNameChange.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceLastChange < 15) {
            return res.status(400).json({ 
              message: `You cannot change your name for another ${15 - daysSinceLastChange} days` 
            });
          }
        }
        // Set lastNameChange when name is changed
        currentUser.lastNameChange = new Date();
      }

      // Update user info including images
      const updatedUser = await storage.updateUser(userId, {
        name,
        bio,
        work,
        education,
        currentCity,
        hometown,
        profileImage,
        coverImage,
        lastNameChange: currentUser.lastNameChange
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const safeUser = {
        ...updatedUser,
        password: undefined
      };

      res.json(safeUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}