const { createClient } = require('redis');

const connect = () => {
    const client = createClient({
        url: 'redis://127.0.0.1:6379'
    });

    client.on('error', (error) => {
        console.log('❌ Redis Error:', error);
    });

    (async () => {
        await client.connect();
    })();

    

    return client;
};

module.exports = connect;
