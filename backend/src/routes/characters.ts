import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";

router.route("/")
  .get(async(req: Request, res: Response) => {
    try {
      res.json({name: "test"})

    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

module.exports = router;