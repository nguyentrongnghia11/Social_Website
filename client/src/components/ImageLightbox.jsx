import React, { useState } from 'react';
import { Dialog, IconButton, Box, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';

const ImageLightbox = ({ open, imageUrl, onClose }) => {
    const [imageError, setImageError] = useState(false);

    const handleClose = () => {
        setImageError(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    overflow: 'hidden',
                },
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                }}
            >
                <IconButton
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        zIndex: 1,
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.9)',
                        },
                    }}
                >
                    <Close />
                </IconButton>

                {imageError ? (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            minHeight: '80vh',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white' }}>
                            Không thể hiển thị ảnh
                        </Typography>
                    </Box>
                ) : (
                    <img
                        src={imageUrl}
                        alt="Full size"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            cursor: 'zoom-out',
                        }}
                        onClick={handleClose}
                        onError={() => {
                            console.error('❌ Lightbox image failed to load:', imageUrl);
                            setImageError(true);
                        }}
                    />
                )}
            </Box>
        </Dialog>
    );
};

export default ImageLightbox;
