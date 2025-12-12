import express, { Request, Response } from "express";
import db from "../db";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

const router = express.Router();

// Register user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};

    // Validate input
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user exists
    const existingUser = await db('user')
      .where({ username })
      .first();

    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [userId] = await db('user').insert({
      username,
      password: hashedPassword
    });

    // Generate token
    const token = generateToken(userId);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        username
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};

    // Validate input
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    // Find user
    const user = await db('user')
      .where({ username })
      .first();

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await db('user')
      .select('id', 'username', 'created_at')
      .orderBy('username', 'asc');

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user_id = req.user!.user_id;

    const user = await db('user')
      .where({ id: user_id })
      .select('id', 'username', 'created_at')
      .first();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update current user's profile
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const user_id = req.user!.user_id;
    const { username } = req.body;

    if (!username) {
      res.status(400).json({ error: 'Username required' });
      return;
    }

    await db('user')
      .where({ id: user_id })
      .update({ username });

    res.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID (public profile view)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await db('user')
      .where({ id: parseInt(id) })
      .select('id', 'username', 'created_at')
      .first();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/', async (req: Request, res: Response) => {
  try {
    const user_id = req.user!.user_id;

    const deleted = await db('user')
      .where({ id: user_id })
      .delete();

    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;