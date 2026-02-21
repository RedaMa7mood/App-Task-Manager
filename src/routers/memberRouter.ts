import {Router} from 'express';
const MemberRouter=Router({mergeParams:true});
import { getAllProjectMembers, updateProjectMember, deleteProjectMember,addProjectMember,getProjectMember } from '../controllers/porjectMemberController.js';
import {checkProjectMember}  from '../middlewares/checkMember.js';
MemberRouter.get('/',getAllProjectMembers)
MemberRouter.route('/members')
                    .get(checkProjectMember,getProjectMember)
                    .post(checkProjectMember,addProjectMember)
                    .put(checkProjectMember,updateProjectMember)
                    .delete(checkProjectMember,deleteProjectMember);
            
export {MemberRouter};