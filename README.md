# Skeleton implementation of a basic sftp server written in NodeJS

Basic implementation of a sftp server written in NodeJS


SSH2 client and server modules written in pure JavaScript for node.js.
Development/testing is done against OpenSSH (7.6 currently).
So let's get started with the basic implementation with Typescript:
```
yarn add ssh2
yarn add @types/ssh2 --dev
```

That's a basic implementation which spins up an ssh server.
```
import fs from "fs";
import {AuthContext, ClientInfo, Connection} from "ssh2";
import * as ssh2 from "ssh2";

new ssh2.Server({
    // Use absolute path here
    hostKeys: [fs.readFileSync('/User/ma.springer/.ssh/id_rsa')],
    banner: "This is our server",
}, (client: Connection, info: ClientInfo) => {
    console.log(`Connection requested by ${info.ip}`);
    client.on('authentication', (ctx: AuthContext) => {
        console.log("Authentication works");
    });
}).listen(1234, 'localhost', function () {
    console.log('Listening on port ' + this.address().port);
});
```

To create a SFTP connection there are basically two possibilities to do so.
Authenticate via password or via a public key.

```
ssh devuser@localhost
````

This will either authenticate you directly with the public key or asks you for a password if the public key authentication fails.

```
client.on('authentication', async (ctx: AuthContext) => {
    console.log(`User ${ctx.username} from ip ${info.ip} attempting to authenticate with method= ${ctx.method}`);

    let username;
    let password;
    if (ctx.method === 'password') {

        username = ctx.username;
        password = ctx.password;

        try {
            await doSomeAuthorization(username, password);

            ctx.accept();
        } catch (e) {
            console.error(e);
            ctx.reject(['password']);
            client.end();
        }
    } else {
        ctx.reject(['password']);
    }
});
```

# Article
https://medium.com/@markus.springer1994/build-your-own-sftp-server-using-nodejs-d0deee0b28d4

🌟 Thanks
First of all, thank you @mscdex for this project which my work is based on.
It has made my life easier.

Resources 🧰

Here are some resources if you want to learn more about this project:
https://github.com/xMarkusSpringerx/node-sftp-server-skeleton
www.sftp.net
https://github.com/mscdex/ssh2
