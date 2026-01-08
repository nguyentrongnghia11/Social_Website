import _Group from '../../models/group';
import _Conversation from '../../models/conversation';
import { ErrorApi } from '../../middleware/error';

export class GroupService {
    async createGroup(userId: string, name: string, isPrivate: boolean, members: string[]) {
        if (!name || typeof isPrivate !== 'boolean' || !members) {
            throw new ErrorApi(400, "Information missing");
        }

        const newGroup = await _Group.create({
            userCreate: userId,
            name,
            isPrivate,
            members
        });

        if (!newGroup) {
            throw new ErrorApi(500, "Create group fail");
        }

        let newConversation: any = await _Conversation.create({
            groupId: newGroup._id,
            type: "group"
        });

        if (!newConversation) {
            throw new ErrorApi(500, "Create conversation fail by group");
        }

        newConversation = newConversation.toObject ? newConversation.toObject() : newConversation;
        newConversation.name = name;
        newConversation.groupId = newGroup.toObject ? newGroup.toObject() : newGroup;
        return { newGroup, newConversation };
    }

    async addMember(groupId: string, uid: string) {
        if (!groupId || !uid) {
            throw new ErrorApi(400, "GroupId or uid is missing");
        }

        const group = await _Group.findByIdAndUpdate(
            groupId,
            { $addToSet: { members: uid } },
            { new: true }
        ).lean();

        if (!group) {
            throw new ErrorApi(404, "Group not found");
        }

        return { success: true };
    }

    async inviteMember(groupId: string, uid: string) {
        // TODO: Implement invite member logic
        throw new ErrorApi(501, "Not implemented");
    }
}

export default new GroupService();
