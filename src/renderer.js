// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

window.addEventListener("load", () => {
	// var cloneBtn = document.getElementById("Clone");
	// cloneBtn.onclick = ()=>{
	//     window.API.downloadFromGithub();
	// }

	var deleteBtn = document.getElementById("Delete");
	deleteBtn.onclick = () => {
		window.API.deleteFiles();
	};

	var checkBtn = document.getElementById("Check");
	checkBtn.onclick = () => {
		window.API.checkFiles();
	};

	var setBtn = document.getElementById("Set");
	setBtn.onclick = () => {
		window.API.setWallpaper();
	};

	var previewBtn = document.getElementById("Preview");
	previewBtn.onclick = () => {
		window.API.showPreview();
	};

	deleteBtn.disabled = true;
	setBtn.disabled = true;
	previewBtn.disabled = true;
});
