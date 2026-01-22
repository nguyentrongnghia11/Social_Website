export enum Permission {
    // User permissions - own posts
    CREATE_POST = "create_post",
    EDIT_OWN_POST = "edit_own_post",
    DELETE_OWN_POST = "delete_own_post",
    CREATE_COMMENT = "create_comment",
    EDIT_OWN_COMMENT = "edit_own_comment",
    DELETE_OWN_COMMENT = "delete_own_comment",

    // Moderator permissions - content moderation
    HIDE_POST = "hide_post",
    HIDE_COMMENT = "hide_comment",
    DELETE_ANY_POST = "delete_any_post",
    DELETE_ANY_COMMENT = "delete_any_comment",
    BAN_USER_COMMENT = "ban_user_comment",
    BAN_USER_POST = "ban_user_post",
    MANAGE_CONTENT = "manage_content",

    // Admin permissions - full control
    MANAGER_USER = "manage_users",
    VIEW_ADMIN_PANEL = "view_admin_panel",
}
