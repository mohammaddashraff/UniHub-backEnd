const { signUpService, signInService, deleteUserService, editUserService, viewProfileService, forgetPasswordService,
    checkOTPService, changePasswordService, uploadUserPhotoService, getUserPhotoService, getUserDetailsService } = require('../Services/userService');

const signUp = (req, res) => {
   const userData = req.body;
   signUpService(userData, (err, userId) => {
       if (err) {
           if (err === 'Email already exists') {
               res.status(409).json({ error: err });
           }
           
           else{
               res.status(500).json({ error: err });
           }
       } else {
           res.json({ message: 'success', userId });
       }
   });
};

const signIn = (req, res) => {
   const userData = req.body;
   signInService(userData, (err, token) => {
       if (err) {
           res.status(403).json({ error: err });
       } else {
           res.json( token );
       }
   });
};

const deleteUser = (req, res) => {
   const token = req.headers.authorization?.split(' ')[1];
   if (!token) {
       return res.status(401).json({ error: 'Authorization token not provided' });
   }
   deleteUserService(token, (message, err) => {
       if (err) {
           res.status(500).json({ error: err });
       } else {
           res.json({ message });
       }
   });
};

const editUser = (req, res) => {
   const userData = req.body;
   const token = req.headers.authorization?.split(' ')[1];
   if (!token) {
       return res.status(401).json({ error: 'Authorization token not provided' });
   }
   editUserService(token, userData, (message, err) => {
       if (err) {
           res.status(500).json({ error: err });
       } else {
           res.status(200).json({ message });
       }
   });
};

const viewProfile = (req, res) => {
   const token = req.headers.authorization?.split(' ')[1];
   if (!token) {
       return res.status(401).json({ error: 'Authorization token not provided' });
   }
   viewProfileService(token, (err, data) => {
       if (err) {
           res.status(500).json({ error: err });
       } else {
           res.json({ data });
       }
   });
};

const forgetPassword = (req, res) => {
   const userData = req.body;
   forgetPasswordService(userData, (err, response, otp, token) => {
       if (err) {
           res.status(500).json({ error: err });
       } else {
           res.json({ response, otp, token });
       }
   });
};

const checkOTP = (req, res) => {
   const otps = req.body;
   checkOTPService(otps, (err, response) => {
       if (err) {
           res.status(500).json({ error: err });
       } else {
           res.json(response );
       }
   });
};

const changePassword = (req, res) => {
  
   const userData = req.body;
   changePasswordService( userData, (err, message) => {
       if (err) {
           res.status(500).json({ error: err });
       } else {
           res.json( message );
       }
   });
};

const uploadUserPhoto = async (req, res) => {
    try {
        const url = await uploadUserPhotoService(req);
        res.status(200).json({ message: 'Photo uploaded successfully', url });
    } catch (error) {
        console.error('Error in uploadUserPhotoController:', error.message);
        res.status(500).json({ error: error.message });
    }
};

const getUserPhoto = (req, res) => {
   getUserPhotoService(req, (err, url) => {
       if (err) {
           console.error('Error in getUserPhotoController:', err.message);
           res.status(500).json({ error: err.message });
       } else {
           res.status(200).json({ profilePhotoUrl: url });
       }
   });
};

const getUserDetails = (req, res) => {
    const userId = req.params.userId;

    getUserDetailsService(userId, (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message, details: err.details });
        }

        res.status(200).json(result);
    });
};

module.exports = {
   signUp,
   signIn,
   deleteUser,
   editUser,
   viewProfile,
   forgetPassword,
   checkOTP,
   changePassword,
   uploadUserPhoto,
   getUserPhoto,
   getUserDetails
};
