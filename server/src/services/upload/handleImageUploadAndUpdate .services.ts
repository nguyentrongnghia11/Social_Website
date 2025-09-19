import { uploadImage } from "./uploadImage";
import { updateLink } from "../upload/updateLink.services";
export const handleImageUploadAndUpdate = async (data: { postId: string, paths: string[] }) => {
    const { postId, paths } = data;
    const result: any = await uploadImage(paths);

    console.log(result)

    if (!result) {
        console.log("Khong upload thanh cong")
        return;
    }
    return await updateLink(data.postId, result);
}
