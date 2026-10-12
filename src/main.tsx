import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { SsoSetupGuest } from "./pages/SsoSetupGuest"

// /setup/sso is what IT opens from a setup link: a stripped-down Iris page
// outside both the Fleet and Administration shells.
const isSetupLink = window.location.pathname.startsWith("/setup/sso")

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isSetupLink ? <SsoSetupGuest /> : <App />}
  </StrictMode>
)
