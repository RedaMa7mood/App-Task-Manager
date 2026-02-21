import app from './index.js';
import logger from './Utilies/logger.js';
import {initSocket} from './sockets/socket.js'
const port = process.env.PORT || 3000;


process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    server.close(() => {
        logger.info('Shutting down server due to uncaught exception');
        process.exit(1);
    })
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection', err);
    server.close(() => {
        logger.info('Shutting down server due to unhandled rejection');
        process.exit(1);
    })

})

const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    console.log(`Server is running on port ${port}`);
})
initSocket(server);

