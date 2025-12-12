import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";

router.route("/types")
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

module.exports = router;