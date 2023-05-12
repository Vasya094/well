import { model, Model, Schema } from "mongoose";

export interface IBlog {
  _id?: string;
  message: string;
  mediaLink?: string;
  author: Schema.Types.ObjectId;
}

const IBlogSchema = new Schema<IBlog>(
  {
    message: { type: String, required: true },
    mediaLink: { type: String, required: false },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
  },
  { collection: "blog", timestamps: true }
);

export const BlogModel: Model<IBlog> = model("blog", IBlogSchema);
