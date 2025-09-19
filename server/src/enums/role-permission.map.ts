import { Permission } from "./permission.enum";
import { Role } from "./role.enum";


export const role_permission : Record<Role, Permission[]> = {
    [Role.Admin] : [Permission.CREATE_POST, Permission.DELETE_ANY_POST, Permission.CREATE_POST, Permission.HIDE_COMMENT, Permission.HIDE_POST, Permission.DELETE_ANY_COMMENT, Permission.MANAGER_USER],
    [Role.User] : [Permission.CREATE_POST, Permission.EDIT_OWN_POST, Permission.EDIT_OWN_POST],
    [Role.Moderator] : [Permission.CREATE_POST, Permission.DELETE_ANY_POST,  Permission.HIDE_COMMENT, Permission.HIDE_POST, Permission.DELETE_ANY_COMMENT]
}