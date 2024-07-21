const { addCommentService, editCommentService, deleteCommentService, listCommentsService,addCommentServiceForChatGpt } = require('../Services/commentService')

const addComment = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const postId = req.params.postId;
    const commentData = req.body;

    addCommentService(commentData, postId, token, (err, result) => {
        if (err) {
            console.error('Error in addCommentService:', err.message);
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(result.status).json({ message: result.message });
        }
    });
};

const editComment = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const commentId = req.params.commentId;
    const commentData = req.body;

    editCommentService(commentId, token, commentData, (err, result) => {
        if (err) {
            console.error('Error in editCommentService:', err.message);
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(result.status).json({ message: result.message });
        }
    });
};

const deleteComment = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const commentId = req.params.commentId;

    deleteCommentService(commentId, token, (err, result) => {
        if (err) {
            console.error('Error in deleteCommentService:', err.message);
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(result.status).json({ message: result.message });
        }
    });
};

const listComments = (req, res) => {
    const postId = req.params.postId;

    listCommentsService(postId, (err, results) => {
        if (err) {
            console.error('Error in listCommentsService:', err.message);
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(200).json(results);
        }
    });
};
const addCommentControllerGpt = (req, res) => {
    const { postId } = req.params;
    addCommentServiceForChatGpt(postId, (error, result) => {
        if (error) {
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        res.status(result.status).json({ message: result.message });
    });
};

module.exports = {
    addComment,
    editComment,
    deleteComment,
    listComments,
    addCommentControllerGpt
};
