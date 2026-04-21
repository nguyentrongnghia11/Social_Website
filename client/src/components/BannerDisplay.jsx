import React, { useState, useEffect } from 'react';
import { Box, Link, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { getActiveBanners } from '../api-axios/banner';

const BannerDisplay = ({ position = 'left' }) => {
    const [banners, setBanners] = useState([]);
    const [closedBanners, setClosedBanners] = useState([]);
    const [failedImageUrls, setFailedImageUrls] = useState(new Set());

    useEffect(() => {
        loadBanners();
        // Refresh every 5 minutes
        const interval = setInterval(loadBanners, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [position]);

    const loadBanners = async () => {
        try {
            const res = await getActiveBanners(position);
            setBanners(res.data.data || []);
        } catch (err) {
            console.error('Failed to load banners:', err);
        }
    };

    const handleClose = (bannerId) => {
        setClosedBanners([...closedBanners, bannerId]);
    };

    const visibleBanners = banners.filter(
        (banner) => !closedBanners.includes(banner._id)
    );

    if (visibleBanners.length === 0) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: position === 'left' || position === 'right' ? 250 : '100%',
                position: position === 'left' || position === 'right' ? 'sticky' : 'relative',
                top: position === 'left' || position === 'right' ? 80 : 0,
            }}
        >
            {visibleBanners.map((banner) => (
                <Box
                    key={banner._id}
                    sx={{
                        position: 'relative',
                        borderRadius: 1,
                        overflow: 'hidden',
                        boxShadow: 1,
                        '&:hover .close-btn': {
                            opacity: 1,
                        },
                    }}
                >
                    <IconButton
                        className="close-btn"
                        size="small"
                        onClick={() => handleClose(banner._id)}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.7)',
                            },
                            zIndex: 1,
                        }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                    {banner.link ? (
                        <Link
                            href={banner.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'block' }}
                        >
                            {failedImageUrls.has(banner.imageUrl) ? (
                                <Box
                                    sx={{
                                        width: '100%',
                                        minHeight: '100px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#f5f5f5',
                                        border: '1px solid #ddd',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                        Không thể hiển thị banner
                                    </Typography>
                                </Box>
                            ) : (
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        display: 'block',
                                        cursor: 'pointer',
                                    }}
                                    onError={() => {
                                        console.error('❌ Banner image failed to load:', banner.imageUrl);
                                        setFailedImageUrls(prev => new Set([...prev, banner.imageUrl]));
                                    }}
                                />
                            )}
                        </Link>
                    ) : failedImageUrls.has(banner.imageUrl) ? (
                        <Box
                            sx={{
                                width: '100%',
                                minHeight: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #ddd',
                            }}
                        >
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Không thể hiển thị banner
                            </Typography>
                        </Box>
                    ) : (
                        <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                            }}
                            onError={() => {
                                console.error('❌ Banner image failed to load:', banner.imageUrl);
                                setFailedImageUrls(prev => new Set([...prev, banner.imageUrl]));
                            }}
                        />
                    )}
                </Box>
            ))}
        </Box>
    );
};

export default BannerDisplay;
