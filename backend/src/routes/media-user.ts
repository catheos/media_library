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
      const page = parseInt(req.query.page as string) || 1;
      const page_size = parseInt(process.env.MEDIA_USER_PAGE_SIZE || '20');
      const offset = (page - 1) * page_size;
      const user_id = req.user!.user_id;
      
      // Extract search filters from query params
      const { 
        // Media filters (inclusion)
        title,
        type,
        status,
        year,
        year_gt,
        year_lt,
        
        // Media filters (exclusion)
        exclude_title,
        exclude_type,
        exclude_status,
        exclude_year,
        exclude_year_gt,
        exclude_year_lt,
        
        // User-specific filters (inclusion)
        user_status,
        user_score,
        user_score_gt,
        user_score_lt,
        
        // User-specific filters (exclusion)
        exclude_user_status,
        
        sort,
        order
      } = req.query;

      // Build base query
      let query = db('user_media')
        .where('user_media.user_id', user_id)
        .join('media', 'user_media.media_id', 'media.id')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .leftJoin('user_media_status_types', 'user_media.status_id', 'user_media_status_types.id');

      // ----- Title Filters (OR logic for inclusion) ----- //
      if (title) {
        const titles = (title as string).split(',');
        if (titles.length === 1) {
          query = query.where('media.title', 'like', `%${titles[0]}%`);
        } else {
          query = query.where(function(this: any) {
            titles.forEach((t, index) => {
              if (index === 0) {
                this.where('media.title', 'like', `%${t}%`);
              } else {
                this.orWhere('media.title', 'like', `%${t}%`);
              }
            });
          });
        }
      }

      // Title Exclusions (AND logic - exclude all)
      if (exclude_title) {
        const excludeTitles = (exclude_title as string).split(',');
        excludeTitles.forEach(t => {
          query = query.whereNot('media.title', 'like', `%${t}%`);
        });
      }

      // ----- Type Filters (OR logic for inclusion) ----- //
      if (type) {
        const types = (type as string).split(',');
        if (types.length === 1) {
          query = query.where('media_types.name', types[0]);
        } else {
          query = query.whereIn('media_types.name', types);
        }
      }

      // Type Exclusions (AND logic - exclude all)
      if (exclude_type) {
        const excludeTypes = (exclude_type as string).split(',');
        query = query.whereNotIn('media_types.name', excludeTypes);
      }

      // ----- Status Filters (OR logic for inclusion) ----- //
      if (status) {
        const statuses = (status as string).split(',');
        if (statuses.length === 1) {
          query = query.where('media_status_types.name', statuses[0]);
        } else {
          query = query.whereIn('media_status_types.name', statuses);
        }
      }

      // Status Exclusions (AND logic - exclude all)
      if (exclude_status) {
        const excludeStatuses = (exclude_status as string).split(',');
        query = query.whereNotIn('media_status_types.name', excludeStatuses);
      }

      // ----- Year Filters ----- //
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

      // Year Exclusions
      if (exclude_year) {
        query = query.whereNot('media.release_year', parseInt(exclude_year as string));
      }
      if (exclude_year_gt) {
        query = query.whereNot('media.release_year', '>', parseInt(exclude_year_gt as string));
      }
      if (exclude_year_lt) {
        query = query.whereNot('media.release_year', '<', parseInt(exclude_year_lt as string));
      }

      // ----- User Status Filters (OR logic for inclusion) ----- //
      if (user_status) {
        const userStatuses = (user_status as string).split(',');
        if (userStatuses.length === 1) {
          query = query.where('user_media_status_types.name', userStatuses[0]);
        } else {
          query = query.whereIn('user_media_status_types.name', userStatuses);
        }
      }

      // User Status Exclusions (AND logic - exclude all)
      if (exclude_user_status) {
        const excludeUserStatuses = (exclude_user_status as string).split(',');
        query = query.where(function(this: any) {
          excludeUserStatuses.forEach(status => {
            // Exclude both the status AND null values
            this.where(function(this: any) {
              this.whereNot('user_media_status_types.name', status)
                .orWhereNull('user_media_status_types.name');
            });
          });
        });
      }

      // ----- User Score Filters ----- //
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
      const total_pages = Math.ceil(total / page_size);

      // Determine sort column and order
      const sortColumn = (() => {
        switch (sort as string) {
          case 'title':
            return 'media.title';
          case 'release_year':
            return 'media.release_year';
          case 'user_score':
            return 'user_media.score';
          case 'progress_updated':
            return 'user_media.progress_updated';
          case 'created_at':
            return 'user_media.created_at';
          default:
            return 'user_media.created_at';
        }
      })();

      const sortOrder = (order === 'asc' || order === 'desc') ? order : 'desc';

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
        .orderBy(sortColumn, sortOrder)
        .orderBy('user_media.id', 'asc')
        .limit(page_size)
        .offset(offset)

      // Format response
      const user_media = user_media_entries.map((entry: any) => ({
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
        user_media,
        total,
        page,
        page_size,
        total_pages
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

// Add this route BEFORE the "/:id" route
router.route("/autocomplete")
  .get(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { key, query, limit = '5' } = req.query;

      if (!key || !query) {
        return res.status(400).json({ error: 'Missing required parameters: key, query' });
      }

      // Cap limit to prevent abuse (max 20 results)
      const requestedLimit = parseInt(limit as string);
      const searchLimit = Math.min(requestedLimit, 20);

      let results: { value: string; count?: number }[] = [];

      switch (key) {
        case 'title':
          // Search titles in user's library
          const titles = await db('user_media')
            .join('media', 'user_media.media_id', 'media.id')
            .select('media.title as value')
            .where('user_media.user_id', user_id)
            .where('media.title', 'like', `%${query}%`)
            .groupBy('media.title')
            .limit(searchLimit)
            .orderBy('media.title', 'asc');
          
          results = titles;
          break;

        case 'type':
          // Search media types in user's library
          const types = await db('media_types')
            .select('media_types.name as value')
            .count('user_media.id as count')
            .join('media', 'media.type_id', 'media_types.id')
            .join('user_media', function(this: any) {
              this.on('user_media.media_id', '=', 'media.id')
                  .andOn('user_media.user_id', '=', db.raw('?', [user_id]))
            })
            .where('media_types.name', 'like', `%${query}%`)
            .groupBy('media_types.id', 'media_types.name')
            .limit(searchLimit)
            .orderBy('count', 'desc');
          
          results = types.map((t: any) => ({
            value: t.value,
            count: parseInt(t.count as string)
          }));
          break;

        case 'status':
          // Search media statuses in user's library
          const statuses = await db('media_status_types')
            .select('media_status_types.name as value')
            .count('user_media.id as count')
            .join('media', 'media.status_id', 'media_status_types.id')
            .join('user_media', function(this: any) {
              this.on('user_media.media_id', '=', 'media.id')
                  .andOn('user_media.user_id', '=', db.raw('?', [user_id]))
            })
            .where('media_status_types.name', 'like', `%${query}%`)
            .groupBy('media_status_types.id', 'media_status_types.name')
            .limit(searchLimit)
            .orderBy('count', 'desc');
          
          results = statuses.map((s: any) => ({
            value: s.value,
            count: parseInt(s.count as string)
          }));
          break;

        case 'user_status':
          // Search user's watch statuses
          const userStatuses = await db('user_media_status_types')
            .select('user_media_status_types.name as value')
            .count('user_media.id as count')
            .join('user_media', function(this: any) {
              this.on('user_media.status_id', '=', 'user_media_status_types.id')
                  .andOn('user_media.user_id', '=', db.raw('?', [user_id]))
            })
            .where('user_media_status_types.name', 'like', `%${query}%`)
            .groupBy('user_media_status_types.id', 'user_media_status_types.name')
            .limit(searchLimit)
            .orderBy('count', 'desc');
          
          results = userStatuses.map((s: any) => ({
            value: s.value,
            count: parseInt(s.count as string)
          }));
          break;

        case 'tag':
          // Search tags for media in user's library
          const tags = await db('tags')
            .select('tags.name as value')
            .count('user_media.id as count')
            .join('media_tags', 'media_tags.tag_id', 'tags.id')
            .join('user_media', function(this: any) {
              this.on('user_media.media_id', '=', 'media_tags.media_id')
                  .andOn('user_media.user_id', '=', db.raw('?', [user_id]))
            })
            .where('tags.name', 'like', `%${query}%`)
            .groupBy('tags.id', 'tags.name')
            .limit(searchLimit)
            .orderBy('count', 'desc');
          
          results = tags.map((t: any) => ({
            value: t.value,
            count: parseInt(t.count as string)
          }));
          break;

        default:
          // For unknown keys or numeric fields (year, score, user_score), return empty
          results = [];
      }

      res.json(results);
    } catch (error: any) {
      console.error('Autocomplete error:', error);
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