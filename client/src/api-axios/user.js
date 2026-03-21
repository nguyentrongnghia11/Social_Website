import { BASE_URL, instance } from "../config"
import { v4 as uuidv4 } from "uuid"

const loginWithGoogle = async () => {
    try {
        let deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem("deviceId", deviceId);
        }

        window.location.href = `${BASE_URL}/v1/google?deviceId=${deviceId}`;
    } catch (error) {
        console.error('Google login error:', error);
        return { status: 500, error: "Đăng nhập Google thất bại!" };
    }
}

const login = async (formData) => {
    try {
        const loginResponse = await instance.post("/auth/v1/login", formData);
        console.log("Login response::::", loginResponse)

        if (loginResponse.data && loginResponse.data.result) {
            const loginData = loginResponse.data.result;

            return {
                status: 200,
                data: {
                    user: loginData.user,
                    refreshToken: loginData.refreshToken
                }
            };
        }
        return { status: 401, message: 'Login fail', error: "Đăng nhập không thành công!" };
    } catch (error) {
        return { status: 401, message: 'Login fail', error: "Tài khoản không tồn tại!" || "Mật khẩu không chính xác!" }
    }
}


const getRandomUser = async (params) => {
    try {
        const data = await instance.get('/auth/v1/user?' + new URLSearchParams(params));
        return data.data;
    } catch (error) {
        console.error('Error in getRandomUser:', error);
        return { error: error.message || 'Failed to fetch user' };
    }
}

const getUserById = async (userId) => {
    try {
        const data = await instance.get(`/auth/v1/user/${userId}/detail`);
        return data.data;
    } catch (error) {
        console.error('Error in getUserById:', error);
        return { error: error.message || 'Failed to fetch user' };
    }
}

const validateToken = async () => {
    try {
        const response = await instance.get('/auth/validate');
        return response.data;
    } catch (error) {
        console.error('Token validation failed:', error);
        return { valid: false, error: error.message };
    }
}

const verify = async (otp) => {
    console.log("user verfi ", otp)
    try {

        const data = await instance.post('/auth/v1/local/verify', otp);
        return data;
    } catch (error) {
        return { status: 400, message: "verify failed" }
    }
}


const signup = async (formData) => {
    console.log(formData)

    try {

        const data = await instance.post('/auth/v1/local', formData)
        return data;
    } catch (error) {
        return { status: 409, message: "User exists" }
    }
}

const registerGroup = async (token, typeTopic) => {

    // typeTopic  [all || topicId = email]


    const topic = `notice-${typeTopic}`
    console.log(topic)

    const message = {
        "token": token,
        "topic": topic
    }

    const response = await instance.post("/auth/notice", message)

    return response;
}

const updateToken = async (tokenFcm, deviceId) => {

    console.log('update token', tokenFcm, deviceId)
    const response = await instance.patch("/auth/v1/token", { tokenFcm, deviceId })
    return response;
}

const searchUser = async (name) => {
    console.log("day la nem ", name)
    const response = await instance.get(`/auth/v1/user/search`, {
        params: { name: name }
    })
    console.log(response)
    return response.data.result;
}

// Follow/Unfollow APIs
const followUser = async (userId) => {
    try {
        const response = await instance.post(`/auth/v1/user/${userId}/follow`);
        return { status: 200, data: response.data };
    } catch (error) {
        console.error('Error in followUser:', error);
        return {
            status: error.response?.status || 500,
            error: error.response?.data?.message || 'Failed to follow user'
        };
    }
}

const unfollowUser = async (userId) => {
    try {
        const response = await instance.delete(`/auth/v1/user/${userId}/unfollow`);
        return { status: 200, data: response.data };
    } catch (error) {
        console.error('Error in unfollowUser:', error);
        return {
            status: error.response?.status || 500,
            error: error.response?.data?.message || 'Failed to unfollow user'
        };
    }
}

const getFollowers = async (userId, page = 1, limit = 20) => {
    try {
        const response = await instance.get(`/auth/v1/user/${userId}/followers`, {
            params: { page, limit }
        });
        return { status: 200, data: response.data };
    } catch (error) {
        console.error('Error in getFollowers:', error);
        return {
            status: error.response?.status || 500,
            error: error.response?.data?.message || 'Failed to get followers'
        };
    }
}

const getFollowing = async (userId, page = 1, limit = 20) => {
    try {
        const response = await instance.get(`/auth/v1/user/${userId}/following`, {
            params: { page, limit }
        });
        return { status: 200, data: response.data };
    } catch (error) {
        console.error('Error in getFollowing:', error);
        return {
            status: error.response?.status || 500,
            error: error.response?.data?.message || 'Failed to get following'
        };
    }
}

const getFollowStatus = async (userId) => {
    try {
        const response = await instance.get(`/auth/v1/user/${userId}/follow/status`);
        return { status: 200, data: response.data };
    } catch (error) {
        console.error('Error in getFollowStatus:', error);
        return {
            status: error.response?.status || 500,
            error: error.response?.data?.message || 'Failed to get follow status'
        };
    }
}

const logout = async () => {
    try {
        const response = await instance.delete('/auth/v1/logout');
        return { status: 200, data: response.data };
    } catch (error) {
        console.error('Error in logout:', error);
        return {
            status: error.response?.status || 500,
            error: error.response?.data?.message || 'Failed to logout'
        };
    }
}

export {
    login,
    loginWithGoogle,
    getRandomUser,
    getUserById,
    verify, signup,
    registerGroup,
    updateToken, searchUser,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus,
    logout,
    validateToken,
    updateUser
}

const updateUser = async (user, data) => {
    try {
        const response = await instance.patch("/auth/v1/user/profile", data);
        return response;
    } catch (error) {
        console.error('Error in updateUser:', error);
        return { error: error.message || 'Failed to update user' };
    }
}