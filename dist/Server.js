"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cors = require("cors");
const express = require("express");
const getPort = require("get-port");
const http = require("http");
const https = require("https");
const helper_1 = require("@tarojs/helper");
class Server {
    constructor(options) {
        this.app = express();
        this.isHttps = options.https || false;
        this.port = options.port || 9527;
        this.host = options.host || '127.0.0.1';
        this.setMiddlewares(options.middlewares);
        this.createServer();
    }
    setMiddlewares(middlewares) {
        if (middlewares && middlewares.length) {
            middlewares.forEach(middleware => {
                this.app.use(middleware);
            });
        }
    }
    createServer() {
        this.app.use(cors());
        if (this.isHttps) {
            this.listenServer = https.createServer(this.app);
        }
        else {
            this.listenServer = http.createServer(this.app);
        }
    }
    async start() {
        const port = await getPort({ port: this.port });
        const protocol = this.isHttps ? 'https://' : 'http://';
        this.listenServer.listen(port, this.host, () => {
            console.log(helper_1.chalk.green(`数据 mock 服务已启动，Server 地址 ${protocol}${this.host}:${port}`));
        });
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map