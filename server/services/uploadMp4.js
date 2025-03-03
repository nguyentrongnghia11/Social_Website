const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const { Dropbox } = require('dropbox');

require('dotenv').config();

const clientId = process.env.APP_KEY;
const clientSecret = process.env.APP_SECRET;
const aouth2Client = new google.auth.OAuth2(clientId, clientSecret, process.env.CALLBACK_URI);
aouth2Client.setCredentials({ refresh_token: process.env.CLIENT_TOKEN });



async function uploadFileToDropbox(filePath) {
    const accessToken = process.env.APP_ACCESSTOKEN; // Đảm bảo token hợp lệ
    const dbx = new Dropbox({ accessToken, fetch: require('node-fetch') });

    const response = await dbx.usersGetCurrentAccount();
    console.log(response);

    try {
        const fileContent = fs.readFileSync(filePath);
        const fileName = 'uploads/' + path.basename(filePath);  // Đường dẫn trên Dropbox

        const response = await dbx.filesUpload({
            path: '/' + fileName,
            contents: fileContent,
            mode: { ".tag": "add" } // Không ghi đè file trùng tên
        });

        console.log('Upload thành công:', response);
        const path_display = response.result.path_display;
        let link = await dbx.sharingCreateSharedLinkWithSettings({
            path: path_display,

        })

        console.log('Link:', link.result.url);
        link = link.result.url.replace('dl=0', 'raw=1');
        return link;

    } catch (error) {
        console.error('Lỗi khi upload file:', error);
    }
}
//







const drive = google.drive({
    version: 'v3',
    auth: aouth2Client
})





//sl.CDT5aC8qttZOgaPwZ4qBkKv7xj34qG9z8KEzZdtqb5csygdw_tL_uFIyke6HIOGrJccg9jwh30s2HGWvZr1xnm-FrMAVdHGJRqS3-agFyQwxRJSEfwqJ_AJ9kHpzmba-G2OgQIY_NsAt
const setPublicPermission = async (fileId) => {
    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        })

        const getLink = await drive.files.get({
            fields: 'webViewLink, webContentLink',
            fileId: fileId
        })

        return getLink;
    } catch (error) {
        console.log('public error', error);
    }

}

const uploadMp4 = async (options) => {



    try {
        const createFile = await drive.files.create({
            requestBody: {
                name: 'video.mp4',
                mimeType: 'video/mp4'
            },
            media: {
                mimeType: 'video/mp4',
                body: fs.createReadStream(path.join(__dirname, '../recources/video.mp4'))
            }
        })

        if (options === true) {
            const link = await setPublicPermission(createFile.data.id);
            console.log('111 link', link);
        }


        console.log('111 data', createFile.data);
    } catch (error) {
        console.log('111 error', error);
        //console.log('111 data', createFile.data);
    }
}



module.exports = uploadFileToDropbox;



