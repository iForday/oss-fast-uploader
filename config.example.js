module.exports = {
    oss: {
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        region: 'oss-cn-hangzhou',
        internal: false, //内网访问
        secure: true,
    },
    local: {
        path: `${__dirname}/dist/`
    }
}