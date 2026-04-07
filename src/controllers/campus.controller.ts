import type { Context } from "hono";
import pool from "../config/db.js";

export async function getAllCampuses(context: Context) {
  try {
    const [rows] = await pool.query(
      `SELECT campus_id, campus_name FROM campus ORDER BY campus_id`
    );
    return context.json(rows, 200);
  } catch (error: any) {
    console.error('[getAllCampuses Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}
