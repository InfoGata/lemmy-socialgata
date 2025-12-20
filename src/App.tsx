import { useState, useEffect } from "preact/hooks";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { MessageType, UiMessageType } from "./shared";

const sendUiMessage = (message: UiMessageType) => {
  parent.postMessage(message, "*");
};

const App = () => {
  const [instance, setInstance] = useState("https://lemmy.ml");

  useEffect(() => {
    const onMessage = (event: MessageEvent<MessageType>) => {
      switch (event.data.type) {
        case "info":
          setInstance(event.data.instance);
          break;
      }
    };

    window.addEventListener("message", onMessage);
    sendUiMessage({ type: "check-info" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const saveSettings = () => {
    sendUiMessage({ type: "save", instance });
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md">
      <h1 className="text-xl font-bold">Lemmy Plugin Settings</h1>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">Default Instance</h2>
        <p className="text-sm text-muted-foreground">
          Set the default Lemmy instance to use when browsing. You can also browse other instances via the instance selector in the app.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Instance URL</label>
        <Input
          placeholder="https://lemmy.ml"
          value={instance}
          onChange={(e: any) => {
            const value = (e.target as HTMLInputElement).value;
            setInstance(value);
          }}
        />
      </div>

      <Button onClick={saveSettings}>Save</Button>

      <div className="text-sm text-muted-foreground mt-4">
        <h3 className="font-medium mb-2">Popular Instances:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><a href="https://lemmy.ml" target="_blank">lemmy.ml</a> - The original Lemmy instance</li>
          <li><a href="https://lemmy.world" target="_blank">lemmy.world</a> - One of the largest instances</li>
          <li><a href="https://lemm.ee" target="_blank">lemm.ee</a> - EU-based instance</li>
          <li><a href="https://programming.dev" target="_blank">programming.dev</a> - Programming focused</li>
          <li><a href="https://sh.itjust.works" target="_blank">sh.itjust.works</a> - General purpose instance</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
