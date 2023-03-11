interface Options{
   method?: string,
   url: string,
   baseURL?: string,
   headers?: any,
   data?: any,
   setXHR?: any,
   onProgress?: any
}
const defaultOptions = {
    method: 'GET',
    baseURL: 'http://localhost:8000',
    headers: {},
    data: {}
}
export function request(options: Options) {
    options = {
        ...defaultOptions,
        ...options, 
        headers: {
           ...defaultOptions.headers,
           ...(options.headers || {})
        }
    }
    return new Promise((resolve: Function, reject: Function) => {
        let xhr = new XMLHttpRequest()
        xhr.open(options.method!, options.baseURL + options.url)
        for(let key in options.headers) {
            xhr.setRequestHeader(key, options.headers[key])
        }
        xhr.responseType = 'json'
        xhr.upload.onprogress = options.onProgress
        xhr.onreadystatechange = function () {
            if(xhr.readyState === 4) {
                if(xhr.status === 200) {
                    resolve(xhr.response)
                } else {
                    reject(xhr.response)
                }
            }
        }
        if(options.setXHR) {
            options.setXHR(xhr)
        }
        xhr.send(options.data)
    })
}