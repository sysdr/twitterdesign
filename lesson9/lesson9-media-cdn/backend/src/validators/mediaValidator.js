const Joi = require('joi');

const validateUpload = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.string().required(),
        fileName: Joi.string().when('$isUploadUrl', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        fileType: Joi.string().when('$isUploadUrl', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
    });

    const isUploadUrl = req.path === '/upload-url';
    const { error } = schema.validate(req.body, { context: { isUploadUrl } });
    
    if (error) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: error.details.map(d => d.message)
        });
    }
    
    next();
};

const validateMediaId = (req, res, next) => {
    const schema = Joi.object({
        id: Joi.string().hex().length(24).required()
    });

    const { error } = schema.validate(req.params);
    
    if (error) {
        return res.status(400).json({ 
            error: 'Invalid media ID',
            details: error.details.map(d => d.message)
        });
    }
    
    next();
};

module.exports = {
    validateUpload,
    validateMediaId
};
