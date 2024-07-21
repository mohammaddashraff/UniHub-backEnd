const db = require('../Utils/db');
const jwt = require('../Utils/jwt');
const {promises: fs} = require("fs");
const bucket = require("../Utils/firebaseConfig");
const path = require("path");
const sharp = require("sharp");
const fs2 = require("fs");


const uploadFileToFirebase = async (filePath, destination, mimetype) => {
    try {
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            new Error(`File not found at ${filePath}`);
        }
        // Upload file to Firebase Storage
        await bucket.upload(filePath, {
            destination,
            metadata: {
                contentType: mimetype,
            },
        });
        const file = bucket.file(destination);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491', // Set a long expiration date
        });
        return url;
    } catch (error) {
        console.error('Error uploading file to Firebase:', error);
        throw error; // Re-throw the error to propagate it up to the caller
    }
}
const getCoursePhotoService = (courseId, callback) => {
    const query = 'SELECT coursePhoto FROM course WHERE courseID = ?';
    db.query(query, [courseId], (err, res) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, res[0].coursePhoto);
        }
    });
};
const uploadCoursePhotoService = async (req) => {
    return new Promise(async (resolve, reject) => {
        const {courseId} = req.body;
        const filePath = path.join(__dirname, 'uploads', req.file.filename);
        const resizedFilePath = path.join(__dirname, 'uploads', `resized_${req.file.filename}`);
        try {
            // Resize the photo
            await sharp(filePath)
                .resize(400, 325)
                .toFile(resizedFilePath);

            console.log(`Resized file path: ${resizedFilePath}`);
            const destination = `coursePhotos/${courseId}/${req.file.filename}`;

            // Upload resized file to Firebase Storage
            const url = await uploadFileToFirebase(resizedFilePath, destination, req.file.mimetype);
            console.log(`Uploaded file URL: ${url}`);

            // Clean up local files
            if (fs2.existsSync(filePath)) {
                try {
                    await fs2.access(filePath, fs.constants.W_OK); // Check write permission
                    fs2.unlinkSync(filePath);
                } catch (unlinkError) {
                    console.error(`Error deleting original photo: ${unlinkError.message}`);
                }
            } else {
                console.error(`Original photo does not exist at path: ${filePath}`);
            }

            if (fs2.existsSync(resizedFilePath)) {
                try {
                    await fs2.access(resizedFilePath, fs.constants.W_OK); // Check write permission
                    fs2.unlinkSync(resizedFilePath);
                } catch (unlinkError) {
                    console.error(`Error deleting resized photo: ${unlinkError.message}`);
                }
            } else {
                console.error(`Resized photo does not exist at path: ${resizedFilePath}`);
            }

            // Insert file metadata into the database
            console.log(url,courseId);
            await db.execute(
                'UPDATE course SET coursePhoto = ? WHERE courseID = ?',
                [url, courseId]
            );

            resolve(url);
        } catch (error) {
            console.error(`Error during upload: ${error.message}`);
            reject(new Error('Error uploading photo'));
        }
    });
};



const listCoursesService = (callback) => {
    const query = 'SELECT * FROM course';
    db.query(query, (err, res) => {
        if (err) {
            callback(err, null);
        } else {
            if (res.length === 0) {
                callback(null, []); // No courses found
                return;
            }

            // Collect all instructorIds from the course results
            const instructorIds = res.map(course => course.instructorId);

            // Query to fetch all instructors' names based on instructorIds
            const instructorQuery = 'SELECT userID, CONCAT(firstName, " ", lastName) AS fullName FROM user WHERE userID IN (?)';
            db.query(instructorQuery, [instructorIds], (err, res2) => {
                if (err) {
                    callback(err, null);
                } else {
                    // Create a map of instructorId to fullName for quick lookup
                    const instructorMap = {};
                    res2.forEach(instructor => {
                        instructorMap[instructor.userID] = instructor.fullName;
                    });

                    // Modify the course rows to include fullName
                    const modifiedRes = res.map(course => {
                        course.fullName = instructorMap[course.instructorId];
                        return course;
                    });

                    callback(null, modifiedRes);
                }
            });
        }
    });
};

