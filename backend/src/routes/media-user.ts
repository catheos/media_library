import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";
import { requireBody } from "../middleware/validateBody";

router.route("/statuses")
  // GET all user media statuses
  .get(async (req: Request, res: Response) => {
    try {
      const statuses = await db('user_media_status_types')
        .orderBy('id', 'asc');

      res.json(statuses);

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

router.route("/statuses/:id")
  // GET single user media status
  .get(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const status = await db('user_media_status_types')
        .where({ id: parseInt(id) })
        .first();

      if (!status) {
        res.status(404).json({ error: 'Status not found' });
        return;
      }

      res.json(status);

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

// ============= MEDIA-USER BASE ROUTES ================
router.route("/")
  // GET all media-user entries for current user
  .get(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      
      // Extract search filters from query params
      const { 
        // Media filters
        title,
        type,
        status,
        year,
        year_gt,
        year_lt,
        
        // User-specific filters
        user_status,
        user_score,
        user_score_gt,
        user_score_lt,
        
        limit 
      } = req.query;

      // Build base query
      let query = db('user_media')
        .where('user_media.user_id', user_id)
        .join('media', 'user_media.media_id', 'media.id')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .leftJoin('user_media_status_types', 'user_media.status_id', 'user_media_status_types.id');

      // Apply Media filters
      if (title) {
        query = query.where('media.title', 'like', `%${title}%`);
      }

      if (type) {
        query = query.where('media_types.name', type as string);
      }

      if (status) {
        query = query.where('media_status_types.name', status as string);
      }

      if (year) {
        query = query.where('media.release_year', parseInt(year as string));
      } else {
        if (year_gt) {
          query = query.where('media.release_year', '>', parseInt(year_gt as string));
        }
        if (year_lt) {
          query = query.where('media.release_year', '<', parseInt(year_lt as string));
        }
      }

      // Apply User-specific filters
      if (user_status) {
        query = query.where('user_media_status_types.name', user_status as string);
      }

      if (user_score) {
        query = query.where('user_media.score', parseInt(user_score as string));
      } else {
        if (user_score_gt) {
          query = query.where('user_media.score', '>', parseInt(user_score_gt as string));
        }
        if (user_score_lt) {
          query = query.where('user_media.score', '<', parseInt(user_score_lt as string));
        }
      }

      // Get total count with filters applied
      const countQuery = query.clone();
      const [{ count }] = await countQuery.count('* as count');
      const total = parseInt(count as string);

      // Optional limit; default to 20 if not specified
      const maxResults = limit ? parseInt(limit as string, 10) : 20;

      // Get entries with filters
      const user_media_entries = await query
        .select(
          'user_media.id',
          'user_media.user_id',
          'user_media.media_id',
          'user_media.current_progress',
          'user_media.status_id',
          'user_media_status_types.name as user_status_name',
          'user_media.progress_updated',
          'user_media.score',
          'user_media.review',
          'user_media.rating_created',
          'user_media.created_at',
          'media.title',
          'media.type_id',
          'media_types.name as type_name',
          'media.release_year',
          'media.status_id as media_status_id',
          'media_status_types.name as media_status_name',
          'media.description'
        )
        .limit(maxResults)
        .orderBy('user_media.created_at', 'desc');

      // Format response
      const formatted = user_media_entries.map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        media: {
          id: entry.media_id,
          title: entry.title,
          type: {
            id: entry.type_id,
            name: entry.type_name
          },
          release_year: entry.release_year,
          status: {
            id: entry.media_status_id,
            name: entry.media_status_name
          },
          description: entry.description
        },
        current_progress: entry.current_progress,
        status: entry.status_id ? {
          id: entry.status_id,
          name: entry.user_status_name
        } : null,
        progress_updated: entry.progress_updated,
        score: entry.score,
        review: entry.review,
        rating_created: entry.rating_created,
        created_at: entry.created_at
      }));

      res.json({
        user_media: formatted,
        total
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // POST add media to user's library
  .post(requireBody, async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { 
        media_id, 
        current_progress, 
        status_id, 
        score, 
        review 
      } = req.body;

      // Validate required fields
      if (!media_id) {
        res.status(400).json({ error: 'media_id is required' });
        return;
      }

      // Verify media exists
      const media = await db('media').where({ id: media_id }).first();
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      // Verify status exists if provided
      if (status_id) {
        const status = await db('user_media_status_types').where({ id: status_id }).first();
        if (!status) {
          res.status(404).json({ error: 'Status not found' });
          return;
        }
      }

      // Check if already in user's library
      const existing = await db('user_media')
        .where({ 
          user_id: user_id,
          media_id: media_id 
        })
        .first();

      if (existing) {
        res.status(409).json({ error: 'Media already in your library' });
        return;
      }

      // Validate score if provided
      if (score !== undefined && (score < 0 || score > 10)) {
        res.status(400).json({ error: 'Score must be between 0 and 10' });
        return;
      }

      // Create the entry
      const now = new Date();
      const [entry_id] = await db('user_media').insert({
        user_id: user_id,
        media_id: media_id,
        current_progress: current_progress || null,
        status_id: status_id || null,
        progress_updated: current_progress || status_id ? now : null,
        score: score || null,
        review: review || null,
        rating_created: score || review ? now : null
      });

      // Get the created entry
      const user_media_entry = await db('user_media')
        .where('user_media.id', entry_id)
        .join('media', 'user_media.media_id', 'media.id')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .leftJoin('user_media_status_types', 'user_media.status_id', 'user_media_status_types.id')
        .select(
          'user_media.id',
          'user_media.user_id',
          'user_media.media_id',
          'user_media.current_progress',
          'user_media.status_id',
          'user_media_status_types.name as user_status_name',
          'user_media.progress_updated',
          'user_media.score',
          'user_media.review',
          'user_media.rating_created',
          'user_media.created_at',
          'media.title',
          'media.type_id',
          'media_types.name as type_name',
          'media.release_year',
          'media.status_id as media_status_id',
          'media_status_types.name as media_status_name',
          'media.description'
        )
        .first();

      res.status(201).json({
        message: 'Media added to library successfully',
        user_media: {
          id: user_media_entry.id,
          user_id: user_media_entry.user_id,
          media: {
            id: user_media_entry.media_id,
            title: user_media_entry.title,
            type: {
              id: user_media_entry.type_id,
              name: user_media_entry.type_name
            },
            release_year: user_media_entry.release_year,
            status: {
              id: user_media_entry.media_status_id,
              name: user_media_entry.media_status_name
            },
            description: user_media_entry.description
          },
          current_progress: user_media_entry.current_progress,
          status: user_media_entry.status_id ? {
            id: user_media_entry.status_id,
            name: user_media_entry.user_status_name
          } : null,
          progress_updated: user_media_entry.progress_updated,
          score: user_media_entry.score,
          review: user_media_entry.review,
          rating_created: user_media_entry.rating_created,
          created_at: user_media_entry.created_at
        }
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

router.route("/:id")
  // GET specific user-media entry
  .get(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;

      const user_media_entry = await db('user_media')
        .where({
          'user_media.id': parseInt(id),
          'user_media.user_id': user_id
        })
        .join('media', 'user_media.media_id', 'media.id')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .leftJoin('user_media_status_types', 'user_media.status_id', 'user_media_status_types.id')
        .select(
          'user_media.id',
          'user_media.user_id',
          'user_media.media_id',
          'user_media.current_progress',
          'user_media.status_id',
          'user_media_status_types.name as user_status_name',
          'user_media.progress_updated',
          'user_media.score',
          'user_media.review',
          'user_media.rating_created',
          'user_media.created_at',
          'media.title',
          'media.type_id',
          'media_types.name as type_name',
          'media.release_year',
          'media.status_id as media_status_id',
          'media_status_types.name as media_status_name',
          'media.description'
        )
        .first();

      if (!user_media_entry) {
        res.status(404).json({ error: 'User-media entry not found' });
        return;
      }

      res.json({
        id: user_media_entry.id,
        user_id: user_media_entry.user_id,
        media: {
          id: user_media_entry.media_id,
          title: user_media_entry.title,
          type: {
            id: user_media_entry.type_id,
            name: user_media_entry.type_name
          },
          release_year: user_media_entry.release_year,
          status: {
            id: user_media_entry.media_status_id,
            name: user_media_entry.media_status_name
          },
          description: user_media_entry.description
        },
        current_progress: user_media_entry.current_progress,
        status: user_media_entry.status_id ? {
          id: user_media_entry.status_id,
          name: user_media_entry.user_status_name
        } : null,
        progress_updated: user_media_entry.progress_updated,
        score: user_media_entry.score,
        review: user_media_entry.review,
        rating_created: user_media_entry.rating_created,
        created_at: user_media_entry.created_at
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // PATCH update user-media entry
  .patch(requireBody, async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;
      const { 
        current_progress, 
        status_id, 
        score, 
        review 
      } = req.body;

      // Verify entry exists and belongs to user
      const entry = await db('user_media')
        .where({
          id: parseInt(id),
          user_id: user_id
        })
        .first();

      if (!entry) {
        res.status(404).json({ error: 'User-media entry not found' });
        return;
      }

      // Verify status exists if provided
      if (status_id !== undefined && status_id !== null) {
        const status = await db('user_media_status_types').where({ id: status_id }).first();
        if (!status) {
          res.status(404).json({ error: 'Status not found' });
          return;
        }
      }

      // Validate score if provided
      if (score !== undefined && score !== null && (score < 0 || score > 10)) {
        res.status(400).json({ error: 'Score must be between 0 and 10' });
        return;
      }

      // Build update object
      const updateData: any = {};
      const now = new Date();

      if (current_progress !== undefined) {
        updateData.current_progress = current_progress || null;
        updateData.progress_updated = now;
      }

      if (status_id !== undefined) {
        updateData.status_id = status_id || null;
        updateData.progress_updated = now;
      }

      if (score !== undefined) {
        updateData.score = score || null;
        if (!entry.rating_created) {
          updateData.rating_created = now;
        }
      }

      if (review !== undefined) {
        updateData.review = review || null;
        if (!entry.rating_created) {
          updateData.rating_created = now;
        }
      }

      // Update entry
      await db('user_media')
        .where({ id: parseInt(id) })
        .update(updateData);

      // Get updated entry
      const updated = await db('user_media')
        .where('user_media.id', parseInt(id))
        .join('media', 'user_media.media_id', 'media.id')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .leftJoin('user_media_status_types', 'user_media.status_id', 'user_media_status_types.id')
        .select(
          'user_media.id',
          'user_media.user_id',
          'user_media.media_id',
          'user_media.current_progress',
          'user_media.status_id',
          'user_media_status_types.name as user_status_name',
          'user_media.progress_updated',
          'user_media.score',
          'user_media.review',
          'user_media.rating_created',
          'user_media.created_at',
          'media.title',
          'media.type_id',
          'media_types.name as type_name',
          'media.release_year',
          'media.status_id as media_status_id',
          'media_status_types.name as media_status_name',
          'media.description'
        )
        .first();

      res.json({
        message: 'User-media entry updated successfully',
        user_media: {
          id: updated.id,
          user_id: updated.user_id,
          media: {
            id: updated.media_id,
            title: updated.title,
            type: {
              id: updated.type_id,
              name: updated.type_name
            },
            release_year: updated.release_year,
            status: {
              id: updated.media_status_id,
              name: updated.media_status_name
            },
            description: updated.description
          },
          current_progress: updated.current_progress,
          status: updated.status_id ? {
            id: updated.status_id,
            name: updated.user_status_name
          } : null,
          progress_updated: updated.progress_updated,
          score: updated.score,
          review: updated.review,
          rating_created: updated.rating_created,
          created_at: updated.created_at
        }
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // DELETE remove media from user's library
  .delete(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;

      // Verify entry exists and belongs to user
      const entry = await db('user_media')
        .where({
          id: parseInt(id),
          user_id: user_id
        })
        .first();

      if (!entry) {
        res.status(404).json({ error: 'User-media entry not found' });
        return;
      }

      // Delete entry
      await db('user_media').where({ id: parseInt(id) }).del();

      res.status(204).send();

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;