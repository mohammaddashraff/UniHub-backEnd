const db = require('../Utils/db');
const jwt = require('../Utils/jwt');

const createPostService = (postData, courseId, token, callback) => {
    console.log('Starting createPostService');
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return callback(null, { message: 'Invalid token', details: err.message, status: 401 });
        }
        
        const userId = decoded.id;
        const { postName, content, tag } = postData;

        if (!postName || !content || !courseId || !tag) {
            console.error('Missing required fields');
            return callback(null, { message: 'Missing required fields', status: 400 });
        }

        // Query to get the user role
        const roleQuery = 'SELECT userType FROM user WHERE userId = ?';
        db.query(roleQuery, [userId], (err, result) => {
            if (err) {
                console.error('Failed to fetch user role:', err);
                return callback(null, { message: 'Failed to fetch user role', details: err, status: 500 });
            }

            if (result.length === 0) {
                console.error('User not found');
                return callback(null, { message: 'User not found', status: 404 });
            }

            const userRole = result[0].userType;

            // Check if the user is allowed to use the "announcement" tag
            if (tag === 'announcement' && !['instructor', 'admin'].includes(userRole)) {
                console.error('Unauthorized to use the announcement tag');
                return callback(null, { message: 'Unauthorized to use the announcement tag', status: 403 });
            }

            const query = 'INSERT INTO posts (postName, content, userId, courseId, postDate, tag) VALUES (?, ?, ?, ?, NOW(), ?)';
            db.query(query, [postName, content, userId, courseId, tag], (err, res) => {
                if (err) {
                    console.error('Database query failed:', err);
                    return callback(null, { message: 'Database query failed', details: err, status: 500 });
                } else {
                    console.log('Post created successfully, postId:', res.insertId);
                    return callback({ message: 'Post created successfully', postId: res.insertId, status: 201 }, null);
                }
            });
        });
    });
};


const editPostService = (newContent, postId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            callback({ message: 'Token verification failed', status: 401 }, null);
            return;
        }

        const userId = decoded.id;
        const query = 'UPDATE posts SET content = ? WHERE postId = ? AND userId = ?';

        db.query(query, [newContent, postId, userId], (err, res) => {
            if (err) {
                console.error('Database query error:', err);
                callback({ message: 'Database query error', status: 500 }, null);
            } else if (res.affectedRows === 0) {
                callback({ message: 'Post not found or user unauthorized', status: 404 }, null);
            } else {
                callback(null, { message: 'Post edited successfully' });
            }
        });
    });
};

const deletePostService = (postId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback({ message: 'Invalid token', details: err.message }, null);
        }

        const userId = decoded.id;

        // Get the user type
        const getUserTypeQuery = 'SELECT userType FROM user WHERE userId = ?';
        db.query(getUserTypeQuery, [userId], (err, userTypeResult) => {
            if (err) {
                return callback({ message: 'Database query failed', details: err.message }, null);
            }

            if (userTypeResult.length === 0) {
                return callback({ message: 'User not found' }, null);
            }

            const userType = userTypeResult[0].userType;

            // Check if the post belongs to the user or if the user is an admin or instructor
            const checkQuery = 'SELECT * FROM posts WHERE postId = ? AND (userId = ? OR ? IN ("admin", "instructor"))';
            db.query(checkQuery, [postId, userId, userType], (err, results) => {
                if (err) {
                    return callback({ message: 'Database query failed', details: err.message }, null);
                }

                if (results.length === 0) {
                    return callback({ message: 'Post not found or not authorized to delete' }, null);
                }

                // If the post belongs to the user, proceed with deletion
                const deleteCommentsQuery = 'DELETE FROM comment WHERE postId = ?';
                db.query(deleteCommentsQuery, [postId], (err, res) => {
                    if (err) {
                        return callback({ message: 'Failed to delete comments', details: err.message }, null);
                    }

                    const deleteVotesQuery = 'DELETE FROM vote WHERE postId = ?';
                    db.query(deleteVotesQuery, [postId], (err, res) => {
                        if (err) {
                            return callback({ message: 'Failed to delete votes', details: err.message }, null);
                        }

                        const deletePostQuery = 'DELETE FROM posts WHERE postId = ?';
                        db.query(deletePostQuery, [postId], (err, res) => {
                            if (err) {
                                return callback({ message: 'Failed to delete post', details: err.message }, null);
                            }

                            return callback(null, 'Post, comments, and votes deleted successfully');
                        });
                    });
                });
            });
        });
    });
};

const listPostsByCourseIdService = (courseId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
        } else {
            const query = 'SELECT * FROM posts WHERE courseId = ?';
            db.query(query, [courseId], (err, results) => {
                if (err) {
                    callback(null, err);
                } else {
                    callback(results, null);
                }
            });
        }
    });
};

const listAllPostsService = (token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
        } else {
            const query = 'SELECT * FROM posts';
            db.query(query, (err, results) => {
                if (err) {
                    callback(null, err);
                } else {
                    callback(results, null);
                }
            });
        }
    });
};

const listRecentAnnouncementsService = (callback) => {
    const query = `
        SELECT p.postName, CONCAT(u.firstName, ' ', u.lastName) AS userName, u.userType, c.courseName, p.postDate
        FROM posts p
        JOIN user u ON p.userId = u.userID
        JOIN course c ON p.courseId = c.courseID
        WHERE p.tag = 'announcement'
        AND p.postDate >= CURDATE() - INTERVAL 14 DAY
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return callback(null, { message: 'Database query failed', details: err, status: 500 });
        }

        if (results.length === 0) {
            return callback(null, { message: 'No recent announcements found', status: 404 });
        }
        
        try {
            // Format the results
            const formattedResults = results.map(row => {
                if (!row.userName || !row.userType || !row.courseName || !row.postName) {
                    throw new Error('Invalid data format');
                }

                return {
                    message: `The ${row.userType} ${row.userName} posted in ${row.courseName} an announcement with title ${row.postName}`,
                    postDate: row.postDate ,
                    userType: row.userType
                };
            });

            callback(formattedResults, null);
        } catch (formattingError) {
            return callback(null, { message: 'Data formatting error', details: formattingError.message, status: 500 });
        }
    });
};

const filterPostsByTagService = (tag, courseId, callback) => {
    // First, check if the course exists
    const courseQuery = 'SELECT * FROM course WHERE courseID = ?';
    
    db.query(courseQuery, [courseId], (err, courseResult) => {
        if (err) {
            return callback(null, { message: 'Database query failed', details: err, status: 500 });
        }

        if (courseResult.length === 0) {
            return callback(null, { message: 'Course not found', status: 404 });
        }

        // If course exists, query posts with the given tag and courseId
        const postQuery = 'SELECT * FROM posts WHERE tag = ? AND courseId = ?';
        
        db.query(postQuery, [tag, courseId], (err, postResults) => {
            if (err) {
                return callback(null, { message: 'Database query failed', details: err, status: 500 });
            }
            callback({ posts: postResults, status: 200 }, null);
        });
    });
};

module.exports={
    createPostService,
    editPostService,
    deletePostService,
    listPostsByCourseIdService,
    listAllPostsService,
    listRecentAnnouncementsService,
    filterPostsByTagService
}