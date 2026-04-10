import type { Context } from "hono";
import pool from "../config/db.js";
import type { UserModel, CreateUserModel } from "../models/user.model.js";
import type { ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function getAllUsers(context: Context) {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT user_id, name, email, position, created_date FROM users ORDER BY user_id DESC`
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

    if (!body.name || !body.email || !body.password) {
      return context.json({ message: "Name, email, and password are required" }, 400);
    }

    // Check if email already exists
    const [existing] = await pool.query<any[]>(
      `SELECT user_id FROM users WHERE email = ?`, [body.email]
    );
    if ((existing as any[]).length > 0) {
      return context.json({ message: "Email already registered" }, 409);
    }

    const hashedPassword = await bcrypt.hash(body.password, SALT_ROUNDS);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (name, email, position, password) VALUES (?, ?, ?, ?)`,
      [body.name, body.email, body.position ?? '', hashedPassword]
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
    const body: Partial<CreateUserModel> & { password?: string } = await context.req.json();

    if (body.password) {
      // If a new password was provided, hash it
      const hashedPassword = await bcrypt.hash(body.password, SALT_ROUNDS);
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE users SET name = ?, email = ?, position = ?, password = ? WHERE user_id = ?`,
        [body.name, body.email, body.position, hashedPassword, id]
      );
      if (result.affectedRows > 0) return context.json({ message: "User updated" }, 200);
    } else {
      // Keep existing password unchanged
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE users SET name = ?, email = ?, position = ? WHERE user_id = ?`,
        [body.name, body.email, body.position, id]
      );
      if (result.affectedRows > 0) return context.json({ message: "User updated" }, 200);
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

/** Called by the admin login form — verifies email + password */
export async function loginUser(context: Context) {
  try {
    const { email, password } = await context.req.json();

    if (!email || !password) {
      return context.json({ message: "Email and password are required" }, 400);
    }

    const [rows] = await pool.query<any[]>(
      `SELECT user_id, name, email, position, password FROM users WHERE email = ?`,
      [email]
    );

    const user = (rows as any[])[0];
    if (!user) {
      return context.json({ message: "Invalid email or password" }, 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return context.json({ message: "Invalid email or password" }, 401);
    }

    // Return safe user info (no password)
    return context.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        position: user.position,
      }
    }, 200);
  } catch (error: any) {
    console.error('[loginUser Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}

export async function getDashboardStats(context: Context) {
  try {
    const [[{ visitorsToday }]] = await pool.query<any[]>(
      `SELECT COUNT(*) as visitorsToday FROM visitor WHERE DATE(date_time_in) = CURDATE()`
    );

    const [[{ activeVisitors }]] = await pool.query<any[]>(
      `SELECT COUNT(*) as activeVisitors FROM visitor WHERE date_time_out IS NULL AND DATE(date_time_in) = CURDATE()`
    );

    const [[{ totalRecords }]] = await pool.query<any[]>(
      `SELECT COUNT(*) as totalRecords FROM visitor`
    );

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
