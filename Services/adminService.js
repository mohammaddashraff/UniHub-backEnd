const db = require('../Utils/db');
const jwt = require('../Utils/jwt');

const createCourseService = (courseData, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback({ message: 'Token verification failed', status: 401 });
            return;
        }

        const userId = decoded.id;

        // Query to get user role
        const roleQuery = 'SELECT userType FROM user WHERE userID = ?';
        db.query(roleQuery, [userId], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                callback({ message: 'Database query error', status: 500 });
                return;
            }

            if (result.length === 0) {
                callback({ message: 'User not found', status: 404 });
                return;
            }
            
            const userRole = result[0].userType;
            // Check if the user is an admin
            if (userRole !== 'admin') {
                callback({ message: 'Unauthorized: Only admins can create courses', status: 403 });
                return;
            }

            const { courseName, courseDesc, instructorId, creditHours, courseCode, passKey } = courseData;
            const query = 'INSERT INTO course (courseName, courseDesc, instructorId, credtHours, courseCode, passKey) VALUES (?, ?, ?, ?, ?, ?)';

            db.query(query, [courseName, courseDesc, instructorId, creditHours, courseCode, passKey], (err, res) => {
                if (err) {
                    console.error('Database query error:', err);
                    callback({ message: 'Database query error', status: 500 });
                } else {
                    const courseId = res.insertId; // Get the ID of the newly inserted course
                    callback(null, { message: 'Course created successfully',courseId, status: 201 });
                }
            });
        });
    });
};

const deleteCourseService = (courseCode, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback({ message: 'Token verification failed', status: 401 });
            return;
        }

        const userId = decoded.id;

        // Query to get user role
        const roleQuery = 'SELECT userType FROM user WHERE userID = ?';
        db.query(roleQuery, [userId], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                callback({ message: 'Database query error', status: 500 });
                return;
            }

            if (result.length === 0) {
                callback({ message: 'User not found', status: 404 });
                return;
            }

            const userRole = result[0].userType;

            // Check if the user is an admin
            if (userRole !== 'admin') {
                callback({ message: 'Unauthorized: Only admins can delete courses', status: 403 });
                return;
            }

            const query = 'DELETE FROM course WHERE courseCode = ?';
            db.query(query, [courseCode], (err, res) => {
                if (err) {
                    console.error('Database query error:', err);
                    callback({ message: 'Database query error', status: 500 });
                } else {
                    callback(null, { message: 'Course deleted successfully', status: 200 });
                }
            });
        });
    });
};

const editCourseService = (courseId, courseData, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback({ message: 'Token verification failed', status: 401 });
            return;
        }

        const userId = decoded.id;

        // Query to get user role
        const roleQuery = 'SELECT userType FROM user WHERE userID = ?';
        db.query(roleQuery, [userId], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                callback({ message: 'Database query error', status: 500 });
                return;
            }

            if (result.length === 0) {
                callback({ message: 'User not found', status: 404 });
                return;
            }

            const userRole = result[0].userType;
            // Check if the user is an admin
            if (userRole !== 'admin') {
                callback({ message: 'Unauthorized: Only admins can edit courses', status: 403 });
                return;
            }

            const { courseName, courseDesc, instructorId, creditHours } = courseData;
            const query = 'UPDATE course SET courseName = ?, courseDesc = ?, instructorId = ?, credtHours = ? WHERE courseId = ?';
            db.query(query, [courseName, courseDesc, instructorId, creditHours, courseId], (err, res) => {
                if (err) {
                    console.error('Database query error:', err);
                    callback({ message: 'Database query error', status: 500 });
                } else {
                    callback(null, { message: 'Course data updated successfully', status: 200 });
                }
            });
        });
    });
};

const listAllUsersService = (token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback({ message: 'Token verification failed', status: 401 });
        }
        
        const userId = decoded.id;

        // Query to get the user role
        const roleQuery = 'SELECT userType FROM user WHERE userId = ?';
        db.query(roleQuery, [userId], (err, result) => {
            if (err) {
                return callback(null, { message: 'Failed to fetch user role', details: err, status: 500 });
            }

            const userRole = result[0].userType;

            if (userRole !== 'admin') {
                return callback({ message: 'Unauthorized access', status: 403 });
            }

            const query = 'SELECT * FROM user';
            db.query(query, (err, results) => {
                if (err) {
                    return callback(null, { message: 'Database query failed', details: err, status: 500 });
                }
                callback({ users: results, status: 200 }, null);
            });
        });
    });
};

const deleteUserService = (adminToken, userIdToDelete, callback) => {
    jwt.verify(adminToken, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback({ message: 'Invalid token', status: 401 }, null);
        }

        const adminId = decoded.id;

        // Check if the calling user is an admin
        const adminRoleQuery = 'SELECT userType FROM user WHERE userID = ?';
        db.query(adminRoleQuery, [adminId], (err, result) => {
            if (err) {
                return callback({ message: 'Database query failed', details: err, status: 500 }, null);
            }

            const adminUserType = result[0]?.userType;

            if (adminUserType !== 'admin') {
                return callback({ message: 'Unauthorized: Only admins can delete users', status: 403 }, null);
            }

            // Queries to delete associated data
            const deleteQueries = [
                'DELETE FROM posts WHERE userId = ?',
                'DELETE FROM comment WHERE userId = ?',
                'DELETE FROM vote WHERE userId = ?',
                'DELETE FROM tasks WHERE userId = ?',
                'DELETE FROM material WHERE userId = ?',
                'DELETE FROM registeredCourses WHERE userId = ?',
                'DELETE FROM course_rating WHERE userId = ?'
            ];

            const deleteUserQuery = 'DELETE FROM user WHERE userID = ?';

            // Execute all delete queries in sequence
            const executeDeleteQueries = async () => {
                try {
                    for (const query of deleteQueries) {
                        await new Promise((resolve, reject) => {
                            db.query(query, [userIdToDelete], (err, result) => {
                                if (err) {
                                    reject({ message: 'Failed to delete associated data', details: err, status: 500 });
                                } else {
                                    resolve(result);
                                }
                            });
                        });
                    }

                    // Finally, delete the user
                    db.query(deleteUserQuery, [userIdToDelete], (err, result) => {
                        if (err) {
                            return callback({ message: 'Failed to delete user', details: err, status: 500 }, null);
                        }
                        if (result.affectedRows === 0) {
                            return callback({ message: 'User not found', status: 404 }, null);
                        }
                        callback(null, { message: 'User and associated data deleted successfully', status: 200 });
                    });
                } catch (error) {
                    callback(error, null);
                }
            };

            executeDeleteQueries();
        });
    });
};

module.exports = {
    createCourseService,
    deleteCourseService,
    editCourseService,
    listAllUsersService,
    deleteUserService
};