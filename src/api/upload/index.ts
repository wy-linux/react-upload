import {request} from '../../utils/request'
import {Part, Uploaded} from './model'
export async function verifyRequest(filename: string): Promise<any> {
    return await request({
        url: `/verify/${filename}`
    })
}

export async function mergeRequest(filename: string): Promise<any> {
    return await request({
        url: `/merge/${filename}`
    })
}

export function uploadRequest(partList: Part[], uploadList: Uploaded[], filename: string, setPartList: Function) {
    return partList
    .filter((part: Part) => {
        let uploadFile = uploadList.find(item => item.filename === part.chunk_name)
        if(!uploadFile) {
            part.loaded = 0
            part.percent = 0
            return true
        } 
        if(uploadFile.size < part.chunk.size) {
            part.loaded = uploadFile.size
            part.percent = Number((part.loaded / part.chunk.size * 100).toFixed(2))
            return true
        }
        return false
    })
    .map((part: Part) => request({
        url: `/upload/${filename}/${part.chunk_name}/${part.loaded}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream'
        },
        setXHR: (xhr: XMLHttpRequest) => part.xhr = xhr,
        onProgress: (event: ProgressEvent) => {
            part.percent = Number(((part.loaded! + event.loaded) / part.chunk.size * 100).toFixed(2))
            setPartList([...partList])
        },
        data: part.chunk.slice(part.loaded)
    }))
}

