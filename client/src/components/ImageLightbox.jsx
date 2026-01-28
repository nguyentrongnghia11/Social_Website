import React from 'react';
import { Dialog, IconButton, Box } from '@mui/material';
import { Close } from '@mui/icons-material';

const ImageLightbox = ({ open, imageUrl, onClose }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                    onClick={onClose}
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

                <img
                    src={imageUrl}
                    alt="Full size"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '90vh',
                        objectFit: 'contain',
                        cursor: 'zoom-out',
                    }}
                    onClick={onClose}
                />
            </Box>
        </Dialog>
    );
};

export default ImageLightbox;
