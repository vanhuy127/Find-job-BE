import cookieParser from "cookie-parser";
import express from "express";
import { rateLimit } from "express-rate-limit";
import userRouter from "@/routes/user";
import authRouter from "@/routes/auth";
import companyRouter from "./routes/company";
import provinceRouter from "./routes/province";
import jobRouter from "./routes/job";
import skillRouter from "./routes/skill";
import resumeRouter from "./routes/resume";

require("dotenv").config();

const cors = require("cors");
const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const PORT = process.env.PORT || 8000;

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   limit: 50, // each IP can make up to 10 requests per `windowsMs` (5 minutes)
//   standardHeaders: true, // add the `RateLimit-*` headers to the response
//   legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
// });

// app.use(limiter);

app.use(express.json());

app.use("/api/v1", userRouter);
app.use("/api/v1", authRouter);
app.use("/api/v1", companyRouter);
app.use("/api/v1", provinceRouter);
app.use("/api/v1", jobRouter);
app.use("/api/v1", skillRouter);
app.use("/api/v1", resumeRouter);

// const rateLimitErrorHandler: express.ErrorRequestHandler = (
//   err,
//   req,
//   res,
//   next
// ) => {
//   if (err && err.status === 429) {
//     res.status(429).json({
//       error: "Too many requests, please try again later.",
//     });
//   } else {
//     next(err);
//   }
// };

// app.use(rateLimitErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
