"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockMiddleware = exports.getMockApis = exports.parseMockApis = exports.getMockConfigs = exports.HTTP_METHODS = exports.MOCK_DIR = void 0;
const path = require("path");
const glob = require("glob");
const path_to_regexp_1 = require("path-to-regexp");
const bodyParser = require("body-parser");
const helper_1 = require("@tarojs/helper");
exports.MOCK_DIR = 'mock';
exports.HTTP_METHODS = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];
function getMockConfigs({ appPath, mocks }) {
    const mockDir = path.join(appPath, exports.MOCK_DIR);
    let mockConfigs = {};
    if (helper_1.fs.existsSync(mockDir)) {
        const mockFiles = glob.sync('**/*.[tj]s', {
            cwd: mockDir
        });
        if (mockFiles.length) {
            const absMockFiles = mockFiles.map(file => path.join(mockDir, file));
            helper_1.createBabelRegister({
                only: absMockFiles
            });
            absMockFiles.forEach(absFile => {
                let mockConfig = {};
                try {
                    delete require.cache[absFile];
                    mockConfig = helper_1.getModuleDefaultExport(require(absFile));
                }
                catch (err) {
                    throw err;
                }
                mockConfigs = Object.assign({}, mockConfigs, mockConfig);
            });
        }
    }
    if (mocks && !helper_1.isEmptyObject(mocks)) {
        mockConfigs = Object.assign({}, mockConfigs, mocks);
    }
    return mockConfigs;
}
exports.getMockConfigs = getMockConfigs;
function parseMockApis(mockConfigs) {
    return Object.keys(mockConfigs).map(key => {
        const result = mockConfigs[key];
        let method = 'GET';
        let apiPath;
        const keySplit = key.split(/\s+/g);
        if (keySplit.length === 2) {
            method = keySplit[0];
            apiPath = keySplit[1];
            if (!exports.HTTP_METHODS.includes(method)) {
                throw `配置的 HTTP 方法名 ${method} 不正确，应该是 ${exports.HTTP_METHODS.toString()} 中的一员！`;
            }
        }
        else if (keySplit.length === 1) {
            apiPath = keySplit[0];
        }
        const keys = [];
        const reg = path_to_regexp_1.pathToRegexp(apiPath, keys);
        return {
            apiPath,
            reg,
            keys,
            method,
            result
        };
    });
}
exports.parseMockApis = parseMockApis;
function getMockApis({ appPath, mocks }) {
    const mockConfigs = getMockConfigs({ appPath, mocks });
    return parseMockApis(mockConfigs);
}
exports.getMockApis = getMockApis;
function createMockMiddleware({ appPath, mocks, chokidar }) {
    const mockDir = path.join(appPath, exports.MOCK_DIR);
    const watcher = chokidar.watch(mockDir, { ignoreInitial: true });
    let mockApis = getMockApis({ appPath, mocks });
    watcher.on('all', () => {
        mockApis = getMockApis({ appPath, mocks });
    });
    process.once('SIGINT', async () => {
        await watcher.close();
    });
    return (req, res, next) => {
        const { path: reqPath, method: reqMethod } = req;
        let matched = false;
        mockApis.forEach(mock => {
            const { method, reg, keys } = mock;
            if (method.toUpperCase() === reqMethod.toUpperCase()) {
                const match = reg.exec(reqPath);
                if (match) {
                    const params = {};
                    for (let i = 0; i < keys.length; i++) {
                        const keyItem = keys[i];
                        const name = keyItem.name;
                        const matchVal = decodeURIComponent(match[i + 1]);
                        if (matchVal) {
                            params[name] = matchVal;
                        }
                    }
                    req.params = params;
                    matched = mock;
                }
            }
        });
        if (matched) {
            const { result } = matched;
            if (typeof result === 'object') {
                bodyParser.json()(req, res, () => {
                    res.json(result);
                });
            }
            else if (typeof result === 'string') {
                bodyParser.text()(req, res, () => {
                    res.send(result);
                });
            }
            else if (typeof result === 'function') {
                result(req, res, next);
            }
            else {
                next();
            }
        }
        else {
            next();
        }
    };
}
exports.createMockMiddleware = createMockMiddleware;
//# sourceMappingURL=utils.js.map