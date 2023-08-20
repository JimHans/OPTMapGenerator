// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { app , Menu , shell,  nativeTheme,clipboard,nativeImage,ipcRenderer} = nodeRequire('electron'); //?使用electron
const { dialog } = nodeRequire('@electron/remote')                   //?引入remote.dialog 对话框弹出api
let webContents = nodeRequire('@electron/remote').getCurrentWebContents();
var scale_size = 1;var imgGray = null; var img = null; //?全局图片对象变量

//! 初始化
window.addEventListener('DOMContentLoaded', () => {
    // Preload.js 获取软件版本信息
    var package = nodeRequire("./package.json");
    for (const versionType of['electron', 'node']) {
        document.getElementById(`${versionType}-version`).innerText = process.versions[versionType]
    }
    document.getElementById("App-version").innerHTML=package.name+" v"+package.version; // Get Version
    document.getElementById("Build-version").innerHTML=package.buildinf; // Get Build Version

    // Preload.js 初始化藏宝图
    const canvas = document.getElementById('MapCanvas');
    const ctx = canvas.getContext('2d');

    img = new Image();
    img.onload = function() {
    // 图片加载完成后，在canvas上绘制图片
    scale_size = $('#MapGenerate').width()/6400
    ctx.drawImage(img, 0, 0);};
    img.src = './assets/matchmap.png';
    $("#MapCanvas").attr("width", 6400);
    $("#MapCanvas").attr("height", 6400);
    $("#MapCanvas").attr("transform", "scale("+scale_size+")");

    const canvasGray = document.getElementById('MapCanvasGray');
    const ctxGray = canvasGray.getContext('2d');

    imgGray = new Image();
    imgGray.onload = function() {
    // 图片加载完成后，在canvas上绘制图片
    ctxGray.drawImage(imgGray, 0, 0);};
    imgGray.src = './assets/matchmap.png';
    $("#MapCanvasGray").attr("width", 6400);
    $("#MapCanvasGray").attr("height", 6400);
    $("#MapCanvasGray").attr("transform", "scale("+scale_size+")");
});


// !成功、失败、信息横幅提示调用函数
function OKErrorStreamer(type,text,if_reload) {
    if(type=="OK") {
        document.getElementById("OKStreamer").innerHTML="✅ "+text.toString();
        document.getElementById("OKStreamer").style.display="block";
        if(if_reload == 1) {setTimeout(function() { ipcRenderer.send('MainWindow','Refresh'); }, 4000);}
        else{setTimeout(function() { document.getElementById("OKStreamer").style.display="none"; }, 4000);}
    }
    else if(type=="MessageOn") {
        document.getElementById("MessageStreamer").style.animation="Ascent-Streamer-Down 0.4s ease";
        document.getElementById("MessageStreamer").innerHTML="<div style='position: absolute;margin-left: 5px;animation: Element-Rotation 1.5s linear infinite;aspect-ratio: 1;height: 70%;top: 15%;'><svg t='1674730870243' class='icon' viewBox='0 0 1024 1024' version='1.1' xmlns='http://www.w3.org/2000/svg' p-id='2939' style='width: 100%;height: 100%;'><path d='M277.333333 759.466667C213.333333 695.466667 170.666667 610.133333 170.666667 512c0-187.733333 153.6-341.333333 341.333333-341.333333v85.333333c-140.8 0-256 115.2-256 256 0 72.533333 29.866667 140.8 81.066667 187.733333l-59.733334 59.733334z' fill='#111' p-id='2940'></path></svg></div>"+text.toString();
        document.getElementById("MessageStreamer").style.display="block";
    }
    else if(type=="MessageOff") {
        document.getElementById("MessageStreamer").style.display="none";
    }
    else {
        document.getElementById("ErrorStreamer").innerHTML="⛔ "+text.toString();
        document.getElementById("ErrorStreamer").style.display="block";
        if(if_reload == 1) {setTimeout(function() { ipcRenderer.send('MainWindow','Refresh'); }, 4000);}
        else{setTimeout(function() { document.getElementById("ErrorStreamer").style.display="none"; }, 4000);}
    }
    
}


