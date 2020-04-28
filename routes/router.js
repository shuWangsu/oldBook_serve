var express = require('express')
var fs = require('fs')
var path = require('path')
var create = require('../public/js/createdir')
    // 发网络请求
var request = require('request')
    // 处理上传图片
var formidable = require("formidable")
    // 处理时间
var moment = require('moment')
    // 生成随机字符串
var stringRandom = require('string-random')
var router = express.Router()
var mysql = require('../mysql/connection')
var openid = 'admin'
var bookid = '001'
var pageName = 'sell'

//新用户登录，将openID插入数据库 
router.get('/login', function(req, res) {
        var code = req.query.code
        var url = 'https://api.weixin.qq.com/sns/jscode2session?appid=wxade4360d973f713e&secret=e24c871a1f999369db788cdcf9f288f9&js_code=' + code + '&grant_type=authorization_code'
        request(url, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var data = JSON.parse(body);
                var sql = `select count(*) from (userinfo) where openid='${data.openid}'`
                    //查
                mysql.query(sql, result => {
                    // console.log(result[0]['count(*)'])
                    //如果数据库中没有这个openID，就插入这个id
                    if (result[0]['count(*)'] == 0) {
                        var addSql = `INSERT INTO userinfo(openid) VALUES('${data.openid}')`
                        mysql.query(addSql, result => {
                            res.send(data)
                        })
                    } else {
                        res.send(data);
                    }
                })
            } else {
                res.send({ error: 404 });
            }
        });
    })
    // 得到用户状态
router.get('/getstatus', function(req, res) {
        var openid = req.query.openid
        var sql = `select status from userinfo where openid = '${openid}'`
        mysql.query(sql, result => {
            res.send(result)
        })
    })
    // 用户授权，将头像、昵称等信息保存
router.post('/authorization', function(req, res) {
    var data = req.body
    var sql = `update userinfo u set u.wxusername = '${data.nickname}',u.sex = '${data.gender}',u.photo = '${data.photo}' where u.openid ='${data.openid}'`
    mysql.query(sql, result => {
        res.send({ status: 502 })
    })

})

// 提交书籍信息，插入到数据库
router.post('/submitform', function(req, res) {
    openid = req.body.bookdetail.openid
    bookid = stringRandom(16)
    var data = req.body.bookdetail
    pageName = data.pageName
    if (data.pageName === 'sell') {
        var sql = 'INSERT INTO bookinfo(bookid,openid,classid,bookname,bookauthor,bookprice,booknum,booknumall,bookdescribe,usertel,booklevel,originalprice,imgurl,uptime,publisher) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        var addparams = [bookid, data.openid, data.bookclass, data.book_name, data.book_author, data.book_price, data.book_num, data.book_num, data.book_description, data.user_tel, data.buttonid, data.originalprice, data.imgurl, data.uptime, data.publisher]

        mysql.insert(sql, addparams, result => {
            res.send({ status: 502 })
        });
    } else if (data.pageName === 'handAuto') {
        var sql = 'INSERT INTO bookinfo(bookid,openid,classid,bookname,bookauthor,bookprice,booknum,booknumall,bookdescribe,usertel,booklevel,uptime) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
        var addparams = [bookid, data.openid, data.bookclass, data.book_name, data.book_author, data.book_price, data.book_num, data.book_num, data.book_description, data.user_tel, data.buttonid, data.uptime]

        mysql.insert(sql, addparams, result => {
            res.send({ status: 502 })
        });
    } else if (data.pageName === 'mysubmit') {
        var bookid1 = req.body.bookid
        var sql = `update bookinfo u set u.classid = '${data.bookclass}',u.bookname = '${data.book_name}',u.bookauthor = '${data.book_author}',
    u.booknum = ${data.book_num},u.booknumall = ${data.book_num}, u.bookprice = ${data.book_price},u.booklevel = ${data.buttonid},u.bookdescribe = '${data.book_description}',
    u.usertel = '${data.user_tel}' where u.bookid ='${bookid1}'`
        mysql.query(sql, result => {
            res.send({ status: 501 })
        })
    }
})

