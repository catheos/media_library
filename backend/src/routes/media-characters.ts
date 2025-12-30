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
      const { search, limit } = req.query;
      
      // Start building the query
      let query = db('character_roles')
        .join('user', 'character_roles.created_by', 'user.id')
        .select(
          'character_roles.id',
          'character_roles.name',
          'character_roles.created_by',
          'user.username as created_by_username',
        )
        .orderBy('character_roles.name', 'asc');

      // Optional search filter
      if (search) {
        query = query.where('character_roles.name', 'like', `%${search}%`);
      }

      // Get total count before limit
      const [{ count }] = await query.clone().count('* as count');
      const total = parseInt(count as string);

      // Optional limit; default to 20 if not specified
      const maxResults = limit ? parseInt(limit as string, 10) : 20;
      query = query.limit(maxResults);

      const character_roles = await query;

      // Format roles with created_by object
      const formatted_character_roles = character_roles.map((role: any) => {
        const { created_by, created_by_username, ...role_destructure } = role;

        return {
          ...role_destructure,
          created_by: {
            id: created_by,
            username: created_by_username
          }
        }
      })

      res.json({
        roles: formatted_character_roles,
        total
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })
  // POST roles
  .post(async(req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { name } = req.body;

      // Validate name exists
      if (!name) {
        return res.status(400).json({ error: 'name is required!' });
      }

      // Validate name length
      if (name.length<3) {
        return res.status(400).json({ error: 'name must be 3 or more characters!'})
      }

      // Check if role exists
      const existing_role = await db('character_roles')
        .where({ name })
        .first();

      if (existing_role) {
        res.status(409).json({ error: 'name already exists' });
        return;
      }

      // Insert new role
      const [role_id] = await db('character_roles').insert({
        name: name,
        created_by: user_id
      });

      // Grab new role by id
      const role = await db('character_roles')
        .join('user', 'character_roles.created_by', 'user.id')
        .where('character_roles.id', role_id)
        .select(
          'character_roles.id',
          'character_roles.name',
          'character_roles.created_by',
          'user.username as created_by_username'
        )
        .first();
      
      const { created_by, created_by_username, ...role_destructure } = role;

      res.status(201).json({
        message: "Role created successfully!",
        role: {
          ...role_destructure,
          created_by: {
            id: created_by,
            username: created_by_username
          },
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
        .join('user', 'character_roles.created_by', 'user.id')
        .select(
          'character_roles.id',
          'character_roles.name',
          'character_roles.created_by',
          'user.username as created_by_username',
        )
        .where('character_roles.id', id)
        .first();
      
      if (!role) {
        res.status(404).json({ error: 'role not found' });
        return;
      }

      const { created_by, created_by_username, ...role_destructure } = role;
      res.json({
        ...role_destructure,
        created_by: {
          id: created_by,
          username: created_by_username
        }
      });

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

// ============= MEDIA-CHARACTER BASE ROUTES ================
router.route("/:id")
  .get(async(req: Request, res: Response) => {
    try {
      const { id } = req.params;

      let media_character = await db('media_character')
        .where('media_character.id', id)
        .join('media', 'media_character.media_id', 'media.id')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .join('user as media_creator', 'media.created_by', 'media_creator.id')
        .join('character', 'media_character.character_id', 'character.id')
        .join('character_roles', 'media_character.role_id', 'character_roles.id')
        .join('user as mc_creator', 'media_character.created_by', 'mc_creator.id')
        .select(
          'media_character.id',
          'media_character.media_id',
          'media_character.character_id',
          'media_character.role_id',
          'media.title',
          'media.type_id',
          'media_types.name as type_name',
          'media.release_year',
          'media.status_id',
          'media_status_types.name as status_name',
          'media.description',
          'media.created_by',
          'media_creator.username as media_created_by_username',
          'character.name as character_name',
          'character_roles.name as role_name',
          'media_character.created_by as mc_created_by',
          'mc_creator.username as mc_created_by_username'
        )
        .first();

      if (!media_character) {
        res.status(404).json({ error: 'Media-character relationship not found' });
        return;
      }

      // deconstruction
      const { 
        media_id,
        title, 
        type_id, 
        type_name,
        release_year, 
        status_id, 
        status_name,
        description, 
        created_by, 
        media_created_by_username, 

        character_id,
        character_name,

        role_id,
        role_name,

        mc_created_by,
        mc_created_by_username,
        ...media_character_destructure
      } = media_character;

      res.json({
        ...media_character_destructure,
        media: {
          id: media_id,
          title,
          type: {
            id: type_id,
            name: type_name
          },
          release_year,
          status: {
            id: status_id,
            name: status_name
          },
          description,
          created_by: {
            id: created_by,
            username: media_created_by_username
          }
        },
        character: {
          id: character_id,
          name: character_name
        },
        role: {
          id: role_id,
          name: role_name
        },
        created_by: {
          id: mc_created_by,
          username: mc_created_by_username
        }
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })
  // DELETE remove character from media
  .delete(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;

      // Verify relationship exists
      const media_character = await db('media_character')
        .where({ id: parseInt(id) })
        .first();

      if (!media_character) {
        res.status(404).json({ error: 'Media-character relationship not found' });
        return;
      }

      // user created relationship
      if (media_character.created_by !== user_id) {
        res.status(403).json({ error: 'You can only remove characters from media you created' });
        return;
      }

      // Delete relationship
      await db('media_character').where({ id: parseInt(id) }).del();

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
        .join('user', 'media_character.created_by', 'user.id')
        .where({ 'media_character.media_id': parseInt(media_id) })
        .select(
          'media_character.id',
          'character.id as character_id',
          'character.name as character_name',
          'character.details',
          'character.wiki_url',
          'character_roles.id as role_id',
          'character_roles.name as role_name',
          'media_character.created_by',
          'user.username as created_by_username'
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
        },
        created_by: {
          id: mc.created_by,
          username: mc.created_by_username
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
      await db('media_character').insert({
        media_id: parseInt(media_id),
        character_id: character_id,
        role_id: role_id,
        created_by: user_id
      });

      // Grab new relationship
      const media_character = await db('media_character')
        .where({
          media_id: parseInt(media_id),
          character_id: character_id
        })
        .join('media', 'media_character.media_id', 'media.id')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .join('user as media_creator', 'media.created_by', 'media_creator.id')
        .join('character', 'media_character.character_id', 'character.id')
        .join('character_roles', 'media_character.role_id', 'character_roles.id')
        .join('user as mc_creator', 'media_character.created_by', 'mc_creator.id')
        .select(
          'media_character.id',
          'media_character.media_id as media_id_new',
          'media.title',
          'media.type_id',
          'media_types.name as type_name',
          'media.release_year',
          'media.status_id',
          'media_status_types.name as status_name',
          'media.description',
          'media.created_by',
          'media_creator.username as media_created_by_username',
          'media_character.character_id as character_id_new',
          'character.name as character_name',
          'media_character.role_id as role_id_new',
          'character_roles.name as role_name',
          'media_character.created_by as mc_created_by',
          'mc_creator.username as mc_created_by_username'
        )
        .first();

      // deconstruction
      const { 
        media_id_new,
        title, 
        type_id, 
        type_name,
        release_year, 
        status_id, 
        status_name,
        description, 
        created_by, 
        media_created_by_username, 

        character_id_new,
        character_name,

        role_id_new,
        role_name,

        mc_created_by,
        mc_created_by_username,
        ...media_character_destructure
      } = media_character;

      res.status(201).json({
        message: 'Character added to media successfully',
        media_character: {
          ...media_character_destructure,
          media: {
            id: media_id_new,
            title,
            type: {
              id: type_id,
              name: type_name
            },
            release_year,
            status: {
              id: status_id,
              name: status_name
            },
            description,
            created_by: {
              id: created_by,
              username: media_created_by_username
            }
          },
          character: {
            id: character_id_new,
            name: character_name
          },
          role: {
            id: role_id_new,
            name: role_name
          },
          created_by: {
            id: mc_created_by,
            username: mc_created_by_username
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
        .join('user', 'media_character.created_by', 'user.id')
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
          'character_roles.name as role_name',
          'media_character.created_by',
          'user.username as created_by_username'
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
        },
        created_by: {
          id: media_character.created_by,
          username: media_character.created_by_username
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

module.exports = router;