//! 象限计算函数
function getQuadrant(point) {
    const x = point[0] - 0;
    const y = point[1] - 0;
    if (x >= 0 && y >= 0) {
    return 0;
    } else if (x < 0 && y >= 0) {
    return 1;
    } else if (x < 0 && y < 0) {
    return 2;
    } else {
    return 3;
    }
}


//! 地图绘制函数
function MapGenerate() {
    const center_x = 3200;const center_y = 3200; //中心点坐标
    const canvas = document.getElementById('MapCanvas');
    const ctx = canvas.getContext('2d');
    const canvasGray = document.getElementById('MapCanvasGray');
    const ctxGray = canvasGray.getContext('2d');
    ctxGray.drawImage(imgGray, 0, 0);
    // const start_x = -2100, start_y = -2100, end_x = 2100, end_y = 2100;
    const cell = 420; //每个格子的边长
    let forbidden_area = [[1,-1],[2,-1],[1,1],[2,1],[3,1],[3,2],[4,2],[4,3],[5,3],[5,4],[4,4],[4,5],[5,5],
        [-5,-1],[5,1],[-2,2],[2,-2],[-3,3],[3,-3],[2,3],[-2,-3],[1,4],[-1,-4],[-1,4],[1,-4],[-2,5],[2,-5],[-4,5],[4,-5]] //禁止生成区域
    const numbers = [-5,-4,-3,-2,-1,1,2,3,4,5]; //生成随机数的数组
    let randomx = 0, randomy = 0; //存储随机生成坐标数
    let quadrant_mem = [[0,0,0,0],[0,0,0,0]] //存储四个象限是否已生成宝藏


    //清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //绘制背景

    // 图片加载完成后，在canvas上绘制图片
    ctx.drawImage(img, 0, 0);
    let index = 0;
    let red_fake = 0,blue_fake = 0;
    while(index<4){
        //生成红方宝藏,对应蓝方宝藏
        // 生成一个1到10之间的随机整数
        const array = new Uint32Array(1);
        while(1){
            window.crypto.getRandomValues(array);
            randomx = array[0] % numbers.length; randomx = numbers[randomx];
            window.crypto.getRandomValues(array);
            randomy = array[0] % numbers.length; randomy = numbers[randomy];
            let isIncludedR = forbidden_area.some(subArr => subArr.every((val, i) => val === [randomx, randomy][i]));
            let isIncludedB = forbidden_area.some(subArr => subArr.every((val, i) => val === [-randomx, -randomy][i]));
            let isQuadrantR = quadrant_mem[0][getQuadrant([randomx, randomy])];
            let isQuadrantB = quadrant_mem[1][getQuadrant([-randomx, -randomy])];
            if (!isIncludedR && !isIncludedB && !isQuadrantR && !isQuadrantB) break;
        }
        let revise_cellx = randomx>0 ? -cell/2 : cell/2;
        let revise_celly = randomy>0 ? cell/2 : -cell/2;
        //绘制红方宝藏
        ctx.fillStyle = '#ff0000';ctx.beginPath();
        ctx.arc(center_x+randomx*cell+revise_cellx, center_y-randomy*cell+revise_celly, 100, 0, 2 * Math.PI);ctx.fill();
        window.crypto.getRandomValues(array); 
        let if_fake_treas = array[0] % 2;
        /*if(index==3)*/ if(if_fake_treas==1 && red_fake==0) {ctx.fillStyle = '#f0ff00';red_fake=1;} else ctx.fillStyle = '#308430';ctx.beginPath();
        ctx.arc(center_x+randomx*cell+revise_cellx, center_y-randomy*cell+revise_celly, 50, 0, 2 * Math.PI);ctx.fill();
        //绘制红方宝藏(黑点)
        ctxGray.fillStyle = '#000000';ctxGray.beginPath();
        ctxGray.arc(center_x+randomx*cell+revise_cellx, center_y-randomy*cell+revise_celly, 100, 0, 2 * Math.PI);
        ctxGray.arc(center_x+randomx*cell+revise_cellx, center_y-randomy*cell+revise_celly, 50, 0, 2 * Math.PI);ctxGray.fill();
        //绘制蓝方宝藏
        ctx.fillStyle = '#0000ff';ctx.beginPath();
        ctx.arc(center_x+(randomx*cell+revise_cellx)*(-1), center_y+(-randomy*cell+revise_celly)*(-1), 100, 0, 2 * Math.PI);ctx.fill();
        window.crypto.getRandomValues(array); 
        let if_fake_treasb = array[0] % 2;
        /*if(index==3)*/ if(if_fake_treasb==1 && blue_fake==0) {ctx.fillStyle = '#308430';blue_fake=1;} else ctx.fillStyle = '#f0ff00';ctx.beginPath();
        ctx.arc(center_x+(randomx*cell+revise_cellx)*(-1), center_y+(-randomy*cell+revise_celly)*(-1), 50, 0, 2 * Math.PI);ctx.fill();
        //绘制蓝方宝藏(黑点)
        ctxGray.fillStyle = '#000000';ctxGray.beginPath();
        ctxGray.arc(center_x+(randomx*cell+revise_cellx)*(-1), center_y+(-randomy*cell+revise_celly)*(-1), 100, 0, 2 * Math.PI);
        ctxGray.arc(center_x+(randomx*cell+revise_cellx)*(-1), center_y+(-randomy*cell+revise_celly)*(-1), 50, 0, 2 * Math.PI);ctxGray.fill();
        
        forbidden_area.push([randomx,randomy],[randomx*(-1),randomy*(-1)]); //添加已绘制宝藏点到禁止区域
        quadrant_mem[0][getQuadrant([randomx, randomy])] = 1; //添加已绘制宝藏点到象限记录
        quadrant_mem[1][getQuadrant([-randomx, -randomy])] = 1; //添加已绘制宝藏点到象限记录
        index=index+1;
    }
    OKErrorStreamer('OK','地图生成成功！',0);
}


