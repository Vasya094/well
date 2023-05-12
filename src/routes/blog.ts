import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { BlogModel, IBlog } from "../models/db/blog.db";

export const createBlog = async (req: Request, res: Response) => {
  const { message, tokenData } = req.body;

  const newBlog: IBlog = { message, author: tokenData._id };
  try {
    const files = req.files;
    if (Array.isArray(files) && files[0]) {
      const fileData = files[0];

      const fileName = fileData.originalname;

      let uniqueFileName = `${Date.now()}-${fileName}`;
      uniqueFileName = uniqueFileName.replace(/\s/g, "");
      const rootFolder = path.join(process.cwd());
      newBlog.mediaLink = `${req.headers.host}/uploads/${uniqueFileName}`;
      fs.writeFile(
        path.join(rootFolder, "/uploads/" + uniqueFileName),
        fileData.buffer,
        (err) => {
          if (err) {
            console.error(err);
          }
        }
      );
    }

    await BlogModel.create(newBlog);
    res.send({ done: true });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};

export const getBlogs = async (req: Request, res: Response) => {
  const { page } = req.body;

  try {
    const blogs = await BlogModel.find()
      .limit(20)
      .skip(20 * (page - 1));

    res.status(200).json({ data: blogs });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};

export const getOneBlog = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const blogInfo = await BlogModel.findById(id).populate("author").lean();

    res.status(200).json(blogInfo);
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tokenData } = req.body;

  try {
    const blogToDelete = await BlogModel.findById(id).populate("author").lean();
    // @ts-ignore
    if (blogToDelete?.author._id.toString() !== tokenData._id) {
      return res.status(405).send("not allowed");
    }

    await BlogModel.findByIdAndDelete(id);
    res.status(200).json({ done: true });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};

export const updateOneBlog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, tokenData } = req.body;

  try {
    const blogInfoToUpdate: IBlog = { message, author: tokenData._id };

    const blogToUpdate = await BlogModel.findById(id).populate("author").lean();
    // @ts-ignore
    if (blogToUpdate?.author._id.toString() !== tokenData._id) {
      return res.status(405).send("not allowed");
    }

    const files = req.files;
    if (Array.isArray(files) && files[0]) {
      const fileData = files[0];

      const nameOfOldFile = blogToUpdate?.mediaLink?.split("uploads")[1];
      const fileName = fileData.originalname;
      const rootFolder = path.join(process.cwd());

      fs.rmSync(path.join(rootFolder, "/uploads" + nameOfOldFile), {
        force: true,
      });

      let uniqueFileName = `${Date.now()}-${fileName}`;
      uniqueFileName = uniqueFileName.replace(/\s/g, "");
      blogInfoToUpdate.mediaLink = `${req.headers.host}/uploads/${uniqueFileName}`;
      fs.writeFile(
        path.join(rootFolder, "/uploads/" + uniqueFileName),
        fileData.buffer,
        (err) => {
          if (err) {
            console.error(err);
          }
        }
      );
    }

    await BlogModel.findByIdAndUpdate(id, blogInfoToUpdate);
    res.status(200).json({ done: true });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};
