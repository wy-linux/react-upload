import {Part} from '../upload'
import {message} from 'antd'
// const DEFAULT_SIZE = 1024 * 1024 * 100
const DEFAULT_SIZE = 1024 * 1024 * 10
export function createChunks(file: File): Part[] {
    let current = 0
    let partList: Part[] = []
    while(current < file.size) {
        let chunk = file.slice(current, current + DEFAULT_SIZE)
        partList.push({
            chunk,
            size: chunk.size
        })
        current += DEFAULT_SIZE
    }
    return partList
}
export function allowUpload(file: File) {
    let type = file.type
    const isValidFileType = type.includes('image') || type.includes('video')
    if(!isValidFileType) {
        message.error('不支持此类文件上传')
    }
    const isLessThan2G = file.size  < 1024 * 1024 * 1024 * 2
    if(!isLessThan2G) {
        message.error('文件大小不能超过2G')
    }
    return isValidFileType && isLessThan2G
}
export function calculateHash(partList: Part[], setHashPercent: Function) {
    return new Promise((resolve) => {
        let worker = new Worker('/hash.js')
        worker.postMessage({partList})
        worker.onmessage = function (event) {
            let {percent, hash} = event.data
            setHashPercent(percent)
            if(hash) {
                resolve(hash)
            }
        }
    })
}