//! 地图保存函数
function MapSave() {
    // 保存场地地图
    const canvas = document.getElementById('MapCanvas');
    // 将canvas转换为base64编码的数据URL
    const dataURL = canvas.toDataURL('image/png');
    const ctx = canvas.getContext('2d');
    ctx.scale(1/scale_size, 1/scale_size);
    // 创建一个保存文件对话框，并将数据URL保存为文件
    dialog.showSaveDialog({ defaultPath: '场地摆放图.png' }, (filename) => {})
    .then(res=>{
        if (res.filePath) {
            const fs = nodeRequire('fs');
            const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
            fs.writeFile(res.filePath, base64Data, 'base64', (err) => {
            if (err) throw err;
            console.log('图片已保存');
            canvas.getContext('2d').scale(scale_size, scale_size);
            });
        }
    }).catch(err=>{console.log(err)});

    // 保存藏宝图
    const canvasGray = document.getElementById('MapCanvasGray');
    // 将canvas转换为base64编码的数据URL
    const dataURLGray = canvasGray.toDataURL('image/png');
    const ctxGray = canvasGray.getContext('2d');
    ctxGray.scale(1/scale_size, 1/scale_size);
    // 创建一个保存文件对话框，并将数据URL保存为文件
    dialog.showSaveDialog({ defaultPath: '藏宝图.png' }, (filename) => {})
    .then(res=>{
        if (res.filePath) {
            const fs = nodeRequire('fs');
            const base64Data = dataURLGray.replace(/^data:image\/png;base64,/, '');
            fs.writeFile(res.filePath, base64Data, 'base64', (err) => {
            if (err) throw err;
            console.log('图片已保存');OKErrorStreamer('OK','地图保存成功！',0);
            canvasGray.getContext('2d').scale(scale_size, scale_size);
            });
        }
    }).catch(err=>{console.log(err);OKErrorStreamer('Error','保存出错',0);});
}


//TODO 地图打印函数
function MapPrint(){
    // 获取要打印的元素
    const element = document.getElementById('MapCanvasGray');
    ipcRenderer.send('print-start', element.toDataURL('image/png'));
    OKErrorStreamer('OK','打印任务创建成功！',0);
}