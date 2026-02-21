import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import userRouter from './routers/userRouter.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

import { ProjectRouter } from './routers/projectRouter.js';
import { TaskRouter } from './routers/taskRouter.js';
import { NotFound,globalError } from './Utilies/ErrorHandler.js';
import logger from './Utilies/logger.js';
import {rateLimit} from 'express-rate-limit'
import hpp from 'hpp';
app.use(express.static('public'));
app.use(hpp())
app.use(express.json({limit:'20kb'}));//middleware for parsing application/json
app.use(cookieParser());//middleware for parsing cookies
app.use(compression());//middleware for compressing response bodies


const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	
})

// Apply the rate limiting middleware to all requests.
app.use('/api',limiter)

app.use('/api/v1/projects',ProjectRouter)
app.use('/api/v1/tasks',TaskRouter)
app.use('/api/v1/users',userRouter)

app.use(NotFound)
app.use(globalError)
export default app;



