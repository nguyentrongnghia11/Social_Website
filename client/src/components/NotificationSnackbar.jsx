import React from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../stores/useNotificationStore';

const NotificationSnackbar = () => {
    const navigate = useNavigate();
    const snackbar = useNotificationStore((state) => state.snackbar);

    const handleClose = (event, reason) => {
        if (reason === "clickaway") return;
        useNotificationStore.getState().hideSnackbar();
        useNotificationStore.getState().clearSnackbarLink();
    };

    const handleGo = () => {
        const { snackbar } = useNotificationStore.getState();
        if (snackbar.link) navigate(snackbar.link);
        useNotificationStore.getState().hideSnackbar();
        useNotificationStore.getState().clearSnackbarLink();
    };

    return (
        <Snackbar
            open={snackbar.open}
            autoHideDuration={8000}
            onClose={handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            disableWindowBlurListener
            sx={{
                right: '24px !important',
                left: 'auto !important',
                top: '50vh !important',
            }}
        >
            <Alert
                severity="success"
                icon={<CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />}
                action={
                    snackbar.link && (
                        <Button
                            color="inherit"
                            size="small"
                            onClick={handleGo}
                            variant="contained"
                            sx={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                px: 2,
                                py: 0.5,
                                minWidth: 'auto',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: '#059669',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                }
                            }}
                        >
                            VIEW
                        </Button>
                    )
                }
                sx={{
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    minWidth: '320px',
                    '& .MuiAlert-message': {
                        fontWeight: 500,
                        fontSize: '14px'
                    }
                }}
            >
                {snackbar.message || "Posted successfully"}
            </Alert>
        </Snackbar>
    );
};

export default NotificationSnackbar;
