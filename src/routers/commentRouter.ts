import {Router} from 'express';
const CommentRouter=Router({mergeParams:true});
import {createComment,updateComment,deleteComment,getCommnents} from '../controllers/commentController.js';

CommentRouter.route('/:commentId')
            .get(getCommnents)
            .post(createComment)
            .put(updateComment)
            .delete(deleteComment);

export {CommentRouter};

