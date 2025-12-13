import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";

router.route("/roles")
  // GET roles with optional name and limit filtering
  .get(async(req: Request, res: Response) => {
    try {
      const { name, limit } = req.query;

      // Start building the query
      let query = db('character_roles').select('*').orderBy('name', 'asc');

      // Optional name filter for typeahead
      if (name) {
        query = query.where('name', 'like', `%${name}%`);
      }

      // Optional limit; default to 20 if not specified
      const maxResults = limit ? parseInt(limit as string, 10) : 20;
      query = query.limit(maxResults);

      const character_roles = await query;
      res.json(character_roles);

    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })
  // POST roles
  .post(async(req: Request, res: Response) => {
    try {
      const { name } = req.body;

      // Validate name exists
      if (!name) {
        return res.status(400).json({ error: 'name is required!' });
      }

      // Validate name length
      if (name.length<3) {
        return res.status(400).json({ error: 'name must be 3 or more characters!'})
      }

      // Check if user exists
      const existing_role = await db('character_roles')
        .where({ name })
        .first();

      if (existing_role) {
        res.status(409).json({ error: 'name already exists' });
        return;
      }

      // Insert new role
      const [id] = await db('character_roles').insert({
        name
      });

      res.status(201).json({
        message: "Role created successfully!",
        role: {
          id: id,
          name: name
        }
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

router.route("/roles/:id")
  // GET role by id
  .get(async(req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const role = await db('character_roles')
        .where({ id: id })
        .first();

      if (!role) {
        res.status(404).json({ error: 'role not found' });
        return;
      }

      res.json(role);

    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })
  // DELETE role by id
  .delete(async(req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if role exists
      const role = await db('character_roles')
        .where({ id: parseInt(id) })
        .first();

      if (!role) {
        res.status(404).json({ error: 'role not found' });
        return;
      }

      // Delete the role
      await db('character_roles')
        .where({ id: parseInt(id) })
        .delete();

      res.json({
        message: 'role deleted successfully',
        deleted_role: role
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

module.exports = router;