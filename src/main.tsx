import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";
import { WalletProvider } from "./wallet/WalletProvider";

import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>,
);

