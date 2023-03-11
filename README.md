### React Hook + Antd + Typescript 大文件上传组件
```shell
1. npm install  下载相关依赖
2. npm run start 启动组件
3. 后端接口：https://github.com/wy-linux/react-upload-server
```
###### 使用Web Worker + SparkMD5 根据文件内容生成hash值
- 根据内容生成hash值需要大量时间计算，为防止阻塞UI渲染线程，使用Web Worker
- Web Worker：https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers
```javascript
let worker = new Worker('/hash.js')
//......
const spark = new self.SparkMD5.ArrayBuffer()
let percent = 0
let perSize = 100 / partList.length
let buffers = await Promise.all(partList.map(({chunk, size}) => new Promise((resolve)=> {
    const reader = new FileReader()
    reader.readAsArrayBuffer(chunk)
    reader.onload = function (event) {
        percent += perSize
        self.postMessage({percent: Number(percent.toFixed(2))})
        resolve(event.target.result)
    }
})))
buffers.forEach(buffer => spark.append(buffer))
self.postMessage({percent: 100, hash: spark.end()})
```
###### 三个后端接口为组件提供服务
+ /verify获取当前已经上传的切片列表
```javascript
await request({
    url: `/verify/${filename}`
})
```
+ /upload将未上传切片列表上传
```javascript
partList
    .filter((part: Part) => {
        //过滤已经上传的切片列表
        //......
    })
    .map((part: Part) => request({
        //将每一个切片包装成 request-/upload 的promise
        url: `/upload/${filename}/${part.chunk_name}/${part.loaded}`,
        //......
    }))
```
+ /merge通知服务端合并所有上传的切片
```javascript
await request({
    url: `/merge/${filename}`
})
```
