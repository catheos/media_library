import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";
import { requireBody } from "../middleware/validateBody";

// Define types
interface MediaCharacterDbRow {
  id: number;
  media_id: number;
  character_id: number;
  role_id: number;
  media_title: string;
  character_name: string;
  role_name: string;
}

// ============= CHARACTER ROLES ROUTES (ORIGINAL) =============
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

// ============= MEDIA-CHARACTER LINKING ROUTES =============
router.route("/media/:media_id/characters")
  // GET all characters for a specific media
  .get(async (req: Request, res: Response) => {
    try {
      const { media_id } = req.params;

      // Verify media exists
      const media = await db('media').where({ id: parseInt(media_id) }).first();
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      // Get all characters for this media
      const media_characters = await db('media_character')
        .join('character', 'media_character.character_id', 'character.id')
        .join('character_roles', 'media_character.role_id', 'character_roles.id')
        .where({ 'media_character.media_id': parseInt(media_id) })
        .select(
          'media_character.id',
          'character.id as character_id',
          'character.name as character_name',
          'character.details',
          'character.wiki_url',
          'character_roles.id as role_id',
          'character_roles.name as role_name'
        )
        .orderBy('character.name', 'asc');

      // Format response
      const formatted = media_characters.map((mc: any) => ({
        id: mc.id,
        character: {
          id: mc.character_id,
          name: mc.character_name,
          details: mc.details ? JSON.parse(mc.details) : null,
          wiki_url: mc.wiki_url
        },
        role: {
          id: mc.role_id,
          name: mc.role_name
        }
      }));

      res.json({ characters: formatted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // POST add character to media
  .post(requireBody, async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { media_id } = req.params;
      const { character_id, role_id } = req.body;

      // Validate required fields
      if (!character_id || !role_id) {
        res.status(400).json({ error: 'character_id and role_id are required' });
        return;
      }

      // Verify media exists and user owns it
      const media = await db('media').where({ id: parseInt(media_id) }).first();
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      if (media.created_by !== user_id) {
        res.status(403).json({ error: 'You can only add characters to media you created' });
        return;
      }

      // Verify character exists
      const character = await db('character').where({ id: character_id }).first();
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }

      // Verify role exists
      const role = await db('character_roles').where({ id: role_id }).first();
      if (!role) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }

      // Check if this character is already added to this media
      const existing = await db('media_character')
        .where({ 
          media_id: parseInt(media_id), 
          character_id: character_id 
        })
        .first();

      if (existing) {
        res.status(409).json({ error: 'Character already added to this media' });
        return;
      }

      // Create the relationship
      const [id] = await db('media_character').insert({
        media_id: parseInt(media_id),
        character_id: character_id,
        role_id: role_id
      });

      res.status(201).json({
        message: 'Character added to media successfully',
        media_character: {
          id: id,
          media_id: parseInt(media_id),
          character: {
            id: character.id,
            name: character.name,
            details: character.details ? JSON.parse(character.details) : null,
            wiki_url: character.wiki_url
          },
          role: {
            id: role.id,
            name: role.name
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })

router.route("/media/:media_id/characters/:id")
  // GET single media-character relationship
  .get(async (req: Request, res: Response) => {
    try {
      const { media_id, id } = req.params;

      const media_character = await db('media_character')
        .join('character', 'media_character.character_id', 'character.id')
        .join('character_roles', 'media_character.role_id', 'character_roles.id')
        .where({ 
          'media_character.id': parseInt(id),
          'media_character.media_id': parseInt(media_id)
        })
        .select(
          'media_character.id',
          'media_character.media_id',
          'character.id as character_id',
          'character.name as character_name',
          'character.details',
          'character.wiki_url',
          'character_roles.id as role_id',
          'character_roles.name as role_name'
        )
        .first();

      if (!media_character) {
        res.status(404).json({ error: 'Media-character relationship not found' });
        return;
      }

      res.json({
        id: media_character.id,
        media_id: media_character.media_id,
        character: {
          id: media_character.character_id,
          name: media_character.character_name,
          details: media_character.details ? JSON.parse(media_character.details) : null,
          wiki_url: media_character.wiki_url
        },
        role: {
          id: media_character.role_id,
          name: media_character.role_name
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // PATCH update character role in media
  .patch(requireBody, async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { media_id, id } = req.params;
      const { role_id } = req.body;

      if (!role_id) {
        res.status(400).json({ error: 'role_id is required' });
        return;
      }

      // Verify media exists and user owns it
      const media = await db('media').where({ id: parseInt(media_id) }).first();
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      if (media.created_by !== user_id) {
        res.status(403).json({ error: 'You can only edit characters for media you created' });
        return;
      }

      // Verify relationship exists
      const media_character = await db('media_character')
        .where({ 
          id: parseInt(id),
          media_id: parseInt(media_id)
        })
        .first();

      if (!media_character) {
        res.status(404).json({ error: 'Media-character relationship not found' });
        return;
      }

      // Verify role exists
      const role = await db('character_roles').where({ id: role_id }).first();
      if (!role) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }

      // Update role
      await db('media_character')
        .where({ id: parseInt(id) })
        .update({ role_id: role_id });

      // Get updated relationship
      const updated = await db('media_character')
        .join('character', 'media_character.character_id', 'character.id')
        .join('character_roles', 'media_character.role_id', 'character_roles.id')
        .where({ 'media_character.id': parseInt(id) })
        .select(
          'media_character.id',
          'media_character.media_id',
          'character.id as character_id',
          'character.name as character_name',
          'character.details',
          'character.wiki_url',
          'character_roles.id as role_id',
          'character_roles.name as role_name'
        )
        .first();

      res.json({
        message: 'Character role updated successfully',
        media_character: {
          id: updated.id,
          media_id: updated.media_id,
          character: {
            id: updated.character_id,
            name: updated.character_name,
            details: updated.details ? JSON.parse(updated.details) : null,
            wiki_url: updated.wiki_url
          },
          role: {
            id: updated.role_id,
            name: updated.role_name
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // DELETE remove character from media
  .delete(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { media_id, id } = req.params;

      // Verify media exists and user owns it
      const media = await db('media').where({ id: parseInt(media_id) }).first();
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      if (media.created_by !== user_id) {
        res.status(403).json({ error: 'You can only remove characters from media you created' });
        return;
      }

      // Verify relationship exists
      const media_character = await db('media_character')
        .where({ 
          id: parseInt(id),
          media_id: parseInt(media_id)
        })
        .first();

      if (!media_character) {
        res.status(404).json({ error: 'Media-character relationship not found' });
        return;
      }

      // Delete relationship
      await db('media_character').where({ id: parseInt(id) }).del();

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })

module.exports = router;