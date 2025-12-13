import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";

router.route("/types")
  // GET media types
  .get(async(req: Request, res: Response) => {
    try {
      const media_types = await db('media_types')
        .select('*')
        .orderBy('name', 'asc');

      res.json(media_types)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

router.route("/")
  // POST new media
  .post(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { title, type_id, release_year, status_id, description } = req.body;

      // Validate required fields
      if (!title || !type_id || !status_id) {
        res.status(400).json({ error: 'title, type_id, and status_id are required' });
        return;
      }

      // Verify media_type_id exists
      const media_type = await db('media_types').where({ id: type_id }).first();
      if (!media_type) {
        res.status(400).json({ error: 'Invalid type_id' });
        return;
      }

      // Verify status_id exists
      const media_status = await db('media_status_types').where({ id: status_id }).first();
      if (!media_status) {
        res.status(400).json({ error: 'Invalid status_id' });
        return;
      }

      // Create media
      const [media_id] = await db('media').insert({
        title,
        type_id,
        release_year: release_year || null,
        status_id,
        description: description || null,
        created_by: user_id
      });

      res.status(201).json({
        message: 'Media created successfully',
        media: {
          id: media_id,
          title,
          type_id,
          release_year,
          status_id,
          description,
          created_by: user_id
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })

router.route("/:id")
  // GET single media by ID
  .get(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const media = await db('media')
        .where({ 'media.id': parseInt(id) })
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .join('user', 'media.created_by', 'user.id')
        .select(
          'media.id',
          'media.title',
          'media.release_year',
          'media.description',
          'media.created_by',
          'media_types.id as type_id',
          'media_types.name as type_name',
          'media_status_types.id as status_id',
          'media_status_types.name as status_name',
          'user.username as created_by_username'
        )
        .first();

      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      // Format response
      const formatted_media = {
        id: media.id,
        title: media.title,
        type: {
          id: media.type_id,
          name: media.type_name
        },
        release_year: media.release_year,
        status: {
          id: media.status_id,
          name: media.status_name
        },
        description: media.description,
        created_by: {
          id: media.created_by,
          username: media.created_by_username
        }
      };

      res.json(formatted_media);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // PATCH single media by ID
  .patch(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;
      const { title, type_id, release_year, status_id, description } = req.body;

      // Check if media exists
      const media = await db('media').where({ id: parseInt(id) }).first();
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      // Check if user owns this media
      if (media.created_by !== user_id) {
        res.status(403).json({ error: 'You can only edit media you created' });
        return;
      }

      // Verify type_id if provided
      if (type_id) {
        const media_type = await db('media_types').where({ id: type_id }).first();
        if (!media_type) {
          res.status(400).json({ error: 'Invalid type_id' });
          return;
        }
      }

      // Verify status_id if provided
      if (status_id) {
        const media_status = await db('media_status_types').where({ id: status_id }).first();
        if (!media_status) {
          res.status(400).json({ error: 'Invalid status_id' });
          return;
        }
      }

      // Build update object (only include provided fields)
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (type_id !== undefined) updates.type_id = type_id;
      if (release_year !== undefined) updates.release_year = release_year;
      if (status_id !== undefined) updates.status_id = status_id;
      if (description !== undefined) updates.description = description;

      // Update media
      await db('media')
        .where({ id: parseInt(id) })
        .update(updates);

      res.json({
        message: 'Media updated successfully',
        id: parseInt(id)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;