const listRegisteredCoursesService = (token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
            return;
        }
        const userId = decoded.id;
        const query = `
            SELECT course.*, CONCAT(u.firstName, " ", u.lastName) AS fullName
            FROM course
            INNER JOIN registeredCourses ON course.courseID = registeredCourses.courseID
            INNER JOIN user u ON course.instructorId = u.userID
            WHERE registeredCourses.userID = ? 
        `;
        db.query(query, [userId], (err, courses) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, courses);
            }
        });
    });
};


const registerInCourseService = (courseCode, passKey, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
            return;
        }
        const userId = decoded.id;

        // Check for course availability
        const checkCourseQuery = 'SELECT courseID, passKey FROM course WHERE courseCode = ?';
        db.query(checkCourseQuery, [courseCode], (err, res) => {
            if (err) {
                callback(err, null);
                return;
            }
            if (res.length === 0) {
                callback('Course not found', null);
                return;
            }
            const coursePassKey = res[0].passKey;
            const courseID = res[0].courseID;

            // Check if the student already registered
            const checkStudentQuery = 'SELECT * FROM registeredCourses WHERE userID = ? AND courseID = ?';
            db.query(checkStudentQuery, [userId, courseID], (err, res) => {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (res.length > 0) {
                    callback(null, 'User already registered in this course');
                    return; // Return without an error
                }
                console.log("passkey: ", passKey);
                console.log("coursePassKey: " ,coursePassKey);

                if (passKey === coursePassKey) {
                    // Register in course
                    const registerInCourseQuery = 'INSERT INTO registeredCourses (userID, courseID, courseStatus) VALUES (?, ?, 0)';
                    db.query(registerInCourseQuery, [userId, courseID], (err, res) => {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, 'Successfully registered in course');
                        }
                    });
                } else {
                    callback('Wrong pass Key', null);
                }
            });
        });
    });
};

const searchCourseService = (course, callback) => {
    const query = 
        `SELECT * FROM course
         WHERE courseName LIKE ? OR courseCode LIKE ?`;
    const searchPattern = `%${course}%`;
    db.query(query, [searchPattern, searchPattern], (err, courses) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, courses);
        }
    });
};
const showCourseDetailService = (courseID, callback) => {
    const query = `
        SELECT course.*, CONCAT(u.firstName, " ", u.lastName) AS fullName
        FROM course
        INNER JOIN user u ON course.instructorId = u.userID
        WHERE course.courseID = ?
    `;
    db.query(query, [courseID], (err, courses) => {
        if (err) {
            callback(err, null);
        } else {
            if (courses.length === 0) {
                callback('Course not found', null);
            } else {
                callback(null, courses[0]);
            }
        }
    });
};

/*
0-> active
1-> archived
*/

const getCourseStatusService = (courseId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
        } else {
            const userId = decoded.id;
            const query = 'SELECT courseStatus FROM registeredCourses WHERE userID = ? AND courseID = ?';
            db.execute(query, [userId, courseId], (err, res) => {
                if (err) {
                    callback(err, null);
                } else {
                    if (res.length > 0) {
                        callback(null, res[0].courseStatus);
                    } else {
                        callback(null, null);
                    }
                }
            });
        }
    });
};

const getUserCourseStatisticsService = (userId, callback) => {
    console.log(userId);

    const query = `
        SELECT 
            COUNT(*) AS totalCourses,
            SUM(CASE WHEN courseStatus = 1 THEN 1 ELSE 0 END) AS status1Count,
            SUM(CASE WHEN courseStatus = 0 THEN 1 ELSE 0 END) AS status0Count
        FROM registeredCourses
        WHERE userID = ?
    `;

    db.execute(query, [userId], (err, res) => {
        if (err) {
            callback(err, null);
        } else {
            if (res.length > 0) {
                const totalCourses = res[0].totalCourses;
                const status1Count = res[0].status1Count;
                const status0Count = res[0].status0Count;
                const status0Percentage = (totalCourses > 0) ? (status0Count / totalCourses) * 100 : 0;

                callback(null, {
                    totalCourses,
                    status1Count,
                    status0Count,
                    status0Percentage
                });
            } else {
                callback(null, {
                    totalCourses: 0,
                    status1Count: 0,
                    status0Count: 0,
                    status0Percentage: 0
                });
            }
        }
    });
};



