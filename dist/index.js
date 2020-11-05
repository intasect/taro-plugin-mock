"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("./Server");
const utils_1 = require("./utils");
exports.default = (ctx, pluginOpts) => {
    ctx.addPluginOptsSchema(joi => {
        return joi.object().keys({
            mocks: joi.object().pattern(joi.string(), joi.object()),
            port: joi.number(),
            host: joi.string()
        });
    });
    let isFirstWatch = true;
    ctx.onBuildFinish(async ({ isWatch }) => {
        let needStart = !isWatch || isFirstWatch;
        if (needStart) {
            const { appPath } = ctx.paths;
            const { mocks, port, host } = pluginOpts;
            const { chokidar } = ctx.helper;
            const server = new Server_1.default({
                port,
                host,
                middlewares: [
                    utils_1.createMockMiddleware({
                        appPath,
                        mocks,
                        chokidar
                    })
                ]
            });
            await server.start();
        }
        isFirstWatch = false;
    });
};
//# sourceMappingURL=index.js.map