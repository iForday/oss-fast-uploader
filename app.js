const OSS = require('./class/oss');
const log = require('./class/log');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const fsPromise = fs.promises;
const byteSize = require('byte-size');
const oss = new OSS();


byteSize.defaultOptions({
    units: 'simple',
    precision: 2,
    customUnits: {
        simple: [{
            from: 0,
            to: Math.pow(1024, 1),
            unit: 'B',
            long: 'bytes'
        },
        {
            from: Math.pow(1024, 1),
            to: Math.pow(1024, 2),
            unit: 'KB',
            long: 'kibibytes'
        },
        {
            from: Math.pow(1024, 2),
            to: Math.pow(1024, 3),
            unit: 'MB',
            long: 'mebibytes'
        },
        {
            from: Math.pow(1024, 3),
            to: Math.pow(1024, 4),
            unit: 'GB',
            long: 'gibibytes'
        },
        {
            from: Math.pow(1024, 4),
            to: Math.pow(1024, 5),
            unit: 'TB',
            long: 'tebibytes'
        },
        {
            from: Math.pow(1024, 5),
            to: Math.pow(1024, 6),
            unit: 'PB',
            long: 'pebibytes'
        },
        {
            from: Math.pow(1024, 6),
            to: Math.pow(1024, 7),
            unit: 'EB',
            long: 'exbibytes'
        },
        {
            from: Math.pow(1024, 7),
            to: Math.pow(1024, 8),
            unit: 'ZB',
            long: 'zebibytes'
        },
        {
            from: Math.pow(1024, 8),
            to: Math.pow(1024, 9),
            unit: 'YB',
            long: 'yobibytes'
        },
        ]
    },
    toStringFn: function () {
        return `${this.value} ${this.unit}`
    }
});

(async () => {
    try {
        await delFile();
        await uploadLocalFile(config.local.path);
    } catch (error) {
        log.error(error);
    }
})();

async function delFile(nextMarker, delFileCount = 1) {
    let delFileCountStart = delFileCount;
    let result = await oss.getOSSFileList(nextMarker);
    if (result.objects) {
        let fileList = [];
        for (let item of result.objects) {
            log.info(`正在删除第${delFileCount++}个文件 [${item.name}]`);
            fileList.push(item.name);
        }
        let delResult = await oss.delOSSFile(fileList);
        if (delResult.res.statusCode == 200 && delResult.res.statusMessage == 'OK') {
            log.info(`${delFileCountStart} - ${delFileCount} 号文件删除成功`);
        }
    }
    // 根据nextMarker继续列出文件。
    if (result.isTruncated) {
        await delFile(result.nextMarker, delFileCount);
    }
}

async function uploadLocalFile(publicPath, filePath = '') {
    if (!publicPath) {
        throw new Error('未传入本地文件目录');
    }
    let res = await fsPromise.readdir(path.resolve(`${publicPath}/${filePath}`));
    for (let item of res) {
        const objectName = `${filePath}/${item}`;
        const objectFilePath = path.resolve(`${publicPath}/${objectName}`);
        let stat = await fsPromise.stat(objectFilePath);
        if (stat.isFile()) {
            // 文件
            let uploadRes = await oss.uploadFile(objectFilePath, objectName, stat.size);
            if (uploadRes.res && uploadRes.res.statusCode == 200 && uploadRes.res.statusMessage == 'OK') {
                log.info(`文件 [${objectName}] 上传成功 (${byteSize(stat.size).toString()})`);
            } else {
                log.error(`文件 [${objectName}] 上传失败 (${result})`);
            }
        } else {
            log.info(`正在进入文件夹 [${item}]`);
            await uploadLocalFile(publicPath, `${objectName}`);
        }
    }
}