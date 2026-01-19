import { Permission } from "./permission.enum";
import { Role } from "./role.enum";

// User: quyền liên quan tới bài viết và bình luận của bản thân
// Admin: toàn quyền
// Moderator: không có quyền vào admin, có quyền ẩn hiện bài viết/bình luận, cấm user đăng bài/bình luận
export const role_permission: Record<Role, Permission[]> = {
    [Role.Admin]: [
        Permission.CREATE_POST,
        Permission.EDIT_OWN_POST,
        Permission.DELETE_OWN_POST,
        Permission.CREATE_COMMENT,
        Permission.EDIT_OWN_COMMENT,
        Permission.DELETE_OWN_COMMENT,
        Permission.HIDE_POST,
        Permission.HIDE_COMMENT,
        Permission.DELETE_ANY_POST,
        Permission.DELETE_ANY_COMMENT,
        Permission.BAN_USER_COMMENT,
        Permission.BAN_USER_POST,
        Permission.MANAGER_USER,
        Permission.VIEW_ADMIN_PANEL,
    ],
    [Role.User]: [
        Permission.CREATE_POST,
        Permission.EDIT_OWN_POST,
        Permission.DELETE_OWN_POST,
        Permission.CREATE_COMMENT,
        Permission.EDIT_OWN_COMMENT,
        Permission.DELETE_OWN_COMMENT,
    ],
    [Role.Moderator]: [
        Permission.CREATE_POST,
        Permission.EDIT_OWN_POST,
        Permission.DELETE_OWN_POST,
        Permission.CREATE_COMMENT,
        Permission.EDIT_OWN_COMMENT,
        Permission.DELETE_OWN_COMMENT,
        Permission.HIDE_POST,
        Permission.HIDE_COMMENT,
        Permission.DELETE_ANY_POST,
        Permission.DELETE_ANY_COMMENT,
        Permission.BAN_USER_COMMENT,
        Permission.BAN_USER_POST,
    ]
}

export const getDefaultPermissions = (role: Role): string[] => {
    return role_permission[role] || [];
}

export const getAllPermissions = (): string[] => {
    return Object.values(Permission);
}