import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";
import { requireBody } from "../middleware/validateBody";
import { upload } from "../middleware/upload";
import { processImage } from "../middleware/upload";
import path from 'path';
import fs from 'fs';

// Define types
interface MediaDbRow {
  id: number;
  title: string;
  release_year: number | null;
  description: string | null;
  created_by: number;
  type_id: number;
  type_name: string;
  status_id: number;
  status_name: string;
  created_by_username: string;
}

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

router.route("/statuses")
  // GET media statuses
  .get(async(req: Request, res: Response) => {
    try {
      const media_status_types = await db('media_status_types')
        .select('*')
        .orderBy('name', 'asc');
      
      res.json(media_status_types)
    } catch(error: any) {
      res.status(500).json({ error: error.message })
    }
  })

router.route("/autocomplete")
  .get(async (req: Request, res: Response) => {
    try {
      const { key, query, context, limit = '5' } = req.query;

      if (!key || !query) {
        return res.status(400).json({ error: 'Missing required parameters: key, query' });
      }

      // Cap limit to requested or 20.
      const requestedLimit = parseInt(limit as string);
      const searchLimit = Math.min(requestedLimit, 20);

      let results: { value: string; count?: number }[] = [];

      switch (key) {
        case 'title':
          // Search media titles
          const titles = await db('media')
            .select('title as value')
            .where('title', 'like', `%${query}%`)
            .groupBy('title')
            .limit(searchLimit)
            .orderBy('title', 'asc');
          
          results = titles;
          break;

        case 'type':
          // Search media types
          const types = await db('media_types')
            .select('media_types.name as value')
            .count('media.id as count')
            .leftJoin('media', 'media.type_id', 'media_types.id')
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
          // Search media statuses
          const statuses = await db('media_status_types')
            .select('media_status_types.name as value')
            .count('media.id as count')
            .leftJoin('media', 'media.status_id', 'media_status_types.id')
            .where('media_status_types.name', 'like', `%${query}%`)
            .groupBy('media_status_types.id', 'media_status_types.name')
            .limit(searchLimit)
            .orderBy('count', 'desc');
          
          results = statuses.map((s: any) => ({
            value: s.value,
            count: parseInt(s.count as string)
          }));
          break;

        case 'tag':
          // Search tags
          const tags = await db('tags')
            .select('tags.name as value')
            .count('media_tags.media_id as count')
            .leftJoin('media_tags', 'media_tags.tag_id', 'tags.id')
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
          // For unknown keys, return empty results
          results = [];
      }

      res.json(results);
    } catch (error: any) {
      console.error('Autocomplete error:', error);
      res.status(500).json({ error: error.message });
    }
  });

