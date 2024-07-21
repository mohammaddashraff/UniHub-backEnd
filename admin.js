const db = require('./database')

const createCourse = (courseData , callback) => {
    const {courseName,courseDesc,instructorId,creditHours,courseCode} = courseData
    const query = 'insert into course (courseName, courseDesc, instructorId, credtHours, courseCode) VALUES (?,?,?,?,?)'
    db.query(query,[courseName,courseDesc,instructorId,creditHours,courseCode] , (err,res) => {
        if(err){
            callback(err)
        }else{
            callback('Course created successfully')
        }
    })
}

const deleteCourse = (CourseCode,callback) => {
    const query = 'delete from course where courseCode = ?'
    db.query(query,[CourseCode],(err,res) =>{
        if(err){
            callback(err)
        }else{
            callback('Course deleted successfully')
        }
    })
}

const editCourse = (courseData,callback) =>{
    const {courseName,courseDesc,instructorId,creditHours,taId,courseCode} = courseData
    const query = 'update course set courseName = ? ,courseDesc = ? , instructorId = ? , credtHours = ? ,taId = ? where courseCode = ?'
    db.query(query,[courseName,courseDesc,instructorId,creditHours,taId,courseCode],(err,res) => {
        if(err){
            callback(err)
        }else{
            callback('Course data updated')
        }
    })
}


module.exports = {
    createCourse,
    deleteCourse,
    editCourse
}