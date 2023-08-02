/* Main Progress of Kanban Desktop */

const { app ,BrowserWindow, Menu , shell, ipcRenderer,ipcMain, nativeTheme} = require('electron')
const dialog = require('electron').dialog;
const path = require('path');
require('@electron/remote/main').initialize(); //初始化dialog renderer
const { PARAMS, VALUE,  MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('mica-electron');
var packageGet = require("./package.json");
var print_map = null;var printWindow = null;

function createWindow () {
    //获取屏幕分辨率
    var screenElectron = require('electron').screen;
    var screenwidthcalc = Math.min(parseInt(screenElectron.getPrimaryDisplay().workAreaSize.width),parseInt(screenElectron.getPrimaryDisplay().workAreaSize.height))
    // 创建主程序浏览器窗口
    const win = new BrowserWindow({
      width:  parseInt(screenwidthcalc*(1)),
      height: parseInt(screenwidthcalc*(0.85)),
      minWidth: 500,
      minHeight: 600,
      alwaysOnTop: false,        //不置顶显示
      transparent: false,        //底部透明
      frame: true,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#202020",
        symbolColor: "white", },
      maximizable: true,
      minimizable: true,
      resizable: true,           //窗口可调节大小
      icon: path.join(__dirname, './assets/app.ico'),
      webPreferences: {
        devTools: true,
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
        webviewTag: true,
        zoomFactor: 1
      }
    })
  
    // win.setAcrylic();     // Acrylic window
    // 并且为你的应用加载index.html
    win.loadFile('index.html');
    require("@electron/remote/main").enable(win.webContents)

    // win.webContents.openDevTools();

// // alternatively use these to
// // dynamically change vibrancy
// win.setVibrancy([options])
// // or
// setVibrancy(win, [options])

}

// Electron会在初始化完成并且准备好创建浏览器窗口时调用这个方法
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(createWindow)

//当所有窗口都被关闭后退出
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

//设置任务栏快速任务
app.setUserTasks([
  {
    program: process.execPath,
    arguments: '--new-map',
    iconPath: path.join(__dirname, './assets/app.ico'),
    iconIndex: 0,
    title: '一键出图',
    description: '一键生成藏宝图到桌面'
  }
])
// 您可以把应用程序其他的流程写在在此文件中
// 代码也可以拆分成几个文件，然后用 require 导入。

//打印设置(窗口打印)
function printWeb() {
  printWindow = new BrowserWindow({
    title: '菜单打印',
    show: true,
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#202020",
      symbolColor: "white", },
    maximizable: true,
    minimizable: true,
    resizable: true,           //窗口可调节大小
    icon: path.join(__dirname, './assets/app.ico'),
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  })
  printWindow.loadFile('./print.html');
  // printWindow.webContents.openDevTools();
}

ipcMain.on('print-start', (event, obj) => {
  console.log('print-start')
  print_map = obj;
  printWeb();
})

ipcMain.on('printdata', (event, obj) => {
  console.log('print data send')
  printWindow.webContents.send('printdata', print_map);
})

ipcMain.on('printact', (event, obj) => {
  console.log('print action')
  printWindow.webContents.print({
    silent: false,
    printBackground: false,
    deviceName:'',
    margins: 'center'
  },
  (success, errorType) => {
    if (!success) console.log(errorType)
    else printWindow.close();
  });
})