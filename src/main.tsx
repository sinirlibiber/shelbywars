import React from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from "buffer";
import { App } from "./ui/App";
import { WalletProvider } from "./wallet/WalletProvider";

import "./styles.css";

// Shelby SDK browser bundle Buffer beklediği için global'e polyfill ediyoruz
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Buffer = (window as any).Buffer ?? Buffer;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>,
);

