// All of the Node.js APIs are available in the preload process.

const { ipcRenderer, contextBridge } = require("electron/renderer");
const fs = require("fs");
// const Store = require('electron-store');
// const store = new Store();
// import settings from "electron-settings";

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

		// Kinda like on load
		// change to onload later

		var imgGrid = document.getElementById("img-grid");
		var imgCount = imgGrid.childElementCount;

		if (imgCount == 1) {
			// store.set("IMAGE_SET",false);
			setSettingsImageSet(false);
		}
	});

	ipcRenderer.on("SET_IMAGES", (event, arg) => {
		ipcRenderer.invoke("GET_SETTINGS_IMAGE_SET").then((isSet) => {
			//console.log(isSet);
			if (!isSet) {
				var imgGrid = document.getElementById("img-grid");
				var plsPress = document.getElementById("pls-press");
				plsPress.remove();
				sendConsoleMsg("SETTING IMAGES");
				arg.forEach((path) => {
					var temp = document.getElementsByTagName("template")[0];
					var clon = temp.content.cloneNode(true);
					clon.children[0].children[0].src = "../tmp/combined/" + path;

					clon.children[0].children[0].addEventListener("click", (evt) => {
						handleImageClick(evt.currentTarget);
					});
					imgGrid.appendChild(clon);
				});
				// store.set("IMAGE_SET",true);
				setSettingsImageSet(true);
			}
		});
	});

	ipcRenderer.on("GOT_REPO", (event) => {
		setImages();
	});

	ipcRenderer.on("DEBUG_MSG", (event, arg) => {
		console.log(arg);
		let date = new Date();
		var time = `[${date.getHours()}:${date.getMinutes()}:${date
			.getSeconds()
			.toLocaleString("en-US", {
				minimumIntegerDigits: 2,
				useGrouping: false,
			})}] => `;
		var consoleMsg = document.getElementById("console-msg");
		var li = document.createElement("li");
		li.appendChild(document.createTextNode(time + arg));
		consoleMsg.appendChild(li);
		var con = document.getElementById("console-container");
		con.scrollTop = con.scrollHeight;
	});

	ipcRenderer.on("FILES_AVAILABLE", (event) => {
		setImages();
	});

	ipcRenderer.on("FILES_NOT_AVAILABLE", (event) => {
		downloadFromGithub();
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
			downloadFromGithub();
		},
		deleteFiles: () => {
			deleteFiles();
		},
		selectFavourites: () => {
			selectFavourites();
		},
		setWallpaper: () => {
			setWallpaper();
		},
		checkFiles: () => {
			checkFiles();
		},
		showPreview: () => {
			showPreview();
		},
	});

	setVersionNumber();
});

// Utils

function sendConsoleMsg(msg) {
	ipcRenderer.send("DEBUG_MSG", msg);
}

function downloadFromGithub() {
	sendConsoleMsg("CLONING REPO");
	ipcRenderer.send("GET_REPO");
}

function deleteFiles() {
	sendConsoleMsg("DELETING FILES");
	ipcRenderer.invoke("GET_PATH").then((arg) => {
		const path = arg + "/tmp";
		fs.rmSync(path, { recursive: true, force: true });
		sendConsoleMsg("DELETED FILES");
	});
}

function selectFavourites() {
	ipcRenderer.send("SELECT_FILES");
}

function setImages() {
	//console.log("setimages");
	ipcRenderer.send("GET_IMAGES");
}

function checkFiles() {
	ipcRenderer.send("CHECK_FILES");
	//console.log("Check was pressed")
	var deleteBtn = document.getElementById("Delete");
	var setBtn = document.getElementById("Set");
	var previewBtn = document.getElementById("Preview");
	deleteBtn.disabled = false;
	setBtn.disabled = false;
	previewBtn.disabled = false;
}

function setSettingsImageSet(val) {
	ipcRenderer.send("SET_SETTINGS_IMAGE_SET", val);
}

function setWallpaper() {
	ipcRenderer.invoke("GET_CUR_SELECTED_IMAGE").then((pathToWallpaper) => {
		sendConsoleMsg(`SETTING WALLPAPER ${pathToWallpaper}`);
		ipcRenderer.invoke("GET_CURRENT_WALLPAPER").then((arg) => {
			//console.log(arg);
			ipcRenderer.send("SET_WALLPAPER", pathToWallpaper);
		});
	});
}

function handleImageClick(img) {
	ipcRenderer.send("SET_CUR_SELECTED_IMAGE", img.src);

	var imageGridChildren = document.getElementById("img-grid").children;

	for (var i = 0; i < imageGridChildren.length; i++) {
		imageGridChildren[i].children[0].style.filter = "none";
	}

	img.style.filter = "blur(3px)";
}

function showPreview() {
	ipcRenderer.invoke("GET_CUR_SELECTED_IMAGE").then((pathToWallpaper) => {
		sendConsoleMsg(`SETTING WALLPAPER PREVIEW ${pathToWallpaper}`);
		ipcRenderer.send("OPEN_PREVIEW", pathToWallpaper);
	});
}
