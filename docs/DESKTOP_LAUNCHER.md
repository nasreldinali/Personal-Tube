# macOS desktop launcher

Run `npm run desktop:install` from the project folder once. This creates **PersonalTube.app** on your Desktop, using the installed Node.js executable and project location. No administrator password or extra dependency is needed. It is a named application bundle that starts Node directly, not an AppleScript applet. The installer refuses to replace an existing desktop app. Move that app aside before reinstalling if you move the project or replace Node.js.

Double-click the desktop app, or drag it to your Dock for one-click opening. No Terminal window appears. The launcher first checks the version-1 `/health` response at `http://127.0.0.1:4173`:

- A ready PersonalTube instance is reused without starting another server.
- With no listener, a detached server starts and the launcher waits for readiness before opening the browser.
- Another service, an unknown health version, or a startup failure produces a macOS alert. It never stops another process to free the port.
- The desktop shortcut uses Google Chrome. It selects an existing PersonalTube tab, restores its window if minimized, and brings it forward without reloading or changing its route. Only if no matching tab exists does it open a new one. Both `127.0.0.1:4173` and `localhost:4173` are recognized; lookalike hosts or other ports are not. Existing duplicate tabs are left untouched.

macOS may ask permission for **PersonalTube to control Google Chrome** under **System Settings → Privacy & Security → Automation**. This lets the shortcut select an existing tab. Accessibility and Full Disk Access are not required. The launcher reads tab addresses only to find the local app; it does not read page contents, execute webpage JavaScript, export browsing history, or close tabs. Denial or failure shows an error rather than falling back to another browser or creating a duplicate tab. Chrome must be installed; for another browser, open the local address manually. Already-installed shortcuts pick up this change from the project folder without reinstallation.

The launch check is bounded to forty readiness attempts. Closing the browser does not stop a server started by this shortcut. It remains running until logout/restart, or until you stop that server process with Activity Monitor. Nothing is added to login items. An instance already running in Terminal keeps its original lifetime.

The installer creates only the desktop app and a temporary build directory, which it removes afterwards. The app contains device-specific paths and the installation search path for your existing analysis CLIs; do not redistribute that generated app. Each person should install their own shortcut from the source repository. It contains no copied API keys or account credentials. The source launcher has no model calls, paid API fallback or sign-in/sign-out operations.

The existing `npm start`, `npm run open` and `Start PersonalTube.command` remain available. `npm start` still reports a port conflict if run twice; the desktop app handles reuse automatically.
