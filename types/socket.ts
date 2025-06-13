import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: {
    server: {
      io: SocketIOServer;
    } & any;
  } & any;
}

export interface FieldUpdateData {
  formId: string;
  responseId: string;
  fieldId: string;
  value: string;
  userId: string;
}

export interface UserJoinedData {
  formId: string;
  userId: string;
  email: string;
}

export interface UserLeftData {
  formId: string;
  userId: string;
}