const listInstructorCourseService = (token,callback)=>{
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
            return;
        }
        const userId = decoded.id;
        const query = 'select * from course where instructorId = ?'
        db.query(query,[userId],(err,res)=>{
            if(err){
                callback(err,null)
            }else{
                callback(null,res)
            }
        })
    })
}

const isUserRegisteredInCourseService = (courseId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback({ message: 'Token verification failed', status: 401 });
        }

        const userId = decoded.id;

        if (!courseId) {
            return callback({ message: 'Course ID is required', status: 400 });
        }

        console.log(courseId);
        console.log(userId);


        const query = 'SELECT * FROM registeredCourses WHERE courseId = ? AND userId = ?';
        db.query(query, [courseId, userId], (err, results) => {
            if (err) {
                return callback({ message: 'Database query failed', details: err.message, status: 500 });
            }

            if (results.length === 0) {
                return callback(null, { isRegistered: false });
            }

            callback(null, { isRegistered: true });
        });
    });
};

const courseRatingService = (courseId, rating, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback({ message: 'Token verification failed', status: 401 });
        }

        // Check if the rating is within a valid range (e.g., 1 to 5)
        if (rating < 1 || rating > 5) {
            return callback({ message: 'Rating must be between 1 and 5', status: 400 });
        }

        const userId = decoded.id;

        // Ensure the user is rating for themselves
        if (userId !== userId) {
            return callback({ message: 'Unauthorized: Cannot rate on behalf of another user', status: 403 });
        }

        // Check if the user has already rated this course
        const checkRatingQuery = 'SELECT * FROM course_rating WHERE userId = ? AND courseId = ?';
        db.query(checkRatingQuery, [userId, courseId], (err, result) => {
            if (err) {
                return callback({ message: 'Database query error', status: 500 });
            }

            if (result.length > 0) {
                // User has already rated, update the existing rating
                const updateRatingQuery = 'UPDATE course_rating SET rating = ? WHERE userId = ? AND courseId = ?';
                db.query(updateRatingQuery, [rating, userId, courseId], (err, updateResult) => {
                    if (err) {
                        return callback({ message: 'Database query error', status: 500 });
                    }
                    return callback(null, { message: 'Rating updated successfully', status: 200 });
                });
            } else {
                // User hasn't rated yet, insert a new rating
                const insertRatingQuery = 'INSERT INTO course_rating (userId, courseId, rating) VALUES (?, ?, ?)';
                db.query(insertRatingQuery, [userId, courseId, rating], (err, insertResult) => {
                    if (err) {
                        return callback({ message: 'Database query error', status: 500 });
                    }
                    return callback(null, { message: 'Rating added successfully', status: 201 });
                });
            }
        });
    });
};

const calculateCourseRatingService = (courseId, callback) => {
    const query = 'SELECT AVG(rating) AS averageRating FROM course_rating WHERE courseId = ?';
    db.query(query, [courseId], (err, result) => {
        if (err) {
            callback({ message: 'Database query error', status: 500 });
        } else {
            const averageRating = result[0].averageRating || 0; // Default to 0 if no ratings are found
            callback(null, { averageRating });
        }
    });
};

