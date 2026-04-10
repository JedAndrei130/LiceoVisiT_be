import type { RowDataPacket } from "mysql2";

export interface UserModel extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  position: string;
  password: string;
  created_date: string;
}

export interface CreateUserModel {
  name: string;
  email: string;
  position: string;
  password: string;
}
