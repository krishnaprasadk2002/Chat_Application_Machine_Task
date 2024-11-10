import mongoose, { Schema } from "mongoose";
import IUsers from "../../Entities/IUser";

const UsersSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String },
  password: { type: String },
  imageUrl: { type: String }, 
  status: { type: Boolean, default: false },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  selected: { type: Boolean, default: false }
},
{
  timestamps: true,
});

const Users = mongoose.model<IUsers>('Users', UsersSchema);
export default Users;