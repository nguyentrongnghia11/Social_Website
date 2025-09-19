
import cloudinary from '../../databases/cloud'
import fs from 'fs'

const uploadImage = async (paths: string[]) => {

    // Use the uploaded file's name as the asset's public ID and 
    // allow overwriting the asset with new versions
    const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        folder: "upload",
        resource_type: "auto",
    };

    try {
        const result = await Promise.all(
            paths.map(async (path) => {
                console.log('path', path)
                const data = await cloudinary.uploader.upload(path, options)

                console.log(data)
                return { urlPre: data.url, type: data.resource_type };
            })
        );



        for (let i = 0; i < result.length; i++) {
            fs.unlinkSync(paths[i])
        }

        return result;
    } catch (error) {
        console.error("Upload failed:", error)
    }

};

const getAssetInfo = async (publicId: string) => {

    // Return colors in the response
    const options = {
        colors: true,
    };

    try {
        // Get details about the asset
        const result = await cloudinary.api.resource(publicId, options);
        console.log(result);
        return result.colors;
    } catch (error) {
        console.error(error);
    }
};

export { uploadImage, getAssetInfo };
