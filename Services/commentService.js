const db = require('../Utils/db');
const jwt = require('../Utils/jwt');
const {OpenAI} = require("openai");

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;


const addCommentServiceForChatGpt = (postId, callback) => {
    if (!openai) {
        callback({ message: 'OPENAI_API_KEY is not configured', status: 500 }, null);
        return;
    }

    db.execute('select content from posts where postId = ? ',[postId],async (err, res) => {
        if (err || !res.length) {
            callback({ message: 'Post not found', status: 404 }, null);
        } else {
            const postContent = res[0].content
            try {
                const response = await openai.chat.completions.create({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    messages: [{role: "user", content: postContent}],
                    max_tokens: 150,
                });
                const answer = response.choices[0].message.content.trim();
                const query = 'INSERT INTO comment (userID,postId, commentDate, commentBody) VALUES (?,?, NOW(), ?)';
                await db.execute(query,[125,postId,answer])
                callback(null, { message: 'Comment added successfully', status: 201 });
            } catch (error) {
                console.error('Error generating answer:', error);
                callback({ message: 'Failed to generate AI comment', status: 500, details: error.message }, null);
            }
        }

    })
};

const addCommentService = (commentData, postId, token, callback) => {
    jwt.verify(token, process.env.JWT_SECRET || 'unihubaammy', (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            callback({ message: 'Token verification failed', status: 401 }, null);
            return;
        }

        const userId = decoded.id;
        const { commentBody } = commentData;

        if (!commentBody) {
            console.error('Comment body is missing');
            callback({ message: 'Comment body is missing', status: 400 }, null);
            return;
        }

        const query = 'INSERT INTO comment (userId, postId, commentDate, commentBody) VALUES (?, ?, NOW(), ?)';

        db.query(query, [userId, postId, commentBody], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                callback({ message: 'Database query error', status: 500 }, null);
            } else {
                callback(null, { message: 'Comment added successfully', status: 201 });
            }
        });
    });
};

const editCommentService = (commentId, token, commentData, callback) => {
    if (!token) {
        console.error('Token not provided');
        return callback({ message: 'Authorization token not provided', status: 401 }, null);
    }

    jwt.verify(token, process.env.JWT_SECRET || 'unihubaammy', (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return callback({ message: 'Token verification failed', status: 401 }, null);
        }

        const userId = decoded.id;
        const { commentBody } = commentData;

        if (!commentBody) {
            console.error('Comment body is missing');
            return callback({ message: 'Comment body is missing', status: 400 }, null);
        }

        // Check if the user owns the comment
        const checkQuery = 'SELECT userId FROM comment WHERE commentId = ?';
        db.query(checkQuery, [commentId], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return callback({ message: 'Database query error', status: 500 }, null);
            }

            const comment = result[0];
            if (!comment) {
                console.error('Comment not found');
                return callback({ message: 'Comment not found', status: 404 }, null);
            }

            if (comment.userId !== userId) {
                console.error('Unauthorized to edit this comment');
                return callback({ message: 'Unauthorized to edit this comment', status: 403 }, null);
            }

            // Update the comment's content
            const updateQuery = 'UPDATE comment SET commentBody = ? WHERE commentId = ? AND userId = ?';
            db.query(updateQuery, [commentBody, commentId, userId], (err, result) => {
                if (err) {
                    console.error('Database query error:', err);
                    return callback({ message: 'Database query error', status: 500 }, null);
                }
                callback(null, { message: 'Comment updated successfully', status: 200 });
            });
        });
    });
};

const deleteCommentService = (commentId, token, callback) => {
    if (!token) {
        console.error('Token not provided');
        return callback({ message: 'Authorization token not provided', status: 401 }, null);
    }

    jwt.verify(token, process.env.JWT_SECRET || 'unihubaammy', (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return callback({ message: 'Token verification failed', status: 401 }, null);
        }

        const userId = decoded.id;

        // Check if the user owns the comment
        const checkQuery = 'SELECT userId FROM comment WHERE commentId = ?';
        db.query(checkQuery, [commentId], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return callback({ message: 'Database query error', status: 500 }, null);
            }

            const comment = result[0];
            if (!comment) {
                console.error('Comment not found');
                return callback({ message: 'Comment not found', status: 404 }, null);
            }

            if (comment.userId !== userId) {
                console.error('Unauthorized to delete this comment');
                return callback({ message: 'Unauthorized to delete this comment', status: 403 }, null);
            }

            // Delete the comment
            const deleteQuery = 'DELETE FROM comment WHERE commentId = ? AND userId = ?';
            db.query(deleteQuery, [commentId, userId], (err, result) => {
                if (err) {
                    console.error('Database query error:', err);
                    return callback({ message: 'Database query error', status: 500 }, null);
                }
                callback(null, { message: 'Comment deleted successfully', status: 200 });
            });
        });
    });
};

const listCommentsService = (postId, callback) => {
    const query = 'SELECT * FROM comment WHERE postId = ? ORDER BY commentDate DESC';
    db.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            callback({ message: 'Database query error', status: 500 }, null);
        } else {
            callback(null, results);
        }
    });
};

module.exports = {
    addCommentService,
    editCommentService,
    deleteCommentService,
    listCommentsService,
    addCommentServiceForChatGpt
};
