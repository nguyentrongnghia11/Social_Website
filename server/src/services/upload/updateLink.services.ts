
import path from "path"
import _Post from "../../models/post"

export const updateLink = async (postID: string, paths: string[]) => {

    const imgUrl: string[] = []
    const vidUrl: string[] = []
    console.log(paths)

    paths.forEach((t: any) => {
        if (t.type.match("video")) vidUrl.push(t.urlPre);
        else imgUrl.push(t.urlPre)
    })



    if (imgUrl.length > 0 && vidUrl.length > 0) {

        return Promise.all([await _Post.findByIdAndUpdate({ _id: postID }, { imgUrl: imgUrl }, { new: true }),
        await _Post.findByIdAndUpdate({ _id: postID }, { vidUrl: vidUrl }, { new: true })
        ])


    }
    else {
        if (imgUrl.length > 0) {
            return await _Post.findByIdAndUpdate({ _id: postID }, { imgUrl: imgUrl }, { new: true })

        }
        else if (vidUrl.length > 0) {
            return await _Post.findByIdAndUpdate({ _id: postID }, { vidUrl: vidUrl }, { new: true })

        }
    }

}