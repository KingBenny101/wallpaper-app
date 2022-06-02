// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

window.addEventListener('load',()=>{
    var cloneBtn = document.getElementById("Clone");
    cloneBtn.onclick = ()=>{
        window.API.downloadFromGithub();
    }

    var locateBtn = document.getElementById("Locate");
    locateBtn.onclick = ()=>{
        window.API.deleteFiles();
    }

    var favouritesBtn = document.getElementById("Favourites");
    favouritesBtn.onclick = ()=>{
        window.API.selectFavourites();
    }
    
    var setBtn = document.getElementById("Set");
    setBtn.onclick = ()=>{
        window.API.setImages();
    }
})