const listUserCourseRatingService = (courseId, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err);
            return callback(null, { message: 'Token verification failed', status: 401 });
        }

        const userId = decoded.id;

        // Query to fetch user's rating for the course
        const query = 'SELECT rating FROM course_rating WHERE userId = ? AND courseId = ?';
        
        db.query(query, [userId, courseId], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return callback(null, { message: 'Database query error', details: err, status: 500 });
            }

            if (results.length === 0) {
                console.log('User has not rated this course');
                return callback(null, { message: 'User has not rated this course', status: 404 });
            }

            const userRating = results[0].rating;
            console.log('User rating found:', userRating);
            callback({ rating: userRating, status: 200 }, null);
        });
    });
};
const searchInstructorCoursesService = (token, course, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback({ message: 'Invalid token', status: 401 }, null);
        }

        const instructorId = decoded.id;
        const searchPattern = `%${course}%`;

        const query = `
            SELECT * FROM course
            WHERE instructorId = ? AND (courseName LIKE ? OR courseCode LIKE ?)
        `;

        db.query(query, [instructorId, searchPattern, searchPattern], (err, courses) => {
            if (err) {
                return callback({ message: 'Database query failed', details: err, status: 500 }, null);
            }
            if (courses.length === 0) {
                return callback({ message: 'No courses found for this instructor with the given search criteria', status: 404 }, null);
            }
            callback({ courses, status: 200 }, null);
        });
    });
};

const listInstructorCoursesCountService = (token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback(null, { message: 'Invalid token', status: 401 });
        }

        const userId = decoded.id;
        
        const query = `
            SELECT COUNT(courseID) AS courseCount
            FROM course
            WHERE instructorId = ?
        `;

        db.query(query, [userId], (err, results) => {
            if (err) {
                return callback(null, { message: 'Database query failed', details: err, status: 500 });
            }
            callback({ courseCount: results[0].courseCount, status: 200 }, null);
        });
    });
};

const listInstructorUserCountService = (token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback(null, { message: 'Invalid token', status: 401 });
        }

        const userId = decoded.id;
        
        const query = `
            SELECT 
                COUNT(rc.userID) AS totalStudentCount
            FROM 
                course c
            LEFT JOIN 
                registeredcourses rc ON c.courseID = rc.courseID
            WHERE 
                c.instructorId = ?
        `;

        db.query(query, [userId], (err, results) => {
            if (err) {
                return callback(null, { message: 'Database query failed', details: err, status: 500 });
            }
            callback({ totalStudentCount: results[0].totalStudentCount, status: 200 }, null);
        });
    });
};
const archiveCourseService = (token, courseId, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback({ message: 'Token verification failed', status: 401 });
        }

        const userId = decoded.id;

        // Check if the user is registered for the course and has courseStatus = 0
        const checkCourseQuery = 'SELECT * FROM registeredCourses WHERE userID = ? AND courseID = ? AND courseStatus = 0';
        db.query(checkCourseQuery, [userId, courseId], (err, results) => {
            if (err) {
                return callback({ message: 'Database query error', status: 500 });
            }

            if (results.length === 0) {
                return callback({ message: 'User is not registered for this course or courseStatus is not 0', status: 403 });
            }

            // Update courseStatus to 1
            const updateCourseQuery = 'UPDATE registeredCourses SET courseStatus = 1 WHERE userID = ? AND courseID = ?';
            db.query(updateCourseQuery, [userId, courseId], (err, updateResult) => {
                if (err) {
                    return callback({ message: 'Failed to update course status', status: 500 });
                }

                callback({ message: 'Course status updated successfully', status: 200 });
            });
        });
    });
};
module.exports = {
    listCoursesService,
    listRegisteredCoursesService,
    registerInCourseService,
    searchCourseService,
    showCourseDetailService,
    getCourseStatusService,
    getUserCourseStatisticsService,
    listInstructorCourseService,
    isUserRegisteredInCourseService,
    courseRatingService,
    calculateCourseRatingService,
    listUserCourseRatingService,
    searchInstructorCoursesService,
    listInstructorCoursesCountService,
    listInstructorUserCountService,
    archiveCourseService,
    uploadCoursePhotoService,
    getCoursePhotoService
};
