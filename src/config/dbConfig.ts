import { config } from "dotenv";
import mongoose from "mongoose";

const connections: { [key: string]: mongoose.Connection } = {};

export const dbConnect = async (
  projectName: string
): Promise<mongoose.Connection> => {
  if (connections[projectName]) {
    return connections[projectName];
  }

  let dbURI = "";

  //Define database URIs based on the projectName
  switch (projectName) {
    case "folkekraft":
      dbURI = process.env.FOLKEKRAFT_DB_URI;
      break;
    default:
      throw new Error("Invalid project name");
  }

  const connection = await mongoose.connect(dbURI, {
    retryWrites: true,
    w: "majority",
  });

  connections[projectName] = mongoose.connection;
  return mongoose.connection;
};
