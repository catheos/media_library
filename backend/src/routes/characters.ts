import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";
import { requireBody } from "../middleware/validateBody";
import { processImage, upload } from "../middleware/upload";
import path = require("path");

// Define types
interface CharacterDbRow {
  id: number;
  name: string;
  details: string | null;
  wiki_url: string | null;
  created_at: string;
  updated_at: string;
}

router.route("/")
  // GET all characters with pagination and search
  .get(async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const page_size = parseInt(process.env.CHARACTER_PAGE_SIZE || '20');
      const offset = (page - 1) * page_size;
      const search = req.query.search as string;

      let query = db('character');

      // Add search filter if provided
      if (search) {
        query = query.where('name', 'like', `%${search}%`);
      }

      // Get total count
      const [{ count }] = await query.clone().count('* as count');
      const total = parseInt(count as string);
      const total_pages = Math.ceil(total / page_size);

      // Get paginated characters with media count for context
      const characters = await query
        .select(
          'character.*',
          db.raw('COUNT(media_character.id) as media_count')
        )
        .leftJoin('media_character', 'character.id', 'media_character.character_id')
        .groupBy('character.id')
        .limit(page_size)
        .offset(offset)
        .orderBy('name', 'asc');

      // Parse JSON details field
      const formatted_characters = characters.map((char: any) => ({
        id: char.id,
        name: char.name,
        details: char.details ? JSON.parse(char.details) : null,
        wiki_url: char.wiki_url,
        created_at: char.created_at,
        updated_at: char.updated_at,
        media_count: parseInt(char.media_count)
      }));

      res.json({
        characters: formatted_characters,
        total,
        page,
        page_size,
        total_pages
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // POST new character
  .post(upload.single('image'), async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { name, details, wiki_url } = req.body;
      const image_file = req.file;

      // Validate required fields
      if (!name || name.trim() === '') {
        res.status(400).json({ error: 'name is required' });
        return;
      }

      // Create character
      const [character_id] = await db('character').insert({
        name: name.trim(),
        details: details ? JSON.stringify(details) : null,
        wiki_url: wiki_url || null,
        created_by: user_id
      });

      // Process and save image with character_id (if provided)
      try {
        if (image_file) {
          await processImage({
            temp_path: image_file.path,
            id: character_id,
            folder: 'characters',
            generate_thumbnail: false
          });
        }

        // Get created character
        const character = await db('character')
          .where({ id: character_id })
          .first();

        res.status(201).json({
          message: 'Character created successfully',
          character: {
            ...character,
            details: character.details ? JSON.parse(character.details) : null
          }
        });

      } catch (imageError) {
        // Delete character entry if image processing fails
        await db('character').where({ id: character_id }).del();
        throw new Error('Failed to process image');
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })

router.route("/:id")
  // GET single character by ID
  .get(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const character = await db('character')
        .where({ 'character.id': parseInt(id) })
        .join('user', 'character.created_by', 'user.id')
        .select(
          'character.id',
          'character.name',
          'character.details',
          'character.wiki_url',
          'character.created_at',
          'character.updated_at',
          'character.created_by',
          'user.username as created_by_username'
        )
        .first();

      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      
      // Deconstruct values for better output
      const { created_by, created_by_username, ...character_destructure } = character;
      
      res.json({
        ...character_destructure,
        created_by: {
          id: created_by,
          username: created_by_username
        },
        details: character.details ? JSON.parse(character.details) : null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // PATCH single character by ID
  .patch(requireBody, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, details, wiki_url } = req.body;

      // Check if anything was provided to update
      if (name === undefined && details === undefined && wiki_url === undefined) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      // Check if character exists
      const character = await db('character').where({ id: parseInt(id) }).first();
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }

      const updates: any = {
        updated_at: db.fn.now()
      };

      // Handle name update if provided
      if (name !== undefined) {
        if (!name || name.trim() === '') {
          res.status(400).json({ error: 'Name cannot be empty' });
          return;
        }
        updates.name = name.trim();
      }

      // Handle details update if provided
      if (details !== undefined) {
        updates.details = details ? JSON.stringify(details) : null;
      }

      // Handle wiki_url update if provided
      if (wiki_url !== undefined) {
        updates.wiki_url = wiki_url || null;
      }

      // Apply updates
      await db('character')
        .where({ id: parseInt(id) })
        .update(updates);

      // Get updated character
      const updated_character = await db('character')
        .where({ id: parseInt(id) })
        .first();

      res.json({
        message: 'Character updated successfully',
        character: {
          ...updated_character,
          details: updated_character.details ? JSON.parse(updated_character.details) : null
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // DELETE single character by ID
  .delete(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if character exists
      const character = await db('character').where({ id: parseInt(id) }).first();
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }

      // Check if character is used in any media
      const usage_count = await db('media_character')
        .where({ character_id: parseInt(id) })
        .count('* as count')
        .first();

      if (usage_count && parseInt(usage_count.count as string) > 0) {
        res.status(409).json({ 
          error: 'Cannot delete character that is associated with media',
          media_count: parseInt(usage_count.count as string)
        });
        return;
      }

      // Delete character
      await db('character').where({ id: parseInt(id) }).del();

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })

router.route("/:character_id/media")
  // GET all media for a specific character
  .get(async (req: Request, res: Response) => {
    try {
      const { character_id } = req.params;
  
      // Verify character exists
      const character = await db('character').where({ id: parseInt(character_id) }).first();
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
  
      // Get all media for this character
      const character_media = await db('media_character')
        .join('media', 'media_character.media_id', 'media.id')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('character_roles', 'media_character.role_id', 'character_roles.id')
        .where({ 'media_character.character_id': parseInt(character_id) })
        .select(
          'media_character.id',
          'media.id as media_id',
          'media.title',
          'media.release_year',
          'media_types.id as type_id',
          'media_types.name as type_name',
          'character_roles.id as role_id',
          'character_roles.name as role_name'
        )
        .orderBy('media.title', 'asc');
  
      // Format response
      const formatted = character_media.map((cm: any) => ({
        id: cm.id,
        media: {
          id: cm.media_id,
          title: cm.title,
          release_year: cm.release_year,
          type: {
            id: cm.type_id,
            name: cm.type_name
          }
        },
        role: {
          id: cm.role_id,
          name: cm.role_name
        }
      }));
  
      res.json({ media: formatted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })

router.route("/:id/cover")
  // GET media cover
  .get(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const character = await db('character').where({ id: parseInt(id) }).first();
    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    const image_path = path.join(process.cwd(), 'uploads', 'characters', `${id}.webp`);
    res.sendFile(image_path);
  })
  // PATCH media cover
  .patch(upload.single('image'), async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;
      const image_file = req.file;

      if (!image_file) {
        res.status(400).json({ error: 'Image file is required' });
        return;
      }

      // Check if media exists and user owns it
      const character = await db('character').where({ id: parseInt(id) }).first();
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }

      if (character.created_by !== user_id) {
        res.status(403).json({ error: 'You can only edit characters you created' });
        return;
      }

      // Process and replace images
      await processImage({
        temp_path: image_file.path,
        id: parseInt(id),
        folder: 'characters'
      });

      res.json({ message: 'Cover updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;