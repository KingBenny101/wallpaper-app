// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron/main");
const path = require("path");
const { send } = require("process");

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		resizable: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	// Utils

	function sendConsoleMsg(msg) {
		mainWindow.webContents.send("DEBUG_MSG", msg);
	}

	// IPC

	ipcMain.on("DEBUG_MSG",(event,arg)=>{
		event.reply("DEBUG_MSG",arg);
	})

	ipcMain.on("SET_VERSION", (event) => {
		event.reply("SET_VERSION", app.getVersion());
	});

	ipcMain.on("GET_IMAGES",(event)=>{
		const imgPath = "./tmp/combined/";
		const fs = require("fs");
		var paths = fs.readdirSync(imgPath);
		event.reply("SET_IMAGES",paths);

	})

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
									}
								});
							})
						}).then(()=>{
							sendConsoleMsg("MOVED ALL FILES");
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

	// and load the index.html of the app.
	mainWindow.loadFile("./src/index.html");

	// Open the DevTools.
	mainWindow.webContents.openDevTools();
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
