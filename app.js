// 引入 express 包
var express = require('express')
var router = require('./routes/router')
var pcrouter = require('./routes/pcrouter')
var fs = require('fs')
var path = require('path')
const bodyParser = require('body-parser');
// 2. 创建 你的服务器应用程序



// 就是之前的 http.createServer
var app = express()
    // post请求必须
app.use(bodyParser.json()); //数据JSON类型
app.use(bodyParser.urlencoded({ extended: false })); //解析post请求数据
// 公开指定目录 
// 只要这样做了，就可以直接通过 /public/xxx 的方式访问public 目录中的所有资源了
app.use('/public/', express.static(path.join(__dirname, './public/')))
app.use('/node_modules/', express.static(path.join(__dirname, './node_modules/')))
app.use('/upload/', express.static(path.join(__dirname, './upload/')))

/*修改服务端代码，进行全路由配置，允许跨域请求*/
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, yourHeaderFeild')
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
    if (req.method === 'OPTIONS') {
        res.sendStatus(200)
    } else {
        next()
    }
})

//这个很重要，必须要这个才能拿到图片链接，而不是进入路由
app.use(express.static('upload'))

app.use(router)
app.use(pcrouter)

app.listen(3000, "127.0.0.1", function() {
    console.log('running...')
})