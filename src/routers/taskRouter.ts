import { Router } from 'express';
const TaskRouter = Router({ mergeParams: true });
import { addTask, getProjectTasks, getTask, modifyTask, removeTask } from '../controllers/taskController.js';
import { CommentRouter } from './commentRouter.js';
import { TaskTagRouter } from './taskTagRouter.js';

TaskRouter.route('/')
    .post(addTask)
    .get(getProjectTasks);

TaskRouter.route('/:taskId')
    .get(getTask)
    .patch(modifyTask)
    .delete(removeTask);
    

TaskRouter.use('/:taskId/comments',CommentRouter);
TaskRouter.use('/:taskId/tags',TaskTagRouter);















export { TaskRouter };