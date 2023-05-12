import express, { Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import multer from "multer";
import { connect } from "./models/db/mongoose-connection";
import { IUser, UserModel } from "./models/db/user.db";
import { comparePassword, passwordHash } from "./auth/password-hash";
import { generateAuthToken } from "./auth/jwt";
import { authMiddleware } from "./auth/auth.middleware";
import apispec from "./jsdoc";
import {
  createBlog,
  deleteBlog,
  getBlogs,
  getOneBlog,
  updateOneBlog,
} from "./routes/blog";
import { existsSync, mkdirSync } from "fs";

const app = express();

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(multer().any());
app.use(express.json());
app.use("/uploads", express.static("src/uploads"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(apispec));

connect();

app.get("/", (_req: Request, res: Response) => {
  res.send("Application works!");
});

/**
 * @openapi
 * /sign-up:
 *   post:
 *     description: test api
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: email
 *                 example: username@gmail.com
 *               name:
 *                 type: string
 *                 description: name
 *                 example: myname
 *               password:
 *                 type: string
 *                 description: password
 *                 example: mypass
 *     responses:
 *       200:
 *         description: sign-up result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 done:
 *                   type: boolean
 *                   description: done
 */
app.post(
  "/sign-up",
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, password } = req.body;
    // check if user exists
    const userExists = await UserModel.findOne({ email: email });
    if (!!userExists) {
      return res.status(400).json({ message: "user_exists" });
    }

    // generate password hash
    const hash = passwordHash(password);
    const newUser: IUser = {
      email,
      name,
      password: hash,
    };
    const created = await UserModel.create(newUser);
    res.send({ done: true });
  }
);

/**
 * @openapi
 * /sign-in:
 *   post:
 *     description: test api
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: email
 *                 example: username@gmail.com
 *               password:
 *                 type: string
 *                 description: password
 *                 example: mypass
 *     responses:
 *       200:
 *         description: sign-up result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: jwt token
 */
app.post(
  "/sign-in",
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    // check if user exists
    const userExists = await UserModel.findOne({ email: email }).lean();
    if (!userExists) {
      return res.status(400).json({ message: "user_exists" });
    }

    // validate the password
    const validPassword = comparePassword(password, userExists!.password);
    if (!validPassword) {
      return res.status(400).send("wrong_data");
    }

    // generate the token
    const token = generateAuthToken(userExists!);

    res.send({ token });
  }
);

/**
 * @openapi
 * /blog:
 *   post:
 *     summary: Create blog
 *     description: Create one blog
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: text of blog
 *                 example: test
 *               files:
 *                 type: file
 *                 description: music.mp3
 *                 example: music.mp3
 *     responses:
 *       200:
 *         description: list of blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 done:
 *                   type: boolean
 *                   description: list
 */
app.post("/blog", authMiddleware, createBlog);

/**
 * @openapi
 * /blog/{blogId}:
 *   get:
 *     summary: Get a blog info
 *     parameters:
 *       - in: query
 *         name: blogId
 *         description: identifier of the blog
 *     responses:
 *       200:
 */
app.get("/blog/:id", getOneBlog);

/**
 * @openapi
 * /blog/{blogId}:
 *   put:
 *     summary: Update blog
 *     parameters:
 *       - in: query
 *         name: blogId
 *         description: identifier of the blog
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: text of blog
 *                 example: test
 *               files:
 *                 type: file
 *                 description: music.mp3
 *                 example: music.mp3
 *     responses:
 *       200:
 */
app.put("/blog/:id", authMiddleware, updateOneBlog);

/**
 * @openapi
 * /blog/{blogId}:
 *   delete:
 *     summary: Delete a blog
 *     parameters:
 *       - in: query
 *         name: blogId
 *         description: identifier of the blog
 *     responses:
 *       200:
 */
app.delete("/blog/:id", authMiddleware, deleteBlog);

/**
 * @openapi
 * /blog:
 *   get:
 *     summary: Get list of blogs
 *     description: get list of blogs with pagination
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: number
 *                 description: page
 *                 example: 1
 *     responses:
 *       200:
 *         description: list of blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: Array
 *                   description: list
 */
app.get("/blog", getBlogs);

app.listen(3000, () => {
  console.log("Application started on port 3000!");
});
