import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Typography, CircularProgress, Stack } from "@mui/material";
import { loginUser } from "../../helpers/authHelper";
import ErrorAlert from "../ErrorAlert";
import { BASE_URL } from "../../config";

const GoogleCallbackView = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState("");

    useEffect(() => {
        const handleCallback = async () => {
            try {
                if (searchParams.get('success') === 'true') {
                    const response = await fetch(`${BASE_URL}/v1/user/me`, {
                        credentials: 'include',
                     
                    });
                    console.log("Google callback response:", response);
                    if (!response.ok) {
                        throw new Error('Không thể lấy thông tin người dùng');
                    }

                    const data = await response.json();

                    console.log("Google callback user data:", data.result);

                    if (!data.result) {
                        throw new Error('Dữ liệu người dùng không hợp lệ');
                    }

                    const user = data.result;

                    console.log("Logged in user:", user.deviceId);

                    if (user.status === 'banned') {
                        setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
                        setTimeout(() => navigate("/login"), 3000);
                        return;
                    }
                    const loginData = {
                        user: user,
                        refreshToken: data.result.refreshToken || null
                    };

                    await loginUser(loginData);
                    navigate("/");
                } else {
                    // Check for error parameter
                    const errorParam = searchParams.get("error");
                    if (errorParam) {
                        setError(decodeURIComponent(errorParam));
                    } else {
                        setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
                    }
                    setTimeout(() => navigate("/login"), 3000);
                }
            } catch (err) {
                console.error("Google callback error:", err);
                setError("Có lỗi xảy ra khi xử lý đăng nhập: " + err);
                setTimeout(() => navigate("/login"), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <Container maxWidth="xs" sx={{ mt: 10 }}>
            <Stack alignItems="center" spacing={3}>
                {error ? (
                    <>
                        <Typography variant="h5" color="error">
                            Đăng nhập thất bại
                        </Typography>
                        <ErrorAlert error={error} />
                        <Typography color="text.secondary">
                            Đang chuyển hướng về trang đăng nhập...
                        </Typography>
                    </>
                ) : (
                    <>
                        <CircularProgress />
                        <Typography variant="h5" color="text.secondary">
                            Đang xử lý đăng nhập Google...
                        </Typography>
                    </>
                )}
            </Stack>
        </Container>
    );
};

export default GoogleCallbackView;
