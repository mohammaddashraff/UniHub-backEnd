const { listCoursesService, listRegisteredCoursesService, registerInCourseService,
    searchCourseService, showCourseDetailService, getCourseStatusService,
    getUserCourseStatisticsService, listInstructorCourseService,
    isUserRegisteredInCourseService, courseRatingService, calculateCourseRatingService, listUserCourseRatingService 
    ,searchInstructorCoursesService,listInstructorCoursesCountService,listInstructorUserCountService,
    archiveCourseService,uploadCoursePhotoService , getCoursePhotoService} = require('../Services/courseService');
const jwt = require('../Utils/jwt');

const listCourses = (req, res) => {
   listCoursesService((err, courses) => {
       if (err) {
           console.log('Error listing courses:', err);
           res.status(500).json({ error: 'Internal server error' });
       } else {
           res.json(courses);
       }
   });
};

const registerInCourse = (req, res) => {
    const { courseCode, passKey } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    registerInCourseService(courseCode, passKey, token, (err, message) => {
        if (err) {
            console.error('Error registering in course:', err);
            return res.status(500).json({ error: err });
        } else if (message === 'User already registered in this course') {
            return res.status(200).json({ message });
        } else {
            return res.status(200).json({ message: 'Successfully registered in course' });
        }
    });
};



const listRegisteredCourses = (req, res) => {
   const authHeader = req.headers.authorization; // Extract token from headers
   const token = authHeader ? authHeader.split(' ')[1] : null;

   if (!token) {
       return res.status(401).json({ error: 'Authorization token not provided' });
   }

   listRegisteredCoursesService(token, (err, courses) => {
       if (err) {
           console.log(err);
           return res.status(500).json({ error: err });
       } else {
           return res.json({ courses });
       }
   });
};

const searchCourse = (req, res) => {
   const { course } = req.query;

   if (!course) {
       return res.status(400).json({ error: 'Search term not provided' });
   }

   searchCourseService(course, (err, courses) => {
       if (err) {
           console.log(err);
           return res.status(500).json({ error: err.message });
       } else {
           return res.json({ courses });
       }
   });
};

const showCourseDetail = (req, res) => {
   const { courseID } = req.params;

   showCourseDetailService(courseID, (err, course) => {
       if (err) {
           return res.status(500).json({ error: err });
       } else {
           return res.json({ course });
       }
   });
};

const getCourseStatus = (req, res) => {
   const courseId = req.params.courseId;
   const token = req.headers.authorization.split(' ')[1];
   if (!token) {
       return res.status(401).json({ error: 'Authorization token not provided' });
   }

   getCourseStatusService(courseId, token, (err, courseStatus) => {
       if (err) {
           res.status(500).json({ error: err.message });
       } else if (courseStatus === null) {
           res.status(404).json({ message: 'Course status not found' });
       } else {
           res.status(200).json({ courseStatus });
       }
   });
};

const getUserCourseStatistics = (req, res) => {
   const token = req.headers.authorization.split(' ')[1];

   jwt.verify(token, 'unihubaammy', (err, decoded) => {
       if (err) {
           res.status(401).json({ error: 'Unauthorized' });
       } else {
           const userId = decoded.id;

           getUserCourseStatisticsService(userId, (err, statistics) => {
               if (err) {
                   res.status(500).json({ error: err.message });
               } else {
                   res.status(200).json(statistics);
               }
           });
       }
   });
};

const listInstructorCourse = (req, res) => {
   
   const token = req.headers.authorization.split(' ')[1];

   if (!token) {
       return res.status(401).json({ error: 'Authorization token not provided' });
   }


           listInstructorCourseService(token, (err, courses) => {
               if (err) {
                   if (err.message === 'Course not feeound') {
                       res.status(404).json({ error: 'Course' });
                   } else {
                       console.error('Service error:', err);
                       res.status(500).json({ error: 'Internal Server Error' });
                   }
               } else {
                   res.status(200).json(courses);
               }
           });
};

const isUserRegisteredInCourse = (req, res) => {
    const courseId = req.params.courseId;
    const token = req.headers.authorization.split(' ')[1];

    if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
    }

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required' });
    }

    isUserRegisteredInCourseService(courseId, token, (err, result) => {
        if (err) {
            return res.status(err.status || 500).json({ message: err.message, details: err.details });
        }

        res.status(200).json(result);
    });
};

const rateCourse = (req, res) => {
    const { courseId } = req.params;
    const { rating } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    courseRatingService(courseId, rating, token, (err, result) => {
        if (err) {
            return res.status(err.status || 500).json({ error: err.message });
        }
        return res.status(result.status || 200).json({ message: result.message });
    });
};

const calculateCourseRating = (req, res) => {
    const courseId = req.params.courseId;

    calculateCourseRatingService(courseId, (err, result) => {
        if (err) {
            res.status(err.status || 500).json({ error: err.message });
        } else {
            res.status(200).json(result);
        }
    });
};

const listUserCourseRating = (req, res) => {
    const { courseId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    listUserCourseRatingService(courseId, token, (result, error) => {
        if (error) {
            console.error('Error:', error.message, error.details || '');
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        if (result) {
            return res.status(result.status).json({ rating: result.rating });
        }
        return res.status(500).json({ error: 'Unexpected error' });
    });
};

const searchInstructorCourses = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { course } = req.query;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    if (!course) {
        return res.status(400).json({ error: 'Course search term not provided' });
    }

    searchInstructorCoursesService(token, course, (result, error) => {
        if (error) {
            console.error(error.message);
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        return res.status(result.status).json(result.courses);
    });
};

const listInstructorCoursesCount = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    listInstructorCoursesCountService(token, (result, error) => {
        if (error) {
            console.error(error.message);
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        return res.status(result.status).json(result);
    });
};
const listInstructorUserCount = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    listInstructorUserCountService(token, (result, error) => {
        if (error) {
            console.error(error.message);
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        return res.status(result.status).json(result);
    });
};

const archiveCourse = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const courseId = req.params.courseId;

    archiveCourseService(token, courseId, (result) => {
        return res.status(result.status).json({ message: result.message });
    });
};

const getCoursePhoto = (req, res) => {
    const courseId = req.params.courseId; // Extract courseId from URL parameters
    getCoursePhotoService(courseId, (err, coursePhoto) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to retrieve course photo' });
        }
        if (!coursePhoto) {
            return res.status(404).json({ error: 'Course photo not found' });
        }
        res.json({ coursePhoto });
    });
};

const uploadCoursePhoto = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({error: 'Authorization token not provided'});
    }

    jwt.verify(token, 'unihubaammy', async (err, decoded) => {
        if (err) {
            return res.status(401).json({error: 'Invalid token'});
        }

        uploadCoursePhotoService(req)
            .then((url) => {
                res.status(201).json({message: 'Photo uploaded successfully', url});
            })
            .catch((error) => {
                console.error(error.message);
                res.status(500).json({error: error.message});
            });
    });
}


module.exports = {
   listCourses,
   registerInCourse,
   listRegisteredCourses,
   searchCourse,
   showCourseDetail,
   getCourseStatus,
   getUserCourseStatistics,
   listInstructorCourse,
   isUserRegisteredInCourse,
   rateCourse,
   calculateCourseRating,
   listUserCourseRating,
   searchInstructorCourses,
   listInstructorCoursesCount,
   listInstructorUserCount,
   archiveCourse,
   uploadCoursePhoto,
   getCoursePhoto
};
