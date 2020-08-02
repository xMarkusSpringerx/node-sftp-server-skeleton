import fs from "fs";
import {AuthContext, ClientInfo, Connection, Session} from "ssh2";
import * as ssh2 from "ssh2";
import {doSomeAuthorization} from "./utils";
import {InputAttributes, SFTPStream} from 'ssh2-streams';
import OPEN_MODE = SFTPStream.OPEN_MODE;
import STATUS_CODE = SFTPStream.STATUS_CODE;


new ssh2.Server({
    // Use absolute path here
    hostKeys: [fs.readFileSync('/Users/ma.springer/.ssh/id_rsa')],
    banner: "This is our server",
}, (client: Connection, info: ClientInfo) => {
    console.log(`Connection requested by ${info.ip}`);
    client.on('authentication', async (ctx: AuthContext) => {
        console.log(`User ${ctx.username} from ip ${info.ip} attempting to authenticate with method= ${ctx.method}`);

        let username: string;
        let password: string;
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

        client.on('ready', () => {
            console.log('Client authenticated!');
            client.on('session', (acceptSession: () => Session, rejectSession) => {
                const session = acceptSession();

                if (!session) {
                    client.end();
                    return;
                }

                console.log('Session started!');

                // Specific to an SFTP Connection. Also X11 or shell ... possible.
                session.on('sftp', (acceptSftp: () => SFTPStream, rejectSftp: () => boolean) => {
                    console.log('Client SFTP session');
                    const sftp = acceptSftp();

                    var openFiles: any = {};
                    var handleCount = 0;
                    sftp.on('OPEN', function (reqid, filename, flags, attrs) {
                        // only allow opening /tmp/foo.txt for writing
                        if (filename !== '/tmp/foo.txt' || !(flags & OPEN_MODE.WRITE))
                            return sftp.status(reqid, STATUS_CODE.FAILURE);
                        // create a fake handle to return to the client, this could easily
                        // be a real file descriptor number for example if actually opening
                        // the file on the disk
                        var handle = new Buffer(4);
                        openFiles[handleCount] = true;
                        handle.writeUInt32BE(handleCount++, 0);
                        sftp.handle(reqid, handle);
                        console.log('Opening file for write')
                    }).on('WRITE', function (reqid, handle, offset, data) {
                        if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0)])
                            return sftp.status(reqid, STATUS_CODE.FAILURE);
                        // fake the write
                        sftp.status(reqid, STATUS_CODE.OK);
                        var inspected = require('util').inspect(data);
                    }).on('READ', (reqID: number, handle: Buffer, offset: number, length: number) => {
                        console.info('READ', {team: username});
                    }).on('FSTAT', (reqID: number, handle: Buffer,) => {
                        console.info('FSTAT', {team: username});
                    }).on('FSETSTAT', (reqID: number, handle: Buffer) => {
                        console.info('FSETSTAT', {team: username});
                    }).on('OPENDIR', (reqID: number, path: string) => {
                        console.info('OPENDIR', {team: username});
                    }).on('READDIR', (reqID: number, handle: Buffer) => {
                        console.info('READDIR', {team: username});
                    }).on('LSTAT', (reqID: number, path: string) => {
                        console.info('LSTAT', {team: username});
                    }).on('STAT', (reqID: number, path: string) => {
                        console.info('STAT', {team: username});
                    }).on('REMOVE', (reqID: number, path: string) => {
                        console.info('REMOVE', {team: username});
                    }).on('RMDIR', (reqID: number, path: string) => {
                        console.info('READ', {team: username});
                    }).on('REALPATH', (reqID: number, path: string) => {
                        console.info('REALPATH', {team: username});
                    }).on('READLINK', (reqID: number, path: string) => {
                        console.info('READLINK', {team: username});
                    }).on('SETSTAT', (reqID: number, path: string, attrs: InputAttributes) => {
                        console.info('SETSTAT', {team: username});
                    }).on('MKDIR', (reqID: number, path: string, attrs: InputAttributes) => {
                        console.info('MKDIR', {team: username});
                    }).on('RENAME', (reqID: number, oldPath: string, newPath: string) => {
                        console.info('RENAME', {team: username});
                    }).on('SYMLINK', (reqID: number, linkpath: string, tagetpath: string) => {
                        console.info('SYMLINK', {team: username});
                    }).on('end', () => {
                        console.info('end', {team: username});
                    }).on('close', () => {
                        console.info('close', {team: username});
                    }).on('continue', (reqID: number, handle: Buffer, offset: number, length: number) => {
                        console.info('continue', {team: username});
                    }).on('CLOSE', (reqid: number, handle: Buffer) => {
                        var fnum;
                        if (handle.length !== 4 || !openFiles[(fnum = handle.readUInt32BE(0))])
                            return sftp.status(reqid, STATUS_CODE.FAILURE);
                        delete openFiles[fnum];
                        sftp.status(reqid, STATUS_CODE.OK);
                        console.log('Closing file');
                    }).on('error', (e) => {
                        console.error('An SFTP error happened: ', e);
                    });
                });

                client.on('close', () => {
                    console.info('CLOSE', {team: username});
                });

                client.on('end', (hadError: boolean) => {
                    console.info('END', {team: username});
                });

                client.on('session', (acceptOnSession: () => Session, rejectOnSession: () => boolean) => {
                    console.info('SESSION', {team: username});
                });

                client.on('rekey', () => {
                    console.info('REKEY', {team: username});
                });

                client.on('continue', () => {
                    console.info('CONTINUE', {team: username});
                });

                client.on('end', async () => {
                    // Do some cleanup here
                    console.info('Client disconnected', {team: username});
                });

                client.on('error', (err: Error) => {
                    console.error(`A client error occurred from ${info.ip}, ${err}`, {team: username});
                });

            });
        });
    });
}).listen(1234, 'localhost', function () {
    console.log('Listening on port ' + this.address().port);
});
