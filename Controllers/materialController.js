const { uploadFileAndInsertMetadata, printMaterialForEachCourse, editMaterial, editMaterialDesc, deleteMaterial } = require('../Services/materialService');
const jwt = require('../Utils/jwt');

// Function to handle the upload and metadata insertion
const uploadFileAndInsertMetadataController = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    try {
        const result = await uploadFileAndInsertMetadata(req);
        res.status(200).json({ message: 'File uploaded and metadata inserted successfully', url: result });
    } catch (error) {
        res.status(500).json({ error: 'Error uploading file and inserting metadata', details: error.message });
    }
};

const printMaterialForEachCourseController = (req, res) => {
    const courseId = req.params.courseId;

    printMaterialForEachCourse(courseId, (err, materials) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to retrieve materials', details: err.message });
        }
        res.status(200).send(materials);
    });
};

const editMaterialController = (req, res) => {
    editMaterial(req, (err, result) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to edit material', details: err.message });
        }
        res.status(200).send({ message: result });
    });
};

const updateMaterialDescriptionController = (req, res) => {
    const { materialId } = req.params;
    const { newDesc } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token not provided' });
    }

    editMaterialDesc(materialId, newDesc, token, (error, message) => {
        if (error) {
            return res.status(500).json({
                error: 'Failed to update material description',
                details: error.message,
            });
        }

        res.json({
            message: 'Material description updated successfully',
        });
    });
};

const deleteMaterialController = (req, res) => {
    const { materialId } = req.params;

    if (!materialId) {
        return res.status(400).json({
            error: 'Material ID is required'
        });
    }

    deleteMaterial(materialId, req, (err, message) => {
        if (err) {
            return res.status(500).json({
                error: 'Failed to delete material',
                details: err.message
            });
        } else {
            return res.status(200).json({
                message: message
            });
        }
    });
};
module.exports = {
    uploadFileAndInsertMetadataController,
    printMaterialForEachCourseController,
    editMaterialController,
    updateMaterialDescriptionController,
    deleteMaterialController
};