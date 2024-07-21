const db = require('../Utils/db');
const jwt = require('../Utils/jwt');

const upVoteService = (postId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback({ message: 'Token verification failed', status: 401 });
            return;
        }

        const userId = decoded.id;

        // Check if the user has already voted on this post
        const checkVoteQuery = 'SELECT * FROM vote WHERE postId = ? AND userId = ?';
        db.query(checkVoteQuery, [postId, userId], (err, voteResult) => {
            if (err) {
                callback({ message: 'Database query error', status: 500 });
                return;
            }

            if (voteResult.length > 0) {
                // User has already voted, determine if it's an upvote or downvote
                const existingVoteType = voteResult[0].voteType;
                if (existingVoteType === 'upvote') {
                    callback({ message: 'User has already upvoted this post', status: 403 });
                } else {
                    // Update the existing vote to upvote
                    const updateVoteQuery = 'UPDATE vote SET voteType = \'upvote\' WHERE postId = ? AND userId = ?';
                    db.query(updateVoteQuery, [postId, userId], (err, updateResult) => {
                        if (err) {
                            callback({ message: 'Database query error', status: 500 });
                        } else {
                            callback(null, { message: 'Upvote added successfully', status: 200 });
                        }
                    });
                }
            } else {
                // User hasn't voted yet, insert a new upvote
                const insertVoteQuery = 'INSERT INTO vote (userId, postId, voteType) VALUES (?, ?, \'upvote\')';
                db.query(insertVoteQuery, [userId, postId], (err, insertResult) => {
                    if (err) {
                        callback({ message: 'Database query error', status: 500 });
                    } else {
                        callback(null, { message: 'Upvote added successfully', status: 200 });
                    }
                });
            }
        });
    });
};

const downVoteService = (postId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback({ message: 'Token verification failed', status: 401 });
            return;
        }

        const userId = decoded.id;

        // Check if the user has already voted on this post
        const checkVoteQuery = 'SELECT * FROM vote WHERE postId = ? AND userId = ?';
        db.query(checkVoteQuery, [postId, userId], (err, voteResult) => {
            if (err) {
                callback({ message: 'Database query error', status: 500 });
                return;
            }

            if (voteResult.length > 0) {
                // User has already voted, determine if it's an downvote or upvote
                const existingVoteType = voteResult[0].voteType;
                if (existingVoteType === 'downvote') {
                    callback({ message: 'User has already downvoted this post', status: 403 });
                } else {
                    // Update the existing vote to downvote
                    const updateVoteQuery = 'UPDATE vote SET voteType = \'downvote\' WHERE postId = ? AND userId = ?';
                    db.query(updateVoteQuery, [postId, userId], (err, updateResult) => {
                        if (err) {
                            callback({ message: 'Database query error', status: 500 });
                        } else {
                            callback(null, { message: 'Downpvote added successfully', status: 200 });
                        }
                    });
                }
            } else {
                // User hasn't voted yet, insert a new upvote
                const insertVoteQuery = 'INSERT INTO vote (userId, postId, voteType) VALUES (?, ?, \'downvote\')';
                db.query(insertVoteQuery, [userId, postId], (err, insertResult) => {
                    if (err) {
                        callback({ message: 'Database query error', status: 500 });
                    } else {
                        callback(null, { message: 'Downvote added successfully', status: 200 });
                    }
                });
            }
        });
    });
};

const getVoteCountsService = (postId, callback) => {
    const query = `
        SELECT 
            SUM(CASE WHEN voteType = 'upvote' THEN 1 ELSE 0 END) AS upvoteCount,
            SUM(CASE WHEN voteType = 'downvote' THEN 1 ELSE 0 END) AS downvoteCount
        FROM vote WHERE postId = ?;`;

    db.query(query, [postId], (err, results) => {
        if (err) {
            callback({ message: 'Database query error', status: 500 });
        } else {
            const upvoteCount = results[0].upvoteCount || 0;
            const downvoteCount = results[0].downvoteCount || 0;
            callback(null, { upvoteCount, downvoteCount, status: 200 });
        }
    });
};

const removeVoteService = (postId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback({ message: 'Token verification failed', status: 401 });
            return;
        }

        const userId = decoded.id;

        const deleteVoteQuery = 'DELETE FROM vote WHERE postId = ? AND userId = ?';
        db.query(deleteVoteQuery, [postId, userId], (err, result) => {
            if (err) {
                callback({ message: 'Database query error', status: 500 });
            } else {
                if (result.affectedRows > 0) {
                    callback(null, { message: 'Vote removed successfully', status: 200 });
                } else {
                    callback({ message: 'Vote not found', status: 404 });
                }
            }
        });
    });
};

module.exports = {
    upVoteService,
    downVoteService,
    getVoteCountsService,
    removeVoteService
}