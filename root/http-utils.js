const http = require("http");

exports.httpRequest = function (host, port, method, path, postData) {
    return new Promise(
        function (resolve, reject) {
            let body = "";

            const options = {
                hostname: host,
                family: 4,
                port: port,
                path: path,
                method: method
            };

            if (method === "POST")
            {
                options.headers = {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Content-Length": Buffer.byteLength(postData)
                };
            }

            console.log("%s %s", options.method, options.path);

            const req = http.request(options, (res) => {
                res.setEncoding("utf8");

                res.on("data", (chunk) => { body += chunk; });

                res.on("end", () => {
                    if (res.statusCode === 200)
                    {
                        const json = JSON.parse(body);

                        resolve(json);
                    }
                    else
                    {
                        resolve({ error: { code: res.statusCode, message: body } });
                    }
                });
            });

            req.on("error", (e) => {
                reject(new Error("Problem with request: " + e.message));
            });

            if (method === "POST")
            {
                req.write(postData);
            }

            req.end();
        });
};