// 处理图片上传
router.post('/weixin/wx_upload.do', function(req, res) {
    //既处理表单，又处理文件上传
    var form = new formidable.IncomingForm()
        // var userPath
        // create(`upload/${openid}`
    let uploadDir = path.join(__dirname, '../upload/')
    form.uploadDir = uploadDir //本地文件夹目录路径
    form.parse(req, (err, fields, files) => {
        //设置文件上传文件夹/路径，__dirname是一个常量，为当前路径
        let oldPath = files.file.path //这里的路径是图片的本地路径
        console.log(oldPath) //图片传过来的名字
        let fileName = files.file.name.lastIndexOf("."); //取到文件名开始到最后一个点的长度
        let fileNameLength = files.file.name.length; //取到文件名长度
        let fileFormat = files.file.name.substring(fileName + 1, fileNameLength);
        let setPath = bookid + '-' + stringRandom(8) + '.' + fileFormat
        let newPath = path.join(path.dirname(oldPath), setPath)
        console.log(newPath)
            //这里我传回一个下载此图片的Url
        var downUrl = "http://127.0.0.1:3000" + "/upload/" + setPath //这里是想传回图片的链接
        var sql = 'insert into imgurl(bookid,imgURL) values(?,?)'
        var addparams = [bookid, downUrl]
        mysql.insert(sql, addparams, result => {})
        if (pageName === 'handAuto') {
            pageName === 'sell'
            var modSql = 'UPDATE bookinfo SET imgurl = ? WHERE bookid = ?';
            var modSqlParams = [downUrl, bookid];
            mysql.insert(modSql, modSqlParams, result => {

            })
        }
        fs.rename(oldPath, newPath, () => { //fs.rename重命名图片名称
            // console.log('返回请求')
            res.json({ downUrl: downUrl })
                // res.send(downUrl)
        })
    })
})

// 搜索内容返回
router.get('/index/search', function(req, res) {
        var params = req.query.content
        var sql = `SELECT * FROM bookinfo where (bookname LIKE '%${params}%') OR (publisher LIKE '%${params}%') OR (bookauthor LIKE '%${params}%')`
        var data = {}
        mysql.query(sql, result => {
            data.result1 = result
            for (var key in data.result1) {
                data.result1[key].discount = ((data.result1[key].bookprice / data.result1[key].originalprice) * 10).toFixed(2)
                data.result1[key].uptime = moment(data.result1[key].uptime).format('YYYY-MM-DD')
            }
            res.send(data)
        })
    })
    // 类别请求
router.post('/changeclass', function(req, res) {
    var classid = req.body.bookclass
    var sql = `select * from bookinfo where classid = ${classid}`
    var data = {}
    mysql.query(sql, result => {
        data.result1 = result
        for (var key in data.result1) {
            data.result1[key].discount = ((data.result1[key].bookprice / data.result1[key].originalprice) * 10).toFixed(2)
            data.result1[key].uptime = moment(data.result1[key].uptime).format('YYYY-MM-DD')
        }
        res.send(data)
    })

})

// 首页访问，回传数据
router.get('/index', function(req, res) {
    var sql1 = 'select * from bookinfo order by uptime desc'
    var sql2 = 'select * from bookclass order by classId ASC'
    var data = {}
    mysql.query(sql1, result => {
        data.result1 = result
        mysql.query(sql2, result => {
            data.result2 = result
            for (var key in data.result1) {
                data.result1[key].discount = ((data.result1[key].bookprice / data.result1[key].originalprice) * 10).toFixed(2)
                data.result1[key].uptime = moment(data.result1[key].uptime).format('YYYY-MM-DD')
            }
            res.send(data)
        })
    })
})

