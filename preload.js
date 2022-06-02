// All of the Node.js APIs are available in the preload process.

const { ipcRenderer, contextBridge } = require("electron/renderer");
const fs = require("fs");

// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
	// IPC
	ipcRenderer.on("SET_VERSION", (event, arg) => {
		const appVersion = document.getElementById("app-version");
		appVersion.innerText = arg;

		for (const type of ["chrome", "node", "electron"]) {
			replaceText(`${type}-version`, `${type} ${process.versions[type]}`);
		}

		sendConsoleMsg("SET VERSION");
	});

	ipcRenderer.on("SET_IMAGES", (event, arg) => {
		sendConsoleMsg("SETTING IMAGES")
		var imgGrid = document.getElementById("img-grid");
		arg.forEach((path) => {
			var temp = document.getElementsByTagName("template")[0];
			var clon = temp.content.cloneNode(true);
			clon.children[0].children[0].src = "../tmp/combined/"+path;
			imgGrid.appendChild(clon);
		});
	});

	ipcRenderer.on("CLONED_REPO", (event) => {
		sendConsoleMsg("CLONED REPO");
	});

	ipcRenderer.on("DEBUG_MSG", (event, arg) => {
		console.log(arg);
		let date = new Date();
		var time = `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] => `;
		var consoleMsg = document.getElementById("console-msg");
		consoleMsg.innerText = time + arg;
	});

	// Utils
	const setVersionNumber = () => {
		ipcRenderer.send("SET_VERSION");
	};

	const replaceText = (selector, text) => {
		const element = document.getElementById(selector);
		if (element) element.innerText = text;
	};

	contextBridge.exposeInMainWorld("API", {
		downloadFromGithub: () => {
			sendConsoleMsg("CLONING REPO");
			ipcRenderer.send("GET_REPO");
		},
		deleteFiles: () => {
			sendConsoleMsg("DELETING FILES");
			ipcRenderer.invoke("GET_PATH").then((arg) => {
				const path = arg + "/tmp";
				fs.rmSync(path, { recursive: true, force: true });
				sendConsoleMsg("DELETED FILES");
			});
		},
		selectFavourites: () => {
			ipcRenderer.send("SELECT_FILES");
		},
		setImages:() => {
			ipcRenderer.send("GET_IMAGES");
		}
	});

	setVersionNumber();
});

// Utils

function sendConsoleMsg(msg) {
	ipcRenderer.send("DEBUG_MSG", msg);
}
