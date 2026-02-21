import { Router } from "express";
const ProjectRouter = Router();
import { addProject,getMyProjects,modifyProject,removeProject } from "../controllers/projectController.js";
import { TaskRouter } from "./taskRouter.js";
import { MemberRouter } from "./memberRouter.js";

ProjectRouter.route("/user/:ownerId")
            .get(getMyProjects)
            .post(addProject);

ProjectRouter.route("/user/:projectId")
            .put(modifyProject)
            .delete(removeProject);

ProjectRouter.use("/:projectId/tasks",TaskRouter); 

ProjectRouter.use("/:projectId/members",MemberRouter);

export { ProjectRouter };