// 点击进入购买页面的时候，查找这本书的图片
router.get('/bookimg', function(req, res) {
    var bookid = req.query.bookid
    var sql = `SELECT imgURl FROM imgurl WHERE bookid = '${bookid}'`
    var sql1 = `select photo,wxusername from userinfo where openid = '${req.query.openid}'`
    var data = {}
    mysql.query(sql, result => {
        data.bookimg = result
        mysql.query(sql1, result1 => {
            data.saleimg = result1
            res.send(data)
        })

    })
})

// 接收评论内容，插入数据库
router.post('/index/pinglun', function(req, res) {
    var pinglunmsg = req.body
    var sql = "insert into bookcomment(openid,bookid,pinglunmsg,send_time) values (?,?,?,?)"
    var addparams = [pinglunmsg.openid, pinglunmsg.bookid, pinglunmsg.content, pinglunmsg.sendtime]
    mysql.insert(sql, addparams, result => {
        res.send({ status: 200 })
    });

})

// 收到前台请求，返回选中的那本书的所有评论内容
router.get('/findByBookId', function(req, res) {
    var bookId = req.query.bookId
    var sql = `select * from bookcomment where bookid = '${bookId}' order by send_time desc`
    var arr = []
    var data = {}
    mysql.query(sql, result => {
        for (var key in result) {
            result[key].send_time = moment(result[key].send_time).format('YYYY-MM-DD')
        }
        data.result1 = result
        var asyncFunc = function(sql) {
            return new Promise(function(resolve) {
                mysql.query(sql, result1 => {
                    resolve(result1)
                })
            })
        }
        const asyncDeal = async function() {
            for (var i = 0; i < result.length; i++) {
                var sql1 = `select wxusername,photo,openid from userinfo where openid ='${result[i].openid}'`
                let res = await asyncFunc(sql1)
                arr.push(res)
            }
            data.result2 = arr
            res.send(data)
        }
        asyncDeal()
    })

})

// 把选中的书籍加入购物车（包括数量，时间，openid，bookID）
router.post('/addCar', function(req, res) {
    var addCarInfo = req.body
    var sql = "insert into shoppingcar(openid,order_bookid,order_num,order_time) values (?,?,?,?)"
    var addparams = [addCarInfo.openid, addCarInfo.orderBookId, addCarInfo.ordernum, addCarInfo.orderTime]
    mysql.insert(sql, addparams, result => {
        res.send({ status: 200 })
    })
})

// 购买书籍
router.post('/buybook', function(req, res) {
    var buyBookInfo = req.body
    var orderNumber = stringRandom(16)
    var sql = "insert into shoppinglist(openid,publish_openid,bookid,buyBookNum,spendPrice,orderNumber,adress,buyTime,telephone,status,postname) values (?,?,?,?,?,?,?,?,?,?,?)"
    var sql1 = "insert into shoppinglist1(openid,publish_openid,bookid,buyBookNum,spendPrice,orderNumber,adress,buyTime,telephone,status,postname) values (?,?,?,?,?,?,?,?,?,?,?)"
    var upsql = `update bookinfo set booknum = booknum - ${buyBookInfo.buyBookNum},newsflag = newsflag+1 where bookid = '${buyBookInfo.bookid}'`
    var addparams = [buyBookInfo.openid, buyBookInfo.publish_openid, buyBookInfo.bookid, buyBookInfo.buyBookNum, buyBookInfo.spendPrice, orderNumber, buyBookInfo.adress, buyBookInfo.buyTime, buyBookInfo.telephone, 1, buyBookInfo.postname]
    mysql.query(upsql, result => {
        mysql.insert(sql, addparams, result => {
            mysql.insert(sql1, addparams, result1 => {
                res.send({ status: 200 })
            })
        })
    })
})

