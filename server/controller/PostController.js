

const _Post = require('../modules/post')
const fs = require('fs');
const upload = require('../services/uploadMp4');
const { count } = require('console');
const { uploadImage, getAssetInfo } = require('../services/uploadImage')
class playlistController {
    // [GET] /playlist
    async createPost(req, res, next) {

        console.log('day la ', req.user)


        const { title, imgUrl, content } = req.body;

        let link = '';

        if (req.file) {
            const file = req.file;
            const filepath = file.path;

            link = await uploadImage(filepath);

        }

        const newPost = new _Post({
            title,
            artistId: req.user.id,
            imgUrl: link,
            content
        })

        console.log(newPost)
        newPost.save()
            .then(() => {
                return res.json({ message: 'Create post success', status: 200 })
            })
            .catch((error) => {
                res.status(500).json({
                    message: 'Create post failed',
                    error: error
                })
            })


    }

    async updatePost(req, res, next) {
        const postId = req.params.id;
        const { title, imgUrl, content } = req.body;




        console.log(postId)

        const post = await _Post.findOneAndUpdate({ _id: postId }, { title, imgUrl, content }, { new: true })


        if (!post) {
            return res.json({
                status: 404,
                message: 'Playlist not found'
            })
        }


        return res.json({
            status: 200,
            message: 'Add song to playlist success',
            data: dataNew
        })

    }

    async hiddenPost(req, res, next) {
        const postId = req.params.id;
        const accountId = req.user.id;

        console.log(postId)

        const post = await _Post.delete({ _id: postId }, accountId);

        if (!post) {
            return res.json({
                status: 404,
                message: 'Delete post faild'
            })
        }
        return res.json({
            status: 400,
            message: 'success 84'
        })
    }

    async removePost(req, res, next) {

        const postId = req.params.id;
        const accountId = req.user.id;

        console.log(postId)

        const post = await _Post.deleteOne({ _id: postId }, accountId);

        if (!post) {
            return res.json({
                status: 404,
                message: 'Delete post faild'
            })
        }
        return res.json({
            status: 400,
            message: 'success 84'
        })
    }

    async reactPost(req, res, next) {
        const postId = req.params.id;
        const { accountId, type } = req.body;

        console.log(postId, accountId, type)

        const post = await _Post.findOne({ 'react.userId': accountId });

        if (!post) {
            return res.json({
                status: 404,
                message: 'Post not found'
            })
        }

        const react = _Post.findByIdAndUpdate({ _id: postId }, { $push: { react: { accountId, type } } }, { new: true })

        if (!react) {
            return res.json({
                status: 400,
                message: 'React faild'
            })
        }

        return res.json({
            status: 200,
            message: 'React success',

        })
    }

    async moderationPost(req, res, next) {
        const postId = req.params.id;
        const admin = req.user.role;


        console.log(postId, admin)

        if (admin !== 'admin') {
            return res.json({
                status: 403,
                message: 'Permission denied'
            })
        }


        const post = await _Post.findByIdAndUpdate({ _id: postId }, { status: 1 });

        if (!post) {
            return res.json({
                status: 400,
                message: 'Moderation faild'
            })
        }

        return res.json({
            status: 200,
            message: 'Moderation success'
        })

    }

    async restorePost() {
        const postId = req.params.id;
        const admin = req.user.id;

        const author = _Post.findById({ _id: postId }).select('artistId');

        if (admin !== author) {
            return res.json({
                status: 403,
                message: 'Permission denied'
            })
        }

        const post = await _Post.restore({ _id: postId });

        if (!post) {
            return res.json({
                status: 400,
                message: 'Restore faild'
            })
        }

        return res.json({
            status: 200,
            message: 'Restore success'
        })


    }


    async uploadImgaes(req, res) {

        const file = req.file;

        console.log(file)
        const filepath = file.path;




        const link = await upload(filepath)



        console.log(link)

        return res.json({
            message: 'Upload success',
            link: link
        })



        //res.status(200).send('File uploaded successfully');

    }

    async getAllPost(req, res, next) {


        const post = await _Post.find().populate('artistId',).populate('comments').sort({ createdAt: -1 });

        if (!post) {
            return res.json({
                status: 204,
                message: 'Post not found',
            })
        }

        return res.json({
            status: 200,
            message: 'Get all post success',
            data: post
        })

    }


    async getMyPost(req, res, next) {

        console.log(req.user.id);
        const id = req.user.id;

        const post = await _Post.find({ artistId: id || null }).populate('artistId').populate('comments').sort({ createdAt: -1 });


        return res.json({
            status: 200,
            message: 'Get my post success',
            data: post
        })

    }

}

module.exports = new playlistController;