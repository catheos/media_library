import express, { Request, Response } from "express";
import db from "../db";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { requireBody } from "../middleware/validateBody";

const router = express.Router();

router.route('/register')
  // POST new user
  .post(requireBody, async (req: Request, res: Response) => {
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
      const existing_user = await db('user')
        .where({ username })
        .first();

      if (existing_user) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }

      // Hash password
      const hashed_password = await hashPassword(password);

      // Create user
      const [user_id] = await db('user').insert({
        username,
        password: hashed_password
      });

      // Generate token
      const token = generateToken(user_id);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user_id,
          username
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

router.route('/login')
  // POST login user
  .post(requireBody, async (req: Request, res: Response) => {
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

router.route('/')
  // GET all users
  .get(async (req: Request, res: Response) => {
    try {
      const users = await db('user')
        .select('id', 'username', 'created_at')
        .orderBy('username', 'asc');

      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // DELETE current user
  .delete(async (req: Request, res: Response) => {
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

router.route('/profile')
  // GET current user
  .get(async (req: Request, res: Response) => {
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
  })
  // PATCH current user
  .patch(requireBody, async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { username, currentPassword, newPassword } = req.body;

      // Check if anything was provided to update
      if (!username && !newPassword) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      const updates: any = {};

      // Handle username update if provided
      if (username) {
        // Check if username already exists for a DIFFERENT user
        const existing_user = await db('user')
          .where({ username })
          .whereNot({ id: user_id })
          .first();

        if (existing_user) {
          res.status(409).json({ error: 'Username already exists' });
          return;
        }

        updates.username = username;
      }

      // Handle password update if provided
      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({ error: 'Current password required to change password' });
          return;
        }

        // Verify current password
        const user = await db('user')
          .where({ id: user_id })
          .first();

        const isValidPassword = await comparePassword(currentPassword, user.password);
        
        if (!isValidPassword) {
          res.status(400).json({ error: 'Current password is incorrect' });
          return;
        }

        // Hash new password
        updates.password = await hashPassword(newPassword);
      }

      // Apply updates
      await db('user')
        .where({ id: user_id })
        .update(updates);

      // Get updated user data
      const updated_user = await db('user')
        .where({ id: user_id })
        .select('id', 'username', 'created_at')
        .first();

      res.json({ 
        message: 'Profile updated successfully',
        user: updated_user 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

router.route('/:id')
  // GET user by ID
  .get(async (req: Request, res: Response) => {
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

module.exports = router;