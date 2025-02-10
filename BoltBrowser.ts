type Data = { [key: string]: any };

type Callback = (data: Data) => void;

type Callbacks = {
  [key: string]: Callback[];
};

type Message = {
  type: string;
  data: { [key: string]: any };
};

export default class BoltBrowser {
  private message_callbacks: Callbacks = {};

  constructor() {
    window.addEventListener("message", (event) => {
      if (typeof event.data !== "object" || event.data.type !== "pluginMessage")
        return;

      let string = "";
      const bytes = new Uint8Array(event.data.content);
      for (let i = 0; i < bytes.byteLength; i++) {
        string += String.fromCharCode(bytes[i]);
      }

      let message = JSON.parse(string) as Message;

      if (this.message_callbacks[message.type] === undefined) {
        console.warn(`Unhandled message type: ${message.type}`);
        return;
      }

      for (const i in this.message_callbacks[message.type] ?? []) {
        this.message_callbacks[message.type][i](message.data);
      }
    });
  }

  onmessage(type: string, callback: Callback) {
    if (this.message_callbacks[type] === undefined) {
      this.message_callbacks[type] = [];
    }

    this.message_callbacks[type].push(callback);
  }

  call(endpoint: string, data: Data | void) {
    return fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    });
  }

  message(type: string, data: Data | void) {
    return this.call("https://bolt-api/send-message", { type, data });
  }

  close() {
    return this.call("https://bolt-api/close-request");
  }

  reposition() {
    return this.call("https://bolt-api/start-reposition?h=0&v=0");
  }

  resize() {
    return this.call("https://bolt-api/start-reposition?h=-1&v=-1");
  }
}
