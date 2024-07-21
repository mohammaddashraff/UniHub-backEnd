const { createPostService, editPostService, deletePostService, 
    listPostsByCourseIdService, listAllPostsService, listRecentAnnouncementsService, filterPostsByTagService } = require('../Services/postService')
const jwt = require('../Utils/jwt');

const createPost = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    const postData = req.body;
    const courseId = req.params.courseId;

    createPostService(postData, courseId, token, (result, error) => {
        if (error) {
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        return res.status(result.status).json({ result });
    });
};


const editPost = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const postId = req.params.postId;
    const newContent = req.body.newContent;

    editPostService(newContent, postId, token, (err, result) => {
        if (err) {
            console.error('Error in editPostService:', err.message);
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(200).json(result);
        }
    });
};
const deletePost = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { postId } = req.params;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }
    
    deletePostService(postId, token, (error, message) => {
        if (error) {
            if (error.message === 'Post not found or not authorized to delete') {
                return res.status(403).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to delete post', details: error.details });
        } else {
            return res.status(200).json({ message });
        }
    });
};
const listPostsByCourseId = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const { courseId } = req.params;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    listPostsByCourseIdService(courseId, token, (results, error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to list posts', details: error.message });
        } else {
            res.status(200).json({ posts: results });
        }
    });
};

const listAllPosts = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    listAllPostsService(token, (results, error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to list posts', details: error.message });
        } else {
            res.status(200).json({ posts: results });
        }
    });
};

const listRecentAnnouncements = (req, res) => {
    listRecentAnnouncementsService((results, error) => {
        if (error) {
            console.error(error.message);
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        return res.status(200).json(results);
    });
};

const filterPostsByTag = (req, res) => {
    const { tag, courseId } = req.params;

    if (!tag || !courseId) {
        return res.status(400).json({ error: 'Tag and courseId not provided' });
    }

    filterPostsByTagService(tag, courseId, (result, error) => {
        if (error) {
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        return res.status(result.status).json({ posts: result.posts });
    });
};

module.exports = {
    createPost,
    editPost,
    deletePost,
    listPostsByCourseId,
    listAllPosts,
    listRecentAnnouncements,
    filterPostsByTag
};
