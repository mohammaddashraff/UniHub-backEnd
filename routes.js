const express = require('express');
const { signUp, signIn, deleteUser, editUser, viewProfile, forgetPassword, checkOTP,
        changePassword, uploadUserPhoto, getUserPhoto, getUserDetails } = require('./Controllers/userController');
const { listCourses, registerInCourse, listRegisteredCourses, searchCourse,
     showCourseDetail, getCourseStatus, getUserCourseStatistics,
     listInstructorCourse, isUserRegisteredInCourse, rateCourse, 
     calculateCourseRating, listUserCourseRating,searchInstructorCourses ,listInstructorCoursesCount
     ,listInstructorUserCount,archiveCourse,uploadCoursePhoto,
     getCoursePhoto} = require('./Controllers/courseController');
const { createTask, deleteTask, listTasks, markTaskAsCompleted } = require('./Controllers/taskController');
const { uploadFileAndInsertMetadataController, 
        printMaterialForEachCourseController, editMaterialController, 
        updateMaterialDescriptionController, deleteMaterialController } = require('./Controllers/materialController');
const { createPost, editPost, deletePost, listPostsByCourseId,
        listAllPosts, listRecentAnnouncements, filterPostsByTag } = require('./Controllers/postController');
const { addComment, editComment, deleteComment, listComments,addCommentControllerGpt } = require('./Controllers/commentController');
const { createCourse, deleteCourse, editCourse, listAllUsers } = require('./Controllers/adminController');
const { upVote, downVote, getVoteCounts, removeVote } = require('./Controllers/voteController');
const {chatWithOpenAI} = require('./Controllers/chatGptController');
const path = require("path");
const fs = require("fs");
const upload = require('./Utils/upload');
const bucket = require('./Utils/firebaseConfig');
const db = require('./Utils/db');
const router = express.Router();

// User routes
router.post('/signUp', signUp);
router.post('/signIn', signIn);
router.delete('/deleteUser', deleteUser);
router.put('/editUser', editUser);
router.get('/getUserData', viewProfile);
router.post('/forgetPassword', forgetPassword);
router.post('/checkOTP', checkOTP);
router.put('/changePassword', changePassword);
router.post('/upload-photo', upload.single('photo'), uploadUserPhoto);
router.get('/get-photo', getUserPhoto);
router.get('/user/:userId', getUserDetails);

// Course routes
router.get('/courses', listCourses);
router.post('/courses/register', registerInCourse);
router.get('/courses/registered', listRegisteredCourses);
router.get('/courses/search', searchCourse);
router.get('/courses/:courseID', showCourseDetail);
router.get('/courses/:courseId/status', getCourseStatus);
router.get('/course/userstatistics', getUserCourseStatistics);
router.get('/course/instructor', listInstructorCourse);
router.get('/course/:courseId/registered', isUserRegisteredInCourse);
router.post('/course/:courseId/rate', rateCourse);
router.get('/course/:courseId/viewrate', calculateCourseRating);
router.get('/course/:courseId/rating', listUserCourseRating);
router.get('/search-courses', searchInstructorCourses);
router.get('/instructor-courses-count', listInstructorCoursesCount);
router.get('/instructor-user-count', listInstructorUserCount);
router.put('/courses/:courseId/archive', archiveCourse);
router.get('/course-photo/:courseId', getCoursePhoto);
router.post('/upload-course-photo',upload.single('photo'),uploadCoursePhoto)
//tasks routes
router.post('/createTasks', createTask);
router.delete('/deleteTasks', deleteTask);
router.get('/listTasks', listTasks);
router.put('/markTaskAsCompleted', markTaskAsCompleted);

//material routes
router.post('/material/upload', upload.single('file'), uploadFileAndInsertMetadataController);
router.get('/material/course/:courseId', printMaterialForEachCourseController);
router.put('/material/edit', upload.single('file'), editMaterialController);
router.put('/material/:materialId/editDescription',updateMaterialDescriptionController);
router.delete('/material/delete/:materialId', deleteMaterialController);

//post routes
router.post('/post/create/:courseId', createPost);
router.put('/post/edit/:postId', editPost);
router.delete('/post/delete/:postId', deletePost);
router.get('/post/course/:courseId', listPostsByCourseId);
router.get('/posts', listAllPosts);
router.get('/announcements/recent', listRecentAnnouncements);
router.get('/posts/:courseId/tag/:tag', filterPostsByTag);

//comments routes
router.post('/post/:postId/addcomment', addComment);
router.put('/comment/:commentId', editComment);
router.delete('/comment/:commentId', deleteComment);
router.get('/post/:postId/comments', listComments);
router.post('/posts/:postId/comment', addCommentControllerGpt);

//vote routes
router.post('/upvote/:postId', upVote);
router.post('/downvote/:postId', downVote);
router.get('/votes/:postId', getVoteCounts);
router.delete('/votes/remove/:postId', removeVote);

//admin routes
router.post('/admin/create', createCourse);
router.delete('/admin/delete', deleteCourse);
router.put('/admin/edit/:courseId', editCourse);
router.get('/users', listAllUsers);
router.delete('/deleteUser/:userId', deleteUser);


//chat gpt route
router.post('/chatGpt',chatWithOpenAI)

module.exports = (
    router
)
