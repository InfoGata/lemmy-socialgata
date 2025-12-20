type UiCheckInfo = {
  type: "check-info";
};

type UiSave = {
  type: "save";
  instance: string;
};

export type UiMessageType = UiCheckInfo | UiSave;

type InfoType = {
  type: "info";
  instance: string;
};

export type MessageType = InfoType;
