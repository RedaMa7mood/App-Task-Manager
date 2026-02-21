import { Router } from "express";
const TaskTagRouter = Router();
import { addTaskTagController, getTaskTagsController, getTagTasksController, removeTaskTagController } from "../controllers/taskTagController.js";

TaskTagRouter.route("/:tagId")
    .post(addTaskTagController)
    .get(getTaskTagsController)
    .delete(removeTaskTagController);

TaskTagRouter.route("/tag-tasks/:tagId")
    .get(getTagTasksController);


export { TaskTagRouter };
