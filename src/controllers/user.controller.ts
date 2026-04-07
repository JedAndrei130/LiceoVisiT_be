import type { Context } from "hono";
import pool from "../config/db.js";
import type { UserModel, CreateUserModel } from "../models/user.model.js";
import type { ResultSetHeader } from "mysql2";

export async function getAllUsers(context: Context) {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM users ORDER BY user_id DESC`
    );
    return context.json(rows, 200);
  } catch (error: any) {
    console.error('[getAllUsers Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}

export async function createUser(context: Context) {
  try {
    const body: CreateUserModel = await context.req.json();

    if (!body.name || !body.email) {
      return context.json({ message: "Name and email are required" }, 400);
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (name, email, position) VALUES (?, ?, ?)`,
      [body.name, body.email, body.position ?? '']
    );

    return context.json({ message: "User created", id: result.insertId }, 201);
  } catch (error: any) {
    console.error('[createUser Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}

export async function updateUser(context: Context) {
  try {
    const id = context.req.param('id');
    const body: Partial<CreateUserModel> = await context.req.json();

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE users SET name = ?, email = ?, position = ? WHERE user_id = ?`,
      [body.name, body.email, body.position, id]
    );

    if (result.affectedRows > 0) {
      return context.json({ message: "User updated" }, 200);
    }
    return context.json({ message: "User not found" }, 404);
  } catch (error: any) {
    console.error('[updateUser Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}

export async function deleteUser(context: Context) {
  try {
    const id = context.req.param('id');

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM users WHERE user_id = ?`,
      [id]
    );

    if (result.affectedRows > 0) {
      return context.json({ message: "User deleted" }, 200);
    }
    return context.json({ message: "User not found" }, 404);
  } catch (error: any) {
    console.error('[deleteUser Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}

export async function getDashboardStats(context: Context) {
  try {
    // Use MySQL CURDATE() — respects the local Windows machine timezone automatically
    const [[{ visitorsToday }]] = await pool.query<any[]>(
      `SELECT COUNT(*) as visitorsToday FROM visitor WHERE DATE(date_time_in) = CURDATE()`
    );

    const [[{ activeVisitors }]] = await pool.query<any[]>(
      `SELECT COUNT(*) as activeVisitors FROM visitor WHERE date_time_out IS NULL AND DATE(date_time_in) = CURDATE()`
    );

    const [[{ totalRecords }]] = await pool.query<any[]>(
      `SELECT COUNT(*) as totalRecords FROM visitor`
    );

    // LEFT JOIN so visitors show even if campus is missing
    const [recentVisits] = await pool.query<any[]>(`
      SELECT 
        v.visitor_id,
        v.visitor_name,
        v.date_time_in,
        v.date_time_out,
        v.purpose,
        COALESCE(c.campus_name, 'Unknown') AS campus_name
      FROM visitor v
      LEFT JOIN campus c ON v.campus_id = c.campus_id
      ORDER BY v.date_time_in DESC
      LIMIT 10
    `);

    return context.json({ visitorsToday, activeVisitors, totalRecords, recentVisits }, 200);
  } catch (error: any) {
    console.error('[getDashboardStats Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}

export async function getVisitorTrends(context: Context) {
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT
        DATE(date_time_in) AS visit_date,
        COUNT(*) AS count
      FROM visitor
      WHERE date_time_in >= CURDATE() - INTERVAL 6 DAY
      GROUP BY DATE(date_time_in)
      ORDER BY visit_date ASC
    `);
    return context.json(rows, 200);
  } catch (error: any) {
    console.error('[getVisitorTrends Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}

export async function getVisitPurpose(context: Context) {
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT
        COALESCE(NULLIF(TRIM(purpose), ''), 'Unspecified') AS purpose,
        COUNT(*) AS count
      FROM visitor
      GROUP BY COALESCE(NULLIF(TRIM(purpose), ''), 'Unspecified')
      ORDER BY count DESC
    `);
    return context.json(rows, 200);
  } catch (error: any) {
    console.error('[getVisitPurpose Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}
