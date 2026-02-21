import { Router } from "express";
const TagRouter = Router();
import {createTag,getTag,updateTag,deleteTag} from '../controllers/tagController.js';

TagRouter.route('/')
    .post(createTag)
    .get(getTag);

TagRouter.route('/:tagId')
    .put(updateTag)
    .delete(deleteTag);

export { TagRouter };