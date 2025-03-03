
const uploadMp4 = require('../services/uploadMp4');
const path = require('path');

const { ZingMp3 } = require("zingmp3-api-full")


const getSong = async (req, res) => {
    const idSong = req.params.id;

    const song = await ZingMp3.getSong(idSong);
    if (song) {
        return res.status(200).json({
            song: song
        });
    };

    return res.status(404).json({
        message: 'Song not found'
    });



}

const searchSong = async (req, res) => {

    console.log('search song'); 
    const query = req.query.q;
    console.log(query);

    const song = await ZingMp3.search(query); 

    if (song) {
        return res.status(200).json({
            song: song,
            
        });
    }
    return res.status(404).json({
        message: 'Song not found'
    });

}



module.exports = {
    upload: uploadSongs,
    getSong: getSong,
    searchSong: searchSong
}