router.route("/")
  .get(async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const page_size = parseInt(process.env.MEDIA_PAGE_SIZE || '20');
      const offset = (page - 1) * page_size;

      // Extract search filters from query params
      const { 
        title,
        exclude_title,
        year, 
        year_gt, 
        year_lt,
        exclude_year,
        exclude_year_gt,
        exclude_year_lt,
        type,
        exclude_type,
        status,
        exclude_status,
        sort,
        order
      } = req.query;

      // Build base query
      let query = db('media')
        .join('media_types', 'media.type_id', 'media_types.id')
        .join('media_status_types', 'media.status_id', 'media_status_types.id')
        .join('user', 'media.created_by', 'user.id');

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
        };
      };

      // Title Exclusions (AND logic - exclude all)
      if (exclude_title) {
        const excludeTitles = (exclude_title as string).split(',');
        excludeTitles.forEach(t => {
          query = query.whereNot('media.title', 'like', `%${t}%`);
        });
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
          case 'created_at':
            return 'media.created_at';
          default:
            return 'media.created_at';
        }
      })();

      const sortOrder = (order === 'asc' || order === 'desc') ? order : 'desc';

      // Get paginated media with filters
      const media_list = await query
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
        .limit(page_size)
        .offset(offset)
        .orderBy(sortColumn, sortOrder)
        .orderBy('media.id', 'asc');

      // Format response
      const media = media_list.map((media: MediaDbRow) => ({
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
      }));

      res.json({
        media,
        total,
        page,
        page_size,
        total_pages
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // POST new media
  .post(upload.single('image'), async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { title, type_id, release_year, status_id, description } = req.body;
      const image_file = req.file;

      // Validate required fields
      if (!title || !type_id || !status_id || !image_file) {
        res.status(400).json({ error: 'title, type_id, status_id, and image file are required' });
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

      // Process and save images with media_id
      try {
        await processImage({
          temp_path: image_file.path,
          id: parseInt(media_id),
          folder: 'media',
          generate_thumbnail: true
        });
        
        // Success
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

      } catch (imageError) {
        // delete media entry if image processing fails
        await db('media').where({ id: media_id }).del();
        throw new Error('failed to process image');
      }
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
  .patch(requireBody, async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;
      const { title, type_id, release_year, status_id, description } = req.body;
      
      // Check if anything was provided to update
      if (
        title === undefined && 
        type_id === undefined && 
        release_year === undefined && 
        status_id === undefined && 
        description === undefined
      ) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

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

      const updates: any = {};

      // Handle title update if provided
      if (title !== undefined) {
        if (!title || title.trim() === '') {
          res.status(400).json({ error: 'Title cannot be empty' });
          return;
        }
        updates.title = title;
      }

      // Handle type_id update if provided
      if (type_id !== undefined) {
        const media_type = await db('media_types').where({ id: type_id }).first();
        if (!media_type) {
          res.status(400).json({ error: 'Invalid type_id' });
          return;
        }
        updates.type_id = type_id;
      }

      // Handle release_year update if provided
      if (release_year !== undefined) {
        if (release_year !== null) {
          const year = parseInt(release_year);
          if (isNaN(year) || year < 1800 || year > 2100) {
            res.status(400).json({ error: 'Invalid release year' });
            return;
          }
          updates.release_year = year;
        } else {
          updates.release_year = null;
        }
      }

      // Handle status_id update if provided
      if (status_id !== undefined) {
        const media_status = await db('media_status_types').where({ id: status_id }).first();
        if (!media_status) {
          res.status(400).json({ error: 'Invalid status_id' });
          return;
        }
        updates.status_id = status_id;
      }

      // Handle description update if provided
      if (description !== undefined) {
        updates.description = description || null;
      }

      // Apply updates
      await db('media')
        .where({ id: parseInt(id) })
        .update(updates);

      // Get updated media data with joins
      const updated_media = await db('media')
        .select(
          'media.id',
          'media.title',
          'media.release_year',
          'media.description',
          'media.created_by',
          db.raw('json_object("id", media_types.id, "name", media_types.name) as type'),
          db.raw('json_object("id", media_status_types.id, "name", media_status_types.name) as status'),
          db.raw('json_object("id", user.id, "username", user.username) as created_by_user')
        )
        .leftJoin('media_types', 'media.type_id', 'media_types.id')
        .leftJoin('media_status_types', 'media.status_id', 'media_status_types.id')
        .leftJoin('user', 'media.created_by', 'user.id')
        .where({ 'media.id': parseInt(id) })
        .first();

      // Parse JSON fields
      const response_media = {
        ...updated_media,
        type: JSON.parse(updated_media.type),
        status: JSON.parse(updated_media.status),
        created_by: JSON.parse(updated_media.created_by_user)
      };
      delete response_media.created_by_user;

      res.json({
        message: 'Media updated successfully',
        media: response_media
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // DELETE single media by ID
  .delete(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;

      // Check if media exists
      const media = await db('media').where({ id: parseInt(id) }).first();
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      // Check if user owns this media
      if (media.created_by !== user_id) {
        res.status(403).json({ error: 'You can only delete media you created' });
        return;
      }

      // Remove cover file if exists
      const image_path = path.join(process.cwd(), 'uploads', 'media', `${id}.webp`);
      if (fs.existsSync(image_path)) {
        fs.unlinkSync(image_path);
      }

      // Remove media record
      await db('media').where({ id: parseInt(id) }).del();

      res.status(204).send();

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })

router.route("/:id/cover")
  // GET media cover
  .get(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const media = await db('media').where({ id: parseInt(id) }).first();
    if (!media) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    const image_path = path.join(process.cwd(), 'uploads', 'media', `${id}.webp`);
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
      const media = await db('media').where({ id: parseInt(id) }).first();
      if (!media) {
        res.status(404).json({ error: 'Media not found' });
        return;
      }

      if (media.created_by !== user_id) {
        res.status(403).json({ error: 'You can only edit media you created' });
        return;
      }

      // Process and replace images
      await processImage({
        temp_path: image_file.path,
        id: parseInt(id),
        folder: 'media',
        generate_thumbnail: true
      });

      res.json({ message: 'Cover updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

router.route("/:id/media-user/exists")
  .get(async(req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { id } = req.params;

      const media_user = await db('user_media')
        .where('user_media.user_id', user_id)
        .where('user_media.media_id', id)
        .select('id')
        .first()
      
      if(media_user) {
        res.status(200).json(media_user);
      } else {
        res.status(404).send();
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

module.exports = router;