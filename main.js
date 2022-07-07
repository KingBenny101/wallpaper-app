// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron/main");
const path = require("path");
const settings = require("electron-settings");
const wallpaper = require("wallpaperex");

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		resizable: false,
		enableRemoteModule: true,
		autoHideMenuBar: true,
		webPreferences: {
			enableRemoteModule: true,
			preload: path.join(__dirname, "preload.js"),
		},
	});

	// Utils

	function sendConsoleMsg(msg) {
		mainWindow.webContents.send("DEBUG_MSG", msg);
	}

	// IPC

	ipcMain.on("OPEN_PREVIEW", (event, arg) => {
		const previewWindow = new BrowserWindow({
			width: 800,
			height: 600,
			resizable: false,
			autoHideMenuBar: true,
		});
		previewWindow.loadURL(arg);

		previewWindow.webContents.on("did-finish-load", () => {
			previewWindow.setTitle("Preview");
		});
	});

	ipcMain.on("SET_CUR_SELECTED_IMAGE", (event, arg) => {
		settings.setSync("CurSelected", {
			path: arg,
		});
	});

	ipcMain.handle("GET_CUR_SELECTED_IMAGE", async (event) => {
		return settings.getSync("CurSelected.path");
	});
	ipcMain.on("SET_WALLPAPER", async (event, arg) => {
		let curWallpaper = await wallpaper.get();
		var givWallpaper = arg.split("///")[1].replace(/%20/g, " ");
		//console.log(givWallpaper);
		settings.setSync("CurWallpaper", {
			path: curWallpaper,
		});

		await wallpaper.set(givWallpaper);
	});

	ipcMain.on("SET_SETTINGS_IMAGE_SET", (event, arg) => {
		settings.setSync("Image", {
			set: arg,
		});
	});

	ipcMain.handle("GET_SETTINGS_IMAGE_SET", async (event) => {
		var val = settings.getSync("Image.set");
		return val;
	});

	ipcMain.handle("GET_SETTINGS_CURRENT_WALLPAPER", async (event) => {
		return settings.getSync("CurWallpaper.path");
	});

	ipcMain.handle("GET_CURRENT_WALLPAPER", async (event) => {
		return await wallpaper.get();
	});

	ipcMain.on("DEBUG_MSG", (event, arg) => {
		event.reply("DEBUG_MSG", arg);
	});

	ipcMain.on("SET_VERSION", (event) => {
		event.reply("SET_VERSION", app.getVersion());
	});

	ipcMain.on("GET_IMAGES", (event) => {
		const imgPath = "./tmp/combined/";
		const fs = require("fs");
		var paths = fs.readdirSync(imgPath);
		event.reply("SET_IMAGES", paths);
	});

	ipcMain.on("GET_REPO", (event) => {
		const request = require("superagent");
		const admZip = require("adm-zip");

		const fs = require("fs");

		const source =
			"https://github.com/Incalculas/wallpapers/archive/refs/heads/main.zip";

		// const source =
		// 	"https://github.com/benstindavis/course-content/archive/refs/heads/master.zip";
		const zipFile = "main.zip";

		const outputDir = "./tmp";
		sendConsoleMsg("DOWNLOADING ZIP");

		request
			.get(source)
			.on("error", function (error) {
				sendConsoleMsg(error);
			})

			.pipe(fs.createWriteStream(zipFile))

			.on("finish", function () {
				sendConsoleMsg("FINISHED CLONING");
				var zip = new admZip(zipFile);
				sendConsoleMsg("START UNZIP");
				zip.extractAllTo(outputDir, true);
				sendConsoleMsg("FINISHED UNZIP");
				fs.unlink(zipFile, () => {
					sendConsoleMsg("DELETED ZIP ");
				});

				const glob = require("glob");

				var getDirectories = function (src, callback) {
					glob(src + "/**/*.*", callback);
				};
				getDirectories(outputDir, function (err, res) {
					if (err) {
						sendConsoleMsg("Error", err);
					} else {
						var combinedFiles = outputDir + "/combined/";
						const fs = require("fs-extra");
						var numRes = res.length;
						fs.mkdirs(combinedFiles).then(() => {
							var i = 1;
							res.forEach((file) => {
								var combinedFilePath =
									combinedFiles + file.split("/").slice(-1);
								fs.move(file, combinedFilePath, (err) => {
									if (err) {
										if (err) return console.log(err);
									} else {
										sendConsoleMsg(`${i++} Moved ${file}`);
										if (i == numRes + 1) {
											sendConsoleMsg("MOVED ALL FILES");
											event.reply("GOT_REPO");
										}
									}
								});
							});
						});
					}
				});
			});
	});

	ipcMain.handle("GET_PATH", async (event) => {
		return `${app.getAppPath()}`;
	});

	ipcMain.on("SELECT_FILES", (event) => {
		const { dialog } = require("electron");

		var chosenFiles = dialog.showOpenDialogSync(mainWindow, {
			properties: ["openFile", "multiSelections"],
		});
		if (chosenFiles) {
			sendConsoleMsg(chosenFiles.toString());
		}
	});

	ipcMain.on("CHECK_FILES", (event) => {
		const outputDir = "./tmp";
		var combinedFiles = outputDir + "/combined/";
		const fs = require("fs");
		if (fs.existsSync(combinedFiles)) {
			var paths = fs.readdirSync(combinedFiles);

			if (paths.length) {
				sendConsoleMsg("FILES AVAILABLE");

				event.reply("FILES_AVAILABLE");
			} else {
				sendConsoleMsg("FILES NOT AVAILABLE");
				event.reply("FILES_NOT_AVAILABLE");
			}
		} else {
			sendConsoleMsg("FILES NOT AVAILABLE");
			event.reply("FILES_NOT_AVAILABLE");
		}
	});
	// and load the index.html of the app.
	mainWindow.loadFile("./src/index.html");

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow();
	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
	if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
