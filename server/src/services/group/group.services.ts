import _Group from '../../models/group';
import _Conversation from '../../models/conversation';
import _User from '../../models/user';
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

        const memberDocs = await _User.find({ _id: { $in: members } })
            .select('name email avt_url')
            .lean();

        const memberSnapshots = memberDocs.map((u: any) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            avt_url: u.avt_url
        }));

        let newConversation: any = await _Conversation.create({
            type: "group",
            participantIds: members,
            participants: memberSnapshots,
            groupInfo: {
                groupId: newGroup._id,
                name: newGroup.name
            }
        });

        if (!newConversation) {
            throw new ErrorApi(500, "Create conversation fail by group");
        }

        newConversation = newConversation.toObject ? newConversation.toObject() : newConversation;
        newConversation.name = name;
        newConversation.groupInfo = {
            groupId: newGroup._id,
            name: newGroup.name
        };
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

        const member = await _User.findById(uid).select('name email avt_url').lean();
        if (member) {
            await _Conversation.updateOne(
                { type: 'group', 'groupInfo.groupId': group._id },
                {
                    $addToSet: {
                        participantIds: member._id,
                        participants: {
                            _id: member._id,
                            name: member.name,
                            email: member.email,
                            avt_url: member.avt_url
                        }
                    }
                }
            );
        }

        return { success: true };
    }

    async inviteMember(groupId: string, uid: string) {
        // TODO: Implement invite member logic
        throw new ErrorApi(501, "Not implemented");
    }
}

export default new GroupService();
