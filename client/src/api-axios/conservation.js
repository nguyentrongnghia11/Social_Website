import { instance } from "../config"

const getAllConversationOfUser = async () => {
    const response = await instance.get('/conversations/all')
    return response.data;
}

const createGroup = async (group) => {

    const response = await instance.post('/group/create', group)
    console.log (response.data.result)
    return response;
}

const markConversationAsRead = async (conversationId) => {
  try {
    await instance.patch(`/conversations/${conversationId}/read`);
    return true;
  } catch (error) {
    return false;
  }
};



export { getAllConversationOfUser, createGroup, markConversationAsRead }