const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);

    // Multer errors
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: `Maximum file size is ${process.env.MAX_FILE_SIZE} bytes`
            });
        }
        return res.status(400).json({
            error: 'Upload error',
            message: error.message
        });
    }

    // MongoDB errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: error.message
        });
    }

    if (error.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format',
            message: 'The provided ID is not valid'
        });
    }

    // Default error
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : error.message
    });
};

module.exports = errorHandler;
