const OSS = require('ali-oss');
const log = require('./log');
const config = require('../config');
const fs = require('fs');

module.exports = class {
    constructor() {
        this.client = OSS({
            accessKeyId: config.oss.accessKeyId,
            accessKeySecret: config.oss.accessKeySecret,
            bucket: config.oss.bucket,
            region: config.oss.region,
            internal: config.oss.internal,
            secure: config.oss.secure
        });
    }

    async getOSSFileList(nextMarker) {
        try {
            let result;
            if (nextMarker) {
                result = await this.client.list({
                    marker: nextMarker
                });
            } else {
                result = await this.client.list();
            }
            return result;
        } catch (e) {
            log.error(e);
        }
    }

    async delOSSFile(file) {
        let result;
        if (typeof file === 'object' && file.length > 0) {
            result = await this.client.deleteMulti(file, {
                quiet: true
            });
        } else {
            result = await this.client.delete(file);
        }
        return result;
    }

    async uploadFile(filePath, objectName, size) {
        if (!filePath) {
            throw new Error('未传入文件路径');
        }
        if (!objectName) {
            throw new Error('未传入对象名称');
        }
        let stream = fs.createReadStream(filePath);
        let result
        if (size) {
            result = await this.client.putStream(
                objectName, stream, { contentLength: size }
            );
        } else {
             result = await this.client.putStream(objectName, stream);
        }
        return result;
    }
}