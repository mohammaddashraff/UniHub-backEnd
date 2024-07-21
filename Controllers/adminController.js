const { createCourseService, deleteCourseService, editCourseService, listAllUsersService ,deleteUserService} = require('../Services/adminService');

const createCourse = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const courseData = req.body;

    createCourseService(courseData, token, (err, result) => {
        if (err) {
            console.error('Error in createCourse:', err.message);
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(result.status).json({ result });
        }
    });
};

const deleteCourse = (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Assuming Bearer token
    const { courseCode } = req.body;

    deleteCourseService(courseCode, token, (err, result) => {
        if (err) {
            console.error('Error in deleteCourse:', err.message);
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(result.status).json({ message: result.message });
        }
    });
};

const editCourse = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const courseData = req.body;
    const courseId = req.params.courseId;

    editCourseService(courseId, courseData, token, (err, result) => {
        if (err) {
            console.error('Error in editCourse:', err.message);
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(result.status).json({ message: result.message });
        }
    });
};

const listAllUsers = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    listAllUsersService(token, (result, error) => {
        if (error) {
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        return res.status(result.status).json({ users: result.users });
    });
};
const deleteUser = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { userId } = req.params;
 
    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }
 
    deleteUserService(token, userId, (result, error) => {
        if (error) {
            console.error(error.message);
            return res.status(error.status).json({ error: error.message, details: error.details });
        }
        return res.status(result.status).json(result);
    });
 };
module.exports = {
    createCourse,
    deleteCourse,
    editCourse,
    listAllUsers,
    deleteUser
};