// 在购物车里面全部购买
router.post('/buyallbook', function(req, res) {
    var list = req.body.list
    var asyncFunc = function(sql) {
        return new Promise(function(resolve) {
            mysql.query(sql, result1 => {
                resolve(result1)
            })
        })
    }
    const asyncDeal = async function() {
        for (var i = 0; i < list.length; i++) {
            var sql = `insert into shoppinglist(openid,publish_openid,bookid,buyBookNum,spendPrice,orderNumber,adress,telephone,status,postname,buyTime)
         values ('${list[i].openid}','${list[i].public_openid}','${list[i].order_bookid}',${list[i].order_num},${list[i].bookprice},
          '${stringRandom(16)}','${list[i].shouJianInfo.adress}','${list[i].shouJianInfo.tel}',1,'${list[i].shouJianInfo.shouName}',
          '${list[i].buytime}')`
            var sql3 = `insert into shoppinglist1(openid,publish_openid,bookid,buyBookNum,spendPrice,orderNumber,adress,telephone,status,postname,buyTime)
          values ('${list[i].openid}','${list[i].public_openid}','${list[i].order_bookid}',${list[i].order_num},${list[i].bookprice},
           '${stringRandom(16)}','${list[i].shouJianInfo.adress}','${list[i].shouJianInfo.tel}',1,'${list[i].shouJianInfo.shouName}',
           '${list[i].buytime}')`
            var sql1 = `delete from shoppingcar where order_bookid = '${list[i].order_bookid}'`
            var sql2 = `update bookinfo set booknum = booknum - ${list[i].order_num},newsflag = newsflag+1 where bookid = '${list[i].order_bookid}'`
            await asyncFunc(sql)
            await asyncFunc(sql1)
            await asyncFunc(sql2)
            await asyncFunc(sql3)
        }
    }
    asyncDeal()
    res.send({ status: 502 })
})

// 查看购买记录
router.post('/buyhistory', function(req, res) {
        var openid = req.body.openid
        var sql = `select * from shoppinglist where openid = '${openid}' order by buyTime desc`
        mysql.query(sql, result => {
            for (var key in result) {
                result[key].buyTime = moment(result[key].buyTime).format('YYYY-MM-DD')
            }
            res.send(result)
        })
    })
    // 购买记录里面的图片和书名
router.post('/findbookbybookid', function(req, res) {
    var bookid = req.body.bookid
    var sql = `select bookname,imgurl,usertel from bookinfo where bookid = '${bookid}'`
    mysql.query(sql, result => {
        res.send(result)
    })
})

// 删除购买记录
router.get('/delbuyhistory', function(req, res) {
    var bookNumber = req.query.bookNumber
    var sql = `delete from shoppinglist where orderNumber = '${bookNumber}'`
    mysql.query(sql, result => {
        res.send({ status: 200 })
    })
})

// 查看我发布的书籍内容

router.get('/mysubmit', function(req, res) {
    var openid = req.query.openid
    var sql = `select * from bookinfo where openid = '${openid}' order by uptime desc`
    mysql.query(sql, result => {
        for (var key in result) {
            result[key].uptime = moment(result[key].uptime).format('YYYY-MM-DD')
        }
        res.send(result)
    })
})

// 删除发布的书籍内容
router.get('/deletesubmitbook', function(req, res) {
    var bookid = req.query.bookid
    var sql = `delete from bookinfo where bookid = '${bookid}'`
    mysql.query(sql, result => {
        res.send({ status: 200 })
    })
})

// 点击发货提醒 status :1 为还未发货，status ：0 已经发货， status：2 不发货
router.get('/remindfahuo', function(req, res) {
        var openid = req.query.openid
        var arr = []
        var arr2 = []
        var data = {}
        var sql = 'select * from shoppinglist where status = 1 order by buyTime desc'
        mysql.query(sql, result => {
            var asyncFunc = function(sql) {
                return new Promise(function(resolve) {
                    mysql.query(sql, result1 => {
                        resolve(result1)
                    })
                })
            }
            const asyncDeal = async function() {
                for (var i = 0; i < result.length; i++) {
                    if (result[i].publish_openid === openid) {
                        var sql1 = `select * from bookinfo where bookid ='${result[i].bookid}'`
                        let res = await asyncFunc(sql1)
                        arr.push(res)
                        arr2.push(result[i])
                    }
                }
                for (var key in arr2) {
                    arr2[key].buyTime = moment(arr2[key].buyTime).format('YYYY-MM-DD')
                }
                data.result1 = arr
                data.result2 = arr2
                res.send(data)
            }
            asyncDeal()
        })
    })
    // 点击查看发货详情
