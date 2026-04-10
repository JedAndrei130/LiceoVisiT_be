import type { Context } from "hono";
import pool from "../config/db.js";
import type { CreateVisitorModel, VisitorModel } from "../models/visitor.model.js";
import type { ResultSetHeader } from "mysql2";

const toMysqlDatetime = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  // Use local time (not UTC) so stored datetimes reflect the Philippine timezone
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export async function getAllVisitors(context: Context) {
  try {
    const [rows] = await pool.query<VisitorModel[]>(`
      SELECT 
        v.visitor_id,
        v.visitor_name,
        v.date_time_in,
        v.date_time_out,
        v.photo,
        v.purpose,
        COALESCE(u.name, 'Unknown') AS staff_name,
        COALESCE(c.campus_name, 'Unknown') AS campus_name
      FROM visitor v
      LEFT JOIN users u ON v.userID = u.user_id
      LEFT JOIN campus c ON v.campus_id = c.campus_id
      ORDER BY v.date_time_in DESC
    `);

    return context.json(rows, 200);
  } catch (error: any) {
    console.error('[getAllVisitors Error]', error);
    return context.json({ message: 'Internal server error', detail: error?.message }, 500);
  }
}

export async function createVisitor(context: Context) {
  try {
    const body: CreateVisitorModel = await context.req.json();

    console.log('[createVisitor] Received body:', body);

    if (!body.visitor_name) {
      return context.json({ message: "Visitor name is required" }, 400);
    }


    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO visitor 
      (visitor_name, date_time_in, date_time_out, photo, purpose, campus_id, userID)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      body.visitor_name,
      toMysqlDatetime(body.date_time_in),
      toMysqlDatetime(body.date_time_out),
      body.photo ?? null,
      body.purpose,
      body.campus_id,
      body.userID
    ]);

    return context.json({ message: "Visitor added", id: result.insertId }, 201);

  } catch (error: any) {
    console.error('[createVisitor Error]', error);
    return context.json({ message: "Internal server error", detail: error?.message }, 500);
  }
}

export async function deleteVisitor(context: Context) {
  try {
    const id = context.req.param('id');

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM visitor WHERE visitor_id = ?`,
      [id]
    );

    if (result.affectedRows > 0) {
      return context.json({ message: "Visitor deleted" }, 200);
    }

    return context.json({ message: "Visitor not found" }, 404);

  } catch (error: any) {
    console.error('[deleteVisitor Error]', error);
    return context.json({ message: "Internal server error", detail: error?.message }, 500);
  }
}

export async function updateVisitor(context: Context) {
  try {
    const id = context.req.param('id');
    const body = await context.req.json();

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE visitor SET date_time_out = ? WHERE visitor_id = ?`,
      [toMysqlDatetime(body.date_time_out), id]
    );

    if (result.affectedRows > 0) {
      return context.json({ message: "Visitor updated" }, 200);
    }
    return context.json({ message: "Visitor not found" }, 404);

  } catch (error: any) {
    console.error('[updateVisitor Error]', error);
    return context.json({ message: "Internal server error", detail: error?.message }, 500);
  }
}