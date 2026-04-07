import type { RowDataPacket } from "mysql2";

export interface VisitorModel extends RowDataPacket {
  visitor_id: number;
  visitor_name: string;
  date_time_in: Date;
  date_time_out: Date;
  photo: string;
  purpose: string;
  campus_name: string;
  staff_name: string;
}

export interface CreateVisitorModel {
  visitor_name: string;
   date_time_in: string;
     date_time_out?: string | null;
  photo: string;
  purpose: string;
  campus_id: number;
  userID: number;
}