router.get('/deliveryDetails', function(req, res) {
    var openid = req.query.openid
    var sql = 'select * from shoppinglist where status in (0,2) order by buyTime desc'
    var arr = []
    var arr2 = []
    var data = {}
    mysql.query(sql, result => {
        var asyncFunc = function(sql) {
            return new Promise(function(resolve) {
                mysql.query(sql, result1 => {
                    resolve(result1)
                })
            })
        }
        const asyncDeal = async function() {
            for (var i = 0; i < result.length; i++) {
                if (result[i].publish_openid === openid) {
                    var sql1 = `select * from bookinfo where bookid ='${result[i].bookid}'`
                    let res = await asyncFunc(sql1)
                    arr.push(res)
                    arr2.push(result[i])
                }
            }
            for (var key in arr2) {
                arr2[key].buyTime = moment(arr2[key].buyTime).format('YYYY-MM-DD')
            }
            data.result1 = arr
            data.result2 = arr2
            res.send(data)
        }
        asyncDeal()
    })
})

// 卖家取消发货
router.post('/cancelfahuo', function(req, res) {
    var cancelData = req.body
    var sql = `update shoppinglist set status = 2 where orderNumber = '${cancelData.orderNumber}'`
    var sql2 = `update shoppinglist1 set status = 2 where orderNumber = '${cancelData.orderNumber}'`
    var sql1 = `update bookinfo set booknum = booknum + ${cancelData.buyBookNum},newsflag = newsflag - 1 where bookid = '${cancelData.bookid}'`
    mysql.query(sql, result => {
        mysql.query(sql2, result2 => {
            mysql.query(sql1, result1 => {
                res.send({ status: 502 })
            })
        })
    })
})

// 卖家确认发货
router.post('/confirmfahuo', function(req, res) {
    var confirmData = req.body
    var sql = `update shoppinglist set status = 0 where orderNumber = '${confirmData.orderNumber}'`
    var sql2 = `update shoppinglist1 set status = 0 where orderNumber = '${confirmData.orderNumber}'`
    var sql1 = `update bookinfo set newsflag = newsflag - 1 where bookid = '${confirmData.bookid}'`
    mysql.query(sql, result => {
        mysql.query(sql1, result1 => {
            mysql.query(sql2, result2 => {
                res.send({ status: 502 })
            })
        })
    })
})

// 用户点击查看购物车，回传数据
router.get('/myshoppingcar', function(req, res) {
    var openid = req.query.openid
    var arr = []
    var arr2 = []
    var data = {}
    var sql = `select * from shoppingcar where openid = '${openid}' order by order_time desc`
    mysql.query(sql, result => {
        var asyncFunc = function(sql) {
            return new Promise(function(resolve) {
                mysql.query(sql, result1 => {
                    resolve(result1)
                })
            })
        }
        const asyncDeal = async function() {
            for (var i = 0; i < result.length; i++) {
                var sql1 = `select * from bookinfo where bookid ='${result[i].order_bookid}'`
                let res = await asyncFunc(sql1)
                arr.push(res)
                arr2.push(result[i])
            }
            for (var key in arr2) {
                arr2[key].order_time = moment(arr2[key].order_time).format('YYYY-MM-DD')
            }
            data.result1 = arr
            data.result2 = arr2
            res.send(data)
        }
        asyncDeal()
    })
})

// 从购物车移除书籍
router.get('/removebook', function(req, res) {
    var id = req.query.id
    var sql = `delete from shoppingcar where id = ${id}`
    mysql.query(sql, result => {
        res.send({ status: 502 })
    })
})
module.exports = router