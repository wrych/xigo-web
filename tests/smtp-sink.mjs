import { createServer } from "node:net";

/** An SMTP server on a free local port that accepts every mail and keeps it
 * in `mails` ({ from, to, data }); `failNext()` refuses the next one. */
export async function smtpSink() {
  const mails = [];
  let refuse = false;
  const server = createServer((socket) => {
    let buffer = "";
    let mail;
    let inData = false;
    const reply = (line) => socket.write(`${line}\r\n`);
    reply("220 sink ready");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      for (;;) {
        if (inData) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end < 0) return;
          mail.data = buffer.slice(0, end).replace(/^\.\./gm, ".");
          buffer = buffer.slice(end + 5);
          inData = false;
          if (refuse) {
            refuse = false;
            reply("554 refused by the test");
          } else {
            mails.push(mail);
            reply("250 queued");
          }
          continue;
        }
        const end = buffer.indexOf("\r\n");
        if (end < 0) return;
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const verb = line.slice(0, 4).toUpperCase();
        if (verb === "EHLO" || verb === "HELO") reply("250 sink");
        else if (verb === "MAIL") {
          mail = { from: /<([^>]*)>/.exec(line)?.[1], to: [], data: "" };
          reply("250 ok");
        } else if (verb === "RCPT") {
          mail.to.push(/<([^>]*)>/.exec(line)?.[1]);
          reply("250 ok");
        } else if (verb === "DATA") {
          inData = true;
          reply("354 go ahead");
        } else if (verb === "QUIT") {
          reply("221 bye");
          socket.end();
        } else reply("250 ok");
      }
    });
    socket.on("error", () => {});
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    port: server.address().port,
    mails,
    failNext: () => {
      refuse = true;
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
