import React, {useState, useEffect,ChangeEvent} from 'react'
import {Row, Col, Input, Button, message, Table, Progress, Space} from 'antd'
import {uploadRequest, verifyRequest, mergeRequest} from '../api/upload/'
import {createChunks, allowUpload, calculateHash} from '../utils'
import styles from './index.module.css'
enum UploadStatus {
    INIT,
    PAUSE,
    UPLOADING
}
export interface Part {
    chunk: Blob,
    size: number,
    filename?: string,
    chunk_name?: string
    loaded?: number,
    percent?: number,
    xhr?: XMLHttpRequest
}
const Upload: React.FC = () => {
    let [uploadStatus, setUploadStatus] = useState<UploadStatus>(UploadStatus.INIT)
    let [currentFile, setCurrentFile] = useState<File>()
    let [objectURL, setObjectURL] = useState<string>('')
    let [hashPercent, setHashPercent] = useState<number>(0)
    let [filename, setFilename] = useState<string>('')
    let [partList, setPartList] = useState<Part[]>([])
    useEffect(() => {
        if(currentFile) {
            // let objectURL = window.URL.createObjectURL(currentFile!)
            // setObjectURL(objectURL)
            // return () => window.URL.revokeObjectURL(objectURL)  
            const reader = new FileReader()
            reader.addEventListener('load', () => setObjectURL(reader.result as string))
            reader.readAsDataURL(currentFile)    
        }
    }, [currentFile])
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        let file: File = event.target.files![0]
        setCurrentFile(file)
    }
    function reset() {
        setUploadStatus(UploadStatus.INIT)
        setHashPercent(0)
        setPartList([])
        setFilename('')
    }
    async function handleUpload() {
        if(!currentFile) {
            return message.error('您未选择文件')
        }
        if(!allowUpload(currentFile)) {
            return message.error('不合法的文件类型')
        }
        /* form-data 上传
        const formData = new FormData()
        formData.append('chunk', currentFile)
        formData.append('filename', currentFile.name)
        let result = await request({
            url: '/upload',
            method: 'POST',
            data: formData
        })
        message.success('上传成功')
        */
       /*
       分片上传
       */
      setUploadStatus(UploadStatus.UPLOADING)
      let partList: Part[] = createChunks(currentFile)
      /**计算哈希值，秒传功能 */
      let fileHash = await calculateHash(partList, setHashPercent)
      let lastDotIndex = currentFile.name.lastIndexOf('.')
      let extName = currentFile.name.slice(lastDotIndex)
      let filename = `${fileHash}${extName}`
      setFilename(filename)
      partList.forEach((item: Part, index) => {
         item.filename = filename
         item.chunk_name = `${filename}-${index}`
         item.loaded = 0
         item.percent = 0
      })
      /**
     partList = partList.map(({chunk, size}, index) => ({
            filename,
            chunk_name: `${filename}-${index}`,
            chunk,
            size
      }))
       */
      setPartList(partList)
      await uploadParts(partList, filename)
    }
    async function uploadParts(partList: Part[], filename: string) {
        let {needUpload, uploadList} = await verifyRequest(filename)
        if(!needUpload) {
            message.success('秒传成功')
            return reset()
        }
        try {
            let requests = uploadRequest(partList, uploadList, filename, setPartList)
            await Promise.all(requests)
            await mergeRequest(filename)
            message.success('上传成功')
            reset()
        } catch (error) {
            message.error('上传失败或暂停')
            // uploadList(partList, filename)
        }
    }
    async function handlePause() {
        partList.forEach((part: Part) => part.xhr ?. abort())
        setUploadStatus(UploadStatus.PAUSE)
    }
    async function handleResume() {
        setUploadStatus(UploadStatus.UPLOADING)
        await uploadParts(partList, filename)
    }
    const columns = [
        {
            title: '切片名称',
            dataIndex: 'chunk_name',
            key: 'chunk_name',
            width: '30%'
        },
        {
            title: '进度',
            dataIndex: 'percent',
            key: 'percent',
            width: '60%',
            render: (value: number) => {
                return <Progress percent={value}/>
            }
        }
    ]
    /**
     * 总进度 = 每一个切片传输进度总和 / 切片数量
     */
    const totalPercent = partList.length > 0
        ? Number(
            (
                partList.reduce(
                    (acc: number, curr: Part) => acc + curr.percent!
                    ,0
                ) 
                / partList.length 
            )
            .toFixed(2)
          )
        : 0
    const uploadProgress = uploadStatus !== UploadStatus.INIT ? (
        <>
            <Row>
                <Col span={2}>
                    Hash计算进度：
                </Col>
                <Col span={22}>
                    <Progress percent={hashPercent} />
                </Col>
            </Row>
            <Row>
                <Col span={2}>
                    切片上传进度：
                </Col>
                <Col span={22}>
                    <Progress percent={totalPercent} />
                </Col>
            </Row>
            <Table
                bordered
                columns={columns}
                dataSource={partList}
                rowKey={row => row.chunk_name!}
            />

        </>
    ) : null
    return (  
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}> 
            <Row>
                <Col span={12}>
                    <Button type="primary" className={styles['select-file']} disabled={uploadStatus !== UploadStatus.INIT}>
                        {currentFile ? currentFile.name : 'Select Files'}
                        <Input type="file" className={styles['input-file']} onChange={handleChange}/>
                    </Button>
                    {
                        uploadStatus === UploadStatus.INIT &&  
                        <Button type="primary" onClick={handleUpload} style={{marginLeft: 10}}>上传</Button>
                    }
                    {
                        uploadStatus === UploadStatus.UPLOADING &&  
                        <Button type="primary" onClick={handlePause} style={{marginLeft: 10}}>暂停</Button>
                    }
                    {
                        uploadStatus === UploadStatus.PAUSE &&
                        <Button type="primary" onClick={handleResume} style={{marginLeft: 10}}>恢复</Button>  
                    }
                </Col>
                <Col span={12}>
                    {objectURL && <img src={objectURL} style={{width: 100}}/>}
                </Col>
            </Row>
            {uploadProgress}
        </Space>
    )
}
export default Upload